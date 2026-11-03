const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { fixtures } = require('./elevator-directory-fixture.cjs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3035';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = process.env.TEST_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'elevator-directory-'));
fs.mkdirSync(output, { recursive: true });

async function check(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 950 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('tokenReset', 'true');
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token: 'synthetic-test-token', role: 'ADMIN', tokenTimestamp: Date.now() }, version: 0 }));
  });
  let data = fixtures();
  let fail = false;
  await context.route('**/api/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const send = (json, status = 200) => route.fulfill({ json, status });
    if (pathname === '/api/user/access') return send({ isAdmin: true, canAccessApproach: true });
    if (pathname === '/api/elevators') return fail ? send({ message: 'Test failure' }, 500) : send(data);
    if (pathname.startsWith('/api/elevators/')) return send(data.find(item => item.id === pathname.split('/').pop()));
    return send({ data: [], total: 0 });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/admin/elevators`);
    await page.getByRole('link', { name: data[0].name, exact: true }).waitFor();
    const rows = page.locator('.elevator-directory-table tbody tr');
    assert.equal(await rows.count(), 3);
    await page.screenshot({ path: path.join(output, `directory-${width}.png`), fullPage: true, animations: 'disabled' });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(await overflow(), false, 'No horizontal page overflow');
    await page.getByRole('radio', { name: 'Архив', exact: true }).click();
    assert.equal(await rows.count(), 1);
    assert((await rows.innerText()).includes('Северный'));
    await page.getByRole('radio', { name: 'Действующие', exact: true }).click();
    assert.equal(await rows.count(), 2);
    const search = page.getByRole('textbox', { name: 'Поиск элеватора' });
    await search.fill('  ШАРБАКТЫ ');
    assert.equal(await rows.count(), 1);
    await page.getByRole('button', { name: 'Очистить поиск', exact: true }).click();
    assert(await search.evaluate(el => el === document.activeElement));
    await search.fill('несуществующая станция');
    await page.getByText('Элеваторы не найдены', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).first().click();
    assert.equal(await rows.count(), 3);
    await page.getByRole('button', { name: 'Добавить элеватор', exact: true }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('link', { name: data[0].name, exact: true }).click();
    await page.getByRole('heading', { name: data[0].name, exact: true }).waitFor();
    fail = true;
    await page.goBack();
    await page.getByRole('link', { name: data[0].name, exact: true }).waitFor();
    await page.getByText('Не удалось обновить список. Показаны последние загруженные данные.', { exact: true }).waitFor();
    assert.equal(await rows.count(), 3, 'Cached rows remain visible after a failed refresh');
    assert(await search.isEnabled());
    fail = false;
    await page.getByRole('button', { name: 'Повторить', exact: true }).click();
    await page.locator('.elevator-directory-stale').waitFor({ state: 'hidden' });
    data[0].name = 'ОченьДлинноеНазваниеЭлеватораБезПробелов'.repeat(5);
    await page.reload();
    await page.getByRole('link', { name: data[0].name, exact: true }).waitFor();
    assert.equal(await overflow(), false, 'Long names must wrap');
    if (width === 1440) {
      data = [];
      await page.reload();
      await page.getByText('Элеваторы пока не добавлены', { exact: true }).waitFor();
      fail = true;
      await page.reload();
      await page.getByText('Не удалось загрузить элеваторы', { exact: true }).waitFor({ timeout: 20000 });
      fail = false; data = fixtures();
      await page.getByRole('button', { name: 'Повторить', exact: true }).click();
      await page.getByRole('link', { name: data[0].name, exact: true }).waitFor();
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: layout, status/search/reset, long names, create modal, detail navigation${width === 1440 ? ', empty/error/retry' : ''}`);
  } catch (error) {
    await page.screenshot({ path: path.join(output, `failure-${width}.png`), fullPage: true, animations: 'disabled' });
    throw error;
  } finally { await context.close(); }
}
(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  try { for (const width of [1440, 1024, 768, 390, 320]) await check(browser, width); }
  finally { await browser.close(); console.log(`Screenshots: ${output}`); }
})().catch(error => { console.error(error); process.exitCode = 1; });
