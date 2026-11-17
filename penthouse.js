/* Floor 48. All furnishings are built at room scale, with the street below y=0. */
function buildPenthouse(g) {
  const wood = {mat:"wood"}, fabric = {mat:"fabric"}, metal = {mat:"metal"}, stone = {mat:"stone"};
  const iron = "#323b45", graphite = "#23303a", brass = "#b88654", walnut = "#754833";
  const linen = "#e6d6b7", porcelain = "#e5e5cf";
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
    const greens = ["#486e54","#668353","#3f6550","#829758","#557959"];
    const count = compact ? 10 : 15;
    for (let i=0;i<count;i++) {
      const a=i*2.399+g.rand()*.5, dx=Math.cos(a), dz=Math.sin(a);
      const spread=size*(.17+.31*g.rand()), height=size*((compact?.33:.65)+g.rand()*(compact?.34:.74));
      const tip=[x+dx*spread,h+height,z+dz*spread];
      rod([x,h,z],tip,0.014*size,"#526848");
      const leaf=.26+g.rand()*.14;
      orb(tip[0]+dx*size*.11,tip[1]+size*.045,tip[2]+dz*size*.11,
        size*leaf,size*.1,size*(compact?.39:.53),pick(greens),{ry:a+Math.PI/2,rx:.29});
    }
  }
  function ceramic(x,y,z,s,c) {
    cyl(x,y+s*.21,z,s*.22,s*.20,s*.42,14,c);
    cyl(x,y+s*.48,z,s*.12,s*.22,s*.13,14,c);
    cyl(x,y+s*.56,z,s*.115,s*.12,s*.06,14,c);
    cyl(x,y+s*.594,z,s*.082,s*.082,.009,14,"#514542");
  }
  function cup(x,y,z,s) {
    cyl(x,y+.11*s,z,.105*s,.077*s,.22*s,12,porcelain);
    cyl(x,y+.222*s,z,.083*s,.083*s,.008,12,"#594132");
    box(x+.126*s,y+.12*s,z,.07*s,.09*s,.045*s,porcelain);
    box(x+.124*s,y+.15*s,z,.04*s,.032*s,.04*s,"#adb2a3");
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
  const plankTones=["#b1855e","#bb9067","#b68c63","#a97e59","#c2986e","#ad835d","#c39872"];
  const rows=33, pitch=9.18/rows;
  for (let j=0;j<rows;j++) {
    const z=-4.59+(j+.5)*pitch;
    let x=-6.38, len=.45+g.rand()*2.0;
    while(x<6.36) {
      const w=Math.min(6.38-x,len);
      if(w>.011) box(x+w/2,-.010,z,Math.max(.004,w-.010),.035,pitch-.008,pick(plankTones),wood);
      x+=w; len=2.02+g.rand()*1.17;
    }
  }
  // Industrial sash windows, with a brick pier separating two glazing bays.
  box(0,.17,-4.55,12.78,.34,.17,"#735e51",stone);
  box(-6.35,.17,0,.17,.34,9.18,"#735e51",stone);
  box(0,.368,-4.48,12.8,.09,.26,"#906b4c",wood);
  box(-6.28,.368,0,.26,.09,9.2,"#906b4c",wood);
  for (let j=0;j<=8;j++) {
    const x=-6.33+j*1.5825, w=j%4===0?.15:.072;
    box(x,2.003,-4.53,w,3.32,.123,iron,metal);
    box(x+w*.36,2.00,-4.464,.022,3.29,.012,"#9a7f69",metal);
  }
  for (let j=0;j<=6;j++) {
    const z=-4.55+j*1.515, w=j%3===0?.135:.073;
    box(-6.34,2.005,z,.126,3.32,w,iron,metal);
    box(-6.271,2.00,z+w*.3,.013,3.29,.025,"#8e796c",metal);
  }
  for(const h of [1.37,3.03]) {
    box(0,h,-4.53,12.80,.058,.095,iron,metal);
    box(-6.34,h,0,.093,.058,9.16,iron,metal);
  }
  box(0,3.62,-4.53,12.9,.17,.18,"#48494b",metal);
  box(-6.34,3.62,0,.18,.17,9.25,"#48494b",metal);
  box(0,3.717,-4.53,12.91,.043,.23,"#997658",metal);
  box(-6.34,3.717,0,.23,.043,9.25,"#997658",metal);
  box(0,3.52,-4.49,12.89,.036,.23,"#77716a",metal);
  box(-6.31,3.52,0,.23,.036,9.25,"#77716a",metal);

  // A short masonry pier makes room for original artwork and the record console.
  box(-6.245,1.80,2.28,.225,3.60,2.99,"#8a7366",stone);
  const brick=["#aa7965","#ac7b66","#976d60","#bc8b75","#a47662","#a78172"];
  for(let row=0;row<15;row++) {
    let z=.785;
    for(let n=0;z<3.765;n++) {
      const span=Math.min(3.775-z,n===0&&row%2?.25:.49);
      box(-6.118,.12+row*.238,z+span/2,.045,.216,Math.max(.012,span-.019),pick(brick),stone);
      z+=span;
    }
  }
  // Framed graphic print seen broadside on the exposed left wall.
  box(-6.047,2.34,2.18,.11,1.62,1.19,"#5b4538",wood);
  box(-5.984,2.34,2.18,.03,1.49,1.06,"#e3d3b6");
  box(-5.961,2.34,2.18,.02,1.30,.89,"#c1b6a0");
  orb(-5.936,2.67,2.30,.025,.36,.36,"#cb7550");
  for(let k=0;k<11;k++) {
    const height=.24+.33*Math.abs(Math.sin(k*.37+.28));
    box(-5.938,1.716+height*.5,1.785+k*.079,.016,height,.081,k<5?"#41666b":"#4b7175");
    const h2=.095+.16*Math.abs(Math.cos(k*.5));
    box(-5.924,1.716+h2*.5,1.785+k*.079,.014,h2,.081,"#344f59");
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

  // King-size bed, with a channel-tufted headboard and folded blanket.
  box(-4.44,.026,-2.08,3.55,.042,3.88,"#445257",fabric);
  box(-4.44,.05,-2.08,3.42,.015,3.74,"#6b7873",fabric);
  for(let i=0;i<9;i++) box(-5.98+i*.38,.06,-.36,.016,.009,.30,"#c8b392",fabric);
  legs(-4.44,-2.12,2.52,2.54,.06,.31,.13,"#574233");
  box(-4.44,.34,-2.12,2.85,.25,3.13,walnut,wood);
  box(-4.44,.545,-2.09,2.79,.27,3.02,linen,fabric);
  box(-4.44,.84,-3.67,2.98,1.38,.16,"#776353",wood);
  for(let i=0;i<10;i++) box(-5.76+i*.293,.91,-3.57,.28,1.10,.10,"#b39676",fabric);
  box(-4.44,.706,-1.83,2.77,.13,2.44,"#e5d4b2",fabric);
  for(const x of [-5.12,-3.76]) {
    orb(x,.78,-3.15,1.19,.25,.58,"#f3e8cd",fabric);
    box(x,.791,-2.825,1.00,.095,.27,"#aab19f",fabric);
  }
  box(-4.44,.77,-1.23,2.83,.15,1.33,"#42656a",fabric);
  box(-4.44,.57,-.55,2.83,.41,.086,"#456970",fabric);
  box(-5.86,.6,-1.19,.065,.28,1.40,"#3c6067",fabric);
  box(-3.019,.59,-1.19,.065,.29,1.40,"#5d7c7d",fabric);
  for(const z of [-1.70,-1.64,-.77,-.69])
    box(-4.44,.851,z,2.83,.013,.023,"#9aa79b",fabric);
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

  // Compact coffee kitchen underneath the center window.
  const counterX=-.51, counterZ=-4.02;
  box(counterX,.103,counterZ,2.75,.19,.73,"#514237",wood);
  box(counterX,.53,counterZ,2.84,.76,.77,"#8a644c",wood);
  for(let d=0;d<4;d++) {
    const x=counterX-1.05+d*.70;
    box(x,.55,-3.62,.675,.67,.045,d<2?"#7a8d83":"#84968a",wood);
    box(x+.235,.74,-3.581,.10,.032,.038,brass,metal);
  }
  box(counterX,.971,counterZ,2.96,.101,.86,"#d1c4a7",stone);
  box(counterX,1.083,-4.40,2.96,.13,.08,"#c1b498",stone);
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

  // Three-part desk: hardwood top, dark steel trestle, drawer pedestal.
  const deskX=3.77, deskZ=-3.37;
  box(deskX,1.047,deskZ,3.75,.145,1.38,"#966848",wood);
  box(deskX,1.096,deskZ,3.76,.055,1.40,"#b88e65",wood);
  legs(deskX,deskZ,3.37,1.04,.02,.98,.088,graphite);
  box(deskX,.92,deskZ,3.42,.14,.10,graphite,metal);
  box(5.08,.55,deskZ+.04,.65,.75,1.03,"#47534e",metal);
  for(let i=0;i<3;i++) {
    box(5.08,.33+i*.23,-2.799,.60,.206,.047,"#667365",metal);
    box(5.08,.37+i*.23,-2.766,.19,.026,.047,brass,metal);
  }
  function monitor(x,z,width,height,style) {
    const center=1.84, front=z+.082;
    box(x,1.168,z+.035,.50,.07,.31,graphite,metal);
    box(x,1.41,z,.091,.51,.089,"#424b49",metal);
    box(x,center,z,width,height,.13,"#27333b",metal);
    box(x,center,front-.009,width-.07,height-.075,.027,"#112c37",{glow:.32});
    box(x,center+height*.42,front+.006,width-.09,.055,.012,style?"#294955":"#24434c",{glow:.37});
    const left=x-width*.44, bottom=center-height*.32;
    const graphWidth=width*.66, graphH=height*.59;
    for(let i=0;i<4;i++) box(left+graphWidth*.5,bottom+i*graphH/3,front+.011,graphWidth,.009,.012,"#36505b",{glow:.35});
    for(let i=0;i<6;i++) box(left+graphWidth*i/5,bottom+graphH*.5,front+.011,.007,graphH,.012,"#304854",{glow:.24});
    for(let i=0;i<21;i++) {
      const k=i/20, trend=style? .66-.28*k+.11*Math.sin(i*.58):.27+.50*k+.13*Math.sin(i*.57);
      const y=bottom+graphH*(trend+.10*Math.sin(i*2.01+.27)), col=Math.sin(i*1.73)>.02?"#f0a06a":"#76e7c6";
      box(left+k*graphWidth,y,front+.025,.012,graphH*(.12+.14*g.rand()),.014,col,blueLight);
      box(left+k*graphWidth,y,front+.031,graphWidth*.032,graphH*(.045+.12*g.rand()),.013,col,blueLight);
      const h=.017+g.rand()*.035;
      box(left+k*graphWidth,bottom+h*.5,front+.027,graphWidth*.027,h,.013,"#608482",{glow:.58});
    }
    for(let i=0;i<8;i++) {
      const y=center+height*.25-i*height*.067;
      box(x+width*.342,y,front+.017,width*.10,.015,.012,i%3===0?"#e39c73":"#7bd2b5",{glow:.67});
      box(x+width*.423,y,front+.017,width*.04,.012,.012,"#849a94",{glow:.54});
    }
    box(x+width*.438,center-height*.455,front+.005,.025,.01,.012,"#72dac0",blueLight);
  }
  monitor(3.02,-3.59,1.49,.90,0);
  monitor(4.62,-3.59,1.50,.90,1);
  box(3.72,1.13,-2.994,1.52,.019,.48,"#3f504c",fabric);
  box(3.56,1.165,-2.985,.84,.046,.28,"#3b4243",metal);
  for(let row=0;row<4;row++) for(let key=0;key<(row===3?5:11);key++)
    box(3.20+key*.069,1.194,-3.079+row*.063,row===3&&key===4?.29:.047,.016,.038,row===0?"#7d8981":"#b3b3a1");
  orb(4.24,1.185,-2.97,.14,.082,.205,"#9ca9a0");
  cup(5.32,1.125,-2.98,.88);
  book(2.18,1.14,-2.99,.36,.048,.29,"#b97151",-.12);
  // Articulated office chair with casters and a stitched seatback.
  const chairX=3.58, chairZ=-1.96;
  for(let i=0;i<5;i++) {
    const a=i*2*Math.PI/5, x=chairX+Math.cos(a)*.37,z=chairZ+Math.sin(a)*.37;
    rod([chairX,.21,chairZ],[x,.11,z],.034,graphite,metal);
    orb(x,.076,z,.10,.12,.13,"#30383a");
  }
  cyl(chairX,.36,chairZ,.045,.052,.32,12,"#716d63",metal);
  box(chairX,.56,chairZ,.71,.14,.68,"#735b49",wood);
  box(chairX,.65,chairZ,.68,.14,.65,"#b07b54",fabric);
  for(const side of [-1,1]) {
    box(chairX+side*.394,.78,chairZ,.055,.42,.050,graphite,metal);
    box(chairX+side*.394,.95,chairZ,.085,.07,.48,walnut,wood);
  }
  box(chairX,.99,chairZ+.30,.14,.71,.064,graphite,metal);
  box(chairX,1.12,chairZ+.35,.69,.77,.13,"#a16d4d",fabric);
  for(let i=0;i<4;i++) box(chairX,.86+i*.14,chairZ+.422,.64,.009,.012,"#855d45",fabric);

  // Wool rug with a woven border and restrained stepped diamonds.
  const rugX=2.91,rugZ=1.95;
  box(rugX,.029,rugZ,5.30,.039,3.85,"#736f61",fabric);
  box(rugX,.052,rugZ,5.23,.015,3.78,"#c6b598",fabric);
  for(let i=0;i<2;i++) {
    const margin=.11+i*.10, col=i===0?"#887f68":"#a79678";
    for(const s of [-1,1]) {
      box(rugX,.064,rugZ+s*(1.88-margin),5.23-2*margin,.012,.027,col,fabric);
      box(rugX+s*(2.60-margin),.064,rugZ,.027,.012,3.78-2*margin,col,fabric);
    }
  }
  for(let i=0;i<60;i++) {
    const xx=rugX-2.50+i*.085;
    for(const s of [-1,1]) box(xx,.037,rugZ+s*1.954,.026,.021,.112,"#cbbd9f",fabric);
  }
  for(let u=0;u<6;u++) for(let v=0;v<4;v++) {
    const x=rugX-2.05+u*.81, z=rugZ-1.27+v*.83;
    for(let j=-2;j<=2;j++) for(const s of [-1,1]) {
      if(j===0&&s===-1) continue;
      box(x+j*.063,.066,z+s*(2-Math.abs(j))*.068,.07,.009,.033,"#ac9c7d",fabric);
    }
  }
  // The sectional faces the cutaway: a deep chaise on the right, two seats on the left.
  const sx=3.98, sz=.45;
  legs(sx,sz,3.49,.80,.068,.26,.12,"#6d5139");
  box(sx,.30,sz,3.99,.22,1.12,"#77573c",wood);
  box(sx,.43,sz,4.05,.24,1.18,"#45655f",fabric);
  box(sx,.82,sz-.53,4.04,.87,.24,"#51746a",fabric);
  for(let i=0;i<3;i++) {
    const x=sx-1.22+i*1.22;
    box(x,.66,sz+.07,1.175,.23,1.02,"#729182",fabric);
    box(x,.965,sz-.32,1.175,.53,.22,"#6c897a",fabric);
    box(x,.632,sz+.582,1.14,.018,.009,"#9da78b",fabric);
  }
  for(const s of [-1,1]) box(sx+s*1.906,.73,sz,.22,.59,1.23,"#587b6e",fabric);
  legs(sx+1.24,1.49,.80,.71,.068,.27,.1,"#6d5139");
  box(sx+1.24,.455,1.49,1.19,.32,.90,"#486a61",fabric);
  box(sx+1.24,.66,1.49,1.175,.22,.91,"#729182",fabric);
  box(sx-1.47,.997,sz+.004,.60,.58,.18,"#c48059",{rz:.17,rx:-.17,mat:"fabric"});
  box(sx+.98,1.01,sz-.025,.55,.53,.18,"#d9c8a7",{rz:-.16,rx:-.14,mat:"fabric"});
  box(sx+1.25,.785,1.42,1.13,.054,.49,"#bea783",fabric);
  for(const z of [1.27,1.31,1.51]) box(sx+1.25,.819,z,1.12,.012,.022,"#7f8270",fabric);
  // Solid oval oak coffee table and tripod base.
  const tx=2.74,tz=2.33;
  for(const x of [-.59,.59]) for(const z of [-.29,.29])
    rod([tx+x*.86,.56,tz+z*.85],[tx+x*1.1,.075,tz+z*1.1],.054,"#73513b",wood);
  box(tx,.58,tz,1.85,.135,.94,"#a57b51",wood);
  box(tx,.659,tz,1.87,.04,.96,"#b58c62",wood);
  book(tx-.38,.687,tz-.06,.55,.06,.42,"#496d6a",.10);
  book(tx-.38,.751,tz-.06,.48,.047,.35,"#cf996d",-.08);
  cyl(tx+.49,.705,tz+.13,.16,.16,.028,14,"#7c6650",wood);
  cup(tx+.49,.721,tz+.13,.72);
  ceramic(tx+.12,.686,tz-.17,.40,"#d3c4a8");
  // Corner lamp, reading chair and the loft's larger specimens.
  const lx=5.70,lz=-.89;
  cyl(lx,.075,lz,.27,.30,.13,18,"#777367",metal);
  cyl(lx,1.057,lz,.028,.032,1.89,12,brass,metal);
  cyl(lx,2.02,lz,.28,.45,.49,20,"#e0b784",{glow:.59});
  cyl(lx,1.777,lz,.414,.414,.012,18,"#ffda9c",amber);
  plant(5.72,.02,-3.97,1.09,"#c0a087");
  plant(-5.66,.01,.33,.91,"#ad7856");
  plant(-5.46,.01,4.02,.65,"#9eaa9a",true);
  // A single reading chair and little drinks table in the listening corner.
  const ax=-3.84,az=2.20;
  legs(ax,az,.79,.72,.01,.44,.085,walnut);
  box(ax,.46,az,1.0,.19,.95,"#916d4b",wood);
  box(ax,.61,az+.05,.93,.22,.90,"#c69059",fabric);
  box(ax,.95,az-.40,.98,.69,.16,"#b17a4b",fabric);
  for(const s of [-1,1]) {
    box(ax+s*.51,.66,az,.073,.41,.073,"#7e583c",wood);
    box(ax+s*.51,.85,az,.114,.09,.86,"#9d714b",wood);
  }
  cyl(-2.83,.068,1.85,.25,.30,.10,14,"#555a55",metal);
  cyl(-2.83,.36,1.85,.043,.043,.52,10,brass,metal);
  cyl(-2.83,.65,1.85,.37,.36,.076,20,"#af895f",wood);
  book(-2.86,.691,1.82,.31,.041,.24,"#567572",.13);
}
