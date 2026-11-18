package org.civintelligence.mobile;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/** Validates a user-initiated external URL without requiring Android framework classes. */
public final class ExternalUrlPolicy {
    private ExternalUrlPolicy() {}

    public static boolean isSafeExternalHttps(String raw) {
        if (raw == null || raw.isEmpty() || !raw.equals(raw.trim())) return false;
        for (int i = 0; i < raw.length(); i++) {
            char ch = raw.charAt(i);
            if (ch <= 0x20 || ch == 0x7f || ch == '\\') return false;
        }
        try {
            URI uri = new URI(raw);
            if (!"https".equals(uri.getScheme() == null ? null : uri.getScheme().toLowerCase(Locale.ROOT))) return false;
            if (uri.isOpaque() || uri.getRawUserInfo() != null) return false;
            String host = uri.getHost();
            if (host == null || host.isEmpty() || host.endsWith(".")) return false;
            int port = uri.getPort();
            if (port < -1 || port > 65535 || port == 0) return false;
            return true;
        } catch (URISyntaxException | IllegalArgumentException ignored) {
            return false;
        }
    }
}
