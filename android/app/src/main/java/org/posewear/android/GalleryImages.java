package org.posewear.android;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;

/** Per-device reference cache for the fixed, public CharaDB image families. */
final class GalleryImages {
    private static final String SITE = "https://posewear.pages.dev";
    private static final String UPSTREAM = "https://charadb-2fi.pages.dev";
    // The site's service worker leaves /api/ alone; image data is cached once by Android.
    private static final String IMAGE_ROUTE = "/api/__pw_gallery_image";
    private static final Pattern INDEX = Pattern.compile("/assets/(?:anime|hair)\\.[a-f0-9]{10,64}\\.json");
    private static final String POSE_ID = "P[0-9]{3}(?:-s)?";
    private static final String IMAGE_ID = "(?:[OH][0-9]{1,6}(?:-[a-z]+)?|" + POSE_ID + ")";
    private static final String IMAGE_PATH = "/(?:thumb/" + IMAGE_ID + "\\.webp|img/" + IMAGE_ID + "\\.jpg|line/" + POSE_ID + "\\.png)";
    private static final Pattern IMAGE = Pattern.compile(IMAGE_PATH);
    private static final Pattern SOURCE = Pattern.compile("\"" + Pattern.quote(UPSTREAM) + "(" + IMAGE_PATH + ")\"");
    private static final int INDEX_LIMIT = 8 * 1024 * 1024;
    private static final int FILE_LIMIT = 8 * 1024 * 1024;
    private static final long DISK_LIMIT = 64L * 1024 * 1024;
    private final File directory;
    private final Object[] locks = new Object[48];
    private String cachedIndex;
    private byte[] indexBytes;

    GalleryImages(Context context) {
        directory = new File(context.getCacheDir(), "gallery-images-v1");
        Arrays.setAll(locks, i -> new Object());
    }

    WebResourceResponse intercept(WebResourceRequest request) {
        if (request.isForMainFrame() || !"GET".equals(request.getMethod())) return null;
        Uri uri = request.getUrl();
        if (!"https".equals(uri.getScheme()) || !"posewear.pages.dev".equalsIgnoreCase(uri.getHost())
                || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) return null;
        String path = uri.getEncodedPath();
        if (path == null) return null;
        if (path.startsWith(IMAGE_ROUTE + "/")) {
            String relative = path.substring(IMAGE_ROUTE.length());
            if (!IMAGE.matcher(relative).matches()) return imageError(404, "Not Found");
            try { return image(relative); }
            catch (IOException ex) {
                android.util.Log.d("PoseWear", "Gallery image unavailable: " + relative + ": " + ex.getMessage());
                return imageError(503, "Service Unavailable");
            }
        }
        if (INDEX.matcher(path).matches()) {
            try {
                return new WebResourceResponse("application/json", "UTF-8", 200, "OK",
                        Collections.singletonMap("Cache-Control", "no-cache"), new ByteArrayInputStream(index(path)));
            } catch (IOException ex) {
                android.util.Log.d("PoseWear", "Gallery catalog unavailable: " + path + ": " + ex.getMessage());
                return null;
            }
        }
        return null;
    }

    private synchronized byte[] index(String path) throws IOException {
        if (path.equals(cachedIndex)) return indexBytes;
        HttpsURLConnection connection = connect(SITE + path, "application/json");
        try (ByteArrayOutputStream json = new ByteArrayOutputStream()) {
            expect(connection, "application/json", INDEX_LIMIT);
            try (InputStream source = connection.getInputStream()) { copy(source, json, INDEX_LIMIT); }
            String text = new String(json.toByteArray(), StandardCharsets.UTF_8);
            if (!text.trim().startsWith("[")) throw new IOException("Invalid catalog");
            byte[] patched = SOURCE.matcher(text).replaceAll("\"" + SITE + IMAGE_ROUTE + "$1\"")
                    .getBytes(StandardCharsets.UTF_8);
            cachedIndex = path;
            indexBytes = patched;
            android.util.Log.i("PoseWear", "Native routes ready for " + path);
            return patched;
        } finally {
            connection.disconnect();
        }
    }

    private WebResourceResponse image(String path) throws IOException {
        String mime = path.endsWith(".webp") ? "image/webp" : path.endsWith(".png") ? "image/png" : "image/jpeg";
        File cached = new File(directory, path.substring(1).replace('/', '_'));
        synchronized (locks[(path.hashCode() & Integer.MAX_VALUE) % locks.length]) {
            if (!cached.isFile()) download(path, mime, cached);
            FileInputStream stream = new FileInputStream(cached);
            cached.setLastModified(System.currentTimeMillis());
            return new WebResourceResponse(mime, null, 200, "OK",
                    Collections.singletonMap("Cache-Control", "no-store"), stream);
        }
    }

    private void download(String path, String mime, File cached) throws IOException {
        if (!directory.isDirectory() && !directory.mkdirs() && !directory.isDirectory()) throw new IOException("Cache directory unavailable");
        File temp = File.createTempFile("pending-", ".part", directory);
        HttpsURLConnection connection = null;
        try {
            connection = connect(UPSTREAM + path, mime);
            expect(connection, mime, FILE_LIMIT);
            try (InputStream source = connection.getInputStream(); OutputStream target = new FileOutputStream(temp)) {
                byte[] prefix = new byte[12];
                int remaining = prefix.length;
                while (remaining > 0) {
                    int n = source.read(prefix, prefix.length - remaining, remaining);
                    if (n == -1) throw new IOException("Truncated image");
                    remaining -= n;
                }
                boolean valid;
                switch (mime) {
                    case "image/webp":
                        valid = prefix[0] == 'R' && prefix[1] == 'I' && prefix[2] == 'F' && prefix[3] == 'F'
                                && prefix[8] == 'W' && prefix[9] == 'E' && prefix[10] == 'B' && prefix[11] == 'P';
                        break;
                    case "image/png":
                        valid = (prefix[0] & 255) == 137 && prefix[1] == 'P' && prefix[2] == 'N' && prefix[3] == 'G'
                                && prefix[4] == 13 && prefix[5] == 10 && prefix[6] == 26 && prefix[7] == 10;
                        break;
                    default:
                        valid = (prefix[0] & 255) == 255 && (prefix[1] & 255) == 216 && (prefix[2] & 255) == 255;
                }
                if (!valid) throw new IOException("Invalid image format");
                target.write(prefix);
                copy(source, target, FILE_LIMIT - prefix.length);
            }
            if (!temp.renameTo(cached)) throw new IOException("Cache write failed");
            prune(cached);
        } finally {
            if (connection != null) connection.disconnect();
            temp.delete();
        }
    }

    private synchronized void prune(File keep) {
        File[] files = directory.listFiles(file -> file.getName().endsWith(".webp") || file.getName().endsWith(".jpg") || file.getName().endsWith(".png"));
        if (files == null) return;
        long total = 0;
        for (File file : files) total += file.length();
        if (total <= DISK_LIMIT) return;
        Arrays.sort(files, Comparator.comparingLong(File::lastModified));
        for (File file : files) {
            if (total <= DISK_LIMIT) break;
            if (file.equals(keep)) continue;
            long bytes = file.length();
            if (file.delete()) total -= bytes;
        }
    }

    private static HttpsURLConnection connect(String url, String mime) throws IOException {
        HttpsURLConnection connection = (HttpsURLConnection) new URL(url).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(6000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty("Accept", mime);
        return connection;
    }

    private static void expect(HttpsURLConnection connection, String mime, int limit) throws IOException {
        int status = connection.getResponseCode();
        String type = connection.getContentType();
        if (status != 200 || type == null || !mime.equalsIgnoreCase(type.split(";", 2)[0].trim())
                || connection.getContentLengthLong() > limit) throw new IOException("Unexpected response: " + status + " " + type);
    }

    private static void copy(InputStream source, OutputStream target, int limit) throws IOException {
        byte[] buffer = new byte[16384];
        int size = 0;
        int n;
        while ((n = source.read(buffer)) != -1) {
            size += n;
            if (size > limit) throw new IOException("Response exceeds limit");
            target.write(buffer, 0, n);
        }
    }

    private static WebResourceResponse imageError(int code, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", code, reason,
                Collections.singletonMap("Cache-Control", "no-store"), new ByteArrayInputStream(new byte[0]));
    }
}
