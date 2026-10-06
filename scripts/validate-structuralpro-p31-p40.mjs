const fs=require("fs"),path=require("path");
const ids=Array.from({length:10},(_,i)=>"p"+(i+31));
for(const id of ids){const d=JSON.parse(fs.readFileSync(path.join("website/data","structuralpro-"+id+".json"),"utf8"));if(d.product_id!=="structuralpro"||d.parent_platform!=="ERVIRA"||d.version!=="0.1.0"||d.runtime_status!=="not_implemented"||d.release_ready!==false)throw Error("Governance mismatch "+id)}
console.log("P31-P40 parity PASS")