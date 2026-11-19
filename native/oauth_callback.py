"""Fail-closed validation for native OAuth redirect parameters.

The native runtime must keep the expected state and PKCE verifier in a
short-lived, single-use transaction store; never put them in a WebView URL.
"""
from urllib.parse import parse_qs, urlsplit
import hmac
import re


_BAD_PERCENT_ESCAPE = re.compile(r"%(?![0-9A-Fa-f]{2})")
_CONTROL_CHARACTER = re.compile(r"[\x00-\x1f\x7f]")


class CallbackError(ValueError):
    pass


def validate_callback(callback_url: str, redirect_uri: str, expected_state: str) -> str:
    """Return an authorization code only for an exact, valid redirect + state.

    This validates the inbound message, not the token exchange. The caller must
    atomically consume the stored transaction before exchanging code with PKCE.
    """
    # urllib's URL and query parsers tolerate malformed percent escapes and
    # may normalize control characters. Reject these before parsing.
    if any(_CONTROL_CHARACTER.search(url) or _BAD_PERCENT_ESCAPE.search(url)
           for url in (callback_url, redirect_uri)):
        raise CallbackError("malformed redirect encoding or control character")
    try:
        callback = urlsplit(callback_url)
        registered = urlsplit(redirect_uri)
    except ValueError as exc:
        raise CallbackError("invalid redirect URL") from exc
    if not registered.scheme or (registered.scheme in ("http", "https") and not registered.netloc):
        raise CallbackError("invalid registered redirect")
    if registered.username is not None or registered.password is not None:
        raise CallbackError("registered redirect contains credentials")
    if registered.scheme in ("http", "https") and not registered.hostname:
        raise CallbackError("registered redirect missing hostname")
    if (callback.scheme, callback.netloc, callback.path) != (registered.scheme, registered.netloc, registered.path):
        raise CallbackError("redirect mismatch")
    if callback.fragment or callback.username or callback.password or registered.query or registered.fragment:
        raise CallbackError("unexpected redirect components")
    try:
        params = parse_qs(callback.query, strict_parsing=True, keep_blank_values=True, max_num_fields=8)
    except ValueError as exc:
        raise CallbackError("invalid callback parameters") from exc
    if any(len(v) != 1 for v in params.values()) or set(params) - {"code", "state", "error", "error_description"}:
        raise CallbackError("ambiguous callback parameters")
    state = params.get("state", [""])[0]
    if not expected_state or not hmac.compare_digest(state, expected_state):
        raise CallbackError("state mismatch")
    if "error" in params:
        raise CallbackError("authorization rejected")
    code = params.get("code", [""])[0]
    if not code or len(code) > 4096:
        raise CallbackError("missing or invalid authorization code")
    return code
