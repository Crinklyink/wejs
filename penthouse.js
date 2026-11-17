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
  function pot(x,y,z,r,h,color) {
    cyl(x,y+h*.47,z,r*.95,r*.76,h*.92,14,color,stone);
    cyl(x,y+h*.90,z,r,r*.96,h*.16,14,color,stone);
    cyl(x,y+h*.997,z,r*.85,r*.85,.012,14,"#493b33");
    return y+h;
  }
  function plant(x,y,z,size,potColor,compact=false) {
    const h = pot(x,y,z,.29*size,.53*size,potColor);
    const greens=["#365147","#4b6150","#49644b","#61735b","#536d55"];
    const count=compact?8:13;
    for(let i=0;i<count;i++){
      const a=i*2.399+g.rand()*.45,dx=Math.cos(a),dz=Math.sin(a);
      const reach=size*(.17+g.rand()*.36), tall=size*((compact?.32:.67)+g.rand()*(compact?.27:.66));
      const q=[x+dx*reach,h+tall,z+dz*reach];
      rod([x,h,z],q,.009*size,"#5f7052");
      const lf=size*(.39+g.rand()*.23),lw=size*(compact?.095:.15);
      sheet(9,6,(u,v)=>{
        const along=v*lf,across=(u*2-1)*lw*Math.pow(Math.sin(v*Math.PI),.72);
        return [q[0]+dx*along-dz*across,q[1]+lf*(.53*Math.sin(v*Math.PI)-.35*v)-Math.abs(across)*.25,q[2]+dz*along+dx*across];
      },pick(greens),{mat:"plain"});
      const p1=[q[0]+dx*lf*.35,q[1]+lf*.31,q[2]+dz*lf*.35];
      rod(q,p1,size*.0047,"#8a9172");
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

  // Upholstered bedstead, piping and independently draped bed linens.
  round(-4.44,.026,-2.08,3.36,.030,3.65,.011,"#8c8a7b",fabric);
  legs(-4.44,-2.12,2.13,2.24,.055,.24,.073,"#514237");
  round(-4.44,.261,-2.14,2.54,.25,2.81,.073,"#837568",fabric);
  round(-4.44,.469,-2.10,2.44,.29,2.67,.119,"#d4cebf",creamLinen);
  round(-4.44,.722,-3.62,2.77,1.23,.15,.074,"#84796a",fabric);
  for(let i=0;i<7;i++) round(-5.58+i*.38,.754,-3.525,.370,1.03,.105,.044,"#aca08b",creamLinen);
  for(const side of [-1,1]){
    box(-4.44+side*1.222,.56,-2.08,.008,.012,2.44,"#aca89b",creamLinen);
    box(-4.44,.56,-2.10+side*1.33,2.16,.011,.009,"#aead9e",creamLinen);
  }
  function pillow(cx,cy,cz,w,h,d,color,yaw=0,lift=.10){
    const ca=Math.cos(yaw),sa=Math.sin(yaw);
    function shape(u,v){
      const phi=(u-.5)*Math.PI,theta=v*Math.PI*2;
      const power=(a,e)=>Math.sign(a)*Math.pow(Math.abs(a),e);
      const xp=w*.5*power(Math.cos(phi),.54)*power(Math.cos(theta),.42);
      const zp=d*.5*power(Math.cos(phi),.54)*power(Math.sin(theta),.42);
      const t=power(Math.sin(phi),.72);
      const creases=.009*Math.sin(xp*36+zp*8)*Math.cos(zp*12)*Math.abs(xp/w)*2;
      return [cx+xp*ca-zp*sa,cy+h*.5*t-lift*zp/d+creases,cz+xp*sa+zp*ca];
    }
    sheet(13,27,shape,color,creamLinen);
    let last=shape(.52,0);
    for(let k=1;k<=32;k++){const next=shape(.52,k/32);rod(last,next,.007,color,creamLinen);last=next;}
  }
  pillow(-5.03,.696,-3.028,1.02,.29,.63,"#e9e2d4",-.061,.13);
  pillow(-3.86,.701,-3.039,1.03,.28,.63,"#e3dccb",.042,.13);
  pillow(-5.01,.717,-2.699,.69,.21,.41,"#b3b0a1",.082,.10);
  pillow(-3.89,.722,-2.712,.70,.19,.43,"#b5b0a0",-.058,.10);
  // v indexes the spread across the bed, u the distance towards its foot.
  function comforter(u,v){
    const t=v*2-1, ax=Math.abs(t);
    const dropX=Math.max(0,(ax-.876)/.124),dropZ=Math.max(0,(u-.908)/.092);
    const edge=Math.max(dropX,dropZ);
    const x=-4.44+Math.sign(t)*(Math.min(ax,.876)*1.39+Math.sin(dropX*Math.PI/2)*.091);
    const z=-2.65+Math.min(u,.908)*2.22+.114*Math.sin(dropZ*Math.PI/2)+.027*Math.cos(t*3.4+u*2);
    const folds=.016*Math.sin(t*10+u*4)+.013*Math.cos(t*17-u*7)*(.3+u*.7)+.009*Math.sin(t*31+u*11);
    const gathered=.046*Math.exp(-Math.pow((u-.12-.038*Math.sin(t*4))/.069,2));
    return [x,.716+.052*Math.cos(t*1.4)*(1-u*.35)+folds+gathered-.272*edge,z];
  }
  sheet(38,56,comforter,"#e4ddcb",creamLinen);
  // The turned-down sheet makes a soft, wandering front edge around the pillows.
  sheet(9,54,(u,v)=>{
    const yEdge=.08+.015*Math.sin(v*9);const q=comforter(u*yEdge,v);
    q[1]+=.022+.029*Math.sin(Math.PI*u);return q;
  },"#e9e3d5",creamLinen);
  function throwCloth(u,v){
    const along=.62+.22*u+.025*Math.sin(v*6.2);
    const q=comforter(along,v);
    q[1]+=.036+.021*Math.sin(v*19+u*.55)+.016*Math.sin(u*9-v*4);
    q[2]+=.024*Math.sin(v*11.2);return q;
  }
  sheet(16,52,throwCloth,"#777d73",fabric);
  for(const u0 of [.055,.083,.895]){
    sheet(2,45,(u,v)=>{const q=throwCloth(u0+u*.015,v);q[1]+=.003;return q;},"#b4b1a0",fabric);
  }
  for(let k=0;k<50;k++){
    const v=(k+.5)/50,a=throwCloth(1,v);
    rod(a,[a[0]+.004*Math.sin(k*4),a[1]-.016,a[2]+.055+.014*Math.sin(k*3)],.0028,"#96998a",fabric);
  }
  const nightX=-2.48, nightZ=-3.18;
  legs(nightX,nightZ,.56,.48,.02,.33,.067,walnut);
  box(nightX,.47,nightZ,.76,.34,.68,"#9a7353",wood);
  box(nightX,.50,nightZ+.35,.63,.23,.028,"#b28561",wood);
  box(nightX,.51,nightZ+.375,.13,.028,.025,brass,metal);
  box(nightX,.67,nightZ,.82,.07,.72,walnut,wood);
  cyl(nightX,.74,nightZ-.03,.16,.18,.07,16,brass,metal);
  cyl(nightX,.93,nightZ-.03,.024,.024,.35,10,brass,metal);
  cyl(nightX,1.204,nightZ-.03,.16,.30,.34,18,"#f2bf81",{glow:.59});
  cyl(nightX,1.028,nightZ-.03,.281,.281,.018,18,"#ffd996",amber);
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
  function monitor(x,z,width,height,style){
    const center=1.442,front=z+.041;
    round(x,.818,z+.045,.32,.032,.217,.015,"#4d5050",metal);
    cyl(x,1.068,z-.026,.027,.027,.47,16,"#72716a",metal);
    rod([x,1.265,z-.04],[x,1.434,z-.14],.029,"#484d4c",metal);
    round(x,center,z,width,height,.065,.023,"#232b2e",metal);
    box(x,center,front-.004,width-.035,height-.034,.014,"#101d25",{mat:"screen",glow:.39});
    const left=x-width*.463,bottom=center-height*.355,graphW=width*.693,graphH=height*.625;
    box(x,center+height*.422,front+.006,width-.056,.045,.008,"#25323b",{mat:"screen",glow:.48});
    for(let i=0;i<5;i++)
      box(left+graphW*.5,bottom+i*graphH/4,front+.010,graphW,.003,.006,"#34454b",{glow:.49});
    for(let i=0;i<7;i++)
      box(left+graphW*i/6,bottom+graphH*.5,front+.010,.0025,graphH,.006,"#2c3d45",{glow:.44});
    for(let i=0;i<43;i++){
      const k=i/42, trend=style?.66-.29*k+.12*Math.sin(i*.31):.25+.53*k+.12*Math.sin(i*.27);
      const y=bottom+graphH*(trend+.056*Math.sin(i*2.01+.27)),col=Math.sin(i*1.73)>.02?"#d89078":"#89c9b6";
      box(left+k*graphW,y,front+.016,.0037,graphH*(.07+.10*g.rand()),.006,col,{glow:.86});
      box(left+k*graphW,y,front+.019,graphW*.015,graphH*(.033+.064*g.rand()),.006,col,{glow:.87});
      const h=.010+g.rand()*.031;
      box(left+k*graphW,bottom+h*.5,front+.017,graphW*.014,h,.006,"#607e7d",{glow:.60});
    }
    box(x+width*.254,center-height*.018,front+.014,.004,height*.737,.007,"#3e4d50",{glow:.5});
    for(let i=0;i<12;i++){
      const y=center+height*.315-i*height*.0625;
      box(x+width*.328,y,front+.016,width*(.05+g.rand()*.06),.007,.006,"#a0ada8",{glow:.72});
      box(x+width*.422,y,front+.016,width*(.027+g.rand()*.04),.006,.006,i%4===0?"#d49a80":"#95c2af",{glow:.71});
    }
    box(x+width*.439,center-height*.482,front+.004,.012,.004,.006,"#7db5a9",{glow:.71});
  }
  monitor(3.05,-3.60,1.36,.756,0);
  monitor(4.48,-3.60,1.36,.756,1);
  round(3.71,top+.007,-3.016,1.31,.014,.474,.006,"#52574e",leather);
  round(3.55,.824,-2.99,.545,.031,.186,.013,"#424746",metal);
  for(let row=0;row<5;row++) for(let key=0;key<(row===4?7:15);key++){
    const space=row===4&&key===4,w=space?.13:.025;
    box(3.307+key*.034+(row===4&&key>4?.114:0)+(space?.051:0),.847,-3.063+row*.033,w,.016,.025,
      key===0&&row===0?"#ac8168":"#9a9d92",metal);
  }
  orb(4.13,.833,-2.98,.084,.052,.130,"#b0b2a7",metal);
  box(4.13,.858,-2.999,.009,.008,.021,"#73786f",metal);
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
  // Chair: cast aluminum five-star base, saddle seat and a formed leather back.
  const chairX=3.58,chairZ=-1.96;
  for(let i=0;i<5;i++){
    const a=i*2*Math.PI/5,x=chairX+Math.cos(a)*.318,z=chairZ+Math.sin(a)*.318;
    rod([chairX,.188,chairZ],[x,.092,z],.024,"#6b6e68",metal);
    for(const dx of [-.022,.022])
      cyl(x+dx,.065,z,.05,.05,.028,14,"#343735",{rz:Math.PI/2,mat:"metal"});
  }
  cyl(chairX,.285,chairZ,.042,.047,.259,16,"#5a5e57",metal);
  round(chairX,.420,chairZ,.611,.089,.550,.043,"#5a493d",{mat:"walnut"});
  round(chairX,.488,chairZ,.583,.114,.525,.056,"#937761",leather);
  for(const side of [-1,1]){
    rod([chairX+side*.267,.445,chairZ+.04],[chairX+side*.326,.679,chairZ+.037],.019,"#68695e",metal);
    round(chairX+side*.323,.687,chairZ+.014,.064,.045,.303,.021,"#795e4b",leather);
  }
  round(chairX,.694,chairZ+.24,.074,.398,.055,.024,"#5c5d51",metal);
  const seatBack=(u,v,offset)=>{
    const angle=(v-.5)*1.81,profile=.49+.033*Math.sin(u*Math.PI);
    return [chairX+profile*.84*Math.sin(angle),.672+u*.55,chairZ+.233+profile*.62*(Math.cos(angle)-.64)+.089*u+offset];
  };
  sheet(16,25,(u,v)=>seatBack(u,v,0),"#91725b",leather);
  sheet(16,25,(u,v)=>seatBack(u,v,-.037),"#a08167",leather);
  for(const v of [0,1])for(let i=0;i<12;i++)rod(seatBack(i/12,v,-.017),seatBack((i+1)/12,v,-.017),.022,"#94745d",leather);
  for(const u of [0,1])for(let i=0;i<24;i++)rod(seatBack(u,i/24,-.017),seatBack(u,(i+1)/24,-.017),.022,"#94745d",leather);
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
  // Low three-seat sofa, upholstered deck, loose foam seats and a right-side chaise.
  const sx=3.98,sz=.45;
  legs(sx,sz,3.48,.72,.045,.18,.065,"#5a5043");
  round(sx,.190,sz,3.98,.123,1.03,.045,"#615748",{mat:"walnut"});
  round(sx,.302,sz,4.02,.236,1.13,.079,"#647069",fabric);
  round(sx,.590,sz-.504,4.0,.692,.239,.102,"#778078",fabric);
  for(let i=0;i<3;i++){
    const x=sx-1.21+i*1.21;
    round(x,.467,sz+.06,1.188,.19,.96,.086,"#91978b",fabric);
    round(x,.740,sz-.302,1.180,.444,.225,.102,"#899084",{rx:-.14,mat:"fabric"});
    const z=sz+.542;
    rod([x-.49,.456,z],[x+.49,.456,z],.006,"#9fa196",fabric);
  }
  for(const side of [-1,1])
    round(sx+side*1.907,.504,sz,.22,.485,1.16,.088,"#7d857a",fabric);
  legs(sx+1.22,1.49,.83,.67,.043,.18,.068,"#5a5043");
  round(sx+1.22,.313,1.45,1.18,.240,.98,.073,"#6a746c",fabric);
  round(sx+1.22,.469,1.456,1.18,.181,.98,.083,"#91978b",fabric);
  round(sx-1.42,.73,sz-.02,.557,.509,.175,.086,"#aa896f",{rz:.18,rx:-.2,mat:"linen"});
  round(sx+1.32,.75,sz-.03,.562,.54,.19,.091,"#c0b7a1",{rz:-.15,rx:-.2,mat:"linen"});
  sheet(20,29,(u,v)=>{
    const edge=Math.max(0,(u-.71)/.29),ridge=.014*Math.sin(v*22+u*4)+.009*Math.sin(v*13-u*7);
    return [sx+.72+.91*v+.019*Math.sin(u*3+v*10),.59+ridge-.23*edge,
      1.30+.62*Math.min(u,.71)+.19*Math.sin(edge*Math.PI*.51)+.026*Math.sin(v*7)];
  },"#b7aa93",creamLinen);
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
  cyl(lx,1.99,lz,.247,.335,.358,42,"#d8be98",{mat:"linen",glow:.51});
  cyl(lx,1.807,lz,.318,.318,.01,40,"#ffddb0",amber);
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
