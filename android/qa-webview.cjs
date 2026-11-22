// Run with PW_CORE and CHROME_EXE pointing to Playwright Core and Chromium.
// Mirrors only Android's app-side URL rewrites; does not mock image bytes.
const {chromium} = require(process.env.PW_CORE || 'playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const site = 'https://posewear.pages.dev';
const charadb = 'https://charadb-2fi.pages.dev';
const imageRoute = '/api/__pw_gallery_image';
const assets = path.join(__dirname, 'app', 'src', 'main', 'assets');
const patch = new RegExp('"https://charadb-2fi\\.pages\\.dev(/(?:thumb/[OH][0-9]{1,6}(?:-[a-z]+)?\\.webp|img/[OH][0-9]{1,6}(?:-[a-z]+)?\\.jpg))"','g');
async function qaNativeToolbar(page, injectMobile) {
  const top = page.locator('.top');
  const ageBox = page.locator('#ageBox');
  const action = name => page.evaluate(name => PWMobileNav.toolbarAction(name), name);
  const state = (dark,adult) => JSON.stringify({dark,adult});
  const messages = name => page.evaluate(name => window.qaToolbarMessages[name], name);
  const waitState = (name,dark,adult) => page.waitForFunction(([name,expected]) =>
    window.qaToolbarMessages[name].at(-1) === expected, [name,state(dark,adult)]);
  const attach = (name,nativeOrigin = false) => page.evaluate(([name,nativeOrigin]) => {
    const token = crypto.randomUUID();
    const channel = new MessageChannel();
    const storage = window.qaToolbarMessages ??= {};
    channel.port1.onmessage = event => storage[name].push(event.data);
    storage[name] = [];
    if (!PWMobileNav.bindToolbar(token)) throw new Error('bindToolbar rejected a random token');
    if (nativeOrigin) {
      window.dispatchEvent(new MessageEvent('message',{data:token,ports:[channel.port2]}));
    } else {
      const wrong = new MessageChannel(), extra = new MessageChannel();
      const unexpected = storage.unexpected = [];
      wrong.port1.onmessage = event => unexpected.push(event.data);
      extra.port1.onmessage = event => unexpected.push(event.data);
      const send = (data,origin,ports) => window.dispatchEvent(new MessageEvent('message',{data,origin,ports}));
      send(token,location.origin,[]);
      send(token,location.origin,[wrong.port2,extra.port2]);
      send(token,'https://example.com',[wrong.port2]);
      send(token+'x',location.origin,[wrong.port2]);
      window.postMessage(token,location.origin,[channel.port2]);
    }
  }, [name,nativeOrigin]);
  assert.equal(await top.isVisible(),true);
  assert.equal(await page.locator('#theme').isVisible(),true);
  assert.equal(await page.locator('.top a[href="https://github.com/atuizz/posewear"]').count(),1);
  assert.equal(await page.locator('#q').isHidden(),true);
  await attach('first');
  await waitState('first',false,false);
  await page.evaluate(() => PWMobileNav.setNativeToolbar());
  assert.equal(await top.isHidden(),true);
  assert.equal(await page.locator('#q').isHidden(),true);
  assert.equal(await page.locator('#pw-anime-pose input[type=search]').isHidden(),true);
  assert.equal(await page.locator('#pw-mobile-nav:visible, .top:visible').count(),0);
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--hdr')),'0px');
  const galleryColors = () => page.locator('#pw-anime-pose').evaluate(el => {
    const gallery = getComputedStyle(el), site = getComputedStyle(document.body);
    return [gallery.backgroundColor,site.backgroundColor,gallery.color,site.color];
  });
  const light = await galleryColors();
  assert.equal(light[0],light[1]);
  assert.equal(light[2],light[3]);
  assert.equal(await action('theme'),'ok');
  await waitState('first',true,false);
  const dark = await galleryColors();
  assert.equal(dark[0],dark[1]);
  assert.equal(dark[2],dark[3]);
  assert.notEqual(dark[0],light[0]);
  assert.notEqual(dark[2],light[2]);

  // First tap delegates the confirmation to Android; canceling leaves website state untouched.
  assert.equal(await action('adult'),'confirmAdult');
  assert.equal(await ageBox.isHidden(),true);
  assert.deepEqual(await page.evaluate(() => [APP.st.adult,localStorage.ageOk]),[false,undefined]);
  assert.equal(await action('adult'),'confirmAdult');
  assert.equal(await action('unknown'),null);
  // No snapshot should be reproduced for mutations that leave the state unchanged.
  await page.evaluate(() => { document.querySelector('#adultSw').setAttribute('aria-checked','false'); });
  assert.equal(await action('confirmAdult'),'ok');
  await waitState('first',true,true);
  assert.equal(await ageBox.isHidden(),true);
  assert.equal(await page.evaluate(() => localStorage.ageOk),'true');
  assert.equal(await action('confirmAdult'),'ok');
  assert.equal(await action('adult'),'ok');
  await waitState('first',true,false);
  const firstSnapshots = [state(false,false),state(true,false),state(true,true),state(true,false)];
  assert.deepEqual(await messages('first'),firstSnapshots);
  assert.deepEqual(await messages('unexpected'),[]);

  await attach('rebound',true);
  await waitState('rebound',true,false);
  await page.evaluate(() => {
    PWMobileNav.cancel();
    window.qaDetailOpens = 0;
    APP.ageAsk(() => window.qaDetailOpens++);
  });
  assert.equal(await ageBox.isVisible(),true);
  assert.equal(await action('adult'),null);
  assert.equal(await action('confirmAdult'),null);
  assert.equal(await page.locator('#ageT').textContent(),'这是成人向内容');
  await page.locator('#ageY').click();
  await waitState('rebound',true,true);
  assert.equal(await page.evaluate(() => window.qaDetailOpens),1);
  assert.equal(await action('adult'),'ok');
  await waitState('rebound',true,false);
  assert.deepEqual(await messages('first'),firstSnapshots);
  assert.deepEqual(await messages('rebound'),[state(true,false),state(true,true),state(true,false)]);
  await page.evaluate(() => scrollTo(0,500));
  await page.waitForFunction(() => Math.abs(document.querySelector('#bar').getBoundingClientRect().top) <= 1);
  assert.equal(await page.evaluate(() => PWMobileNav.select('studio')),true);
  await page.waitForFunction(() => APP.st.tab === 'studio' && !document.querySelector('#studio').hidden);
  assert.equal(await top.isHidden(),true);
  assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--hdr')),'0px');

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => !!window.APP?.st);
  await injectMobile();
  assert.equal(await top.isVisible(),true);
  assert.equal(await page.locator('#theme').isVisible(),true);
  assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.theme,localStorage.theme]),['dark','dark']);
  await attach('reload');
  await waitState('reload',true,false);
  await page.evaluate(() => PWMobileNav.setNativeToolbar());
  assert.equal(await action('theme'),'ok');
  await waitState('reload',false,false);
  assert.equal(await page.evaluate(() => localStorage.theme),'light');
  console.log('原生工具栏、18+ 确认与详情隔离、深浅色持久化、桥接状态和吸顶布局通过');
}

async function main() {
  const browser = await chromium.launch({executablePath: process.env.CHROME_EXE});
  let page;
  try {
    page = await browser.newPage({viewport:{width:390,height:812},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const requests = new Set();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.route(`${site}/assets/*.json`, async route => {
      if (!/\/assets\/(?:anime|hair)\.[a-f0-9]{10,64}\.json$/.test(new URL(route.request().url()).pathname)) return route.continue();
      const res = await route.fetch();
      assert.equal(res.status(),200);
      await route.fulfill({response:res,body:(await res.text()).replace(patch, `"${site}${imageRoute}$1"`)});
    });
    await page.route(`${site}${imageRoute}/**`, async route => {
      const relative = new URL(route.request().url()).pathname.slice(imageRoute.length);
      const res = await page.request.get(charadb + relative);
      if (res.ok()) requests.add(relative);
      await route.fulfill({response:res});
    });
    await page.goto(site+'/#anime/charadb-O001', {waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => !!window.APP?.st?.list, {timeout:25000});
    for (const name of ['mobile.js','gallery-zh.js']) await page.evaluate(fs.readFileSync(path.join(assets,name),'utf8'));
    await page.waitForFunction(() => !document.querySelector('#lb').hidden && document.querySelector('#lbImg').naturalWidth>0 && document.querySelector('#lbImg').src.includes('/img/O001.jpg'));
    console.log('动画服装详情:', await page.locator('#lbImg').evaluate(el=>[el.naturalWidth,el.naturalHeight,el.src]));
    await page.locator('#lbSide [data-pw-gallery-zh]').waitFor({state:'attached'});
    assert.match(await page.locator('#lbSide [data-pw-gallery-zh]').textContent(),/水手服|水手领/);
    assert.match(await page.locator('#lbSide').textContent(),/serafuku/);
    await page.locator('#lb [data-x="fav"]:visible').first().click();
    await page.evaluate(() => APP.lbClose());
    await page.locator('#lb').waitFor({state:'hidden'});
    await page.evaluate(async () => {await APP.setTab('fav');});
    const thumb = page.locator('[data-k="a:charadb-O001"] img');
    await thumb.waitFor();
    await thumb.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-k="a:charadb-O001"] img')?.naturalWidth > 0);
    console.log('收藏缩略图:', await thumb.evaluate(el=>[el.naturalWidth,el.naturalHeight,el.src]));
    assert(requests.has('/thumb/O001.webp'));
    assert(requests.has('/img/O001.jpg'));
    await page.evaluate(async () => { await APP.setTab('studio'); });
    assert.equal(await page.locator('body.studio').count(),1);
    assert.equal(await page.locator('#studio:not([hidden])').count(),1);
    assert.equal(await page.locator('#pw-mobile-nav:visible').count(),0);
    console.log('工作台入口和收藏状态通过');
    await page.evaluate(async () => {await APP.setTab('dyn','C001');});
    await page.locator('#lbSide [data-pw-gallery-zh]').waitFor({state:'attached'});
    assert.match(await page.locator('#lbSide [data-pw-gallery-zh]').textContent(),/蔽膝/);
    assert.match(await page.locator('#lbSide .pbox.en').textContent(),/[a-z]{5}/i);
    await page.evaluate(() => APP.lbClose());
    await page.locator('#lb').waitFor({state:'hidden'});
    await page.evaluate(async () => {await APP.setTab('depth');});
    const japanese = page.locator('#grid article .sub span[lang="ja"]').first();
    await japanese.waitFor({state:'attached'});
    assert.match(await japanese.locator('..').textContent(),/个角度/);
    assert((await japanese.textContent()).length>0);
    console.log('动画中英关键词、历代服饰中英详情、深度姿势中日卡片通过');

    const poseRows = JSON.parse(fs.readFileSync(path.join(assets,'anime-pose-catalog.json'),'utf8'));
    const poseScript = fs.readFileSync(path.join(assets,'anime-pose.js'),'utf8');
    assert.equal(poseRows.length,281);
    assert.equal(new Set(poseRows.map(row => row.id)).size,281);
    const sample = poseRows.find(row => row.id === 'P001-s');
    const injectPoses = () => page.evaluate(`(${poseScript})(${JSON.stringify(poseRows)})`);
    await injectPoses();
    assert.equal(await page.evaluate(async () => {
      await APP.load('pose');
      return APP.DATA.pose.some(item => item.k.startsWith('p:charadb-'));
    }),false);
    assert.equal(await page.evaluate(() => window.PWMobileNav?.select('animePose') ?? PWAnimePose.open()),true);
    const library = page.locator('#pw-anime-pose');
    await library.waitFor();
    assert.equal(await library.locator('.pwap-count').textContent(),'共 281 个姿势');
    assert.equal(await library.locator('.pwap-card').count(),36);
    assert.equal(await library.evaluate(el => getComputedStyle(el).position),'fixed');
    const cards = library.locator('.pwap-card');
    const search = library.locator('input[type=search]');
    const category = library.getByLabel('筛选动作分类');
    const key = `p:charadb-${sample.id}`;
    const saved = () => page.evaluate(k => ({
      state: APP.st.fav.has(k), storage: JSON.parse(localStorage.getItem('fav') || '[]').includes(k)
    }),key);
    // naturalWidth alone used to pass even though the thumbnail box had collapsed to 0×0.
    const firstImages = cards.locator('img');
    await page.waitForFunction(() => {
      const images = [...document.querySelectorAll('#pw-anime-pose .pwap-card img')].slice(0,6);
      return images.length === 6 && images.every(img => img.complete && img.naturalWidth > 0);
    });
    const boxes = await firstImages.evaluateAll(images => images.slice(0,6).map(img => {
      const {left,top,right,bottom,width,height} = img.getBoundingClientRect();
      return {name:img.closest('article').querySelector('.pwap-name').textContent,
        visible:left >= 0 && top >= 0 && right <= innerWidth && Math.min(bottom,innerHeight) - top > 100
          && getComputedStyle(img).visibility === 'visible', width, height};
    }));
    assert.deepEqual(boxes.map(box => box.name),poseRows.slice(0,6).map(row => row.ti));
    assert(boxes.every(box => box.visible && box.width > 100 && box.height > 120),JSON.stringify(boxes));
    assert.equal(await library.locator('.pwap-preview').count(),0);
    assert(![...requests].some(url => url.startsWith('/img/P')));
    if (process.env.PW_POSE_SCREENSHOT) await page.screenshot({path:process.env.PW_POSE_SCREENSHOT});
    assert.equal(await firstImages.last().getAttribute('src'),null);
    await cards.last().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('#pw-anime-pose .pwap-card img')].at(-1)?.naturalWidth > 0);
    console.log(`动画姿势首屏 6 张可见缩略图 ${boxes[0].width}×${boxes[0].height}px；滑动后加载第 36 张`);

    const initialSample = cards.filter({hasText:sample.id});
    const initialHeart = initialSample.getByRole('button',{name:`收藏：${sample.ti}`,exact:true});
    assert.equal(await initialSample.locator(':scope > button').count(),2);
    assert.equal(await initialSample.locator('button button').count(),0);
    assert.equal(await initialHeart.getAttribute('aria-pressed'),'false');
    await initialHeart.click();
    assert.equal(await initialHeart.getAttribute('aria-pressed'),'true');
    assert.deepEqual(await saved(),{state:true,storage:true});
    assert.equal(await library.locator('.pwap-preview').count(),0);
    await initialHeart.click();
    assert.equal(await initialHeart.getAttribute('aria-pressed'),'false');
    assert.deepEqual(await saved(),{state:false,storage:false});
    assert.equal(await library.locator('.pwap-preview').count(),0);

    await page.evaluate(() => PWAnimePose.setExternalSearch(true));
    assert.equal(await search.isHidden(),true);
    assert.equal(await category.isVisible(),true);
    await page.evaluate(query => PWAnimePose.setQuery(query),sample.id);
    assert.equal(await cards.count(),1);
    await category.selectOption('双人姿势');
    assert.equal(await cards.count(),0);
    await page.evaluate(() => PWAnimePose.setQuery(''));
    assert.equal(await library.locator('.pwap-count').textContent(),'共 35 个姿势');
    await category.selectOption('');
    await page.evaluate(() => PWAnimePose.setExternalSearch(false));
    assert.equal(await search.isVisible(),true);
    await search.fill(sample.id);
    assert.equal(await cards.count(),1);
    const poseCard = library.locator('.pwap-open');
    await page.waitForFunction(() => document.querySelector('.pwap-card img')?.naturalWidth > 0);
    await poseCard.click();
    await page.waitForFunction(() => document.querySelector('.pwap-preview img')?.naturalWidth > 0 && document.querySelector('.pwap-preview img').src.endsWith('/img/P001-s.jpg'));
    await library.getByRole('button',{name:'线稿',exact:true}).click();
    await page.waitForFunction(() => document.querySelector('.pwap-preview img')?.naturalWidth > 0 && document.querySelector('.pwap-preview img').src.endsWith('/line/P001-s.png'));
    assert.match(await library.locator('.pwap-note').first().innerText(),/中文说明/);
    assert.equal(await library.locator('p[lang=en]').textContent(),sample.en);
    assert.equal(await library.locator('span[lang=ja]').textContent(),sample.ja);
    await library.getByRole('button',{name:'♡ 收藏',exact:true}).click();
    assert.deepEqual(await saved(),{state:true,storage:true});
    assert.equal(await page.evaluate(() => PWAnimePose.back()),true);
    assert.equal(await page.evaluate(() => PWAnimePose.back()),false);
    assert.equal(await initialHeart.getAttribute('aria-pressed'),'true');
    await initialHeart.click();
    await initialHeart.click();
    assert.deepEqual(await saved(),{state:true,storage:true});
    await poseCard.click();
    await page.evaluate(() => PWAnimePose.setQuery('P002-s'));
    assert.equal(await library.getByRole('heading',{name:sample.ti}).isVisible(),true);
    assert.equal(await page.evaluate(() => PWAnimePose.back()),true);
    assert.equal(await cards.count(),1);
    assert.match(await cards.textContent(),/P002-s/);
    await page.evaluate(query => PWAnimePose.setQuery(query),sample.id);
    await poseCard.click();
    await library.getByRole('button',{name:'用作试穿姿势参考'}).click();
    await page.waitForFunction(() => document.querySelector('#pw-anime-pose').hidden && APP.st.tab === 'studio');
    assert.match(await page.locator('#studio .pick.pose').first().textContent(), new RegExp(sample.ti));
    assert(requests.has('/thumb/P001-s.webp'));
    assert(requests.has('/img/P001-s.jpg'));
    assert(requests.has('/line/P001-s.png'));
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => !!window.APP?.st);
    await injectPoses();
    assert.deepEqual(await saved(),{state:true,storage:true});
    await page.evaluate(async () => {await APP.setTab('fav');});
    const poseFavorite = page.locator('[data-k="p:charadb-P001-s"]');
    await poseFavorite.locator('.phk').click();
    await library.getByRole('heading',{name:sample.ti}).waitFor();
    assert.equal(await page.evaluate(() => PWAnimePose.back()),true);
    await poseFavorite.locator('[data-a=fav]').click();
    assert.equal(await page.evaluate(() => APP.st.fav.has('p:charadb-P001-s')),false);
    assert.equal(await library.isHidden(),true);
    await page.evaluate(fs.readFileSync(path.join(assets,'mobile.js'),'utf8'));
    assert.equal(await page.evaluate(() => PWMobileNav.select('animePose')),true);
    await library.waitFor();
    assert.equal(await page.evaluate(() => PWMobileNav.select('costume')),true);
    await page.waitForFunction(() => APP.st.tab === 'costume' && location.hash === '#costume'
      && document.querySelector('#pw-anime-pose').hidden && document.querySelector('#grid article[data-k^="c:"]'));
    assert.equal(await page.locator('.top .tabs:visible, .top .brand:visible').count(),0);
    assert.equal(await page.locator('#q:visible').count(),1);
    assert.equal(await page.locator('#fBtn:visible').count(),1);
    await page.evaluate(() => PWMobileNav.setExternalSearch());
    assert.equal(await page.locator('#q:visible').count(),0);
    await page.evaluate(() => PWMobileNav.setQuery('costume','SPR-0001'));
    await page.waitForFunction(() => APP.st.q === 'SPR-0001' && !!document.querySelector('#grid article[data-k="c:SPR-0001"]'));
    assert(await page.locator('#grid article').count() < 5);
    for (const section of ['dyn','light','prop','furn']) {
      assert.equal(await page.evaluate(section => PWMobileNav.select(section,''),section),true);
      await page.waitForFunction(section => APP.st.tab === section && !APP.st.q && APP.DATA[section]?.length > 0
        && document.querySelector('#grid article'),section);
    }
    assert.equal(await page.evaluate(() => PWMobileNav.select('animePose','P001-s')),true);
    assert.equal(await cards.count(),1);
    assert.equal(await search.isHidden(),true);
    assert.equal(await category.isVisible(),true);
    await page.evaluate(() => PWMobileNav.setQuery('animePose','P002-s'));
    assert.match(await cards.textContent(),/P002-s/);
    console.log('原生统一搜索适配、古代服饰／光影／道具／家具继续可用');
    console.log('动画姿势 281 条、独立分类、筛选搜索、插画/线稿、试穿、重载后收藏、返回基础服装通过');
    await qaNativeToolbar(page, () => page.evaluate(fs.readFileSync(path.join(assets,'mobile.js'),'utf8')));
    assert.deepEqual(errors,[]);
  } finally {
    if(page) await page.unrouteAll({behavior:'ignoreErrors'});
    await browser.close();
  }
}
main().catch(e=>{console.error(e);process.exitCode=1;});
