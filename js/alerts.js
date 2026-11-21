/* Fault & alert management: filters, status workflow, ticket creation, rule-based fault scan. */
App.mount('alerts',()=>{
 const S=DB.state,$=id=>document.getElementById(id);
 $('fv').innerHTML=U.opts(PRIORITIES,'','All severities');
 $('fs').innerHTML=U.opts(ALERT_STATUSES,'','All statuses');
 $('fc').innerHTML=U.opts(S.cats.map(c=>[c.key,c.label]),'','All categories');
 function draw(){
  const d1=$('d1').value,d2=$('d2').value;
  const L=S.alerts.filter(a=>(!$('fv').value||a.severity===$('fv').value)&&(!$('fs').value||a.status===$('fs').value)&&(!$('fc').value||a.assetId.startsWith($('fc').value+'-'))&&(!d1||a.at.slice(0,10)>=d1)&&(!d2||a.at.slice(0,10)<=d2));
  const c=s=>S.alerts.filter(a=>a.status===s).length;
  const counts={New:c('New'),Acknowledged:c('Acknowledged'),'In Progress':c('In Progress'),Resolved:c('Resolved')};
  $('as').innerHTML=APP_DATA.ALERT_CARDS.map(x=>U.statCard(x.icon,x.tone,counts[x.status],x.label)).join('');
  $('tb').innerHTML=L.map(a=>`<tr><td><b>${a.id}</b></td><td>${a.assetId}</td><td>${U.esc(a.location)}</td><td>${a.type}</td><td>${U.sev(a.severity)}</td><td>${U.dt(a.at)}</td><td>${a.tech}</td>
   <td><select class="form-select form-select-sm" data-s="${a.id}">${U.opts(ALERT_STATUSES,a.status)}</select></td><td><a class="btn btn-sm btn-outline-primary" href="maintenance.html?asset=${a.assetId}&alert=${a.id}">Create ticket</a></td></tr>`).join('')||'<tr><td colspan=9 class="empty">No alerts match the filters.</td></tr>'}
 ['fv','fs','fc','d1','d2'].forEach(i=>$(i).onchange=draw);$('cl').onclick=()=>{['fv','fs','fc','d1','d2'].forEach(i=>$(i).value='');draw()};
 $('tb').onchange=e=>{const a=S.alerts.find(x=>x.id===e.target.dataset.s);if(!a)return;a.status=e.target.value;a.resolvedAt=a.status==='Resolved'?new Date().toISOString():null;DB.save();draw();U.toast(`${a.id} marked ${a.status}`)};
 $('sc').onclick=()=>{let n=0;S.assets.forEach(a=>{const bad=a.status==='Not Working'||a.status==='Offline'||a.status==='Maintenance Required';if(bad&&!S.alerts.some(x=>x.assetId===a.id&&x.status!=='Resolved')){DB.newAlert(a);n++}});DB.save();draw();U.toast(n?`${n} new alert(s) raised`:'Scan complete – no new faults found',n?'warning':'info')};
 draw();
});
