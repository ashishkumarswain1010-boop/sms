/* GIS Solar Map: Leaflet + OSM, dynamic radius zones using Haversine distance on the shared dataset. */
App.mount('gis-map',()=>{
 const S=DB.state,$=id=>document.getElementById(id),M=S.settings.map;
 const PRE=APP_DATA.MAP_PLACES;
 $('pl').innerHTML=PRE.map(p=>`<option value="${p.n}">`).join('');
 $('fc').innerHTML=U.opts(S.cats.map(c=>[c.key,c.label]),'','All categories');$('fs').innerHTML=U.opts(STATUSES,'','All statuses');
 $('lat').value=M.lat;$('lng').value=M.lng;$('rad').value=[5,10,15,20,25,50].includes(+M.radius)?M.radius:'c';if($('rad').value==='c'){$('crad').disabled=false;$('crad').value=M.radius}
 const map=L.map('map').setView([M.lat,M.lng],M.zoom||11);
 const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 const light=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap &copy; CARTO'});
 const sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri'});
 const mk=L.layerGroup().addTo(map),zl=L.layerGroup().addTo(map);
 L.control.layers({'OpenStreetMap':osm,'Light':light,'Satellite':sat},{'Solar assets':mk,'Monitoring zone':zl}).addTo(map);L.control.scale().addTo(map);
 const FS=L.Control.extend({options:{position:'topleft'},onAdd(){const b=document.getElementById('map-fullscreen-template').content.firstElementChild.cloneNode(true);
  b.onclick=e=>{e.preventDefault();document.fullscreenElement?document.exitFullscreen():$('map').requestFullscreen()};return b}});map.addControl(new FS());
 document.addEventListener('fullscreenchange',()=>setTimeout(()=>map.invalidateSize(),200));
 const lg=L.control({position:'bottomright'});lg.onAdd=()=>{const d=L.DomUtil.create('div','legend'),tpl=document.getElementById('map-legend-item-template');
  Object.entries(STATUS_CLR).forEach(([k,c])=>{const row=tpl.content.firstElementChild.cloneNode(true);row.querySelector('i').style.background=c;row.querySelector('span').textContent=k;d.appendChild(row)});return d};lg.addTo(map);
 let picking=false,name=M.name;
 const R=()=>$('rad').value==='c'?+$('crad').value:+$('rad').value;
 const popup=a=>{const el=document.getElementById('map-popup-template').content.firstElementChild.cloneNode(true),set=(key,value)=>el.querySelector(`[data-${key}]`).textContent=value;
  set('name',a.name);set('id',a.id);set('category',U.catName(a.cat));set('gps',`${a.lat}, ${a.lng}`);set('capacity',U.kw(a.cap));set('installed',U.date(a.date));
  const status=el.querySelector('[data-status]');status.textContent=a.status;status.classList.add(`st-${String(a.status).replace(/ /g,'')}`);
  set('inspection',U.date(a.lastInsp));set('energy',`${a.daily} kWh/day`);set('battery',`${a.batStatus}${a.batV?' ('+a.batV+' V)':''}`);set('inverter',a.invStatus);set('contractor',a.contractor);return el.outerHTML};
 function apply(fit=true){
  const lat=+$('lat').value,lng=+$('lng').value,r=R();
  if($('lat').value===''||$('lng').value===''||lat<-90||lat>90||lng<-180||lng>180)return U.toast('Enter a valid latitude (−90..90) and longitude (−180..180)','danger');
  if(!(r>0&&r<=500))return U.toast('Radius must be between 0 and 500 km','danger');
  zl.clearLayers();const c=L.circle([lat,lng],{radius:r*1000,color:'#1d4ed8',weight:2,fillOpacity:.06}).addTo(zl);L.circleMarker([lat,lng],{radius:5,color:'#111',fillColor:'#fff',fillOpacity:1}).bindTooltip('Zone centre').addTo(zl);
  const all=S.assets.filter(a=>(!$('fc').value||a.cat===$('fc').value)&&(!$('fs').value||a.status===$('fs').value)).map(a=>({a,d:U.dist(lat,lng,a.lat,a.lng)}));
  const ins=all.filter(x=>x.d<=r).sort((x,y)=>x.d-y.d);mk.clearLayers();
  (document.getElementById('fo').checked?all.filter(x=>x.d>r):[]).forEach(({a})=>L.circleMarker([a.lat,a.lng],{radius:5,color:'#fff',weight:1,fillColor:STATUS_CLR[a.status],fillOpacity:.25}).bindPopup(popup(a)).addTo(mk));
  ins.forEach(({a})=>L.circleMarker([a.lat,a.lng],{radius:8,color:'#fff',weight:1.5,fillColor:STATUS_CLR[a.status],fillOpacity:.95}).bindPopup(popup(a)).bindTooltip(a.id).addTo(mk));
  const s=U.stats(ins.map(x=>x.a));
  const values={total:s.total,area:Math.PI*r*r,working:s.st['Working'],nonWorking:s.st['Not Working'],offline:s.st['Offline'],maintenance:s.st['Maintenance Required'],new:s.st['Newly Installed'],faulty:s.faulty,capacity:s.cap,daily:s.daily};
  const cards=APP_DATA.MAP_CARDS.map(x=>{const v=values[x.value],value=x.format==='area'?U.num(v)+' km²':x.format==='kw'?U.kw(v):x.format==='energy'?U.num(v)+' kWh':v;return U.statCard(x.icon,x.tone,value,x.label)}).join('');
  $('st').innerHTML=cards;
  $('map-categories').innerHTML=S.cats.filter(k=>s.by[k.key]).map(k=>`<span class="badge text-bg-light border"><i class="bi bi-circle-fill" style="color:${k.color}"></i> ${U.esc(k.label)}: ${s.by[k.key]}</span>`).join('')||'<span class="text-muted">No installations inside this zone.</span>';
  $('tb').innerHTML=ins.map(({a,d})=>`<tr><td>${a.id}</td><td>${U.esc(a.name)}</td><td>${U.catName(a.cat)}</td><td>${d.toFixed(2)} km</td><td>${U.kw(a.cap)}</td><td>${U.badge(a.status)}</td></tr>`).join('')||'<tr><td colspan=6 class="empty">No installations within this radius.</td></tr>';
  if(fit)map.fitBounds(c.getBounds(),{padding:[20,20]});window._zone={lat,lng,r};
 }
 function zones(){$('zl').innerHTML=S.zones.map(z=>`<div class="d-flex align-items-center border-bottom py-1"><div class="flex-grow-1 small"><b>${U.esc(z.name)}</b><br><span class="text-muted">${S.assets.filter(a=>U.dist(z.lat,z.lng,a.lat,a.lng)<=z.r).length} assets · ${z.r} km</span></div><button class="btn btn-sm btn-outline-primary me-1" data-l="${z.id}">Load</button><button class="btn btn-sm btn-outline-danger" data-x="${z.id}"><i class="bi bi-trash"></i></button></div>`).join('')||'<div class="text-muted small">No saved zones.</div>'}
 const setC=(la,ln,n)=>{$('lat').value=(+la).toFixed(5);$('lng').value=(+ln).toFixed(5);name=n;apply()};
 $('ap').onclick=()=>apply();$('rad').onchange=()=>{$('crad').disabled=$('rad').value!=='c';if($('rad').value!=='c')apply()};
 $('crad').onchange=()=>apply();['fc','fs','fo'].forEach(i=>$(i).onchange=()=>apply(false));
 $('pk').onclick=()=>{picking=true;U.toast('Click anywhere on the map to set the zone centre','info')};
 map.on('click',e=>{if(picking){picking=false;setC(e.latlng.lat,e.latlng.lng,'Custom point')}});
 $('sb').onclick=async()=>{const q=$('q').value.trim();if(!q)return;const p=PRE.find(x=>x.n.toLowerCase()===q.toLowerCase());if(p)return setC(p.lat,p.lng,p.n);
  try{const j=await(await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q))).json();j[0]?setC(j[0].lat,j[0].lon,q):U.toast('Location not found','warning')}catch(e){U.toast('Online search unavailable – choose a preset or enter coordinates','warning')}};
 $('q').onkeydown=e=>{if(e.key==='Enter')$('sb').click()};
 $('sz').onclick=()=>{if(!window._zone)return;const z=window._zone;S.zones.push({id:Date.now(),name:`${name} – ${z.r} km`,lat:z.lat,lng:z.lng,r:z.r});DB.save();zones();U.toast('Monitoring zone saved')};
 $('zl').onclick=e=>{const l=e.target.closest('[data-l]'),x=e.target.closest('[data-x]');
  if(l){const z=S.zones.find(v=>v.id==l.dataset.l);$('rad').value=[5,10,15,20,25,50].includes(z.r)?z.r:'c';$('crad').disabled=$('rad').value!=='c';$('crad').value=z.r;name=z.name;setC(z.lat,z.lng,z.name)}
  if(x){S.zones=S.zones.filter(v=>v.id!=x.dataset.x);DB.save();zones()}};
 zones();apply();
});
