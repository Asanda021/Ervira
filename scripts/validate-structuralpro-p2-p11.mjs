const fs = require("fs");
const path = require("path");
const https = require("https");
const root = process.cwd();
const files = Array.from({length:10}, (_,i)=>"p"+String(i+2).padStart(2,"0"));
function read(p){ return JSON.parse(fs.readFileSync(path.join(root,p),"utf8")); }
function fetchJson(url){
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{ let data=""; res.on("data",c=>data+=c); res.on("end",()=>res.statusCode===200?resolve(JSON.parse(data)):reject(new Error("HTTP "+res.statusCode))); }).on("error",reject);
  });
}
(async()=>{
  const canonical=await fetchJson("https://raw.githubusercontent.com/Asanda021/StructuralPro/main/contracts/product-contract.json");
  for(const id of files){
    const local=read("website/data/structuralpro-"+id+".json");
    if(local.product_id!==canonical.product_id || local.parent_platform!==canonical.parent_platform || local.version!==canonical.product.current_version || local.phase!==id.toUpperCase()) throw new Error("Parity mismatch: "+id);
  }
  const p2=read("website/data/structuralpro-p02.json");
  const a=Object.fromEntries(canonical.capabilities.map(x=>[x.id,x.status]));
  const b=Object.fromEntries(p2.capabilities.map(x=>[x.id,x.status]));
  if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error("P2 capability mismatch");
  const p4=read("website/data/structuralpro-p04.json");
  if(p4.release.download_enabled!==false || p4.release.artifact!==null || p4.release.sha256!==null) throw new Error("P4 download gate violated");
  const p3=read("website/data/structuralpro-p03.json");
  if(p3.editions.some(x=>x.status!=="planned")) throw new Error("P3 edition gate violated");
  console.log("ERVIRA StructuralPro P2-P11 parity: PASS");
})().catch(err=>{console.error(err);process.exit(1)});
