package org.civintelligence.mobile;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Keep the hosted CIVWATCH application inside its WebView, but open
 * user-initiated target=_blank HTTPS links in the device's browser.
 *
 * This is necessary for the independently hosted global viewer: its
 * security headers intentionally prohibit embedding in an iframe.
 * Never grant bridge/IPC capabilities to the external browser.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() == null) return;

        WebView webView = getBridge().getWebView();
        webView.getSettings().setSupportMultipleWindows(true);
        webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public boolean onCreateWindow(WebView source, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                if (!isUserGesture || isDialog) return false;

                AtomicBoolean dispatched = new AtomicBoolean(false);
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    private void openExternally(String url) {
                        if (url == null) return;
                        // Strict JVM-tested URL validation before crossing into the system browser.
                        if (!ExternalUrlPolicy.isSafeExternalHttps(url)) return;
                        if (!dispatched.compareAndSet(false, true)) return;
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                            intent.addCategory(Intent.CATEGORY_BROWSABLE);
                            startActivity(intent);
                        } catch (ActivityNotFoundException ignored) {
                            // Keep the current CIVWATCH session intact.
                        }
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request.isForMainFrame()) openExternally(request.getUrl().toString());
                        return true;
                    }

                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        openExternally(url);
                    }
                });

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
        });
    }
}
