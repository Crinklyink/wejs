const CITY_BLOCKS=[[-5.95,-2.94,-3.78,-.52],[-2.9,-2.06,-3.56,-2.80],[-2,.98,-4.49,-3.56],[1.86,5.66,-4.08,-2.65],[3.12,4.04,-2.35,-1.53],[1.94,6.03,-.2,1.07],[4.61,5.85,1.02,1.96],[1.8,3.69,1.84,2.82],[-6.14,-5.27,.92,3.56],[-4.42,-3.26,1.69,2.74],[-3.21,-2.46,1.47,2.23]];
const PLOT_CENTERS=[[0,.5],[3.2,.5],[0,3.15],[3.2,3.15]];
CITY_BLOCKS.push([-1.27,1.55,4.085,4.60]);
const FARM_BLOCKS=[[-6,-2.05,-4.2,-1.18],[4.8,6.63,-.67,1.49],[4.30,5.38,-3.55,-2.44],[-6.51,4.03,-4.66,-4.55],[-6.69,-6.54,-4.6,-.35],[6.28,6.43,-8.33,-3.58],[9.61,9.76,-8.33,-3.58],[6.28,9.76,-8.33,-8.19],[6.28,7.51,-3.65,-3.53],[8.58,9.76,-3.65,-3.53],[6.69,7.54,-3.60,-3.19],
 ...[[-10.5,-7.6],[-10.3,5.9],[11.6,7.7],[-4.8,10.35],[-5.76,1.25],[-4.78,3.48],[-.14,-3.32]].map(([x,z])=>[x-.21,x+.21,z-.21,z+.21]),
 ...PLOT_CENTERS.map(([x,z])=>[x-1.34,x+1.34,z-.91,z+.91])];
const CITY_STATIONS=[
 {key:'desk',label:'Use trading desk',icon:'monitor',point:[3.68,1.45,-3.56],walk:[2.53,-2.08]},
 {key:'bed',label:'Sleep at home',icon:'moon',point:[-4.4,.72,-1.45],walk:[-3.72,-.08]},
 {key:'letter',label:'Read June’s envelope',icon:'book',point:[-2.54,.77,-3.08],walk:[-2.51,-2.37]},
 {key:'record',label:'Use the turntable',icon:'volume',point:[-5.7,1,2.42],walk:[-4.94,2.45]},
 {key:'coffee',label:'Pour a coffee',icon:'sun',point:[-1.38,1.18,-3.99],walk:[-1.37,-3.02]}
];
const FARM_STATIONS=[{key:'barn',label:'Return to the city',icon:'barn',point:[-4.05,1.12,-1.09],walk:[-4.02,-.60]},{key:'greenhouse',label:'June’s potting bench',icon:'book',point:[7.13,.92,-3.39],walk:[7.13,-2.75]},...PLOT_CENTERS.map(([x,z],i)=>({key:'plot'+i,label:'Tend bed 0'+(i+1),icon:'sprout',point:[x,.36,z],walk:[x,z+1.19]}))];
const stations=()=>state.world==='city'?CITY_STATIONS:FARM_STATIONS;
let renderer,player={x:0,z:1.2,yaw:0,pitch:0},path=[],arrival=null,travelBusy=false,phase=0,framePrev,keys=new Set(),simClock=0,quoteClock=0,dirtyAfterRestore=false,ambientClock=0,lastAmb=0,aimed=null,stick=[0,0],bob=0;
function canWalk(x,z){
 const farm=state.world==='farm';if(Math.abs(x)>(farm?15.25:6.03)||Math.abs(z)>(farm?13.27:4.28))return false;
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
function stationByKey(key){return stations().find(s=>s.key===key)}
function facingPoint(p){const dx=p[0]-player.x,dz=p[2]-player.z;return [Math.atan2(dx,-dz),Math.atan2(p[1]-1.66,Math.max(.001,Math.hypot(dx,dz)))]}
const turnDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function guideLook(yaw,pitch,factor){player.yaw+=turnDiff(yaw,player.yaw)*factor;player.pitch+=(pitch-player.pitch)*factor}
function requestStation(key){
 if(travelBusy)return;showPanel(false);const s=stationByKey(key);if(!s)return;const d=Math.hypot(player.x-s.walk[0],player.z-s.walk[1]);if(d<.53){activate(key);return}
 const route=findPath(...s.walk);if(!route){toast('Walk around to '+s.label.toLowerCase()+'.');return}arrival=key;path=route;keys.clear();toast('Walking to '+({desk:'the trading desk',bed:'the bedroom',barn:'the barn',greenhouse:'June’s greenhouse',coffee:'the coffee counter',letter:'June’s envelope'}[key]||'the garden bed')+'…')
}
function activate(key){
 const s=stationByKey(key);if(!s)return;arrival=null;path=[];keys.clear();const angle=facingPoint(s.point);player.yaw=angle[0];player.pitch=bound(angle[1],-.8,.65);syncCamera();soundscape.cue('interact');
 if(key.startsWith('plot')){selectedBed=Number(key.slice(4));openDialog('plot')}else{if(key==='desk'){orderQty=1;orderMode='market';limitPrice=state.stocks[selectedStock].price;orderFeedback=''}openDialog(key)}
}
function chooseFocus(){
 if(!renderer?.eye)return null;let best=null,bestScore=Infinity;
 for(const s of stations()){const vec=V3.sub(s.point,renderer.eye),d=Math.hypot(...vec);if(d>3.05)continue;const dot=V3.dot(vec,renderer.forward)/d,near=Math.hypot(s.walk[0]-player.x,s.walk[1]-player.z);
   if(dot<.70&&!(near<.72&&dot>.30))continue;const score=(1-dot)*5+d*.16;if(score<bestScore){best=s;bestScore=score}}
 return best
}
function syncHint(){
 const s=modal||travelBusy?null:chooseFocus();if(aimed?.key!==s?.key){aimed=s;$('#station-hint').innerHTML=s?'<button id="use-object"><kbd>E</kbd>'+s.label+'</button>':'';const b=$('#use-object');if(b)b.onclick=()=>activate(s.key)}$('#viewport').classList.toggle('has-focus',!!s)
}
function useFocused(){if(aimed){activate(aimed.key);return}const near=stations().map(s=>[Math.hypot(player.x-s.walk[0],player.z-s.walk[1]),s]).sort((a,b)=>a[0]-b[0])[0];if(near&&near[0]<1.2)activate(near[1].key);else toast('Face a nearby object to use it. Tab opens the dashboard.')}
function syncCamera(){if(!renderer)return;renderer.setPose(player.x,player.z,player.yaw,player.pitch,1.66+bob)}
function refreshPlace(){
 if(!renderer)return;renderer.weather=dispatch().sky;renderer.build(state.world==='farm',state.plots,state.story);renderer.updatePanels(state.stocks);renderer.fov=state.fov||70;renderer.quality=state.quality||2;syncCamera();renderer.render();syncHint()
}
function spawnPose(){return state.world==='city'?{x:1.18,z:3.43,yaw:-.22,pitch:-.075}:{x:-1.72,z:6.63,yaw:.04,pitch:-.10}}
function setupWorld(restore=false){
 path=[];aimed=null;arrival=null;keys.clear();bob=0;player=spawnPose();const saved=state.pose;
 if(restore&&saved?.world===state.world&&[saved.x,saved.z,saved.pitch,saved.yaw].every(Number.isFinite)&&canWalk(saved.x,saved.z))Object.assign(player,{x:saved.x,z:saved.z,yaw:saved.yaw,pitch:bound(saved.pitch,-1.28,1.28)});
 soundscape.world(state.world);updateHUD();refreshPlace();$('#station-hint').innerHTML='';aimed=null;syncHint();soundscape.record?.(state.recordOn&&state.world==='city')
}
function rememberPose(){state.pose={...player,world:state.world}}
function travelSequence(){
 if(travelBusy)return;travelBusy=true;releaseLook();closeDialog();const t=$('#transition'),going=state.world==='city';t.querySelector('i').innerHTML=icon(going?'moon':'tower');t.querySelector('strong').textContent=going?'The city falls quiet.':'The last train to Eastbank.';t.classList.add('in');soundscape.cue(going?'sleep':'interact');
 setTimeout(()=>{travelToWorld();state.farmMinute=390;ripen();setupWorld();rememberPose();persist();t.querySelector('strong').textContent=going?'Morning at Willow Farm':'Evening on the 48th floor';setTimeout(()=>{t.classList.remove('in');travelBusy=false;syncHint()},420)},470)
}
function look(dx,dy){player.yaw+=dx*.00225*(state.sensitivity||1);player.pitch=bound(player.pitch-dy*.00215*(state.sensitivity||1),-1.36,1.36);syncCamera()}
function lockMouse(){if(modal||travelBusy)return;const el=$('#scene');el.focus({preventScroll:true});if(typeof el.requestPointerLock==='function'){try{const p=el.requestPointerLock();p?.catch(()=>toast('Drag to look around. Arrow keys also turn your view.'))}catch{toast('Drag to look around. Arrow keys also turn your view.')}}else toast('Drag to look around. Arrow keys also turn your view.')}
function wireWorld(){
 const canvas=$('#scene'),pad=$('#touch-pad');let drag=null,joy=null;
 $('#enter-look').onclick=lockMouse;$('#touch-use').onclick=useFocused;
 const clearStick=()=>{joy=null;stick=[0,0];pad.firstChild.style.transform='translate(-50%,-50%)'};
 function updateStick(e){const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.38),dz=(e.clientY-r.top-r.height/2)/(r.height*.38),len=Math.max(1,Math.hypot(dx,dz));stick=[dx/len,dz/len];pad.firstChild.style.transform='translate(calc(-50% + '+stick[0]*23+'px),calc(-50% + '+stick[1]*23+'px))';path=[];arrival=null}
 pad.addEventListener('pointerdown',e=>{e.preventDefault();joy=e.pointerId;pad.setPointerCapture(joy);updateStick(e)});pad.addEventListener('pointermove',e=>{if(joy===e.pointerId)updateStick(e)});for(const k of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(k,clearStick);
 canvas.addEventListener('pointerdown',e=>{if(modal||travelBusy)return;if($('#sidebar').classList.contains('open')){showPanel(false);return}if(state.sound)soundscape.enable(true,state.world);canvas.focus({preventScroll:true});
 if(document.pointerLockElement===canvas){if(aimed)useFocused();return}drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,type:e.pointerType};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||document.pointerLockElement===canvas)return;look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY});
 canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const tapped=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<4,type=drag.type;drag=null;if(tapped&&type==='mouse')lockMouse()});canvas.addEventListener('pointercancel',()=>{drag=null});
 document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&!modal&&!travelBusy)look(e.movementX,e.movementY)});document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas;document.body.classList.toggle('mouse-locked',locked);$('#enter-look').textContent=locked?'Esc to release mouse':'Enable mouse look';if(!locked)keys.clear()});
 const movement=['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown','shift'];
 window.addEventListener('keydown',e=>{if(modal||travelBusy||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='tab'&&(!e.repeat)&&(document.activeElement===canvas||document.activeElement===document.body||document.pointerLockElement)){e.preventDefault();showPanel(!$('#sidebar').classList.contains('open'));return}if(k==='escape'){showPanel(false);return}if($('#sidebar').classList.contains('open'))return;
 if(movement.includes(k)){e.preventDefault();keys.add(k);path=[];arrival=null}else if(k==='e'&&!e.repeat){e.preventDefault();useFocused()}});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();clearStick()});document.addEventListener('visibilitychange',()=>{keys.clear();clearStick();framePrev=undefined;soundscape.suspend(document.hidden);if(document.hidden){rememberPose();persist()}});
 window.addEventListener('pagehide',()=>{rememberPose();persist()});window.addEventListener('resize',()=>{if(renderer)renderer.dirty=true});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dirtyAfterRestore=true;toast('Restoring graphics…')});canvas.addEventListener('webglcontextrestored',()=>{renderer=new Renderer(canvas);dirtyAfterRestore=false;refreshPlace()})
}
function walkFrame(dt){
 if(!renderer||modal||travelBusy||$('#sidebar').classList.contains('open'))return;let dx=0,dz=0;
 const turn=Number(keys.has('arrowright'))-Number(keys.has('arrowleft')),tilt=Number(keys.has('arrowup'))-Number(keys.has('arrowdown'));if(turn||tilt){player.yaw+=turn*dt*1.75;player.pitch=bound(player.pitch+tilt*dt*1.12,-1.36,1.36);syncCamera()}
 const h=Number(keys.has('d'))-Number(keys.has('a'))+stick[0],v=Number(keys.has('w'))-Number(keys.has('s'))-stick[1],sprint=keys.has('shift');
 if(h||v){const rate=state.world==='farm'?(sprint?4.9:2.85):(sprint?3.8:2.35),l=Math.max(1,Math.hypot(h,v));dx=(Math.cos(player.yaw)*h+Math.sin(player.yaw)*v)/l*dt*rate;dz=(Math.sin(player.yaw)*h-Math.cos(player.yaw)*v)/l*dt*rate}
 else if(path.length){const [x,z]=path[0],dist=Math.hypot(x-player.x,z-player.z),step=Math.min(dist,dt*4.0);if(dist>.001){dx=(x-player.x)/dist*step;dz=(z-player.z)/dist*step;guideLook(Math.atan2(dx,-dz),-.055,Math.min(1,dt*6))}if(dist<=step+.001)path.shift()}
 const x=player.x,z=player.z;if(canWalk(x+dx,z))player.x+=dx;if(canWalk(player.x,z+dz))player.z+=dz;const traveled=Math.hypot(player.x-x,player.z-z);
 if(traveled>.0001){phase+=traveled*(sprint?7.4:8.3);bob=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(phase)*.018;soundscape.step(state.world,sprint);syncCamera()}
 else if(Math.abs(bob)>.001){bob*=.62;syncCamera()}
 if(!path.length&&arrival){const key=arrival;arrival=null;activate(key)}
}
function frame(now){
 const dt=framePrev===undefined?0:Math.min((now-framePrev)/1000,.12);framePrev=now;
 if(!document.hidden&&!dirtyAfterRestore){walkFrame(dt);ambientClock+=dt;simClock+=dt;quoteClock+=dt;
   if(renderer){soundscape.listener?.(player.x,player.z,player.yaw);renderer.clock=ambientClock;if(renderer.effect)renderer.dirty=true;if(!renderer.isSoftware&&ambientClock-lastAmb>.16&&!modal){renderer.dirty=true;lastAmb=ambientClock}if(renderer.render())syncHint()}
   if(simClock>=1){simClock=0;if(ripen()){persist();if(state.world==='farm')refreshPlace();updateHUD();if(modal==='plot')renderModal()}
     if(modal==='plot'&&$('#grow-time'))$('#grow-time').textContent=Math.max(0,Math.ceil((state.plots[selectedBed].ripeAt-Date.now())/1000))}
   if(quoteClock>=16&&modal!=='desk'&&!travelBusy){quoteClock=0;priceTick();if(state.world==='city'){renderer.updatePanels(state.stocks);state.dayMinute=Math.min(1439,state.dayMinute+3)}else state.farmMinute=Math.min(1080,(state.farmMinute||390)+3);rememberPose();persist();updateHUD();if(modal==='portfolio')renderModal()}
 }requestAnimationFrame(frame)
}
function boot(){wireUI();ripen();try{renderer=new Renderer($('#scene'))}catch(e){console.warn('Using the software 3D renderer:',e);const replacement=$('#scene').cloneNode(false);$('#scene').replaceWith(replacement);renderer=new SoftwareRenderer(replacement)}
 const wakeAudio=()=>{if(state.sound)soundscape.enable(true,state.world);if(state.recordOn&&state.world==='city')soundscape.record?.(true)};window.addEventListener('pointerdown',wakeAudio,{once:true,capture:true});window.addEventListener('keydown',wakeAudio,{once:true,capture:true});wireWorld();setupWorld(true);requestAnimationFrame(frame)}
boot();
