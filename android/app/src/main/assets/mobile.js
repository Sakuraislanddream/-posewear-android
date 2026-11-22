(() => {
    'use strict';
    if (location.origin !== 'https://posewear.pages.dev' || window !== window.top || window.PWMobileNav) return;

    let waitingForDetail = null;
    let animationPoseActive = false;
    let pendingSearch = null;
    const setWebQuery = (query) => {
        const input = document.getElementById('q');
        if (!input || input.value === query) return;
        input.value = query;
        input.dispatchEvent(new Event('input', {bubbles: true}));
    };
    const setQuery = (section, query) => {
        if (pendingSearch?.section === section) pendingSearch.query = query;
        if (section === 'animePose') window.PWAnimePose?.setQuery(query);
        else if (!animationPoseActive && window.APP?.st?.tab === section) setWebQuery(query);
    };
    const setExternalSearch = () => {
        document.documentElement.classList.add('pw-native-search');
        window.PWAnimePose?.setExternalSearch(true);
        window.dispatchEvent(new Event('resize'));
    };
    const setNativeToolbar = () => {
        document.documentElement.classList.add('pw-native-toolbar');
        setExternalSearch();
    };
    const toolbarAction = (action) => {
        if (action === 'theme') {
            const theme = document.getElementById('theme');
            if (!theme) return null;
            theme.click();
            return 'ok';
        }
        if (action !== 'adult' && action !== 'confirmAdult') return null;
        const adult = document.getElementById('adultSw');
        if (!adult) return null;
        const confirming = action === 'confirmAdult';
        if (confirming && adult.getAttribute('aria-checked') === 'true') return 'ok';
        const ageBox = document.getElementById('ageBox');
        // An existing dialog can carry a website detail callback. Leave it alone.
        if (ageBox && !ageBox.hidden) return null;
        adult.click();
        if (!ageBox || ageBox.hidden) return 'ok';
        const ageButton = document.getElementById(confirming ? 'ageY' : 'ageN');
        if (!ageButton) return null;
        ageButton.click();
        return confirming ? 'ok' : 'confirmAdult';
    };
    let disposeToolbarBinding;
    const bindToolbar = (token) => {
        if (typeof token !== 'string' || !token) return false;
        disposeToolbarBinding?.();
        let port;
        let observer;
        const receivePort = (event) => {
            // Android's WebView may omit origin on native postWebMessage. The token is per binding.
            if ((event.origin && event.origin !== location.origin) || event.data !== token || event.ports.length !== 1) return;
            window.removeEventListener('message', receivePort);
            [port] = event.ports;
            let previous;
            const root = document.documentElement;
            const adult = document.getElementById('adultSw');
            const publish = () => {
                const state = JSON.stringify({dark: root.dataset.theme === 'dark', adult: adult?.getAttribute('aria-checked') === 'true'});
                if (state === previous) return;
                previous = state;
                port.postMessage(state);
            };
            observer = new MutationObserver(publish);
            observer.observe(root, {attributes:true, attributeFilter:['data-theme']});
            if (adult) observer.observe(adult, {attributes:true, attributeFilter:['aria-checked']});
            publish();
        };
        disposeToolbarBinding = () => {
            window.removeEventListener('message', receivePort);
            observer?.disconnect();
            port?.close();
        };
        window.addEventListener('message', receivePort);
        return true;
    };
    const cancelQueuedSelection = () => {
        waitingForDetail?.disconnect();
        waitingForDetail = null;
    };
    const cancel = () => {
        cancelQueuedSelection();
        window.PWAnimePose?.close();
        animationPoseActive = false;
        pendingSearch = null;
    };
    const select = (section, query) => {
        cancelQueuedSelection();
        pendingSearch = null;
        const app = window.APP;
        const opensAnimationPose = section === 'animePose';
        if (typeof app?.setTab !== 'function') return false;
        if (opensAnimationPose && typeof window.PWAnimePose?.open !== 'function') return false;
        const search = {section, query};
        pendingSearch = search;
        const apply = () => {
            pendingSearch = null;
            if (opensAnimationPose) {
                if (typeof search.query === 'string') setQuery(section, search.query);
                animationPoseActive = window.PWAnimePose?.open() === true;
                return animationPoseActive;
            }
            cancel();
            if (app.st?.tab !== section) app.setTab(section);
            else if (location.hash !== '#' + section) history.replaceState(null, '', '#' + section);
            if (section !== 'studio' && typeof search.query === 'string') setQuery(section, search.query);
            return true;
        };

        const detail = document.getElementById('lb');
        if (!detail || detail.hidden || typeof app.lbClose !== 'function') return apply();
        // The site's lightbox can pop a history entry while closing. Wait for its close to finish.
        waitingForDetail = new MutationObserver(() => {
            if (!detail.hidden) return;
            cancelQueuedSelection();
            apply();
        });
        waitingForDetail.observe(detail, {attributes: true, attributeFilter: ['hidden']});
        app.lbClose();
        return true;
    };
    window.PWMobileNav = {
        select,
        cancel,
        setQuery,
        setExternalSearch,
        setNativeToolbar,
        toolbarAction,
        bindToolbar,
        isCurrent: (section) => !waitingForDetail && (!animationPoseActive || section === 'studio')
            && location.hash === '#' + section && window.APP?.st?.tab === section,
        back: () => {
            const closers = [
                ['cfg', '#cfgX'], ['pk', '#pkX'], ['ageBox', '#ageN'],
                ['privBox', '#privBox [data-close]'], ['helpBox', '#helpBox [data-close]'],
                ['drawerBg', '#drawerBg']
            ];
            for (const [layerId, closeSelector] of closers) {
                const layer = document.getElementById(layerId);
                if (layer && !layer.hidden) {
                    const close = document.querySelector(closeSelector);
                    if (close) {
                        close.click();
                        return true;
                    }
                }
            }
            const detail = document.getElementById('lb');
            if (!animationPoseActive && detail && !detail.hidden && typeof window.APP?.lbClose === 'function') {
                window.APP.lbClose();
                return true;
            }
            return false;
        }
    };

    const openNativeHair = (id = '') => location.assign('/__native_hair__' + (id ? '/' + id : ''));
    document.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        let id = '';
        if (!target.closest('.tabs [data-tab="hair"], [data-go="hair"]')) {
            const card = target.closest('article[data-k^="h:"]');
            if (!card || !target.closest('[data-a="open"]')) return;
            id = card.dataset.k.slice(2);
            if (!/^H[0-9]+$/.test(id)) return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        openNativeHair(id);
    }, true);

    const style = document.createElement('style');
    style.textContent = `
/* Keep the site's controls visible until the app opts into a complete native toolbar. */
.top .brand, .top .tabs, #pw-mobile-nav, #hero,
.pw-native-search .top .search,
.pw-native-toolbar .top { display:none !important }
.top .tools { margin-inline-start:auto }
body.studio .top { height:auto; min-height:0 }
@media (max-width:760px) {
    .top { padding-block:4px 6px }
    #q { font-size:16px }
    #grid { padding-inline:12px; column-gap:10px }
    #bar .tbar { flex-wrap:wrap; overflow:visible; gap:6px }
    #bar .tbar > .sp { display:none }
    #bar #active { max-width:100%; flex-wrap:wrap }
    #fBtn, #sort, #rand, #filters .chip, #filters [data-done], #studio .sh .lnk { min-height:44px }
    #studio .sh { flex-wrap:wrap; gap:4px 8px }
    #studio .sh .sp { flex:1 1 4px }
    #studio input:not([type=range]):not([type=checkbox]), #studio textarea, #studio select { font-size:16px; max-width:100% }
    .annbar { margin-inline:12px }
    .annbar p { min-width:0 }
    .annbar p b { white-space:normal }
}`;
    document.head.append(style);
    // The source page caches its sticky header height before hiding the original tabs.
    window.dispatchEvent(new Event('resize'));
})();
