function (rows) {
    'use strict';
    if (window !== window.top || location.origin !== 'https://posewear.pages.dev' || window.PWAnimePose) return;
    const app = window.APP;
    if (!app?.ITEMS || !app.st?.fav || !Array.isArray(rows)) return;

    const route = location.origin + '/api/__pw_gallery_image';
    const source = 'https://charadb-2fi.pages.dev/';
    const pageSize = 36;
    const eagerThumbs = 12;
    const byKey = new Map();
    for (const row of rows) {
        if (!row || !/^P[0-9]{3}(?:-s)?$/.test(row.id) || row.t !== `/thumb/${row.id}.webp` || row.i !== `/img/${row.id}.jpg`) continue;
        const id = 'charadb-' + row.id;
        const key = 'p:' + id;
        if (byKey.has(key)) continue;
        const angle = row.angle || '原图视角';
        const angleEn = ({'正面':'front view','侧面':'side view','背面':'rear view'})[angle] || 'original view';
        // Keep only the shared item registry populated. Base poses use DATA.pose, so the galleries stay distinct.
        const item = {id, k:key, type:'pose', no:row.id, cat:row.cat, line:row.cat === '双人姿势' ? '动画姿势 · 双人' : '动画姿势',
            lineEn:row.cat === '双人姿势' ? 'two-person anime pose' : 'anime pose', zh:row.ti, ja:row.ja, en:row.en, ext:1, ai:0,
            angles:[{zh:angle, en:angleEn, t:route+row.t, i:route+row.i}]};
        const meta = {row, item, thumb:route+row.t, full:route+row.i,
            line:row.line === `/line/${row.id}.png` ? route+row.line : '',
            search:[row.id,row.ti,row.cat,row.zh,row.ja,row.catJa,row.en,row.angle].join(' ').toLowerCase()};
        app.ITEMS[key] = item;
        byKey.set(key, meta);
    }
    const entries = [...byKey.values()];
    if (!entries.length) return;

    function el(tag, className, value) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (value !== undefined) element.textContent = value;
        return element;
    }
    function button(label, className, click) {
        const result = el('button', className, label);
        result.type = 'button';
        result.addEventListener('click', click);
        return result;
    }
    function sourceLink() {
        const anchor = el('a', 'pwap-source-link', '打开素材原站 ↗');
        anchor.href = source;
        anchor.rel = 'noopener';
        return anchor;
    }

    const root = el('section');
    root.id = 'pw-anime-pose';
    root.hidden = true;
    root.setAttribute('aria-label', '动画姿势图库');
    const style = el('style');
    style.textContent = `
#pw-anime-pose {
    --pwap-bg: var(--bg,#fff); --pwap-surface: var(--bg2,#fff); --pwap-fg: var(--tx,#111); --pwap-muted: var(--tx2,#555);
    --pwap-border: var(--line2,#e3e3e3); --pwap-accent: var(--tx,#111); --pwap-tone: var(--sf,#f5f5f5); --pwap-main: var(--bg,#fff);
    position:fixed; inset:0; z-index:2147483000; overflow:hidden; background:var(--pwap-bg); color:var(--pwap-fg);
    font: 14px/1.5 system-ui,"Microsoft YaHei","Noto Sans CJK SC",sans-serif;
}
:root[data-theme=dark] #pw-anime-pose {
    --pwap-bg: var(--bg,#111); --pwap-surface: var(--bg2,#1b1b1b); --pwap-fg: var(--tx,#f2f2f2); --pwap-muted: var(--tx2,#bbb);
    --pwap-border: var(--line2,#333); --pwap-accent: var(--tx,#f2f2f2); --pwap-tone: var(--sf,#222); --pwap-main: var(--bg,#111);
}
#pw-anime-pose[hidden], #pw-anime-pose [hidden] {display:none!important}
#pw-anime-pose * {box-sizing:border-box}
#pw-anime-pose h1, #pw-anime-pose h2, #pw-anime-pose p {margin:0}
#pw-anime-pose .pwap-pane {position:absolute; inset:0; overflow:auto; overscroll-behavior:contain; padding:14px 14px 24px}
#pw-anime-pose .pwap-wrap {max-width:900px; margin-inline:auto}
#pw-anime-pose .pwap-head {display:flex; align-items:baseline; flex-wrap:wrap; gap:3px 10px; justify-content:space-between; margin-bottom:9px}
#pw-anime-pose h1 {font-size:22px; line-height:1.3; font-weight:750}
#pw-anime-pose .pwap-sub {font-size:12px; color:var(--pwap-muted)}
#pw-anime-pose .pwap-controls {display:grid; grid-template-columns:minmax(0,1fr) minmax(90px,auto); gap:8px; margin-top:10px}
#pw-anime-pose .pwap-controls.external {grid-template-columns:minmax(0,1fr); justify-items:end}
#pw-anime-pose .pwap-controls :is(input,select) {
    border:1px solid var(--pwap-border); border-radius:10px; min-height:43px; min-width:0; width:100%;
    background:var(--pwap-surface); color:var(--pwap-fg); padding-inline:10px; font:inherit;
}
#pw-anime-pose .pwap-controls input {font-size:16px}
#pw-anime-pose .pwap-controls select {appearance:auto; width:auto; max-width:132px}
#pw-anime-pose .pwap-count {display:block; margin:9px 0 7px; font-size:12px; color:var(--pwap-muted)}
#pw-anime-pose .pwap-grid {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px}
@media (min-width:540px) { #pw-anime-pose .pwap-grid {grid-template-columns:repeat(3,minmax(0,1fr))} }
@media (min-width:760px) { #pw-anime-pose .pwap-grid {grid-template-columns:repeat(4,minmax(0,1fr))} }
#pw-anime-pose .pwap-card {
    position:relative; min-width:0; overflow:hidden;
    border:1px solid var(--pwap-border); border-radius:12px; background:var(--pwap-surface);
}
#pw-anime-pose .pwap-open {
    display:block; width:100%; height:100%; cursor:pointer; padding:0; text-align:left; color:inherit;
    font:inherit; border:0; background:none; border-radius:inherit;
}
#pw-anime-pose .pwap-photo {
    display:grid; grid-template:minmax(0,1fr) / minmax(0,1fr); width:100%; aspect-ratio:5/6;
    background:var(--pwap-tone); overflow:hidden;
}
#pw-anime-pose .pwap-photo > * {grid-area:1/1}
#pw-anime-pose .pwap-photo img {display:block; width:100%; height:100%; object-fit:contain}
#pw-anime-pose .pwap-photo .pwap-sub {place-self:center; padding-inline:8px; text-align:center}
#pw-anime-pose .pwap-card-text {display:block; padding:7px 9px 8px}
#pw-anime-pose .pwap-name {display:block; min-height:2.6em; line-height:1.3; overflow-wrap:anywhere; font-size:14px}
#pw-anime-pose .pwap-id {display:block; font-size:11px; color:var(--pwap-muted)}
#pw-anime-pose .pwap-favorite {
    position:absolute; top:5px; right:5px; display:grid; place-items:center; width:44px; height:44px; padding:0;
    cursor:pointer; color:var(--pwap-accent); background:var(--pwap-surface); border:1px solid var(--pwap-border);
    border-radius:50%; box-shadow:0 1px 4px #0003; font:24px/1 system-ui,sans-serif;
}
#pw-anime-pose .pwap-favorite[aria-pressed=true] {border-color:var(--pwap-accent); background:var(--pwap-tone)}
#pw-anime-pose .pwap-action {
    cursor:pointer; padding:7px 10px; min-height:42px; color:var(--pwap-fg); font:inherit; font-weight:650;
    border:1px solid var(--pwap-border); border-radius:10px; background:var(--pwap-surface);
}
#pw-anime-pose .pwap-action.primary {background:var(--pwap-accent); color:var(--pwap-main); border-color:transparent}
#pw-anime-pose .pwap-action[aria-pressed=true] {border-color:var(--pwap-accent); color:var(--pwap-accent); background:var(--pwap-tone)}
#pw-anime-pose :is(button,input,select,a):focus-visible {outline:2px solid var(--pwap-accent); outline-offset:-2px}
#pw-anime-pose .pwap-more {width:100%; margin-top:12px}
#pw-anime-pose .pwap-header {display:flex; align-items:center; gap:10px; margin-bottom:10px}
#pw-anime-pose .pwap-header h1 {font-size:19px; overflow-wrap:anywhere}
#pw-anime-pose .pwap-header .pwap-action {flex:0 0 auto}
#pw-anime-pose .pwap-preview {display:grid; place-items:center; width:100%; height:clamp(220px,53dvh,560px); border-radius:13px; overflow:hidden; background:var(--pwap-tone); position:relative}
#pw-anime-pose .pwap-preview img {display:block; width:100%; height:100%; object-fit:contain; position:absolute; inset:0}
#pw-anime-pose .pwap-row {display:flex; flex-wrap:wrap; gap:7px; margin:8px 0 10px}
#pw-anime-pose .pwap-row .pwap-action {flex:1 0 auto}
#pw-anime-pose .pwap-note {background:var(--pwap-surface); border:1px solid var(--pwap-border); border-radius:12px; padding:10px 12px; margin:8px 0}
#pw-anime-pose .pwap-note h2 {color:var(--pwap-muted); font-size:12px; margin-bottom:3px}
#pw-anime-pose .pwap-note p {overflow-wrap:anywhere}
#pw-anime-pose .pwap-copy {margin-top:8px}
#pw-anime-pose .pwap-foot {color:var(--pwap-muted); font-size:12px; margin-top:14px}
#pw-anime-pose .pwap-source-link {color:var(--pwap-accent); text-decoration:underline}
#pw-anime-pose .pwap-status {position:absolute; bottom:12px; left:50%; transform:translateX(-50%); background:var(--pwap-accent); color:var(--pwap-main); padding:7px 12px; border-radius:20px; pointer-events:none; white-space:nowrap}
`;
    document.head.append(style);
    document.body.append(root);

    const library = el('div','pwap-pane');
    const libBody = el('div','pwap-wrap');
    library.append(libBody);
    const titlebar = el('div','pwap-head');
    titlebar.append(el('h1','','动画姿势'),el('span','pwap-sub','动作参考 · 插画与线稿'));
    libBody.append(titlebar);
    const controls = el('div','pwap-controls');
    const search = el('input');
    search.type = 'search';
    search.placeholder = '搜索动作或编号';
    search.setAttribute('aria-label','搜索动画姿势');
    const select = el('select');
    select.setAttribute('aria-label','筛选动作分类');
    select.add(new Option('全部动作',''));
    for (const category of new Set(entries.map(meta => meta.row.cat))) select.add(new Option(category,category));
    controls.append(search,select);
    const count = el('output','pwap-count');
    count.setAttribute('aria-live','polite');
    const grid = el('div','pwap-grid');
    const more = button('显示更多姿势','pwap-action pwap-more',() => appendCards());
    const footer = el('p','pwap-foot','资料来源：CharaDB。图片仅用于参考。');
    footer.append(' ',sourceLink());
    libBody.append(controls,count,grid,more,footer);

    const detail = el('div','pwap-pane');
    detail.hidden = true;
    const status = el('div','pwap-status');
    status.setAttribute('role','status');
    status.hidden = true;
    root.append(library,detail,status);

    let displayed = [], offset = 0, active = null, fromShared = false, previousFocus = null, statusTimer = 0;
    let listDirty = true;
    const inertBefore = new Map();
    const cardFavorites = new Map();
    // Start a bounded first batch without native lazy-loading. Defer the rest against the actual scroll pane.
    const thumbObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(changes => {
        for (const {target,isIntersecting} of changes) {
            if (!isIntersecting || !grid.contains(target)) continue;
            thumbObserver.unobserve(target);
            startThumb(target);
        }
    },{root:library,rootMargin:'240px 0px'}) : null;
    function startThumb(img) {
        img.src = img.dataset.src;
        delete img.dataset.src;
    }
    function renderList() {
        listDirty = false;
        const parts = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        displayed = entries.filter(meta => (!select.value || meta.row.cat === select.value) && parts.every(term => meta.search.includes(term)));
        offset = 0;
        library.scrollTop = 0;
        thumbObserver?.disconnect();
        cardFavorites.clear();
        grid.replaceChildren();
        count.textContent = displayed.length ? `共 ${displayed.length} 个姿势` : '未找到匹配的姿势';
        appendCards();
    }
    function invalidateList() {
        listDirty = true;
        if (!root.hidden && !library.hidden) renderList();
    }
    function setQuery(query) {
        const value = String(query ?? '');
        if (search.value !== value) {
            search.value = value;
            invalidateList();
        }
    }
    function setExternalSearch(enabled) {
        search.hidden = !!enabled;
        controls.classList.toggle('external',search.hidden);
    }
    function paintCardFavorite(favorite,key) {
        const saved = app.st.fav.has(key);
        favorite.textContent = saved ? '♥' : '♡';
        favorite.title = saved ? '取消收藏' : '收藏';
        favorite.setAttribute('aria-pressed',String(saved));
    }
    function syncCardFavorites() {
        for (const [key,favorite] of cardFavorites) paintCardFavorite(favorite,key);
    }
    function toggleFavorite(key) {
        app.toggleFav(key,true);
        const cardFavorite = cardFavorites.get(key);
        if (cardFavorite) paintCardFavorite(cardFavorite,key);
        announce(app.st.fav.has(key) ? '已加入收藏' : '已取消收藏');
    }
    function appendCards() {
        const next = displayed.slice(offset,offset + pageSize);
        const cards = document.createDocumentFragment();
        const images = [];
        for (const meta of next) {
            const {row,item} = meta;
            const card = el('article','pwap-card');
            const preview = button(undefined,'pwap-open',() => showDetail(meta));
            preview.setAttribute('aria-label',`${row.ti}，${row.cat}，${row.id}`);
            const cover = el('span','pwap-photo');
            const img = el('img');
            img.alt = '';
            img.decoding = 'async';
            img.draggable = false;
            img.dataset.src = meta.thumb;
            img.addEventListener('error',() => {
                img.hidden = true;
                cover.append(el('span','pwap-sub','缩略图暂不可用'));
            },{once:true});
            cover.append(img);
            images.push(img);
            const captions = el('span','pwap-card-text');
            captions.append(el('strong','pwap-name',row.ti),el('small','pwap-id',`${row.cat} · ${row.id}`));
            preview.append(cover,captions);
            const favorite = button(undefined,'pwap-favorite',() => toggleFavorite(item.k));
            favorite.setAttribute('aria-label',`收藏：${row.ti}`);
            paintCardFavorite(favorite,item.k);
            cardFavorites.set(item.k,favorite);
            card.append(preview,favorite);
            cards.append(card);
        }
        grid.append(cards);
        images.forEach((img,i) => {
            if (offset + i < eagerThumbs) startThumb(img);
            else if (thumbObserver) thumbObserver.observe(img);
            else {
                img.loading = 'lazy';
                startThumb(img);
            }
        });
        offset += next.length;
        more.hidden = offset >= displayed.length;
    }
    search.addEventListener('input',invalidateList);
    select.addEventListener('change',invalidateList);

    function announce(message) {
        clearTimeout(statusTimer);
        status.textContent = message;
        status.hidden = false;
        statusTimer = setTimeout(() => { status.hidden = true; },1800);
    }
    function note(header,text,language,copyLabel) {
        const result = el('section','pwap-note');
        const body = el('p','',text);
        body.lang = language;
        result.append(el('h2','',header),body);
        if (copyLabel) result.append(button(copyLabel,'pwap-action pwap-copy',async () => {
            await app.copy(text, header);
            announce('已复制');
        }));
        return result;
    }
    function showDetail(meta, shared = false) {
        const {row,item} = meta;
        active = meta;
        fromShared = shared;
        previousFocus = document.activeElement;
        library.hidden = true;
        detail.hidden = false;
        detail.scrollTop = 0;
        const body = el('div','pwap-wrap');
        const header = el('div','pwap-header');
        const backButton = button(shared ? '‹ 返回' : '‹ 返回列表','pwap-action',back);
        const heading = el('div');
        heading.append(el('h1','',row.ti),el('p','pwap-sub',[row.cat,row.angle,row.id].filter(Boolean).join(' · ')));
        header.append(backButton,heading);
        const preview = el('div','pwap-preview');
        const modes = el('div','pwap-row');
        modes.setAttribute('role','group');
        modes.setAttribute('aria-label','查看插画或线稿');
        const illustration = button('插画','pwap-action',() => display(false));
        const sketch = button('线稿','pwap-action',() => display(true));
        modes.append(illustration);
        if (meta.line) modes.append(sketch);
        function display(line) {
            illustration.setAttribute('aria-pressed',String(!line));
            sketch.setAttribute('aria-pressed',String(line));
            const image = el('img');
            image.alt = row.ti + (line ? '线稿' : '插画');
            image.decoding = 'async';
            const loading = el('span','pwap-sub','图片加载中…');
            preview.replaceChildren(loading,image);
            image.addEventListener('load',() => loading.remove(),{once:true});
            image.addEventListener('error',() => {
                if (image.parentNode === preview) preview.replaceChildren(button('图片加载失败，重试','pwap-action',() => display(line)));
            },{once:true});
            image.src = line ? meta.line : meta.full;
        }
        const actions = el('div','pwap-row');
        const favorite = button('收藏','pwap-action',() => {
            toggleFavorite(item.k);
            paintFavorite();
        });
        function paintFavorite() {
            const saved = app.st.fav.has(item.k);
            favorite.textContent = saved ? '♥ 已收藏' : '♡ 收藏';
            favorite.setAttribute('aria-pressed',String(saved));
        }
        paintFavorite();
        const pick = button('用作试穿姿势参考','pwap-action primary',async () => {
            if (typeof window.WB?.pick !== 'function') { announce('试穿工作台正在加载'); return; }
            pick.disabled = true;
            try {
                await window.WB.pick(item);
                close();
            } catch (error) {
                pick.disabled = false;
                announce('添加姿势失败，请重试');
            }
        });
        actions.append(favorite,pick);
        const original = el('p','pwap-foot','日文原名：');
        const japanese = el('span','',row.ja);
        japanese.lang = 'ja';
        original.append(japanese);
        const credit = el('p','pwap-foot','资料来源：CharaDB。图片仅用于参考。');
        credit.append(' ',sourceLink());
        body.append(header,preview,modes,actions,note('中文说明',row.zh,'zh-CN','复制中文'),
            note('英文标签原文',row.en,'en','复制英文标签'),original,credit);
        detail.replaceChildren(body);
        detail.scrollTop = 0;
        display(false);
        if (shared) backButton.focus({preventScroll:true});
    }
    function refreshList() {
        if (listDirty) renderList();
        else syncCardFavorites();
    }
    function hideDetail(restoreFocus) {
        detail.hidden = true;
        detail.replaceChildren();
        library.hidden = false;
        active = null;
        fromShared = false;
        if (!root.hidden) refreshList();
        if (restoreFocus) {
            const target = previousFocus?.isConnected ? previousFocus : search.hidden ? select : search;
            target.focus({preventScroll:true});
        }
        previousFocus = null;
    }
    function showRoot() {
        if (!root.hidden) return;
        root.hidden = false;
        for (const child of document.body.children) {
            if (child === root || !('inert' in child) || ['SCRIPT','STYLE'].includes(child.tagName)) continue;
            inertBefore.set(child,child.inert);
            child.inert = true;
        }
    }
    function open() {
        if (!root.hidden && active) hideDetail(false);
        else {
            showRoot();
            refreshList();
        }
        return true;
    }
    function close() {
        if (root.hidden) return;
        root.hidden = true;
        hideDetail(false);
        for (const [child, inert] of inertBefore) child.inert = inert;
        inertBefore.clear();
        status.hidden = true;
        clearTimeout(statusTimer);
    }
    function back() {
        if (root.hidden || !active) return false;
        if (fromShared) close();
        else hideDetail(true);
        return true;
    }
    document.addEventListener('click',event => {
        const trigger = event.target instanceof Element && event.target.closest('[data-a]');
        const meta = trigger?.dataset?.a === 'open' && byKey.get(trigger.closest('.card')?.dataset.k);
        if (!meta) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        showRoot();
        showDetail(meta,true);
    },true);
    root.addEventListener('keydown',event => {
        if (event.key === 'Escape' && back()) event.stopPropagation();
    });
    window.PWAnimePose = {open,close,back,setQuery,setExternalSearch};
}
