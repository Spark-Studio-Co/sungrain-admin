const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3035';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use a local frontend');
const output = process.env.TEST_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'elevator-deletion-ui-'));
fs.mkdirSync(output, { recursive: true });
const elevatorId = '00000000-0000-4000-8000-000000000001';
const activeName = 'Отгрузка зерна железнодорожным транспортом';
const archivedName = 'Хранение зерна';
const previousName = 'Предыдущие условия погрузки';
const service = (id, name, extra = {}) => ({
  id, name, culture: null, unit: 'TONNE', archived: false, overtimeEligible: false,
  alternativeGroup: '', rates: [{ id: `${id}-rate`, price: '3000', effectiveFrom: '2026-01-01', createdAt: '2026-01-01' }], ...extra,
});
const fixture = () => ({
  id: elevatorId, name: 'Тестовый элеватор', station: 'Шарбакты', address: '', contact: '', notes: '', archived: false, version: 1,
  services: [service('active', activeName), service('archived', archivedName, { archived: true }),
    service('previous', previousName, { archived: true, nextVersion: { id: 'active' }, validTo: '2026-01-01' })],
});

async function until(check, label) {
  for (let i = 0; i < 100; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail(label);
}

async function run(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  let record = fixture(), deletes = 0, fail = false, hold = false, release;
  const errors = [];
  await context.addInitScript(() => {
    sessionStorage.setItem('tokenReset', 'true');
    localStorage.setItem('auth-storage', JSON.stringify({ state: {
      token: 'synthetic-test-token', refreshToken: 'synthetic-refresh', role: 'ADMIN', userId: 'synthetic-user', tokenTimestamp: Date.now(),
    }, version: 0 }));
  });
  // API requests are always synthetic, even if a developer misconfigured the frontend API URL.
  await context.route('**/api/**', async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname.replace(/^\/api/, '');
    const respond = (json, status = 200) => route.fulfill({ status, json });
    if (request.method() === 'OPTIONS') return respond({});
    if (pathname === '/user/access') return respond({ isAdmin: true, canAccessApproach: true });
    if (request.method() === 'DELETE' && pathname.startsWith(`/elevators/${elevatorId}/services/`)) {
      deletes++;
      if (hold) await new Promise(resolve => { release = resolve; });
      if (fail) return respond({ message: 'Тестовая ошибка удаления' }, 500);
      const id = pathname.split('/').pop();
      record = { ...record, services: record.services.filter(item => item.id !== id) };
      return respond(record);
    }
    if (pathname === `/elevators/${elevatorId}`) return respond(record);
    if (pathname === '/elevators') return respond([record]);
    return respond({ data: [], total: 0 });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/admin/elevators`);
    await page.getByRole('link', { name: record.name, exact: true }).click();
    const remove = page.getByRole('button', { name: `Удалить услугу: ${activeName}`, exact: true });
    await remove.waitFor();
    assert(await page.getByRole('button', { name: `Удалить услугу: ${archivedName}`, exact: true }).isEnabled());
    assert(await page.getByRole('button', { name: `Удалить услугу: ${previousName}`, exact: true }).isEnabled());
    await page.screenshot({ path: path.join(output, `services-${width}.png`), fullPage: true, animations: 'disabled' });

    const dialog = page.getByRole('alertdialog');
    await remove.click();
    await dialog.waitFor();
    assert((await dialog.innerText()).includes('Сохранённые расчёты и история тарифов останутся без изменений.'));
    await page.screenshot({ path: path.join(output, `confirm-${width}.png`), fullPage: true, animations: 'disabled' });
    const bounds = await dialog.boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, 'Dialog must fit viewport');
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    await dialog.getByRole('button', { name: 'Отмена', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(deletes, 0);
    await until(() => remove.evaluate(el => el === document.activeElement), 'Cancel restores focus');
    await remove.click();
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(deletes, 0);

    fail = true;
    await remove.click();
    await dialog.getByRole('button', { name: 'Удалить услугу', exact: true }).click();
    await dialog.getByRole('alert').waitFor();
    assert((await dialog.getByRole('alert').innerText()).includes('Тестовая ошибка удаления'));
    assert.equal(deletes, 1);
    assert.equal(await page.getByRole('button', { name: `Удалить услугу: ${activeName}`, exact: true, includeHidden: true }).count(), 1);

    fail = false; hold = true;
    await dialog.getByRole('button', { name: 'Удалить услугу', exact: true }).click();
    await until(() => deletes === 2 && !!release, 'DELETE request started');
    assert(await dialog.getByRole('button', { name: 'Удаление…', exact: true }).isDisabled());
    assert(await dialog.getByRole('button', { name: 'Отмена', exact: true }).isDisabled());
    await page.keyboard.press('Escape');
    assert(await dialog.isVisible(), 'Pending deletion must not close');
    await dialog.getByRole('button', { name: 'Удаление…', exact: true }).evaluate(el => el.click());
    assert.equal(deletes, 2, 'Duplicate request blocked');
    release();
    await dialog.waitFor({ state: 'hidden' });
    await remove.waitFor({ state: 'detached' });
    await until(() => page.locator('#elevator-services-title').evaluate(el => el === document.activeElement), 'Deleted row fallback focus');
    assert.equal(await page.getByLabel('Услуг: 2', { exact: true }).count(), 1);
    assert((await page.locator('.elevator-action-notice').innerText()).includes('удалена'));
    await page.getByRole('link', { name: 'Элеваторы', exact: true }).last().click();
    await page.getByRole('link', { name: record.name, exact: true }).waitFor();
    assert.equal((await page.locator('td[data-label="Услуги"]').innerText()).trim(), '0', 'Catalogue cache updated');
    await page.getByRole('link', { name: record.name, exact: true }).click();
    await page.getByRole('button', { name: `Удалить услугу: ${archivedName}`, exact: true }).click();
    hold = false;
    await dialog.getByRole('button', { name: 'Удалить услугу', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.getByRole('button', { name: `Удалить услугу: ${archivedName}`, exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: confirmation/cancel/Escape/focus, archived versions, error/retry, pending lock, one DELETE, cache/list update`);
  } catch (error) {
    await page.screenshot({ path: path.join(output, `failure-${width}.png`), fullPage: true });
    throw error;
  } finally {
    if (release) release();
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
  try { for (const width of [1440, 390, 320]) await run(browser, width); }
  finally { await browser.close(); console.log(`Screenshots: ${output}`); }
})().catch(error => { console.error(error); process.exitCode = 1; });
