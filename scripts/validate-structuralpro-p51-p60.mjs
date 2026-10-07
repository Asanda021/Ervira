import fs from "node:fs";
import path from "node:path";
const ids=Array.from({length:10},(_,i)=>"p"+(i+51));
for(const id of ids){
 const d=JSON.parse(fs.readFileSync(path.join("website","data","structuralpro-"+id+".json"),"utf8"));
 if(d.product_id!=="structuralpro"||d.parent_platform!=="ERVIRA"||d.version!=="0.1.0"||d.runtime_status!=="implemented"||d.release_ready!==false) throw new Error("Commercial parity mismatch "+id);
}
console.log("P51-P60 commercial parity PASS");