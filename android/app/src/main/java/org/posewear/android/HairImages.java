package org.posewear.android;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.Comparator;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import javax.net.ssl.HttpsURLConnection;

final class HairImages {
    private static final String ORIGIN = "https://charadb-2fi.pages.dev";
    private static final Pattern PATH = Pattern.compile("/(thumb/H[0-9]+(?:-[a-z]+)?\\.webp|img/H[0-9]+(?:-[a-z]+)?\\.jpg)");
    private static final long DISK_LIMIT = 48L * 1024 * 1024;
    private static final int FILE_LIMIT = 6 * 1024 * 1024;
    private final ThreadPoolExecutor thumbs = pool(3);
    private final ThreadPoolExecutor details = pool(1);
    private final Handler main = new Handler(Looper.getMainLooper());
    private final File directory;
    private final LruCache<String, Bitmap> memory = new LruCache<String, Bitmap>(12 * 1024 * 1024) {
        @Override protected int sizeOf(String key, Bitmap image) { return image.getByteCount(); }
    };

    interface Result { void show(Bitmap image); }

    HairImages(Context context) {
        directory = new File(context.getCacheDir(), "hair-images-v1");
    }

    private static ThreadPoolExecutor pool(int size) {
        return new ThreadPoolExecutor(size, size, 20, TimeUnit.SECONDS, new LinkedBlockingQueue<>());
    }

    Future<?> load(String path, boolean detail, Result result) {
        Bitmap hit = memory.get(path);
        if (hit != null) {
            result.show(hit);
            return null;
        }
        ThreadPoolExecutor executor = detail ? details : thumbs;
        executor.purge();
        return executor.submit(() -> {
            Bitmap image = null;
            try {
                image = read(path, detail);
                if (image != null) memory.put(path, image);
            } catch (IOException ignored) {
                // The corresponding card or detail view offers a retry.
            }
            Bitmap loaded = image;
            if (!Thread.currentThread().isInterrupted()) main.post(() -> result.show(loaded));
        });
    }

    private Bitmap read(String path, boolean detail) throws IOException {
        if (!PATH.matcher(path).matches()) return null;
        File cached = new File(directory, path.substring(1).replace('/', '_'));
        if (cached.isFile()) {
            Bitmap image = decode(cached, detail);
            if (image != null) {
                cached.setLastModified(System.currentTimeMillis());
                return image;
            }
            cached.delete();
        }
        if (!directory.isDirectory() && !directory.mkdirs() && !directory.isDirectory()) throw new IOException("Cache directory unavailable");
        File temp = File.createTempFile("pending-", ".part", directory);
        HttpsURLConnection connection = (HttpsURLConnection) new URL(ORIGIN + path).openConnection();
        connection.setInstanceFollowRedirects(false);
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(14000);
        connection.setRequestProperty("Accept", detail ? "image/jpeg" : "image/webp");
        try {
            String expected = detail ? "image/jpeg" : "image/webp";
            if (connection.getResponseCode() != 200 || !expected.equalsIgnoreCase(connection.getContentType())
                    || connection.getContentLengthLong() > FILE_LIMIT) throw new IOException("Unexpected image response");
            try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(temp)) {
                byte[] buffer = new byte[16384];
                int total = 0;
                int count;
                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    if (total > FILE_LIMIT || Thread.currentThread().isInterrupted()) throw new IOException("Image request stopped");
                    output.write(buffer, 0, count);
                }
            }
            Bitmap image = decode(temp, detail);
            if (image != null) commit(temp, cached);
            return image;
        } finally {
            connection.disconnect();
            temp.delete();
        }
    }

    private static Bitmap decode(File file, boolean detail) {
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(file.getPath(), options);
        int size = Math.max(options.outWidth, options.outHeight);
        if (size <= 0 || size > 10000) return null;
        int target = detail ? 2000 : 650;
        options.inSampleSize = 1;
        while (size / options.inSampleSize > target) options.inSampleSize *= 2;
        options.inJustDecodeBounds = false;
        return BitmapFactory.decodeFile(file.getPath(), options);
    }

    private synchronized void commit(File temp, File cached) {
        if (!temp.renameTo(cached)) return;
        File[] files = directory.listFiles(file -> file.getName().endsWith(".webp") || file.getName().endsWith(".jpg"));
        if (files == null) return;
        long total = 0;
        for (File file : files) total += file.length();
        if (total <= DISK_LIMIT) return;
        Arrays.sort(files, Comparator.comparingLong(File::lastModified));
        for (File file : files) {
            if (total <= DISK_LIMIT) break;
            long bytes = file.length();
            if (file.delete()) total -= bytes;
        }
    }

    void close() {
        thumbs.shutdownNow();
        details.shutdownNow();
        main.removeCallbacksAndMessages(null);
        memory.evictAll();
    }
}
