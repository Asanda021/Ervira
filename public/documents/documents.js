/* Progressive enhancement for document previews / verified file downloads */
(()=>{"use strict";
document.querySelectorAll("img[data-doc-preview]").forEach(img=>{
 const reveal=()=>{if(img.naturalWidth>0)img.classList.add("loaded")};
 img.addEventListener("load",reveal,{once:true});
 img.addEventListener("error",()=>{img.removeAttribute("src")},{once:true});
 if(img.complete)reveal();
});
document.querySelectorAll("[data-doc-base]").forEach(async item=>{
 const basename=item.dataset.docBase;
 if(!/^[0-9]{2}_[A-Za-z0-9_]+$/.test(basename))return;
 const files=[
  {ext:"docx",type:/wordprocessingml|octet-stream|application\/zip/i,label:"دریافت فایل ورد"},
  {ext:"pdf",type:/application\/pdf|octet-stream/i,label:"دریافت پی‌دی‌اف"}
 ];
 for(const file of files){
  const url="/documents/downloads/"+basename+"."+file.ext;
  try{
   const response=await fetch(url,{method:"HEAD",cache:"no-store"});
   if(!response.ok||!file.type.test(response.headers.get("content-type")||""))continue;
   let actions=item.querySelector(".document-download-actions");
   if(!actions){actions=document.createElement("div");actions.className="document-download-actions";item.append(actions)}
   const link=document.createElement("a");
   link.href=url;link.download=basename+"."+file.ext;link.className="btn btn-primary";
   link.textContent=file.label;actions.append(link);
   item.classList.add("document-ready");
   const description=item.querySelector("p");if(description)description.textContent="فایل‌های آموزشی این نمونه در صورت تأیید پاسخ سرور، از لینک‌های زیر قابل دریافت‌اند. پیش از استفاده، محتوای آن‌ها را مستقل بازبینی کنید.";
  }catch{ /* No preview of broken URLs */ }
 }
});
})();