package org.posewear.android;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.FrameLayout;
import android.widget.GridView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Locale;
import java.util.Set;
import java.util.WeakHashMap;
import java.util.concurrent.Future;
import java.util.function.Consumer;

final class HairGallery extends LinearLayout {
    private static final Palette LIGHT = new Palette(0xffffffff, 0xff171717, 0xff626262,
            0xfff3f3f3, 0xffb81534, 0xffffedf0);
    private static final Palette DARK = new Palette(0xff111111, 0xfff2f2f2, 0xffbbbbbb,
            0xff222222, 0xffff7188, 0xff391f25);

    private static final class Palette {
        final int root, text, muted, chip, accent, selected;

        Palette(int root, int text, int muted, int chip, int accent, int selected) {
            this.root = root;
            this.text = text;
            this.muted = muted;
            this.chip = chip;
            this.accent = accent;
            this.selected = selected;
        }
    }

    private Palette palette = LIGHT;
    private final MainActivity host;
    private final HairImages images;
    private final ArrayList<Entry> entries = new ArrayList<>();
    private final ArrayList<Entry> filtered = new ArrayList<>();
    private final LinearLayout list;
    private final Button back;
    private final TextView count;
    private final TextView heading;
    private final GridView grid;
    private final Cards cards = new Cards();
    private ScrollView detail;
    private Runnable recolorDetail;
    private Future<?> detailRequest;
    private int detailGeneration;
    private boolean openFromCard;

    HairGallery(MainActivity host, Runnable close) throws Exception {
        super(host);
        this.host = host;
        JSONArray data = new JSONArray(host.readAssetText("hair-catalog.json"));
        for (int i = 0; i < data.length(); i++) entries.add(new Entry(data.getJSONObject(i)));
        filtered.addAll(entries);
        images = new HairImages(host);
        setOrientation(VERTICAL);
        setForceDarkAllowed(false);

        LinearLayout header = new LinearLayout(host);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(12), dp(8), dp(16), dp(8));
        back = action("‹ 返回", () -> { if (!backToList()) close.run(); });
        header.addView(back, new LayoutParams(-2, dp(48)));
        heading = label("动画发型", 23, true);
        LayoutParams title = new LayoutParams(0, -2, 1);
        title.leftMargin = dp(14);
        header.addView(heading, title);
        addView(header);

        list = new LinearLayout(host);
        list.setOrientation(VERTICAL);
        list.setPadding(dp(16), 0, dp(16), 0);
        addView(list, new LayoutParams(-1, 0, 1));
        count = label(entries.size() + " 款发型", 13, false);
        count.setPadding(0, dp(12), 0, dp(8));
        list.addView(count);
        grid = new GridView(host);
        grid.setNumColumns(GridView.AUTO_FIT);
        grid.setColumnWidth(dp(148));
        grid.setHorizontalSpacing(dp(12));
        grid.setVerticalSpacing(dp(12));
        grid.setStretchMode(GridView.STRETCH_COLUMN_WIDTH);
        grid.setPadding(0, 0, 0, dp(16));
        grid.setClipToPadding(false);
        grid.setAdapter(cards);
        grid.setOnItemClickListener((parent, view, position, id) -> showDetail(filtered.get(position), false));
        list.addView(grid, new LayoutParams(-1, 0, 1));
        applyTheme();
    }

    void setDarkTheme(boolean dark) {
        Palette next = dark ? DARK : LIGHT;
        if (palette == next) return;
        palette = next;
        applyTheme();
    }

    private void applyTheme() {
        setBackgroundColor(palette.root);
        heading.setTextColor(palette.text);
        count.setTextColor(palette.muted);
        styleAction(back);
        grid.setEdgeEffectColor(palette.accent);
        // Recolor attached cards in place to keep the grid position and image requests.
        for (int i = 0; i < grid.getChildCount(); i++) {
            View child = grid.getChildAt(i);
            if (child instanceof Card) ((Card) child).applyTheme();
        }
        if (recolorDetail != null) recolorDetail.run();
    }

    void filter(String query) {
        String needle = query.trim().toLowerCase(Locale.ROOT);
        filtered.clear();
        for (Entry entry : entries) if (entry.search.contains(needle)) filtered.add(entry);
        count.setText(filtered.isEmpty() ? "没有匹配的发型" : filtered.size() + " 款发型");
        cards.notifyDataSetChanged();
        grid.setSelection(0);
    }

    void openItem(String id) {
        for (Entry entry : entries) {
            if (entry.id.equals(id)) {
                showDetail(entry, true);
                return;
            }
        }
    }

    private void showDetail(Entry entry, boolean fromCard) {
        hideKeyboard();
        list.setVisibility(GONE);
        openFromCard = fromCard;
        heading.setText(entry.name);
        ScrollView scroll = new ScrollView(host);
        detail = scroll;
        scroll.setFillViewport(false);
        LinearLayout body = new LinearLayout(host);
        body.setOrientation(VERTICAL);
        body.setPadding(dp(16), 0, dp(16), dp(20));
        scroll.addView(body, new ScrollView.LayoutParams(-1, -2));
        addView(scroll, new LayoutParams(-1, 0, 1));

        FrameLayout preview = new FrameLayout(host);
        preview.setClipToOutline(true);
        body.addView(preview, new LayoutParams(-1, dp(440)));
        ImageView image = new ImageView(host);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        preview.addView(image, new FrameLayout.LayoutParams(-1, -1));
        Button retry = action("正在加载大图…", () -> {});
        preview.addView(retry, new FrameLayout.LayoutParams(-2, dp(48), Gravity.CENTER));

        TextView chinese = label("", 15, false);
        TextView prompt = label("", 14, false);
        final Variant[] selected = {entry.variants.get(0)};
        Consumer<Variant> choose = variant -> {
            selected[0] = variant;
            chinese.setText("中文：" + entry.name + (variant.name.isEmpty() ? "" : "，" + variant.name));
            prompt.setText("英文原文：" + entry.prompt(variant));
            image.setContentDescription(variant.name.isEmpty() ? entry.name : entry.name + " · " + variant.name);
            loadDetail(variant, image, retry);
        };
        Colors colors = entry.variants.size() > 1 ? new Colors(entry.variants) : null;
        if (colors != null) {
            body.addView(colors, new LayoutParams(-1, dp(52)));
            colors.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                @Override public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                    if (selected[0] != entry.variants.get(position) || prompt.length() == 0) choose.accept(entry.variants.get(position));
                }
                @Override public void onNothingSelected(AdapterView<?> parent) { }
            });
        }
        chinese.setPadding(0, dp(10), 0, dp(4));
        body.addView(chinese);
        prompt.setPadding(0, 0, 0, dp(8));
        body.addView(prompt);
        LinearLayout actions = new LinearLayout(host);
        Button copy = action("复制英文提示词", () -> {
            ClipboardManager clipboard = host.getSystemService(ClipboardManager.class);
            clipboard.setPrimaryClip(ClipData.newPlainText("发型提示词", entry.prompt(selected[0])));
            Toast.makeText(host, "已复制提示词", Toast.LENGTH_SHORT).show();
        });
        actions.addView(copy, new LayoutParams(0, dp(48), 1));
        Button favorite = action("收藏", () -> {});
        LayoutParams favLayout = new LayoutParams(-2, dp(48));
        favLayout.leftMargin = dp(8);
        actions.addView(favorite, favLayout);
        body.addView(actions, new LayoutParams(-1, -2));
        Consumer<String> updateFavorite = value -> {
            boolean saved = "true".equals(value);
            favorite.setText(saved ? "已收藏" : "收藏");
            favorite.setSelected(saved);
        };
        host.hairFavorite(entry.id, false, updateFavorite);
        favorite.setOnClickListener(v -> host.hairFavorite(entry.id, true, updateFavorite));
        recolorDetail = () -> {
            scroll.setEdgeEffectColor(palette.accent);
            preview.setBackground(rounded(palette.chip, 16));
            chinese.setTextColor(palette.text);
            prompt.setTextColor(palette.muted);
            styleAction(retry);
            styleAction(copy);
            styleAction(favorite);
            if (colors != null) colors.applyTheme();
        };
        recolorDetail.run();
        choose.accept(selected[0]);
    }

    private void loadDetail(Variant variant, ImageView image, Button retry) {
        if (detailRequest != null) detailRequest.cancel(true);
        int generation = ++detailGeneration;
        image.setImageDrawable(null);
        retry.setText("正在加载大图…");
        retry.setEnabled(false);
        retry.setVisibility(VISIBLE);
        detailRequest = images.load(variant.full, true, bitmap -> {
            if (generation != detailGeneration) return;
            if (bitmap != null) {
                image.setImageBitmap(bitmap);
                retry.setVisibility(GONE);
            } else {
                retry.setText("加载失败，点击重试");
                retry.setEnabled(true);
                retry.setOnClickListener(v -> loadDetail(variant, image, retry));
            }
        });
    }

    boolean backToList() {
        if (detail == null || openFromCard) return false;
        clearDetail();
        list.setVisibility(VISIBLE);
        heading.setText("动画发型");
        return true;
    }

    private void clearDetail() {
        detailGeneration++;
        if (detailRequest != null) detailRequest.cancel(true);
        if (detail != null) removeView(detail);
        detail = null;
        recolorDetail = null;
    }

    void dispose() {
        hideKeyboard();
        clearDetail();
        images.close();
    }

    private void hideKeyboard() {
        host.getSystemService(InputMethodManager.class).hideSoftInputFromWindow(getWindowToken(), 0);
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private TextView label(String text, int size, boolean bold) {
        TextView label = new TextView(host);
        label.setText(text);
        label.setTextSize(size);
        if (bold) label.setTypeface(null, Typeface.BOLD);
        return label;
    }

    private Button action(String text, Runnable run) {
        Button button = new Button(host);
        button.setAllCaps(false);
        button.setText(text);
        button.setBackgroundTintList(null);
        button.setPadding(dp(12), 0, dp(12), 0);
        button.setOnClickListener(v -> run.run());
        return button;
    }

    private void styleAction(Button button) {
        button.setTextColor(new ColorStateList(
                new int[][] { {-android.R.attr.state_enabled}, {} },
                new int[] { palette.muted, palette.accent }));
        StateListDrawable background = new StateListDrawable();
        background.addState(new int[] {android.R.attr.state_selected}, rounded(palette.selected, 12));
        background.addState(new int[0], rounded(palette.chip, 12));
        button.setBackground(new RippleDrawable(interactionTint(), background, null));
    }

    private ColorStateList interactionTint() {
        return ColorStateList.valueOf(0x22000000 | (palette.accent & 0x00ffffff));
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(color);
        shape.setCornerRadius(dp(radius));
        return shape;
    }

    private final class Colors extends Spinner {
        private final GradientDrawable popupBackground = rounded(palette.chip, 12);
        // The popup is outside the gallery's view tree. Keep weak references to
        // rendered rows so an open dropdown can be recolored without rebinding it.
        private final Set<TextView> renderedOptions = Collections.newSetFromMap(new WeakHashMap<>());

        Colors(ArrayList<Variant> variants) {
            super(HairGallery.this.host, MODE_DROPDOWN);
            ArrayList<String> names = new ArrayList<>();
            for (Variant variant : variants) names.add(variant.name);
            ArrayAdapter<String> options = new ArrayAdapter<String>(host, android.R.layout.simple_spinner_item, names) {
                @Override public View getView(int position, View convertView, ViewGroup parent) {
                    return styleRenderedOption(super.getView(position, convertView, parent));
                }

                @Override public View getDropDownView(int position, View convertView, ViewGroup parent) {
                    return styleRenderedOption(super.getDropDownView(position, convertView, parent));
                }
            };
            options.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
            setPopupBackgroundDrawable(popupBackground);
            setAdapter(options);
            setContentDescription("发色");
        }

        private TextView styleRenderedOption(View view) {
            TextView option = (TextView) view;
            renderedOptions.add(option);
            styleOption(option);
            return option;
        }

        private void styleOption(TextView option) {
            option.setTextColor(palette.text);
            if (option instanceof CheckedTextView) {
                ((CheckedTextView) option).setCheckMarkTintList(ColorStateList.valueOf(palette.accent));
            }
        }

        void applyTheme() {
            setBackgroundTintList(ColorStateList.valueOf(palette.muted));
            popupBackground.setColor(palette.chip);
            for (TextView option : renderedOptions) styleOption(option);
        }
    }

    private final class Cards extends BaseAdapter {
        @Override public int getCount() { return filtered.size(); }
        @Override public Entry getItem(int position) { return filtered.get(position); }
        @Override public long getItemId(int position) { return position; }
        @Override public View getView(int position, View convertView, ViewGroup parent) {
            Card card = convertView instanceof Card ? (Card) convertView : new Card();
            card.bind(getItem(position));
            return card;
        }
    }

    private final class Card extends LinearLayout {
        private final FrameLayout top;
        private final ImageView photo;
        private final TextView hint;
        private final TextView name;
        private final TextView category;
        private Palette appliedPalette;
        private Future<?> request;
        private int generation;

        Card() {
            super(host);
            setOrientation(VERTICAL);
            setClipToOutline(true);
            top = new FrameLayout(host);
            addView(top, new LayoutParams(-1, dp(192)));
            photo = new ImageView(host);
            photo.setScaleType(ImageView.ScaleType.CENTER_CROP);
            top.addView(photo, new FrameLayout.LayoutParams(-1, -1));
            hint = label("", 12, false);
            top.addView(hint, new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER));
            name = label("", 16, true);
            name.setMaxLines(1);
            name.setEllipsize(android.text.TextUtils.TruncateAt.END);
            name.setPadding(dp(10), dp(8), dp(10), 0);
            addView(name);
            category = label("", 12, false);
            category.setPadding(dp(10), dp(1), dp(10), dp(8));
            addView(category);
        }

        void applyTheme() {
            if (appliedPalette == palette) return;
            appliedPalette = palette;
            setBackground(rounded(palette.chip, 14));
            top.setBackgroundColor(palette.chip);
            hint.setTextColor(palette.muted);
            name.setTextColor(palette.text);
            category.setTextColor(palette.muted);
        }

        void bind(Entry entry) {
            applyTheme();
            if (request != null) request.cancel(true);
            int current = ++generation;
            name.setText(entry.name);
            category.setText(entry.category + " · " + entry.id);
            photo.setImageDrawable(null);
            hint.setText("加载中…");
            hint.setVisibility(VISIBLE);
            request = images.load(entry.variants.get(0).thumb, false, bitmap -> {
                if (generation != current) return;
                if (bitmap == null) {
                    hint.setText("缩略图暂不可用");
                } else {
                    photo.setImageBitmap(bitmap);
                    hint.setVisibility(GONE);
                }
            });
        }
    }

    private static final class Entry {
        final String id, name, category, english, search;
        final ArrayList<Variant> variants = new ArrayList<>();

        Entry(JSONObject row) throws Exception {
            id = row.getString("id");
            name = row.getString("ti");
            category = row.getString("cat");
            english = row.getString("en");
            search = (id + " " + name + " " + category + " " + english + " " + row.optString("kw")).toLowerCase(Locale.ROOT);
            JSONArray angles = row.optJSONArray("angles");
            if (angles == null || angles.length() == 0) variants.add(new Variant(row, false));
            else for (int i = 0; i < angles.length(); i++) variants.add(new Variant(angles.getJSONObject(i), true));
        }

        String prompt(Variant variant) {
            return variant.english.isEmpty() ? english : english + ", hairstyle, " + variant.english;
        }
    }

    private static final class Variant {
        final String name, english, thumb, full;

        Variant(JSONObject data, boolean angle) throws Exception {
            name = angle ? data.getString("zh") : "";
            english = angle ? data.getString("en") : "";
            thumb = data.getString("t");
            full = data.getString("i");
        }
    }
}
