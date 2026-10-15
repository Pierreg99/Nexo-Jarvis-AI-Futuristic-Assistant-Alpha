package ai.nexo.jarvis;

import android.app.Activity;
import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.GeolocationPermissions;
import android.annotation.SuppressLint;
import android.window.OnBackInvokedDispatcher;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.util.Collections;

/** A bundled, local-first client. No JavaScript-to-native command bridge is exposed. */
public final class MainActivity extends Activity {
    private static final String LOCAL_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + LOCAL_HOST + "/";
    private WebView webView;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;
    private static final int LOCATION_PERMISSION = 100;

    // The bundled React client requires JS; external pages open outside this WebView.
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(3, 7, 10));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars()
                        | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(3, 7, 10));
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!isLocal(Uri.parse(origin))) { callback.invoke(origin, false, false); return; }
                if (checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    if (locationCallback != null) locationCallback.invoke(locationOrigin, false, false);
                    locationCallback = callback;
                    locationOrigin = origin;
                    requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION);
                }
            }
        });

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .setDomain(LOCAL_HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isLocal(uri)) {
                    Uri assetUri = "/".equals(uri.getPath())
                            ? uri.buildUpon().path("/index.html").build() : uri;
                    WebResourceResponse response = assets.shouldInterceptRequest(assetUri);
                    // Missing local API routes must fail locally, never request a remote server.
                    return response != null && response.getData() != null ? response : new WebResourceResponse(
                            "text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(),
                            new ByteArrayInputStream(new byte[0]));
                }
                return null;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (isLocal(uri)) return false;
                if (request.isForMainFrame()
                        && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (ActivityNotFoundException ignored) {
                        Toast.makeText(MainActivity.this, R.string.no_browser, Toast.LENGTH_SHORT).show();
                    }
                }
                return true;
            }
        });
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(START_URL);
        }
    }

    private static boolean isLocal(Uri uri) {
        return "https".equals(uri.getScheme()) && LOCAL_HOST.equals(uri.getHost());
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBack();
    }

    private void handleBack() {
        // Dialogs in the client already support Escape; close them before leaving the app.
        webView.evaluateJavascript("Boolean(document.querySelector('[role=dialog]'))", hasDialog -> {
            if ("true".equals(hasDialog)) {
                webView.evaluateJavascript("document.dispatchEvent(new KeyboardEvent('keydown',"
                        + "{key:'Escape',code:'Escape',bubbles:true}))", null);
            } else if (webView.canGoBack()) {
                webView.goBack();
            } else {
                finish();
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grants) {
        super.onRequestPermissionsResult(requestCode, permissions, grants);
        if (requestCode == LOCATION_PERMISSION && locationCallback != null) {
            locationCallback.invoke(locationOrigin, grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED, false);
            locationCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (locationCallback != null) { locationCallback.invoke(locationOrigin, false, false); locationCallback = null; }
        ((FrameLayout) webView.getParent()).removeView(webView);
        webView.destroy();
        super.onDestroy();
    }
}
