/* Live monitoring UI. ALL values are simulated with setInterval – no IoT hardware is connected. */
App.mount('monitoring',()=>{
 const S=DB.state,$=id=>document.getElementById(id);
 $('ma').innerHTML=U.opts(S.assets.map(a=>[a.id,`${a.id} – ${a.name}`]),(S.assets.find(a=>a.status==='Working')||S.assets[0]).id);
 const MON=APP_DATA.MONITORING;
 const lc=new Chart($('lc'),{type:MON.chart.type,data:{labels:[],datasets:MON.chart.series.map(s=>({...s,data:[]}))},options:MON.chart.options});
 const irr=()=>{const h=new Date().getHours()+new Date().getMinutes()/60;return h<6||h>18?0:Math.sin(Math.PI*(h-6)/12)};
 const frac=()=>{const h=new Date().getHours()+new Date().getMinutes()/60;return Math.min(1,Math.max(0,(1-Math.cos(Math.PI*Math.min(Math.max(h-6,0),12)/12))/2))};
 const live=a=>{const on=a.status==='Working'||a.status==='Newly Installed'||a.status==='Maintenance Required';const k=a.status==='Maintenance Required'?.5:1;
  const gen=on?+(a.cap*irr()*k*(.92+Math.random()*.1)).toFixed(a.cap<1?3:2):0;return{on,gen,inv:on&&!(a.invStatus==='Fault')?+(gen*.96).toFixed(a.cap<1?3:2):0,link:a.status==='Offline'?'Offline':'Online',
   last:a.status==='Offline'?new Date(Date.now()-864e5*(1+a.id.length%3)):new Date()}};
 function tick(){const a=DB.asset($('ma').value),x=live(a),h=a.batV!=null,v=h?+(a.batV+(x.on?(Math.random()-.4)*.08:-.02)).toFixed(2):null,pc=h?Math.round(Math.max(0,Math.min(100,(v-10.5)/2.7*100))):null;
  const today=x.on?a.daily*frac():0,dom=new Date().getDate();
  const values={generation:x.gen+' kW',inverter:x.inv+' kW',voltage:h?v+' V':'N/A',battery:h?pc+'%':'N/A',
   charging:h?(x.on&&irr()>0?(a.charging==='Fault'?'Fault':'Charging'):'Idle'):'N/A',today:today.toFixed(1)+' kWh',
   month:U.num(a.daily*(dom-1)*.95+today)+' kWh',connectivity:x.link,last:x.last.toLocaleTimeString()};
  $('mc').innerHTML=MON.cards.map(c=>{
   const alternate=c.condition&&x[c.condition.key]!==c.condition.value;
   return U.statCard(alternate&&c.alternateIcon||c.icon,alternate&&c.alternateTone||c.tone,values[c.value],c.label)
  }).join('');
  $('lu').textContent='Updated '+new Date().toLocaleTimeString();
  lc.data.labels.push(new Date().toLocaleTimeString());lc.data.datasets[0].data.push(x.gen);lc.data.datasets[1].data.push(x.inv);if(lc.data.labels.length>20){lc.data.labels.shift();lc.data.datasets.forEach(d=>d.data.shift())}lc.update();
  $('ft').innerHTML=S.assets.slice(0,12).map(b=>{const y=live(b);return`<tr><td>${b.id}</td><td>${y.gen}</td><td><span class="badge text-bg-${y.link==='Online'?'success':'secondary'}">${y.link}</span></td><td>${y.last.toLocaleTimeString()}</td></tr>`}).join('')}
 $('ma').onchange=()=>{lc.data.labels=[];lc.data.datasets.forEach(d=>d.data=[]);tick()};tick();setInterval(tick,3000);
});
