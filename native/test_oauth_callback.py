import unittest
from oauth_callback import validate_callback, CallbackError


class OAuthCallbackTests(unittest.TestCase):
    redirect = "org.civintelligence.mobile://oauth/callback"
    state = "a-cryptographically-random-state-value"

    def check(self, query, redirect=None):
        return validate_callback((redirect or self.redirect) + "?" + query, self.redirect, self.state)

    def test_valid(self):
        self.assertEqual(self.check("code=abc123&state=" + self.state), "abc123")

    def test_rejects_state_mismatch(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&state=attacker")

    def test_rejects_duplicate_state(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&state=" + self.state + "&state=" + self.state)

    def test_rejects_duplicate_code(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&code=def&state=" + self.state)

    def test_rejects_wrong_origin(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&state=" + self.state, "org.civintelligence.evil://oauth/callback")

    def test_rejects_wrong_path(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&state=" + self.state, "org.civintelligence.mobile://oauth/other")

    def test_rejects_fragment(self):
        with self.assertRaises(CallbackError):
            validate_callback(self.redirect + "?code=abc&state=" + self.state + "#token", self.redirect, self.state)

    def test_rejects_provider_error(self):
        with self.assertRaises(CallbackError):
            self.check("error=access_denied&state=" + self.state)

    def test_rejects_empty_code(self):
        with self.assertRaises(CallbackError):
            self.check("code=&state=" + self.state)

    def test_rejects_unexpected_parameters(self):
        with self.assertRaises(CallbackError):
            self.check("code=abc&state=" + self.state + "&access_token=bad")


if __name__ == "__main__":
    unittest.main()
