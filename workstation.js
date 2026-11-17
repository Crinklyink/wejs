// Instrument panels use curved surfaces. Their type, charts and key legends
// are vector meshes in the world, so their edges stay sharp at close range.
const DRAW_GLYPHS={
 A:'6128 35',B:'602543 3586',C:'2068',D:'601586',E:'2068 34',F:'602 34',
 G:'20685 54',H:'06 28 35',I:'02 17 68',J:'2856',K:'06 32 38',L:'068',
 M:'60128',N:'6082',O:'02680',P:'60253',Q:'02680 48',R:'60253 48',S:'203586',
 T:'02 17',U:'0682',V:'072',W:'06482',X:'08 26',Y:'042 47',Z:'0268',
 '0':'02680','1':'147 68','2':'025368','3':'02586 35','4':'035 28','5':'203586',
 '6':'036853','7':'027','8':'02680 35','9':'53028','/':'26','.':'77','-':'35','+':'35 17',':':'11 77',' ':''
};
function vectorLabel(g,project,txt,x,y,h,color,finish={}){
 const width=h*.61,weight=h*.070;
 for(const ch of String(txt).toUpperCase()){
   for(const path of (DRAW_GLYPHS[ch]||'').split(' '))for(let j=1;j<path.length;j++){
     const a=Number(path[j-1]),b=Number(path[j]),ax=x+a%3*width*.5,ay=y-Math.floor(a/3)*h*.5,
       bx=x+b%3*width*.5,by=y-Math.floor(b/3)*h*.5,dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);
     const u=len?-dy/len*weight:weight,v=len?dx/len*weight:0;
     if(len)g.quad(project(ax-u,ay-v),project(bx-u,by-v),project(bx+u,by+v),project(ax+u,ay+v),color,finish);
     else g.quad(project(ax-weight,ay-weight),project(ax+weight,ay-weight),project(ax+weight,ay+weight),project(ax-weight,ay+weight),color,finish);
   }
   x+=width+h*.22
 }
}
const terminalPanels=[
 {x:3.18,y:1.38,z:-3.60,angle:.113,stock:0},
 {x:4.30,y:1.38,z:-3.61,angle:-.155,stock:2}
];
function panelPoint(panel,x,y,depth){
 const a=panel.angle+x/1.8,base=panel.angle,dx=1.8*(Math.sin(a)-Math.sin(base)),dz=1.8*(Math.cos(base)-Math.cos(a));
 return [panel.x+dx-Math.sin(a)*depth,panel.y+y,panel.z+dz+Math.cos(a)*depth]
}
function buildPanelContent(g,stocks){
 const bg={mat:'screen',glow:.34},ink={glow:.77},light='#c4d0c7',teal='#72cbb3',rust='#e19b86';
 for(const panel of terminalPanels){
   const q=stocks[panel.stock],history=q.history,main=Number(panel.stock===0);
   const P=(x,y)=>panelPoint(panel,x,y,.004);
   const face=(x,y,w,h,color,d=.005)=>{const spans=Math.max(1,Math.ceil(w/.035)),f=(u,v)=>panelPoint(panel,u,v,d);for(let j=0;j<spans;j++){const a=x+w*j/spans,b=x+w*(j+1)/spans;g.quad(f(a,y),f(b,y),f(b,y+h),f(a,y+h),color,ink)}};
   const txt=(t,x,y,h,color=light)=>vectorLabel(g,(a,b)=>panelPoint(panel,a,b,.007),t,x,y,h,color,ink);
   for(let j=0;j<38;j++){const x=-.526+j*1.052/38,k=x+1.052/38;g.quad(P(x,-.231),P(k,-.231),P(k,.231),P(x,.231),'#09141c',bg)}
   txt(main?'AXM / AXIOM SYSTEMS':'NVA / NOVA LABS',-.496,.204,.018);
   txt(q.price.toFixed(2),-.490,.159,.030,teal);
   txt('EASTBANK   EXCHANGE',.157,.204,.0103);
   txt('SESSION',-.295,.145,.010);txt('VOLUME',-.496,-.150,.0078);
   const x0=-.486,x1=.141,y0=-.117,y1=.094,w=x1-x0,h=y1-y0;
   // Map adjacent quotes to a candle body and show the running mean underneath.
   for(let k=0;k<=4;k++)face(x0,y0+k*h/4,w,.00085,'#293d45',.0048);
   for(let k=0;k<8;k++)face(x0+w*k/8,y0,.0007,h,'#24353e',.0048);
   const lo=Math.min(...history),hi=Math.max(...history),norm=v=>y0+.012+(v-lo)/Math.max(.04,hi-lo)*(h-.024);
   let lastMean=null;
   for(let j=1;j<history.length;j++){
     const x=x0+(j-.50)*w/(history.length-1),prev=history[j-1],cur=history[j],v0=norm(prev),v1=norm(cur),color=cur>=prev?teal:rust,unit=w/(history.length-1);
     face(x-.0008,Math.min(v0,v1)-.006,.0016,Math.abs(v1-v0)+.012,color,.0054);
     face(x-unit*.28,Math.min(v0,v1),unit*.56,Math.max(.003,Math.abs(v1-v0)),color,.0061);
     face(x-unit*.30,-.208,unit*.6,.004+.03*Math.min(1,Math.abs(cur-prev)/Math.max(.1,(hi-lo)/7)),color,.006);
     const line=[x,norm(history.slice(Math.max(0,j-5),j+1).reduce((a,b)=>a+b,0)/Math.min(6,j+1))];
     if(lastMean){const [x0,y0]=lastMean;g.quad(panelPoint(panel,x0,y0-.0007,.0071),panelPoint(panel,line[0],line[1]-.0007,.0071),panelPoint(panel,line[0],line[1]+.0007,.0071),panelPoint(panel,x0,y0+.0007,.0071),'#cda66b',ink)}lastMean=line;
   }
   face(.158,-.206,.001,.366,'#45515a',.005);
   txt('ORDER BOOK',.181,.147,.013);txt('BID',.185,.113,.010,teal);txt('ASK',.357,.113,.010,rust);
   for(let j=0;j<10;j++){const py=.083-j*.027;
     face(.18,py-.011,.046+.055*(.5+.5*Math.sin(1+j*3.73)),.014,'#18322f',.005);
     face(.347,py-.011,.055+.052*(.5+.5*Math.sin(2+j*2.18)),.014,'#382a2c',.005);
     txt((q.price-.02*j-.01).toFixed(2),.184,py,.011,teal);txt((q.price+.02*j+.01).toFixed(2),.356,py,.011,rust)
   }
 }
}
function buildWorkstation(g,deskTop){
 const metal={mat:'metal'},poly={mat:'plain'},rubber='#28292a',alloy='#555e62';
 const wire=(points,r,col)=>{for(let i=1;i<points.length;i++)g.beam(points[i-1],points[i],r,col,poly)};
 const curve=(a,b,c,d)=>Array.from({length:21},(_,k)=>{const t=k/20,s=1-t;return a.map((x,i)=>s*s*s*x+3*s*s*t*b[i]+3*s*t*t*c[i]+t*t*t*d[i])});
 for(const [i,p] of terminalPanels.entries()){
   const xy=(x,y,z)=>panelPoint(p,x,y,z);
   const width=1.075,height=.484;
   for(let j=0;j<40;j++){
     const x=(j/40-.5)*width,k=x+width/40;
     for(const [y,t] of [[-height/2,-.231],[.231,height/2]])g.quad(xy(x,y,0),xy(k,y,0),xy(k,t,0),xy(x,t,0),'#252729',metal);
     g.quad(xy(x,-height/2,-.034),xy(x,height/2,-.034),xy(k,height/2,-.034),xy(k,-height/2,-.034),'#383c3d',metal);
     for(const y of [-height/2,height/2])g.quad(xy(x,y,0),xy(x,y,-.034),xy(k,y,-.034),xy(k,y,0),alloy,metal)
   }
   for(const [x,k] of [[-.5375,-.525],[.525,.5375]]){
     g.quad(xy(x,-height/2,0),xy(k,-height/2,0),xy(k,height/2,0),xy(x,height/2,0),rubber,metal);
     const e=x<0?x:k;g.quad(xy(e,-height/2,0),xy(e,height/2,0),xy(e,height/2,-.034),xy(e,-height/2,-.034),alloy,metal)
   }
   let px=p.x+(i?-.28:.28),pivot=[px,1.025,-3.82],elbow=[p.x+.12,1.16,-3.91],end=[p.x,1.38,-3.67];
   g.roundBox(px,deskTop+.024,-3.83,.15,.048,.16,.012,alloy,metal);
   g.cyl(px,.932,-3.82,.025,.031,.223,20,alloy,metal);
   for(const delta of [-.027,.027]){g.beam([pivot[0]+delta,pivot[1],pivot[2]],[elbow[0]+delta,elbow[1],elbow[2]],.019,alloy,metal);g.beam([elbow[0]+delta,elbow[1],elbow[2]],[end[0]+delta,end[1],end[2]],.020,'#42494d',metal)}
   for(const joint of [pivot,elbow,end])g.cyl(...joint,.039,.039,.085,18,'#63686b',{mat:'metal',rz:Math.PI/2});
   g.roundBox(p.x,p.y,-3.663,.166,.144,.037,.012,rubber,metal);
   wire(curve([p.x-.08,1.30,-3.665],[p.x-.12,1.06,-3.77],[px,.98,-3.80],[px,deskTop+.01,-3.93]),.0042,'#202225');
   for(let j=0;j<31;j++){const x=(j-15)*.017;g.quad(xy(x,.157,-.0355),xy(x+.007,.157,-.0355),xy(x+.007,.180,-.0355),xy(x,.180,-.0355),'#1e2325',poly)}
   const led=xy(.477,-.237,.001);g.ball(...led,.005,.002,.002,'#89d2b8',{glow:.84});
 }
 g.roundBox(3.72,deskTop+.006,-3.015,1.27,.012,.47,.005,'#404640',{mat:'leather'});
 // Model a compact keyboard with staggered rows and dished double-shot keycaps.
 const kx=3.51,kz=-2.995,pitch=.0218;
 g.roundBox(kx,.826,kz,.412,.029,.141,.010,'#5e6263',metal);
 g.roundBox(kx,.843,kz,.397,.011,.131,.004,'#252727',poly);
 function key(x,z,w,row,label,accent=false){
   const low=.846,high=.857+(4-row)*.001;
   const b=[[-w/2,-.010],[w/2,-.010],[w/2,.010],[-w/2,.010]],t=b.map(([a,c])=>[a*(1-.0036/w),c*.78]);
   for(let i=0;i<4;i++){const k=(i+1)%4;g.quad([x+b[i][0],low,z+b[i][1]],[x+t[i][0],high,z+t[i][1]],[x+t[k][0],high,z+t[k][1]],[x+b[k][0],low,z+b[k][1]],accent?'#806b53':'#454a4b',poly)}
   const topColor=accent?'#a38c69':'#777b77';
   // A shallow cylindrical dish catches the light along the two outer rims.
   for(let j=0;j<4;j++){const u0=j/4,u1=(j+1)/4,cap=(u,v)=>{const dx=t[0][0]+(t[1][0]-t[0][0])*u;return [x+dx,high-.0007*Math.sin(Math.PI*u),z+(v?t[3][1]:t[0][1])]};g.quad(cap(u0,0),cap(u0,1),cap(u1,1),cap(u1,0),topColor,poly)}
   if(label)vectorLabel(g,(a,c)=>[x+a,high+.00012,z-c],label,-w*.31,.0048,.0054,'#e5e1cc',poly);
 }
 const rows=['1234567890-+','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
 rows.forEach((labels,r)=>{const z=kz-.048+r*pitch;let x=kx-.171+(r===1?.012:r===2?.019:r===3?.030:0);
   for(const ch of labels){key(x,z,.0195,r,ch,r===0&&ch==='1');x+=pitch}key(x+.012,z,.044,r,'')});
 for(const [dx,w] of [[-.166,.026],[-.135,.024],[-.105,.026],[-.020,.133],[.068,.028],[.101,.027]])key(kx+dx,kz+.040,w,4,'');
 for(const [u,v] of [[0,0],[1,0],[2,0],[1,-1]])key(kx+.131+u*.022,kz+.040+v*.022,.019,4,'');
 wire(curve([kx+.128,.831,kz-.069],[3.73,.809,-3.25],[3.94,.806,-3.09],[4.04,.805,-3.76]),.0022,'#292928');
 // Two separate click shells have a center slot for the rubber scroll wheel.
 const mx=4.05,mz=-2.975;
 g.roundBox(mx,.822,mz,.078,.021,.126,.009,'#303233',poly);
 for(const s of [-1,1])g.surface(12,13,(u,v)=>{const a=(u*.5+.001)*Math.PI,side=Math.sin(a)*s,
   along=2*v-1,shape=Math.sqrt(Math.max(.0003,1-along*along)),w=.040*shape*(1-.12*along);
   return [mx+side*w+s*.00085,.828+.031*Math.cos(a)*shape*(1-.30*along),mz+along*.064]},'#747976',poly);
 g.cyl(mx,.851,mz-.026,.010,.010,.008,18,'#343332',{rz:Math.PI/2});
 // The open-frame workstation exposes the actual cooling path and card stack.
 const cx=5.01,cz=-3.62,base=deskTop+.018,wide=.391,deep=.205,tall=.445,front=cz+deep*.5;
 g.roundBox(cx,base+.011,cz,wide,.022,deep,.005,'#303436',metal);
 g.roundBox(cx,base+tall,cz,wide,.022,deep,.005,'#434949',metal);
 for(const sign of [-1,1])for(const dz of [-1,1])g.box(cx+sign*(wide*.5-.008),base+tall*.5,cz+dz*(deep*.5-.008),.016,tall,.016,alloy,metal);
 g.roundBox(cx,base+.22,cz-deep*.43,.363,.396,.014,.004,'#263733',poly);
 g.roundBox(cx-.04,base+.264,cz-.055,.091,.081,.052,.012,'#636965',metal);
 for(const x of [-.11,-.095,.021,.037])g.box(cx+x,base+.28,cz-.046,.008,.111,.022,'#777872',metal);
 for(let i=0;i<23;i++)g.box(cx-.045+(i%5)*.014,base+.16+Math.floor(i/5)*.017,cz-.067,.008,.006,.008,i%3?'#666963':'#b5a58b',metal);
 g.box(cx-.01,base+.13,cz,.317,.050,.091,'#32383c',metal);
 for(let k=0;k<39;k++)g.box(cx-.15+k*.0075,base+.129,cz+.052,.002,.035,.023,'#8a918e',metal);
 function fan(x,y,z,r){
   for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const P=(t,rad,dz)=>[x+rad*Math.cos(a+t),y+rad*Math.sin(a+t),z+dz];
     g.quad(P(0,r*.26,0),P(.13,r*.90,-.005),P(.56,r*.96,-.002),P(.52,r*.40,.004),'#535d5d',metal)}
   g.cyl(x,y,z+.003,r*.235,r*.235,.009,18,'#687374',{mat:'metal',rx:Math.PI/2});
   for(let i=0;i<36;i++){const a=i*Math.PI/18,b=(i+1)*Math.PI/18;g.beam([x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z],.0016,'#98b8a5',{glow:.36})}
 }
 fan(cx+.089,base+.318,front-.028,.058);fan(cx+.089,base+.195,front-.028,.058);
 for(const x of [-.029,-.048])wire(curve([cx+x,base+.30,cz-.03],[cx-.16,base+.45,front],[cx+.01,base+.427,front],[cx+.055,base+.39,front-.028]),.0052,'#303335');
 g.quad([cx-wide/2+.013,base+.018,front],[cx+wide/2-.013,base+.018,front],[cx+wide/2-.013,base+tall-.015,front],[cx-wide/2+.013,base+tall-.015,front],'#a8b4bc',{mat:'glass'});
 for(const sx of [-1,1])for(const sy of [.029,tall-.03])g.cyl(cx+sx*.173,base+sy,front+.001,.004,.004,.004,12,'#9b9c96',{mat:'metal',rx:Math.PI/2});
}
