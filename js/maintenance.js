/* Maintenance workflow: Fault Detected → Ticket Created → Technician Assigned → Inspection → Repair → Verification → Closed */
App.mount('maintenance',()=>{
 const S=DB.state,$=id=>document.getElementById(id),P=new URLSearchParams(location.search);let cur=null,photo=null;
 $('fs').innerHTML=U.opts(STAGES,'','All stages');$('fp').innerHTML=U.opts(PRIORITIES,'','All priorities');
 $('al').innerHTML=S.assets.map(a=>`<option value="${U.esc(a.id)}">${U.esc(a.name)}</option>`).join('');
 $('n_t').innerHTML=U.opts(TICKET_TYPES);$('n_p').innerHTML=U.opts(NEW_TICKET_PRIORITIES);
 $('n_te').innerHTML=U.opts(TECHS,'','Unassigned');$('n_c').innerHTML=U.opts(CONTRACTORS,'','Unassigned');
 const cost=()=>S.tickets.reduce((t,x)=>t+(+x.cost||0),0);
 function draw(){const L=S.tickets.filter(t=>(!$('fs').value||STAGES[t.stage]===$('fs').value)&&(!$('fp').value||t.priority===$('fp').value)).sort((a,b)=>b.created.localeCompare(a.created));
  const open=S.tickets.filter(t=>t.stage<6),cl=S.tickets.filter(t=>t.stage===6),avg=cl.length?cl.reduce((t,x)=>t+(new Date(x.closed)-new Date(x.created)),0)/cl.length/36e5:0;
  const values={open:open.length,repair:S.tickets.filter(t=>t.stage===4).length,closed:cl.length,average:avg?Math.round(avg)+' h':'—',cost:'₹'+U.num(cost())};
  $('as').innerHTML=APP_DATA.MAINTENANCE_CARDS.map(x=>U.statCard(x.icon,x.tone,values[x.value],x.label)).join('');
  $('tb').innerHTML=L.map(t=>`<tr><td><b>${t.id}</b></td><td>${t.assetId}</td><td>${t.type}</td><td>${U.esc(t.issue)}</td><td>${U.sev(t.priority)}</td><td>${t.tech||'—'}</td><td><span class="badge text-bg-${t.stage===6?'success':'primary'}">${STAGES[t.stage]}</span></td><td>${U.dur(t.created,t.closed)}</td><td>${U.num(t.cost)}</td><td><button class="btn btn-sm btn-outline-primary" data-o="${t.id}">Manage</button></td></tr>`).join('')||'<tr><td colspan=10 class="empty">No tickets.</td></tr>'}
 function detail(id){cur=S.tickets.find(t=>t.id===id);const t=cur,a=DB.asset(t.assetId);$('dt').textContent=`${t.id} · ${t.assetId}`;
  $('stepper').innerHTML=STAGES.map((s,i)=>`<div class="step ${i<t.stage?'done':i===t.stage?'cur':''}"><div class="dot">${i<t.stage?'<i class="bi bi-check"></i>':i+1}</div>${s}</div>`).join('');
  $('detail-asset').textContent=a?a.name:'(asset removed)';$('detail-issue').textContent=t.issue;$('detail-duration').textContent=U.dur(t.created,t.closed);
  $('e_t').innerHTML=U.opts(TECHS,t.tech,'Unassigned');$('e_c').innerHTML=U.opts(CONTRACTORS,t.contractor,'Unassigned');$('e_p').innerHTML=U.opts(PRIORITIES,t.priority);
  $('e_k').value=t.cost;$('e_n').value=t.notes;
  ['e_t','e_c','e_k','e_n'].forEach(i=>$(i).disabled=t.stage===6);
  $('detail-photos').innerHTML=t.photos.map(p=>`<img class="thumb" src="${p}">`).join('');
  $('detail-history').innerHTML=t.history.map(h=>`<li><b>${STAGES[h.stage]}</b> – ${U.dt(h.at)} ${h.note?'· '+U.esc(h.note):''}</li>`).join('');
  $('da').style.display=t.stage===6?'none':'';$('da').textContent=t.stage<6?'Advance to: '+STAGES[t.stage+1]:'';$('ds').style.display=t.stage===6?'none':'';
  $('e_ph').onchange=e=>{if(e.target.files[0])U.img(e.target.files[0],d=>{photo=d;U.toast('Photo attached – click Save changes','info')})};App.show('dm')}
 function commit(){const t=cur;if(t.stage<6){t.tech=$('e_t').value;t.contractor=$('e_c').value;t.cost=+$('e_k').value||0;t.notes=$('e_n').value.trim()}t.priority=$('e_p').value;if(photo){t.photos.push(photo);photo=null}}
 $('ds').onclick=()=>{commit();DB.save();draw();detail(t0());U.toast('Ticket saved')};const t0=()=>cur.id;
 $('da').onclick=()=>{commit();const t=cur;if(t.stage===2&&!t.tech)return U.toast('Assign a technician before advancing','danger');
  t.stage++;t.history.push({stage:t.stage,at:new Date().toISOString(),note:t.notes&&t.stage>=4?t.notes:''});
  if(t.stage===6){t.closed=new Date().toISOString();const a=DB.asset(t.assetId);if(a){DB.fix(a);S.alerts.filter(x=>x.assetId===a.id&&x.status!=='Resolved').forEach(x=>{x.status='Resolved';x.resolvedAt=t.closed})}U.toast(t.id+' closed – asset restored to Working')}else U.toast('Moved to '+STAGES[t.stage]);
  DB.save();draw();detail(t.id)};
 $('tb').onclick=e=>{const b=e.target.closest('[data-o]');if(b)detail(b.dataset.o)};['fs','fp'].forEach(i=>$(i).onchange=draw);
 function openNew(){$('nf').reset();$('nf').classList.remove('was-validated');photo=null;if(P.get('asset'))$('n_a').value=P.get('asset');if(P.get('alert')){const al=S.alerts.find(x=>x.id===P.get('alert'));if(al){$('n_i').value=al.type;$('n_p').value=al.severity==='Critical'?'Critical':al.severity;$('n_te').value=al.tech}}App.show('nm')}
 $('nt').onclick=openNew;$('n_ph').onchange=e=>{if(e.target.files[0])U.img(e.target.files[0],d=>photo=d)};
 $('ns').onclick=()=>{const f=$('nf');f.classList.add('was-validated');$('n_a').setCustomValidity(DB.asset($('n_a').value.trim())?'':'x');if(!f.checkValidity())return U.toast('Please fix the highlighted fields','danger');
  const now=new Date().toISOString(),te=$('n_te').value,h=[{stage:0,at:now,note:$('n_i').value.trim()},{stage:1,at:now,note:'Ticket created'}];if(te)h.push({stage:2,at:now,note:'Assigned to '+te});
  const n=Math.max(1000,...S.tickets.map(t=>+t.id.slice(4)))+1;S.tickets.push({id:'TKT-'+n,assetId:$('n_a').value.trim(),type:$('n_t').value,issue:$('n_i').value.trim(),priority:$('n_p').value,tech:te,contractor:$('n_c').value,cost:+$('n_k').value||0,notes:'',stage:te?2:1,created:now,closed:null,photos:photo?[photo]:[],history:h});
  const al=S.alerts.find(x=>x.id===P.get('alert'));if(al&&al.status==='New')al.status='In Progress';DB.save();App.hide('nm');draw();U.toast('TKT-'+n+' created')};
 draw();if(P.get('asset'))openNew();
});
