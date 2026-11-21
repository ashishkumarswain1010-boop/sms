/* Asset inventory + category modules (street lights, rooftop, plants, pumps). Page behaviour is set by <body data-view data-cat>. */
(()=>{
const B=document.body.dataset,view=B.view||'all',cats=(B.cat||'').split(',').filter(Boolean);
const UI=APP_DATA.ASSET_UI,TITLE=UI.titles[view];
const sim={};let q='',fs='',fw='',fc='',sk='id',sd=1,pg=1,editId=null;const PS=UI.pageSize;
const S=DB.state;
const open=a=>S.tickets.some(t=>t.assetId===a.id&&t.stage<6);
const columnValue=(key,a,spec)=>{
 if(spec.format==='gps')return a.lat.toFixed(4)+', '+a.lng.toFixed(4);
 if(spec.format==='category')return U.catName(a.cat);
 if(spec.format==='owner')return a.owner||a.name;
 if(spec.format==='monthly')return Math.round(a.daily*30);
 if(spec.format==='panelWatts')return Math.round(a.cap*1000);
 if(spec.format==='batteryVoltage')return sim[a.id]?sim[a.id].batV:a.batV;
 if(spec.format==='charging')return sim[a.id]?sim[a.id].chg:a.charging;
 if(spec.format==='light')return sim[a.id]?(sim[a.id].on?'ON':'OFF'):(a.lightOn?'ON':'OFF');
 if(spec.format==='maintenance')return open(a)?'Ticket open':a.status==='Maintenance Required'?'Due':'OK';
 return spec.field.split('.').reduce((value,k)=>value[k],a)
};
const columnRender=(key,a,spec)=>{
 const value=columnValue(key,a,spec);
 if(spec.format==='bold')return `<b>${U.esc(value)}</b>`;
 if(spec.format==='kw')return U.kw(value);
 if(spec.format==='date')return U.date(value);
 if(spec.format==='badge')return U.badge(value);
 if(spec.format==='batteryVoltage')return sim[a.id]?`<span class="sim">${value} V<sup>sim</sup></span>`:(value??'—');
 if(spec.format==='charging')return `<span class="${sim[a.id]?'sim':''}">${value}</span>`+(value==='Fault'?' <i class="bi bi-exclamation-triangle-fill text-danger"></i>':'');
 if(spec.format==='light')return `<span class="badge ${value==='ON'?'text-bg-warning':'text-bg-secondary'}">${value}</span>`;
 if(spec.format==='controller')return value==='Fault'?'<span class="text-danger fw-semibold">Fault</span>':value;
 return U.esc(value)
};
const C=Object.fromEntries(Object.entries(UI.columns).map(([key,spec])=>[key,{h:spec.label,v:a=>columnValue(key,a,spec),r:a=>columnRender(key,a,spec)}]));
const KEYS=UI.views[view],EXPORT=UI.exportFields;
const base=()=>S.assets.filter(a=>!cats.length||cats.includes(a.cat));
const list=()=>{const t=q.toLowerCase();let l=base().filter(a=>(!fs||a.status===fs)&&(!fw||a.ward===fw)&&(!fc||a.cat===fc)&&(!t||[a.id,a.name,a.location,a.ward,a.contractor,a.mfr,a.owner].join(' ').toLowerCase().includes(t)));
 const c=C[sk];return l.sort((x,y)=>{const a=c.v(x),b=c.v(y);return(typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b)))*sd})};
const f=id=>document.getElementById('f_'+id);
const FIELDS=UI.formFields;

function stats(){
 const l=base(),s=U.stats(l),values={total:l.length,working:s.st['Working'],nonWorking:s.st['Not Working'],offline:s.st['Offline'],
  batteryFaults:l.filter(a=>a.batStatus==='Fault'||(a.batV&&a.batV<S.settings.thr.battV)).length,
  chargingFaults:l.filter(a=>a.charging==='Fault').length,controllerFaults:l.filter(a=>a.controller==='Fault').length,
  maintenance:s.st['Maintenance Required'],capacity:U.kw(s.cap),daily:U.num(s.daily)+' kWh'};
 const cards=[...UI.cards.common,...(view==='sl'?UI.cards.streetlight:UI.cards.general)];
 document.getElementById('as').innerHTML=cards.map(c=>U.statCard(c.icon,c.tone,values[c.value],c.label)).join('')
}
function table(){
 const l=list(),pages=Math.max(1,Math.ceil(l.length/PS));pg=Math.min(pg,pages);const rows=l.slice((pg-1)*PS,pg*PS);
 document.getElementById('th').innerHTML=KEYS.map(k=>`<th class="sortable" data-s="${k}">${C[k].h}${sk===k?(sd>0?' ▲':' ▼'):''}</th>`).join('')+'<th>Actions</th>';
 document.getElementById('tb').innerHTML=rows.map(a=>`<tr>${KEYS.map(k=>`<td>${C[k].r?C[k].r(a):U.esc(C[k].v(a))}</td>`).join('')}<td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" data-v="${a.id}" title="View"><i class="bi bi-eye"></i></button> <button class="btn btn-sm btn-outline-secondary" data-e="${a.id}" title="Edit"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger" data-d="${a.id}" title="Delete"><i class="bi bi-trash"></i></button></td></tr>`).join('')||`<tr><td colspan="${KEYS.length+1}" class="empty"><i class="bi bi-inbox fs-3"></i><br>No records match the current filters.</td></tr>`;
 document.getElementById('pi').textContent=`Showing ${l.length?(pg-1)*PS+1:0}–${Math.min(l.length,pg*PS)} of ${l.length}`;
 document.getElementById('pn').innerHTML=Array.from({length:pages},(_,i)=>`<li class="page-item ${i+1===pg?'active':''}"><a class="page-link" href="#" data-p="${i+1}">${i+1}</a></li>`).join('');stats()}
function openForm(a){editId=a?a.id:null;const af=document.getElementById('af');af.reset();af.classList.remove('was-validated');
 document.getElementById('fmt').textContent=a?`Edit ${a.id}`:'Add New Asset';
 FIELDS.forEach(k=>f(k).value=a?(a[k]??''):'');
 if(!a){f('status').value='Newly Installed';f('date').value=U.iso(Date.now());f('lastInsp').value=U.iso(Date.now());f('contractor').value=CONTRACTORS[0];f('lat').value=S.settings.map.lat;f('lng').value=S.settings.map.lng}
 App.show('fm')}
function saveForm(){const af=document.getElementById('af');af.classList.add('was-validated');if(!af.checkValidity())return U.toast('Please correct the highlighted fields','danger');
 const v={};FIELDS.forEach(k=>v[k]=f(k).value.trim());['lat','lng','cap','panels'].forEach(k=>v[k]=v[k]===''?0:+v[k]);Object.assign(v,DB.geo(v.ward));
 if(editId){const a=DB.asset(editId);Object.assign(a,v);DB.recalc(a);U.toast(editId+' updated')}
 else{const c=v.cat,sl=c==='SSL'||c==='STL';const a=Object.assign({id:DB.nextId(c),pk:4.6,batStatus:sl?'Healthy':'N/A',invStatus:'Online',batV:sl?12.6:null,batPct:sl?78:undefined,charging:sl?'Charging':'N/A',controller:'OK',lightOn:false,ledW:sl?30:0,batAh:sl?30:0,source:'Registry'},v);
  if(!a.panels)a.panels=Math.max(1,Math.round(a.cap*1000/545));DB.recalc(a);S.assets.push(a);U.toast(a.id+' added to the registry')}
 DB.save();App.hide('fm');table()}
function view1(id){const a=DB.asset(id),n=S.tickets.filter(t=>t.assetId===id);
 document.getElementById('asset-detail-name').textContent=a.name;
 document.getElementById('asset-detail-rows').innerHTML=[...new Set([...EXPORT,'owner','panels','daily','monthly'])].map(k=>`<tr><th class="w-50">${C[k].h}</th><td>${C[k].r?C[k].r(a):U.esc(C[k].v(a))}</td></tr>`).join('');
 document.getElementById('asset-detail-state').textContent=`${a.batStatus} / ${a.invStatus}`;
 document.getElementById('asset-detail-history').textContent=n.length?n.map(t=>`${t.id} (${STAGES[t.stage]})`).join(', '):'none';
 document.getElementById('vt').href='maintenance.html?asset='+id;App.show('vm')}
function simulate(){const h=new Date().getHours(),night=h>=18||h<6;
 base().forEach(a=>{if(a.status==='Working'||a.status==='Newly Installed')sim[a.id]={batV:+(12.2+Math.random()*1.1-.3).toFixed(1),chg:night?'Idle':'Charging',on:night};else sim[a.id]={batV:a.batV,chg:a.charging,on:false}});table();U.toast('Simulated sensor readings generated (not real IoT data)','info')}

App.mount('assets',()=>{
 const $=id=>document.getElementById(id);
 $('sim-banner').hidden=view!=='sl';$('sm').hidden=view!=='sl';$('category-filter-wrap').hidden=cats.length===1;
 $('sf').innerHTML=U.opts(STATUSES,'','All statuses');
 $('sw').innerHTML=U.opts([...new Set(base().map(a=>a.ward))].sort(),'','All wards');
 $('sc').innerHTML=U.opts(S.cats.filter(c=>!cats.length||cats.includes(c.key)).map(c=>[c.key,c.label]),'','All categories');
 $('f_cat').innerHTML=U.opts(S.cats.filter(c=>c.on&&(!cats.length||cats.includes(c.key))).map(c=>[c.key,c.label]));
 $('f_contractor').innerHTML=U.opts(CONTRACTORS);$('f_status').innerHTML=U.opts(STATUSES);
 $('wl').innerHTML=WARDS.map(w=>`<option value="${U.esc(w.n)}">`).join('');
 $('sq').oninput=e=>{q=e.target.value;pg=1;table()};$('sf').onchange=e=>{fs=e.target.value;pg=1;table()};$('sw').onchange=e=>{fw=e.target.value;pg=1;table()};if($('sc'))$('sc').onchange=e=>{fc=e.target.value;pg=1;table()};
 $('th').onclick=e=>{const t=e.target.closest('[data-s]');if(t){sd=sk===t.dataset.s?-sd:1;sk=t.dataset.s;table()}};
 $('pn').onclick=e=>{e.preventDefault();const p=e.target.closest('[data-p]');if(p){pg=+p.dataset.p;table()}};
 $('tb').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.v)view1(b.dataset.v);if(b.dataset.e)openForm(DB.asset(b.dataset.e));
  if(b.dataset.d&&confirm('Delete asset '+b.dataset.d+'? This also removes it from the map and reports.')){S.assets=S.assets.filter(a=>a.id!==b.dataset.d);S.alerts=S.alerts.filter(a=>a.assetId!==b.dataset.d);DB.save();table();U.toast('Asset deleted','warning')}};
 $('an').onclick=()=>openForm();$('fsv').onclick=saveForm;if($('sm'))$('sm').onclick=simulate;
 const ex=fn=>{const l=list();if(!l.length)return U.toast('Nothing to export','warning');fn('isams-'+view+'-assets',EXPORT.map(k=>C[k].h),l.map(a=>EXPORT.map(k=>C[k].v(a))))};
 $('xc').onclick=()=>ex(U.csv);$('xx').onclick=()=>ex(U.xls);table();});
})();
