/* Seed records live in HTML table rows; this script handles loading, persistence and updates. */
const APP_DATA=JSON.parse(document.getElementById('app-data').textContent);
const {STATUSES,STAGES,ROLES,MODULES,TECHS,CONTRACTORS,WARDS,ALERT_TYPES,PRIORITIES,NEW_TICKET_PRIORITIES,TICKET_TYPES,ALERT_STATUSES}=APP_DATA;
const SEED_STATE={assets:[],cats:[],alerts:[],tickets:[],read:[],zones:[],users:[],settings:JSON.parse(JSON.stringify(APP_DATA.DEFAULT_SETTINGS))};
document.querySelectorAll('#app-seed-data tbody tr[data-collection]').forEach(row=>{
 const collection=row.dataset.collection;
 if(Array.isArray(SEED_STATE[collection]))SEED_STATE[collection].push(JSON.parse(row.dataset.record));
});
const DB=(()=>{
 const KEY='isams_v2',LEGACY_KEY='isams_v1';let state=null;
 const pad=(n,l=4)=>String(n).padStart(l,'0');
 function recalc(a){const f=APP_DATA.GENERATION_FACTORS[a.status];a.daily=+(a.cap*(a.pk||4.6)*f).toFixed(1);if(a.cat==='SSL'||a.cat==='STL')a.lightOn=f>0.9}
 function shiftDates(value,delta){
  if(Array.isArray(value)){value.forEach((v,i)=>value[i]=shiftDates(v,delta));return value}
  if(value&&typeof value==='object'){Object.keys(value).forEach(k=>value[k]=shiftDates(value[k],delta));return value}
  if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)){
   const shifted=new Date(Date.parse(value)+delta).toISOString();return value.length===10?shifted.slice(0,10):shifted
  }
  return value
 }
 function fix(a){a.status='Working';a.invStatus='Online';a.batStatus=a.batV!=null?'Healthy':'N/A';a.charging=a.batV!=null?'Charging':'N/A';a.controller='OK';if(a.batV!=null){a.batV=12.6;a.batPct=78}a.lastInsp=new Date().toISOString().slice(0,10);recalc(a)}
 function geo(w){const x=WARDS.find(v=>v.n.toLowerCase()===String(w).toLowerCase());return{district:x?x.d:'Khordha',city:x?x.c:'Bhubaneswar'}}
 function alertType(a){return a.status==='Offline'?ALERT_TYPES[4]:a.status==='Maintenance Required'?ALERT_TYPES[6]:(a.cat==='SSL'||a.cat==='STL')?(a.batV&&a.batV<state.settings.thr.battV?ALERT_TYPES[1]:a.charging==='Fault'?ALERT_TYPES[5]:ALERT_TYPES[0]):(a.invStatus==='Fault'?ALERT_TYPES[2]:ALERT_TYPES[3])}
 function newAlert(a){const t=alertType(a),n=Math.max(0,...state.alerts.map(x=>+x.id.slice(4)))+1;const al={id:'ALT-'+pad(n),assetId:a.id,location:a.location,type:t[0],severity:t[1],at:new Date().toISOString(),tech:TECHS[n%TECHS.length],status:'New',resolvedAt:null};state.alerts.unshift(al);return al}
 function nextId(cat){const re=new RegExp('^'+cat+'-(\\d+)$');return cat+'-'+pad(Math.max(0,...state.assets.map(a=>(re.exec(a.id)||[0,0])[1]*1))+1)}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('localStorage unavailable/full',e)}}
 function seed(){return shiftDates(JSON.parse(JSON.stringify(SEED_STATE)),Date.now()-(APP_DATA.generatedAt||Date.now()))}
 function mergeSeedAssets(saved){
  if(!Array.isArray(saved.assets))return seed();
  const initial=seed().assets,current=new Map(saved.assets.filter(a=>a&&a.id).map(a=>[a.id,a])),initialIds=new Set(initial.map(a=>a.id));
  saved.assets=initial.map(a=>current.get(a.id)||a).concat(saved.assets.filter(a=>!initialIds.has(a.id)));
  return saved
 }
 function load(){
  try{state=JSON.parse(localStorage.getItem(KEY))}catch(e){state=null}
  if(!state||!Array.isArray(state.assets)){
   let legacy=null;
   try{legacy=JSON.parse(localStorage.getItem(LEGACY_KEY))}catch(e){legacy=null}
   state=legacy&&Array.isArray(legacy.assets)?mergeSeedAssets(legacy):seed();
   save()
  }
 }
 load();
 return{get state(){return state},save,recalc,fix,geo,alertType,newAlert,nextId,asset:id=>state.assets.find(a=>a.id===id),reset(){localStorage.removeItem(KEY);localStorage.removeItem(LEGACY_KEY);load()}};
})();
