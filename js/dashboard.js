/* Dashboard: stat cards + 5 Chart.js charts, all driven by DB.state.assets and the filter bar. */
App.mount('index',()=>{
 Chart.defaults.font.family='Inter';Chart.defaults.maintainAspectRatio=false;
 const S=DB.state,$=id=>document.getElementById(id),cats=S.cats,D=APP_DATA.DASHBOARD;
 $('fc').innerHTML=U.opts(cats.map(c=>[c.key,c.label]),'',D.filters.categories);$('fs').innerHTML=U.opts(STATUSES,'',D.filters.statuses);
 $('fd').innerHTML=U.opts([...new Set(WARDS.map(w=>w.d))],'',D.filters.districts);
 const wl=()=>{const d=$('fd').value;$('fw').innerHTML=U.opts(WARDS.filter(w=>!d||w.d===d).map(w=>w.n),'',D.filters.wards)};wl();
 const {MONTH_FACTORS:MF,MONTHS:MN}=APP_DATA;
 const mk=(id,cfg)=>new Chart($(id),{type:cfg.type,data:{labels:[],datasets:[{data:[]}]},options:cfg.options});
 const ch=Object.fromEntries(Object.entries(D.charts).map(([id,cfg])=>[id,mk(id,cfg)]));
 const set=(c,l,d,col,extra={})=>{c.data.labels=l;c.data.datasets=[{data:d,backgroundColor:col,borderColor:col,borderRadius:4,...extra}];c.update()};
 function render(){
  const L=S.assets.filter(a=>(!$('fc').value||a.cat===$('fc').value)&&(!$('fs').value||a.status===$('fs').value)&&(!$('fd').value||a.district===$('fd').value)&&(!$('fw').value||a.ward===$('fw').value));
  const s=U.stats(L);
  $('cards').innerHTML=D.cards.map(c=>{const v=c.path.reduce((o,k)=>o[k],s),value=c.format==='kw'?U.kw(v):c.format==='energy'?U.num(v)+' kWh':v;return U.statCard(c.icon,c.tone,value,c.label)}).join('');
  set(ch.c1,cats.map(c=>c.label),cats.map(c=>s.by[c.key]||0),cats.map(c=>c.color));
  set(ch.c2,STATUSES,STATUSES.map(x=>s.st[x]),STATUSES.map(x=>STATUS_CLR[x]));
  set(ch.c3,MN,MF.map(f=>Math.round(s.monthly*f)),D.colors.monthly,{fill:true,tension:.35,backgroundColor:D.colors.monthlyFill});
  const w={};L.forEach(a=>w[a.ward]=(w[a.ward]||0)+1);const e=Object.entries(w).sort((a,b)=>b[1]-a[1]).slice(0,12);
  set(ch.c4,e.map(x=>x[0]),e.map(x=>x[1]),D.colors.wards);
  const cc=cats.filter(c=>s.by[c.key]);set(ch.c5,cc.map(c=>c.label),cc.map(c=>+L.filter(a=>a.cat===c.key).reduce((t,a)=>t+a.cap,0).toFixed(1)),cc.map(c=>c.color));
 }
 ['fc','fs','fw'].forEach(i=>$(i).onchange=render);$('fd').onchange=()=>{wl();render()};render();
});
