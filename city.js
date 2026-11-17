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
  const light = {glow:.53}, blind = {glow:.32}, facadeGlass={mat:'facadeGlass'};
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

  // Local facade coordinates run along an edge and out from its glass line.
  // Dark backing, window fittings, slab edges and sun fins occupy distinct planes.
  function atEdge(e,u,y,depth) {
    return [e.x+e.ux*u+e.nx*depth,y,e.z+e.uz*u+e.nz*depth];
  }
  function edgeSolid(e,u,y,width,height,depth,offset,color,material=glassM) {
    const center=atEdge(e,u,y,offset);
    g.box(...center,width,height,depth,color,{...material,ry:Math.atan2(-e.uz,e.ux)});
  }
  function ledge(e,y,width,u,rear,front,thickness,color) {
    // The case has separate sill, drip face and underside; adjacent strips meet.
    const a=u-width/2, b=u+width/2, t=y+thickness/2, low=y-thickness/2;
    g.quad(atEdge(e,a,t,front),atEdge(e,b,t,front),atEdge(e,b,t,rear),atEdge(e,a,t,rear),color,stoneM);
    facadePanel(e,u,y,width,thickness,front,color,stoneM);
    g.quad(atEdge(e,a,low,rear),atEdge(e,b,low,rear),atEdge(e,b,low,front),atEdge(e,a,low,front),'#4e5158',glassM);
  }
  function detailValue(e,floor,bay,salt=0) {
    // Independent samples keep fittings stable across facade LODs.
    const raw=Math.sin(e.x*16.163+e.z*31.309+floor*73.171+bay*21.655+salt*5.376)*43758.5453;
    return raw-Math.floor(raw);
  }
  function detailedElevation(e,bottom,top,building,dist,step) {
    const {kind,colors,lights,lit}=building, glass=kind==='glass', brick=kind==='brick';
    const close=dist<66, front=glass?.075:.18;
    const bays=Math.max(1,Math.round(e.w/(glass?2.18:2.88))), bw=e.w/bays;
    const pier=glass?.12:brick?.63:.54, openW=bw-pier;
    const head=glass?.38:.54, sill=glass?.57:.84;
    const rear=glass?-.86:-.49, tall=top-bottom;
    const floors=Math.floor((tall+.06)/step);
    // The backing sits at the back of the reveal. Foreground fins project beyond
    // the slabs, so a move along the apartment windows exposes the jambs.
    facadePanel(e,e.w/2,(top+bottom)/2,e.w,tall,rear-.12,colors[2],glassM);
    for(let j=0;j<=bays;j++){
      const width=j===0||j===bays?pier*.50:pier, u=j===0?width*.5:j===bays?e.w-width*.5:j*bw;
      edgeSolid(e,u,(bottom+top)/2,width,tall,front-rear,front-(front-rear)/2,
                glass?'#49545b':colors[0],glass?glassM:stoneM);
      if(glass&&close)facadePanel(e,u,(bottom+top)/2,width*.47,tall-.025,front+.022,'#8a8a86',glassM);
    }
    for(let story=0;story<floors;story++){
      const low=bottom+story*step, h=step-head-sill, cy=low+sill+h/2;
      const row=Math.round((low-street)/step);
      // Stacked slab fronts project beyond the deeper glass, with a metal drip
      // and a dark expansion joint below the pale top edge.
      const baseColor=glass?'#485762':colors[0], trim=glass?'#788086':colors[1];
      facadePanel(e,e.w*.5,low+sill*.43,e.w,sill*.86,front-.07,baseColor,glass?glassM:stoneM);
      ledge(e,low+sill*.91,e.w-.025,e.w*.5,rear-.07,front+.115,glass?.12:.155,trim);
      ledge(e,low+step-head*.46,e.w-.025,e.w*.5,rear-.07,front+.025,head*.92,baseColor);
      if(glass)facadePanel(e,e.w*.5,low+sill*.19,e.w-.06,.075,front-.044,'#374750',glassM);
      if(glass&&close)facadePanel(e,e.w*.5,cy+h*.23,e.w-.06,.062,front-.006,'#637177',glassM);
      for(let j=0;j<bays;j++){
        const u=(j+.5)*bw, room=detailValue(e,row,Math.floor(j/2),1);
        const occupied=room<lit+.15 && detailValue(e,row,j,2)>.10;
        const idx=Math.floor(detailValue(e,row,j,3)*(occupied?lights.length:coldGlass.length));
        const shade=occupied?lights[idx]:coldGlass[idx], paneDepth=rear+.017;
        facadePanel(e,u,cy,openW+.035,h+.035,paneDepth,shade,occupied?{glow:.29}:facadeGlass);
        if(!occupied) {
          // Dark panes still show the upper clerestory where the evening sky is reflected.
          facadePanel(e,u,cy+h*.38,openW-.025,h*.235,paneDepth+.019,dimGlass[j%dimGlass.length],facadeGlass);
          continue;
        }
        if(close) {
          const clerestory=atEdge(e,u,cy+h*.43,rear*.48);
          if(detailValue(e,row,j,4)<.70) {
            g.box(...clerestory,openW*.67,.034,.095,'#f5dfb6',{ry:Math.atan2(-e.uz,e.ux),glow:.74});
          }
          if(detailValue(e,row,j,5)<.44) {
            const shadeH=h*(.19+.45*detailValue(e,row,j,6));
            const blindsDepth=front-.21, blindTop=cy+h*.5;
            facadePanel(e,u,blindTop-shadeH*.5,openW-.04,shadeH,blindsDepth,'#9d9c90',stoneM);
            const slats=Math.max(2,Math.round(shadeH/.17));
            for(let s=1;s<slats;s++)
              facadePanel(e,u,blindTop-shadeH*s/slats,openW-.04,.032,blindsDepth+.014,'#777971',glassM);
          } else if(detailValue(e,row,j,7)<.48) {
            // The desk, monitor and side jamb sit in front of the lit wall.
            const dx=(detailValue(e,row,j,8)-.5)*openW*.24;
            edgeSolid(e,u+dx,cy-h*.34,openW*.74,.075,.27,rear+.33,'#68594e',glassM);
            edgeSolid(e,u+dx+.08,cy-h*.27, .065,h*.13,.064,rear+.32,'#44474b',glassM);
            edgeSolid(e,u+dx+.08,cy-h*.16,Math.min(.63,openW*.51),.34,.062,rear+.31,'#474c50',glassM);
          }
        } else if(detailValue(e,row,j,9)<.40) {
          facadePanel(e,u,cy+h*.34,openW*.90,h*.31,rear+.21,'#a4a092',stoneM);
        }
      }
    }
    const rem=tall-floors*step;
    if(rem>.015) {
      facadePanel(e,e.w*.5,top-rem*.5,e.w,rem,front-.07,colors[0],glass?glassM:stoneM);
    }
    ledge(e,top-.085,e.w+.04,e.w*.5,rear,front+.17,.16,colors[1]);
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
        facadePanel(e,e.w/2,y,e.w-.10,bandH,.024,bandColor,facadeGlass);
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
          facadePanel(e,u,y-shutter*.5,width,bandH-shutter,.049,color,on?light:facadeGlass);
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
      const towardPlayer=madeVisible(e), minRelief=dist<66?-32:-19;
      const firstDetailed=bottom>=minRelief?bottom:street+Math.ceil((minRelief-street)/step)*step;
      const deepFacade=towardPlayer && dist<91 && e.w>3.8 && top-firstDetailed>step*.95;
      const flatTop=deepFacade?firstDetailed:top;
      if(flatTop-bottom>.001) {
        facadePanel(e,e.w/2,(bottom+flatTop)/2,e.w,flatTop-bottom,0,colors[0],kind==='glass'?glassM:stoneM);
        if(towardPlayer&&e.w>2.1)cladding(e,bottom,flatTop,building,dist,step);
      }
      if(deepFacade) detailedElevation(e,firstDetailed,top,building,dist,step);
      if(towardPlayer && !deepFacade) {
        facadePanel(e,e.w/2,top-.18,e.w,.34,.10,colors[1],glassM);
        if(top>street+25 && e.w>4.5 && dist<115) {
          facadePanel(e,e.w/2,top-.55,e.w,.19,.07,colors[2],glassM);
        }
      }
      if(dist<93&&top>-42) {
        edgeSolid(e,e.w*.5,top+.23,e.w,.46,.19,-.09,colors[0],stoneM);
        edgeSolid(e,e.w*.5,top+.486,e.w+.035,.074,.33,-.08,colors[3],glassM);
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

  // Small rooftop elements catch the horizon light individually: air handling
  // equipment has fan hubs, inclined blades, ducts and a service access door.
  function mechanicalDetail(x,y,z,w,d) {
    const hx=x-w*.12,hz=z+d*.05,rw=w*.34,rd=d*.31;
    baseBox(hx,y+2.07,hz,rw+.25,.14,rd+.25,'#a2a29b',glassM);
    baseBox(hx+rw*.5+.035,y+1.03,hz+.10,.085,1.94,.88,'#51595e',glassM);
    baseBox(hx+rw*.5+.10,y+.94,hz+.39,.075,.06,.15,'#acb1aa',glassM);
    for(let n=0;n<2;n++) {
      const ax=x+w*.23, az=z+(n-.5)*d*.25, r=Math.min(w,d)*.054;
      g.cyl(ax,y+1.075,az,r*1.03,r*1.06,.095,16,'#606970',glassM);
      g.cyl(ax,y+1.132,az,r*.91,r*.91,.02,16,'#343c42',glassM);
      for(let j=0;j<6;j++){
        const angle=j*Math.PI/3, dx=Math.cos(angle),dz=Math.sin(angle);
        baseBox(ax+r*.46*dx,y+1.159,az+r*.46*dz,r*.67,.045,r*.18,'#838b8b',{mat:'metal',ry:-angle+.25});
      }
      g.cyl(ax,y+1.19,az,r*.19,r*.21,.115,12,'#b0af9e',glassM);
    }
    const px=x-w*.28,pz=z-d*.29;
    g.cyl(px,y+.68,pz,.21,.22,1.36,12,'#78858b',glassM);
    g.cyl(px,y+1.39,pz,.40,.40,.09,12,'#8d9696',glassM);
    baseBox(hx-rw*.30,y+.28,pz,w*.32,.38,.48,'#828a8c',glassM);
    baseBox(hx+rw*.12,y+.28,(hz+pz)*.5,.47,.38,hz-pz,'#828a8c',glassM);
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
      baseBox(cx,y+.18,outside,width,.21,.11,'#787e7d',glassM);
      baseBox(cx,y+1.13,outside,width+.05,.082,.11,'#a5a9a5',glassM);
      baseBox(cx,y+.62,outside,width,.047,.06,'#858e8f',glassM);
      const posts=Math.max(3,Math.ceil(width/.68));
      for(let j=0;j<=posts;j++) {
        baseBox(cx+width*(j/posts-.5),y+.64,outside,.045,1.02,.055,'#727d7f',glassM);
      }
      for(const sign of [-1,1]) {
        baseBox(cx+sign*(width*.5-.025),y+1.13,face+normal*.59,.065,.082,1.17,'#a5a9a5',glassM);
      }
      if(Math.floor((top-y)/step)%4===1) {
        baseBox(cx+width*.29,y+.36,face+normal*.65,width*.24,.53,.38,'#77716a',stoneM);
        g.ball(cx+width*.29,y+.82,face+normal*.65,width*.24,.56,.50,'#536457',{mat:'leaf'});
      }
    }
  }


  function escapeStairs(x,z,w,d,top,step) {
    // Alternating emergency stairs zigzag down the masonry street elevation.
    const face=z+d*.5, cx=x+w*.18, span=Math.min(w*.29,3.3), iron='#4c5355';
    const streetSide=face+1.07;
    for(let floor=0;floor<5;floor++) {
      const y=top-.48-step*(floor+1), dir=floor%2?1:-1;
      baseBox(cx,y,face+.63,span+.44,.12,1.20,iron,glassM);
      for(const side of [-1,1]) {
        baseBox(cx+side*(span*.5+.12),y+.52,streetSide,.061,1.04,.061,iron,glassM);
        baseBox(cx+side*(span*.5+.12),y+.98,face+.69,.06,.06,.75,iron,glassM);
      }
      baseBox(cx,y+1.02,streetSide,span+.29,.058,.061,iron,glassM);
      baseBox(cx,y+.53,streetSide,span+.29,.037,.045,iron,glassM);
      const x0=cx-dir*span*.44,x1=cx+dir*span*.44;
      const z0=streetSide+.33;
      for(let i=0;i<13;i++){
        const t=(i+.5)/13;
        baseBox(x0+(x1-x0)*t,y+step*t,z0,span/12,.069,.68,'#636866',glassM);
      }
      for(const dz of [-.36,.36]) {
        g.beam([x0,y-.02,z0+dz],[x1,y+step-.02,z0+dz],.053,iron,glassM);
        g.beam([x0,y+.91,z0+dz],[x1,y+step+.91,z0+dz],.038,iron,glassM);
      }
    }
  }

  function glazedVault(x,y,z,w,d) {
    // An elliptical standing-seam conservatory rises above the roof coping.
    const base=y+.64,h=d*.38,arcs=12,ribs=8;
    baseBox(x,y+.31,z,w+.26,.62,d+.28,'#858580',glassM);
    const pt=(j,i)=>{
      const t=Math.PI*i/arcs;
      return [x-w*.5+w*j/ribs,base+h*Math.sin(t),z+d*.5*Math.cos(t)];
    };
    const panes=['#677e88','#73858d','#5e7683','#809098'];
    for(let j=0;j<ribs;j++)for(let i=0;i<arcs;i++) {
      g.quad(pt(j,i),pt(j+1,i),pt(j+1,i+1),pt(j,i+1),panes[(i+(j%3===1?1:0))%panes.length],glassM);
    }
    for(let j=0;j<=ribs;j++)for(let i=0;i<arcs;i++) {
      g.beam(pt(j,i),pt(j,i+1),j===0||j===ribs?.088:.054,'#b99d7b',glassM);
    }
    for(let i=0;i<=arcs;i+=2)g.beam(pt(0,i),pt(ribs,i),.054,'#8b8e89',glassM);
    for(const j of [0,ribs]){
      const end=[x-w*.5+w*j/ribs,base,z];
      for(let i=0;i<arcs;i++) {
        const a=pt(j,i),b=pt(j,i+1);
        g.polygon(j?[end,a,b]:[end,b,a],i%2?'#b1a999':'#a69c8b',{glow:.15});
        if(i%2===0)g.beam(end,a,.045,'#8f826e',glassM);
      }
    }
  }

  function winterGardenTower(x,z,w,d,top,skin,dist,step) {
    // This office tower's double-height winter garden is open around a recessed
    // core. Bronze V-columns carry the faceted upper storeys over the terrace.
    const lower=top-18.2, upper=lower+6.8, chamfer=2.45;
    block(x,z,w,d,street,lower,chamfer,skin,dist,step);
    const garden=packet('glass',facades.glass[1]);
    block(x+.65,z-.75,w*.69,d*.68,lower,upper,.95,garden,dist,step);
    const outline=footprint(x,z,w,d,chamfer);
    for(let k=0;k<outline.length;k++) {
      const e=edge(outline[k],outline[(k+1)%outline.length]);
      // Real V-shaped supports and a floating perforated parapet around the terrace.
      const count=Math.max(1,Math.round(e.w/4.8));
      for(let j=0;j<count;j++) {
        const unit=e.w/count,u=(j+.5)*unit;
        const foot=atEdge(e,u,lower+.20,-.40);
        for(const side of [-1,1]) {
          g.beam(foot,atEdge(e,u+side*unit*.43,upper-.11,-.35),.16,'#a28b70',glassM);
        }
      }
      ledge(e,upper-.15,e.w+.01,e.w*.5,-Math.min(w,d)*.20,.20,.34,'#7b7773');
      if(e.w>5.0) {
        edgeSolid(e,e.w*.5,upper-.332,e.w*.83,.035,.10,-.47,'#e1c39f',{glow:.43});
      }
      if(!madeVisible(e))continue;
      g.beam(atEdge(e,.06,lower+1.08,.10),atEdge(e,e.w-.06,lower+1.08,.10),.057,'#aba898',glassM);
      const posts=Math.max(1,Math.round(e.w/1.55));
      for(let j=0;j<=posts;j++) {
        const u=(.04+(e.w-.08)*j/posts);
        g.beam(atEdge(e,u,lower+.19,.08),atEdge(e,u,lower+1.09,.08),.034,'#7c8480',glassM);
      }
      if(e.w>6.) {
        const pos=atEdge(e,e.w*.29,lower+.48,-1.05);
        edgeSolid(e,e.w*.29,lower+.32,3.2,.58,.80,-1.05,'#686d69',stoneM);
        for(let j=-1;j<=1;j++) {
          g.ball(pos[0]+e.ux*j*.89,lower+1.02,pos[2]+e.uz*j*.89,1.08,1.04,.87,
                 j===0?'#596957':'#526554',{mat:'leaf'});
        }
      }
    }
    block(x,z,w*.95,d*.95,upper,top,chamfer*.92,skin,dist,step);
    // Slender buttresses continue across the spandrels onto a copper-edged cornice.
    const crown=footprint(x,z,w*.95,d*.95,chamfer*.92);
    for(let k=0;k<crown.length;k++) {
      const e=edge(crown[k],crown[(k+1)%crown.length]);
      if(e.w<4.)continue;
      for(const q of [.15,.48,.81]) {
        edgeSolid(e,e.w*q,(upper+top)/2,.19,top-upper+.28,.69,.32,'#a89980',glassM);
      }
      ledge(e,top+.32,e.w+.02,e.w*.5,-.18,.53,.20,'#b2a186');
    }
    glazedVault(x-.4,top+.08,z-.30,w*.75,d*.66);
  }

  function tower(x,z,w,d,top,style,form) {
    const dist=Math.hypot(x,z);
    const skin=packet(style,pick(facades[style]));
    const step=style==='brick'?2.85:style==='stone'?3.00:3.25;
    const bevel=style==='glass' && rand()<.61 ? Math.min(w,d)*range(.09,.20) : 0;
    let y=top;
    if(form==='wintergarden') {
      winterGardenTower(x,z,w,d,top,skin,dist,step);
      return;
    }
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
      if(style==='brick') {
        roofTank(x+w*.16,y+.08,z-d*.10,Math.min(w,d)*.12);
        if(dist<78&&y>-37)escapeStairs(x,z,w,d,y,step);
      } else {
        roofServices(x,y,z,w,d);
        if(dist<84 && y>-36)mechanicalDetail(x,y,z,w,d);
      }
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
    [19,-42,16,19,10,'glass','wintergarden'],
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
  // Compact reflection proxies use the same footprints and heights as the meshes.
  // Include the player's building so its mass is visible across the street.
  const nearest=[[0,0,15,13,4.4],...blocks.slice().sort((a,b)=>Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1])).slice(0,15)];
  g.reflectors=new Float32Array(nearest.flatMap(([x,z,w,d,top])=>[x,z,w*.5,(Math.round(top)+144)*1024+Math.round(d*16)]));
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
      if(Math.hypot(a,b)<90 && (a<0 || b<0)) {
        // Crossings, stop lines and lane markings follow the intersecting avenues.
        // Markings sit just above the asphalt, below all animated car bodies.
        baseBox(a,street-.043,b,.085,.018,2.8,'#b5a78b');
        baseBox(b,street-.013,a,2.8,.018,.085,'#b5a78b');
        for(let stripe=0;stripe<5;stripe++) {
          baseBox(a-1.90+stripe*.95,street-.043,b+8.00,.45,.018,1.37,'#bcb9ab');
        }
        baseBox(a-1.25,street-.043,b+6.72,2.28,.018,.15,'#bcb9ab');
      }
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
