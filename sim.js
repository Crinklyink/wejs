const STOCKS=[
 {id:'AXM',name:'Axiom Systems',price:148.72,drift:.00025,vol:.013},
 {id:'VLT',name:'Volt Energy',price:83.46,drift:.00016,vol:.019},
 {id:'NVA',name:'Nova Labs',price:214.18,drift:.0001,vol:.025},
 {id:'GRN',name:'Greenline Ag',price:56.82,drift:.00018,vol:.011}
];
const CROPS={carrot:{label:'Carrots',cost:14,sale:64,seconds:18},tomato:{label:'Tomatoes',cost:28,sale:126,seconds:30},corn:{label:'Corn',cost:42,sale:194,seconds:45}};
const SAVE_KEY='highrise-harvest:world:v1';
const roundCash=n=>Math.round(n*100)/100, dollars=n=>n.toLocaleString('en-US',{style:'currency',currency:'USD'}),signed=n=>(n>=0?'+':'−')+Math.abs(n).toFixed(2)+'%';
function startGame(){
 const plots=Array.from({length:4},()=>({stage:'empty',crop:'carrot',ripeAt:0}));
 plots[2]={stage:'ready',crop:'carrot',ripeAt:0};
 return {version:1,world:'city',day:1,cash:12500,stocks:STOCKS.map((s,i)=>{
   let x=s.price*(1-[.018,-.012,.023,.006][i]),history=[];
   for(let k=0;k<32;k++){x+=Math.sin(k*3.12+i*.6)*.2+Math.cos(k*1.4+i)*.42+Math.sin(k*.75-i)*.25+(s.price-x)*.08;history.push(roundCash(x))}
   history[31]=s.price;return {price:s.price,history,open:roundCash(s.price/(1+[.0184,-.0121,.0236,.0065][i])),shares:0,basis:0}
 }),plots,goals:{trade:false,sleep:false,plant:false,water:false,harvest:false},dayMinute:1070,
 journal:[{day:1,world:'city',text:'Moved into the penthouse with '+dollars(12500)+'.',icon:'home'}],sound:true,quality:2,seed:'carrot'}
}
function loadGame(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s?.version===1&&['farm','city'].includes(s.world)&&s.stocks?.length===4&&s.plots?.length===4&&s.goals&&Array.isArray(s.journal)&&Number.isFinite(s.cash)&&Number.isInteger(s.day)&&s.stocks.every(q=>Number.isFinite(q.price)&&Array.isArray(q.history)&&q.price>0)&&s.plots.every(p=>p.crop in CROPS&&['empty','planted','watered','ready'].includes(p.stage)))return s}catch{}return startGame()}
let state=loadGame(),storageOK=true;
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));storageOK=true}catch{storageOK=false}const tag=document.querySelector('#save-indicator');if(tag)tag.innerHTML=storageOK?'<b></b> Autosaved':'Session only'}
function logEvent(text,icon){state.journal.unshift({day:state.day,world:state.world,text,icon});state.journal=state.journal.slice(0,80)}
function netWorth(){return roundCash(state.cash+reservedCash()+state.stocks.reduce((n,q)=>n+q.price*q.shares,0))}
function priceTick(overnight=false){
 const mood=(Math.random()-.51)*.009,news=dispatch();
 state.stocks.forEach((q,i)=>{if(overnight)q.open=q.price;const s=STOCKS[i],move=(Math.random()+Math.random()-1)*s.vol*(overnight?2.5:1)+mood+s.drift+news.tilt[i]*(overnight?1.5:.42);q.price=roundCash(Math.max(3,q.price*(1+move)));q.history.push(q.price);q.history=q.history.slice(-42)});matchOrders()
}
function trade(i,qty,buy){
 const q=state.stocks[i];if(state.world!=='city'||!Number.isSafeInteger(qty)||qty<1||qty>999999)return 'Enter a whole number of shares.';
 const cost=roundCash(q.price*qty);if(buy&&cost>state.cash)return 'Cash available: '+dollars(state.cash)+'.';if(!buy&&qty>availableShares(i))return 'Available shares: '+availableShares(i)+'.';
 settleOrder(i,qty,buy,q.price);const msg=(buy?'Bought ':'Sold ')+qty+' '+STOCKS[i].id+' at '+dollars(q.price)+'.';logEvent(msg,'chart');persist();return msg
}
function tend(index,now=Date.now()){
 const plot=state.plots[index],before=plot.stage,seed=state.seed in CROPS?state.seed:'carrot';let msg;
 if(state.world!=='farm')return 'Visit the farm first.';
 if(plot.stage==='empty'){const c=CROPS[seed];if(state.cash<c.cost)return 'You need '+dollars(c.cost)+' for these seeds.';state.cash=roundCash(state.cash-c.cost);Object.assign(plot,{crop:seed,stage:'planted',ripeAt:0});state.goals.plant=true;msg='Planted '+c.label.toLowerCase()+' in bed '+(index+1)+'.'}
 else if(plot.stage==='planted'){plot.stage='watered';plot.ripeAt=now+growTime(plot.crop)*1000;state.goals.water=true;msg='Watered bed '+(index+1)+'.'}
 else if(plot.stage==='ready'){const c=CROPS[plot.crop],sale=farmPrice(plot.crop);state.cash=roundCash(state.cash+sale);plot.stage='empty';plot.ripeAt=0;state.goals.harvest=true;msg='Sold '+c.label.toLowerCase()+' for '+dollars(sale)+'.'}else return 'This bed is growing.';
 recordTending(before,plot.crop);logEvent(msg,'sprout');persist();return msg
}
function ripen(now=Date.now()){let changed=false;state.plots.forEach(p=>{if(p.stage==='watered'&&now>=p.ripeAt){p.stage='ready';changed=true}});return changed}
function travelToWorld(){if(state.world==='city'){state.world='farm';state.goals.sleep=true;logEvent('Woke up at Willow Farm.','sun')}else{state.world='city';state.day++;state.dayMinute=960;state.goals={trade:false,sleep:false,plant:false,water:false,harvest:false};priceTick(true);greenhouseIncome();logEvent('Returned to the penthouse for a new trading day.','home')}persist()}

