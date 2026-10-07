import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const htmlFiles=[
  "index.html","products.html","product-family.html","pricing.html","compare.html","guide.html","docs.html","legal.html",
  "account.html","checkout.html","dashboard.html",
  "products/structuralpro.html","products/structurecalc.html","products/estimatepro.html","products/officepro.html","products/sitepro.html","products/engineerai.html",
  "catalog/structuralpro.html","catalog/structurecalc.html","catalog/estimatepro.html","catalog/officepro.html","catalog/sitepro.html","catalog/engineerai.html"
];
const privatePages=new Set(["account.html","checkout.html","dashboard.html"]);
const errors=[];
const canonicalSet=new Map();
for(const file of htmlFiles){
  const full=path.join(root,file);
  if(!fs.existsSync(full)){errors.push(`missing file: ${file}`);continue;}
  const html=fs.readFileSync(full,"utf8");
  const required=[
    [/<title>[^<]{5,200}<\/title>/i,"title"],
    [/<meta\s+name="description"\s+content="[^"]{5,320}"/i,"description"],
    [/<meta\s+name="robots"\s+content="(index,follow|noindex,nofollow)"/i,"robots"],
    [/<link\s+rel="canonical"\s+href="https:\/\/ervira\.ir\//i,"canonical"],
    [/<meta\s+property="og:title"/i,"og:title"],
    [/<meta\s+property="og:description"/i,"og:description"],
    [/<meta\s+property="og:url"/i,"og:url"],
    [/<meta\s+name="twitter:card"/i,"twitter:card"],
    [/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,"json-ld"]
  ];
  for(const [re,name] of required) if(!re.test(html)) errors.push(`${file}: missing/invalid ${name}`);
  const cm=html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if(cm){ if(canonicalSet.has(cm[1])) errors.push(`duplicate canonical: ${cm[1]} in ${file} and ${canonicalSet.get(cm[1])}`); else canonicalSet.set(cm[1],file); }
  const rm=html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  if(privatePages.has(file) && rm?.[1]!=="noindex,nofollow") errors.push(`${file}: private page must be noindex,nofollow`);
  if(!privatePages.has(file) && rm?.[1]!=="index,follow") errors.push(`${file}: public page must be index,follow`);
}
const robots=fs.readFileSync(path.join(root,"robots.txt"),"utf8");
if(!/Sitemap:\s*https:\/\/ervira\.ir\/sitemap\.xml/i.test(robots)) errors.push("robots.txt: sitemap directive missing");
const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
if(!/^<\?xml/.test(sitemap) || !/<urlset[^>]*sitemaps\.org\/schemas\/sitemap\/0\.9/.test(sitemap)) errors.push("sitemap.xml: invalid root");
for(const file of ["index.html","products.html","product-family.html","pricing.html","compare.html","guide.html","docs.html","legal.html","products/structuralpro.html","products/structurecalc.html","products/estimatepro.html","products/officepro.html","products/sitepro.html","products/engineerai.html"]){
  const url="https://ervira.ir/"+file.replace(/^index\.html$/,"").replace(/\\/g,"/");
  if(!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap.xml: missing ${url}`);
}
if(errors.length){console.error(errors.map(e=>`✖ ${e}`).join("\n"));process.exit(1);}
console.log(`SEO validation passed: ${htmlFiles.length} HTML pages + robots.txt + sitemap.xml`);
