(() => {
  const root=document.documentElement;
  const saved=localStorage.getItem('ervira-theme');
  const systemDark=window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme',saved||(systemDark?'dark':'light'));

  const toggle=document.querySelector('.theme-toggle');
  const paint=()=>{if(toggle) toggle.textContent=root.getAttribute('data-theme')==='dark'?'☀️':'◐';};
  toggle?.addEventListener('click',()=>{const next=root.getAttribute('data-theme')==='dark'?'light':'dark';root.setAttribute('data-theme',next);localStorage.setItem('ervira-theme',next);paint();});
  paint();

  const menuBtn=document.getElementById('menuBtn');
  const nav=document.querySelector('.nav');
  menuBtn?.addEventListener('click',()=>{
    if(!nav)return;
    const open=nav.classList.toggle('open');
    nav.style.display=open?'flex':'';
    nav.style.position=open?'absolute':'';
    nav.style.top=open?'66px':'';
    nav.style.left=open?'16px':'';
    nav.style.right=open?'16px':'';
    nav.style.padding=open?'16px':'';
    nav.style.background=open?'var(--theme-header,rgba(255,255,255,.95))':'';
    nav.style.border=open?'1px solid var(--theme-border,#dfe7ef)':'';
    nav.style.borderRadius=open?'16px':'';
    nav.style.flexDirection=open?'column':'';
    nav.style.gap=open?'14px':'';
  });
  nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');if(innerWidth<701)nav.style.display='';}));

  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target);}}),{threshold:.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
})();