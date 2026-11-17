/* Lightweight flat-shaded mesh builder and shadow-mapped WebGL renderer. */
const V3 = {
  sub:(a,b)=>a.map((n,i)=>n-b[i]), dot:(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  unit:a=>a.map(n=>n/(Math.hypot(...a)||1))
};
const bound=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function viewMatrix(eye,at){
  const z=V3.unit(V3.sub(eye,at)), x=V3.unit(V3.cross([0,1,0],z)), y=V3.cross(z,x);
  return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-V3.dot(x,eye),-V3.dot(y,eye),-V3.dot(z,eye),1];
}
function ortho(w,h,n,f){return [1/w,0,0,0,0,1/h,0,0,0,0,-2/(f-n),0,0,0,-(f+n)/(f-n),1]}
function matrixMult(a,b){const o=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)o[j*4+i]+=a[k*4+i]*b[j*4+k];return o}
const colorMap=new Map(), matIds={plain:0,wood:1,fabric:2,stone:3,metal:4,walnut:5,oak:6,linen:7,leather:8,marble:9,plaster:10,brass:11,ceramic:12,glass:13,screen:14,grass:15,leaf:16,soil:17,gravel:18,bark:19,water:20,windmill:21,trafficZ:22,trafficX:23,droplet:24,canopy:25};
function rgb(col){
  if(colorMap.has(col))return colorMap.get(col);
  let s=col.replace('#','');if(s.length===3)s=[...s].map(c=>c+c).join('');
  const v=parseInt(s,16),a=[(v>>16&255)/255,(v>>8&255)/255,(v&255)/255];colorMap.set(col,a);return a
}
function rotator(o){
  if(!(o.rx||o.ry||o.rz))return v=>v;
  const a=Math.cos(o.rx||0),b=Math.sin(o.rx||0),c=Math.cos(o.ry||0),d=Math.sin(o.ry||0),e=Math.cos(o.rz||0),f=Math.sin(o.rz||0);
  return ([x,y,z])=>{const t=y*a-z*b,u=y*b+z*a,v=x*c+u*d;return [v*e-t*f,v*f+t*e,-x*d+u*c]}
}
class Geometry{
  constructor(seed=7){this.seed=seed;this.data=[];this.glass=[];this.rand=this.rand.bind(this)}
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
  polygon(points,col,o={},norm=null){
    const n=norm||V3.unit(V3.cross(V3.sub(points[1],points[0]),V3.sub(points[2],points[0]))), c=rgb(col), m=matIds[o.mat]||0, glow=o.glow||0;
    const target=m===13?this.glass:this.data;for(let i=1;i<points.length-1;i++)for(const j of [0,i,i+1])target.push(...points[j],...n,...c,m,glow)
  }
  quad(a,b,c,d,col,o={}){this.polygon([a,b,c,d],col,o)}
  box(x,y,z,w,h,d,col,o={}){
    const rot=rotator(o),p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>{const q=rot([v[0]*w*.5,v[1]*h*.5,v[2]*d*.5]);return [q[0]+x,q[1]+y,q[2]+z]});
    for(const face of [[4,5,6,7],[1,0,3,2],[5,1,2,6],[0,4,7,3],[7,6,2,3],[0,1,5,4]])this.polygon(face.map(i=>p[i]),col,o)
  }
  cyl(x,y,z,rt,rb,h,sides,col,o={}){
    const rot=rotator(o),top=[],bottom=[];for(let i=0;i<sides;i++){let a=i*2*Math.PI/sides;for(const [r,dy,arr] of [[rt,h/2,top],[rb,-h/2,bottom]]){const v=rot([Math.cos(a)*r,dy,Math.sin(a)*r]);arr.push([x+v[0],y+v[1],z+v[2]])}}
    if(rt>0)this.polygon([...top].reverse(),col,o);if(rb>0)this.polygon(bottom,col,o);
    for(let i=0;i<sides;i++){const j=(i+1)%sides;if(rt===0)this.polygon([bottom[i],top[j],bottom[j]],col,o);else if(rb===0)this.polygon([bottom[i],top[i],top[j]],col,o);else this.polygon([bottom[i],top[i],top[j],bottom[j]],col,o)}
  }
  ball(x,y,z,w,h,d,col,o={}){
    const sides=8,rings=5,rot=rotator(o),p=(i,j)=>{const a=i*Math.PI*2/sides,b=-Math.PI*.5+j*Math.PI/rings,cb=Math.cos(b),v=rot([w*.5*cb*Math.cos(a),h*.5*Math.sin(b),d*.5*cb*Math.sin(a)]);return [x+v[0],y+v[1],z+v[2]]};
    for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=p(i,j),b=p(i,j+1),c=p(i+1,j+1),d1=p(i+1,j);this.polygon(j===0?[a,b,c]:j===rings-1?[a,b,d1]:[a,b,c,d1],col,o)}
  }
  beam(a,b,r,col,o={}){
    const dir=V3.sub(b,a),len=Math.hypot(...dir);if(!len)return;
    const u=V3.unit(dir),side=V3.unit(V3.cross(u,Math.abs(u[1])>.97?[1,0,0]:[0,1,0])),back=V3.cross(side,u);
    const ring=p=>Array.from({length:6},(_,i)=>p.map((n,k)=>n+r*(side[k]*Math.cos(i*Math.PI/3)+back[k]*Math.sin(i*Math.PI/3))));
    const aa=ring(a),bb=ring(b);for(let i=0;i<6;i++){let j=(i+1)%6;this.quad(aa[i],bb[i],bb[j],aa[j],col,o)}
  }
}
