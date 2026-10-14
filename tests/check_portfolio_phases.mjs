/* Validate genuine 4–7 service portfolio and SVG preview generation without a browser */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=path.resolve("public");
const text=p=>fs.readFileSync(path.join(root,p),"utf8");
const paths= ["websites","automation","content"].flatMap(c=>Array.from({length:10},(_,i)=>c+"/"+String(i+1).padStart(2,"0")+".html"));
for(const p of paths){
  assert.ok(fs.existsSync(path.join(root,p)),p+" missing");
  let html=text(p);
  assert.match(html,/lang="fa" dir="rtl"/,p+" RTL");
  assert.match(html,/<title>[^<]+<\/title>/,p+" title");
  assert.match(html,/نمونه مستقل|نمونه.+آموزشی|بدون سفارش‌دهنده|اطلاعات ساختگی/,p+" sample honesty");
}
for(const cat of ["websites","automation","content"])assert.ok(fs.existsSync(path.join(root,cat,"index.html")));
const websites=text("websites/sites.js");
assert.doesNotThrow(()=>new vm.Script(websites));
for(let i=1;i<=10;i++)assert.match(websites,new RegExp("(?:^|\\n)"+i+"\\(\\)\\{"));
assert.equal((websites.match(/(?:^|\n)\d+\(\)\{/g)||[]).length,10);
assert.match(websites,/ثبت.+نشده|هیچ.+واقعی|بدون.+واقعی|ارسال.+نشده/);
for(let i=1;i<=10;i++){
  const k=String(i).padStart(2,"0");
  assert.ok(fs.existsSync(path.join(root,"content/files",k+".md")));
  assert.match(text("content/"+k+".html"),new RegExp('/content/files/'+k+'\\.md'));
}
for(const f of ["automation/ervira_automation.py","automation/data/sales_a.csv","automation/data/sales_b.csv","automation/data/contacts.csv","automation/data/invoice.csv","automation/data/ledger_a.csv","automation/data/ledger_b.csv"])assert.ok(fs.existsSync(path.join(root,f)));
const graphics=text("graphics/graphics.js");
for(let i=1;i<=10;i++){const f="graphics/assets/"+String(i).padStart(2,"0")+".svg";assert.ok(fs.existsSync(path.join(root,f)),f+" not exported");assert.match(text(f),/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);}

assert.doesNotThrow(()=>new vm.Script(graphics));
const prev=[];
const previews=Array.from({length:10},(_,i)=>({dataset:{graphicPreview:String(i+1)},set src(v){prev[i]=v;}}));
const downloads=Array.from({length:10},(_,i)=>({dataset:{downloadVector:String(i+1)},addEventListener(type,callback){this.callback=callback}}));
const query=s=>s==="[data-graphic-preview]"?previews:s==="[data-download-vector]"?downloads:[];
vm.runInNewContext(graphics,{
 document:{querySelectorAll:query},
 URL:{createObjectURL:()=>"",revokeObjectURL:()=>{}},
 Blob:class {constructor(x){this.data=x}},
 setTimeout:()=>{},
 console
});
assert.equal(prev.length,10);
const svg=prev.map(p=>decodeURIComponent(p.split(",").slice(1).join(",")));
assert.equal(new Set(svg).size,10,"Artwork should be distinct");
for(const s of svg){assert.ok(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));assert.ok(s.includes('xmlns="http://www.w3.org/2000/svg"'));assert.ok(s.endsWith("</svg>"));assert.ok(s.includes("نمونه‌کار برداری مستقل"));assert.ok(!/<script|onload\s*=|javascript:/i.test(s));}
// Persian typography contract: every SVG has a language tag and the sample label is legible.
const luminance=hex=>{
 const normalized=hex.replace(/^#/,"");
 const rgb=[0,2,4].map(i=>parseInt(normalized.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
for(const [i,source] of svg.entries()){
 assert.match(source,/xml:lang="fa"/,"SVG "+(i+1)+" must declare Persian");
 const bg=source.match(/<rect x="0" y="0" width="1000" height="800"[^>]*fill="(#[0-9a-fA-F]{6})"/)?.[1];
 const footer=[...source.matchAll(/<text ([^>]+)>نمونه‌کار برداری مستقل<\/text>/g)].at(-1)?.[1];
 const fg=footer?.match(/fill="(#[0-9a-fA-F]{6})"/)?.[1];
 assert.ok(bg&&fg,"SVG "+(i+1)+" missing background/footer colors");
 assert.ok(ratio(bg,fg)>=4.5,"SVG "+(i+1)+" footer contrast below 4.5:1");
 for(const match of source.matchAll(/<text x="([0-9.]+)" y="([0-9.]+)"[^>]*>/g)){
   const x=Number(match[1]),y=Number(match[2]);
   assert.ok(x>=0&&x<=1000&&y>=0&&y<=800,"SVG "+(i+1)+" text anchor outside canvas");
 }
}

assert.ok(downloads.every(x=>typeof x.callback==="function"),"10 independent SVG download controls");
console.log("PASS: 30 published HTML samples + 10 distinct SVGs + 10 Markdown sources + 6 fixture CSVs + strict syntax checks");
