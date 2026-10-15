(()=>{'use strict';
document.querySelectorAll('img[data-prs-preview]').forEach(img=>{
 const loaded=()=>{if(img.naturalWidth>0){img.classList.add('is-loaded');const p=img.closest('.prs-image');if(p){const tag=p.querySelector('.prs-card-tag');if(tag)tag.textContent='پیش‌نمایش واقعی PDF';}}};
 img.addEventListener('load',loaded,{once:true});img.addEventListener('error',()=>img.removeAttribute('src'),{once:true});if(img.complete)loaded();
});
document.querySelectorAll('[data-prs-base]').forEach(async node=>{
 const base=node.dataset.prsBase;
 if(!/^[0-9]{2}_[A-Za-z0-9_]+$/.test(base))return;
 for(const [ext,label,mime] of [['pptx','دریافت پاورپوینت',/presentationml|octet-stream|application\/zip/i],['pdf','دریافت پی‌دی‌اف',/application\/pdf|octet-stream/i]]){
  try{
   const url='/presentations/downloads/'+base+'.'+ext;
   const result=await fetch(url,{method:'HEAD',cache:'no-store'});
   if(!result.ok||!mime.test(result.headers.get('content-type')||''))continue;
   const link=document.createElement('a');link.href=url;link.download=base+'.'+ext;link.textContent=label;
   node.querySelector('.prs-ready-links')?.append(link);node.classList.add('is-ready');
   const description=node.querySelector('p');if(description)description.textContent='نسخه آموزشی این ارائه از لینک‌های زیر قابل دریافت است؛ پیش از استفاده، اسلایدها و داده‌های نمونه را بازبینی کنید.';
  }catch{ /* Never expose nonexistent links */ }
 }
});
})();