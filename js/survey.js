/* Field survey: register new installations (GPS via navigator.geolocation, photo) straight into the shared store. */
App.mount('field-survey',()=>{
 const S=DB.state,$=id=>document.getElementById(id);let photo='';
 $('s_cat').innerHTML=U.opts(S.cats.filter(c=>c.on).map(c=>[c.key,c.label]));
 $('s_st').innerHTML=U.opts(STATUSES,'Working');
 $('wl').innerHTML=WARDS.map(w=>`<option value="${U.esc(w.n)}">`).join('');
 const draw=()=>{const l=S.assets.filter(a=>a.source==='Field Survey').reverse();$('rt').innerHTML=l.map(a=>`<tr><td>${a.id}</td><td>${U.esc(a.name)}</td><td>${U.esc(a.ward)}</td><td>${U.badge(a.status)}</td><td>${a.photo?`<img class="thumb" style="height:34px" src="${a.photo}">`:'—'}</td></tr>`).join('')||'<tr><td colspan=5 class="empty">No surveys submitted yet.</td></tr>'};
 $('gps').onclick=()=>{if(!navigator.geolocation)return U.toast('Geolocation is not supported by this browser','danger');U.toast('Locating…','info');
  navigator.geolocation.getCurrentPosition(p=>{$('s_lat').value=p.coords.latitude.toFixed(6);$('s_lng').value=p.coords.longitude.toFixed(6);U.toast(`Location captured (±${Math.round(p.coords.accuracy)} m)`)},e=>U.toast('Could not get location: '+e.message+' (use https/localhost and allow permission)','danger'),{enableHighAccuracy:true,timeout:10000})};
 $('s_ph').onchange=e=>{if(e.target.files[0])U.img(e.target.files[0],d=>{photo=d;$('pv').src=d;$('pv').classList.remove('d-none')})};
 $('sub').onclick=()=>{const f=$('sf');f.classList.add('was-validated');if(!f.checkValidity())return U.toast('Please complete the required fields','danger');
  const c=$('s_cat').value,sl=c==='SSL'||c==='STL',st=$('s_st').value,cap=+$('s_cap').value,ward=$('s_ward').value.trim(),eq=$('s_eq').value.trim();
  const a={id:DB.nextId(c),name:$('s_name').value.trim(),cat:c,location:$('s_addr').value.trim(),ward,...DB.geo(ward),lat:+$('s_lat').value,lng:+$('s_lng').value,cap,date:U.iso(Date.now()),mfr:eq||'To be verified',model:'—',battery:sl?'To be verified':'None / not recorded',inverter:eq||'To be verified',
   contractor:CONTRACTORS[0],warranty:U.iso(Date.now()+5*365*864e5),status:st,lastInsp:U.iso(Date.now()),pk:4.6,batStatus:sl?'Healthy':'N/A',invStatus:st==='Offline'?'Offline':'Online',batV:sl?12.6:null,batPct:sl?78:undefined,charging:sl?'Charging':'N/A',controller:'OK',ledW:sl?30:0,batAh:sl?30:0,panels:Math.max(1,Math.round(cap*1000/545)),owner:'',remarks:$('s_rem').value.trim(),photo,source:'Field Survey'};
  DB.recalc(a);S.assets.push(a);DB.save();f.reset();f.classList.remove('was-validated');photo='';$('pv').classList.add('d-none');draw();U.toast(a.id+' registered – now visible on the map, dashboard and reports')};
 draw();
});
