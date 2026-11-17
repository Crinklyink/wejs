const CITY_BLOCKS=[[-5.95,-2.94,-3.78,-.52],[-2.9,-2.06,-3.56,-2.80],[-2,.98,-4.49,-3.56],[1.86,5.66,-4.08,-2.65],[3.12,4.04,-2.35,-1.53],[1.94,6.03,-.2,1.07],[4.61,5.85,1.02,1.96],[1.8,3.69,1.84,2.82],[-6.14,-5.27,.92,3.56],[-4.42,-3.26,1.69,2.74],[-3.21,-2.46,1.47,2.23]];
const PLOT_CENTERS=[[0,.5],[3.2,.5],[0,3.15],[3.2,3.15]];
const FARM_BLOCKS=[[-6,-2.05,-4.2,-1.18],[4.8,6.63,-.67,1.49],[4.30,5.38,-3.55,-2.44],...PLOT_CENTERS.map(([x,z])=>[x-1.34,x+1.34,z-.91,z+.91])];
const CITY_STATIONS=[
 {key:'desk',label:'Trading desk',icon:'monitor',point:[3.68,1.95,-3.56],walk:[2.53,-2.08]},
 {key:'bed',label:'Sleep',icon:'moon',point:[-4.4,1.23,-2.24],walk:[-3.72,-.08]}
];
const FARM_STATIONS=[{key:'barn',label:'Return home',icon:'barn',point:[-4.05,2.1,-1.09],walk:[-4.02,-.60]},...PLOT_CENTERS.map(([x,z],i)=>({key:'plot'+i,label:'Bed 0'+(i+1),icon:'sprout',point:[x,.68,z],walk:[x,z+1.19]}))];
const stations=()=>state.world==='city'?CITY_STATIONS:FARM_STATIONS;
let renderer,player={x:0,z:1.2,yaw:.4},path=[],arrival=null,travelBusy=false,phase=0,framePrev,avatarTime=0,lastMoving=false,keys=new Set(),simClock=0,quoteClock=0,dirtyAfterRestore=false;
function canWalk(x,z){
 const farm=state.world==='farm';if(Math.abs(x)>(farm?6.58:6.03)||Math.abs(z)>(farm?4.63:4.28))return false;
 const blocks=farm?FARM_BLOCKS:CITY_BLOCKS;return !blocks.some(([lx,hx,lz,hz])=>x>lx-.1&&x<hx+.1&&z>lz-.1&&z<hz+.1)
}
/* Search a quarter-metre grid so click-to-walk routes around furniture and beds. */
function findPath(tx,tz){
 const unit=.24,key=(a,b)=>a+','+b,point=([a,b])=>[a*unit,b*unit],start=[Math.round(player.x/unit),Math.round(player.z/unit)],end=[Math.round(tx/unit),Math.round(tz/unit)];
 let goal=key(...end),k0=key(...start),queue=[{v:start,k:k0,score:0}],prev=new Map([[k0,null]]),cost=new Map([[k0,0]]),found=null;
 const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 while(queue.length){queue.sort((a,b)=>b.score-a.score);const cur=queue.pop();if(cur.k===goal){found=cur;break}
   for(const [dx,dz] of dirs){const a=cur.v[0]+dx,b=cur.v[1]+dz,nk=key(a,b),x=a*unit,z=b*unit;if(!canWalk(x,z)||(dx&&dz&&(!canWalk(cur.v[0]*unit,z)||!canWalk(x,cur.v[1]*unit))))continue;
     const d=cost.get(cur.k)+Math.hypot(dx,dz);if(d>=(cost.get(nk)??Infinity))continue;cost.set(nk,d);prev.set(nk,cur.k);queue.push({v:[a,b],k:nk,score:d+Math.hypot(a-end[0],b-end[1])})}
 }
 if(!found)return null;const route=[];let k=found.k;while(k!==k0){route.unshift(point(k.split(',').map(Number)));k=prev.get(k)}if(canWalk(tx,tz))route.push([tx,tz]);return route
}
function go(x,z,key=null){const route=findPath(x,z);if(!route)return false;path=route;arrival=key;return true}
function requestStation(key){
 if(travelBusy)return;showPanel(false);const s=stations().find(v=>v.key===key);if(!s)return;
 if(!renderer||Math.hypot(player.x-s.walk[0],player.z-s.walk[1])<.4){activate(key);return}
 if(!go(...s.walk,key)){toast('Move closer to '+s.label.toLowerCase()+'.');return}$('#scene').focus({preventScroll:true})
}
function activate(key){arrival=null;path=[];keys.clear();tone(375);if(key.startsWith('plot')){selectedBed=Number(key.slice(4));openDialog('plot')}else{if(key==='desk'){orderQty=1;orderFeedback=''}openDialog(key)}}
function nearest(){const choice=stations().map(s=>({s,d:Math.hypot(player.x-s.walk[0],player.z-s.walk[1])})).sort((a,b)=>a.d-b.d)[0];if(choice.d<2.35)requestStation(choice.s.key);else toast('Walk closer to a station or select its label.')}
function makeMarkers(){const el=$('#markers');el.replaceChildren();stations().forEach(s=>{const b=document.createElement('button');b.className='marker';b.innerHTML=icon(s.icon)+s.label;b.dataset.station=s.key;b.onclick=()=>requestStation(s.key);el.append(b)})}
function projectMarkers(){if(!renderer?.vp)return;document.querySelectorAll('.marker').forEach((b,i)=>{const s=stations()[i],[x,y]=renderer.project(...s.point);b.style.left=x+'px';b.style.top=y+'px';b.style.visibility=x<22||x>renderer.cssW-22||y<25||y>renderer.cssH-20?'hidden':'visible'})}
function refreshPlace(){if(!renderer)return;renderer.build(state.world==='farm',state.plots);renderer.avatar(player.x,player.z,player.yaw,0,false);renderer.render();projectMarkers()}
function resetCamera(){if(!renderer)return;renderer.angle=.655;renderer.elev=.51;renderer.zoom=1;renderer.dirty=true}
function setupWorld(){
 path=[];arrival=null;keys.clear();player=state.world==='city'?{x:.25,z:.58,yaw:.7}:{x:-2.32,z:.50,yaw:.6};resetCamera();updateHUD();makeMarkers();refreshPlace()
}
function travelSequence(){
 if(travelBusy)return;travelBusy=true;closeDialog();keys.clear();const t=$('#transition'),going=state.world==='city';t.querySelector('i').innerHTML=icon(going?'moon':'sun');t.querySelector('strong').textContent=going?'Waking at Willow Farm…':'Returning to Eastbank…';t.classList.add('in');tone(going?272:392);
 setTimeout(()=>{travelToWorld();ripen();setupWorld();persist();setTimeout(()=>{t.classList.remove('in');travelBusy=false},300)},330)
}
function zoom(delta){if(!renderer)return;renderer.zoom=bound(renderer.zoom*delta,.69,1.85);renderer.dirty=true}
function wireWorld(){
 const canvas=$('#scene');let drag=null;
 $('#zoom-in').onclick=()=>zoom(1.15);$('#zoom-out').onclick=()=>zoom(1/1.15);$('#camera-home').onclick=resetCamera;
 canvas.addEventListener('pointerdown',e=>{if(!renderer||travelBusy)return;if($('#sidebar').classList.contains('open')){showPanel(false);return}canvas.focus({preventScroll:true});drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle:renderer.angle,elev:renderer.elev,moved:false};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>4)drag.moved=true;if(drag.moved){canvas.classList.add('dragging');renderer.angle=bound(drag.angle-dx*.0041,.08,1.36);renderer.elev=bound(drag.elev+dy*.0025,.27,.93);renderer.dirty=true}});
 canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&renderer.vp){const r=canvas.getBoundingClientRect(),p=renderer.ground(e.clientX-r.left,e.clientY-r.top);if(canWalk(...p))go(...p)}canvas.classList.remove('dragging');drag=null});
 canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('dragging')});canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(Math.exp(-e.deltaY*.0012))},{passive:false});
 const controls=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
 window.addEventListener('keydown',e=>{if(modal||travelBusy||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(controls.includes(k)){e.preventDefault();keys.add(k);arrival=null;path=[];showPanel(false)}else if(k==='e'&&!e.repeat){e.preventDefault();nearest()}else if(['+','=','-'].includes(k)){e.preventDefault();zoom(k==='-'?1/1.15:1.15)}else if(k==='escape')showPanel(false)});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>{keys.clear();framePrev=undefined;if(document.hidden)persist()});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dirtyAfterRestore=true;toast('Graphics paused. Restoring the world…')});canvas.addEventListener('webglcontextrestored',()=>{renderer=new Renderer(canvas);renderer.quality=state.quality;dirtyAfterRestore=false;setupWorld()});
 window.addEventListener('resize',()=>{if(renderer)renderer.dirty=true})
}
function walkFrame(dt){
 if(!renderer||modal||travelBusy)return false;let dx=0,dz=0;
 if(keys.size){const h=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),v=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));dx=Math.cos(renderer.angle)*h+Math.sin(renderer.angle)*v;dz=-Math.sin(renderer.angle)*h+Math.cos(renderer.angle)*v;const l=Math.hypot(dx,dz)||1;dx=dx/l*dt*3.5;dz=dz/l*dt*3.5}
 else if(path.length){const [x,z]=path[0],dist=Math.hypot(x-player.x,z-player.z),step=Math.min(dist,dt*5.2);if(dist>.001){dx=(x-player.x)/dist*step;dz=(z-player.z)/dist*step}if(dist<=step+.001)path.shift()}
 const ox=player.x,oz=player.z;if(canWalk(player.x+dx,player.z))player.x+=dx;if(canWalk(player.x,player.z+dz))player.z+=dz;const moving=Math.abs(player.x-ox)+Math.abs(player.z-oz)>.0001;if(moving){player.yaw=Math.atan2(dx,dz);phase+=dt*13}
 if(!path.length&&arrival){const key=arrival;arrival=null;activate(key)}return moving
}
function frame(now){
 const dt=framePrev===undefined?0:Math.min((now-framePrev)/1000,.09);framePrev=now;
 if(!document.hidden&&!dirtyAfterRestore){const moving=walkFrame(dt);avatarTime+=dt;
   if(renderer&&((moving&&avatarTime>1/30)||moving!==lastMoving)){renderer.avatar(player.x,player.z,player.yaw,phase,moving);avatarTime=0}lastMoving=moving;
   if(renderer&&renderer.render())projectMarkers();simClock+=dt;quoteClock+=dt;
   if(simClock>=1){simClock=0;if(ripen()){persist();if(state.world==='farm')refreshPlace();updateHUD();if(modal==='plot')renderModal()}
     if(modal==='plot'&&$('#grow-time'))$('#grow-time').textContent=Math.max(0,Math.ceil((state.plots[selectedBed].ripeAt-Date.now())/1000))}
   if(quoteClock>=16&&state.world==='city'&&modal!=='desk'&&!travelBusy){quoteClock=0;priceTick();state.dayMinute=Math.min(1439,state.dayMinute+3);persist();updateHUD();if(modal==='portfolio')renderModal()}
 }requestAnimationFrame(frame)
}
function boot(){wireUI();ripen();try{renderer=new Renderer($('#scene'));renderer.quality=state.quality||2}catch(e){console.warn('Switching to software rendering:',e);const replacement=$('#scene').cloneNode(false);$('#scene').replaceWith(replacement);renderer=new SoftwareRenderer(replacement);renderer.quality=1}
 wireWorld();setupWorld();requestAnimationFrame(frame)}
boot();
