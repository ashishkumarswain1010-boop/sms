/* ISAMS shared shell (sidebar/topbar), utilities, and the Users / Notifications / Settings pages. */
const {NAV,STATUS_CLR,ROLE_CLS}=APP_DATA;

const U={
 esc:s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
 num:n=>Number(n).toLocaleString('en-IN',{maximumFractionDigits:1}),
 kw:k=>k>=1000?(k/1000).toFixed(2)+' MW':U.num(k)+' kW',
 date:d=>d?new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—',
 dt:d=>d?new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—',
 iso:d=>new Date(d).toISOString().slice(0,10),
 ago(d){const m=(Date.now()-new Date(d))/6e4;return m<60?Math.round(m)+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'},
 dur(a,b){const h=((b?new Date(b):new Date())-new Date(a))/36e5;return h<24?Math.round(h)+' h':Math.floor(h/24)+' d '+Math.round(h%24)+' h'},
 dist(a,b,c,d){const r=x=>x*Math.PI/180,R=6371,dl=r(c-a),dn=r(d-b),h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))},
 cat:k=>DB.state.cats.find(c=>c.key===k)||{key:k,label:k,color:'#64748b'},
 catName:k=>U.cat(k).label,
 badge:s=>`<span class="badge st-${String(s).replace(/ /g,'')}">${U.esc(s)}</span>`,
 sev:s=>`<span class="badge bg-${APP_DATA.SEVERITY_CLASSES[s]||'secondary'}">${s}</span>`,
 opts:(arr,sel,all)=>(all?`<option value="">${all}</option>`:'')+arr.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return`<option value="${U.esc(v)}" ${v==sel?'selected':''}>${U.esc(l)}</option>`}).join(''),
 stats(l){const s={total:l.length,cap:0,daily:0,by:{},st:{}};DB.state.cats.forEach(c=>s.by[c.key]=0);STATUSES.forEach(x=>s.st[x]=0);
  l.forEach(a=>{s.cap+=a.cap;s.daily+=a.daily;s.by[a.cat]=(s.by[a.cat]||0)+1;s.st[a.status]++});s.monthly=s.daily*30;s.faulty=s.st['Not Working']+s.st['Maintenance Required'];return s},
 statCard(i,c,v,l){const n=document.getElementById('stat-card-template').content.firstElementChild.cloneNode(true);n.querySelector('.ic').className=`ic bg-${c}-subtle text-${c}`;n.querySelector('i').className=`bi bi-${i}`;n.querySelector('.v').textContent=v;n.querySelector('.l').textContent=l;return n.outerHTML},
 toast(m,t='success'){const e=document.getElementById('toast-template').content.firstElementChild.cloneNode(true);e.classList.add(`text-bg-${t}`);e.querySelector('.toast-body').textContent=m;document.getElementById('toasts').appendChild(e);
  new bootstrap.Toast(e,{delay:3200}).show();e.addEventListener('hidden.bs.toast',()=>e.remove())},
 dl(name,mime,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800)},
 csv(name,h,rows){const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';U.dl(name+'.csv','text/csv;charset=utf-8','\ufeff'+[h,...rows].map(r=>r.map(q).join(',')).join('\r\n'));U.toast('CSV exported')},
 xls(name,h,rows){const doc=`<html><head><meta charset="utf-8"></head><body><table border="1"><tr>${h.map(x=>`<th>${U.esc(x)}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(v=>`<td>${U.esc(v)}</td>`).join('')}</tr>`).join('')}</table></bo`+'dy></ht'+'ml>';U.dl(name+'.xls','application/vnd.ms-excel',doc);U.toast('Excel file exported')},
 img(file,cb){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,480/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.6))};i.src=r.result};r.readAsDataURL(file)},
 /* Notifications are derived live from the shared data, so they always match the rest of the app */
 notifs(){const S=DB.state,th=S.settings.thr,now=Date.now(),L=[],A=S.assets,add=(id,type,icon,cls,text,t)=>L.push({id,type,icon,cls,text,t,read:S.read.includes(id)});
  S.alerts.filter(a=>a.status==='New'&&a.type!=='Device offline').slice(0,8).forEach(a=>add('F'+a.id,'New faults','exclamation-octagon','danger',`${a.type} – ${a.assetId} (${a.location})`,a.at));
  A.filter(a=>a.status==='Offline').slice(0,6).forEach(a=>add('O'+a.id,'Offline devices','wifi-off','secondary',`${a.id} ${a.name} has sent no data recently`,now-864e5));
  A.filter(a=>a.status==='Maintenance Required').slice(0,6).forEach(a=>add('M'+a.id,'Maintenance reminders','wrench','warning',`Maintenance required: ${a.id} – ${a.name}`,now-2*864e5));
  A.forEach(a=>{const d=(new Date(a.warranty)-now)/864e5;if(d>0&&d<=th.warrantyDays)add('W'+a.id,'Warranty expiry','shield-exclamation','info',`Warranty of ${a.id} expires on ${U.date(a.warranty)}`,now-d*0)});
  A.filter(a=>(now-new Date(a.lastInsp))/864e5>th.inspDays).slice(0,8).forEach(a=>add('I'+a.id,'Pending inspections','search','primary',`Inspection pending for ${a.id} (last: ${U.date(a.lastInsp)})`,now-3*864e5));
  S.tickets.filter(t=>t.stage<6&&(now-new Date(t.created))/864e5>7).forEach(t=>add('T'+t.id,'Overdue repair tickets','clock-history','danger',`Ticket ${t.id} (${t.assetId}) open for ${U.dur(t.created)}`,t.created));
  return L.sort((a,b)=>new Date(b.t)-new Date(a.t))}
};

const App={pages:{},
 mount(key,cb){
  const N=U.notifs(),un=N.filter(n=>!n.read),badge=document.getElementById('unread-badge');
  document.getElementById('org-name').textContent=DB.state.settings.org.name;
  document.getElementById('unread-title').textContent=`Notifications (${un.length} unread)`;
  badge.textContent=un.length;badge.classList.toggle('d-none',!un.length);
  document.getElementById('notification-items').innerHTML=un.slice(0,5).map(n=>`<div class="small border-top p-2"><i class="bi bi-${n.icon} text-${n.cls}"></i> ${U.esc(n.text)}</div>`).join('')||'<div class="empty">All caught up</div>';
  const b=document.body;
  document.getElementById('tg').onclick=()=>innerWidth<992?b.classList.toggle('sb-open'):b.classList.toggle('sb-collapsed');
  document.querySelector('.ov').onclick=()=>b.classList.remove('sb-open');
  document.getElementById('rst').onclick=()=>{if(confirm('Reset all data to the original demo dataset?')){DB.reset();location.reload()}};
  cb&&cb()},
 show:id=>bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show(),
 hide:id=>bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).hide()};

/* ---------- User Management ---------- */
App.pages.users=()=>{const S=DB.state;
 const draw=()=>{document.getElementById('ut').innerHTML=S.users.map(u=>`<tr><td><b>${U.esc(u.name)}</b><div class="small text-muted">${U.esc(u.email)}</div></td><td><span class="badge ${ROLE_CLS[ROLES.indexOf(u.role)]}">${u.role}</span></td><td>${U.ago(u.last)}</td><td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" data-t="${u.id}" ${u.active?'checked':''}> ${u.active?'Active':'Inactive'}</div></td><td><button class="btn btn-sm btn-outline-danger" data-d="${u.id}"><i class="bi bi-trash"></i></button></td></tr>`).join('')||'<tr><td colspan=5 class="empty">No users</td></tr>'};
 App.mount('users',()=>{
  ur.innerHTML=U.opts(ROLES);draw();
  document.getElementById('add-user').onclick=()=>App.show('um');
  ut.onchange=e=>{const u=S.users.find(x=>x.id==e.target.dataset.t);if(u){u.active=e.target.checked;DB.save();draw();U.toast('User status updated')}};
  ut.onclick=e=>{const b=e.target.closest('[data-d]');if(b&&confirm('Delete this user?')){S.users=S.users.filter(x=>x.id!=b.dataset.d);DB.save();draw();U.toast('User deleted')}};
  usv.onclick=()=>{uf.classList.add('was-validated');if(!uf.checkValidity())return;S.users.push({id:Date.now(),name:un.value.trim(),email:ue.value.trim(),role:ur.value,active:true,last:new Date().toISOString()});DB.save();App.hide('um');uf.reset();uf.classList.remove('was-validated');draw();U.toast('User added')}})};

/* ---------- Notifications ---------- */
App.pages.notifications=()=>{let f='';
 const draw=()=>{const N=U.notifs().filter(n=>!f||n.type===f);document.getElementById('nl').innerHTML=N.map(n=>`<div class="list-group-item d-flex gap-3 align-items-center ${n.read?'':'bg-light'}"><i class="bi bi-${n.icon} text-${n.cls} fs-4"></i><div class="flex-grow-1"><div class="${n.read?'':'fw-semibold'}">${U.esc(n.text)}</div><small class="text-muted">${n.type} · ${U.ago(n.t)}</small></div>${n.read?'':`<button class="btn btn-sm btn-outline-secondary" data-r="${n.id}">Mark read</button>`}</div>`).join('')||'<div class="empty">No notifications</div>'};
 App.mount('notifications',()=>{
  nf.innerHTML=U.opts(APP_DATA.NOTIFICATION_TYPES,'','All types');
  draw();nf.onchange=()=>{f=nf.value;draw()};
  nl.onclick=e=>{const b=e.target.closest('[data-r]');if(b){DB.state.read.push(b.dataset.r);DB.save();draw()}};
  mar.onclick=()=>{DB.state.read=U.notifs().map(n=>n.id);DB.save();location.reload()}})};

/* ---------- System Settings ---------- */
App.pages.settings=()=>{const S=DB.state,st=S.settings;
 const cats=()=>{document.getElementById('category-rows').innerHTML=S.cats.map(c=>`<tr><td>${c.key}</td><td><i class="bi bi-circle-fill" style="color:${c.color}"></i> ${U.esc(c.label)}</td><td>${S.assets.filter(a=>a.cat===c.key).length}</td><td><input type="checkbox" class="form-check-input" data-c="${c.key}" ${c.on?'checked':''}></td></tr>`).join('')};
 const permissions=()=>{document.getElementById('permission-headings').insertAdjacentHTML('beforeend',MODULES.map(m=>`<th class="text-center">${m}</th>`).join(''));document.getElementById('permission-rows').innerHTML=ROLES.map(r=>`<tr><td class="text-nowrap">${r}</td>${MODULES.map(m=>`<td class="text-center"><input type="checkbox" class="form-check-input" data-r="${r}" data-m="${m}" ${st.perms[r][m]?'checked':''}></td>`).join('')}</tr>`).join('')};
 App.mount('settings',()=>{
  document.querySelectorAll('[data-k]').forEach(i=>{const v=i.dataset.k.split('.').reduce((o,k)=>o[k],st);if(i.type==='checkbox')i.checked=!!v;else i.value=v});
  cats();permissions();
  const bind=()=>{cw.onchange=e=>{const c=S.cats.find(x=>x.key===e.target.dataset.c);if(c){c.on=e.target.checked;DB.save()}};
   ca.onclick=()=>{const k=ck.value.trim().toUpperCase(),l=cl.value.trim();if(!/^[A-Z]{2,4}$/.test(k)||!l||S.cats.some(c=>c.key===k))return U.toast('Enter a unique 2–4 letter key and a name','danger');S.cats.push({key:k,label:l,color:'#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0'),on:true});DB.save();cats();bind();U.toast('Category added')}};
  bind();
  document.querySelectorAll('.save').forEach(b=>b.onclick=()=>{const pane=b.closest('.tab-pane');
   pane.querySelectorAll('[data-k]').forEach(i=>{const p=i.dataset.k.split('.'),k=p.pop(),o=p.reduce((x,y)=>x[y],st);o[k]=i.type==='checkbox'?i.checked:i.type==='number'?+i.value:i.value});
   pane.querySelectorAll('[data-r]').forEach(i=>st.perms[i.dataset.r][i.dataset.m]=i.checked);DB.save();U.toast('Settings saved')})})};

const page=location.pathname.split('/').pop().replace('.html','');
if(App.pages[page])App.pages[page]();
