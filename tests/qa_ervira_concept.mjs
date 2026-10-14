import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const url="http://127.0.0.1:8765/concept/";
const root=path.resolve("public");
const assertExists=p=>{
 const file=path.join(root,p.replace(/^\//,""));
 const target=p.endsWith("/")?path.join(file,"index.html"):file;
 assert.ok(fs.existsSync(target),"Missing resource: "+p);
};
for(const f of ["concept/index.html","concept/concept.css","concept/concept.js","concept/case-sales.html"]){
 assert.ok(fs.statSync(path.join(root,f)).size>0);
}
const source=fs.readFileSync(path.join(root,"concept/index.html"),"utf8");
const links=[...source.matchAll(/\b(?:href|src)="(\/[^"]+)"/g)].map(m=>m[1]);
for(const link of links)assertExists(link);
assert.match(source,/<html lang="fa" dir="rtl">/);
assert.match(source,/name="robots" content="noindex,nofollow"/);
assert.match(source,/نمونه‌ها مستقل و آموزشی‌اند/);
assert.ok(!/mailto:hello@ervira\.ir/.test(source));
const script=fs.readFileSync(path.join(root,"concept/concept.js"),"utf8");
assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/.test(script));
fs.mkdirSync("concept-qa",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
try {
 for(const width of [360,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
  const errs=[];page.on("pageerror",e=>errs.push(String(e)));
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:25000});
  assert.equal(response?.status(),200);
  await page.locator(".work-card").first().waitFor();
  for(const image of await page.locator(".real-preview img").all()){
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(async img=>{
      if(!img.complete)await new Promise(resolve=>{
        img.addEventListener("load",resolve,{once:true});
        img.addEventListener("error",resolve,{once:true});
        setTimeout(resolve,8000);
      });
    });
  }
  await page.evaluate(()=>window.scrollTo(0,0));
  const size=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,cards:document.querySelectorAll(".work-card").length,images:[...document.querySelectorAll(".real-preview img")].map(x=>({complete:x.complete,width:x.naturalWidth}))}));
  assert.equal(size.cards,6);
  assert.ok(size.scroll<=size.viewport+1,"Horizontal overflow at "+width+": "+size.scroll+"/"+size.viewport);
  for(const img of size.images)assert.ok(img.complete&&img.width>0,"Real preview missing at "+width);
  if(width<=768){
    await page.locator("#navToggle").click();
    assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"),"true");
    assert.ok(await page.locator("#siteNav").isVisible());
    await page.locator("#siteNav a[href='#selected']").click();
    assert.equal(await page.locator("#navToggle").getAttribute("aria-expanded"),"false");
  }
  await page.locator('[data-filter="digital"]').click();
  assert.equal(await page.locator(".work-card:visible").count(),2);
  await page.locator('[data-filter="all"]').click();
  assert.equal(await page.locator(".work-card:visible").count(),6);
  await page.locator("#briefNeed").fill("فایل‌های هفتگی فروش باید در یک گزارش روشن کنار هم قرار بگیرند.");
  await page.locator("#briefForm button[type=submit]").click();
  assert.ok(await page.locator("#briefResult").isVisible());
  const value=await page.locator("#briefPreview").inputValue();
  assert.match(value,/از سایت ارسال یا ثبت نشده است/);
  assert.equal(errs.length,0,"Browser JavaScript errors: "+errs.join("; "));
  await page.screenshot({path:"concept-qa/home-"+width+".png",fullPage:true,animations:"disabled"});
  await page.close();
  results.push({viewport:width,overflow:false,filters:true,form:true,images:true});
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(url+"case-sales.html",{waitUntil:"domcontentloaded",timeout:25000});
 assert.ok(await page.locator(".case-proof img").evaluate(img=>img.naturalWidth>0));
 assert.equal(await page.locator('.case-meta a[download]').getAttribute("href"),"/excel/downloads/01_ERVIRA_Sales_Intelligence.xlsx");
 const layout=await page.evaluate(()=>({w:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth}));
 if(layout.sw>layout.w+1){console.error("CASE_OVERFLOW_DETAILS",JSON.stringify(await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll("*")].map(el=>({tag:el.tagName,cls:String(el.className||"").slice(0,60),text:el.textContent?.trim().slice(0,55),right:Math.round(el.getBoundingClientRect().right),left:Math.round(el.getBoundingClientRect().left),width:Math.round(el.getBoundingClientRect().width)})).filter(x=>x.right>window.innerWidth+1||x.left< -1).slice(0,35)}))));}
 assert.ok(layout.sw<=layout.w+1,"Case study overflow");
 await page.screenshot({path:"concept-qa/case-sales-390.png",fullPage:true,animations:"disabled"});
 await page.close();
 console.log("PASS: responsive concept, 4 viewport sizes, image files, real CTA, filters, mobile nav and honest local form",JSON.stringify(results));
}finally{await browser.close();}
