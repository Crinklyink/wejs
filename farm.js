// All farm geometry is built in metres, with the soil surface at y = 0.
function buildFarm(g, plots, story = {}) {
  const box = (...args) => g.box(...args);
  const cyl = (...args) => g.cyl(...args);
  const ball = (...args) => g.ball(...args);
  const beam = (...args) => g.beam(...args);
  const wood = { mat: 'wood' };
  const stone = { mat: 'stone' };
  const metal = { mat: 'metal' };
  const tau = Math.PI * 2;
  let scenerySeed = 578903;
  function random() {
    scenerySeed = (Math.imul(1664525, scenerySeed) + 1013904223) >>> 0;
    return scenerySeed / 4294967296;
  }
  const between = (a, b) => a + (b - a) * random();
  const pick = values => values[Math.floor(random() * values.length)];

  const grassMat = { mat: 'grass' }, leafMat = { mat: 'leaf' };
  const soilMat = { mat: 'soil' }, barkMat = { mat: 'bark' }, gravel = { mat: 'gravel' };
  const foliage = ['#52663a','#627544','#707d49','#7e8952','#879055','#5c6e40'];
  const bark = ['#645747','#746450','#79664e'];
  const lerp = (a,b,t) => a+(b-a)*t;

  // Four-point curved blades and diamond-shaped leaves hold their silhouettes at eye level.
  // The upward-biased normals represent transmitted light from the two sides of a leaf.
  function grassBlade(x,y,z,a,h,reach,w,color) {
    const dx=Math.cos(a), dz=Math.sin(a), sx=-dz*w, sz=dx*w;
    const p=[x-sx,y,z-sz], q=[x+sx,y,z+sz];
    const r=[x+dx*reach*.30+sx*.60,y+h*.66,z+dz*reach*.30+sz*.60];
    const s=[x+dx*reach*.30-sx*.60,y+h*.66,z+dz*reach*.30-sz*.60];
    g.polygon([p,q,r,s],color,grassMat,[dx*.44,.895,dz*.44]);
    g.polygon([s,r,[x+dx*reach,y+h,z+dz*reach]],color,grassMat,[dx*.30,.954,dz*.30]);
  }
  function leaf(x,y,z,a,len,w,rise,camber,color) {
    const dx=Math.cos(a),dz=Math.sin(a),sx=-dz*w,sz=dx*w;
    const p=[x,y,z], m=[x+dx*len*.47,y+rise*.50+camber,z+dz*len*.47];
    const l=[m[0]+sx,m[1]-w*.30,m[2]+sz], r=[m[0]-sx,m[1]-w*.30,m[2]-sz];
    const tip=[x+dx*len,y+rise,z+dz*len];
    g.polygon([p,l,m],color,leafMat,[dz*.35,.935,-dx*.35]);
    g.polygon([p,m,r],color,leafMat,[-dz*.35,.935,dx*.35]);
    g.polygon([m,l,tip],color,leafMat,[dz*.30,.95,-dx*.30]);
    g.polygon([r,m,tip],color,leafMat,[-dz*.30,.95,dx*.30]);
  }
  function surface(rows,cols,fn,color,material) {
    if (g.surface) { g.surface(rows,cols,fn,color,material); return; }
    // Lightweight generators and CPU-only previews use the same continuous mesh.
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      g.polygon([fn(i/cols,j/rows),fn(i/cols,(j+1)/rows),
        fn((i+1)/cols,(j+1)/rows),fn((i+1)/cols,j/rows)],color,material);
    }
  }
  function terrestrialHeight(x,z) {
    const dist=Math.hypot(Math.max(0,Math.abs(x)-15.5),Math.max(0,Math.abs(z)-13.5));
    const fade=Math.min(1,dist/35), away=fade*fade*(3-2*fade);
    return away*(3.0+4.7*Math.sin(x*.045+z*.041)+3.1*Math.cos(z*.094-x*.021)
      +1.8*Math.sin(x*.126+z*.058)+3.6*Math.cos(z*.035-.7))+Math.min(12,dist*.09)*away-.014;
  }
  function countryside() {
    // One continuous height field. The central 31 x 27 m yard is level with the playable floor.
    const fieldTones=['#858869','#888c69','#8c8d68','#8a8b64','#8a916b','#91916c'];
    for(let iz=-4;iz<4;iz++) for(let ix=-4;ix<4;ix++) {
      const color=(ix===-1||ix===0)&&(iz===-1||iz===0) ? '#889069' : pick(fieldTones);
      surface(8,8,(u,v)=>{
        const x=(ix+u)*26,z=(iz+v)*26;
        return [x,terrestrialHeight(x,z),z];
      },color,grassMat);
    }
    // Hedges and woodlots follow the contour. Each tree is a trunk with branching sprays.
    // Ground-level close-ups use the orchard models below; distant branches form the horizon.
    for(let i=0;i<95;i++) {
      const a=between(0,tau),r=i<65?between(24,41):between(42,86);
      const x=Math.cos(a)*r,z=Math.sin(a)*r*.86,h=between(3.8,7.9),y=terrestrialHeight(x,z);
      woodlandTree(x,y,z,h);
    }
    // A neighbouring farmhouse, outbuilding and cylindrical grain silo across the pasture.
    function distantHouse(x,z,w,d,wall,roof) {
      const y=terrestrialHeight(x,z),h=w*.52,slope=.53;
      box(x,y+h*.50,z,w,h,d,wall,{mat:'plaster'});
      for(const sign of [-1,1]){
        box(x+sign*w*.244,y+h+w*.126,z,w*.57,.13,d+.46,roof,{rz:-sign*slope,mat:'metal'});
        g.polygon([[x-w*.5,y+h,z+sign*d*.5],[x+w*.5,y+h,z+sign*d*.5],
          [x,y+h+w*.28,z+sign*d*.5]],wall,{mat:'plaster'});
      }
      for(let i=-1;i<=1;i++)box(x+i*w*.30,y+h*.54,z+d*.501,.47,.76,.08,'#59635b');
      box(x+w*.33,y+h+.72,z-.95,.46,1.65,.55,'#927c65',stone);
    }
    distantHouse(-20,-22,5.4,7.8,'#c7b9a0','#69685b');
    distantHouse(27,-16,6.1,9.4,'#a88368','#6a6b61');
    const sy=terrestrialHeight(22,-17);
    cyl(22,sy+2.40,-17,1.47,1.5,4.8,24,'#a5aba1',metal);
    cyl(22,sy+5.17,-17,.15,1.56,.75,24,'#788078',metal);
    for(let i=0;i<11;i++)cyl(22,sy+.27+i*.40,-17,1.505,1.505,.044,24,'#838a7e',metal);
  }
  // A compressed crown has a shaded heart and a broken rim of little sprays.
  // The inexpensive overlapping leaves resolve the outline where light catches it.
  function crownClump(x,y,z,rx,ry,rz,palette,turn,near) {
    const sides=near?7:6, points=[];
    const source={mat:'canopy'};
    for(let j=0;j<3;j++) {
      const ring=[],v=(j-1)*.62,w=j===1?1:.76;
      for(let i=0;i<sides;i++) {
        const a=turn+(i+j*.34)*tau/sides,n=between(.83,1.13)*w;
        ring.push([x+Math.cos(a)*rx*n,y+ry*(v+between(-.18,.18)),z+Math.sin(a)*rz*n]);
      }
      points.push(ring);
    }
    for(let i=0;i<sides;i++){
      const next=(i+1)%sides, aa=turn+i*tau/sides;
      const dx=Math.cos(aa),dz=Math.sin(aa);
      g.polygon([[x,y-ry*.89,z],points[0][i],points[0][next]],palette[0],source,[dx*.57,.36,dz*.57]);
      g.polygon([points[0][i],points[1][i],points[1][next],points[0][next]],
        palette[i%3?1:0],source,[dx*.62,.56,dz*.62]);
      g.polygon([points[1][i],points[2][i],points[2][next],points[1][next]],
        palette[i%3===0?1:2],source,[dx*.64,.77,dz*.64]);
      g.polygon([points[2][i],[x,y+ry*(1+.05*Math.sin(turn)),z],points[2][next]],
        palette[2],source,[dx*.35,.91,dz*.35]);
    }
  }
  const canopyPalettes=[
    ['#39472e','#435533','#52643b','#687943','#7f9052'],
    ['#3c4930','#495a37','#596c40','#6c7c45','#859650'],
    ['#3c4e32','#475d3a','#596d40','#718249','#8c9a55'],
    ['#404a30','#4b5936','#5a693c','#718147','#8b9558']
  ];
  function woodlandTree(x,y,z,h) {
    const palette=pick(canopyPalettes),phase=random()*tau;
    const span=h*between(.32,.48);
    cyl(x,y+h*.235,z,h*.017,h*.036,h*.47,8,'#625b4c',barkMat);
    // Distinct low lateral boughs and a rounded leader form a broadleaf silhouette.
    for(let i=0;i<8;i++) {
      const a=phase+i*2.399,t=i/7;
      const r=span*(.78-.54*t)*between(.81,1.14);
      const cx=x+Math.cos(a)*r,cy=y+h*(.49+.40*t)+h*between(-.035,.035),cz=z+Math.sin(a)*r;
      if(i%2===0)beam([x,y+h*(.23+t*.36),z],[cx,cy,cz],h*.014,'#5c584a',barkMat);
      const rw=span*between(.36,.50),rh=rw*between(.76,1.08);
      crownClump(cx,cy,cz,rw,rh,rw*.97,palette,a,false);
      // Ragged, irregularly placed twigs and leaf sprays break up the edge of each lobe.
      for(let k=0;k<7;k++) {
        const b=a+k*2.399,ey=between(-.72,.86),rr=Math.sqrt(1-ey*ey);
        const xx=cx+Math.cos(b)*rw*rr, yy=cy+ey*rh, zz=cz+Math.sin(b)*rw*rr;
        const radius=rw*between(.23,.40);
        const l=[xx+Math.cos(b+.90)*radius,yy-radius*.47,zz+Math.sin(b+.90)*radius];
        const rgt=[xx+Math.cos(b-.90)*radius,yy-radius*.3,zz+Math.sin(b-.90)*radius];
        const tip=[xx+Math.cos(b)*radius*1.28,yy+radius*.69,zz+Math.sin(b)*radius*1.28];
        g.polygon([l,[xx,yy-radius*.7,zz],rgt,tip],palette[ey>0?3:1],leafMat,
          [Math.cos(b)*.60,.59+ey*.23,Math.sin(b)*.60]);
      }
    }
  }
  const laneCenter = z => -2.22-.44*Math.sin((z-2)*.25)+Math.max(0,z-3)*.15;
  function gravelTrack(points,half,color) {
    const left=[],right=[];
    for(let i=0;i<points.length;i++) {
      const [x,z]=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
      const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;
      const w=half*(1+.07*Math.sin(i*1.37));
      left.push([x-dz/len*w,.007,z+dx/len*w]);
      right.push([x+dz/len*w,.007,z-dx/len*w]);
      if(i)g.polygon([left[i-1],left[i],right[i],right[i-1]],color,gravel,[0,1,0]);
    }
  }
  function yard() {
    const lane=Array.from({length:44},(_,i)=>{const z=-1.5+i*.39;return[laneCenter(z),z]});
    gravelTrack(lane,.77,'#a0977b');
    gravelTrack([[-4,-1.09],[-4,-.72],[-3.65,-.57],[-3.19,-.54],[-2.63,-.55],[-2.09,-.64]],.42,'#a0967e');
    gravelTrack([[-2.02,-.9],[-1,-.98],[0,-.96],[1.1,-1.03],[2.1,-.95],[3.3,-.98],[5,-1.23]],.33,'#a29b7f');
    gravelTrack([[-2,1.82],[-1,1.85],[0,1.82],[1.1,1.85],[2.1,1.83],[3.4,1.84],[4.65,1.8]],.29,'#a39a7c');
    gravelTrack([[1.60,-.96],[1.57,.02],[1.57,.87],[1.58,1.74],[1.61,2.73],[1.6,4.32]],.21,'#a39a7c');
    for(let i=0;i<560;i++) {
      const z=between(-.95,13.4),x=laneCenter(z)+between(-.83,.83),s=between(.009,.043);
      const a=random()*tau;
      g.polygon([[x-s,.014,z],[x-.28*s,.014,z+s*.68],[x+s,.014,z+.19*s],[x+.42*s,.014,z-s*.6]],
        pick(['#aaa18a','#928871','#b7af96','#9d967e']),gravel,[.07*Math.cos(a),.996,.07*Math.sin(a)]);
    }
    // Narrow areas of individual grass blades break the lawn/track boundary into tufts.
    for(let i=0;i<1950;i++){
      const x=between(-15.8,15.8),z=between(-13.5,13.5);
      if ((Math.abs(x)<6.85 && Math.abs(z)<4.65) || (x>6.25 && x<10.5 && z>-8.4 && z<-3.2) || (z>-.95 && Math.abs(x-laneCenter(z))<.86))continue;
      const h=between(.095,.29)*(.85+.22*Math.sin(x*.63+z*.73));
      tuft(x,z,h,4,i%11===0);
    }
    for(let i=0;i<200;i++){
      const z=between(.05,12.7),x=laneCenter(z)+(i%2?1:-1)*between(.77,1.04);
      tuft(x,z,between(.065,.135),3,false);
    }
  }
  function barn() {
    const x = -4.02, z = -2.69, half = 1.95, front = -1.215, back = -4.165;
    const eave = 2.27, shoulder = 3.29, ridge = 3.74, shoulderX = 1.23;
    box(x,.10,z,4.03,.22,3.07,'#81796b',stone);
    box(x,1.195,z,3.90,2.13,2.95,'#9c4037',wood);
    const reds = ['#885b4e','#885749','#94624f','#905d4e','#915a4c','#81574a','#8e604e'];
    const roofHeight = xx => xx < shoulderX ? ridge-(ridge-shoulder)*xx/shoulderX :
      shoulder-(shoulder-eave)*(xx-shoulderX)/(half-shoulderX);
    // Run continuous siding up through the gable so daylight never leaks through.
    for (let i=0; i<23; i++) {
      const dx = -half+(i+.5)*3.90/23;
      const h = roofHeight(Math.abs(dx)) - .14;
      for (const face of [front,back]) {
        box(x+dx, .14+h/2, face, .164, h,.07,reds[i%reds.length],wood);
        const outward=face===front?1:-1;
        box(x+dx-.079, .14+h/2, face+.038*outward,.026,h,.019,'#865044',wood);
        for(const yy of [.33,1.19,2.07]) {
          if(yy>h)continue;
          box(x+dx-.062,yy,face+.050*outward,.012,.012,.007,'#67564b',metal);
        }
        // Thin, tapered areas of worn paint catch the grain just above the splash line.
        for(let k=0;k<7;k++){
          const px=x+dx+between(-.068,.060),py=.15+between(.015,.28),len=between(.024,.164);
          const pz=face+.041*outward,wide=between(.0018,.0052);
          g.polygon([[px,py,pz],[px+wide,py+len*.29,pz],[px+wide*.32,py+len,pz],[px-wide*.42,py+len*.37,pz]],
            pick(['#94705a','#9a7963','#825a49','#846852']),wood,[0,0,outward]);
        }
        if(i%4===0){
          const px=x+dx+.037,py=.29+(i%6)*.25,pz=face+.041*outward;
          const edges=[];
          for(let n=0;n<10;n++){const t=n*tau/10;edges.push([px+.013*Math.cos(t),py+.032*Math.sin(t),pz]);}
          g.polygon(edges,'#794f42',wood,[0,0,outward]);
        }
        if(i%2===0) {
          const len=.10+(i%5)*.046;
          box(x+dx+.045,.23+len*.50,face+.038*outward,.009,len,.005,'#9b7d62',wood);
        }
      }
    }
    for(let i=0;i<17;i++) {
      const zz = back+(i+.5)*2.95/17;
      for(const sign of [-1,1]) {
        const side=x+sign*half;
        box(side,.14+(eave-.14)/2,zz,.072,eave-.14,.164,reds[(i+2)%reds.length],wood);
        box(side+sign*.037,1.21,zz+.075,.022,2.13,.028,'#875244',wood);
      }
    }
    function roofStrip(x1,y1,x2,y2) {
      const len=Math.hypot(x2-x1,y2-y1),tilt=Math.atan2(y2-y1,x2-x1);
      const nx=-(y2-y1)/len,ny=(x2-x1)/len,normal=[nx,ny,0];
      const at=(u,zz,offset)=>[x+lerp(x1,x2,u)+nx*offset,lerp(y1,y2,u)+ny*offset,z+zz];
      const depth=3.50, bays=11,pitch=depth/bays;
      box(x+(x1+x2)*.5,(y1+y2)*.5-.012,z,len+.010,.060,depth,'#584f40',{rz:tilt,mat:'wood'});
      // A folded seam has two raised cheeks, a rolled lip, and a shallow stiffener.
      // The pans span the slope continuously; grazing light reveals the metal profile.
      const section=[[0,.034],[.019,.033],[.037,.014],[.17,.014],[.19,.019],[.21,.014],
        [.48,.014],[.50,.018],[.52,.014],[.83,.014],[.86,.020],[.88,.014],[.957,.014],[.971,.048],[.992,.049],[1,.034]];
      const shades=['#63736f','#647671','#5b6d69','#6a7a73','#60716c'];
      for(let k=0;k<bays;k++){
        const zz=-depth*.5+k*pitch, shade=shades[(k*3)%shades.length];
        for(let n=1;n<section.length;n++) {
          const [a,ha]=section[n-1],[b,hb]=section[n],za=zz+a*pitch,zb=zz+b*pitch;
          const faceNormal=V3.unit([nx*(zb-za),ny*(zb-za),ha-hb]);
          g.polygon([at(0,za,ha),at(0,zb,hb),at(1,zb,hb),at(1,za,ha)],shade,metal,faceNormal);
        }
        if(k%2===0)for(const side of [-1,1]){
          const u=side<0?.155:.79;
          const left=at(u-.006,zz+pitch*.944,.021),right=at(u+.006,zz+pitch*.944,.021);
          g.polygon([left,at(u,zz+pitch*.925,.025),right,at(u,zz+pitch*.963,.025)],'#8e9387',metal,normal);
        }
      }
      for(const sign of [-1,1]){
        const zz=sign*(depth*.5+.002);
        box(x+(x1+x2)*.5,(y1+y2)*.5-.045,z+zz,len+.024,.103,.067,'#a29c82',{rz:tilt,mat:'wood'});
        g.polygon([at(0,zz-sign*.041,.052),at(0,zz+sign*.043,.052),at(1,zz+sign*.043,.052),at(1,zz-sign*.041,.052)],'#788078',metal,normal);
        g.polygon([at(0,zz+sign*.043,.052),at(0,zz+sign*.046,-.010),at(1,zz+sign*.046,-.010),at(1,zz+sign*.043,.052)],'#69726e',metal,[0,0,sign]);
      }
    }
    roofStrip(-2.12,2.12,-shoulderX,shoulder);
    roofStrip(-shoulderX,shoulder,0,ridge);
    roofStrip(0,ridge,shoulderX,shoulder);
    roofStrip(shoulderX,shoulder,2.12,2.12);
    // Ridge and shoulder flashing lap each roof break. The underside has rafter tails.
    for(const sign of [-1,1]){
      const pts=[[0,ridge+.09],[sign*.10,ridge+.06],[sign*.16,ridge+.018]];
      const knuckle=[[sign*(shoulderX-.095),shoulder+.076],[sign*shoulderX,shoulder+.058],
        [sign*(shoulderX+.075),shoulder-.054]];
      for(const profile of [pts,knuckle]) for(let k=1;k<profile.length;k++){
        const [ax,ay]=profile[k-1],[bx,by]=profile[k];
        g.polygon([[x+ax,ay,z-1.79],[x+bx,by,z-1.79],[x+bx,by,z+1.79],[x+ax,ay,z+1.79]],'#77827a',metal,[sign*.32,.95,0]);
      }
      for(let k=0;k<9;k++){
        const zz=z-1.56+k*.394;
        box(x+sign*1.992,2.19,zz,.287,.094,.072,'#83705a',{rz:-sign*.68,mat:'oak'});
        box(x+sign*2.083,2.111,zz,.097,.077,.081,'#978069',{rz:-sign*.68,mat:'oak'});
      }
    }
    const trim='#b1ad97';
    // Rolled eaves, downpipes, gutter brackets and lag screws remain legible from the doorway.
    for(const sign of [-1,1]) {
      const edge=x+sign*2.05,pipeZ=back+.28;
      beam([edge,2.18,z-1.68],[edge,2.18,z+1.68],.045,'#73766b',metal);
      beam([edge,2.18,pipeZ],[edge-sign*.083,1.93,pipeZ],.037,'#82857a',metal);
      beam([edge-sign*.083,1.93,pipeZ],[edge-sign*.083,.28,pipeZ],.036,'#85877a',metal);
      beam([edge-sign*.083,.28,pipeZ],[edge+sign*.047,.15,pipeZ],.037,'#7e8276',metal);
      for(const zz of [-3.92,-3.19,-2.47,-1.68])box(edge,2.154,zz,.116,.039,.033,'#565c54',metal);
      for(const yy of [.62,1.57])box(edge-sign*.083,yy,pipeZ,.09,.028,.09,'#63685c',metal);
    }
    for(const xx of [x-half+.035,x+half-.035]) {
      for(const zz of [front,back]) box(xx,1.22,zz,.138,2.18,.14,trim,wood);
    }
    box(x,.24,front+.044,3.94,.093,.10,'#a59c84',wood);
    // Recessed sliding doors, strap hinges, tracks and the hayloft cross-buck.
    box(x,.99,front+.070,2.02,1.91,.088,'#4e372e');
    for(const sign of [-1,1]) {
      const dx=x+sign*.465;
      box(dx,.983,front+.12,.90,1.77,.092,'#8a392e',wood);
      for(let i=0;i<6;i++) box(dx-.369+i*.147,.98,front+.176,.131,1.69,.036,reds[(i+1)%5],wood);
      for(const edge of [-.426,.426]) box(dx+edge,.98,front+.202,.075,1.78,.065,trim,wood);
      for(const yy of [.15,1.81]) box(dx,yy,front+.202,.87,.075,.065,trim,wood);
      box(dx,.983,front+.248, .091,1.71,.045,trim,{rz:-.465,mat:'wood'});
      box(dx,.983,front+.248,.091,1.71,.045,trim,{rz:.465,mat:'wood'});
      for(const yy of [.46,1.55]){
        box(dx+sign*.255,yy,front+.244,.31,.043,.026,'#555950',metal);
        for(const off of [-.095,.095])ball(dx+sign*.255+off,yy,front+.264,.017,.017,.009,'#96968a',metal);
      }
      box(x+sign*.126,1.00,front+.278,.046,.19,.045,'#494a40',metal);
    }
    // Steel track extends past the opening so both leaves could slide clear.
    for(const [yy,ww,dd] of [[2.017,3.78,.043],[2.054,3.80,.079],[1.982,3.79,.084]])
      box(x,yy,front+.190,ww,.027,dd,'#585e56',metal);
    function faceBolt(xx,yy,zz,r) {
      cyl(xx,yy,zz,r,r,.012,6,'#909184',{rx:Math.PI*.5,mat:'metal'});
    }
    for(const off of [-1.77,-1.18,-.59,0,.59,1.18,1.77]){
      box(x+off,2.015,front+.120,.049,.16,.084,'#68695d',metal);
      faceBolt(x+off,2.082,front+.166,.014);
    }
    for(const xx of [-.79,-.19,.19,.79]){
      box(x+xx,1.906,front+.248,.061,.245,.021,'#66675a',metal);
      cyl(x+xx,2.049,front+.228,.047,.047,.048,14,'#444b44',{rx:Math.PI*.5,mat:'metal'});
      cyl(x+xx,2.049,front+.251,.027,.027,.012,12,'#777c6d',{rx:Math.PI*.5,mat:'metal'});
      faceBolt(x+xx,1.843,front+.265,.014);
    }
    // The hasp and drop-pin sit between a pair of U-shaped, worn door pulls.
    for(const sign of [-1,1]) {
      const xx=x+sign*.123,pz=front+.310;
      for(const yy of [.908,1.056]){
        box(xx,yy,front+.275,.052,.051,.019,'#77776a',metal);
        beam([xx,yy,front+.280],[xx,yy,pz+.024],.011,'#6a6d61',metal);
      }
      beam([xx,.910,pz+.024],[xx,1.055,pz+.024],.011,'#a4a494',metal);
    }
    box(x,.825,front+.282,.165,.039,.013,'#807b67',metal);
    beam([x+.026,.807,front+.307],[x+.026,.875,front+.307],.009,'#8b826b',metal);
    box(x,2.68,front+.078,.75,.71,.095,'#603e32');
    box(x,2.68,front+.129,.60,.55,.068,'#af5947',wood);
    for(const xx of [-.357,.357]) box(x+xx,2.68,front+.175,.065,.69,.061,trim,wood);
    for(const yy of [2.37,2.99]) box(x,yy,front+.175,.77,.067,.061,trim,wood);
    beam([x-.285,2.44,front+.213],[x+.285,2.91,front+.213],.028,trim);
    beam([x+.285,2.44,front+.213],[x-.285,2.91,front+.213],.028,trim);
    for(const zz of [-3.53,-2.14]) {
      box(x+half+.06,1.41,zz,.12,.76,.95,trim,wood);
      box(x+half+.126,1.42,zz,.035,.59,.79,'#495d58');
      box(x+half+.145,1.42,zz,.004,.588,.787,'#87958a',{mat:'glass'});
      box(x+half+.145,1.42,zz,.042,.59,.040,trim);
      box(x+half+.146,1.42,zz,.042,.036,.79,trim);
      box(x+half+.125,1.00,zz,.19,.082,1.01,'#c0ae8d',wood);
    }
    box(x+1.42,1.73,front+.087,.19,.29,.11,'#4d4d42',metal);
    box(x+1.42,1.70,front+.19,.18,.21,.14,'#d8c9a7',{mat:'glass',glow:.12});
    for(const dx of [-.088,.088])for(const dz of [-.063,.063]){
      box(x+1.42+dx,1.70,front+.19+dz,.012,.22,.012,'#565b50',metal);
    }
    cyl(x+1.42,1.86,front+.18,.07,.18,.11,8,'#555e54',metal);
    // Roof lantern and a little iron weather vane.
    box(x,3.9,z-.36,.56,.43,.58,'#d6c6a5',wood);
    for(let i=0;i<4;i++) {
      box(x,3.78+i*.075,z-.054,.45,.031,.052,'#63716a',wood);
      box(x+.292,3.78+i*.075,z-.36,.052,.031,.46,'#63716a',wood);
    }
    cyl(x,4.21,z-.36,0,.485,.31,4,'#63756d',{ry:Math.PI/4,mat:'metal'});
    cyl(x,4.52,z-.36,.022,.03,.50,6,'#514e40',metal);
    beam([x-.30,4.63,z-.36],[x+.31,4.63,z-.36],.021,'#555344');
    box(x-.22,4.65,z-.36,.18,.12,.04,'#997e50',{rz:.15,mat:'metal'});
  }

  function fencePoint(x,z) {
    box(x,.47,z,.14,.94,.14,'#a0977e',wood);
    cyl(x,.966,z,0,.106,.077,4,'#a9a18a',{ry:Math.PI/4});
  }
  function fence(x1,z1,x2,z2,segments) {
    const dx=(x2-x1)/segments, dz=(z2-z1)/segments;
    for (let i=0;i<=segments;i++) {
      const x=x1+dx*i,z=z1+dz*i;
      fencePoint(x,z);
      if (i===segments) break;
      for(const y of [.36,.74]) {
        box(x+dx/2,y,z+dz/2,Math.hypot(dx,dz),.119,.075,'#adab91',
          {ry:-Math.atan2(dz,dx),mat:'wood'});
      }
    }
  }

  function pump(x,z) {
    const dark='#7e7660', light='#b2a58a', hub=3.35;
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      box(x+sx*.50,.079,z+sz*.50,.24,.16,.24,'#9e9981',stone);
      beam([x+sx*.5,.14,z+sz*.5],[x+sx*.14,hub,z+sz*.14],.052,dark,metal);
    }
    for(let j=0;j<3;j++) {
      const y0=.25+j*.90,y1=y0+.86,r0=.50-(y0-.1)*.11,r1=.50-(y1-.1)*.11;
      beam([x-r0,y0,z+r0],[x+r1,y1,z+r1],.025,light,metal);
      beam([x+r0,y0,z+r0],[x-r1,y1,z+r1],.025,light,metal);
      beam([x+r0,y0,z-r0],[x+r1,y1,z+r1],.025,light,metal);
      beam([x-r0,y0,z+r0],[x+r0,y0,z+r0],.03,dark,metal);
    }
    box(x,hub,z,.26,.26,.56,'#776953',metal);
    const rotorZ=z+.29,vanes=18,spin={mat:'windmill'};
    const wheelPoint=(angle,r,depth)=>[x+Math.cos(angle)*r,hub+Math.sin(angle)*r,rotorZ+depth];
    const plateShades=['#a1aba1','#aab3a6','#929e93','#a5aea1'];
    for(let i=0;i<vanes;i++) {
      const a=(i+.26)*tau/vanes,step=tau/vanes;
      // The blades are tapered sheet steel, rolled into a shallow scoop. Their
      // red witness stripe follows the curved sheet instead of floating above it.
      function vanePoint(u,r){
        const angle=a+(u-.5)*step*(.63+.21*r)+(.90-r)*.13;
        return wheelPoint(angle,r,.025+u*.059+.021*Math.sin(u*Math.PI)-r*.017);
      }
      const rings=[.47,.54,.79,.841,.902];
      for(let r=1;r<rings.length;r++)for(let k=0;k<4;k++){
        const u0=k*.25,u1=(k+1)*.25,lo=rings[r-1],hi=rings[r];
        g.polygon([vanePoint(u0,lo),vanePoint(u0,hi),vanePoint(u1,hi),vanePoint(u1,lo)],
          r===4?'#966b59':plateShades[i%4],spin);
      }
      for(const radius of [.47,.83]){
        beam(wheelPoint(a,radius,-.025),wheelPoint(a+step,radius,-.025),.009,'#717d72',spin);
      }
      if(i%3===0){
        for(const offset of [-.09,.09])beam(wheelPoint(a,.115,-.018),wheelPoint(a+offset,.83,-.025),.012,'#778274',spin);
      }
    }
    cyl(x,hub,rotorZ+.043,.110,.133,.108,16,'#82715c',{rx:Math.PI*.5,mat:'metal'});
    cyl(x,hub,rotorZ+.113,.044,.051,.034,8,'#a1967d',{rx:Math.PI*.5,mat:'metal'});
    for(const sx of [-1,1]) {
      box(x+sx*.118,hub,z-.012,.021,.243,.33,'#7e7f6c',metal);
      for(const yy of [-.083,.083])for(const zz of [-.11,.11]){
        cyl(x+sx*.136,hub+yy,z+zz,.012,.012,.020,6,'#a19880',{rz:Math.PI*.5,mat:'metal'});
      }
    }
    // The weather tail extends behind the wheel.
    beam([x,hub,z-.20],[x,hub+.03,z-1.02],.031,dark,metal);
    // Riveted fishtail weather vane balances the rotor; the pump rod descends into the platform.
    const tail=[[z-.46,hub+.02],[z-.80,hub+.18],[z-1.28,hub+.24],[z-1.18,hub+.03],[z-1.27,hub-.15],[z-.78,hub-.088]];
    g.polygon(tail.map(([zz,yy])=>[x,yy,zz]),'#a77861',metal,[1,0,0]);
    for(let j=0;j<tail.length;j++){
      const [zz,yy]=tail[j],[nz,ny]=tail[(j+1)%tail.length];
      beam([x,yy,zz],[x,ny,nz],.008,'#969783',metal);
    }
    beam([x+.027,.34,z+.025],[x+.027,hub-.15,z+.025],.016,'#756f5d',metal);
    for(let j=0;j<7;j++){
      const yy=.48+j*.35,dx=.50-(yy-.1)*.11;
      beam([x-dx,yy,z+dx],[x-dx,yy,z+dx-.19],.015,'#948b75',metal);
    }
    cyl(x-.16,.43,z-.12,.069,.10,.82,8,'#7a9287',metal);
    beam([x-.16,.78,z-.1],[x+.31,.78,z-.1],.065,'#829b8e',metal);
    beam([x+.31,.78,z-.1],[x+.31,.62,z-.1],.056,'#829b8e',metal);
  }

  // Each orchard leaf can hang from its petiole at a different pitch and roll.
  function orchardLeaf(x,y,z,a,len,width,pitch,roll,color) {
    const co=Math.cos(a),si=Math.sin(a),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const sideX=-si*Math.cos(roll)-co*sp*Math.sin(roll);
    const sideY=cp*Math.sin(roll), sideZ=co*Math.cos(roll)-si*sp*Math.sin(roll);
    const mid=[x+co*cp*len*.46,y+sp*len*.46+len*.055,z+si*cp*len*.46];
    const left=[mid[0]+sideX*width,mid[1]+sideY*width,mid[2]+sideZ*width];
    const right=[mid[0]-sideX*width,mid[1]-sideY*width,mid[2]-sideZ*width];
    const tip=[x+co*cp*len,y+sp*len-len*.035,z+si*cp*len];
    const normal=[-co*sp*Math.cos(roll)-si*Math.sin(roll),Math.max(.11,cp*Math.cos(roll)), -si*sp*Math.cos(roll)+co*Math.sin(roll)];
    g.polygon([[x,y,z],left,tip],color,leafMat,normal);
    g.polygon([[x,y,z],tip,right],color,leafMat,[normal[0]+si*.14,normal[1]*.92,normal[2]-co*.14]);
  }
  function tree(x,z,scale,fruit) {
    const base=terrestrialHeight(x,z),h=scale*3.17,phase=random()*tau;
    const palette=pick(canopyPalettes);
    function limb(p,q,r) {
      const shade=pick(bark);
      if(r<h*.009){beam(p,q,r,shade,barkMat);return;}
      // Curved, tapering growth with a slightly fluted base. A shared ring normal
      // keeps the silhouette round as the player walks around the trunk.
      const direction=V3.unit(V3.sub(q,p));
      const radial=V3.unit(V3.cross(direction,Math.abs(direction[1])>.9?[1,0,0]:[0,1,0]));
      const tangent=V3.cross(radial,direction);
      const phase=p[0]*1.92+p[2]*.7,wide=r>h*.02,segments=wide?11:8,rings=wide?5:3;
      surface(rings,segments,(u,v)=>{
        const ang=u*tau,cs=Math.cos(ang),sn=Math.sin(ang);
        const radius=r*lerp(1.27,.74,v)*(1+.064*Math.sin(ang*5+v*1.47+phase));
        const sway=r*.73*Math.sin(v*Math.PI)*Math.cos(phase);
        const core=p.map((n,k)=>lerp(n,q[k],v)+radial[k]*sway);
        return core.map((n,k)=>n+(radial[k]*cs+tangent[k]*sn)*radius);
      },shade,barkMat);
    }
    const root=[x,base,z],mid=[x+.054*h,base+h*.245,z-.027*h],high=[x+.021*h,base+h*.51,z+.032*h];
    limb(root,mid,h*.031);limb(mid,high,h*.024);
    for(let i=0;i<6;i++) {
      const a=i*1.03+phase;
      limb([x+Math.cos(a)*h*.007,base+h*.051,z+Math.sin(a)*h*.007],
        [x+Math.cos(a)*h*.082,base+.004,z+Math.sin(a)*h*.082],h*.010);
    }
    for(let i=0;i<11;i++){
      const t=i/10,a=phase+i*2.399+between(-.21,.21),dx=Math.cos(a),dz=Math.sin(a);
      const radius=h*(.33-.18*t)*between(.88,1.18),tier=base+h*(.42+.47*t)+h*between(-.047,.047);
      const joint=[x+dx*radius*.47,base+h*(.30+.29*t),z+dz*radius*.47];
      const crown=[x+dx*radius,tier,z+dz*radius];
      const stem=[mid[0]*(1-t)+high[0]*t,mid[1]*(1-t)+high[1]*t,mid[2]*(1-t)+high[2]*t];
      limb(stem,joint,h*(.016-.006*t));limb(joint,crown,h*(.011-.003*t));
      // Sprays fill the volume above, beneath and inside the limb, not just its tip.
      for(let j=0;j<4;j++) {
        const b=a+(j-1.45)*1.18+between(-.25,.25),reach=h*between(.065,.157);
        const cy=crown[1]+h*(j%3===0?between(-.08,-.015):between(.016,.103));
        const cx=crown[0]+Math.cos(b)*reach,cz=crown[2]+Math.sin(b)*reach;
        limb(crown,[cx,cy,cz],h*.0049);
        const w=h*between(.070,.111),hh=w*between(.64,1.01);
        crownClump(cx,cy,cz,w*.51,hh*.49,w*.53,palette,b,true);
        // A spherical distribution avoids horizontal layers and leaves small windows in the crown.
        const sprayLeaves=69;
        for(let k=0;k<sprayLeaves;k++){
          const az=b+k*2.399+between(-.25,.25),e=1-2*(k+.5)/sprayLeaves;
          const rad=Math.sqrt(Math.max(0,1-e*e)),rr=between(.45,1.14);
          const xx=cx+Math.cos(az)*rad*w*rr,yy=cy+e*hh*rr,zz=cz+Math.sin(az)*rad*w*rr;
          const pitch=between(-1.02,.64)+e*.18, ln=h*between(.036,.072);
          const idx=e<-.45 ? (k%3?1:2) : e>.32 ? (k%4?3:4) : (k%3?2:3);
          orchardLeaf(xx,yy,zz,az+between(-.88,.88),ln,ln*between(.19,.32),pitch,between(-1.04,1.04),palette[idx]);
        }
        if(fruit && j===1 && i%2===0) {
          const size=between(.084,.113)*scale,yy=cy-hh*.71;
          beam([cx,yy+size*.09,cz],[cx,yy-size*.33,cz],.004*scale,'#756548',barkMat);
          ball(cx,yy-size*.63,cz,size,size*.95,size,fruit,leafMat);
        }
      }
    }
    if(fruit)for(let i=0;i<27;i++) {
      const xx=x+between(-1.10,1.10)*scale,zz=z+between(-1.07,1.07)*scale;
      orchardLeaf(xx,.014,zz,random()*tau,between(.057,.112),.021,.02,between(-.32,.32),
        pick(['#99815c','#8d7b57','#92835a','#a28b62']));
    }
  }
  function crate(x,z,scale,filled) {
    const w=.66*scale,d=.48*scale,h=.39*scale;
    box(x,.066*scale,z,w,.12*scale,d,'#785c43',wood);
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      box(x+sx*(w*.5-.03),h*.57,z+sz*(d*.5-.03),.055*scale,h,.055*scale,'#9b7953',wood);
    }
    for(let i=0;i<3;i++) {
      const y=(.11+i*.114)*scale;
      for(const sx of [-1,1]) box(x+sx*w/2,y,z,.046*scale,.088*scale,d,'#ab8053',wood);
      for(const sz of [-1,1]) box(x,y,z+sz*d/2,w,.088*scale,.046*scale,'#c09561',wood);
    }
    if (filled) for(let i=0;i<6;i++) {
      ball(x+((i%3)-1)*.168*scale,(.34+(i%2)*.025)*scale,z+(Math.floor(i/3)-.5)*.19*scale,
        .181*scale,.15*scale,.165*scale,i%3?'#c98341':'#a8573b');
    }
  }

  function hay(x,y,z,w,d,h) {
    const tones=['#aa915c','#ba9e61','#c4ad74','#a68f5e','#b69b65'];
    if(g.roundBox)g.roundBox(x,y+h*.5,z,w,h,d,.038,'#b39b67',{mat:'fabric'});
    else box(x,y+h*.5,z,w,h,d,'#b39b67',{mat:'fabric'});
    for(const sign of [-1,1]) {
      const xx=x+sign*w*.23;
      beam([xx,y+.012,z+d*.502],[xx+.004,y+h-.02,z+d*.502],.005,'#877552',wood);
      beam([xx+.004,y+h-.013,z+d*.49],[xx-.008,y+h-.013,z-d*.49],.006,'#877552',wood);
    }
    // Broken ends protrude irregularly at the corners. The strands run in different
    // directions on the cut ends, compressed side faces and exposed top surface.
    for(let i=0;i<245;i++){
      const tone=pick(tones),xx=x+between(-.48,.46)*w,yy=y+between(.025,.97)*h,sign=i%2?1:-1;
      const len=between(.035,.13),thin=between(.0008,.0025);
      if(i%4===0) {
        const zz=z+between(-.46,.46)*d;
        g.polygon([[xx,y+h+.003,zz],[xx+len,y+h+.012,zz+.012],[xx+len,y+h+.013,zz+.012+thin]],tone,wood,[0,1,0]);
      } else if(i%4===1){
        const zz=z+between(-.47,.47)*d,xe=x+sign*(w*.496+between(.002,.008));
        g.polygon([[xe,yy,zz],[xe+.014*sign,yy+len*.24,zz+thin],[xe+.012*sign,yy+len*.24+thin,zz-thin]],tone,wood,[sign,.1,.1]);
      } else {
        const zz=z+sign*(d*.495+between(.002,.008));
        g.polygon([[xx,yy,zz],[xx+len,yy+.012,zz+.008*sign],[xx+len*.89,yy+.012+thin,zz+.007*sign]],tone,wood,[0,.13,sign]);
      }
    }
  }
  function tomato(x,y,z,r,angle,color) {
    // Lobed shoulders, sloping sides, and the shallow depression around the calyx.
    const sides=10, rings=[], normals=[];
    for(const b of [-1.09,-.37,.36,1.04]){
      const row=[],ns=[],cb=Math.cos(b),sb=Math.sin(b);
      for(let k=0;k<sides;k++){
        const a=k*tau/sides,rib=1+.080*Math.cos(5*a+angle)*(.51+.49*Math.abs(sb));
        row.push([x+r*cb*Math.cos(a)*rib,y+r*(sb*.87-.15*Math.max(0,sb)**8),z+r*cb*Math.sin(a)*rib]);
        ns.push(V3.unit([cb*Math.cos(a),sb*1.12,cb*Math.sin(a)]));
      }
      rings.push(row);normals.push(ns);
    }
    for(let k=0;k<sides;k++){
      const next=(k+1)%sides;
      g.polygon([[x,y-r*.87,z],rings[0][k],rings[0][next]],color,leafMat,[0,-1,0]);
      g.polygon([rings[3][k],[x,y+r*.72,z],rings[3][next]],color,leafMat,[0,1,0]);
      for(let j=0;j<3;j++){
        const verts=[rings[j][k],rings[j+1][k],rings[j+1][next],rings[j][next]];
        const ns=[normals[j][k],normals[j+1][k],normals[j+1][next],normals[j][next]];
        if(g.smoothFace)g.smoothFace(...verts,ns,color,leafMat);
        else g.polygon(verts,color,leafMat);
      }
    }
    for(let k=0;k<5;k++){
      const a=angle+k*tau/5;
      leaf(x,y+r*.76,z,a,r*.72,r*.094,-r*.14,r*.12,'#5c6e41');
    }
  }
  function plant(x,y,z,crop,stage,variant) {
    const ready=stage==='ready',wet=stage==='watered';
    const rotation=variant*2.399;
    if (crop === 'corn') {
      const h=(ready ? 1.49 : wet ? .52 : .18)*(.94+.075*Math.sin(rotation));
      const rad=ready ? .026 : wet ? .017 : .008;
      cyl(x,y+h*.49,z,rad*.52,rad,h*.98,9,'#879058',leafMat);
      if(ready)for(let k=1;k<=4;k++){
        const t=k*.173+.035,rr=rad*(.99-.43*t);
        cyl(x,y+h*t,z,rr*.98,rr*1.11,h*.015,8,'#9b9f68',leafMat);
      }
      const n=ready ? 9 : wet ? 5 : 3;
      for(let i=0;i<n;i++) {
        const t=i/(n+1),a=rotation+i*2.62;
        const reach=h*(.24+.23*Math.sin((t+.1)*Math.PI))*(.9+.12*Math.cos(rotation+i));
        const yy=y+h*(.16+t*.75),dx=Math.cos(a),dz=Math.sin(a);
        const width=(.024+.035*Math.sin(Math.PI*t))*h;
        // Parallel veins and drooping pointed tip of the blade.
        let last;
        for(let k=0;k<=6;k++) {
          const u=k/6,w=width*(u===1?.012:.17+.83*Math.sin(Math.PI*u)**.83);
          const v=yy+reach*(.42*Math.sin(u*Math.PI)-.11*u);
          const xx=x+dx*u*reach,zz=z+dz*u*reach;
          const line=[[xx-dz*w,v-w*.24,zz+dx*w],[xx,v+.008,zz],[xx+dz*w,v-w*.26,zz-dx*w]];
          if(last) {
            g.polygon([last[0],last[1],line[1],line[0]],'#76804b',leafMat,[-dz*.31,.95,dx*.31]);
            g.polygon([last[1],last[2],line[2],line[1]],'#7d8a51',leafMat,[dz*.31,.95,-dx*.31]);
          }
          last=line;
        }
      }
      if(ready) {
        const a=rotation+.48,dx=Math.cos(a),dz=Math.sin(a);
        const ex=x+dx*.042,ez=z+dz*.042;
        const earY=y+h*.575, earH=h*.168, earR=.039, earTilt=.048;
        surface(6,10,(u,v)=>{
          const ang=u*tau,skin=Math.pow(Math.max(.001,Math.sin(Math.PI*v)),.55);
          const grain=1+.047*Math.cos(ang*10+v*.31);
          return [ex+earTilt*dx*v+Math.cos(ang)*earR*skin*grain,
            earY+v*earH,ez+earTilt*dz*v+Math.sin(ang)*earR*skin*grain];
        },'#c2a663',leafMat);
        for(let k=0;k<3;k++){
          const aa=a+(k-1)*.75;
          leaf(ex+Math.cos(aa)*.019,earY+.003,ez+Math.sin(aa)*.019,aa,.067,.037,earH*(.76+.07*k),.062,'#899457');
        }
        // Branched pollen tassels with fine dangling anthers at the stem tips.
        for(let k=0;k<5;k++){
          const aa=a+k*tau/5,xx=x+Math.cos(aa)*.099,zz=z+Math.sin(aa)*.099;
          const tipY=y+h+.078+.023*(k%2);
          beam([x,y+h*.934,z],[xx,tipY,zz],.0045,'#b4a06c');
          for(let n=1;n<4;n++){
            const t=n/4,tx=lerp(x,xx,t),ty=lerp(y+h*.934,tipY,t),tz=lerp(z,zz,t);
            g.polygon([[tx,ty,tz],[tx+.004,ty-.025,tz+.008],[tx+.009,ty-.015,tz+.013]],
              '#c6ac6b',leafMat,[dx*.3,.85,dz*.3]);
          }
        }
      }
    } else if(crop==='tomato') {
      const h=(ready ? .70 : wet ? .33 : .14)*(.95+.07*Math.cos(rotation));
      beam([x,y,z],[x+.035*h,y+h,z],h*.015,'#74844f',leafMat);
      if(ready){
        cyl(x-.04,y+h*.58,z-.02,.012,.014,h*1.16,7,'#998365',wood);
        for(const t of [.42,.74]) {
          box(x-.016,y+h*t,z-.007,.075,.012,.026,'#8c8765',{ry:rotation});
        }
      }
      const fronds=ready ? 7 : 4;
      for(let i=0;i<fronds;i++){
        const a=rotation+i*2.38,dx=Math.cos(a),dz=Math.sin(a),len=h*(.23+.12*Math.sin((i+.4)/fronds*Math.PI));
        const yy=y+h*(.18+(i/fronds)*.76),tx=x+dx*len,tz=z+dz*len;
        beam([x,yy,z],[tx,yy+len*.22,tz],h*.008,'#75814b',leafMat);
        for(let k=1;k<=3;k++) {
          const t=k/3.4,xx=lerp(x,tx,t),zz=lerp(z,tz,t),v=yy+t*len*.22;
          for(const side of [-1,1]) {
            leaf(xx,v,zz,a+side*(1.07-.18*t),len*(.48-.22*t),len*.11,len*(.18-.30*t),
              len*.12,i%2?'#637b44':'#73854c');
          }
        }
        if(ready && i%2===0) {
          const diameter=h*between(.110,.154),cr=.5*diameter,fruitY=yy+len*.07;
          // The pedicel bends downward under the fruit's weight.
          const joint=[tx+dx*.012,fruitY+cr*1.21,tz+dz*.012];
          beam([lerp(x,tx,.86),yy+len*.20,lerp(z,tz,.86)],joint,h*.006,'#6b7849',leafMat);
          beam(joint,[tx,fruitY+cr*.72,tz],h*.007,'#6b7849',leafMat);
          tomato(tx,fruitY,tz,cr,a, i%4?'#aa4935':'#b6573a');
        }
      }
    } else {
      const h=ready ? .34 : wet ? .22 : .10;
      if(ready)surface(4,9,(u,v)=>{
        const a=tau*u,rr=.046*Math.sin((v*.95+.025)*Math.PI*.95)**.60;
        return[x+Math.cos(a)*rr,y-.027+.063*v,z+Math.sin(a)*rr];
      },'#b98350',soilMat);
      for(let i=0;i<(ready?7:4);i++) {
        const a=rotation+i*2.399,dx=Math.cos(a),dz=Math.sin(a);
        const rise=h*between(.58,1.0),reach=h*between(.29,.67),yy=y+.025;
        beam([x,yy,z],[x+dx*reach,yy+rise,z+dz*reach],h*.014,'#78905d',leafMat);
        for(let k=1;k<=4;k++){
          const t=k/4.5, cx=x+dx*reach*t,cz=z+dz*reach*t,cy=yy+rise*t;
          for(const side of [-1,1]){
            const aa=a+side*.91,dl=h*(.235-.122*t),ex=cx+Math.cos(aa)*dl,ez=cz+Math.sin(aa)*dl;
            // Finely divided carrot leaflets widen around the middle of each frond.
            leaf(cx,cy,cz,aa,dl,h*.011,h*.092,.004,i%2?'#6b8250':'#798d58');
            if(ready)for(const tipSide of [-1,1]){
              const bx=lerp(cx,ex,.59),bz=lerp(cz,ez,.59),end=aa+tipSide*.73,rad=dl*.48;
              g.polygon([[bx,cy+h*.037,bz],[bx+.003,cy+h*.052,bz+.002],
                [bx+Math.cos(end)*rad,cy+h*.124,bz+Math.sin(end)*rad]],
                i%2?'#71874f':'#7f9058',leafMat,[.11,.96,.15]);
            }
          }
        }
      }
    }
  }
  function plantingBed(x,z,plot) {
    const wet=plot.stage==='watered',color=wet?'#594d3e':'#70604b';
    box(x,.071,z,2.73,.142,1.90,'#827057',wood);
    box(x,.105,z,2.61,.10,1.79,color,soilMat);
    for(const side of [-1,1]){
      box(x+side*1.35,.105,z,.084,.168,1.98,'#968368',wood);
      box(x,.113,z+side*.94,2.79,.177,.078,'#9f8a6d',wood);
      for(const sx of [-1,1]) {
        box(x+sx*1.31,.14,z+side*.89,.092,.22,.077,'#89765a',wood);
        ball(x+sx*1.31,.15,z+side*.984,.022,.022,.009,'#68665a',metal);
      }
    }
    surface(44,12,(u,v)=>{
      const xx=(u-.5)*2.58,zz=(v-.5)*1.78;
      const ridge=Math.exp(-22*Math.sin(zz*Math.PI/.52)**2);
      return [x+xx,.155+ridge*.081+.005*Math.sin(xx*16+zz*15)+.006*Math.cos(xx*8-zz*28),z+zz];
    },color,soilMat);
    for(let i=0;i<50;i++){
      const xx=between(-1.19,1.19),zz=between(-.81,.81);
      const y=.163+.081*Math.exp(-22*Math.sin(zz*Math.PI/.52)**2);
      if(i%6===0) {
        leaf(x+xx,y+.006,z+zz,i*.89,between(.04,.079),.014,.004,.005,pick(['#988061','#877458','#a28a68']));
      }else{
        const r=between(.008,.028);
        g.polygon([[x+xx-r,y,z+zz],[x+xx,y+.006,z+zz+r*.70],[x+xx+r*1.3,y,z+zz],[x+xx,y,z+zz-r*.7]],
          wet?'#675747':'#84715a',soilMat,[0,1,0]);
      }
    }
    // Organic mulch, small soil clods and worn rim joints show the scale up close.
    for(let n=0;n<57;n++){
      const xx=x+between(-1.20,1.20),zz=z+between(-.80,.80),dx=xx-x,dz=zz-z;
      const ridge=Math.exp(-22*Math.sin(dz*Math.PI/.52)**2);
      const gy=.155+ridge*.081+.005*Math.sin(dx*16+dz*15)+.006*Math.cos(dx*8-dz*28);
      const r=between(.011,.035),a=n*2.399,ca=Math.cos(a),sa=Math.sin(a);
      const apex=[xx+.12*r,gy+r*.32,zz],base=[];
      for(let k=0;k<5;k++){
        const angle=k*tau/5;const u=Math.cos(angle)*r,v=Math.sin(angle)*r*.62;
        base.push([xx+u*ca-v*sa,gy-.003,zz+u*sa+v*ca]);
      }
      for(let k=0;k<5;k++)g.polygon([base[k],apex,base[(k+1)%5]],n%5?(wet?'#655541':'#827058'):'#979280',soilMat);
    }
    if(plot.stage==='empty'||!plot.stage)return;
    for(let row=0;row<3;row++)for(let col=0;col<5;col++) {
      const variant=5*row+col,xx=x+(col-2)*.478+.029*Math.sin(variant*2.39);
      const zz=z+(row-1)*.52+.023*Math.cos(variant*4.07);
      const dx=xx-x,dz=zz-z;
      const ridge=.155+.081*Math.exp(-22*Math.sin(dz*Math.PI/.52)**2);
      const ground=ridge+.005*Math.sin(dx*16+dz*15)+.006*Math.cos(dx*8-dz*28);
      plant(xx,ground-.009,zz,plot.crop,plot.stage,variant);
    }
  }
  function duck(x,z,a) {
    const dx=Math.cos(a),dz=Math.sin(a);
    const local=(f,side)=>[x+dx*f-dz*side,z+dz*f+dx*side];
    // A mallard floats low, with swept primaries over its tail and a dark, iridescent head.
    const oval=(f,side,y,w,h,d,color,opts={})=>{
      const [xx,zz]=local(f,side);ball(xx,y,zz,w,h,d,color,{ry:-a,...opts});
    };
    oval(0,0,.164,.40,.178,.201,'#8a8570');
    oval(.099,0,.183,.194,.183,.185,'#835d43');
    oval(.111,0,.248,.122,.121,.115,'#d6d2b5');
    oval(.136,0,.293,.142,.134,.128,'#536955');
    oval(.223,0,.279,.114,.033,.072,'#b4a161');
    for(const side of [-1,1]){
      oval(.156,.058*side,.308,.016,.015,.011,'#302e28');
      oval(-.039,.071*side,.204,.227,.102,.073,'#777663');
      oval(-.060,.092*side,.208,.093,.050,.017,'#4f6260');
      const [xx,zz]=local(-.059,.098*side);
      leaf(xx,.211,zz,a+Math.PI+.15*side,.205,.029,-.016,.009,'#686954');
      const [tx,tz]=local(-.16,.031*side);
      leaf(tx,.207,tz,a+Math.PI+.26*side,.123,.015,.013,.008,'#625f4e');
    }
  }
  function pond() {
    const x=5.70,z=.40;
    ball(x,.039,z,1.94,.166,2.20,'#9a9471');
    ball(x,.096,z,1.70,.078,1.94,'#657f70',{mat:'water'});
    for(let i=0;i<9;i++) {
      const a=i*tau/9;
      ball(x+Math.cos(a)*.89,.115,z+Math.sin(a)*1.0,.25,.175,.20,
        pick(['#aaa58b','#969680','#b5ac90']));
    }
    for(let i=0;i<6;i++){
      const xx=x+.60+i*.052,zz=z-.59+Math.sin(i)*.15,h=.34+(i%3)*.11;
      beam([xx,.10,zz],[xx+.035,h,zz+.02],.017,'#7c8b4c');
      cyl(xx+.035,h+.047,zz+.02,.022,.025,.129,6,'#935f40');
    }
    for(let i=0;i<4;i++) {
      box(x-.23+(i%2)*.34,.139,z-.39+i*.20,i%2?.18:.30,.008,.019,'#a1cfba');
    }
    duck(x+.10,z-.17,-.95);
  }

  function greenhouse(stage) {
    const x0=6.35,x1=9.68,peak=8.65,z0=-8.26,z1=-3.59,eave=2.06,ridge=3.01;
    const iron='#60675c', oak='#958166', aged='#86775f', glass={mat:'glass'};
    const roofHeight=x => x<peak ? eave+(ridge-eave)*(x-x0)/(peak-x0) : ridge-(ridge-eave)*(x-peak)/(x1-peak);
    const batten=(a,b,r,color=iron,opts=metal)=>beam(a,b,r,color,opts);
    function reflection(a,b,width) {
      const axis=[b[0]-a[0],b[1]-a[1],b[2]-a[2]];
      const lateral=Math.abs(axis[2])>.3?[width,0,0]:[0,0,width];
      const p=a.map((n,j)=>n+lateral[j]),q=b.map((n,j)=>n+lateral[j]);
      g.polygon([a,b,q,p],'#a3b4a4',glass,[.10,.91,.39]);
    }
    // Brick plinth, mortared footings and slate at the door.
    box((x0+x1)/2,.017,(z0+z1)/2,x1-x0,.065,z1-z0,'#988e75',gravel);
    for(const xx of [x0,x1]) {
      box(xx,.132,(z0+z1)/2,.153,.255,z1-z0+.17,'#8b735f',stone);
      for(let j=0;j<14;j++){
        for(let k=0;k<2;k++){
          const zz=z0+.17+j*.323+(k%2)*.075;
          if(zz>z1-.09)continue;
          box(xx,.062+k*.112,zz,.165,.095,.302,'#9b7b64',stone);
        }
      }
    }
    box(8.07,.012,-3.37,1.19,.075,.55,'#a09b85',stone);
    for(const xx of [x0,x1]) {
      box(xx,.34,(z0+z1)/2,.10,.23,z1-z0,aged,wood);
      for(const y of [.54,1.19,eave])box(xx,y,(z0+z1)/2,.061,.062,z1-z0+.04,iron,metal);
    }
    const sections=5, span=(z1-z0)/sections;
    for(let j=0;j<=sections;j++) {
      const zz=z0+j*span,damaged=stage===0&&(j===2||j===4);
      const tipX=x0+(damaged?.14:0),tipY=eave-(damaged?.17:0);
      batten([x0,.26,zz],[tipX,tipY,zz],.037,damaged?'#756b57':iron);
      batten([x1,.26,zz],[x1,eave,zz],.038);
      if(stage>0||j!==2){
        batten([tipX,tipY,zz],[peak,ridge,zz],.042);
        batten([peak,ridge,zz],[x1,eave,zz],.042);
      } else {
        batten([tipX,tipY,zz],[x0+.69,2.08,zz+.22],.034,'#786d57');
        batten([peak,ridge,zz],[x1,eave,zz],.039);
      }
      // Mortise knees carry each rafter onto its post. Patinated, bolted side plates
      // bridge the joint; no plates span the unrepaired missing roof bay.
      for(const side of [-1,1]){
        const ex=side<0?tipX:x1,ey=side<0?tipY:eave,ix=ex-side*.252;
        const plateZ=zz+.036,good=stage>0||j!==2;
        if(good||side>0){
          const iy=roofHeight(ix)-.065;
          batten([ex,ey-.31,zz],[ix,iy-.06,zz],.027,'#8e7d60',wood);
          const points=[[ex,ey-.126,plateZ],[ex,ey+.021,plateZ],[ix,iy+.085,plateZ],[ex-side*.078,ey-.048,plateZ]];
          g.polygon(points,'#74796b',metal,[0,0,1]);
          for(const [px,py] of [[ex,ey-.073],[ex-side*.10,ey+.014]]){
            cyl(px,py,plateZ+.008,.012,.012,.012,6,'#9b9c89',{rx:Math.PI*.5,mat:'metal'});
          }
        }
      }
      if(j===sections)break;
      const mid=zz+span*.5;
      // Individual panes are inset behind the muntins. Several pieces survive in the
      // ruined shell, while restoration fills the gaps with newly cut glass.
      for(const side of [-1,1]) {
        const wallX=side<0?x0:x1;
        const wNormal=[side,0,0],zA=zz+.044,zB=zz+span-.044;
        for(let halfPane=0;halfPane<2;halfPane++){
          const za=halfPane?mid+.012:zA,zb=halfPane?zB:mid-.012;
          for(let row=0;row<2;row++){
            const low=row?1.223:.565,hi=row?eave-.050:1.161;
            if(stage===0 && (j+row*3+halfPane+(side<0?0:2))%4===0)continue;
            const paneX=wallX+side*.010;
            g.polygon([[paneX,low,za],[paneX,hi,za],[paneX,hi,zb],[paneX,low,zb]],'#899f93',glass,wNormal);
          }
        }
        const r1=side<0?x0+.036:peak+.025, r2=side<0?peak-.023:x1-.034;
        const nz=V3.unit([roofHeight(r1)-roofHeight(r2),r2-r1,0]);
        if(stage>0||(j+(side>0?2:0))%3!==1){
          // The roof's middle section has a brass-hinged opening light with a prop.
          const vent=stage>0&&j===3&&side<0, hx=vent?lerp(r1,r2,.52):r1;
          const pane=(left,right,zA,zB,liftLeft=0)=>g.polygon([
            [left,roofHeight(left)+.015+liftLeft,zA],[left,roofHeight(left)+.015+liftLeft,zB],
            [right,roofHeight(right)+.015,zB],[right,roofHeight(right)+.015,zA]],
            '#a7b3a4',glass,nz);
          pane(r1,hx===r1?r2:hx,zA,zB);
          if(vent){
            pane(hx,r2,zA,zB,.17);
            batten([hx,roofHeight(hx)+.185,zA],[hx,roofHeight(hx)+.185,zB],.012,'#83897a');
            for(const vz of [zA,zB]){
              batten([hx,roofHeight(hx)+.183,vz],[r2,roofHeight(r2)+.023,vz],.011,'#7d8376');
              batten([hx-.052,roofHeight(hx)-.015,vz],[hx+.063,roofHeight(hx)+.155,vz],.008,'#9e936c',{mat:'brass'});
            }
          }
        }
      }
      // Glazing bars and the rebated edge of the panes catch a narrow sky reflection.
      if(stage>0||j%3!==1) {
        for(const xx of [x0,x1]){
          batten([xx,.49,mid],[xx,eave,mid],.011,'#7b8275');
          reflection([xx+.004,.59,zz+.13],[xx+.004,1.08,zz+.36],.014);
          batten([xx,1.97,zz+.027],[xx,1.97,zz+span-.027],.010,'#a5afa1',glass);
        }
        for(const xx of [x0+.85,peak+.38]){
          batten([xx,roofHeight(xx),zz],[xx,roofHeight(xx),zz+span],.014,'#8d9689');
          reflection([xx,roofHeight(xx)+.009,zz+.10],[xx+.16,roofHeight(xx+.16)+.009,zz+.35],.018);
        }
      }
    }
    batten([peak,ridge,z0-.08],[peak,ridge,z1+.08],.049,'#777d6e');
    // Asymmetric pitched end walls; central doorway opens into the glasshouse.
    for(const endZ of [z0,z1]) {
      for(const xx of [x0,x0+.60,7.51,8.57,9.10,x1]) {
        const doorPost=Math.abs(xx-7.51)<.011||Math.abs(xx-8.57)<.011;
        batten([xx,.12,endZ],[xx,roofHeight(xx),endZ],doorPost?.047:.033,doorPost?oak:iron,doorPost?wood:metal);
      }
      box((x0+x1)/2,eave,endZ,x1-x0,.12,.099,oak,wood);
      for(const [left,right] of [[x0+.066,7.46],[8.62,x1-.065]]) {
        if(stage>0||endZ===z0) {
          const oz=endZ+.008, top=eave-.069;
          for(const [lo,hi] of [[.476,1.16],[1.225,top]]){
            g.polygon([[left,lo,oz],[right,lo,oz],[right,hi,oz],[left,hi,oz]],'#99ab9f',glass,[0,0,endZ===z0?-1:1]);
          }
        }
      }
      for(const [a,b] of [[x0,7.49],[8.60,x1]]) {
        box((a+b)/2,.34,endZ,b-a,.23,.093,aged,wood);
        box((a+b)/2,1.19,endZ,b-a,.049,.050,iron,metal);
      }
    }
    // Door is stood open against its right jamb, with a diagonal brace and turned latch.
    const hinge=[8.59,.11,z1],outer=[9.34,.11,z1+.55];
    for(const pt of [hinge,outer])batten(pt,[pt[0],1.90,pt[2]],.044,aged,wood);
    for(const y of [.17,1.09,1.87]){
      batten([hinge[0],y,hinge[2]],[outer[0],y,outer[2]],.039,oak,wood);
    }
    batten([hinge[0],.21,hinge[2]],[outer[0],1.05,outer[2]],.027,aged,wood);
    ball(outer[0]-.06,1.02,outer[2]+.021,.067,.041,.057,'#817957',{mat:'brass'});
    for(const yy of [.39,1.59]){
      cyl(hinge[0]+.026,yy,hinge[2]+.023,.018,.018,.106,10,'#8a8470',{mat:'brass'});
      box(hinge[0]-.028,yy,hinge[2]+.043,.08,.064,.014,'#7b7b67',metal);
    }
    // Worn slate flags follow the working aisle to the potting table.
    for(let k=0;k<7;k++){
      const xx=8.11+.034*Math.sin(k*3.0),zz=-3.92-k*.557,w=.31+.025*Math.cos(k);
      const corners=[[-w,-.203],[-w*.78,-.258],[w*.84,-.248],[w,-.135],[w*.89,.220],
        [-w*.71,.257],[-w,.138]].map(([dx,dz])=>[xx+dx,.055,zz+dz]);
      g.polygon(corners,k%2?'#9d9b88':'#8e9385',stone,[0,1,0]);
    }
    // June's envelope rests on the solid bench apron at the entry.
    box(7.12,.852,-3.40,.84,.085,.40,oak,wood);
    for(const xx of [6.80,7.43])for(const zz of [-3.53,-3.27]){
      box(xx,.43,zz,.055,.84,.057,aged,wood);
    }
    box(7.13,.908,-3.39,.28,.020,.187,'#e0d6b8',{ry:-.11,mat:'plain'});
    g.polygon([[6.997,.920,-3.466],[7.250,.920,-3.437],[7.114,.921,-3.357]],
      '#d0c5a3',{},[0,1,0]);
    cyl(7.117,.925,-3.36,.018,.020,.008,11,'#9b503d');
    for(let i=0;i<3;i++)box(7.20,.921,-3.378+i*.012,.039-i*.004,.002,.003,'#8f846c',{ry:-.11});
    // Interior potting table, terracotta nursery pots, trowel and soil tray.
    box(9.28,.84,-6.66,.57,.094,2.24,oak,wood);
    for(const xx of [9.07,9.48])for(const zz of [-7.62,-5.71]) {
      box(xx,.43,zz,.063,.82,.063,'#796a54',wood);
    }
    function pot(x,y,z,r,h,planted) {
      cyl(x,y+h*.5,z,r,r*.67,h,13,'#a77658',{mat:'plaster'});
      cyl(x,y+h*.92,z,r*1.09,r*1.07,h*.16,13,'#af8060',{mat:'plaster'});
      cyl(x,y+h*1.008,z,r*.91,r*.91,.008,13,'#655543',soilMat);
      if(planted) {
        for(let k=0;k<7;k++)leaf(x,y+h,z,k*2.39,r*1.05,r*.22,r*(.3+k*.12),r*.25,pick(foliage));
      }
    }
    for(let i=0;i<5;i++)pot(9.24,.889,-7.47+i*.34,.098,.164,i%2===0);
    box(9.27,.924,-5.87,.33,.071,.24,'#7f705b',wood);
    box(9.27,.965,-5.87,.29,.028,.20,'#685845',soilMat);
    for(let j=0;j<3;j++){
      const xx=7.12+j*.61;
      pot(xx,.047,-7.63,.238,.39,stage<3);
      if(stage>=3){
        plant(xx,.455,-7.63,'tomato','ready',j*5+2);
        for(let k=0;k<3;k++) {
          const bx=xx+.101*Math.cos(k*2.09),bz=-7.63+.11*Math.sin(k*2.09);
          for(let n=0;n<5;n++)leaf(bx,.86+k*.063,bz,n*tau/5,.025,.008,.006,.002,'#dfc478');
        }
      }
    }
    if(stage===0) {
      // Unfitted sheets stack against the wall. Each has its own intact glinting edge.
      for(let j=0;j<3;j++){
        const zz=-6.71+j*.061,left=x0-.29-j*.036,right=x0-.03;
        const a=[left,.075,zz],b=[right,1.03,zz],c=[right,1.03,zz+.61],d=[left,.075,zz+.61];
        for(const [p,q] of [[a,b],[b,c],[c,d],[d,a]])batten(p,q,.015,'#a1b0a2',glass);
        reflection(a,c,.027);
      }
      for(let i=0;i<4;i++)box(6.90+i*.09,.099+i*.034,-7.07,.079,.072,1.43,'#8b795e',{ry:.09*i,mat:'wood'});
    }
    if(stage>=2) {
      for(const zz of [-7.72,-6.92]) {
        cyl(10.10,.47,zz,.32,.295,.88,20,'#657d76',metal);
        for(const yy of [.16,.47,.76,.91])cyl(10.10,yy,zz,.326,.326,.024,20,'#84908a',metal);
        cyl(10.10,.932,zz,.305,.316,.022,20,'#7e8a7e',metal);
      }
      batten([x1,eave,z0],[x1,eave,z1],.049,'#7b8478');
      batten([x1,eave,-7.69],[10.10,1.77,-7.69],.047,'#809084');
      batten([10.10,1.77,-7.69],[10.10,1.01,-7.69],.045,'#77897b');
      batten([10.09,.22,-6.93],[9.56,.22,-6.93],.030,'#515c50');
      batten([9.56,.22,-6.93],[9.56,.22,-7.62],.028,'#515c50');
      batten([9.56,.22,-7.62],[7.12,.22,-7.62],.026,'#536051');
      for(let j=0;j<3;j++)batten([7.12+j*.61,.22,-7.62],[7.12+j*.61,.46,-7.62],.012,'#586254');
    }
    if(stage>=3) {
      let last;
      for(let j=0;j<=8;j++) {
        const u=j/8,xx=6.63+u*2.75,yy=2.09-.23*Math.sin(Math.PI*u);
        const p=[xx,yy,-6.82];
        if(last)batten(last,p,.007,'#585c4f');last=p;
        if(j%2===1) {
          cyl(xx,yy-.029,-6.82,.022,.021,.055,8,'#676a59',metal);
          ball(xx,yy-.086,-6.82,.059,.079,.059,'#ffdf9b',{mat:'glass',glow:.92});
        }
      }
    }
  }

  function tuft(x,z,h,count,seed) {
    const a=random()*tau;
    for(let j=0;j<count;j++) {
      const aa=a+j*2.399,xx=x+Math.cos(aa)*.027,zz=z+Math.sin(aa)*.027;
      grassBlade(xx,.002,zz,aa,h*between(.72,1.22),h*between(.19,.74),between(.005,.014),
        pick(['#8c9263','#7d8658','#949465','#7f8957','#95996b','#879062']));
    }
    if (seed) {
      const xx=x+.024,zz=z-.016,top=h*1.42;
      grassBlade(x,.003,z,a,top,.037,.006,'#a19b70');
      for(let k=0;k<4;k++) {
        const aa=a+k*1.57,yy=top*(.81+k*.055),dx=Math.cos(aa),dz=Math.sin(aa);
        leaf(xx,yy,zz,aa,.027,.004,.028,.002,'#aaa378');
      }
    }
  }
  function meadow(x,z,w,d,amount) {
    for(let i=0;i<amount;i++) {
      const xx=x+between(-w/2,w/2),zz=z+between(-d/2,d/2),h=between(.10,.265);
      tuft(xx,zz,h,5,i%7===0);
      if(i%4===0) {
        // Low broadleaf rosettes contrast with narrow upright blades and seed heads.
        for(let k=0;k<6;k++){
          const aa=i*.29+k*2.39,len=h*between(.25,.60);
          orchardLeaf(xx,.015,zz,aa,len,len*between(.19,.32),between(.14,.79),between(-.5,.5),
            pick(['#697b49','#71804d','#7e8651','#77874a']));
        }
      }
      if(i%9===0) {
        const yy=h*1.37;
        beam([xx,0,zz],[xx+.021,yy,zz+.011],.004,'#79855b',leafMat);
        for(let k=0;k<5;k++)leaf(xx+.021,yy,zz+.011,k*tau/5,.025,.010,.005,.002,
          i%3 ? '#d6c8a1' : '#c3ad6d');
      }
    }
  }

  countryside();
  yard();
  barn();
  fence(-15.6,-13.6,15.6,-13.6,12);
  fence(-15.6,-13.6,-15.6,13.6,11);
  fence(15.6,-13.6,15.6,13.6,11);
  fence(-15.6,13.6,-1.52,13.6,6);
  fence(.86,13.6,15.6,13.6,6);
  fence(-6.49,-4.61,4.01,-4.61,6);
  fence(-6.61,-4.60,-6.61,-.35,3);
  tree(-10.5,-7.6,1.70,null);
  tree(-10.3,5.9,1.53,'#9d5742');
  tree(11.6,7.7,1.68,null);
  tree(-4.8,10.35,1.47,'#a86c47');
  tree(-5.76,1.25,1.19,'#a45941');
  tree(-4.78,3.48,1.09,'#a75842');
  tree(-.14,-3.32,1.08,'#ad8453');
  pump(4.85,-3.00);
  pond();
  greenhouse(Math.max(0,Math.min(3,Math.trunc(story.repairStage)||0)));
  crate(-2.67,-1.00,.88,true);
  crate(-5.73,-.74,.94,true);
  crate(-6.12,-.36,.80,false);
  hay(-1.48,.025,-3.14,.87,.57,.46);
  hay(-1.41,.025,-3.81,.88,.57,.46);
  hay(-1.46,.49,-3.48,.79,.52,.42);
  // A small raised shelf, watering can and laid-down hand tools.
  box(2.11,.58,-3.20,1.42,.10,.60,'#ac8d64',wood);
  for(const xx of [1.57,2.66]) for(const zz of [-3.42,-3.00]) {
    box(xx,.27,zz,.082,.54,.081,'#85694f',wood);
  }
  cyl(1.86,.83,-3.23,.144,.171,.36,9,'#75998a',metal);
  beam([2.00,.78,-3.22],[2.16,.94,-3.22],.045,'#779686',metal);
  beam([1.72,.77,-3.22],[1.65,.92,-3.22],.023,'#637f74',metal);
  beam([1.65,.92,-3.22],[1.74,.99,-3.22],.023,'#637f74',metal);
  beam([2.34,.658,-3.15],[2.63,.657,-3.32],.021,'#8d6544');
  box(2.65,.66,-3.34,.13,.036,.082,'#82918a',{ry:.44,mat:'metal'});
  const meadowSeed = scenerySeed;
  const centers=[[0,.5],[3.2,.5],[0,3.15],[3.2,3.15]];
  centers.forEach(([x,z],i)=>{
    scenerySeed=708173+i*25111;
    plantingBed(x,z,plots?.[i] || {stage:'empty',crop:'carrot'});
  });
  scenerySeed = meadowSeed;
  // Soft borders of fescue, clover and flowering weeds fill the gaps around the vegetable rows.
  for(const [cx,cz,w,d,count] of [
    [-.18,-2.48,2.77,1.65,116],[2.28,-3.53,2.55,1.67,98],[5.15,-1.98,2.62,1.68,107],
    [4.92,2.38,.54,3.88,98],[-3.30,2.17,.72,3.42,110],[.12,4.51,2.56,.46,62],
    [3.26,4.47,2.42,.44,63],[-5.07,-.54,1.42,.27,30],[-.14,-.58,2.47,.14,35],
    [3.14,-.56,2.50,.14,34]]) {
    meadow(cx,cz,w,d,count);
  }
  for(const [px,pz] of centers) {
    for(let i=0;i<54;i++){
      const xx=px+between(-1.29,1.29),zz=pz+(i%2?1:-1)*between(.995,1.081);
      tuft(xx,zz,between(.024,.104),4,false);
    }
  }
  meadow(-5.31,2.08,1.55,3.09,100);
  meadow(5.78,3.35,1.51,2.14,20);
  meadow(2.00,-3.85,2.55,.48,16);
  meadow(-.64,-1.87,1.33,.43,9);
}
