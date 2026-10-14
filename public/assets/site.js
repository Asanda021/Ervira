(() => {
'use strict';
const $=id=>document.getElementById(id),fmt=n=>Math.round(Number(n)||0).toLocaleString('fa-IR');
const download=(name,content,mime='text/plain;charset=utf-8')=>{
const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
};
const navToggle=$('navToggle'),nav=$('mainNav');
navToggle?.addEventListener('click',()=>{const open=navToggle.getAttribute('aria-expanded')!=='true';navToggle.setAttribute('aria-expanded',String(open));nav?.classList.toggle('open',open);});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');navToggle?.setAttribute('aria-expanded','false');}));
if($('dashboardApp')){
const sets={
studio:{name:'استودیو خدمات دیجیتال',months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور'],income:[18,24,21,31,35,42],cost:[12,16,17,19,22,24]},
store:{name:'فروشگاه فرضی',months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور'],income:[38,41,46,44,58,64],cost:[25,28,31,30,37,40]},
office:{name:'دفتر خدماتی',months:['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور'],income:[16,19,22,27,29,34],cost:[10,12,14,16,18,20]}};
const render=()=>{const d=sets[$('projectType').value]||sets.studio;const income=d.income.reduce((a,b)=>a+b,0),cost=d.cost.reduce((a,b)=>a+b,0);
$('incomeTotal').textContent=fmt(income)+' میلیون';$('costTotal').textContent=fmt(cost)+' میلیون';$('profitTotal').textContent=fmt(income-cost)+' میلیون';$('projectName').textContent=d.name;
const max=Math.max(...d.income,...d.cost);$('dashboardBars').replaceChildren();$('dashboardLabels').replaceChildren();$('dashboardRows').replaceChildren();
d.months.forEach((month,i)=>{const group=document.createElement('div');group.className='chart-group';[d.income[i],d.cost[i]].forEach((v,j)=>{const bar=document.createElement('span');if(j)bar.className='expense';bar.style.setProperty('--bar-h',(v/max*100)+'%');bar.title=month+': '+(j?'هزینه ':'درآمد ')+fmt(v)+' میلیون تومان';group.append(bar);});$('dashboardBars').append(group);
const label=document.createElement('span');label.textContent=month;$('dashboardLabels').append(label);const tr=document.createElement('tr');[month,fmt(d.income[i])+' میلیون',fmt(d.cost[i])+' میلیون',fmt(d.income[i]-d.cost[i])+' میلیون'].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td);});$('dashboardRows').append(tr);});
};
$('projectType').addEventListener('change',render);$('dashboardCsv').addEventListener('click',()=>{const d=sets[$('projectType').value]||sets.studio;const rows=[['ماه','درآمد (میلیون تومان)','هزینه (میلیون تومان)','مانده (میلیون تومان)'],...d.months.map((m,i)=>[m,d.income[i],d.cost[i],d.income[i]-d.cost[i]])];download('ervira-dashboard-sample.csv','\ufeff'+rows.map(r=>r.join(',')).join('\r\n'),'text/csv;charset=utf-8');});render();
}
if($('textApp')){
const source=$('sourceText'),result=$('resultText');
const clean=()=>{let s=source.value.replace(/\u064A/g,'ی').replace(/\u0643/g,'ک').replace(/[\u064B-\u065F\u0670]/g,'').replace(/\u0640/g,'');
if($('persianDigits').checked)s=s.replace(/[0-9٠-٩]/g,ch=>{const n=ch.charCodeAt(0);const v=n>=0x660&&n<=0x669?n-0x660:n>=48&&n<=57?n-48:0;return String.fromCharCode(0x6f0+v);});
if($('cleanSpaces').checked)s=s.replace(/[ \t]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
if($('persianPunct').checked)s=s.replace(/,/g,'،').replace(/;/g,'؛').replace(/\?/g,'؟');
result.value=s;$('textChars').textContent=fmt(s.length);$('textWords').textContent=fmt((s.trim().match(/[^\s]+/g)||[]).length);$('textLines').textContent=fmt(s?s.split('\n').length:0);};
source.addEventListener('input',clean);['persianDigits','cleanSpaces','persianPunct'].forEach(id=>$(id).addEventListener('change',clean));
$('copyText').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(result.value);$('textStatus').textContent='متن کپی شد.';}catch{result.focus();result.select();$('textStatus').textContent='متن انتخاب شد؛ آن را دستی کپی کنید.';}});
$('saveText').addEventListener('click',()=>download('ervira-clean-text.txt','\ufeff'+result.value));$('clearText').addEventListener('click',()=>{source.value='';clean();$('textStatus').textContent='';});clean();
}
if($('invoiceApp')){
const tbody=$('itemRows');let serial=0;
const lines=()=>[...tbody.rows].map(r=>{const x=r.querySelectorAll('input');return{name:x[0].value,qty:Math.max(0,Number(x[1].value)||0),price:Math.max(0,Number(x[2].value)||0)};});
function recalc(){const data=lines(),sum=data.reduce((s,x)=>s+x.qty*x.price,0),d=Math.min(100,Math.max(0,Number($('discountRate').value)||0)),t=Math.min(100,Math.max(0,Number($('taxRate').value)||0));[...tbody.rows].forEach((row,i)=>row.querySelector('.item-total').textContent=fmt(data[i].qty*data[i].price));$('invoiceSubtotal').textContent=fmt(sum)+' تومان';$('invoiceTotal').textContent=fmt(sum*(1-d/100)*(1+t/100))+' تومان';$('invoiceCount').textContent=fmt(data.length);}
const addRow=(label='',qty=1,price=0)=>{const tr=document.createElement('tr');tr.dataset.key=String(++serial);const make=(type,val,aria)=>{const input=document.createElement('input');input.type=type;input.value=val;input.setAttribute('aria-label',aria);if(type==='number'){input.min='0';input.step='any';input.inputMode='decimal';}input.addEventListener('input',recalc);return input;};
const td1=document.createElement('td');td1.append(make('text',label,'شرح خدمت'));const td2=document.createElement('td');td2.append(make('number',qty,'تعداد'));const td3=document.createElement('td');td3.append(make('number',price,'قیمت واحد'));const td4=document.createElement('td');td4.className='item-total';const td5=document.createElement('td');const rm=document.createElement('button');rm.type='button';rm.textContent='حذف';rm.setAttribute('aria-label','حذف ردیف');rm.addEventListener('click',()=>{tr.remove();recalc();});td5.append(rm);tr.append(td1,td2,td3,td4,td5);tbody.append(tr);recalc();};
$('addItem').addEventListener('click',()=>addRow());['discountRate','taxRate'].forEach(id=>$(id).addEventListener('input',recalc));
$('invoiceCsv').addEventListener('click',()=>{const q=s=>'"'+String(s).replace(/"/g,'""')+'"';const data=lines(),sum=data.reduce((s,x)=>s+x.qty*x.price,0),d=Math.min(100,Math.max(0,Number($('discountRate').value)||0)),t=Math.min(100,Math.max(0,Number($('taxRate').value)||0));
const rows=[['شرح','تعداد','مبلغ واحد (تومان)','جمع (تومان)'],...data.map(x=>[x.name,x.qty,x.price,x.qty*x.price]),['جمع جزء','','',sum],['تخفیف (درصد)','','',d],['مالیات (درصد)','','',t],['مبلغ نهایی','','',sum*(1-d/100)*(1+t/100)]];
download('ervira-estimate-sample.csv','\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n'),'text/csv;charset=utf-8');});
$('invoicePrint').addEventListener('click',()=>window.print());addRow('طراحی قالب ارائه',1,1800000);addRow('مرتب‌سازی و تحلیل داده',2,650000);addRow('تهیه گزارش نهایی',1,900000);
}
if($('slideApp')){
const slides=[...document.querySelectorAll('.slide-view')];let pos=0;const render=()=>{slides.forEach((s,i)=>{s.classList.toggle('active',i===pos);s.setAttribute('aria-hidden',String(i!==pos));});$('slidePosition').textContent=fmt(pos+1)+' / '+fmt(slides.length);$('prevSlide').disabled=pos===0;$('nextSlide').disabled=pos===slides.length-1;};const move=n=>{pos=Math.max(0,Math.min(slides.length-1,pos+n));render();};$('prevSlide').addEventListener('click',()=>move(-1));$('nextSlide').addEventListener('click',()=>move(1));document.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select'))return;if(e.key==='ArrowLeft')move(1);if(e.key==='ArrowRight')move(-1);});render();
}
})();