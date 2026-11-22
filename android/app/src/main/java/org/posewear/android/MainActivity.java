package org.posewear.android;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.HandlerThread;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebMessage;
import android.webkit.WebMessagePort;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.UUID;

public final class MainActivity extends Activity {
    private static final String SITE = "https://posewear.pages.dev";
    private static final int FILE_PICKER = 100;
    private static final int MAX_CHUNK = 48 * 1024;
    private static final long MAX_DOWNLOAD = 256L * 1024 * 1024;

    private WebView web;
    private FrameLayout frame;
    private AppNavigation navigation;
    private int selectedTab;
    private String galleryQuery = "";
    private String hairQuery = "";
    private String webSection;
    private String pendingWebTab;
    private int navigationRevision;
    private HairGallery hairGallery;
    private ValueCallback<Uri[]> filePicker;
    private HandlerThread downloadThread;
    private Handler downloads;
    private BlobDownload activeDownload;
    private AlertDialog loadError;
    private String downloadScript;
    private String mobileScript;
    private String galleryZhScript;
    private String animePoseScript;
    private GalleryImages galleryImages;
    private boolean webLoading;
    private boolean darkTheme, adultEnabled, toolbarReady;
    private WebMessagePort toolbarPort;
    private AlertDialog ageConfirmation;

    String readAssetText(String name) throws IOException {
        try (InputStream input = getAssets().open(name)) {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) != -1) bytes.write(buffer, 0, count);
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8).trim();
        }
    }
    private boolean leaving;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        downloadThread = new HandlerThread("PoseWear downloads");
        downloadThread.start();
        downloads = new Handler(downloadThread.getLooper());

        navigation = new AppNavigation(this, this::switchAppTab, this::openLibrary, this::onGallerySearch, this::onToolbarAction);
        frame = navigation.content;
        navigation.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                navigation.showBar(!insets.isVisible(WindowInsets.Type.ime()));
                android.graphics.Insets padding = insets.getInsets(
                        WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(padding.left, padding.top, padding.right, padding.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return WindowInsets.CONSUMED;
        });
        GalleryImages images = new GalleryImages(getApplicationContext());
        galleryImages = images;
        ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                return images.intercept(request);
            }
        });
        web = new WebView(this);
        frame.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(navigation);
        applyTheme(getPreferences(MODE_PRIVATE).getBoolean("webDarkTheme", false));
        navigation.requestApplyInsets();
        webLoading = true;
        switchAppTab(0);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebViewClient(new SiteClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!isSite(Uri.parse(currentUrl())) || params.getMode() == FileChooserParams.MODE_SAVE) {
                    callback.onReceiveValue(null);
                    return true;
                }
                finishFilePicker(null);
                filePicker = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_PICKER);
                } catch (ActivityNotFoundException ex) {
                    finishFilePicker(null);
                    toast("系统中没有可用的文件选择器");
                }
                return true;
            }
        });
        web.setDownloadListener((url, userAgent, disposition, mime, length) -> startDownload(url, userAgent, disposition, mime));
        if (state == null || web.restoreState(state) == null) web.loadUrl(SITE + "/#costume");
    }

    @SuppressWarnings("deprecation")
    private void applyTheme(boolean dark) {
        darkTheme = dark;
        int background = dark ? 0xff111111 : Color.WHITE;
        navigation.setDarkTheme(dark);
        web.setBackgroundColor(background);
        if (hairGallery != null) hairGallery.setDarkTheme(dark);
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controller.setSystemBarsAppearance(dark ? 0 : mask, mask);
            }
        } else {
            View decor = getWindow().getDecorView();
            int mask = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            decor.setSystemUiVisibility((decor.getSystemUiVisibility() & ~mask) | (dark ? 0 : mask));
        }
        // Android 15+ draws transparent bars across our insets-aware root view.
        if (Build.VERSION.SDK_INT < 35) {
            getWindow().setStatusBarColor(background);
            getWindow().setNavigationBarColor(background);
        }
    }

    private void closeToolbarBridge() {
        WebMessagePort port = toolbarPort;
        toolbarPort = null;
        toolbarReady = false;
        navigation.setToolbarStatus(false, adultEnabled);
        if (ageConfirmation != null) ageConfirmation.dismiss();
        if (port != null) try { port.close(); } catch (RuntimeException ignored) { }
    }

    private void bindToolbar() {
        closeToolbarBridge();
        if (leaving || webLoading || !isSite(Uri.parse(currentUrl()))) return;
        try {
            WebMessagePort[] ports = web.createWebMessageChannel();
            toolbarPort = ports[0];
            final String token = UUID.randomUUID().toString();
            ports[0].setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
                @Override public void onMessage(WebMessagePort port, WebMessage message) {
                    if (port != toolbarPort || webLoading || leaving || !isSite(Uri.parse(currentUrl()))) return;
                    String data = message.getData();
                    if (data == null || data.length() > 128) return;
                    try {
                        JSONObject state = new JSONObject(data);
                        Object dark = state.opt("dark"), adult = state.opt("adult");
                        if (!(dark instanceof Boolean) || !(adult instanceof Boolean)) return;
                        if (!toolbarReady) web.evaluateJavascript("window.PWMobileNav?.setNativeToolbar()", null);
                        toolbarReady = true;
                        adultEnabled = (boolean) adult;
                        if ((boolean) dark != darkTheme) {
                            applyTheme((boolean) dark);
                            getPreferences(MODE_PRIVATE).edit().putBoolean("webDarkTheme", darkTheme).apply();
                        }
                        navigation.setToolbarStatus(true, adultEnabled);
                    } catch (org.json.JSONException ignored) { }
                }
            });
            web.evaluateJavascript("window.PWMobileNav?.bindToolbar(" + JSONObject.quote(token) + ") === true", result -> {
                try {
                    if (toolbarPort == ports[0] && !webLoading && !leaving && "true".equals(result)
                            && isSite(Uri.parse(currentUrl()))) {
                        web.postWebMessage(new WebMessage(token, new WebMessagePort[]{ports[1]}), Uri.parse(SITE));
                        return;
                    }
                } catch (RuntimeException ignored) { }
                try { ports[1].close(); } catch (RuntimeException ignored) { }
                if (toolbarPort == ports[0]) closeToolbarBridge();
            });
        } catch (RuntimeException ex) {
            closeToolbarBridge();
            android.util.Log.w("PoseWear", "Native toolbar unavailable", ex);
        }
    }

    private void onToolbarAction(String action) {
        if ("github".equals(action)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://github.com/atuizz/posewear"))
                        .addCategory(Intent.CATEGORY_BROWSABLE));
            } catch (ActivityNotFoundException ex) {
                toast("未找到可打开此链接的浏览器");
            }
            return;
        }
        if (leaving || webLoading || !toolbarReady || !isSite(Uri.parse(currentUrl()))) return;
        WebMessagePort currentPort = toolbarPort;
        web.evaluateJavascript("window.PWMobileNav?.toolbarAction(" + JSONObject.quote(action) + ")", result -> {
            if (!"\"confirmAdult\"".equals(result) || toolbarPort != currentPort || leaving || webLoading
                    || (ageConfirmation != null && ageConfirmation.isShowing())) return;
            int dialogTheme = darkTheme ? android.R.style.Theme_Material_Dialog_Alert
                    : android.R.style.Theme_Material_Light_Dialog_Alert;
            ageConfirmation = new AlertDialog.Builder(this, dialogTheme)
                    .setTitle("显示成人向内容？")
                    .setMessage("包括双人互动、性感类姿势，以及内衣、性感类服装。仅适合已满 18 岁的用户。只需确认一次，之后用顶部的「18+」开关随时打开或关闭。")
                    .setNegativeButton("暂不", null)
                    .setPositiveButton("我已满 18 岁，打开", (dialog, which) -> {
                        if (toolbarPort == currentPort) onToolbarAction("confirmAdult");
                    })
                    .show();
            ageConfirmation.setOnDismissListener(dialog -> ageConfirmation = null);
        });
    }

    private void switchAppTab(int tab) {
        showWebSection(tab == 0 ? "costume" : tab == 1 ? "studio" : "fav");
    }

    private void openLibrary(String section) {
        if ("hair".equals(section)) {
            if (selectedTab != 0) showWebSection("costume");
            showHairGallery(null);
        } else {
            showWebSection(section);
        }
    }

    private void updateNavigation() {
        navigation.select(selectedTab);
        boolean hair = hairGallery != null;
        navigation.showLibrary(hair ? "hair" : webSection, selectedTab == 0);
        navigation.showSearch(hair || selectedTab != 1, hair ? "搜索发型、分类或编号"
                : "animePose".equals(webSection) ? "搜索动画姿势或编号" : selectedTab == 2 ? "搜索收藏" : "搜索当前图库");
        navigation.setSearchQuery(hair ? hairQuery : galleryQuery);
    }

    private void onGallerySearch(String query) {
        if (hairGallery != null) {
            hairQuery = query;
            hairGallery.filter(query);
            return;
        }
        galleryQuery = query;
        if (!webLoading && isSite(Uri.parse(currentUrl())) && webSection != null) {
            web.evaluateJavascript("window.PWMobileNav?.setQuery(" + JSONObject.quote(webSection) + ","
                    + JSONObject.quote(query) + ")", null);
        }
    }

    private void showWebSection(String section) {
        int tab = AppNavigation.tabForSection(section);
        if (tab < 0) return;
        navigation.dismissSearchKeyboard();
        navigationRevision++;
        if (!section.equals(webSection) || hairGallery != null) galleryQuery = "";
        webSection = section;
        pendingWebTab = section;
        closeHairGallery();
        selectedTab = tab;
        updateNavigation();
        web.setVisibility(View.VISIBLE);
        applyPendingWebTab(true);
    }

    private void cancelWebSelection() {
        if (!webLoading && isSite(Uri.parse(currentUrl()))) {
            web.evaluateJavascript("window.PWMobileNav?.cancel()", null);
        }
    }

    private void applyPendingWebTab(boolean canReload) {
        String section = pendingWebTab;
        if (section == null || webLoading || hairGallery != null) return;
        if (!isSite(Uri.parse(currentUrl()))) {
            if (canReload) web.loadUrl(SITE + "/#costume");
            return;
        }
        int revision = navigationRevision;
        String script = "window.PWMobileNav?.select(" + JSONObject.quote(section) + ","
                + JSONObject.quote(galleryQuery) + ") === true";
        web.evaluateJavascript(script, result -> {
            if (revision != navigationRevision || !section.equals(pendingWebTab) || leaving) return;
            if ("true".equals(result)) pendingWebTab = null;
            else if (canReload) web.reload();
            else if ("animePose".equals(section)) {
                showWebSection("costume");
                toast("动画姿势图库暂时不可用");
            }
        });
    }

    private void showHairGallery(String id) {
        if (leaving || hairGallery != null) return;
        try {
            navigation.dismissSearchKeyboard();
            hairQuery = "";
            hairGallery = new HairGallery(this, this::dismissHairGallery);
            hairGallery.setDarkTheme(darkTheme);
            navigationRevision++;
            cancelWebSelection();
            frame.addView(hairGallery, new FrameLayout.LayoutParams(-1, -1));
            web.setVisibility(View.INVISIBLE);
            if (loadError != null) loadError.dismiss();
            updateNavigation();
            if (id != null) hairGallery.openItem(id);
        } catch (Exception ex) {
            closeHairGallery();
            android.util.Log.w("PoseWear", "Native hair catalog unavailable", ex);
            toast("动画发型暂时不可用");
        }
    }

    private void dismissHairGallery() {
        closeHairGallery();
        if (webSection == null) return;
        pendingWebTab = webSection;
        applyPendingWebTab(true);
    }

    private void closeHairGallery() {
        if (hairGallery == null) return;
        hairGallery.dispose();
        frame.removeView(hairGallery);
        hairGallery = null;
        web.setVisibility(View.VISIBLE);
        updateNavigation();
    }

    void hairFavorite(String id, boolean toggle, java.util.function.Consumer<String> callback) {
        if (!isSite(Uri.parse(currentUrl()))) return;
        String key = JSONObject.quote("h:" + id);
        String script = "(() => { const app = window.APP; if (!app?.st?.fav || !app.toggleFav) return null; "
                + "const key = " + key + "; "
                + (toggle ? "app.toggleFav(key, true); " : "")
                + "return app.st.fav.has(key); })()";
        web.evaluateJavascript(script, result -> {
            if (hairGallery != null) callback.accept(result);
        });
    }

    private final class SiteClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return galleryImages.intercept(request);
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!request.isForMainFrame()) return false;
            if (isSite(uri)) {
                String path = uri.getEncodedPath();
                if (path != null && path.matches("/__native_hair__(/H[0-9]+)?") && isSite(Uri.parse(currentUrl()))) {
                    String id = path.equals("/__native_hair__") ? null : uri.getLastPathSegment();
                    view.post(() -> showHairGallery(id));
                    return true;
                }
                return false;
            }
            if ("https".equalsIgnoreCase(uri.getScheme()) && request.hasGesture()) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
                } catch (ActivityNotFoundException ex) {
                    toast("未找到可打开此链接的浏览器");
                }
            }
            return true;
        }

        @Override
        public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
            if (url == null || hairGallery != null || leaving || webLoading) return;
            Uri uri = Uri.parse(url);
            if (!isSite(uri)) return;
            String section = uri.getFragment();
            if (section == null || section.equals(webSection)) return;
            int tab = AppNavigation.tabForSection(section);
            if (tab < 0 || ("animePose".equals(webSection) && tab != 1)) return;
            int revision = navigationRevision;
            view.evaluateJavascript("window.PWMobileNav?.isCurrent(" + JSONObject.quote(section) + ") === true", result -> {
                if (revision != navigationRevision || leaving || webLoading || pendingWebTab != null
                        || !"true".equals(result)) return;
                if ("animePose".equals(webSection)) cancelWebSelection();
                navigation.dismissSearchKeyboard();
                galleryQuery = "";
                webSection = section;
                selectedTab = tab;
                updateNavigation();
            });
        }

        @Override
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            webLoading = true;
            navigationRevision++;
            pendingWebTab = webSection;
            closeToolbarBridge();
            stopDownload();
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            webLoading = false;
            if (!isSite(Uri.parse(url))) return;
            try {
                if (mobileScript == null) mobileScript = readAssetText("mobile.js");
                view.evaluateJavascript(mobileScript, null);
            } catch (IOException ex) {
                android.util.Log.w("PoseWear", "Mobile layout unavailable", ex);
            }
            try {
                if (galleryZhScript == null) galleryZhScript = readAssetText("gallery-zh.js");
                view.evaluateJavascript(galleryZhScript, null);
            } catch (IOException ex) {
                android.util.Log.w("PoseWear", "Gallery translations unavailable", ex);
            }
            try {
                if (animePoseScript == null) {
                    animePoseScript = "(" + readAssetText("anime-pose.js") + ")(" + readAssetText("anime-pose-catalog.json") + ")";
                }
                view.evaluateJavascript(animePoseScript, null);
            } catch (IOException ex) {
                android.util.Log.w("PoseWear", "Animation pose gallery unavailable", ex);
            }
            view.evaluateJavascript("window.PWMobileNav?.setExternalSearch()", null);
            bindToolbar();
            applyPendingWebTab(false);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) showLoadError(request.getUrl());
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse error) {
            if (request.isForMainFrame() && error.getStatusCode() >= 400) showLoadError(request.getUrl());
        }
    }

    private void showLoadError(Uri uri) {
        if (leaving || hairGallery != null || !isSite(uri) || (loadError != null && loadError.isShowing())) return;
        loadError = new AlertDialog.Builder(this)
                .setTitle("衣姿暂时打不开")
                .setMessage("请检查网络连接，再试一次。图库和试穿服务需要联网。")
                .setPositiveButton("重试", (dialog, which) -> web.loadUrl(uri.toString()))
                .setNegativeButton("关闭", null)
                .show();
    }

    private static boolean isSite(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) && "posewear.pages.dev".equalsIgnoreCase(uri.getHost())
                && uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    private String currentUrl() {
        return web.getUrl() == null ? "" : web.getUrl();
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != FILE_PICKER) return;
        Uri[] picked = WebChromeClient.FileChooserParams.parseResult(result, data);
        if (picked != null) {
            picked = Arrays.stream(picked).filter(uri -> "content".equalsIgnoreCase(uri.getScheme())).toArray(Uri[]::new);
        }
        finishFilePicker(picked == null || picked.length == 0 ? null : picked);
    }

    private void finishFilePicker(Uri[] result) {
        if (filePicker == null) return;
        ValueCallback<Uri[]> callback = filePicker;
        filePicker = null;
        callback.onReceiveValue(result);
    }

    private void startDownload(String url, String userAgent, String disposition, String mime) {
        if (!isSite(Uri.parse(currentUrl())) || url == null) return;
        Uri uri = Uri.parse(url);
        if (isSite(uri)) {
            try {
                String name = fileName(url, disposition, mime);
                DownloadManager.Request request = new DownloadManager.Request(uri)
                        .setTitle(name)
                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
                getSystemService(DownloadManager.class).enqueue(request);
                toast("已开始下载");
            } catch (RuntimeException ex) {
                toast("下载失败，请重试");
            }
        } else if (url.startsWith("blob:" + SITE + "/") || url.startsWith("data:")) {
            startBlobDownload(url, disposition, mime);
        }
    }

    private void startBlobDownload(String url, String disposition, String mime) {
        if (activeDownload != null) {
            toast("正在保存一个文件，请稍候");
            return;
        }
        try {
            if (downloadScript == null) downloadScript = readAssetText("download.js");
            String token = UUID.randomUUID().toString();
            WebMessagePort[] ports = web.createWebMessageChannel();
            BlobDownload transfer = new BlobDownload(ports[0], url, disposition, mime);
            activeDownload = transfer;
            ports[0].setWebMessageCallback(new WebMessagePort.WebMessageCallback() {
                @Override
                public void onMessage(WebMessagePort port, WebMessage message) {
                    transfer.receive(message.getData());
                }
            }, downloads);
            downloads.postDelayed(transfer.timeout, 120000);
            String script = downloadScript + "(" + JSONObject.quote(token) + "," + JSONObject.quote(url) + "," + MAX_DOWNLOAD + ")";
            web.evaluateJavascript(script, result -> {
                try {
                    if (activeDownload == transfer && "true".equals(result) && isSite(Uri.parse(currentUrl()))) {
                        web.postWebMessage(new WebMessage(token, new WebMessagePort[]{ports[1]}), Uri.parse(SITE));
                        return;
                    }
                    ports[1].close();
                } catch (RuntimeException ignored) {
                    // Navigation or teardown can race with transferring the port.
                }
                downloads.post(() -> transfer.finish(false, true));
            });
        } catch (IOException | RuntimeException ex) {
            stopDownload();
            toast("保存失败，请重试");
        }
    }

    private static String fileName(String url, String disposition, String mime) {
        String suggested = URLUtil.guessFileName(url, disposition, mime);
        String name = suggested.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_").trim();
        return name.isEmpty() || name.equals(".") || name.equals("..") ? "PoseWear-download" : name;
    }

    private final class BlobDownload {
        private final WebMessagePort port;
        private final String url;
        private final String disposition;
        private final String mime;
        private final Runnable timeout = () -> finish(false, true);
        private Uri destination;
        private OutputStream output;
        private long expected;
        private long received;
        private boolean closed;

        BlobDownload(WebMessagePort port, String url, String disposition, String mime) {
            this.port = port;
            this.url = url;
            this.disposition = disposition;
            this.mime = mime;
        }

        void receive(String message) {
            if (closed) return;
            try {
                if (message != null && message.startsWith("meta:") && destination == null) {
                    open(new JSONObject(message.substring(5)));
                } else if (message != null && message.startsWith("chunk:") && output != null) {
                    write(message.substring(6));
                } else {
                    finish("done".equals(message) && output != null && received == expected, true);
                    return;
                }
                port.postMessage(new WebMessage("ok"));
            } catch (Exception ex) {
                finish(false, true);
            }
        }

        private void open(JSONObject meta) throws Exception {
            expected = meta.getLong("size");
            if (expected <= 0 || expected > MAX_DOWNLOAD) throw new IOException("Unexpected download size");
            String type = meta.optString("type", "").split(";", 2)[0].trim();
            if (!type.startsWith("image/") && !type.equals("application/json") && !type.equals("application/zip")) {
                type = "application/octet-stream";
            }
            ContentValues fields = new ContentValues();
            fields.put(MediaStore.Downloads.DISPLAY_NAME, fileName(url, disposition, mime == null || mime.isEmpty() ? type : mime));
            fields.put(MediaStore.Downloads.MIME_TYPE, type);
            fields.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/PoseWear");
            fields.put(MediaStore.Downloads.IS_PENDING, 1);
            destination = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, fields);
            if (destination == null) throw new IOException("Download location unavailable");
            output = getContentResolver().openOutputStream(destination);
            if (output == null) throw new IOException("Download file unavailable");
        }

        private void write(String encoded) throws IOException {
            if (encoded.isEmpty() || encoded.length() > MAX_CHUNK / 3 * 4) throw new IOException("Unexpected chunk size");
            byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
            if (bytes.length > MAX_CHUNK || received + bytes.length > expected) throw new IOException("Download exceeds declared size");
            output.write(bytes);
            received += bytes.length;
        }

        void finish(boolean success, boolean notify) {
            if (closed) return;
            closed = true;
            downloads.removeCallbacks(timeout);
            try { port.close(); } catch (RuntimeException ignored) { }
            if (output != null) {
                try { output.close(); } catch (IOException ex) { success = false; }
            }
            if (destination != null && success) {
                try {
                    ContentValues fields = new ContentValues();
                    fields.put(MediaStore.Downloads.IS_PENDING, 0);
                    success = getContentResolver().update(destination, fields, null, null) == 1;
                } catch (RuntimeException ex) {
                    success = false;
                }
            }
            if (destination != null && !success) {
                try { getContentResolver().delete(destination, null, null); } catch (RuntimeException ignored) { }
            }
            final boolean saved = success;
            runOnUiThread(() -> {
                if (activeDownload == this) activeDownload = null;
                if (notify && !leaving) toast(saved ? "已保存到下载目录的 PoseWear 文件夹" : "保存失败，请重试");
            });
        }
    }

    private void stopDownload() {
        BlobDownload transfer = activeDownload;
        activeDownload = null;
        if (transfer != null) downloads.post(() -> transfer.finish(false, false));
    }

    private void toast(String text) {
        Toast.makeText(this, text, Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onBackPressed() {
        if (navigation.collapseLibraries()) return;
        if (hairGallery != null) {
            if (!hairGallery.backToList()) dismissHairGallery();
        } else if (isSite(Uri.parse(currentUrl())) && !webLoading) {
            int revision = navigationRevision;
            String script = "window.PWAnimePose?.back() === true || window.PWMobileNav?.back() === true";
            web.evaluateJavascript(script, result -> {
                if (revision == navigationRevision && !leaving && !"true".equals(result)) backToParent();
            });
        } else {
            backToParent();
        }
    }

    private void backToParent() {
        if (selectedTab != 0 || !"costume".equals(webSection)) switchAppTab(0);
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle state) {
        web.saveState(state);
        super.onSaveInstanceState(state);
    }

    @Override
    protected void onDestroy() {
        leaving = true;
        closeToolbarBridge();
        closeHairGallery();
        stopDownload();
        finishFilePicker(null);
        downloadThread.quitSafely();
        if (loadError != null) loadError.dismiss();
        ((FrameLayout) web.getParent()).removeView(web);
        web.destroy();
        super.onDestroy();
    }
}
