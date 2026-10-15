(()=>{"use strict";
const f=[...document.querySelectorAll("[data-kind-filter]")],cards=[...document.querySelectorAll(".folio-card")],search=document.getElementById("folioSearch"),count=document.getElementById("folioCount"),empty=document.getElementById("folioEmpty");
let selected="all";
const normal=s=>s.normalize("NFKC").replace(/[يى]/g,"ی").replace(/ك/g,"ک").toLocaleLowerCase("fa-IR").trim();
function render(){const terms=normal(search?.value||"").split(/\s+/).filter(Boolean);let shown=0;for(const c of cards){const match=(selected==="all"||c.dataset.kind===selected)&&terms.every(t=>normal(c.dataset.search||"").includes(t));c.hidden=!match;if(match)shown++}
count.textContent=shown.toLocaleString("fa-IR")+" نمونه";empty.hidden=shown>0;}
f.forEach(b=>b.addEventListener("click",()=>{selected=b.dataset.kindFilter;f.forEach(x=>{x.classList.toggle("is-active",x===b);x.setAttribute("aria-pressed",String(x===b))});render()}));
search.addEventListener("input",render);render();
const dialog=document.getElementById("folioModal"),img=document.getElementById("folioModalImage"),caption=document.getElementById("folioModalCaption"),close=document.getElementById("folioClose");
document.querySelectorAll("[data-zoom]").forEach(a=>a.addEventListener("click",event=>{if(!dialog?.showModal)return;event.preventDefault();img.src=a.href;img.alt=a.dataset.caption||"پیش‌نمایش نمونه";caption.textContent=a.dataset.caption||"";dialog.showModal();close.focus()}));
close?.addEventListener("click",()=>dialog.close());
dialog?.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});
dialog?.addEventListener("close",()=>{img.removeAttribute("src")});
})();