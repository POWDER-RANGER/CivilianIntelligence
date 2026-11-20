"""Single-use, short-lived OAuth PKCE transaction lifecycle (reference logic).

The platform integration must persist secrets in OS-protected storage and open
the authorization URL in the external system browser, never in a WebView.
"""
from dataclasses import dataclass
from hashlib import sha256
from base64 import urlsafe_b64encode
from secrets import token_urlsafe
from time import monotonic
from threading import Lock
from urllib.parse import urlencode, urlsplit, parse_qsl, urlunsplit

from oauth_callback import validate_callback, CallbackError


def _b64(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


@dataclass(frozen=True)
class Pending:
    state: str
    verifier: str
    redirect_uri: str
    deadline: float


class OAuthTransactions:
    """In-memory reference store; not durable or suitable for cross-process callbacks."""

    def __init__(self, ttl_seconds: int = 300, clock=monotonic,
                 max_pending: int = 32):
        if not 1 <= ttl_seconds <= 900:
            raise ValueError("invalid OAuth TTL")
        if not 1 <= max_pending <= 1024:
            raise ValueError("invalid pending OAuth transaction limit")
        self._max_pending = max_pending
        self._ttl = ttl_seconds
        self._clock = clock
        self._lock = Lock()
        self._pending = {}

    def begin(self, authorization_endpoint: str, client_id: str,
              redirect_uri: str, scope: str) -> tuple[str, str]:
        endpoint = urlsplit(authorization_endpoint)
        if (endpoint.scheme != "https" or not endpoint.hostname or
                endpoint.username is not None or endpoint.password is not None or
                endpoint.query or endpoint.fragment):
            raise ValueError("authorization endpoint must be a clean HTTPS URL")
        if not client_id or not redirect_uri:
            raise ValueError("client ID and redirect URI required")
        # Native redirects must never send authorization codes to arbitrary HTTP hosts
        # or executable/non-redirect URI schemes.
        try:
            redirect = urlsplit(redirect_uri)
        except ValueError as exc:
            raise ValueError("invalid native redirect URI") from exc
        if (not redirect.scheme or redirect.query or redirect.fragment or
                redirect.username is not None or redirect.password is not None or
                any(ord(c) < 33 or ord(c) == 127 for c in redirect_uri) or
                redirect.scheme in ("javascript", "data", "file")):
            raise ValueError("unsafe native redirect URI")
        if redirect.scheme == "http" and redirect.hostname not in ("127.0.0.1", "[::1]", "::1", "localhost"):
            raise ValueError("non-loopback HTTP redirect URI")
        if redirect.scheme in ("http", "https") and (not redirect.hostname or not redirect.netloc):
            raise ValueError("invalid web redirect URI")
        state = token_urlsafe(32)
        verifier = token_urlsafe(64)
        challenge = _b64(sha256(verifier.encode("ascii")).digest())
        with self._lock:
            now = self._clock()
            self._pending = {k: v for k, v in self._pending.items()
                             if v.deadline > now}
            if len(self._pending) >= self._max_pending:
                raise ValueError("too many pending OAuth transactions")
            self._pending[state] = Pending(state, verifier, redirect_uri,
                                           now + self._ttl)
        query = urlencode({"response_type": "code", "client_id": client_id,
                           "redirect_uri": redirect_uri, "scope": scope,
                           "state": state, "code_challenge": challenge,
                           "code_challenge_method": "S256"})
        return urlunsplit((endpoint.scheme, endpoint.netloc, endpoint.path, query, "")), state

    def consume(self, callback_url: str, state: str) -> tuple[str, str]:
        # Atomically invalidate before any parsing or network exchange, including errors.
        with self._lock:
            pending = self._pending.pop(state, None)
        if pending is None or pending.deadline <= self._clock():
            raise CallbackError("unknown, consumed or expired OAuth transaction")
        code = validate_callback(callback_url, pending.redirect_uri, pending.state)
        return code, pending.verifier
