const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { fixtures } = require('./elevator-directory-fixture.cjs');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3035';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const output = process.env.TEST_OUTPUT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'elevator-actions-'));
fs.mkdirSync(output, { recursive: true });
async function until(check) {
  for (let i=0;i<100;i++) { if(await check()) return; await new Promise(resolve=>setTimeout(resolve,50)); }
  assert.fail('Expected state did not settle');
}
async function run(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 950 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('tokenReset','true');
    localStorage.setItem('auth-storage',JSON.stringify({state:{token:'synthetic-test-token',role:'ADMIN',tokenTimestamp:Date.now()},version:0}));
  });
  let records=fixtures(), patches=0, deletes=0, fail=false, hold=false, release;
  await context.route('**/api/**',async route=>{
    const req=route.request(), pathname=new URL(req.url()).pathname;
    const send=(json,status=200)=>route.fulfill({json,status});
    if(pathname==='/api/user/access')return send({isAdmin:true,canAccessApproach:true});
    if(pathname==='/api/elevators' && req.method()==='GET')return send(records);
    const record=records.find(item=>pathname===`/api/elevators/${item.id}`);
    if(record && ['PATCH','DELETE'].includes(req.method())){
      const data=req.postDataJSON();
      assert.equal(data.version,record.version,'Version guard included in mutation');
      if(req.method()==='PATCH')patches++;else deletes++;
      if(hold) await new Promise(resolve=>{release=resolve;});
      if(fail)return send({message:'Тестовая ошибка операции'},req.method()==='PATCH'?409:500);
      if(req.method()==='PATCH'){
        Object.assign(record,data,{version:record.version+1});
        return send(record);
      }
      records=records.filter(item=>item.id!==record.id);
      return send({id:record.id});
    }
    if(record)return send(record);
    return send({data:[],total:0});
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try {
    await page.goto(`${base}/admin/elevators`);
    const original=records[0].name;
    const edit=page.getByRole('button',{name:`Редактировать элеватор: ${original}`,exact:true});
    await edit.waitFor();
    await edit.click();
    const editor=page.getByRole('dialog');
    await editor.getByRole('heading',{name:'Редактировать элеватор',exact:true}).waitFor();
    assert.equal(await editor.getByRole('textbox',{name:'Название элеватора',exact:true}).inputValue(),original);
    await page.keyboard.press('Escape');await editor.waitFor({state:'hidden'});
    assert.equal(patches,0);
    await edit.click();
    const newName='Изменённый элеватор';
    await editor.getByRole('textbox',{name:'Название элеватора',exact:true}).fill(newName);
    fail=true;
    await editor.getByRole('button',{name:'Сохранить элеватор',exact:true}).click();
    await editor.getByRole('alert').waitFor();
    assert.equal(await editor.getByRole('textbox',{name:'Название элеватора',exact:true}).inputValue(),newName);
    fail=false;hold=true;
    await editor.getByRole('button',{name:'Сохранить элеватор',exact:true}).click();
    await until(()=>patches===2 && !!release);
    await page.keyboard.press('Escape');assert(await editor.isVisible());
    assert(await editor.getByRole('button',{name:'Сохранение…',exact:true}).isDisabled());
    release();hold=false;release=undefined;
    await editor.waitFor({state:'hidden'});
    await page.getByRole('link',{name:newName,exact:true}).waitFor();
    assert.equal(new URL(page.url()).pathname,'/admin/elevators','List editing does not navigate away');
    assert.equal(records.length,3,'Editing does not create a duplicate');
    const remove=page.getByRole('button',{name:`Удалить элеватор: ${newName}`,exact:true});
    await remove.click();
    const confirm=page.getByRole('alertdialog');
    await confirm.getByRole('heading',{name:'Удалить элеватор?',exact:true}).waitFor();
    await page.screenshot({path:path.join(output,`confirm-${width}.png`),fullPage:true,animations:'disabled'});
    await confirm.getByRole('button',{name:'Отмена',exact:true}).click();
    await confirm.waitFor({state:'hidden'});assert.equal(deletes,0);
    await until(()=>remove.evaluate(el=>el===document.activeElement));
    await remove.click();fail=true;
    await confirm.getByRole('button',{name:'Удалить элеватор',exact:true}).click();
    await confirm.getByRole('alert').waitFor();
    fail=false;hold=true;
    await confirm.getByRole('button',{name:'Удалить элеватор',exact:true}).click();
    await until(()=>deletes===2 && !!release);
    await page.keyboard.press('Escape');assert(await confirm.isVisible());
    assert(await confirm.getByRole('button',{name:'Отмена',exact:true}).isDisabled());
    await confirm.getByRole('button',{name:'Удаление…',exact:true}).evaluate(el=>el.click());
    assert.equal(deletes,2,'Duplicate deletion blocked');
    release();hold=false;release=undefined;
    await confirm.waitFor({state:'hidden'});
    await remove.waitFor({state:'detached'});
    assert.equal(await page.locator('.elevator-directory-table tbody tr').count(),2);
    await until(()=>page.locator('#elevator-directory').evaluate(el=>el===document.activeElement));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:path.join(output,`list-${width}.png`),fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px: edit existing/version/pending/error/retry, no duplicate/navigation, delete cancel/error/retry/lock/focus/cache`);
  } catch(error) {
    await page.screenshot({path:path.join(output,`failure-${width}.png`),fullPage:true,animations:'disabled'});
    throw error;
  } finally {if(release)release();await context.close();}
}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1440,390,320])await run(browser,width);}finally{await browser.close();console.log(`Screenshots: ${output}`);}})().catch(error=>{console.error(error);process.exitCode=1;});
