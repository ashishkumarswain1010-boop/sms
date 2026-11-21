/* Reports & analytics: 12 reports computed from the shared store, with date filter, chart, CSV/Excel export. */
App.mount('reports',()=>{
 const S=DB.state,$=id=>document.getElementById(id),MF=APP_DATA.MONTH_FACTORS,MN=APP_DATA.MONTHS;
 const inR=d=>(!$('d1').value||String(d).slice(0,10)>=$('d1').value)&&(!$('d2').value||String(d).slice(0,10)<=$('d2').value);
 const A=()=>S.assets.filter(a=>inR(a.date));
 const REPORTS=APP_DATA.REPORTS;
 const grp=(f,key)=>()=>{const cfg=REPORTS[key],m={};A().forEach(a=>{const k=f(a),o=m[k]||(m[k]={n:0,w:0,c:0,d:0});o.n++;o.w+=a.status==='Working'?1:0;o.c+=a.cap;o.d+=a.daily});
  const r=Object.entries(m).sort((x,y)=>y[1].n-x[1].n).map(([k,o])=>[k,o.n,o.w,o.n-o.w,+o.c.toFixed(1),+o.d.toFixed(1)]);
  return{h:cfg.headers,rows:r,chart:{l:r.map(x=>x[0]),d:r.map(x=>x[1]),n:cfg.seriesLabel}}};
 const REP={
  cat:[REPORTS.cat.title,grp(a=>U.catName(a.cat),'cat')],loc:[REPORTS.loc.title,grp(a=>a.city,'loc')],ward:[REPORTS.ward.title,grp(a=>a.ward,'ward')],dist:[REPORTS.dist.title,grp(a=>a.district,'dist')],
  stat:[REPORTS.stat.title,()=>{const c=REPORTS.stat,r=STATUSES.map(s=>{const l=A().filter(a=>a.status===s);return[s,l.length,+l.reduce((t,a)=>t+a.cap,0).toFixed(1)]});return{h:c.headers,rows:r,chart:{t:c.chartType,l:STATUSES,d:r.map(x=>x[1]),c:STATUSES.map(s=>STATUS_CLR[s])}}}],
  cap:[REPORTS.cap.title,()=>{const c=REPORTS.cap,r=S.cats.map(x=>[x.label,+A().filter(a=>a.cat===x.key).reduce((t,a)=>t+a.cap,0).toFixed(1)]).filter(x=>x[1]);return{h:c.headers,rows:r,chart:{l:r.map(x=>x[0]),d:r.map(x=>x[1]),n:c.seriesLabel}}}],
  day:[REPORTS.day.title,()=>{const c=REPORTS.day,r=S.cats.map(x=>[x.label,+A().filter(a=>a.cat===x.key).reduce((t,a)=>t+a.daily,0).toFixed(1)]).filter(x=>x[1]);return{h:c.headers,rows:r,chart:{l:r.map(x=>x[0]),d:r.map(x=>x[1]),n:c.seriesLabel}}}],
  mon:[REPORTS.mon.title,()=>{const c=REPORTS.mon,d=A().reduce((t,a)=>t+a.daily,0)*30,r=MN.map((m,i)=>[m,Math.round(d*MF[i])]);return{h:c.headers,rows:r,chart:{t:c.chartType,l:MN,d:r.map(x=>x[1]),n:c.seriesLabel}}}],
  pend:[REPORTS.pend.title,()=>{const c=REPORTS.pend,r=S.tickets.filter(t=>t.stage<6&&inR(t.created)).map(t=>[t.id,t.assetId,t.issue,t.priority,STAGES[t.stage],t.tech||'—',U.dur(t.created),t.cost]);return{h:c.headers,rows:r}}],
  fault:[REPORTS.fault.title,()=>{const c=REPORTS.fault,r=S.alerts.filter(a=>inR(a.at)).map(a=>[a.id,a.assetId,a.location,a.type,a.severity,U.dt(a.at),a.status]);const m={};r.forEach(x=>m[x[3]]=(m[x[3]]||0)+1);return{h:c.headers,rows:r,chart:{l:Object.keys(m),d:Object.values(m),n:c.seriesLabel}}}],
  bat:[REPORTS.bat.title,()=>{const c=REPORTS.bat,th=S.settings.thr.battV,r=A().filter(a=>a.batV!=null).map(a=>{const age=(Date.now()-new Date(a.date))/31557600000,why=a.batStatus==='Fault'||a.batV<th?c.reasons.voltage:age>4?c.reasons.age:a.batStatus==='Low'?c.reasons.low:'';return[a.id,a.name,a.battery,U.date(a.date),+age.toFixed(1),a.batV,why]}).filter(x=>x[6]);return{h:c.headers,rows:r}}],
  con:[REPORTS.con.title,()=>{const c=REPORTS.con,r=CONTRACTORS.map(contractor=>{const l=S.assets.filter(a=>a.contractor===contractor),t=S.tickets.filter(x=>x.contractor===contractor),cl=t.filter(x=>x.stage===6);return[contractor,l.length,l.length?Math.round(l.filter(a=>a.status==='Working').length/l.length*100)+'%':'—',t.length,cl.length,cl.length?Math.round(cl.reduce((s,x)=>s+(new Date(x.closed)-new Date(x.created)),0)/cl.length/36e5)+' h':'—',t.reduce((s,x)=>s+(+x.cost||0),0)]});return{h:c.headers,rows:r,chart:{l:r.map(x=>x[0]),d:r.map(x=>parseInt(x[2])||0),n:c.seriesLabel}}}]};
 let cur='cat',ch=null;
 $('rl').innerHTML=Object.entries(REP).map(([k,v],i)=>`<button class="list-group-item list-group-item-action small ${k===cur?'active':''}" data-r="${k}">${i+1}. ${v[0]}</button>`).join('');
 function draw(){const[t,fn]=REP[cur],d=fn();$('rt').textContent=t;if(ch){ch.destroy();ch=null}$('cb').style.display=d.chart?'':'none';
  if(d.chart){const c=d.chart,col=c.c||'#1d4ed8';ch=new Chart($('rc'),{type:c.t||'bar',data:{labels:c.l,datasets:[{label:c.n,data:c.d,backgroundColor:col,borderColor:'#1d4ed8',fill:false,tension:.3}]},options:{maintainAspectRatio:false,plugins:{legend:{display:!!c.t&&c.t==='doughnut'}}}})}
  $('rh').innerHTML='<tr>'+d.h.map(h=>`<th>${h}</th>`).join('')+'</tr>';$('rb').innerHTML=d.rows.map(r=>'<tr>'+r.map(v=>`<td>${U.esc(v)}</td>`).join('')+'</tr>').join('')||`<tr><td colspan="${d.h.length}" class="empty">No data for the selected dates.</td></tr>`;window._rep=d}
 $('rl').onclick=e=>{const b=e.target.closest('[data-r]');if(b){cur=b.dataset.r;$('rl').querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));draw()}};
 ['d1','d2'].forEach(i=>$(i).onchange=draw);
 const ex=fn=>window._rep.rows.length?fn('isams-report-'+cur,window._rep.h,window._rep.rows):U.toast('Nothing to export','warning');$('xc').onclick=()=>ex(U.csv);$('xx').onclick=()=>ex(U.xls);$('print').onclick=()=>window.print();draw();
});
