/* View-space models. The right wrist enters from below and behind the tool. */
function buildHandProp(g,action,crop) {
  const tau=2*Math.PI;
  const metal={mat:"metal"},brass={mat:"brass"},hide={mat:"leather"},cloth={mat:"fabric"};
  // Keep UV derivatives defined at the tips of revolved and spherical surfaces.
  const surf=(rows,cols,f,color,material)=>g.surface(rows,cols,(u,v)=>f(u,Math.max(.00001,Math.min(.99999,v))),color,material);
  const add=(a,b,k=1)=>a.map((p,i)=>p+b[i]*k);
  const sub=(a,b)=>a.map((p,i)=>p-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>{const d=Math.hypot(...a)||1;return a.map(n=>n/d)};
  const lerp=(a,b,t)=>a+(b-a)*t;
  const line=(a,b,t)=>a.map((n,i)=>lerp(n,b[i],t));
  function sample(points,t){
    const k=Math.max(0,Math.min(1,t))*(points.length-1),i=Math.min(Math.floor(k),points.length-2);
    return line(points[i],points[i+1],k-i);
  }
  function tube(path,radii,color,mat,sides=10,aspect=1){
    const pole=unit(sub(path[path.length-1],path[0])),reference=Math.abs(pole[2])>.88?[0,1,0]:[0,0,1];
    surf(path.length-1,sides,(u,v)=>{
      const ax=unit(sub(sample(path,v+.01),sample(path,v-.01)));
      const right=unit(cross(ax,reference)),up=cross(right,ax);
      const step=v*(radii.length-1),i=Math.min(Math.floor(step),radii.length-2),r=lerp(radii[i],radii[i+1],step-i);
      return add(add(sample(path,v),right,r*Math.cos(tau*u)),up,r*aspect*Math.sin(tau*u));
    },color,mat);
  }
  function revolution(center,profile,color,mat,n=30,zRatio=1) {
    surf(profile.length-1,n,(u,v)=>{
      const pair=sample(profile,v);
      return [center[0]+pair[0]*Math.cos(tau*u),center[1]+pair[1],center[2]+pair[0]*zRatio*Math.sin(tau*u)];
    },color,mat);
  }
  function patch(x,y,z,rx,ry,rz,color,mat){
    surf(6,11,(u,v)=>{
      const b=(v-.5)*Math.PI,cb=Math.cos(b);
      return [x+rx*Math.cos(tau*u)*cb,y+ry*Math.sin(b),z+rz*Math.sin(tau*u)*cb];
    },color,mat);
  }
  // Interpolate the longitudinal rings of an articulated digit. A transported
  // frame follows each turn without twisting the stitch line across the finger.
  function spline(points,t) {
    const s=Math.max(0,Math.min(1,t))*(points.length-1), i=Math.min(points.length-2,Math.floor(s));
    const a=points[Math.max(i-1,0)], b=points[i], c=points[i+1], d=points[Math.min(i+2,points.length-1)];
    const f=s-i,f2=f*f,f3=f2*f;
    return b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*f+(2*a[k]-5*v+4*c[k]-d[k])*f2+(-a[k]+3*v-3*c[k]+d[k])*f3));
  }
  const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  function fingerSurface(points,radii,depths,reference) {
    const sections=(points.length-1)*3, rings=[];
    for(let k=0;k<=sections;k++){
      const t=k/sections, center=spline(points,t);
      const axis=unit(sub(spline(points,t+.002),spline(points,t-.002)));
      const last=k?rings[k-1].side:reference;
      const side=unit(add(last,axis,-dot(axis,last))), back=cross(side,axis);
      rings.push({center,side,back,width:Math.max(.00015,spline(radii.map(n=>[n]),t)[0]),height:Math.max(.00015,spline(depths.map(n=>[n]),t)[0])});
    }
    return (u,v,outset=0)=>{
      const d=Math.min(sections,Math.max(0,v*sections)),a=Math.min(sections-1,Math.floor(d)),frac=d-a;
      const theta=u*tau,ca=Math.cos(theta),si=Math.sin(theta);
      const point=row=>add(add(row.center,row.side,(row.width+outset)*ca),row.back,(row.height+outset)*si);
      return frac===0?point(rings[a]):line(point(rings[a]),point(rings[a+1]),frac);
    };
  }
  function glove(center,axis,face,objectRadius,shape='grip'){
    const scale=shape==='cup'?.89:1;
    const Y=unit(axis), X=unit(cross(Y,face)), Z=cross(X,Y);
    const pos=p=>add(add(add(center,X,p[0]*scale),Y,p[1]*scale),Z,p[2]*scale);
    const r=objectRadius/scale;
    const ochre='#a07f5f', shaded='#82684e', thread='#b79b77';
    function skinSurface(rows,cols,fn,color,mat=hide){surf(rows,cols,(u,v)=>pos(fn(u,v)),color,mat)}
    function cord(points,width,color,mat=hide,n=5){
      if(points.length>1)tube(points.map(pos),points.map(()=>width*scale),color,mat,n);
    }
    function stitch(fn,count,start=0,end=1){
      for(let k=0;k<count;k++){
        const a=lerp(start,end,(k+.12)/count),b=lerp(start,end,(k+.69)/count);
        cord([fn(a),fn(b)],.00045,thread,cloth,4);
      }
    }
    // The heel narrows into the wrist, while the radial side rises into the
    // thumb pad. Its broad back carries one continuous goatskin reinforcement.
    const palmRings=[
      [r+.068,-.034,.023+r*.26,.018,.012], [r+.058,-.030,.020+r*.30,.027,.016],
      [r+.046,-.022,.018+r*.36,.033,.0183],[r+.030,-.014,.016+r*.50,.038,.0195],
      [r+.011,-.005,.014+r*.70,.040,.0165],[r-.001,.000,.012+r*.86,.035,.0121],
      [r-.007,.001,.010+r*.92,.023,.0065]
    ];
    const signedPow=(n,k)=>Math.sign(n)*Math.pow(Math.abs(n),k);
    function palmPoint(a,t,offset=0){
      const [x,y,z,w,h]=spline(palmRings,t), co=Math.cos(a),si=Math.sin(a);
      return [x,y+(w+offset)*signedPow(co,.86),z+(h+offset)*signedPow(si,.77)+.0035*co*Math.sin(t*Math.PI)];
    }
    skinSurface(20,28,(u,v)=>palmPoint(tau*u,v),ochre);
    const panelUV=(u,v)=>{
      const edge=Math.pow(Math.abs(2*u-1),2.3), start=.095+.12*edge, end=.895-.15*edge;
      return palmPoint(.27+u*2.56,lerp(start,end,v),.00105);
    };
    skinSurface(12,18,panelUV,'#ac8e6c');
    for(const u of [.025,.975])stitch(t=>add(panelUV(u,t),[0,0,.00032]),11);
    stitch(t=>add(panelUV(t,.975),[0,0,.00032]),14);
    // Tendons and wear wrinkles below each metacarpal are stitched embossing,
    // kept low so the back of the glove still reads as one supple surface.
    for(let i=0;i<3;i++){
      const u=.22+i*.25, ridge=t=>add(panelUV(u+.032*Math.sin(t*Math.PI),.28+t*.54),[0,0,.0006]);
      cord([ridge(0),ridge(.31),ridge(.67),ridge(1)],.00076,'#b39672');
    }
    // The spread, finger lengths and curl all change with the object diameter.
    // On a heavy tomato the palm opens and the pads stop along the fruit's side.
    const fingers=[
      {y:.0285,size:.0093,len:1,tilt:-.0045},{y:.0102,size:.0097,len:1.08,tilt:-.0016},
      {y:-.0089,size:.0092,len:1,tilt:.0021},{y:-.0260,size:.0078,len:.78,tilt:.0055}
    ];
    fingers.forEach(({y,size,len,tilt},i)=>{
      const cup=shape==='fruit', jointRadius=cup?r*Math.sqrt(Math.max(.45,1-(y/(r*1.22))**2)):r;
      const a=jointRadius+size*.88;
      const terminal=cup?3.00+i*.036:4.57-i*.09;
      const ring=(angle,h,extra=0)=>[(a+extra)*Math.cos(angle),h,(a+extra)*Math.sin(angle)];
      const knuckle=[r+.007-(i===3?.002:0),y,.016+r*.90];
      const pip=ring(2.22-i*.035,y+tilt*.28,.0069*len);
      const dip=ring(lerp(2.22,terminal,.59),y+tilt*.77,.0016*len);
      const tip=ring(terminal,y+tilt,.0001);
      const close=add(tip,unit(sub(tip,dip)),.0047);
      const pts=[knuckle,line(knuckle,pip,.37),pip,line(pip,dip,.47),dip,line(dip,tip,.52),tip,close];
      const widths=[1.02,1.05,1.15,1.01,.98,.89,.85,.025].map(x=>size*x);
      const depths=[.96,.93,1.02,.86,.84,.77,.65,.023].map(x=>size*x);
      const surface=fingerSurface(pts,widths,depths,[0,1,0]);
      skinSurface((pts.length-1)*3,16,surface,i===3?'#9b7d60':'#aa8969');
      // Dorsal guard over the distal phalanx follows the actual roll of
      // the fingertip, like the nail beneath it. Individual forked seams
      // gather the leather behind both the middle and distal joint.
      const cap=(u,v)=>surface(.49+u*.53,lerp(.63+.045*Math.abs(2*u-1),.84-.028*Math.abs(2*u-1),v),.00064);
      skinSurface(5,8,cap,'#b29675');
      for(const boundary of [.32,.57]){
        const pts=[];
        for(let k=0;k<=6;k++)pts.push(surface(.50+k*.076,boundary+.022*Math.sin(k*Math.PI/6),.00047));
        cord(pts,.00066,'#80684f');
      }
      // Outer gusset visible along the little finger and index.
      if(i===0||i===3){
        const side=i===0?.035:.47;
        const piping=t=>surface(side,.14+t*.67,.00072);
        const seam=[];for(let k=0;k<=15;k++)seam.push(piping(k/15));
        cord(seam,.0008,shaded);stitch(t=>surface(side+.035,.14+t*.67,.00080),8);
      }
    });
    // Thenar web and thumb overlap the index in opposition. The thumb points
    // diagonally around the far side of the handle, not parallel to the fingers.
    const thumbPts=[
      [r+.044,.000,.010+r*.25],[r+.039,.018,.005+r*.25],[r+.024,.036,.003+r*.19],
      [r+.011,.045,-.004-r*.14],[r-.007,.045,-.008-r*.39],
      [r-.018,.037,-.008-r*.59],[r-.025,.031,-.004-r*.65],[r-.028,.028,-.002-r*.65]
    ];
    const thumb=fingerSurface(thumbPts,[.017,.017,.0158,.0137,.012,.0111,.0092,.0004],[.012,.014,.014,.012,.0103,.0094,.0077,.0003],[0,0,1]);
    skinSurface(21,20,thumb,'#a58767');
    const pad=(u,v)=>thumb(.068+u*.41,lerp(.18+.045*Math.abs(2*u-1),.83-.095*Math.abs(2*u-1),v),.00074);
    skinSurface(10,11,pad,'#917355');
    for(const u of [.025,.975])stitch(t=>pad(u,t),8);
    // A separate curved gusset joins the thumb saddle to the back panel.
    const crotch=t=>palmPoint(.47+1.04*t,.17+.31*t,.0018);
    const welt=[];for(let k=0;k<=10;k++)welt.push(crotch(k/10));
    cord(welt,.00115,shaded);
    // A shaped gauntlet and jacket continue to the bottom of the screen.
    // Wrist geometry points inward from the elbow even when the tool is tilted.
    const wrist=pos(palmRings[1].slice(0,3)),armEnd=add(wrist,[.245,-.26,.34]);
    const armDir=unit(sub(armEnd,wrist)),armSide=unit(cross(armDir,[0,0,1])),armUp=cross(armSide,armDir);
    const armAt=(s,u,ry,rz,wrinkle=0)=>{
      const a=u*tau,warped=1+wrinkle*(Math.cos(a*7+s*38)+.48*Math.cos(a*11-s*45));
      const base=add(wrist,armDir,s);
      return add(add(base,armSide,ry*warped*Math.cos(a)),armUp,rz*warped*Math.sin(a));
    };
    surf(24,26,(u,v)=>{
      const s=.027+.375*v,crease=.003*Math.sin(v*13)*Math.exp(-v*3);
      return armAt(s,u,lerp(.036,.065,v)+crease,lerp(.030,.052,v)+crease,.045);
    },'#515953',{mat:'fabric'});
    for(const h of [.043,.070,.096]){
      surf(4,26,(u,v)=>armAt(h+.008*v+.003*Math.sin(tau*u),u,.038+.004*Math.sin(v*Math.PI),.033+.0026*Math.sin(v*Math.PI),.043),'#5f655b',cloth);
    }
    const cuffProfile=[[-.010,.028,.022],[.001,.034,.027],[.017,.037,.031],[.039,.039,.034],[.046,.041,.035],[.049,.039,.034]];
    surf(14,30,(u,v)=>{const [s,w,d]=spline(cuffProfile,v);return armAt(s,u,w,d,.019);},'#7c7462',cloth);
    for(const offset of [0,.005]){
      surf(3,32,(u,v)=>armAt(.036+offset+.0016*v,u,.0405,.035,.019),'#beaa88',cloth);
    }
    const seam=[];
    for(let i=0;i<=11;i++)seam.push(armAt(.055+.30*i/11,.22,.038+.022*i/11,.033+.015*i/11,.025));
    tube(seam,seam.map(()=>.0013),'#747b6e',cloth,5);
  }
  function wateringCan(){
    // The body is a rolled, elliptical sheet with a crimp underneath the base.
    const body=[.008,-.008,0];
    revolution(body,[[.001,-.078],[.075,-.078],[.084,-.073],[.086,-.066],[.083,-.060],
      [.089,-.010],[.091,.047],[.089,.064],[.084,.070]],"#82908a",metal,42,.79);
    revolution(body,[[.084,.070],[.073,.075],[.043,.077],[.040,.073]],"#8f9a92",metal,40,.79);
    revolution(body,[[.041,.075],[.038,.072],[.037,.057],[.001,.050]],"#404b48",metal,32,.79);
    for(const [y,r] of [[-.068,.085],[-.044,.0858],[.029,.091],[.063,.0899]]){
      revolution(body,[[r-.002,y-.003],[r+.0006,y-.002],[r+.0012,y],[r+.0004,y+.0018],[r-.0015,y+.003]],
        "#9ca59b",metal,36,.79);
    }
    // Lapped sheet seam, spun rivets and a soldered patch around the spout union.
    for(const h of [-.049,-.026,.002,.030,.048]){
      g.ball(.055,h,.058,.0048,.0048,.0035,"#a9aea1",metal);
    }
    tube([[-.057,-.045,-.005],[-.084,-.037,-.014],[-.117,-.017,-.031],
      [-.150,.011,-.047],[-.182,.041,-.059],[-.196,.053,-.065]],
      [.031,.023,.017,.0135,.010,.009],"#86938c",metal,18);
    const axis=unit([-.72,.54,-.41]),roseBase=[-.194,.052,-.064];
    const along=t=>add(roseBase,axis,t);
    tube([along(-.004),along(.003),along(.011),along(.017),along(.020),along(.022)],
      [.0086,.010,.020,.033,.034,.032],"#a19875",brass,24);
    const up=unit(cross(axis,[0,1,0])),right=cross(up,axis);
    const face=(r,a,bump=0)=>add(add(along(.022+.004*(1-(r/.034)**2)+bump),up,Math.cos(a)*r),right,Math.sin(a)*r);
    surf(5,28,(u,v)=>face(.032*(1-v),tau*u),"#b4a984",brass);
    for(const [ring,holes] of [[.008,6],[.018,11],[.027,16]])for(let i=0;i<holes;i++){
      const pos=face(ring,(i+(holes%2)*.29)/holes*tau,.0006),r=.00130;
      surf(1,6,(u,v)=>add(add(pos,up,(1-v)*r*Math.cos(tau*u)),right,(1-v)*r*Math.sin(tau*u)),"#464b43",metal);
    }
    // Attached strap handle, bending over the long axis of the can.
    const arch=t=>[.008-.091*Math.cos(Math.PI*t),.055+.100*Math.sin(Math.PI*t),.001];
    const handle=[];
    for(let i=0;i<=18;i++)handle.push(arch(i/18));
    tube(handle,handle.map(()=>.0054),"#919e95",metal,16,1.48);
    const back=[[.086,.040,.004],[.115,.056,.004],[.140,.043,.004],[.149,.018,.004],
      [.141,-.009,.004],[.112,-.039,.004],[.086,-.042,.004]];
    const curved=Array.from({length:39},(_,i)=>spline(back,i/38));
    tube(curved,curved.map(()=>.0073),"#929d93",metal,16,1.2);
    // Riveted handle lugs and a rawhide jacket protect the cool metal strap.
    for(const [yy,zz] of [[.04,.004],[-.042,.004]]) {
      patch(.087,yy,zz,.0035,.012,.012,'#7a857e',metal);
      patch(.091,yy,zz,.002,.004,.004,'#b9b7a1',metal);
    }
    const grip=curved.slice(12,26);
    tube(grip,grip.map((_,i)=>.0088+.0006*Math.sin(Math.PI*i/(grip.length-1))),'#6f5646',hide,16,1.12);
    // Lapped side seam and tiny rounded heads catch the rim light.
    const lap=[[-.005,-.058,.065],[-.005,-.027,.069],[-.005,.015,.071],[-.005,.050,.072]];
    tube(lap,[.0014,.0015,.0014,.0012],'#929e93',metal,8);
    for(let i=0;i<4;i++){const h=-.048+i*.028;patch(-.005,h,.068+(h+.048)*.055,.0022,.0022,.0011,'#bbc2b6',metal);}
    glove([.145,.012,.004],[-.10,.99,0],[0,0,1],.009,'grip');
  }
  function trowel(){
    const pivot=[-.036,.017,-.031],ax=unit([-.72,.55,-.39]),across=unit(cross(ax,[0,0,1])),up=cross(across,ax);
    const p=(along,wide,deep)=>add(add(add(pivot,ax,along),across,wide),up,deep);
    const path=t=>p(t,0,0);
    tube([-.146,-.143,-.126,-.085,-.045,-.028].map(path),[.001,.014,.017,.014,.015,.011],"#886a4c",{mat:"walnut"},18);
    tube([path(-.035),path(-.026),path(-.018)],[.013,.014,.010],"#a19a83",brass,16);
    tube([path(-.019),path(.016),p(.038,0,.001)],[.006,.006,.009],"#737d78",metal,13);
    function blade(u,v,offset=0){
      const edge=u*2-1;
      const width=.004+.036*Math.pow(Math.sin(v*Math.PI),.73)*(.88+.27*(1-v));
      const depth=.008*Math.pow(Math.abs(edge),1.6)*Math.sin(v*Math.PI)+.007*v*v-.006*Math.sin(v*3.3);
      return p(.019+.140*v,edge*width,depth+offset);
    }
    surf(20,14,(u,v)=>blade(u,v),"#8e9690",metal);
    surf(20,14,(u,v)=>blade(u,v,-.0017),"#747e79",metal);
    for(const u of [0,1]){
      const edge=[];for(let k=0;k<=16;k++)edge.push(blade(u,k/16));
      tube(edge,edge.map(()=>.0017),"#c0c4b7",metal,5);
    }
    for(let i=0;i<5;i++){
      const u=.17+i*.15,v=.46+Math.sin(i*4)*.14;
      const points=[blade(u,v,.0008),blade(u+.014,v+.07,.0009),blade(u+.015,v+.12,.0009)];
      tube(points,[.00058,.00047,.0002],"#b4b8a9",metal,4);
    }
    // Soil caught in the hollow of the blade.
    for(let i=0;i<9;i++){
      const pos=blade(.34+.30*(.5+.5*Math.sin(i*5.4)),.39+.25*(.5+.5*Math.cos(i*1.71)),.0012);
      const r=.0016+(i%3)*.00065;patch(...pos,r,r*.43,r*.71,"#796e58",{mat:"stone"});
    }
    // Turned grip with an aged ferrule, lanyard eye and the shallow shoulder
    // left where the blade was pressed around its forged center rib.
    for(const u of [-.126,-.121,-.042]){
      tube([path(u-.001),path(u),path(u+.001)],[.0156,.016,.0155],'#76583e',{mat:'walnut'},22);
    }
    tube([path(-.029),path(-.028),path(-.026)],[.0132,.0142,.0136],'#b3a88a',brass,22);
    for(const v of [-.146,-.143])patch(...p(v,0,.002),.0034,.0034,.0026,'#787269',metal);
    for(const side of [-1,1]){
      const ribs=[];for(let k=0;k<=9;k++)ribs.push(blade(.5+side*(.014+.033*Math.sin(Math.PI*k/10)),.08+k*.043,.0008));
      tube(ribs,ribs.map((_,k)=>.0011-.00006*k),'#9fa49b',metal,7);
    }
    glove(p(-.085,0,0),ax,[0,0,1],.015,'grip');
  }
  function harvest(){
    const greens=["#557454","#718454","#576d4f"];
    const kind=String(crop||"carrot").toLowerCase();
    if(kind.startsWith("tomat")){
      for(const [x,y,z,s] of [[-.012,.025,-.014,.052]]){
        surf(24,40,(u,v)=>{
          const phi=(v-.5)*Math.PI,theta=u*tau,lobe=1+.042*Math.cos(theta*6)*(.32+.68*v*v);
          return [x+s*Math.cos(phi)*Math.cos(theta)*lobe,y+s*.84*Math.sin(phi)-s*.15*Math.pow(v,10),
            z+s*Math.cos(phi)*Math.sin(theta)*lobe];
        },x<0?"#b4523e":"#c46749",{mat:"plain"});
        const top=y+s*.72;
        tube([[x,top,z],[x+.005,top+.018,z-.005],[x+.013,top+.027,z-.010]],
          [.0048,.0034,.0024],"#64744e",cloth,7);
        for(let i=0;i<6;i++){
          const a=i*tau/6+.28;
          surf(5,4,(u,v)=>{
            const w=(u*2-1)*.005*Math.sin(v*Math.PI);
            return [x+Math.cos(a)*.029*v-Math.sin(a)*w,top+.002+.006*Math.sin(v*3.14)-.012*v*v,
              z+Math.sin(a)*.029*v+Math.cos(a)*w];
          },greens[i%3],cloth);
        }
      }
    }else if(kind.startsWith("corn")){
      const base=[.009,-.066,.003],axis=unit([-.45,.84,-.31]);
      const left=unit(cross(axis,[0,0,1])),front=cross(left,axis),L=.192;
      function ear(u,v,extra=0){
        const shape=.031*(.32+.68*Math.pow(Math.sin(Math.PI*(.16+.83*v)),.53))*(1-.28*v*v);
        const grooves=.0013*Math.cos(tau*u*12)*Math.sin(v*Math.PI)+.0014*Math.cos(v*56)*Math.sin(v*Math.PI);
        const r=shape+grooves+extra;return add(add(add(base,axis,L*v),left,r*Math.cos(u*tau)),front,r*Math.sin(u*tau));
      }
      surf(32,48,(u,v)=>ear(u,v),"#aa8c4e",{mat:'plain'});
      // Distinct, slightly offset files of kernels nest in the cob. The kernels
      // taper near its tip and each carries a flattened, convex outer crown.
      const kernelColors=['#dbb65c','#e6c16a','#d6aa54','#e9ca7a','#dcaf5a'];
      for(let row=0;row<18;row++)for(let col=0;col<13;col++){
        const t=.07+row*.05,a=(col+(row%2)*.15)/13,origin=ear(a,t,.00035);
        const outward=unit(left.map((n,i)=>n*Math.cos(tau*a)+front[i]*Math.sin(tau*a)));
        const tangent=unit(cross(axis,outward)),width=(.0063-.0015*t*t)*(.94+.06*Math.sin(row*3+col)),height=.0046;
        surf(4,9,(u,v)=>{
          const phi=tau*u,rad=.012+.988*Math.sin(v*Math.PI*.5);
          const sp=(f,e)=>Math.sign(f)*Math.pow(Math.abs(f),e);
          return add(add(add(origin,tangent,width*rad*sp(Math.cos(phi),.80)),axis,height*rad*sp(Math.sin(phi),.70)),outward,.0028*(1-Math.pow(rad,2.9)));
        },kernelColors[(row*7+col*3)%5],{mat:'plain'});
      }
      for(let j=0;j<4;j++){
        const ang=.11+j*.264;
        surf(16,6,(u,v)=>{
          const spread=(u-.5)*(.33-.27*v),t=ang+spread;
          const height=(j%2?.53:.70)*v;
          const q=ear(t,height,.0017);
          const outward=.040*v*v;
          return add(add(q,left,Math.cos(tau*ang)*outward),front,Math.sin(tau*ang)*outward);
        },greens[j%3],cloth);
      }
      tube([add(base,axis,-.024),base,add(base,axis,.018)],[.011,.018,.022],"#809064",cloth,12);
    }else{
      for(let j=0;j<3;j++){
        const x=-.033+.023*j,z=-.025+.015*(j%2),y=.067-.009*(j%2),length=.132-.009*j;
        const path=[];
        for(let k=0;k<=12;k++){
          const t=k/12;path.push([x+t*(.031+.011*j)+.009*Math.sin(t*3),y-length*t,z+.018*t*t]);
        }
        tube(path,path.map((_,k)=>k===12?.0008:.0168*Math.pow(1-k/13,.69)*(1+.079*Math.cos(k*2))),
          ["#c4854c","#b87941","#cb8d50"][j],{mat:"plain"},14);
        // Broken transverse growth scars and a few hair roots interrupt the taper.
        for(let f=0;f<6;f++){
          const t=.19+f*.098,base=sample(path,t),rad=.0168*Math.pow(1-t*12/13,.69);
          const ph=.67+f*1.38+j*.73,curve=[];
          for(let q=0;q<6;q++){const a=ph+q*.11;curve.push([base[0]+rad*Math.cos(a),base[1]+Math.sin(q*.6)*.0008,base[2]+rad*Math.sin(a)]);}
          tube(curve,curve.map((_,k)=>.00036+.00030*Math.sin(k*Math.PI/5)),'#98633f',{mat:'plain'},5);
        }
        for(let k=0;k<4;k++){
          const angle=j*1.7+k*1.48,dx=.035*Math.cos(angle)-.012,dz=.026*Math.sin(angle);
          const tip=[x+dx*1.3,y+.076+(k%2)*.018,z+dz*1.3];
          const mid=[x+dx*.53,y+.043,z+dz*.53],start=[x,y,z];
          tube([start,mid,tip],[.0023,.0019,.0008],greens[k%3],cloth,5);
          for(let m=0;m<4;m++){
            const t=.26+m*.185,origin=line(start,tip,t);
            for(const side of [-1,1])
              tube([origin,[origin[0]+side*.010+dx*.20,origin[1]+.011,origin[2]+side*dz*.2]],
                [.0026-.0003*m,.0004],greens[(j+k)%3],cloth,4);
          }
        }
      }
    }
    if(kind.startsWith('tomat'))glove([-.012,.025,-.014],[.05,.22,.97],[.05,-.96,.22],.049,'fruit');
    else if(kind.startsWith('corn'))glove([-.011,-.029,-.010],[-.45,.84,-.31],[0,0,1],.029,'cob');
    else glove([-.002,.001,-.015],[-.19,.98,-.06],[0,0,1],.029,'bunch');
  }
  function coffee(){
    const pos=[-.008,.016,-.004],glaze={mat:"ceramic"};
    revolution(pos,[[.001,-.055],[.035,-.055],[.042,-.052],[.046,-.044],[.050,.042],
      [.051,.052],[.050,.055],[.046,.055],[.045,.049],[.043,.034]],
      "#c5bdab",glaze,36);
    revolution(pos,[[.043,.034],[.040,.0345],[.001,.034]],"#46352b",glaze,36);
    const loop=[[.035,.049,-.003],[.061,.052,-.003],[.077,.045,-.003],[.084,.028,-.003],
      [.083,.006,-.003],[.068,-.016,-.003],[.038,-.022,-.003]];
    const ceramicHandle=Array.from({length:33},(_,i)=>spline(loop,i/32));
    tube(ceramicHandle,ceramicHandle.map((_,i)=>.0072+.0016*Math.pow(Math.abs(i/16-1),2)),"#c5bdab",glaze,20,1.1);
    for(const [x,y,z] of [loop[0],loop.at(-1)])patch(x,y,z,.0097,.010,.0095,'#c5bdab',glaze);
    // Fine wheel-thrown rim, a darker foot ring and a broken meniscus.
    revolution(pos,[[.0496,.0530],[.0505,.0538],[.0498,.0545]],'#d3cbbb',glaze,48);
    revolution(pos,[[.035,-.0554],[.037,-.055],[.038,-.054]],'#aba18c',glaze,44);
    for(let k=0;k<3;k++){
      const pts=[];for(let j=0;j<=13;j++){const a=k*2.21+.06+j*.075,r=.0425-.001*Math.sin(j*.24);pts.push([pos[0]+r*Math.cos(a),pos[1]+.0348,pos[2]+r*Math.sin(a)]);}
      tube(pts,pts.map((_,j)=>.00025+.00032*Math.sin(j*Math.PI/13)),'#9a8060',glaze,5);
    }
    glove([.082,.022,-.003],[.045,.999,0],[0,0,1],.0076,'cup');
  }
  if(action==="plant") trowel();
  else if(action==="harvest") harvest();
  else if(action==="water") wateringCan();
  else if(action==="coffee") coffee();
}
