/* Every dispatch belongs to a market session. Crop timing and produce prices
   share the local forecast, while the four fictional sectors react differently. */
const DISPATCHES=[
 {title:'Freight through Eastbank again',weather:'Clear',sky:.08,growth:1,sale:1.06,tilt:[.002,-.004,.001,.006],wire:'The rail bridge reopened before the bell. Produce buyers can move full crates again.',farm:'June left the side gate unlatched. The first carrots are yours to pull.'},
 {title:'Rain on the union roof',weather:'Rain clearing',sky:.70,growth:.83,sale:.93,tilt:[-.004,.006,-.005,-.003],wire:'A wet front lifted demand for power overnight. The co-op expects a bumper crop and lower prices at the gate.',farm:'The water barrel is full. Damp beds grow faster, but so do everyone else’s.'},
 {title:'The ridge runs dry',weather:'Dry breeze',sky:.16,growth:1.19,sale:1.24,tilt:[.002,.005,-.005,-.006],wire:'Dry acreage has Greenline trimming guidance. Spot buyers are paying extra for anything harvested today.',farm:'Dry wind caught the sheets on the line. June took them down and left the clothespins.'},
 {title:'Clinic signs a new supplier',weather:'High cloud',sky:.37,growth:.98,sale:1.02,tilt:[-.001,-.002,.009,.001],wire:'Nova won a clinic supply contract. Traders are weighing the order against the cost of adding a night shift.',farm:'There’s a damp circle on the potting bench where June set down her coffee.'},
 {title:'A longer shift at the exchange',weather:'Clear',sky:.12,growth:1.02,sale:1.10,tilt:[.008,-.002,.003,.002],wire:'Eastbank Exchange ordered an Axiom server upgrade. The farm stand wants fresh crates for the late shift.',farm:'The berry pickers came by early. Somebody put a wildflower in the gate latch.'},
 {title:'Cold front at the reservoir',weather:'Cool mist',sky:.56,growth:1.10,sale:1.14,tilt:[-.004,.007,.001,-.002],wire:'The reservoir is running low. Energy bids climbed before the open, and the co-op raised today’s farm-gate offer.',farm:'A cold line of mist hangs over the orchard. The old barn smells like cedar again.'}
];
const REPAIRS=[
 {name:'Reset the frame and glaze the roof',cost:1850,need:'Harvest two crates',line:'The west roof is open to the weather. There are sound panes in the rack under the bench.'},
 {name:'Reconnect the irrigation line',cost:2650,need:'Water four beds in total',line:'There’s a pencil mark on the barrel for the old waterline. A gravity feed can reach every bench.'},
 {name:'Plant the first heirloom row',cost:3750,need:'Harvest carrots, tomatoes and corn',line:'The last envelope holds her seed list. The plants will need the glass, the water, and hands that know all three field crops.'}
];
const LETTERS=[
 {title:'The spare key',body:'I found your spare key in the blue sugar tin. Still had that green string tied through it. I set your place at the potting bench. The west roof went in the last storm. Don’t climb up there on your own. Pull a carrot first. They’ve been waiting.'},
 {title:'The pencil line',body:'I walked over at dusk. Saw the sky sitting in the new panes and thought for a second your grandfather had left the lights on. The little mark on the barrel is his. He never owned a level he trusted.'},
 {title:'Saved in a coffee tin',body:'Listen to that pipe after you shut the tap. Three little knocks, same as always. I’ve left the last packet of heirlooms under the saucer. Write down what you grow this week. The old labels all faded to the same shade of brown.'},
 {title:'Leave the gate open',body:'A kid from the next road stopped at the glass this morning. Asked if he could grow something he could eat. I gave him the end of the bench. Thought you’d like that. Leave the gate open on your way out.'}
];
function storyState(){
 const st=state.story&&typeof state.story==='object'?state.story:{};state.story={repairStage:bound(Number(st.repairStage)||0,0,3),harvests:Number(st.harvests)||0,waters:Number(st.waters)||0,varieties:Array.isArray(st.varieties)?[...new Set(st.varieties.filter(k=>k in CROPS))]:[],notes:Array.isArray(st.notes)?st.notes.filter(n=>Number.isInteger(n)&&n>=0&&n<4):[],morning:Number(st.morning)||0};
 if(!state.seed||!(state.seed in CROPS))state.seed='carrot';
}
function dispatch(){return DISPATCHES[(state.day-1)%DISPATCHES.length]}
function farmPrice(crop){return roundCash(CROPS[crop].sale*dispatch().sale)}
function growTime(crop){return Math.round(CROPS[crop].seconds*dispatch().growth*(state.story.repairStage>=2?.72:1))}
function recordTending(stage,crop){
 if(stage==='ready'){state.story.harvests++;if(!state.story.varieties.includes(crop))state.story.varieties.push(crop)}
 if(stage==='planted')state.story.waters++
}
function repairQualified(stage){
 if(stage===0)return state.story.harvests>=2;
 if(stage===1)return state.story.waters>=4;
 return state.story.varieties.length>=3
}
function repairProgress(stage){return stage===0?Math.min(2,state.story.harvests)+' / 2 crates':stage===1?Math.min(4,state.story.waters)+' / 4 waterings':state.story.varieties.length+' / 3 crops'}
function readLetter(){const stage=state.story.repairStage;if(!state.story.notes.includes(stage)){state.story.notes.push(stage);logEvent('Read June’s letter, “'+LETTERS[stage].title+'.”','book');persist()}}
function restoreGreenhouse(){
 const stage=state.story.repairStage,r=REPAIRS[stage];if(!r||state.world!=='farm'||!repairQualified(stage)||state.cash<r.cost)return false;
 state.cash=roundCash(state.cash-r.cost);state.story.repairStage++;logEvent(r.name+'. Paid '+dollars(r.cost)+' from the shared account.','sprout');
 if(state.story.repairStage===3)logEvent('Opened the greenhouse to the neighbors. Heirloom sales now pay '+dollars(85)+' per new day.','sun');persist();return true
}
function greenhouseIncome(){if(state.story.repairStage===3){state.cash=roundCash(state.cash+85);logEvent('The greenhouse stand left '+dollars(85)+' in the blue tin.','basket')}}
function letterHTML(){const l=LETTERS[state.story.repairStage];return '<article class="letter-paper"><small>WILLOW FARM · PERSONAL CORRESPONDENCE</small><h3>'+l.title+'</h3><p>'+l.body+'</p><span>June</span></article>'}
function greenhouseHTML(){
 const s=state.story.repairStage,r=REPAIRS[s];return '<div class="project-heading"><span class="eyebrow">THE WEST GREENHOUSE</span><strong>'+s+' / 3 repairs</strong></div><div class="project-steps">'+['Glazing','Irrigation','Heirlooms'].map((x,i)=>'<span class="'+(i<s?'finished':'')+'">'+icon(i<s?'check':'sprout')+x+'</span>').join('')+'</div>'+(r?'<h3>'+r.name+'</h3><p>'+r.line+'</p><div class="pair"><span>'+r.need+'</span><b>'+repairProgress(s)+'</b></div><div class="pair"><span>Materials and labor</span><b>'+dollars(r.cost)+'</b></div><button class="solid repair-btn" data-story="repair" '+(!repairQualified(s)||state.cash<r.cost?'disabled':'')+'>Complete repair · '+dollars(r.cost)+'</button>':'<h3>The greenhouse is open</h3><p>Heirlooms grow along the west bench. The co-op credits your account $85 each new day.</p>')+'<button class="subtle letter-button" data-story="letter">'+icon('book')+' Read June’s note</button>'
}
function dailyBulletin(){const d=dispatch();return '<div class="bulletin"><small>EASTBANK WIRE · DAY '+String(state.day).padStart(2,'0')+'</small><b>'+d.title+'</b><p>'+d.wire+'</p></div>'}
storyState();
