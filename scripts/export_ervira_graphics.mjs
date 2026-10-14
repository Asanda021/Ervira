#!/usr/bin/env node
/* Export ten deterministic, original SVG artwork files from existing ERVIRA artwork engine. */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=path.resolve("public","graphics");
const script=fs.readFileSync(path.join(root,"graphics.js"),"utf8");
const svgUrls=[];
const images=Array.from({length:10},(_,i)=>({dataset:{graphicPreview:String(i+1)},set src(value){svgUrls[i]=value}}));
const fakeDocument={querySelectorAll(selector){return selector==="[data-graphic-preview]"?images:[]}};
vm.runInNewContext(script,{document:fakeDocument}, {timeout:2000});
if(svgUrls.length!==10||svgUrls.some(x=>typeof x!=="string"))throw new Error("Expected all 10 graphics");
const content=svgUrls.map(u=>decodeURIComponent(u.split(",").slice(1).join(",")));
if(new Set(content).size!==10)throw new Error("Duplicate graphics");
const dest=path.join(root,"assets");
fs.mkdirSync(dest,{recursive:true});
for(let i=0;i<10;i++){
 const item=content[i];
 if(!item.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')||!item.endsWith("</svg>"))throw new Error("Invalid SVG envelope");
 if(/<script\b|onload\s*=|javascript:/i.test(item))throw new Error("Unexpected active content");
 if(!item.includes("نمونه‌کار برداری مستقل"))throw new Error("Missing educational label");
 const name=String(i+1).padStart(2,"0")+".svg";
 fs.writeFileSync(path.join(dest,name),item+"\n",{encoding:"utf8",flag:"w"});
 console.log("EXPORTED",name,item.length,"characters");
}
