(() => {
  const saved = localStorage.getItem('ervira-theme');
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', initial);

  const menuBtn=document.getElementById('menuBtn');
  const nav=document.querySelector('.nav');
  const langBtn=document.getElementById('langBtn');
  menuBtn?.addEventListener('click',()=>{
    nav?.classList.toggle('open');
    if(nav){
      nav.style.display=nav.classList.contains('open')?'flex':'';
      nav.style.position='absolute'; nav.style.top='68px'; nav.style.left='18px'; nav.style.right='18px';
      nav.style.padding='18px'; nav.style.background='var(--theme-header)';
      nav.style.border='1px solid var(--theme-border)'; nav.style.borderRadius='16px'; nav.style.flexDirection='column';
    }
  });
  langBtn?.addEventListener('click',()=>alert('نسخه انگلیسی در فاز محتوایی تکمیل می‌شود.'));

  const header=document.querySelector('.site-header');
  if(header && !document.querySelector('.theme-toggle')){
    const b=document.createElement('button');
    b.className='theme-toggle';
    b.type='button';
    b.setAttribute('aria-label','تغییر حالت نمایش');
    b.setAttribute('title','تغییر حالت روشن / تیره');
    const paint=()=>{ const dark=document.documentElement.getAttribute('data-theme')==='dark'; b.textContent=dark?'☀️':'🌙'; };
    b.addEventListener('click',()=>{
      const next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
      document.documentElement.setAttribute('data-theme',next);
      localStorage.setItem('ervira-theme',next);
      paint();
    });
    const anchor=header.querySelector('.lang');
    header.insertBefore(b,anchor||header.firstChild);
    paint();
  }
})();