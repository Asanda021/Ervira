(()=>{
"use strict";
const buttons=[...document.querySelectorAll("[data-filter]")],cards=[...document.querySelectorAll("[data-category]")];
buttons.forEach(button=>button.addEventListener("click",()=>{
  const key=button.dataset.filter;
  buttons.forEach(b=>{const isOn=b===button;b.classList.toggle("active",isOn);b.setAttribute("aria-pressed",String(isOn));});
  let count=0;
  cards.forEach(card=>{const visible=key==="all"||card.dataset.category===key;card.hidden=!visible;if(visible)count++;});
  const counter=document.querySelector("#shownCount");if(counter)counter.textContent=count.toLocaleString("fa-IR");
}));
document.querySelectorAll("img[data-preview]").forEach(img=>{
  img.addEventListener("load",()=>{if(img.naturalWidth>0){img.classList.add("is-loaded");const mark=img.closest(".excel-media")?.querySelector(".thumb-mark");if(mark)mark.textContent="تصویر واقعی نمونه‌کار";}}, {once:true});
  img.addEventListener("error",()=>{img.removeAttribute("src");}, {once:true});
  if(img.complete&&img.naturalWidth>0){img.classList.add("is-loaded");}
});
document.querySelectorAll("[data-file]").forEach(async pane=>{
  const filename=pane.dataset.file;if(!/^[a-zA-Z0-9_.-]+[.]xlsx$/.test(filename))return;
  const url="/excel/downloads/"+encodeURIComponent(filename);
  try{
    const res=await fetch(url,{method:"HEAD",cache:"no-store"});
    if(res.ok&&/spreadsheet|openxmlformats|octet-stream|application\/zip/i.test(res.headers.get("content-type")||"")){
      const a=pane.querySelector(".download-ready");
      if(a){a.href=url;a.download=filename;pane.classList.add("is-ready");}
    }
  }catch{ /* Keep pending state; never show a broken download. */ }
});
})();