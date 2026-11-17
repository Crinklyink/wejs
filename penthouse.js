/* Floor 48. All furnishings are built at room scale, with the street below y=0. */
function buildPenthouse(g) {
  const wood = {mat:"wood"}, fabric = {mat:"fabric"}, metal = {mat:"metal"}, stone = {mat:"stone"};
  const iron = "#323b45", graphite = "#23303a", brass = "#b88654", walnut = "#754833";
  const linen = "#e0d8c7", porcelain = "#e8e3d8";
  const plaster = {mat:"plaster"}, oak = {mat:"oak"}, creamLinen = {mat:"linen"};
  const brassMetal={mat:"brass"}, marble={mat:"marble"}, leather={mat:"leather"};
  const round=(x,y,z,w,h,d,r,c,o)=>g.roundBox(x,y,z,w,h,d,r,c,o);
  const sheet=(rows,cols,f,c,o)=>g.surface(rows,cols,f,c,o);
  const box = (x,y,z,w,h,d,c,o) => g.box(x,y,z,w,h,d,c,o);
  const cyl = (x,y,z,rt,rb,h,n,c,o) => g.cyl(x,y,z,rt,rb,h,n,c,o);
  const orb = (x,y,z,w,h,d,c,o) => g.ball(x,y,z,w,h,d,c,o);
  const rod = (a,b,r,c,o) => g.beam(a,b,r,c,o);
  const amber = {glow:0.75}, blueLight = {glow:0.84};
  const pick = a => a[Math.floor(g.rand()*a.length)];
  const coverColors = ["#2c5659","#ce7b4d","#b09a74","#323e49","#d1c9a9","#935742"];

  function book(x,y,z,w,h,d,c,angle=0) {
    const rotate = {ry:angle};
    box(x,y+h*.5,z,w,h*.80,d,"#dfcfab",rotate);
    box(x,y+h*.05,z,w+.014,h*.1,d+.018,c,rotate);
    box(x,y+h*.95,z,w+.014,h*.1,d+.018,c,rotate);
  }
  function legs(x,z,width,depth,bottom,top,thickness,color) {
    for (const s of [-1,1]) for (const t of [-1,1])
      box(x+s*width/2,(top+bottom)/2,z+t*depth/2,thickness,top-bottom,thickness,color,metal);
  }
  // Sweep a small circular section along a sewn seam, branch or furniture rail.
  function sweep(path,radius,color,material,segments=24,sides=6) {
    const points=Array.from({length:segments+1},(_,i)=>path(i/segments));
    const frames=points.map((p,i)=>{
      const tangent=V3.unit(V3.sub(points[Math.min(segments,i+1)],points[Math.max(0,i-1)]));
      const side=V3.unit(V3.cross(tangent,Math.abs(tangent[1])>.94?[0,0,1]:[0,1,0]));
      return [side,V3.cross(side,tangent)];
    });
    sheet(segments,sides,(u,v)=>{
      const i=Math.round(v*segments),r=typeof radius==="function"?radius(v):radius;
      const a=u*Math.PI*2;return points[i].map((q,k)=>q+r*(frames[i][0][k]*Math.cos(a)+frames[i][1][k]*Math.sin(a)));
    },color,material);
  }
  const power=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
  const clamp01=v=>Math.max(0,Math.min(1,v));
  const ease=v=>{v=clamp01(v);return v*v*(3-2*v)};
  function paddedForm(cfg) {
    const {x,y,z,w,d,h,color,material=creamLinen,rx=0,ry=0,rz=0,
      seamColor=color,padding=.40,compression=.025,seed=0,thickness=.005}=cfg;
    const roll=rotator({rx,ry,rz});
    // Equal-distance sampling avoids wide triangular fans down the broad sides of a pillow.
    const outline=Array.from({length:321},(_,k)=>{
      const a=k*Math.PI/160;return [w*.5*power(Math.cos(a),padding),d*.5*power(Math.sin(a),padding),a];
    });
    const lengths=[0];for(let k=1;k<outline.length;k++)lengths.push(lengths[k-1]+Math.hypot(outline[k][0]-outline[k-1][0],outline[k][1]-outline[k-1][1]));
    function at(az){
      const distance=az*lengths[320];let low=0,high=320;
      while(high-low>1){const mid=(low+high)>>1;if(lengths[mid]>distance)high=mid;else low=mid;}
      const f=(distance-lengths[low])/(lengths[high]-lengths[low]||1);
      return outline[low].map((q,i)=>q+(outline[high][i]-q)*f);
    }
    const point=(az,rad,side)=>{
      const [px,pz,a]=at(az);
      const xx=px*rad,zz=pz*rad,corner=Math.pow(Math.abs(Math.sin(2*a)),3);
      const crown=Math.sqrt(Math.max(0,1-rad**4))*(.99-.19*rad**4*corner);
      const cradle=side>0?compression*Math.exp(-((xx/w+.10)**2/.09+(zz/d-.12)**2/.15)):0;
      const pucker=.12*h*Math.sin(15*a+seed+rad*4.1)*Math.pow(rad,6)*(1-rad)*2.7*corner;
      const yy=side*(.5*h*crown+pucker)-cradle*(1-rad*rad);
      const local=roll([xx,yy,zz]);
      return [x+local[0],y+local[1],z+local[2]];
    };
    const rings=w<.15?24:44;
    for(const side of [-1,1]){
      const core=.052,divs=side>0?rings:Math.round(rings*.72);
      const layers=w<.15?6:side>0?11:6;
      sheet(layers,divs,(u,v)=>point(side>0?1-u:u,core+(1-core)*Math.sin(v*Math.PI/2),side),color,material);
      const ring=Array.from({length:divs},(_,k)=>point(side>0?1-k/divs:k/divs,core,side));
      g.polygon(ring,color,material,roll([0,side,0]));
    }
    sweep(t=>point(t,1,1),thickness,seamColor,material,rings,5);
  }
  function pot(x,y,z,r,h,color) {
    const sections=[[.65,0],[.78,.025],[.80,.065],[.85,.16],[.93,.58],[1,.90],[1.01,.955],
      [.995,.981],[.96,1],[.90,.995],[.889,.966],[.872,.92]];
    sheet(sections.length-1,36,(u,v)=>{
      const [rad,ht]=sections[Math.round(v*(sections.length-1))],a=2*Math.PI*u;
      return [x+r*rad*Math.cos(a),y+h*ht,z+r*rad*Math.sin(a)];
    },color,{mat:"ceramic"});
    cyl(x,y+h*.925,z,r*.873,r*.872,.006,28,"#51483a",{mat:"soil"});
    return y+h*.926;
  }
  function plant(x,y,z,size,potColor,compact=false) {
    const height=pot(x,y,z,(compact?.164:.215)*size,(compact?.305:.409)*size,potColor);
    const greens=["#435f4b","#56714f","#627b54","#47684e","#637e57"];
    const trunks=compact?2:3;
    for(let branch=0;branch<trunks;branch++){
      const theta=branch*2.40+.35,dx=Math.cos(theta),dz=Math.sin(theta);
      const stemHeight=size*(compact?.37:.93)*(1-.16*branch),lean=size*(compact?.070:.115)*(branch+.40);
      const trunk=t=>[x+dx*(lean*t*t+.013*size*Math.sin(3*t+theta)),
        height+stemHeight*t,z+dz*lean*t+.018*size*Math.sin(2.4*t+branch)];
      sweep(trunk,t=>size*(compact?.009:.017)*(1-.82*t),"#796d52",{mat:"bark"},14,7);
      const leaves=compact?5:8;
      for(let k=0;k<leaves;k++){
        const fraction=.22+.74*k/(leaves-1),at=trunk(fraction);
        const a=k*2.32+theta+.27*g.rand(),ax=Math.cos(a),az=Math.sin(a);
        const length=size*(compact?.138:.249)*(.8+.34*g.rand()),width=length*(.208+.045*g.rand());
        const petiole=size*(compact?.044:.085)*(.85+.34*g.rand()),roll=.22*(g.rand()-.45);
        const q=[at[0]+petiole*ax,at[1]+.59*petiole,at[2]+petiole*az];
        sweep(t=>[at[0]+ax*petiole*t,at[1]+petiole*(.88*t-.29*t*t),at[2]+az*petiole*t],
          t=>size*.0048*(1-.43*t),"#667656",{},4,5);
        const shape=(u,t)=>{
          const r=u*2-1,spine=length*t,blade=width*Math.sin(Math.PI*t)**.83*(1.16-.34*t);
          const lateral=r*blade,curve=length*(.34*Math.sin(t*2.74)-.19*t*t);
          const fold=Math.abs(r)**.68*blade*.26+r*blade*roll+.011*size*r*r*Math.sin(t*8.2+k);
          return [q[0]+ax*spine-az*lateral,q[1]+curve-fold,q[2]+az*spine+ax*lateral];
        };
        sheet(10,6,(u,t)=>shape(1-u,t),pick(greens),{mat:"leaf"});
        sweep(t=>{const p=shape(.5,t);p[1]+=.001*size;return p;},t=>.0016*size*(1-.82*t),"#87946b",{},7,4);
        for(const sign of [-1,1]) for(const split of [.32,.63]){
          sheet(1,3,(u,v)=>{
            const p=shape(.5+sign*(.003+.36*u+.006*v),split+.11*u);
            p[1]+=.00085*size;return p;
          },"#788966",{mat:"leaf"});
        }
      }
    }
  }
  function ceramic(x,y,z,s,c) {
    cyl(x,y+s*.21,z,s*.22,s*.20,s*.42,14,c);
    cyl(x,y+s*.48,z,s*.12,s*.22,s*.13,14,c);
    cyl(x,y+s*.56,z,s*.115,s*.12,s*.06,14,c);
    cyl(x,y+s*.594,z,s*.082,s*.082,.009,14,"#514542");
  }
  function cup(x,y,z,s) {
    const c={mat:"ceramic"};
    cyl(x,y+.057*s,z,.052*s,.043*s,.111*s,24,porcelain,c);
    cyl(x,y+.111*s,z,.046*s,.046*s,.006*s,24,"#38271e");
    const handle=t=>[x+s*(.045+.028*Math.sin(t*Math.PI)),y+s*(.08-.052*t),z];
    for(let k=0;k<6;k++)rod(handle(k/6),handle((k+1)/6),.006*s,porcelain,c);
  }

  // The occupied penthouse sits on the stepped crown of a masonry tower.
  box(0,-4.79,0,12.49,9.07,8.96,"#414651",stone);
  for (let level=0;level<3;level++) {
    const y=-1.79-level*3.04;
    for (let j=0;j<9;j++) {
      const x=-5.68+j*1.42;
      box(x,y,4.493,1.19,1.66,.04,"#253441",metal);
      const tone = pick(["#465269","#3f5367","#8b7967","#536078","#b09672"]);
      box(x,y,4.52,1.05,1.51,.025,tone,{glow:j%3===1?.28:.08});
      box(x,y,4.548,.045,1.54,.04,graphite,metal);
      box(x,y+.42,4.552,1.07,.045,.04,graphite,metal);
      box(x,y-.84,4.55,1.29,.11,.14,"#657078",stone);
      box(x-.67,y,4.52,.12,2.93,.13,"#55565d",stone);
    }
    for (let j=0;j<6;j++) {
      const z=-3.80+j*1.48;
      box(6.254,y,z,.04,1.68,1.20,"#202f3a",metal);
      box(6.281,y,z,.027,1.5,1.07,pick(["#546477","#695e5a","#859195","#a79777"]),{glow:.16});
      box(6.303,y,z,.044,1.53,.046,graphite,metal);
      box(6.31,y+.42,z,.04,.045,1.07,graphite,metal);
      box(6.305,y-.84,z,.13,.11,1.28,"#696d72",stone);
      box(6.29,y,z-.67,.12,2.93,.12,"#51565b",stone);
    }
    box(0,y-1.34,0,12.65,.22,9.12,"#525860",stone);
    box(0,y-1.18,0,12.64,.068,9.10,"#79716b",metal);
  }
  box(0,-.32,0,12.91,.54,9.31,"#444853",stone);
  box(0,-.135,0,12.94,.095,9.34,"#a8744f",metal);
  box(0,-.062,0,12.82,.104,9.24,"#523b31",wood);
  // Wide oak boards; random offsets keep the end joints staggered.
  const plankTones=["#9b8064","#a28669","#a1876c","#90775e","#a78d71","#998167","#9f856b"];
  const rows=45, pitch=9.18/rows;
  for (let j=0;j<rows;j++) {
    const z=-4.59+(j+.5)*pitch;
    let x=-6.38, len=.45+g.rand()*2.0;
    while(x<6.36) {
      const w=Math.min(6.38-x,len);
      if(w>.011) box(x+w/2,-.010,z,Math.max(.004,w-.003),.035,pitch-.003,pick(plankTones),oak);
      x+=w; len=2.02+g.rand()*1.17;
    }
  }
  // Floor-to-ceiling structural glazing. Deep aluminum extrusions meet flush sills.
  const aluminum="#383d3c";
  for(const axis of ["back","left"]) {
    const rear=axis==="back", length=rear?12.77:9.17, panes=rear?6:4;
    const segment=(t,y,w,h,depth,c,o=metal)=>{
      if(rear) box(t,y,-4.54,w,h,depth,c,o);
      else box(-6.34,y,t,depth,h,w,c,o);
    };
    segment(0,.062,length,.105,.152,aluminum);
    segment(0,3.595,length,.124,.172,aluminum);
    for(let i=0;i<=panes;i++) {
      const t=(i/panes-.5)*(length-.08), thick=i===0||i===panes?.079:.055;
      segment(t,1.825,thick,3.48,.148,aluminum);
      segment(t-.012,1.825,.009,3.48,.153,"#78807a");
    }
    // Transoms sit overhead, leaving the sightline unobstructed.
    segment(0,2.91,length,.035,.087,"#4c5050");
  }
  // Plaster ceiling with recessed light channels and stepped perimeter coves.
  box(0,3.78,0,12.98,.29,9.39,"#d1c9b8",plaster);
  for(const side of [-1,1]){
    box(0,3.54,side*4.38,12.70,.18,.42,"#bcb4a4",plaster);
    box(side*6.15,3.54,0,.45,.18,8.50,"#bcb4a4",plaster);
    box(0,3.615,side*4.15,12.29,.039,.028,"#ffdab0",{glow:.88});
    box(side*5.92,3.615,0,.032,.039,8.32,"#ffddb4",{glow:.88});
  }
  for(const x of [-4.35,-.72,2.1,4.8]) for(const z of [-2.51,2.28]){
    cyl(x,3.625,z,.105,.105,.018,28,"#a7a398",metal);
    cyl(x,3.609,z,.080,.081,.020,24,"#504d47",metal);
    cyl(x,3.592,z,.049,.059,.014,24,"#ffe3b8",{glow:.86});
  }
  // Plaster, walnut millwork, flush entry door and the shadow reveals at their edges.
  box(0,1.805,4.60,12.93,3.68,.18,"#c6beb0",plaster);
  box(6.40,1.805,0,.18,3.68,9.33,"#b5ad9e",plaster);
  box(0,.076,4.487,12.73,.14,.060,"#716558",{mat:"walnut"});
  box(6.292,.076,0,.060,.14,9.13,"#716558",{mat:"walnut"});
  for(let i=0;i<12;i++){
    const x=-4.33+i*.68;
    box(x,1.79,4.481,.672,3.49,.045,i%3===0?"#806c57":"#846e57",{mat:"walnut"});
  }
  const doorX=4.73;
  box(doorX,1.25,4.45,1.38,2.49,.12,"#594d40",{mat:"walnut"});
  box(doorX,1.216,4.378,1.22,2.389,.047,"#9b856d",{mat:"walnut"});
  box(doorX-.605,1.22,4.348,.013,2.368,.012,"#554a40");
  round(doorX-.43,1.041,4.332,.084,.21,.024,.018,"#948576",brassMetal);
  rod([doorX-.431,1.07,4.323],[doorX-.431,1.07,4.269],.018,"#aea292",brassMetal);
  rod([doorX-.431,1.07,4.269],[doorX-.273,1.07,4.269],.017,"#b2a695",brassMetal);
  cyl(doorX-.43,1.40,4.336,.039,.039,.038,20,"#a89a84",{rx:Math.PI/2,mat:"brass"});
  cyl(doorX,1.65,4.346,.016,.016,.020,16,"#675c49",{rx:Math.PI/2,mat:"brass"});
  box(5.54,1.12,4.461,.137,.151,.035,"#ddd6c9",plaster);
  box(5.54,1.123,4.436,.070,.085,.018,"#afa99a",metal);
  // Full-height bronze ventilation grilles near the window, discreet cover plates below.
  box(6.286,3.16,-1.68,.035,.20,3.24,"#655f56",metal);
  for(let k=0;k<7;k++)box(6.259,3.08+k*.025,-1.68,.026,.010,3.20,"#afa391",metal);
  for(const z of [-2.55,1.18]){
    box(6.28,.29,z,.022,.126,.145,"#cec6b7",plaster);
    for(const d of [-.032,.032])box(6.262,.30,z+d,.012,.040,.011,"#585954",metal);
  }
  // Lit open shelving, scaled for books and objects and shallow enough to keep the aisle free.
  const shelfX=.14;
  box(shelfX,1.56,4.448,2.75,2.56,.055,"#6d6050",{mat:"walnut"});
  for(const dx of [-1.37,1.37]) box(shelfX+dx,1.56,4.29,.062,2.59,.37,"#8e7961",{mat:"walnut"});
  for(const h of [.29,.90,1.53,2.16,2.79]){
    round(shelfX,h,4.29,2.78,.052,.39,.008,"#927b63",{mat:"walnut"});
    if(h>.3)box(shelfX,h-.028,4.171,2.59,.011,.015,"#f9d19b",{glow:.70});
  }
  const shelfBooks=["#555957","#927b62","#696b60","#d2c9b7","#807064","#737880"];
  for(const [shelfY,start,n] of [[.318,-1.08,10],[.927,.24,9],[1.556,-.96,7]]){
    let x=start;
    for(let k=0;k<n;k++){
      const width=.031+g.rand()*.061,height=.19+g.rand()*.18;
      box(x+width/2,shelfY+height/2,4.23,width,height,.225,pick(shelfBooks),{mat:"linen"});
      box(x+width/2,shelfY+height*.7,4.114,width*.6,.008,.006,"#b7aa94");
      x+=width+.008;
    }
  }
  ceramic(.89,.931,4.26,.62,"#b7aa96");ceramic(.67,1.559,4.24,.74,"#c7bead");
  ceramic(-.70,2.19,4.26,.48,"#8d806d");ceramic(-.47,2.19,4.27,.68,"#dfd4bf");
  book(.67,.318,4.23,.58,.060,.25,"#6a736c",.03);
  book(.67,.382,4.23,.47,.045,.23,"#b1a590",-.02);
  // Gallery prints use overlapping smooth ridgelines printed on warm rag paper.
  function art(x,y,z,w,h,angle,seed){
    const wall=(lx,ly,depth)=>[x+lx*Math.cos(angle)+depth*Math.sin(angle),y+ly,z-lx*Math.sin(angle)+depth*Math.cos(angle)];
    const layer=(depth,width,height,thick,color,material)=>{
      const q=wall(0,0,depth);box(...q,width,height,thick,color,{ry:angle,mat:material});
    };
    layer(0,w,h,.044,"#554c40","walnut");layer(.024,w-.039,h-.039,.013,"#dcd7c8","linen");
    const iw=w*.81,ih=h*.80;
    const q=wall(0,0,.033);box(...q,iw,ih,.01,"#d2c2a6",{ry:angle,mat:"linen"});
    const sun=wall(iw*.18,ih*.19,.04);
    orb(...sun,iw*.24,iw*.24,.012,"#ad8065",{ry:angle,mat:"linen"});
    for(let k=0;k<3;k++){
      sheet(3,54,(u,v)=>{
        const ridge=ih*(-.04-.115*k+.12*Math.sin(v*(4+k)+seed+k*.5)+.04*Math.sin(v*11+k));
        return wall((v-.5)*iw,-ih/2+u*(ridge+ih/2),.051+.007*k);
      },["#9c9c89","#7e8b81","#606d69"][k],{mat:"linen"});
    }
  }
  art(-2.28,1.91,4.421,1.22,1.60,Math.PI,.4);
  art(-3.69,1.91,4.421,1.22,1.60,Math.PI,2.4);
  art(6.283,1.76,.72,1.54,1.30,-Math.PI/2,1.2);
  function sconce(x,y,z,angle){
    const from=(lx,ly,depth)=>[x+lx*Math.cos(angle)+depth*Math.sin(angle),y+ly,z-lx*Math.sin(angle)+depth*Math.cos(angle)];
    const q=from(0,0,0);
    round(...q,.085,.37,.05,.015,"#877563",{ry:angle,mat:"brass"});
    rod(from(0,0,.018),from(0,0,.16),.016,"#9c886f",brassMetal);
    const globe=from(0,.028,.16);orb(...globe,.15,.30,.15,"#ffdfae",{glow:.77,mat:"ceramic"});
  }
  sconce(6.25,1.68,2.68,-Math.PI/2);sconce(-4.67,1.84,4.43,Math.PI);
  // Gathered linen at the ends of the glass: individual, softly tensioned folds.
  for(const side of [-1,1]){
    sheet(19,44,(u,v)=>{
      const wave=v*Math.PI*11;
      return [side*(5.64+.56*v)+.034*Math.sin(wave)*Math.sin(u*Math.PI),
        .095+u*3.40+.013*Math.cos(wave)*(1-u),
        -4.25+.073*Math.cos(wave)+.032*Math.sin(u*3.5+wave*.69)];
    },"#d7cbb8",creamLinen);
  }
  // Record cabinet: cane doors and a small turntable.
  legs(-5.72,2.25,.53,2.27,.01,.22,.078,walnut);
  box(-5.72,.51,2.24,.77,.62,2.58,"#7e5139",wood);
  box(-5.71,.85,2.24,.83,.09,2.63,"#a17a52",wood);
  for(const z of [1.61,2.87]) {
    box(-5.318,.51,z,.05,.48,1.12,"#b5976a",fabric);
    for(let j=0;j<17;j++) box(-5.288,.51,z-.515+j*.064,.018,.47,.015,"#967a54");
    box(-5.275,.54,z+.37,.035,.125,.032,brass,metal);
  }
  box(-5.7,.921,2.47,.54,.07,.71,"#3b4242",metal);
  cyl(-5.70,.973,2.42,.22,.22,.036,20,"#242c32",metal);
  cyl(-5.70,.998,2.42,.072,.072,.012,16,"#ca7851");
  rod([-5.89,1.015,2.76],[-5.75,1.019,2.52],.015,brass,metal);
  ceramic(-5.70,.90,1.31,.53,"#d1b69b");
  book(-5.7,.90,3.13,.46,.065,.43,coverColors[0]);

  // The mattress rests on a continuous recessed plinth; all bedding is supported by its crown.
  const bedX=-4.44,bedZ=-2.10;
  round(bedX,.022,bedZ,3.32,.022,3.61,.009,"#928f7e",fabric);
  round(bedX,.120,bedZ,2.21,.179,2.47,.058,"#645849",{mat:"walnut"});
  round(bedX,.237,bedZ,2.53,.235,2.77,.070,"#887c6b",fabric);
  round(bedX,.461,bedZ,2.41,.287,2.66,.091,"#d8d2c4",creamLinen);
  const mattressLoop=t=>{
    const a=t*2*Math.PI;return [bedX+1.205*power(Math.cos(a),.15),.544,bedZ+1.332*power(Math.sin(a),.15)];
  };
  sweep(mattressLoop,.0063,"#c2bbad",creamLinen,72,6);
  // A continuous winged headboard, tucked into shallow vertical channels.
  const panel=(s,t,back=false)=>{
    const x=(s-.5)*2.74,edge=Math.abs(x)/1.37,top=1.29+.10*(1-edge**5),y=.20+(top-.20)*t;
    const channel=.012*Math.exp(-((Math.sin((s*6+.23)*Math.PI))**2)/.017)*Math.sin(Math.PI*t)**.38;
    const z=-3.539-.073*t+.190*edge**5+.036*Math.sin(Math.PI*t)-channel;
    return [bedX+x,y,z-(back?.127:0)];
  };
  sheet(18,70,(u,v)=>panel(1-u,v),"#a79981",creamLinen);
  sheet(5,40,(u,v)=>panel(u,v,true),"#897d69",fabric);
  function join(a,b,n,m,c,mat) {
    sheet(n,m,(u,v)=>{const p=a(u),q=b(u);return p.map((x,i)=>x+(q[i]-x)*v);},c,mat);
  }
  for(const v of [0,1]){
    join(u=>panel(u,v),u=>panel(u,v,true),2,50,"#9c8e76",creamLinen);
    sweep(t=>panel(t,v),.006,"#c5b49a",creamLinen,48,5);
  }
  for(const u of [0,1])join(t=>panel(u,t),t=>panel(u,t,true),2,16,"#958771",creamLinen);
  // Rounded corner and resting side drop, measured along the cloth in metres.
  function foldOver(q,edge,r){
    const beyond=Math.max(0,q-edge),turn=Math.min(Math.PI/2,beyond/r);
    return [Math.min(q,edge)+r*Math.sin(turn),r*(1-Math.cos(turn))+Math.max(0,beyond-r*Math.PI/2)];
  }
  const batting=(s,t)=>{
    const q=(s-.5)*2.95+.022*t,rawZ=-2.79+t*2.416+.047*Math.cos(s*Math.PI*2+.54)*(1-.65*t);
    const xx=foldOver(Math.abs(q),1.145,.124),zz=foldOver(rawZ+2.79,1.987,.124);
    const side=ease(xx[1]/.32),end=ease(zz[1]/.28);
    const flankRipple=.021*Math.sin(rawZ*12.3+q*1.8)+.009*Math.sin(rawZ*24+q*1.7);
    const x=bedX+Math.sign(q)*(xx[0]+side*flankRipple+.018*end*side);
    const z=-2.79+zz[0]+end*(.019*Math.sin(q*8.7+.65)+.013*Math.sin(q*15.7));
    const near=(center,w)=>Math.exp(-(((rawZ-center)/w)**2));
    const edgePull=near(-2.49+.102*Math.cos(q*2.6),.095)*(.039+.018*Math.cos(q*3.7));
    const wrinkle=near(-1.97-.16*q,.095)*.031*Math.exp(-(((q-.46)/.84)**2))
      +near(-1.43+.087*q,.074)*.022*Math.exp(-(((q+.78)/.51)**2))
      -.014*near(-2.17+.104*Math.sin(q*3.2),.14);
    const loft=.023+.019*(1-Math.min(1,(q/1.25)**2))+.009*Math.sin(q*7+rawZ*1.9);
    const y=.603+loft+edgePull+wrinkle-Math.hypot(xx[1],zz[1])*.91;
    return [x,y,z];
  };
  // Batting thickness follows the local normal, so the quilting reads correctly from the foot.
  const inner=(s,t)=>{
    const q=batting(s,t),u=V3.sub(batting(Math.min(s+.0008,1),t),batting(Math.max(s-.0008,0),t));
    const v=V3.sub(batting(s,Math.min(t+.0008,1)),batting(s,Math.max(0,t-.0008)));
    const n=V3.unit(V3.cross(v,u)),th=.021+.014*Math.sin(Math.PI*s)*Math.sin(Math.PI*t);
    return q.map((val,i)=>val-th*n[i]);
  };
  sheet(45,60,batting,"#e3dcd0",creamLinen);
  sheet(12,24,(u,v)=>inner(1-u,v),"#d4cdbf",creamLinen);
  for(const side of [0,1]){
    join(t=>batting(side,t),t=>inner(side,t),2,45,"#d7cec0",creamLinen);
    join(t=>batting(t,side),t=>inner(t,side),2,55,"#d7cec0",creamLinen);
  }
  // The turned-back edge joins the quilt, rolling around its stuffing into a soft lip.
  const turn=(u,v)=>{
    const w=.097+.019*Math.sin(u*5.2),t=.030+w*v;
    const p=batting(u,t);p[1]+=.010+.038*Math.sin(v*Math.PI)**.85;
    p[2]+=.016*Math.sin(v*Math.PI);return p;
  };
  sheet(10,52,turn,"#ebe4d6",creamLinen);
  sweep(t=>turn(t,.98),.0038,"#d4c9b7",creamLinen,55,5);
  // A pair of full sleeping pillows with smaller off-centre accent pillows.
  paddedForm({x:-5.022,y:.719,z:-3.035,w:1.115,h:.275,d:.644,rx:-.14,ry:-.070,
    color:"#eae4d8",seamColor:"#cfc6b6",padding:.46,compression:.012,seed:1.3});
  paddedForm({x:-3.84,y:.714,z:-3.037,w:1.065,h:.27,d:.640,rx:-.16,ry:.082,
    color:"#e5ddcf",seamColor:"#d2c8b7",padding:.48,compression:.009,seed:3.4});
  paddedForm({x:-5.02,y:.716,z:-2.694,w:.71,h:.193,d:.44,rx:-.14,ry:.111,
    color:"#b2ad9c",seamColor:"#a69c86",padding:.52,compression:.009,thickness:.004});
  paddedForm({x:-3.91,y:.705,z:-2.69,w:.68,h:.198,d:.432,rx:-.18,ry:-.15,
    color:"#bab3a1",seamColor:"#a79e8a",padding:.50,compression:.008,thickness:.004});
  // Folded wool runner laid diagonally across the lower third. Its ends follow the side drape.
  const runner=(s,t)=>{
    const along=.58+.234*t+.032*Math.sin(s*4.2)-.032*s;
    const across=.025+s*.975,p=batting(across,along);
    const rump=.013+.017*Math.sin(s*20+t*.85)**2+.006*Math.sin(s*33+t*2.6);
    const edge=ease(Math.max(0,Math.abs(across-.5)-.36)/.14);
    p[0]+=Math.sign(across-.5)*edge*rump;p[1]+=rump*(1-.78*edge);p[2]+=.012*Math.sin(s*9);
    return p;
  };
  sheet(16,52,runner,"#687166",fabric);
  for(const along of [.048,.086,.892,.928])
    sheet(2,50,(u,v)=>{const p=runner(u,along+v*.013);p[1]+=.0028;return p;},"#a7aa97",fabric);
  for(let k=0;k<54;k++){
    const a=runner((k+.5)/54,1);
    rod(a,[a[0]+.006*Math.sin(k*2.7),a[1]-.009-.003*Math.sin(k),a[2]+.034+.009*Math.sin(k*1.9)],.0019,"#8e9583",fabric);
  }
  const nightX=-2.48, nightZ=-3.18;
  legs(nightX,nightZ,.56,.48,.02,.33,.067,walnut);
  box(nightX,.47,nightZ,.76,.34,.68,"#9a7353",wood);
  box(nightX,.50,nightZ+.35,.63,.23,.028,"#b28561",wood);
  box(nightX,.51,nightZ+.375,.13,.028,.025,brass,metal);
  box(nightX,.67,nightZ,.82,.07,.72,walnut,wood);
  cyl(nightX,.734,nightZ-.03,.117,.135,.050,28,"#9c896b",brassMetal);
  cyl(nightX,.913,nightZ-.03,.016,.019,.319,16,"#aa9573",brassMetal);
  // A folded linen shade, open underneath, with a rolled brass hem and visible bulb.
  function lampShade(cx,y,cz,rb,rt,height){
    sheet(7,88,(u,v)=>{
      const a=u*2*Math.PI;
      const rib=.0021*Math.cos(a*22),r=rb+(rt-rb)*v-.010*Math.sin(v*Math.PI)+rib;
      return [cx+r*Math.cos(a),y+height*v,cz+r*Math.sin(a)];
    },"#dbc6a3",{mat:"linen",glow:.48});
    for(const v of [0,1]){
      const r=v?rt:rb;
      sweep(t=>[cx+r*Math.cos(t*Math.PI*2),y+height*v,cz+r*Math.sin(t*Math.PI*2)],.0039,"#c5ac85",brassMetal,44,5);
    }
    for(let k=0;k<3;k++){
      const a=k*2*Math.PI/3;
      rod([cx,y+.019,cz],[cx+rb*.96*Math.cos(a),y+.014,cz+rb*.96*Math.sin(a)],.0027,"#a49478",brassMetal);
    }
    orb(cx,y+.055,cz,.074,.096,.074,"#ffe4b9",{mat:"ceramic",glow:.91});
  }
  lampShade(nightX,1.043,nightZ-.03,.250,.154,.308);
  book(nightX+.13,.71,nightZ+.19,.27,.042,.19,"#364f53",.12);

  // A family photograph and an unsealed letter on the bedside table.
  const photoX=-2.23,photoY=.915,photoZ=-3.37;
  round(photoX,photoY,photoZ,.230,.192,.023,.008,"#89765c",brassMetal);
  box(photoX,photoY,photoZ+.014,.209,.174,.007,"#d9ccae",{mat:"linen"});
  const pz=photoZ+.021;
  box(photoX,photoY+.008,pz,.177,.125,.004,"#bcb49c");
  sheet(2,16,(u,v)=>[photoX+(v-.5)*.177,photoY-.052+u*(.047+.010*Math.sin(7*v)),pz+.003],"#969983");
  box(photoX-.021,photoY-.023,pz+.005,.068,.047,.007,"#89775d");
  sheet(2,10,(u,v)=>[photoX-.064+.086*v,photoY-.002+u*.032*(1-Math.abs(v*2-1)),pz+.010],"#6f6e5d");
  box(photoX-.016,photoY-.031,pz+.011,.016,.032,.005,"#645d50");
  box(photoX-.075,photoY-.018,pz+.006,.010,.061,.005,"#85846d");
  orb(photoX-.071,photoY+.012,pz+.008,.041,.039,.006,"#8c927b");
  for(let j=0;j<3;j++)box(photoX+.026+j*.024,photoY-.035,pz+.010,.003,.031,.004,"#716f60");
  box(photoX+.049,photoY-.030,pz+.012,.072,.003,.004,"#716f60");
  box(photoX,.717,photoZ+.021,.071,.018,.083,"#74634f",{mat:"walnut"});
  rod([photoX,.721,photoZ-.043],[photoX,.876,photoZ-.009],.006,"#826d55",metal);
  const ex=-2.64,ez=-2.994;
  box(ex,.711,ez,.213,.006,.120,"#d8c9a6",{mat:"linen"});
  sheet(3,10,(u,v)=>[ex+(v-.5)*.208,.716+.015*u,ez-.059-u*.054*(1-Math.abs(2*v-1))],"#e8d8b3",creamLinen);
  rod([ex-.074,.718,ez+.032],[ex-.026,.719,ez-.023],.0017,"#74836b");
  for(let j=0;j<4;j++){
    const xx=ex-.069+j*.011,zz=ez+.028-j*.012;
    rod([xx,.719,zz],[xx-.015,.719,zz-.009],.0016,"#74836b");
    rod([xx,.719,zz],[xx+.014,.719,zz+.003],.0016,"#74836b");
  }
  for(let j=0;j<3;j++)box(ex+.033,.718,ez+.004+j*.011,.048+j*.006,.002,.002,"#9a896d");
  // Compact coffee kitchen underneath the center window.
  const counterX=-.51, counterZ=-4.02;
  box(counterX,.103,counterZ,2.75,.19,.73,"#514237",wood);
  box(counterX,.53,counterZ,2.84,.76,.77,"#8a644c",wood);
  for(let d=0;d<4;d++) {
    const x=counterX-1.05+d*.70;
    box(x,.55,-3.62,.675,.67,.045,d<2?"#807968":"#807a6b",{mat:"walnut"});
    box(x+.235,.74,-3.581,.10,.032,.038,brass,metal);
  }
  round(counterX,.971,counterZ,2.96,.101,.86,.018,"#d6d1c5",marble);
  box(counterX,1.083,-4.40,2.96,.13,.08,"#c9c6ba",marble);
  box(-.59,1.028,counterZ,.54,.015,.36,"#768581",metal);
  box(-.59,1.040,counterZ,.43,.015,.27,"#404f52",metal);
  rod([-.62,1.03,-4.21],[-.62,1.30,-4.21],.025,brass,metal);
  rod([-.62,1.30,-4.21],[-.62,1.30,-4.02],.025,brass,metal);
  box(-1.46,1.22,-4.06,.44,.39,.38,"#505758",metal);
  box(-1.46,1.268,-3.857,.39,.20,.025,"#272f34",metal);
  box(-1.46,1.382,-3.814,.40,.063,.08,"#9b9d8f",metal);
  box(-1.46,1.047,-3.811,.39,.04,.15,"#363e43",metal);
  cup(-1.48,1.068,-3.82,.64);
  box(.27,1.05,-4.02,.52,.05,.36,"#aa744c",wood);
  ceramic(.46,1.08,-4.07,.32,"#b77451");
  plant(.65,1.025,-4.25,.42,"#8c6b50",true);

  // Live-edge walnut worktop and darkened steel trestles. Monitor mounts have articulated elbows.
  const deskX=3.77,deskZ=-3.37,top=.797;
  round(deskX,.755,deskZ,3.57,.082,1.20,.030,"#80634b",{mat:"walnut"});
  legs(deskX,deskZ,3.24,.87,.015,.72,.057,graphite);
  box(deskX,.672,deskZ,3.23,.062,.056,graphite,metal);
  round(5.08,.376,deskZ+.02,.57,.59,.86,.023,"#545750",metal);
  for(let i=0;i<3;i++){
    round(5.08,.191+i*.182,-2.902,.542,.173,.026,.009,"#64665b",metal);
    box(5.08,.242+i*.182,-2.883,.178,.015,.020,"#403f38",metal);
  }
  buildWorkstation(g,top);
  cup(5.20,top,-2.99,1);
  book(2.55,top,-3.02,.279,.026,.183,"#646f65",-.12);
  // Desk ephemera: a coffee ring, folded sticky note, and a pen left uncapped.
  const ring=(t)=>[5.03+.054*Math.cos(t),top+.003,-3.05+.052*Math.sin(t)];
  for(let k=0;k<22;k++)rod(ring(k*.21+.12),ring((k+1)*.21+.12),.0017,"#70553f");
  box(4.67,top+.004,-2.963,.092,.005,.085,"#d3c29a",{ry:.15,mat:"linen"});
  for(let j=0;j<3;j++)
    rod([4.634,top+.009,-2.981+j*.012],[4.681-.004*j,top+.009,-2.977+j*.012],.0015,"#897d66");
  rod([4.72,top+.009,-2.90],[4.845,top+.009,-2.96],.0045,"#3e4542",metal);
  rod([4.845,top+.009,-2.96],[4.86,top+.009,-2.966],.002,"#b8ae96",brassMetal);
  // Cantilevered task light with a domed shade and narrow warm diffuser.
  cyl(2.11,top+.025,-3.40,.129,.147,.049,26,"#696451",brassMetal);
  rod([2.11,top+.05,-3.40],[2.11,1.27,-3.44],.013,"#8b806a",brassMetal);
  rod([2.11,1.27,-3.44],[2.25,1.45,-3.34],.012,"#a19277",brassMetal);
  cyl(2.26,1.43,-3.33,.047,.130,.11,28,"#696c60",metal);
  cyl(2.26,1.373,-3.33,.122,.122,.007,26,"#ffddac",{glow:.91});
  // Twin-wheel castors swivel under tapered, arched spokes. The pale veneer follows the leather shell.
  const chairX=3.58,chairZ=-1.96;
  for(let i=0;i<5;i++){
    const a=.22+i*Math.PI*2/5,dx=Math.cos(a),dz=Math.sin(a);
    const x=chairX+.313*dx,z=chairZ+.313*dz;
    const cast=t=>[chairX+.31*t*dx,.172-.068*t*t+.008*Math.sin(t*Math.PI),chairZ+.31*t*dz];
    sweep(cast,t=>.035-.021*t,"#7d8074",metal,10,8);
    cyl(x,.093,z,.013,.016,.059,12,"#72756b",metal);
    for(const side of [-1,1]){
      const wheel=t=>[x+dz*(side*.019+(t-.5)*.024),.047,z-dx*(side*.019+(t-.5)*.024)];
      sweep(wheel,t=>.043-.004*(2*t-1)**4,"#383e3b",metal,4,18);
      rod(wheel(0),wheel(1),.025,"#62685c",metal);
    }
  }
  cyl(chairX,.204,chairZ,.042,.059,.100,22,"#717569",metal);
  cyl(chairX,.299,chairZ,.028,.028,.160,20,"#a0a69a",metal);
  round(chairX,.375,chairZ,.189,.086,.245,.024,"#46504b",metal);
  const seatFit=(s,t)=>{
    const X=s*2-1,Z=t*2-1;
    return [chairX+.284*X*(1-.104*Z*Z),.405+.045*X*X-.016*Z+.011*Math.cos(Z*2.3),
      chairZ+.251*Z*(1-.150*X**4)];
  };
  sheet(15,20,seatFit,"#796856",{mat:"walnut"});
  paddedForm({x:chairX,y:.475,z:chairZ-.008,w:.575,h:.118,d:.512,rx:-.048,color:"#937a62",
    seamColor:"#ac937a",material:leather,padding:.43,compression:.016,thickness:.0035});
  for(const side of [-1,1]){
    const arm=t=>[chairX+side*(.247+.091*Math.sin(Math.PI*.78*t)),.425+.247*t,chairZ-.069+.093*t];
    sweep(arm,t=>.0165+.0024*Math.cos(Math.PI*t),"#888a7a",metal,12,9);
    paddedForm({x:chairX+side*.314,y:.679,z:chairZ+.003,w:.070,h:.057,d:.283,
      color:"#87715d",seamColor:"#99806a",material:leather,padding:.58,compression:0,thickness:.0025});
  }
  // Sculpted shell narrows at the waist, bends for lumbar support and curls inward along its sides.
  function chairBack(s,t,offset=0){
    const q=s*2-1,a=q*.90;
    const r=.375+.045*Math.sin(t*Math.PI*.9)+.041*t*t-.028*Math.exp(-((t-.34)**2)/.039);
    const y=.531+.649*t-.055*Math.abs(q)**4*(t**4)+.021*q*q*(1-t)**2;
    return [chairX+r*Math.sin(a),y,chairZ+.164+.108*t+.107*t*t+
      .082*Math.exp(-((t-.30)**2)/.055)-.168*(1-Math.cos(a))/.379+offset];
  }
  sheet(23,29,(u,v)=>chairBack(1-u,v),"#735e4d",{mat:"walnut"});
  sheet(22,28,(u,v)=>chairBack(u,v,-.044),"#88735d",leather);
  for(const t of [0,1]){
    join(u=>chairBack(u,t),u=>chairBack(u,t,-.044),3,28,"#b29979",{mat:"walnut"});
    sweep(u=>chairBack(u,t,-.033),.004,"#a58c71",leather,28,5);
  }
  for(const side of [0,1])
    join(u=>chairBack(side,u),u=>chairBack(side,u,-.044),3,22,"#ad9476",{mat:"walnut"});
  for(const [lo,hi] of [[.055,.29],[.30,.575],[.586,.956]]){
    sheet(10,23,(s,t)=>{
      const p=chairBack(s,lo+(hi-lo)*t,-.044);p[2]-=.036*Math.sin(Math.PI*t)**.50*Math.sin(Math.PI*s)**.46;return p;
    },"#9c8268",leather);
  }
  const strut=t=>[chairX,.350+.493*t,chairZ+.099+.250*Math.sin(t*Math.PI*.54)];
  sweep(strut,t=>.015+.005*Math.sin(Math.PI*t),"#8a8e80",metal,18,10);
  for(const t of [.27,.65]){
    const p=chairBack(.5,t,.008);
    round(p[0],p[1],p[2],.085,.036,.020,.009,"#8b8c7f",metal);
    for(const sign of [-1,1])rod([p[0]+sign*.030,p[1],p[2]],[p[0]+sign*.030,p[1],p[2]+.013],.005,"#a5a797",metal);
  }
  // A handwoven wool rug: narrow selvedges, a broken warp stripe, and short fringe.
  const rugX=2.91,rugZ=1.95;
  box(rugX,.026,rugZ,5.30,.032,3.85,"#a79d87",fabric);
  box(rugX,.045,rugZ,5.20,.009,3.77,"#b9af99",fabric);
  for(const edge of [-1,1]){
    for(const inset of [.10,.138,.24])
      box(rugX,.051,rugZ+edge*(1.88-inset),5.19,.005,inset===.24?.045:.013,"#958f7f",fabric);
    for(let k=0;k<80;k++)
      box(rugX-2.55+k*.064,.034,rugZ+edge*(1.943+g.rand()*.01),.011,.009,.044+g.rand()*.029,"#c0b7a2",fabric);
  }
  // A single upholstered horseshoe surrounds the deep seat, like a curved bent-ply frame.
  const sx=3.98,sz=.45,backZ=-.064,leftX=sx-1.88,rightX=sx+1.88;
  const bend=.235,armRun=.827,backRun=rightX-leftX-2*bend,arc=Math.PI*bend/2;
  const pathLength=armRun*2+arc*2+backRun;
  function upholsteryPath(t) {
    let d=t*pathLength;
    if(d<armRun) return [leftX,backZ+bend+armRun-d,0,-1,1-d/armRun];
    d-=armRun;
    if(d<arc){
      const a=d/bend;return [leftX+bend*(1-Math.cos(a)),backZ+bend*(1-Math.sin(a)),Math.sin(a),-Math.cos(a),0];
    }
    d-=arc;
    if(d<backRun)return [leftX+bend+d,backZ,1,0,0];
    d-=backRun;
    if(d<arc){
      const a=d/bend;return [rightX-bend+bend*Math.sin(a),backZ+bend*(1-Math.cos(a)),Math.cos(a),Math.sin(a),0];
    }
    d-=arc;return [rightX,backZ+bend+d,0,1,clamp01(d/armRun)];
  }
  function surround(u,v){
    const [x,z,tx,tz,out]=upholsteryPath(v),a=u*Math.PI*2;
    const bottom=.226,top=.938-.207*ease(out),mid=(bottom+top)/2,h=(top-bottom)/2;
    const end=clamp01(Math.min(v,1-v)*pathLength/.116);
    const dome=Math.sqrt(Math.max(.00012,1-(1-end)**2));
    const dr=(.116+.022*(1-out))*power(Math.cos(a),.60)*dome;
    return [x+tz*dr,mid+h*power(Math.sin(a),.72)*dome,z-tx*dr];
  }
  sheet(128,20,(u,v)=>surround(1-u,v),"#777f74",fabric);
  for(const side of [0,1]) sweep(t=>surround(t,side?.980:.020),.005,"#8e9486",fabric,27,5);
  // A recessed walnut rail holds the upholstered seat base above the rug.
  for(const x of [sx-1.61,sx-.48,sx+1.54])for(const z of [sz-.38,sz+.39])
    cyl(x,.121,z,.054,.067,.143,14,"#665849",{mat:"walnut"});
  round(sx,.224,sz,3.83,.153,1.055,.069,"#6c695a",{mat:"walnut"});
  round(sx,.325,sz,3.79,.198,1.07,.075,"#758071",fabric);
  for(let i=0;i<3;i++){
    const cx=sx-1.183+i*1.183,chaise=i===2;
    if(chaise){
      cyl(cx-.44,.122,1.74,.051,.061,.140,14,"#655747",{mat:"walnut"});
      cyl(cx+.44,.122,1.74,.051,.061,.140,14,"#655747",{mat:"walnut"});
      round(cx,.233,1.45,1.16,.168,.93,.076,"#686b5c",{mat:"walnut"});
      round(cx,.326,1.43,1.16,.203,.93,.083,"#74816f",fabric);
    }
    paddedForm({x:cx,y:.486,z:chaise?.986:sz+.071,w:1.166,h:.201,d:chaise?1.907:.976,
      color:i===1?"#919785":"#8b9483",seamColor:"#a5a895",material:fabric,padding:.274,compression:.017,thickness:.0056,seed:i*1.7});
    paddedForm({x:cx,y:.757+(i===1?-.012:0),z:sz-.305,w:1.166,h:.245,d:.49,rx:1.353,ry:(i-1)*.021,
      color:"#828c7b",seamColor:"#979e89",material:fabric,padding:.36,compression:.014,thickness:.0045,seed:i+.4});
  }
  // Throw pillows lean on the arms; off-axis compression keeps the two silhouettes distinct.
  paddedForm({x:sx-1.39,y:.75,z:sz-.016,w:.52,h:.20,d:.51,rx:1.23,rz:.22,ry:.087,color:"#af8f74",
    seamColor:"#bca28b",material:creamLinen,padding:.64,compression:.011,seed:3,thickness:.0038});
  paddedForm({x:sx+1.42,y:.746,z:sz-.015,w:.53,h:.21,d:.50,rx:1.28,rz:-.25,ry:-.103,color:"#c9bea5",
    seamColor:"#aca28c",material:creamLinen,padding:.61,compression:.013,seed:1,thickness:.0038});
  function sofaThrow(s,t){
    const x=sx+.78+.78*s,xt=s*2-1,z=1.34+.736*t+.032*s;
    const end=foldOver(z,1.811,.089),drop=end[1];
    const y=.587-.042*xt*xt+.012*Math.sin(s*12+t*1.7)+.012*Math.cos(s*22-t*3.1)-drop*.96;
    return [x+.005*Math.sin(t*6),y,end[0]+.018*Math.sin(s*18)*ease(drop/.14)];
  }
  sheet(18,32,sofaThrow,"#b7aa91",creamLinen);
  for(const t of [.063,.109,.832,.875])
    sheet(2,32,(u,v)=>{const p=sofaThrow(u,t+.012*v);p[1]+=.002;return p;},"#929581",fabric);
  for(let k=0;k<28;k++){
    const p=sofaThrow((k+.5)/28,1);rod(p,[p[0]+.003*Math.sin(k*1.83),p[1]-.036-.006*Math.sin(k),p[2]+.009],.0017,"#a2a28f",fabric);
  }
  // A travertine coffee table, softly bevelled at its perimeter, on two offset pedestals.
  const tx=2.74,tz=2.33;
  cyl(tx-.48,.235,tz,.173,.195,.36,28,"#887b68",stone);
  cyl(tx+.40,.235,tz-.055,.213,.242,.36,32,"#897c69",stone);
  round(tx,.445,tz,1.78,.095,.91,.045,"#c7bfa9",marble);
  book(tx-.35,.495,tz-.028,.392,.043,.279,"#616f69",.087);
  book(tx-.35,.541,tz-.028,.359,.027,.251,"#b49c7d",-.06);
  cyl(tx+.42,.502,tz+.112,.075,.075,.014,24,"#8b7662",{mat:"walnut"});
  cup(tx+.42,.510,tz+.112,.96);
  ceramic(tx+.07,.494,tz-.151,.34,"#c2b69e");
  // Brass floor lamp, potted trees and a bentwood lounge chair.
  const lx=5.70,lz=-.89;
  cyl(lx,.067,lz,.208,.222,.11,30,"#746f5f",brassMetal);
  cyl(lx,.973,lz,.019,.023,1.71,20,"#a28f71",brassMetal);
  lampShade(lx,1.807,lz,.324,.241,.356);
  plant(5.72,.02,-3.97,1.09,"#a99b84");plant(-5.66,.01,.33,.91,"#997f68");
  plant(-5.46,.01,4.02,.65,"#a1a596",true);
  const ax=-3.84,az=2.20;
  for(const side of [-1,1]){
    for(const dz of [-1,1])
      rod([ax+side*.418,.024,az+dz*.363],[ax+side*.35,.396,az+dz*.262],.029,"#755b44",{mat:"walnut"});
    rod([ax+side*.384,.359,az+.163],[ax+side*.456,.615,az+.26],.024,"#755b44",{mat:"walnut"});
    rod([ax+side*.386,.361,az-.24],[ax+side*.461,.632,az-.295],.024,"#755b44",{mat:"walnut"});
    round(ax+side*.461,.642,az-.025,.070,.045,.66,.020,"#886c52",{rx:.028,mat:"walnut"});
  }
  round(ax,.387,az,.828,.087,.787,.042,"#795f47",{mat:"walnut"});
  round(ax,.465,az+.025,.807,.153,.752,.075,"#a18b72",leather);
  round(ax,.703,az-.325,.824,.529,.126,.061,"#8d745d",{rx:-.17,mat:"walnut"});
  round(ax,.715,az-.275,.790,.497,.134,.065,"#aa9279",{rx:-.17,mat:"leather"});
  cyl(-2.83,.059,1.85,.201,.215,.086,22,"#6d6a5d",brassMetal);
  cyl(-2.83,.312,1.85,.026,.032,.43,16,"#978b75",brassMetal);
  cyl(-2.83,.546,1.85,.314,.301,.043,36,"#c3b9a0",marble);
  book(-2.85,.572,1.82,.228,.031,.161,"#738178",.13);
}
