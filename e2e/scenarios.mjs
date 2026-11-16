// End-to-end scenarios for ComboMatch (run: node e2e/scenarios.mjs [baseUrl] [shotsDir])
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH ?? 'playwright'); }
const { chromium, devices } = pw;

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const SHOTS = process.argv[3] ?? 'e2e/shots';
const results = [];
const errors = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); };

async function pick(page, text, name) {
  await page.fill('#food-search', text);
  await page.getByRole('option', { name: new RegExp(name) }).first().click();
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(BASE);
await page.screenshot({ path: `${SHOTS}/01-home.png`, fullPage: true });
const btn = page.getByRole('button', { name: 'בדוק צירוף' });
ok('check button disabled with 0 foods', await btn.isDisabled());

// 1 + 5: two foods, red (potato + lentils)
await pick(page, 'תפוח אד', 'תפוח אדמה');
ok('button disabled with 1 food', await btn.isDisabled());
await pick(page, 'עדש', 'עדשים');
await btn.click();
await page.waitForURL(/result/);
ok('1/5. potato+lentils is red', (await page.locator('[data-level]').getAttribute('data-level')) === 'red');
ok('red headline', await page.getByText('כדאי לשקול שינוי בצירוף').isVisible());
const altCount = await page.getByRole('list', { name: 'חלופות מוצעות' }).getByRole('listitem').count();
ok('alternatives offered (<=3)', altCount > 0 && altCount <= 3, `${altCount}`);
await page.screenshot({ path: `${SHOTS}/02-result-red.png`, fullPage: true });

// detailed explanation
await page.getByRole('button', { name: 'הצג הסבר מפורט' }).click();
ok('detailed explanation shows source', await page.getByText(/מקור:/).first().isVisible());

// apply alternative
await page.getByRole('list', { name: 'חלופות מוצעות' }).getByRole('button', { name: 'החלף' }).first().click();
await page.waitForTimeout(200);
ok('alternative swap yields green', (await page.locator('[data-level]').getAttribute('data-level')) === 'green');

// 8: save as meal
await page.getByRole('button', { name: /שמור כארוחה קבועה/ }).click();
await page.getByLabel('שם הארוחה').fill('ארוחת צהריים');
await page.getByRole('button', { name: 'שמירה' }).click();
ok('toast after save', await page.getByText('הארוחה "ארוחת צהריים" נשמרה').isVisible());

// 2 + 3: three foods, all pairs, green
await page.getByRole('button', { name: 'בדוק צירוף אחר' }).click();
await pick(page, 'דג', 'דג');
await pick(page, 'ברוק', 'ברוקולי');
await pick(page, 'חסה', 'חסה');
await btn.click();
ok('2/3. three foods -> 3 pairs, green', (await page.locator('[data-level]').getAttribute('data-level')) === 'green'
  && await page.getByText('בדיקת כל הזוגות בארוחה').isVisible());
await page.screenshot({ path: `${SHOTS}/03-result-green.png`, fullPage: true });

// swap component via dialog
await page.getByRole('button', { name: /החלף רכיב/ }).click();
await page.getByRole('dialog').getByRole('button', { name: /חסה/ }).click();
await page.getByRole('dialog').locator('#food-search').fill('אורז');
await page.getByRole('dialog').getByRole('option', { name: /אורז/ }).first().click();
ok('swap component -> fish+broccoli+rice red', (await page.locator('[data-level]').getAttribute('data-level')) === 'red');

// 6: fats+fats (practitioner ruling)
await page.goto(`${BASE}#/`);
await page.getByRole('button', { name: 'נקה הכל' }).click().catch(() => {});
await pick(page, 'שמן ז', 'שמן זית');
await pick(page, 'אבוק', 'אבוקדו');
await btn.click();
ok('6. olive oil+avocado green with ruling text', (await page.locator('[data-level]').getAttribute('data-level')) === 'green' && (await page.getByText('במתינות רבה').count()) > 0);
await page.screenshot({ path: `${SHOTS}/04-result-unknown.png`, fullPage: true });

// 7: unknown food search + add
await page.goto(`${BASE}#/`);
await page.getByRole('button', { name: 'נקה הכל' }).click().catch(() => {});
await page.fill('#food-search', 'דוריאן');
ok('7. no results message', await page.getByText('לא נמצא מזון בשם "דוריאן"').isVisible());
await page.getByRole('button', { name: /הוספת "דוריאן" למאגר/ }).click();
await page.getByRole('dialog').getByRole('button', { name: 'שמירה' }).click();
await pick(page, 'חסה', 'חסה');
ok('unclassified food blocks check', await btn.isDisabled() && await page.getByText(/עדיין לא שויך למשפחת מזון/).isVisible());
await page.getByRole('button', { name: 'סווגו עכשיו' }).click();
await page.getByRole('dialog').getByRole('button', { name: /פירות מתוקים/ }).click();
await page.getByRole('dialog').getByRole('button', { name: 'שמירה' }).click();
ok('after classification check enabled', await btn.isEnabled());

// 9 + load: meals screen
await page.goto(`${BASE}#/meals`);
ok('8. saved meal listed', await page.getByRole('heading', { name: 'ארוחת צהריים' }).isVisible());
await page.screenshot({ path: `${SHOTS}/06-meals.png`, fullPage: true });
await page.reload();
ok('8. saved meal persists after reload', await page.getByRole('heading', { name: 'ארוחת צהריים' }).isVisible());
await page.getByRole('button', { name: 'ערוך' }).click();
await page.getByLabel('שם הארוחה').fill('סלט ערב');
await page.getByRole('dialog').getByRole('button', { name: 'שמירה' }).click();
ok('9. meal edited', await page.getByRole('heading', { name: 'סלט ערב' }).isVisible());
await page.getByRole('button', { name: 'בדוק שוב' }).click();
await page.waitForURL(/result/);
ok('recheck saved meal', await page.locator('[data-level]').isVisible());
await page.goto(`${BASE}#/meals`);
await page.getByRole('button', { name: /טען את סלט ערב/ }).click();
await page.waitForURL(/#\/$/);
ok('load meal into home', (await page.locator('main .chip').count()) >= 2);
await page.goto(`${BASE}#/meals`);
await page.getByRole('button', { name: 'מחק' }).click();
await page.getByRole('dialog').getByRole('button', { name: 'מחק' }).click();
ok('9. meal deleted', await page.getByText('עדיין אין ארוחות שמורות').isVisible());

// rules matrix + edit
await page.goto(`${BASE}#/rules`);
ok('matrix rendered', (await page.locator('section[aria-labelledby=matrix-title] table button').count()) === 196);
await page.screenshot({ path: `${SHOTS}/07-rules.png`, fullPage: true });
await page.getByRole('button', { name: 'עגבנייה + עגבנייה: מתאים' }).first().click();
await page.getByRole('button', { name: 'עריכת הכלל' }).click();
await page.getByRole('dialog').getByRole('button', { name: /לא מומלץ/ }).first().click();
await page.getByRole('button', { name: 'שמירת הכלל' }).click();
ok('rule edited without code change', await page.getByRole('button', { name: 'עגבנייה + עגבנייה: לא מומלץ' }).first().isVisible());

// history
await page.goto(`${BASE}#/history`);
const hist = await page.getByRole('button', { name: 'בדיקה חוזרת' }).count();
ok('history recorded', hist >= 5, `${hist}`);
await page.getByRole('button', { name: 'הכללים שהופעלו' }).first().click();
await page.screenshot({ path: `${SHOTS}/08-history.png`, fullPage: true });

await page.goto(`${BASE}#/foods`);
await page.screenshot({ path: `${SHOTS}/09-foods.png` });

// 10: mobile
const m = await browser.newContext({ ...devices['iPhone 13'] });
const mp = await m.newPage();
mp.on('pageerror', (e) => errors.push(e.message));
await mp.goto(BASE);
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
ok('10. mobile: no horizontal scroll', !overflow);
await pick(mp, 'עוף', 'עוף');
await pick(mp, 'אורז', 'אורז');
await mp.screenshot({ path: `${SHOTS}/10-mobile-home.png` });
await mp.getByRole('button', { name: 'בדוק צירוף' }).click();
ok('10. mobile result', (await mp.locator('[data-level]').getAttribute('data-level')) === 'red');
await mp.screenshot({ path: `${SHOTS}/11-mobile-result.png`, fullPage: true });
await mp.goto(`${BASE}#/rules`);
ok('10. mobile rules: no page overflow', !(await mp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)));
await mp.screenshot({ path: `${SHOTS}/12-mobile-rules.png` });

await browser.close();
const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra ? ` (${r.extra})` : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} passed; console errors: ${errors.length}`);
errors.forEach((e) => console.log('  console:', e));
process.exit(failed.length || errors.length ? 1 : 0);
