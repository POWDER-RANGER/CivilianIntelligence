package org.civintelligence.mobile;

import org.junit.Test;
import static org.junit.Assert.*;

public class ExternalUrlPolicyTest {
    @Test public void permitsNormalSecureLinks() {
        assertTrue(ExternalUrlPolicy.isSafeExternalHttps("https://example.org/viewer?layer=1#map"));
        assertTrue(ExternalUrlPolicy.isSafeExternalHttps("HTTPS://example.org/path"));
        assertTrue(ExternalUrlPolicy.isSafeExternalHttps("https://sub.example.org:443/"));
    }

    @Test public void blocksDangerousOrMalformedSchemes() {
        for (String url : new String[] {
            "http://example.org", "javascript:alert(1)", "intent://example.org/#Intent;end",
            "file:///etc/passwd", "data:text/html,test", "https://", "https://user:pass@example.org",
            "https://example.org\\@evil.org", " https://example.org", "https://example.org\n",
            "https://example.org:0/", "https://example.org:99999/", "https://example.org./",
            "https://example.org:bad/", "https://exa mple.org"
        }) {
            assertFalse("Should reject: " + url, ExternalUrlPolicy.isSafeExternalHttps(url));
        }
        assertFalse(ExternalUrlPolicy.isSafeExternalHttps(null));
        assertFalse(ExternalUrlPolicy.isSafeExternalHttps(""));
    }
}
