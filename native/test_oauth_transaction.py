import unittest
from urllib.parse import urlsplit, parse_qs
from hashlib import sha256
from base64 import urlsafe_b64encode

from oauth_transaction import OAuthTransactions
from oauth_callback import CallbackError


class TransactionTests(unittest.TestCase):
    def setUp(self):
        self.now = [100.0]
        self.store = OAuthTransactions(clock=lambda: self.now[0])
        self.url, self.state = self.store.begin(
            "https://auth.example.com/authorize", "native-public-client",
            "org.civintelligence:/oauth/callback", "openid profile")
        self.params = parse_qs(urlsplit(self.url).query)

    def callback(self, state=None):
        return "org.civintelligence:/oauth/callback?code=abc&state=" + (state or self.state)

    def test_pkce_s256_and_required_fields(self):
        p = self.params
        self.assertEqual(p["code_challenge_method"], ["S256"])
        self.assertEqual(p["response_type"], ["code"])
        code, verifier = self.store.consume(self.callback(), self.state)
        self.assertEqual(code, "abc")
        self.assertEqual(p["code_challenge"][0],
                         urlsafe_b64encode(sha256(verifier.encode()).digest()).rstrip(b"=").decode())

    def test_single_use(self):
        self.store.consume(self.callback(), self.state)
        with self.assertRaises(CallbackError):
            self.store.consume(self.callback(), self.state)

    def test_mismatch_consumes_transaction(self):
        with self.assertRaises(CallbackError):
            self.store.consume(self.callback("wrong"), self.state)
        with self.assertRaises(CallbackError):
            self.store.consume(self.callback(), self.state)

    def test_expiry(self):
        self.now[0] += 301
        with self.assertRaises(CallbackError):
            self.store.consume(self.callback(), self.state)

    def test_reject_unsafe_endpoint(self):
        for endpoint in ("http://auth.example.com/a", "https://user@auth.example.com/a",
                         "https://auth.example.com/a?x=1", "https://auth.example.com/a#fragment"):
            with self.assertRaises(ValueError):
                self.store.begin(endpoint, "id", "app:/callback", "openid")

    def test_no_transaction_on_bad_endpoint(self):
        with self.assertRaises(ValueError):
            self.store.begin("https://example.com/a?injected=1", "id", "app:/callback", "openid")


if __name__ == "__main__":
    unittest.main()
