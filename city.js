// A metropolitan skyline at real-world scale. The boulevard is 112 metres
// below the apartment. Every floor shares a datum, even across stepped towers.
function buildCity(g) {
  const street = -112;
  const rand = () => g.rand();
  const range = (lo,hi) => lo+(hi-lo)*rand();
  const pick = a => a[Math.floor(rand()*a.length)];
  const facades = {
    glass: [
      ['#435d70','#536e7e','#304958','#81949a'],
      ['#526877','#697e88','#364e5e','#a1a5a0'],
      ['#526071','#6d7784','#373f51','#9d98a0']
    ],
    stone: [
      ['#827b78','#aaa39a','#474955','#c6b6a3'],
      ['#747881','#98979b','#444956','#b2ada6'],
      ['#8b796b','#a99483','#4d4a50','#c2ae93']
    ],
    brick: [
      ['#745d58','#91766b','#443e44','#b39b85'],
      ['#686168','#887880','#413e4c','#9c9391']
    ]
  };
  const glassM = {mat:'metal'}, stoneM = {mat:'stone'};
  const lamps = [
    ['#d7b896','#dec6a0','#c1ac96','#eed2ac'],
    ['#b6c1bb','#d2ceaf','#aabcc1','#c3cdc7'],
    ['#cbb49a','#d4ae87','#b5a8a0','#e7c9a3']
  ];
  const light = {glow:.53}, blind = {glow:.32};
  const coldGlass = ['#506375','#495c6f','#465c6c','#617380','#596b76','#526472'];
  const dimGlass = ['#475463','#404d5c','#46535e','#4c545e'];
  const baseBox = (...a) => g.box(...a);
  const packet = (kind,colors) => ({kind, colors, lights:pick(lamps), lit:range(.22,.51)});

  // Clockwise in the horizontal plane. Each edge's outward normal is its
  // direction rotated left, allowing details to wrap chamfered corners.
  function footprint(x,z,w,d,cut) {
    const l=x-w/2,r=x+w/2,b=z-d/2,f=z+d/2;
    if (cut<.01) return [[l,f],[r,f],[r,b],[l,b]];
    return [[l+cut,f],[r-cut,f],[r,f-cut],[r,b+cut],[r-cut,b],[l+cut,b],[l,b+cut],[l,f-cut]];
  }
  function edge(a,b) {
    const w=Math.hypot(b[0]-a[0],b[1]-a[1]), ux=(b[0]-a[0])/w,uz=(b[1]-a[1])/w;
    return {x:a[0],z:a[1],w,ux,uz,nx:-uz,nz:ux};
  }
  function facadePanel(e,u,y,w,h,gap,col,opts) {
    const u0=u-w/2,u1=u+w/2,y0=y-h/2,y1=y+h/2;
    const x=e.x+e.nx*gap,z=e.z+e.nz*gap;
    const xl=x+e.ux*u0,zl=z+e.uz*u0,xr=x+e.ux*u1,zr=z+e.uz*u1;
    g.quad([xl,y0,zl],[xr,y0,zr],[xr,y1,zr],[xl,y1,zl],col,opts);
  }
  function madeVisible(e) {
    return -(e.x+e.w*.5*e.ux)*e.nx-(e.z+e.w*.5*e.uz)*e.nz>-4;
  }
  function cladding(e,bottom,top,building,dist,step) {
    const {kind,colors,lights,lit}=building, h=top-bottom;
    const glass=kind==='glass', near=dist<72, far=dist>112;
    const bays=Math.max(1,Math.round(e.w/(glass?2.05:2.65))), bay=e.w/bays;
    const deep=glass?coldGlass:dimGlass;
    const first=street+Math.ceil((bottom-street+1.9)/step)*step;
    for(let y=first;y<top-1.25;y+=step) {
      const seen=near||y>-63;
      const bandH=glass?step*.65:step*.53;
      if(glass) {
        // Continuous reflective glass ribbon behind the interior office lights.
        const bandColor=seen?pick(deep):deep[0];
        facadePanel(e,e.w/2,y,e.w-.10,bandH,.024,bandColor,glassM);
        if(near&&y>-50) facadePanel(e,e.w/2,y-bandH/2-.06,e.w-.09,.095,.052,colors[1],glassM);
      }
      if(!seen && rand()<.45) continue;
      let open=rand()<lit;
      const activeFloor=rand()>.17;
      for(let column=0;column<bays;) {
        if(rand()<.64) open=rand()<lit;
        const on=open&&activeFloor;
        const cluster=glass ? Math.min(bays-column,1+Math.floor(rand()*(far?4:near?2:3))) : 1;
        if(on || (!glass&&(!far||rand()<.4))) {
          const u=(column+cluster/2)*bay;
          const width=glass?cluster*bay-.18:bay*range(.5,.64);
          const color=on?pick(lights):pick(deep);
          const shade=on && near && rand()<.24;
          const shutter=shade?range(.35,.72):0;
          facadePanel(e,u,y-shutter*.5,width,bandH-shutter,.049,color,on?light:glassM);
          if(on&&near&&rand()<.20) {
            facadePanel(e,u,y+bandH*.28-shutter,width*.88,.095,.073,'#eee0bc',{glow:.76});
          } else if(!glass&&near&&rand()<.33) {
            facadePanel(e,u,y,width,.065,.073,colors[0],stoneM);
          }
        }
        column+=cluster;
      }
    }
    const fins=glass?bays:Math.round(e.w/5.3);
    if(!far||glass) for(let c=1;c<fins;c++) {
      const color=glass?colors[2]:colors[1];
      facadePanel(e,c*e.w/fins,(bottom+top)/2,glass?(near?.12:.18):.26,h-.13,.083,color,glass?glassM:stoneM);
    }
    if(!glass && near && e.w>8) {
      for(let y=top-11;y>bottom+3;y-=step*5) facadePanel(e,e.w/2,y,e.w,.23,.095,colors[1],stoneM);
    }
  }
  function block(x,z,w,d,bottom,top,chamfer,building,dist,step) {
    const outline=footprint(x,z,w,d,chamfer);
    const {colors,kind}=building;
    for(let i=0;i<outline.length;i++) {
      const a=outline[i], b=outline[(i+1)%outline.length], e=edge(a,b);
      facadePanel(e,e.w/2,(bottom+top)/2,e.w,top-bottom,0,colors[0],kind==='glass'?glassM:stoneM);
      if(madeVisible(e)) {
        if(e.w>2.1) cladding(e,bottom,top,building,dist,step);
        facadePanel(e,e.w/2,top-.18,e.w,.34,.10,colors[1],glassM);
        if(top>street+25 && e.w>4.5 && dist<115) {
          facadePanel(e,e.w/2,top-.55,e.w,.19,.07,colors[2],glassM);
        }
      }
      const mid=[(a[0]+b[0])/2,top,(a[1]+b[1])/2];
      g.quad([x,top,z],[a[0],top,a[1]],mid,[b[0],top,b[1]],colors[2],stoneM);
    }
  }

  function antenna(x,y,z,height) {
    const mast='#646974';
    g.cyl(x,y+height/2,z,.045,.16,height,6,mast,glassM);
    baseBox(x,y+height*.80,z,.95,.07,.09,mast,glassM);
    baseBox(x,y+height+.04,z,.16,.15,.16,'#ff846e',{glow:.89});
  }
  function roofServices(x,y,z,w,d) {
    const c=pick(['#6d7076','#757578','#78767a']);
    const rw=w*.34,rd=d*.31;
    baseBox(x-w*.12,y+1.0,z+d*.05,rw,2.0,rd,c,stoneM);
    for(let i=0;i<5;i++) {
      baseBox(x-w*.12,y+.39+i*.25,z+d*.05+rd/2+.04,rw*.77,.115,.07,'#434a52',glassM);
    }
    for(let i=0;i<2;i++) {
      const px=x+w*.23, pz=z+(i-.5)*d*.25;
      baseBox(px,y+.46,pz,w*.15,.92,d*.15,'#7b8081',glassM);
      g.cyl(px,y+.97,pz,Math.min(w,d)*.056,Math.min(w,d)*.056,.12,10,'#424c54');
    }
    if(rand()<.36) antenna(x-w*.12,y+2,z+d*.05,range(2.2,4.6));
  }
  function roofTank(x,y,z,r) {
    const legs=r*1.12, h=r*2.15;
    for(const a of [-.6,.6]) for(const b of [-.6,.6]) {
      baseBox(x+a*r,y+legs*.5,z+b*r,.12,legs,.12,'#454950',glassM);
    }
    g.cyl(x,y+legs+h/2,z,r,r,h,14,'#7a6b61',{mat:'wood'});
    for(const k of [.06,.28,.58,.87]) {
      g.cyl(x,y+legs+h*k,z,r+.03,r+.03,.075,14,'#45484b',glassM);
    }
    g.cyl(x,y+legs+h+r*.24,z,0,r*1.06,r*.48,14,'#626265',glassM);
  }
  function balconies(x,z,w,d,top,step) {
    const normal=Math.sign(-z)||1;
    const width=w*.32, cx=x-w*.20, face=z+normal*d*.5;
    for(let y=top-step*1.15;y>Math.max(street+5,top-45);y-=step) {
      const outside=face+normal*1.15;
      baseBox(cx,y,face+normal*.60,width,.21,1.35,'#a0998b',stoneM);
      baseBox(cx,y+.63,outside,width,1.03,.09,'#68767c',glassM);
      baseBox(cx,y+1.18,outside,width,.09,.13,'#a5a9a5',glassM);
      baseBox(cx+width/2-.08,y+.68,face+normal*.64,.13,1.22,1.15,'#807c78',stoneM);
    }
  }

  function tower(x,z,w,d,top,style,form) {
    const dist=Math.hypot(x,z);
    const skin=packet(style,pick(facades[style]));
    const step=style==='brick'?2.85:style==='stone'?3.00:3.25;
    const bevel=style==='glass' && rand()<.61 ? Math.min(w,d)*range(.09,.20) : 0;
    let y=top;
    if(form==='stepped') {
      const shoulder=top-range(8.0,13.2);
      block(x,z,w,d,street,shoulder,bevel,skin,dist,step);
      w*=.76;d*=.78;
      block(x,z,w,d,shoulder,top,bevel*.72,skin,dist,step);
    } else if(form==='deco') {
      let bottom=street;
      for(const [s,level] of [[1,top-17],[.79,top-8.5],[.57,top-3.6],[.34,top]]) {
        block(x,z,w*s,d*s,bottom,level,Math.min(w,d)*s*.14,skin,dist,step);
        bottom=level;
      }
      for(const [s,lo,hi] of [[.30,0,1.3],[.21,1.3,2.9],[.12,2.9,4.4]]) {
        g.cyl(x,top+(lo+hi)/2,z,w*s*.82,w*s,hi-lo,4,'#ac9987',{ry:Math.PI*.25,mat:'metal'});
      }
      antenna(x,top+4.4,z,7.2);
      return;
    } else {
      block(x,z,w,d,street,top,bevel,skin,dist,step);
    }
    if((style==='stone'||style==='brick')&&dist<80&&form!=='stepped'&&rand()<.64) balconies(x,z,w,d,top,step);
    if(dist<100) {
      if(style==='brick') roofTank(x+w*.16,y+.08,z-d*.10,Math.min(w,d)*.12);
      else roofServices(x,y,z,w,d);
    } else {
      baseBox(x,y+1.25,z,w*.33,2.5,d*.38,skin.colors[1],stoneM);
    }
  }

  // Near and middle landmarks establish a varied silhouette from the bed, the
  // desk and the corner glazing. The central northwest view opens to the sky.
  const landmarks=[
    [-38,12,15,19,-16,'stone','slab'],
    [-45,-21,13,18,7,'glass','stepped'],
    [-25,-49,14,14,-23,'brick','slab'],
    [19,-42,16,19,10,'glass','stepped'],
    [-7,-75,14,18,1,'stone','slab'],
    [33,-100,17,16,32,'stone','deco'],
    [-79,-69,16,18,20,'glass','stepped'],
    [-91,10,17,19,37,'glass','stepped'],
    [-78,43,14,14,14,'stone','deco'],
    [-37,-100,15,18,21,'glass','stepped'],
    [52,-72,16,20,18,'glass','slab']
  ];
  const blocks=[...landmarks];
  for(let ix=-6;ix<=5;ix++) for(let iz=-6;iz<=5;iz++) {
    const x=ix*24+range(-3.9,3.9),z=iz*24+range(-4,4);
    const dist=Math.hypot(x,z);
    if(dist<48||dist>153||(x>-17&&z>-18)||rand()<.17) continue;
    const w=range(9,18.5),d=range(10,20.5);
    if(blocks.some(b=>Math.abs(x-b[0])<(w+b[2])*.5+2.3 && Math.abs(z-b[1])<(d+b[3])*.5+2.3)) continue;
    const inSunsetGap = x<0&&z<0 && Math.abs(x/z-.82)<.27;
    const top=inSunsetGap?range(-42,-15):range(-40,dist>100?32:14);
    const style=pick(['glass','glass','glass','stone','stone','brick']);
    blocks.push([x,z,w,d,top,style,rand()<.42?'stepped':'slab']);
  }
  for(const args of blocks) tower(...args);

  // The south bank is a second, more distant skyline, behind the roof tanks
  // and office blocks on this side of the river. All silhouettes have depth.
  for(let row=0;row<2;row++)for(let i=-10;i<=10;i++){
    const x=i*21+range(-3,3),z=-181-row*48+range(-7,7);
    if(Math.abs(x+75)<19&&row===0)continue;
    const w=range(10,18),d=range(11,19),top=range(-41,26)+(row===1?7:0);
    tower(x,z,w,d,top,pick(['glass','stone','brick']),rand()<.45?'stepped':'slab');
  }
  tower(-75,-178,22,22,53,'stone','deco');
  // Aurora Exchange rises above the river with a tapered, triangulated crown.
  {
    const x=4,z=-173,w=20,d=16,top=39,p=packet('glass',facades.glass[1]);
    block(x,z,w,d,street,top,2.6,p,175,3.35);
    const low=footprint(x,z,w,d,2.6),peak=[x+4.3,top+17.8,z-1.4];
    for(let i=0;i<low.length;i++){
      const a=[low[i][0],top,low[i][1]],b=[low[(i+1)%low.length][0],top,low[(i+1)%low.length][1]];
      g.polygon([b,a,peak],i%2?'#627984':'#495c73',glassM);
      g.beam(a,peak,.12,'#e4bd8e',{glow:.25,mat:'brass'});
    }
    antenna(peak[0],peak[1],peak[2],5.2);
  }

  // The street plane and lit traffic read through lower windows at acute angles.
  baseBox(0,street-.63,0,335,1,335,'#40464f',stoneM);
  for(let i=-5;i<=4;i++) {
    const a=i*24+12;
    baseBox(a,street-.104,0,5.25,.055,310,'#343b44');
    baseBox(0,street-.070,a,308,.055,5.25,'#353c46');
    for(let j=-5;j<=4;j++) {
      const b=j*24;
      if(Math.hypot(a,b)>139||a>12&&b>12) continue;
      const z=b+range(-6,6);
      baseBox(a-.77,street+.15,z,1.03,.38,1.96,pick(['#8c9292','#866d69','#4f626c']),{mat:'trafficZ'});
      baseBox(a-.77,street+.31,z-.96,.74,.12,.11,'#f6dbaf',{glow:.74,mat:'trafficZ'});
      if((i+j)%2===0) {
        baseBox(b+4.8,street+.15,a+.86,1.95,.39,1.04,'#707b80',{mat:'trafficX'});
        baseBox(b+5.73,street+.31,a+.86,.12,.13,.73,'#ffbf8a',{glow:.69,mat:'trafficX'});
      }
    }
  }
}
