package org.posewear.android;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.function.Consumer;

final class AppNavigation extends LinearLayout {
    private int paper = 0xffffffff, ink = 0xff171717, muted = 0xff626262;
    private int accent = 0xffb81534, pale = 0xffffedf0, chipFill = 0xfff3f3f3;
    private int line = 0xffe8e8e8, logoColor = 0xffff2442;
    private boolean dark, themeApplied;
    private int activeTab;
    private LinearLayout brand;
    private BrandMark mark;
    private TextView brandTitle;
    private AdultControl adultControl;
    private ImageButton themeButton, githubButton;
    private final LinearLayout searchField;
    private final SearchMark searchMark;
    private final Button clearSearch;
    private final View separator;
    private static final String[] LABELS = {"主页", "试穿", "收藏"};
    private static final String[] GROUPS = {"姿势", "服装", "人像", "更多"};
    private static final String[][] GROUP_SECTIONS = {
            {"depth", "animePose", "pose"}, {"costume", "anime", "dyn"}, {"hair", "portrait", "expr"},
            {"light", "prop", "furn", "scene", "recent"}
    };
    private static final String[][] GROUP_LABELS = {
            {"深度姿势", "动画姿势", "基础姿势"}, {"基础服装", "动画服装", "古代服饰"}, {"动画发型", "人像", "表情"},
            {"光影", "道具", "家具", "场景", "最近浏览"}
    };
    private final LinearLayout picker;
    private final LinearLayout searchRow;
    private final EditText search;
    private final Button[] groupButtons = new Button[GROUPS.length];
    private final LinearLayout options;
    private boolean updatingSearch;
    private final Consumer<String> openLibrary;
    private final LinearLayout bar;
    private final LinearLayout[] buttons = new LinearLayout[LABELS.length];
    private final TextView[] labels = new TextView[LABELS.length];
    private final OutlineIcon[] icons = new OutlineIcon[LABELS.length];
    final FrameLayout content;
    private String librarySection;
    private int expandedGroup = -1;

    static int tabForSection(String section) {
        switch (section) {
            case "studio": return 1;
            case "fav": return 2;
            default:
                for (String[] group : GROUP_SECTIONS) {
                    for (String entry : group) if (entry.equals(section)) return 0;
                }
                return -1;
        }
    }

    AppNavigation(Context context, Consumer<Integer> onTab, Consumer<String> onLibrary, Consumer<String> onSearch,
                  Consumer<String> onTool) {
        super(context);
        setOrientation(VERTICAL);
        openLibrary = onLibrary;
        addView(brandRow(context, () -> onTab.accept(0), onTool), new LayoutParams(-1, -2));

        setFocusableInTouchMode(true);
        searchRow = new LinearLayout(context);
        searchRow.setGravity(Gravity.CENTER_VERTICAL);
        searchRow.setPaddingRelative(dp(context, 12), 0, dp(context, 12), dp(context, 7));
        searchField = new LinearLayout(context);
        searchField.setGravity(Gravity.CENTER_VERTICAL);
        searchRow.addView(searchField, new LayoutParams(-1, -2));
        searchMark = new SearchMark(context);
        searchMark.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        LayoutParams glassLayout = new LayoutParams(dp(context, 19), dp(context, 19));
        glassLayout.setMarginStart(dp(context, 13));
        searchField.addView(searchMark, glassLayout);
        search = new EditText(context);
        search.setSingleLine(true);
        search.setTextSize(16);
        search.setHint("搜索当前图库");
        search.setInputType(InputType.TYPE_CLASS_TEXT);
        search.setFilters(new InputFilter[]{new InputFilter.LengthFilter(300)});
        search.setImeOptions(EditorInfo.IME_ACTION_SEARCH | EditorInfo.IME_FLAG_NO_EXTRACT_UI);
        search.setBackground(null);
        search.setPaddingRelative(dp(context, 8), dp(context, 7), dp(context, 12), dp(context, 7));
        search.setMinHeight(dp(context, 44));
        search.setOnEditorActionListener((view, action, event) -> {
            if (action != EditorInfo.IME_ACTION_SEARCH) return false;
            dismissSearchKeyboard();
            return true;
        });
        searchField.addView(search, new LayoutParams(0, -2, 1));
        clearSearch = chip(context);
        clearSearch.setText("×");
        clearSearch.setTextSize(20);
        clearSearch.setPadding(0, 0, 0, 0);
        clearSearch.setContentDescription("清除搜索");
        clearSearch.setVisibility(GONE);
        clearSearch.setOnClickListener(view -> search.setText(""));
        searchField.addView(clearSearch, new LayoutParams(dp(context, 44), dp(context, 44)));
        search.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
            @Override public void afterTextChanged(Editable s) { }
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                clearSearch.setVisibility(s.length() == 0 ? GONE : VISIBLE);
                if (!updatingSearch) onSearch.accept(s.toString());
            }
        });
        addView(searchRow, new LayoutParams(-1, -2));

        picker = new LinearLayout(context);
        picker.setOrientation(VERTICAL);
        LinearLayout categoryRow = chipRow(context, 5);
        picker.addView(categoryRow, new LayoutParams(-1, -2));
        for (int i = 0; i < GROUPS.length; i++) {
            int group = i;
            Button button = chip(context);
            button.setOnClickListener(view -> {
                dismissSearchKeyboard();
                setExpandedGroup(expandedGroup == group ? -1 : group);
            });
            categoryRow.addView(button, shareRow(context, i));
            groupButtons[i] = button;
        }
        options = new LinearLayout(context);
        options.setOrientation(VERTICAL);
        picker.addView(options, new LayoutParams(-1, -2));
        options.setVisibility(GONE);
        addView(picker, new LayoutParams(-1, -2));
        showLibrary("costume", true);
        requestFocus();

        content = new FrameLayout(context);
        addView(content, new LayoutParams(-1, 0, 1));
        bar = new LinearLayout(context);
        bar.setOrientation(VERTICAL);
        separator = new View(context);
        bar.addView(separator, new LayoutParams(-1, dp(context, 1)));
        LinearLayout row = new LinearLayout(context);
        row.setPadding(dp(context, 8), dp(context, 4), dp(context, 8), dp(context, 4));
        bar.addView(row, new LayoutParams(-1, dp(context, 60)));
        for (int i = 0; i < LABELS.length; i++) {
            int index = i;
            LinearLayout button = new LinearLayout(context);
            button.setOrientation(VERTICAL);
            button.setGravity(Gravity.CENTER);
            button.setFocusable(true);
            button.setContentDescription(LABELS[i]);
            button.setOnClickListener(view -> onTab.accept(index));
            LayoutParams item = new LayoutParams(0, -1, 1);
            item.setMargins(dp(context, 3), 0, dp(context, 3), 0);
            row.addView(button, item);
            buttons[i] = button;
            icons[i] = new OutlineIcon(context, i);
            icons[i].setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            button.addView(icons[i], new LayoutParams(dp(context, 23), dp(context, 23)));
            labels[i] = text(context, LABELS[i], 12, muted, true);
            labels[i].setGravity(Gravity.CENTER);
            labels[i].setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            button.addView(labels[i]);
        }
        addView(bar, new LayoutParams(-1, -2));
        setDarkTheme(false);
        setToolbarStatus(false, false);
    }

    void setDarkTheme(boolean enabled) {
        if (themeApplied && dark == enabled) return;
        themeApplied = true;
        dark = enabled;
        Context context = getContext();
        paper = dark ? 0xff111111 : 0xffffffff;
        ink = dark ? 0xfff2f2f2 : 0xff171717;
        muted = dark ? 0xffbbbbbb : 0xff626262;
        accent = dark ? 0xffff7188 : 0xffb81534;
        pale = dark ? 0xff391f25 : 0xffffedf0;
        chipFill = dark ? 0xff222222 : 0xfff3f3f3;
        line = dark ? 0xff333333 : 0xffe8e8e8;
        logoColor = dark ? 0xffff3b57 : 0xffff2442;
        setBackgroundColor(paper);
        content.setBackgroundColor(paper);
        separator.setBackgroundColor(line);
        brand.setBackground(ripple(context, paper, 12));
        mark.setTone(logoColor);
        brandTitle.setTextColor(ink);
        searchField.setBackground(rounded(context, chipFill, 99));
        searchMark.setTone(muted);
        search.setTextColor(ink);
        search.setHintTextColor(muted);
        clearSearch.setTextColor(muted);
        clearSearch.setBackground(ripple(context, chipFill, 99));
        themeButton.setImageResource(dark ? R.drawable.ic_theme_moon : R.drawable.ic_theme_sun);
        themeButton.setContentDescription(dark ? "切换浅色主题" : "切换深色主题");
        themeButton.setImageTintList(ColorStateList.valueOf(ink));
        themeButton.setBackground(ripple(context, chipFill, 99));
        githubButton.setImageTintList(ColorStateList.valueOf(ink));
        githubButton.setBackground(ripple(context, paper, 99));
        adultControl.invalidate();
        setExpandedGroup(expandedGroup);
        select(activeTab);
    }

    void setToolbarStatus(boolean ready, boolean adult) {
        adultControl.setEnabled(ready);
        adultControl.setAlpha(ready ? 1f : .48f);
        adultControl.setChecked(adult);
        themeButton.setEnabled(ready);
        themeButton.setAlpha(ready ? 1f : .48f);
    }

    void select(int tab) {
        activeTab = tab;
        for (int i = 0; i < buttons.length; i++) {
            boolean active = i == tab;
            buttons[i].setSelected(active);
            buttons[i].setBackground(ripple(getContext(), active ? pale : paper, 14));
            labels[i].setTextColor(active ? accent : muted);
            icons[i].setTone(active ? accent : muted);
        }
    }

    private int selectedItem(int group) {
        for (int i = 0; i < GROUP_SECTIONS[group].length; i++) {
            if (GROUP_SECTIONS[group][i].equals(librarySection)) return i;
        }
        return -1;
    }

    void showLibrary(String section, boolean visible) {
        librarySection = section;
        picker.setVisibility(visible ? VISIBLE : GONE);
        setExpandedGroup(-1);
    }

    void showSearch(boolean visible, String hint) {
        if (!visible && search.hasFocus()) dismissSearchKeyboard();
        searchRow.setVisibility(visible ? VISIBLE : GONE);
        search.setHint(hint);
    }

    void setSearchQuery(String value) {
        String next = value == null ? "" : value;
        if (TextUtils.equals(search.getText(), next)) return;
        updatingSearch = true;
        try {
            search.setText(next);
            search.setSelection(search.length());
        } finally {
            updatingSearch = false;
        }
    }

    void dismissSearchKeyboard() {
        if (!search.hasFocus()) return;
        InputMethodManager keyboard = getContext().getSystemService(InputMethodManager.class);
        if (keyboard != null) keyboard.hideSoftInputFromWindow(search.getWindowToken(), 0);
        requestFocus();
    }

    boolean collapseLibraries() {
        if (expandedGroup < 0) return false;
        setExpandedGroup(-1);
        return true;
    }

    private void setExpandedGroup(int group) {
        expandedGroup = group;
        Context context = getContext();
        for (int i = 0; i < GROUPS.length; i++) {
            int choice = selectedItem(i);
            boolean active = choice >= 0;
            boolean expanded = expandedGroup == i;
            Button button = groupButtons[i];
            button.setSelected(active);
            button.setText(GROUPS[i] + (expanded ? " ▴" : " ▾"));
            button.setContentDescription(GROUPS[i] + (active ? "，当前：" + GROUP_LABELS[i][choice] : "")
                    + (expanded ? "，已展开" : "，展开子分类"));
            button.setBackground(ripple(context, expanded || active ? pale : chipFill, 99));
            button.setTextColor(expanded || active ? accent : ink);
        }
        options.removeAllViews();
        options.setVisibility(group < 0 ? GONE : VISIBLE);
        if (group < 0) return;
        LinearLayout row = null;
        for (int i = 0; i < GROUP_SECTIONS[group].length; i++) {
            if (i % 3 == 0) {
                row = chipRow(context, 5);
                options.addView(row, new LayoutParams(-1, -2));
            }
            String section = GROUP_SECTIONS[group][i];
            boolean active = section.equals(librarySection);
            Button button = chip(context);
            button.setText(GROUP_LABELS[group][i]);
            button.setSelected(active);
            button.setTextColor(active ? accent : ink);
            button.setBackground(ripple(context, active ? pale : chipFill, 99));
            button.setOnClickListener(view -> {
                setExpandedGroup(-1);
                openLibrary.accept(section);
            });
            row.addView(button, shareRow(context, i % 3));
        }
    }

    private static LinearLayout chipRow(Context context, int bottomPadding) {
        LinearLayout row = new LinearLayout(context);
        row.setPaddingRelative(dp(context, 12), 0, dp(context, 12), dp(context, bottomPadding));
        return row;
    }

    private static LayoutParams shareRow(Context context, int index) {
        LayoutParams layout = new LayoutParams(0, -2, 1);
        if (index > 0) layout.setMarginStart(dp(context, 6));
        return layout;
    }

    private static Button chip(Context context) {
        Button button = new Button(context);
        button.setAllCaps(false);
        button.setSingleLine(true);
        button.setTextSize(14);
        button.setTypeface(null, Typeface.BOLD);
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setMinHeight(dp(context, 40));
        button.setMinimumHeight(dp(context, 40));
        button.setPaddingRelative(dp(context, 4), dp(context, 6), dp(context, 4), dp(context, 6));
        button.setEllipsize(TextUtils.TruncateAt.END);
        button.setStateListAnimator(null);
        button.setBackgroundTintList(null);
        return button;
    }

    private View brandRow(Context context, Runnable goHome, Consumer<String> onTool) {
        LinearLayout row = new LinearLayout(context);
        row.setPaddingRelative(dp(context, 12), 0, dp(context, 12), dp(context, 3));
        row.setGravity(Gravity.CENTER_VERTICAL);
        brand = new LinearLayout(context);
        brand.setGravity(Gravity.CENTER_VERTICAL);
        brand.setMinimumHeight(dp(context, 48));
        brand.setContentDescription("衣姿 PoseWear，主页");
        brand.setOnClickListener(view -> goHome.run());
        brand.setFocusable(true);
        row.addView(brand, new LayoutParams(-2, -2));

        mark = new BrandMark(context);
        mark.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        brand.addView(mark, new LayoutParams(dp(context, 30), dp(context, 30)));
        brandTitle = text(context, "衣姿", 18, ink, true);
        brandTitle.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
        LayoutParams titleParams = new LayoutParams(-2, -2);
        titleParams.setMarginStart(dp(context, 8));
        brand.addView(brandTitle, titleParams);
        row.addView(new View(context), new LayoutParams(0, 1, 1));

        adultControl = new AdultControl(context);
        adultControl.setOnClickListener(view -> onTool.accept("adult"));
        row.addView(adultControl, new LayoutParams(dp(context, 70), dp(context, 48)));
        themeButton = toolIcon(context, "切换深浅色", R.drawable.ic_theme_sun, () -> onTool.accept("theme"));
        LayoutParams iconParams = new LayoutParams(dp(context, 44), dp(context, 44));
        iconParams.setMarginStart(dp(context, 4));
        row.addView(themeButton, iconParams);
        githubButton = toolIcon(context, "GitHub 开源仓库", R.drawable.ic_github, () -> onTool.accept("github"));
        row.addView(githubButton, new LayoutParams(dp(context, 44), dp(context, 44)));
        return row;
    }

    private static ImageButton toolIcon(Context context, String label, int icon, Runnable click) {
        ImageButton button = new ImageButton(context);
        button.setContentDescription(label);
        button.setImageResource(icon);
        button.setPadding(0, 0, 0, 0);
        button.setScaleType(ImageView.ScaleType.CENTER);
        button.setOnClickListener(view -> click.run());
        return button;
    }

    private final class AdultControl extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private boolean checked;

        AdultControl(Context context) {
            super(context);
            setContentDescription("显示成人向内容（18+）");
            setFocusable(true);
            setForeground(ripple(context, android.graphics.Color.TRANSPARENT, 99));
        }

        void setChecked(boolean checked) {
            if (this.checked == checked) return;
            this.checked = checked;
            setSelected(checked);
            invalidate();
        }

        @Override public void onInitializeAccessibilityNodeInfo(AccessibilityNodeInfo info) {
            super.onInitializeAccessibilityNodeInfo(info);
            info.setClassName("android.widget.Switch");
            info.setCheckable(true);
            info.setChecked(checked);
        }

        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.save();
            canvas.scale(getWidth() / 70f, getHeight() / 48f);
            paint.setStrokeWidth(1f);
            paint.setStyle(Paint.Style.STROKE);
            paint.setColor(checked ? accent : line);
            canvas.drawRoundRect(1, 7, 69, 41, 17, 17, paint);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(checked ? (dark ? 0xffd41e42 : 0xffb81534) : (dark ? 0xff555555 : 0xffb0b0b0));
            canvas.drawRoundRect(8, 16, 34, 32, 8, 8, paint);
            paint.setColor(0xffffffff);
            canvas.drawCircle(checked ? 26 : 16, 24, 6, paint);
            paint.setTypeface(Typeface.DEFAULT_BOLD);
            paint.setTextSize(12f);
            paint.setColor(checked ? accent : muted);
            canvas.drawText("18+", 40, 28.3f, paint);
            canvas.restore();
        }
    }

    void showBar(boolean visible) {
        int state = visible ? VISIBLE : GONE;
        if (bar.getVisibility() != state) bar.setVisibility(state);
    }

    private static TextView text(Context context, String text, int size, int color, boolean bold) {
        TextView label = new TextView(context);
        label.setText(text);
        label.setTextSize(size);
        label.setTextColor(color);
        if (bold) label.setTypeface(null, Typeface.BOLD);
        return label;
    }

    private static GradientDrawable rounded(Context context, int fill, int radius) {
        GradientDrawable body = new GradientDrawable();
        body.setColor(fill);
        body.setCornerRadius(dp(context, radius));
        return body;
    }

    private static RippleDrawable ripple(Context context, int fill, int radius) {
        return new RippleDrawable(ColorStateList.valueOf(0x2266254a), rounded(context, fill, radius), null);
    }

    private static final class SearchMark extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        SearchMark(Context context) {
            super(context);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(1.7f);
            paint.setStrokeCap(Paint.Cap.ROUND);
        }

        void setTone(int color) {
            paint.setColor(color);
            invalidate();
        }

        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.save();
            canvas.scale(getWidth() / 20f, getHeight() / 20f);
            canvas.drawCircle(8.4f, 8.4f, 4.7f, paint);
            canvas.drawLine(12f, 12f, 16.3f, 16.3f, paint);
            canvas.restore();
        }
    }

    private static int dp(Context context, int value) {
        return Math.round(value * context.getResources().getDisplayMetrics().density);
    }

    private static final class BrandMark extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path shape = new Path();

        BrandMark(Context context) {
            super(context);
            shape.moveTo(16, 13.4f);
            shape.lineTo(3.4f, 25.6f);
            shape.lineTo(28.6f, 25.6f);
            shape.close();
        }

        void setTone(int color) {
            paint.setColor(color);
            invalidate();
        }

        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.save();
            canvas.scale(getWidth() / 32f, getHeight() / 32f);
            paint.setStyle(Paint.Style.FILL);
            canvas.drawCircle(16, 6.6f, 4f, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(3.4f);
            paint.setStrokeJoin(Paint.Join.ROUND);
            canvas.drawPath(shape, paint);
            canvas.restore();
        }
    }

    private static final class OutlineIcon extends View {
        private final int index;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path path = new Path();

        OutlineIcon(Context context, int index) {
            super(context);
            this.index = index;
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(1.65f);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setStrokeJoin(Paint.Join.ROUND);
        }

        void setTone(int color) {
            paint.setColor(color);
            invalidate();
        }

        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            canvas.save();
            canvas.scale(getWidth() / 24f, getHeight() / 24f);
            path.reset();
            switch (index) {
                case 0:
                    path.moveTo(3, 10.5f); path.lineTo(12, 3); path.lineTo(21, 10.5f);
                    path.lineTo(19, 10.5f); path.lineTo(19, 20.5f); path.lineTo(14.5f, 20.5f);
                    path.lineTo(14.5f, 14.5f); path.lineTo(9.5f, 14.5f); path.lineTo(9.5f, 20.5f);
                    path.lineTo(5, 20.5f); path.lineTo(5, 10.5f); path.close();
                    break;
                case 1:
                    path.moveTo(8, 4); path.lineTo(4.5f, 5.5f); path.lineTo(2.5f, 9.5f);
                    path.lineTo(6, 12); path.lineTo(7, 10.5f); path.lineTo(7, 20); path.lineTo(17, 20);
                    path.lineTo(17, 10.5f); path.lineTo(18, 12); path.lineTo(21.5f, 9.5f);
                    path.lineTo(19.5f, 5.5f); path.lineTo(16, 4); path.quadTo(12, 8, 8, 4);
                    break;
                case 2:
                    path.moveTo(12, 20); path.cubicTo(10, 18.3f, 3, 13.2f, 3, 8.9f);
                    path.cubicTo(3, 4.5f, 8.5f, 3, 12, 7.1f); path.cubicTo(15.5f, 3, 21, 4.5f, 21, 8.9f);
                    path.cubicTo(21, 13.2f, 14, 18.3f, 12, 20); path.close();
                    break;
                default:
                    for (int i = 0; i < 3; i++) canvas.drawCircle(5.5f + i * 6.5f, 12, 1, paint);
            }
            canvas.drawPath(path, paint);
            canvas.restore();
        }
    }
}
