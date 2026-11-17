/* View-space models. The right wrist enters from below and behind the tool. */
function buildHandProp(g,action,crop) {
  const tau=2*Math.PI;
  const metal={mat:"metal"},brass={mat:"brass"},hide={mat:"leather"},cloth={mat:"fabric"};
  const surf=(rows,cols,f,color,material)=>g.surface(rows,cols,f,color,material);
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
  function glove(x,y,z,scale=1){
    const pt=(a,b,c)=>[x+a*scale,y+b*scale,z+c*scale],radii=a=>a.map(n=>n*scale);
    tube([pt(.020,-.026,.031),pt(.039,-.046,.052),pt(.074,-.071,.097),pt(.099,-.085,.131)],
      radii([.035,.033,.039,.043]),"#565c52",cloth,14,.87);
    tube([pt(.010,-.012,.024),pt(.023,-.029,.040),pt(.042,-.044,.061)],
      radii([.036,.037,.035]),"#82725c",cloth,14,.85);
    tube([pt(.037,-.042,.055),pt(.039,-.044,.058)],radii([.0355,.0355]),"#aa9780",cloth,14,.85);
    patch(...pt(.002,0,.009),.040*scale,.043*scale,.024*scale,"#9a7959",hide);
    // The fingers flex toward the palm, with separate fingertips around the shaft.
    for(let i=0;i<4;i++){
      const localY=.028-i*.0145,short=i===3?.008:0;
      const finger=[pt(-.008,localY,.011),pt(-.025+short,localY+.002,.008),
        pt(-.035+short,localY,-.004),pt(-.034+short,localY-.002,-.018),pt(-.023+short,localY-.004,-.023)];
      tube(finger,radii([.0087,.0095,.0091,.0082,.0045]),i===3?"#947459":"#a48565",hide,8);
      tube([pt(-.022+short,localY+.008,.012),pt(-.028+short,localY+.005,.007)],
        radii([.0009,.0006]),"#705c49",hide,5);
    }
    const thumb=[pt(.021,.021,.016),pt(.005,.038,.013),pt(-.013,.039,.004),pt(-.021,.030,-.008)];
    tube(thumb,radii([.013,.012,.010,.006]),"#a6896b",hide,10);
    tube([pt(.021,-.022,.031),pt(.016,-.003,.034),pt(.014,.016,.032)],
      radii([.001,.001,.0008]),"#c3a78a",hide,5);
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
    tube(handle,handle.map(()=>.0054),"#919e95",metal,8,1.48);
    const back=[[.086,.040,.004],[.115,.056,.004],[.140,.043,.004],[.149,.018,.004],
      [.141,-.009,.004],[.112,-.039,.004],[.086,-.042,.004]];
    tube(back,[.006,.007,.007,.007,.007,.007,.005],"#929d93",metal,8,1.2);
    glove(.161,.001,.010,.86);
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
    glove(.053,-.040,.022,1);
  }
  function harvest(){
    const greens=["#557454","#718454","#576d4f"];
    const kind=String(crop||"carrot").toLowerCase();
    if(kind.startsWith("tomat")){
      for(const [x,y,z,s] of [[-.039,.029,-.026,.048],[.022,.027,.010,.042]]){
        surf(13,21,(u,v)=>{
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
      surf(32,48,(u,v)=>ear(u,v),"#d2ad65",cloth);
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
    glove(.041,-.019,.035,.98);
  }
  function coffee(){
    const pos=[-.008,.016,-.004],glaze={mat:"ceramic"};
    revolution(pos,[[.001,-.055],[.035,-.055],[.042,-.052],[.046,-.044],[.050,.042],
      [.051,.052],[.050,.055],[.046,.055],[.045,.049],[.043,.034]],
      "#c5bdab",glaze,36);
    revolution(pos,[[.043,.034],[.040,.0345],[.001,.034]],"#46352b",glaze,36);
    const loop=[[.035,.049,-.003],[.061,.052,-.003],[.077,.045,-.003],[.084,.028,-.003],
      [.083,.006,-.003],[.068,-.016,-.003],[.038,-.022,-.003]];
    tube(loop,[.0071,.0076,.0074,.0074,.0076,.0078,.0077],"#c5bdab",glaze,12);
    glove(.092,.003,.006,.80);
  }
  if(action==="plant") trowel();
  else if(action==="harvest") harvest();
  else if(action==="water") wateringCan();
  else if(action==="coffee") coffee();
}
