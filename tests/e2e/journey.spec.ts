import { test,expect,chromium,type Page } from '@playwright/test';
import { mkdtemp,rm,mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { productHtml,searchHtml } from '../fixtures/products';

async function criteria(page:Page){
  await page.goto('http://localhost:5173');
  await page.getByRole('textbox',{name:'Message fits'}).fill('I need wireless headphones for my commute.');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await expect(page.getByText("What's your product-price budget, and which features are must-haves?",{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Message fits'}).fill('$150. Noise cancellation is mandatory; weight and battery life are optional.');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await expect(page.getByText('Great. Where will you use them most?',{exact:true})).toBeVisible();
  await page.getByRole('textbox',{name:'Message fits'}).fill('Mostly on the subway. I would prefer something light with a battery that lasts.');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  await expect(page.getByText('Where would you like to shop?',{exact:true})).toBeVisible();
  await expect(page.locator('.criteria-list li')).toHaveCount(4);
  await expect(page.locator('.priority-badge.mandatory')).toHaveCount(2);
  await expect(page.locator('.priority-badge.optional')).toHaveCount(2);
  await page.getByRole('button',{name:'Set Weight as mandatory',exact:true}).click();
  await expect(page.locator('.priority-badge.mandatory')).toHaveCount(3);
  await page.getByRole('button',{name:'Set Weight as optional',exact:true}).click();
}

test('chat keeps the installation gate inline, persists, and fits a mobile viewport',async({page})=>{
  await criteria(page);
  await page.getByRole('button',{name:'Amazon',exact:true}).click();
  await expect(page.getByRole('heading',{name:'One quick step before Amazon.'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Download extension'})).toHaveAttribute('href','/extension/fits-extension.zip');
  const zip=await page.request.get('/extension/fits-extension.zip');expect(zip.status()).toBe(200);expect((await zip.body()).byteLength).toBeGreaterThan(10000);
  await page.reload();await expect(page.getByText('Where would you like to shop?',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'One quick step before Amazon.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Check connection & open store'})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('button',{name:'Amazon',exact:true})).toBeVisible();
  await mkdir('artifacts/e2e',{recursive:true});await page.screenshot({path:'artifacts/e2e/web-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'New chat',exact:true}).click();await expect(page.getByRole('heading',{name:'What are you shopping for?'})).toBeVisible();
});

test('unpacked extension carries criteria, checks products, and persists comparison history',async()=>{
  const userData=await mkdtemp(path.join(os.tmpdir(),'fits-e2e-'));
  const extension=path.resolve('dist/extension');
  const context=await chromium.launchPersistentContext(userData,{channel:'chromium',headless:true,viewport:{width:1440,height:1000},args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
  const errors:string[]=[];
  const controlledPages=new WeakSet<Page>();
  context.on('page',p=>p.on('pageerror',e=>{
    // The initial extension-created vendor navigation can run before interception.
    // Only our app, extension UI, and verified fixture documents belong to this test.
    if(p.url().startsWith('http://localhost:5173')||p.url().startsWith('chrome-extension://')||controlledPages.has(p))errors.push(e.message);
  }));
  try{
    await context.route('https://www.amazon.com/**',route=>{
      if(route.request().resourceType()!=='document')return route.abort();
      const url=route.request().url();
      if(url.includes('/dp/'))return route.fulfill({contentType:'text/html; charset=utf-8',body:productHtml(url.includes('B0FITST001'),url.includes('B0FITST001'))});
      return route.fulfill({contentType:'text/html; charset=utf-8',body:searchHtml});
    });
    await context.route('https://example.com/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<h1>Unsupported website</h1>'}));
    let worker=context.serviceWorkers()[0];if(!worker)worker=await context.waitForEvent('serviceworker');
    const id=new URL(worker.url()).host;
    const web=await context.newPage();await criteria(web);
    await expect(web.getByText('fits is connected. Your criteria will follow you.',{exact:true})).toBeVisible();
    await mkdir('artifacts/e2e',{recursive:true});await web.screenshot({path:'artifacts/e2e/web-chat.png',fullPage:true});
    await web.getByRole('button',{name:'Amazon',exact:true}).click();
    await expect(web.getByRole('status')).toHaveText('Your criteria are ready in the fits side panel.');
    await expect.poll(()=>context.pages().some(p=>p.url().startsWith('https://www.amazon.com/'))).toBe(true);
    const shop=context.pages().find(p=>p.url().startsWith('https://www.amazon.com/'))!;
    await shop.bringToFront();
    // Re-navigate after attaching to the extension-created tab so its first request
    // cannot escape interception before Playwright observes the new target.
    await shop.goto('https://www.amazon.com/s?k=fits-controlled-fixture');
    await expect(shop.locator('body')).toHaveAttribute('data-fits-fixture','search');
    controlledPages.add(shop);
    await shop.getByRole('link',{name:'AURA H1 — complete product data',exact:true}).click();
    const panel=await context.newPage();await panel.goto(`chrome-extension://${id}/sidepanel.html`);await panel.setViewportSize({width:380,height:914});
    await shop.bringToFront();
    await expect(panel.getByTestId('match-score')).toHaveText('100%');
    await panel.screenshot({path:'artifacts/e2e/extension-analysis.png',fullPage:true});
    await panel.getByRole('button',{name:/Noise cancellation/}).click();await expect(panel.locator('blockquote')).toContainText('Active Noise Cancellation');
    await panel.getByRole('button',{name:/Compared 1/}).click();await expect(panel.locator('.history-card')).toHaveCount(1);
    await shop.bringToFront();await shop.goto('https://www.amazon.com/dp/B0FITST002');
    await panel.getByRole('button',{name:'Current item',exact:true}).click();
    await expect(panel.getByTestId('match-score')).toHaveText('83%');
    await expect(panel.getByText('Unknown',{exact:true})).toBeVisible();
    await shop.bringToFront();await shop.goto('https://example.com/');
    await expect(panel.getByTestId('match-score')).toHaveCount(0);
    await expect(panel.getByRole('heading',{name:'Open a product you like.'})).toBeVisible();
    await shop.goto('https://www.amazon.com/dp/B0FITST002');
    await expect(panel.getByTestId('match-score')).toHaveText('83%');
    await panel.getByRole('button',{name:/Compared 2/}).click();await expect(panel.locator('.history-card')).toHaveCount(2);
    await panel.screenshot({path:'artifacts/e2e/extension-history.png',fullPage:true});
    await panel.getByRole('textbox',{name:'Search compared products'}).fill('does not exist');await expect(panel.getByRole('heading',{name:'No matching products.'})).toBeVisible();
    await panel.getByRole('textbox',{name:'Search compared products'}).fill('');
    await panel.getByRole('button',{name:/View saved result for/}).first().click();await expect(panel.getByText(/Saved result/)).toBeVisible();
    await expect(panel.getByTestId('match-score')).toHaveText('83%');
    await panel.getByRole('button',{name:'Compared items',exact:true}).click();
    await panel.getByRole('button',{name:/Remove .* from comparisons/}).first().click();await expect(panel.locator('.history-card')).toHaveCount(1);
    await panel.reload();await panel.getByRole('button',{name:/Compared 1/}).click();await expect(panel.locator('.history-card')).toHaveCount(1);
    expect(errors).toEqual([]);
  }finally{await context.close();await rm(userData,{recursive:true,force:true});}
});
