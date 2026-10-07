(() => {
  const DATA_URL = 'data/structuralpro-product-family.json';
  const editionGrid = document.getElementById('editionGrid');
  const catalogRoot = document.getElementById('catalogRoot');
  const categoryNav = document.getElementById('categoryNav');
  const search = document.getElementById('productSearch');
  const typeFilter = document.getElementById('typeFilter');
  const domainFilter = document.getElementById('domainFilter');
  const statusFilter = document.getElementById('statusFilter');
  let data = null, activeCategory = 'all';

  const statusMap = {
    'Part of StructuralPro': ['Included in StructuralPro','included'],
    'Coming Soon': ['Coming Soon','soon'],
    'Available': ['Available','included'],
    'Add-on': ['Add-on','soon']
  };
  const domainMap = {
    takeoff:['Takeoff','BOQ','BIM'], pricebook:['Pricebook'], financial:['Financial'], ai:['AI'],
    documents:['Documents','Reports'], commercial:['Commercial']
  };

  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function renderEditions(){
    editionGrid.innerHTML = data.editions.map((e,i)=>`<article class="edition-card ${i===2?'featured':''}">
      <small>0${i+1} / CORE EDITION</small><h3>${esc(e.name)}</h3><p>${esc(e.description)}</p>
      <ul>${e.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><span style="font-size:8px;color:#8192a4;margin-bottom:10px">${esc(e.audience)}</span><a href="products/structuralpro.html">${esc(e.cta)} ←</a>
    </article>`).join('');
  }
  function productRecord(item, cat){
    const [id,name,type,status] = item;
    const domains = domainMap[cat.id] || [];
    return {id,name,type,status,cat,domains};
  }
  function matches(p){
    const q=(search.value||'').trim().toLowerCase();
    const type=typeFilter.value, domain=domainFilter.value, status=statusFilter.value;
    if(q && !(p.name.toLowerCase().includes(q)||p.cat.name.toLowerCase().includes(q)||p.cat.fa.toLowerCase().includes(q))) return false;
    if(type && p.type!==type) return false;
    if(domain && !p.domains.includes(domain)) return false;
    if(status){
      const canonical=p.status==='Part of StructuralPro'?'Included in StructuralPro':p.status;
      if(canonical!==status) return false;
    }
    if(activeCategory!=='all' && p.cat.id!==activeCategory) return false;
    return true;
  }
  function renderNav(){
    categoryNav.innerHTML = '<button class="active" data-cat="all">همه</button>'+data.categories.map(c=>`<button data-cat="${c.id}">${esc(c.fa)}</button>`).join('');
    categoryNav.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.cat;categoryNav.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderCatalog();}));
  }
  function renderCatalog(){
    const blocks=data.categories.map(cat=>{
      const products=cat.items.map(x=>productRecord(x,cat)).filter(matches);
      if(!products.length)return '';
      return `<section class="catalog-category" id="cat-${cat.id}"><div class="catalog-category-head"><div><span class="kicker">${esc(cat.name.toUpperCase())}</span><h3>${esc(cat.fa)}</h3></div><span>${products.length} محصول</span></div><div class="product-grid-family">${products.map(p=>{
        const [label,cls]=statusMap[p.status]||[p.status,''];
        return `<article class="family-card" tabindex="0" data-product="${esc(p.id)}"><span class="product-type">${esc(p.type)}</span><h4>${esc(p.name)}</h4><p>${esc(p.cat.name)} · ${esc(p.cat.fa)}</p><span class="status-pill ${cls}">${esc(label)}</span></article>`;
      }).join('')}</div></section>`;
    }).join('');
    catalogRoot.innerHTML=blocks||'<div class="family-empty">محصولی با این فیلترها پیدا نشد.</div>';
    catalogRoot.querySelectorAll('.family-card').forEach(card=>{card.addEventListener('click',()=>openProduct(card.dataset.product));card.addEventListener('keydown',e=>{if(e.key==='Enter')openProduct(card.dataset.product);});});
  }
  function openProduct(id){
    let p=null; for(const c of data.categories){const item=c.items.find(x=>x[0]===id);if(item){p=productRecord(item,c);break;}}
    if(!p)return;
    const [label]=statusMap[p.status]||[p.status];
    const modal=document.createElement('div');modal.className='pf-modal open';modal.innerHTML=`<div class="pf-modal-card" role="dialog" aria-modal="true"><button class="pf-modal-close" aria-label="بستن">×</button><span class="kicker">${esc(p.cat.name)}</span><h3>${esc(p.name)}</h3><div class="pf-modal-meta"><span>${esc(p.type)}</span><span>${esc(label)}</span><span>StructuralPro</span></div><p>این آیتم در خانواده محصولات StructuralPro برای حوزه ${esc(p.cat.fa)} تعریف شده است. جزئیات اجرایی، انتشار مستقل و قیمت فقط پس از تأیید رسمی کاتالوگ و وضعیت انتشار نمایش داده خواهد شد.</p><ul><li>نوع محصول: ${esc(p.type)}</li><li>وضعیت: ${esc(label)}</li><li>محصول مادر: StructuralPro Platform</li><li>انتشار مستقل: ${p.type==='Standalone'?'بله، پس از انتشار رسمی':'خیر / وابسته به پلتفرم'}</li></ul><div class="modal-note">قیمت و دکمه خرید در این صفحه عمداً فقط برای اقلامی نمایش داده می‌شود که قیمت رسمی و وضعیت انتشار تأیید شده داشته باشند.</div><div class="modal-actions"><a class="btn primary" href="products/structuralpro.html">مشاهده StructuralPro ←</a><button class="btn ghost" type="button">درخواست اطلاعات</button></div></div>`;
    document.body.appendChild(modal);modal.querySelector('.pf-modal-close').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  }
  async function init(){
    try{const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('catalog unavailable');data=await r.json();renderEditions();renderNav();renderCatalog();}
    catch(e){catalogRoot.innerHTML='<div class="family-empty">کاتالوگ محصولات در حال آماده‌سازی است.</div>';}
    [search,typeFilter,domainFilter,statusFilter].forEach(el=>el.addEventListener('input',renderCatalog));
  }
  init();
})();