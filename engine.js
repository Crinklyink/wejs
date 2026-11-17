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
const colorMap=new Map(), matIds={plain:0,wood:1,fabric:2,stone:3,metal:4};
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
  constructor(seed=7){this.seed=seed;this.data=[];this.rand=this.rand.bind(this)}
  rand(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296}
  polygon(points,col,o={},norm=null){
    const n=norm||V3.unit(V3.cross(V3.sub(points[1],points[0]),V3.sub(points[2],points[0]))), c=rgb(col), m=matIds[o.mat]||0, glow=o.glow||0;
    for(let i=1;i<points.length-1;i++)for(const j of [0,i,i+1])this.data.push(...points[j],...n,...c,m,glow)
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
const MAIN_VERT=`attribute vec3 pos,normal,color;attribute vec2 material;uniform mat4 vp,lightVP;varying vec3 p,n,c;varying vec2 m;varying vec4 shadowP;
void main(){p=pos;n=normal;c=color;m=material;shadowP=lightVP*vec4(pos,1.);gl_Position=vp*vec4(pos,1.);}`;
const MAIN_FRAG=`precision highp float;
varying vec3 p,n,c;varying vec2 m;varying vec4 shadowP;uniform sampler2D shadowTex;uniform vec3 lightDir,fogColor;uniform float farm,shadowOn;
float hash(vec2 a){return fract(sin(dot(a,vec2(12.9898,78.233)))*43758.5453);}
float occ(vec3 v){if(v.x<0.002||v.x>.998||v.y<.002||v.y>.998||v.z<0.||v.z>1.)return 1.;float lit=0.;for(int i=-1;i<=1;i++){for(int j=-1;j<=1;j++){vec4 t=texture2D(shadowTex,v.xy+vec2(float(i),float(j))*.00078);float depth=dot(t,vec4(1.,1./255.,1./65025.,1./16581375.));lit+=step(v.z-.00115,depth);}}return lit/9.;}
void main(){
 vec3 N=normalize(n);float diffuse=max(0.,dot(N,lightDir));float sh=shadowOn>.5?occ(shadowP.xyz*.5+.5):1.;
 vec3 ambient=mix(vec3(.68,.69,.82),vec3(.77,.81,.84),farm)*(.82+.18*N.y);
 vec3 lum=ambient+mix(vec3(.57,.38,.26),vec3(.46,.38,.26),farm)*diffuse*(.18+.82*sh);
 float grain=1.;if(m.x>.5&&m.x<1.5){grain=.97+.027*sin(p.x*9.+p.z*54.+sin(p.x*4.)*1.8)+.018*sin(p.z*124.+p.x*7.);}
 if(m.x>1.5&&m.x<3.5){grain=.986+.026*hash(floor(vec2(p.x+p.z*.61,p.y+p.z*.73)*70.));}
 vec3 outColor=c*lum*grain;
 if(farm<.5){float pool=exp(-.37*dot(p.xz-vec2(-4.9,-2.6),p.xz-vec2(-4.9,-2.6)))+exp(-.44*dot(p.xz-vec2(4.,-3.),p.xz-vec2(4.,-3.)));outColor+=c*vec3(.25,.105,.02)*pool*step(-.1,p.y);}
 outColor=mix(outColor,c*(1.06+.14*m.y),clamp(m.y,0.,1.));
 float dist=length(p.xz);float fog=smoothstep(10.,105.,dist)*mix(.84,.85,farm);outColor=mix(outColor,fogColor,fog);
 gl_FragColor=vec4(outColor,1.);
}`;
const DEPTH_VERT=`attribute vec3 pos;uniform mat4 vp;void main(){gl_Position=vp*vec4(pos,1.);}`;
const DEPTH_FRAG=`precision highp float;void main(){vec4 v=fract(gl_FragCoord.z*vec4(1.,255.,65025.,16581375.));v-=v.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=v;}`;
class Renderer{
  constructor(canvas){
    this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{antialias:true,alpha:true,powerPreference:'high-performance',premultipliedAlpha:false});if(!gl)throw Error('WebGL unavailable');
    const program=(v,f)=>{const p=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p};
    this.main=program(MAIN_VERT,MAIN_FRAG);this.depth=program(DEPTH_VERT,DEPTH_FRAG);
    const info=p=>Object.fromEntries(['pos','normal','color','material','vp','lightVP','lightDir','farm','fogColor','shadowTex','shadowOn'].map((k,i)=>[k,i<4?gl.getAttribLocation(p,k):gl.getUniformLocation(p,k)]));this.mi=info(this.main);this.di=info(this.depth);
    this.frame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.frame);
    this.shadow=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadow);this.ssize=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE));gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.ssize,this.ssize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.NEAREST);
    for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.shadow,0);
    this.db=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this.db);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,this.ssize,this.ssize);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.db);this.hasShadow=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);
    this.angle=.655;this.elev=.51;this.zoom=1;this.quality=1.5;this.dirty=true;this.sceneDirty=true;this.enabled=[];
  }
  mesh(g,old){const gl=this.gl, buf=old?.buf||gl.createBuffer(),data=new Float32Array(g.data);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {buf,count:data.length/11}}
  drop(m){if(m)this.gl.deleteBuffer(m.buf)}
  drawMesh(mesh,info){if(!mesh)return;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buf);for(const [k,size,offset] of [['pos',3,0],['normal',3,12],['color',3,24],['material',2,36]]){const id=info[k];if(id<0)continue;gl.enableVertexAttribArray(id);gl.vertexAttribPointer(id,size,gl.FLOAT,false,44,offset);this.enabled.push(id)}gl.drawArrays(gl.TRIANGLES,0,mesh.count);for(const i of this.enabled)gl.disableVertexAttribArray(i);this.enabled.length=0}
  build(farm,plots){
    this.farm=farm;this.drop(this.back);this.drop(this.place);this.back=null;
    if(!farm){let g=new Geometry(543);buildCity(g);this.back=this.mesh(g)}
    let g=new Geometry(farm?43291:183);if(farm)buildFarm(g,plots);else buildPenthouse(g);this.place=this.mesh(g);
    this.dir=V3.unit(farm?[-.58,1,.42]:[-.35,1,.65]);this.lightVP=matrixMult(ortho(12,12,1,80),viewMatrix(this.dir.map(n=>n*34),[0,0,0]));this.sceneDirty=this.dirty=true
  }
  avatar(x,z,yaw,phase,walk){
    const g=new Geometry(),stride=walk?Math.sin(phase)*.12:0,bob=walk?Math.abs(Math.cos(phase))*.034:0;
    const part=(dx,y,dz,w,h,d,c,o={})=>{let co=Math.cos(yaw),si=Math.sin(yaw);g.box(x+dx*co+dz*si,y+bob,z-dx*si+dz*co,w,h,d,c,{...o,ry:yaw})};
    for(const side of [-1,1]){const step=stride*side;part(side*.105,.29,step,.15,.44,.16,'#29384a');part(side*.105,.097,step+.036,.185,.12,.27,'#26242d');part(side*.105,.053,step+.036,.19,.035,.28,'#c4baa6')}
    part(0,.69,0,.43,.43,.25,'#a85d31');part(0,.77,.126,.12,.28,.013,'#e4cc9d');part(0,.515,0,.38,.07,.235,'#573a36');for(const side of [-1,1]){part(side*.256,.73,-stride*side,.135,.28,.19,'#ca8041');part(side*.256,.54,-stride*side,.114,.13,.15,'#d49b72')}
    part(0,.94,0,.15,.12,.16,'#c58d6a');part(0,1.105,0,.32,.31,.285,'#d9a982');part(0,1.23,-.018,.335,.111,.305,'#342b30');part(-.13,1.145,-.008,.06,.15,.28,'#342b30');part(.12,1.17,-.03,.07,.13,.21,'#342b30');part(0,1.155,-.13,.32,.14,.05,'#342b30');
    for(const s of [-1,1])part(s*.079,1.117,.146,.037,.036,.019,'#3d3439');this.person=this.mesh(g,this.person);this.dirty=true;if(this.gl)this.sceneDirty=true
  }
  resize(){let r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const minimum=this.quality>=3?2:this.quality>=2?1.25:1;
    let scale=Math.min(this.quality,Math.max(minimum,window.devicePixelRatio||1),4096/Math.max(r.width,r.height));const w=Math.round(r.width*scale),h=Math.round(r.height*scale);
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.dirty=true}this.cssW=r.width;this.cssH=r.height
  }
  camera(){const a=this.angle,e=this.elev;this.target=[0,this.farm?1.1:1.48,0];const d=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];this.eye=this.target.map((v,i)=>v+d[i]*67);this.right=[Math.cos(a),0,-Math.sin(a)];this.up=V3.cross(d,this.right);this.forward=d;
    const aspect=this.cssW/this.cssH;this.halfH=Math.max(7.5,(aspect<.8?8.5:9.7)/aspect)/this.zoom;this.halfW=this.halfH*aspect;this.vp=matrixMult(ortho(this.halfW,this.halfH,.1,240),viewMatrix(this.eye,this.target))
  }
  project(x,y,z){const p=[x,y,z],v=V3.sub(p,this.target);return [(V3.dot(v,this.right)/this.halfW+1)*this.cssW*.5,(1-V3.dot(v,this.up)/this.halfH)*this.cssH*.5]}
  ground(px,py){const sx=(2*px/this.cssW-1)*this.halfW,sy=(1-2*py/this.cssH)*this.halfH,p=this.target.map((v,i)=>v+this.right[i]*sx+this.up[i]*sy);return [p[0]-p[1]*this.forward[0]/this.forward[1],p[2]-p[1]*this.forward[2]/this.forward[1]]}
  render(){this.resize();if(!this.dirty)return false;this.camera();const gl=this.gl;
    if(this.sceneDirty&&this.hasShadow){gl.bindFramebuffer(gl.FRAMEBUFFER,this.frame);gl.viewport(0,0,this.ssize,this.ssize);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.depth);gl.uniformMatrix4fv(this.di.vp,false,this.lightVP);this.drawMesh(this.place,this.di);this.drawMesh(this.person,this.di);this.sceneDirty=false}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.main);const i=this.mi;gl.uniformMatrix4fv(i.vp,false,this.vp);gl.uniformMatrix4fv(i.lightVP,false,this.lightVP);gl.uniform3fv(i.lightDir,this.dir);gl.uniform1f(i.farm,this.farm?1:0);gl.uniform3fv(i.fogColor,this.farm?[.74,.77,.68]:[.33,.35,.49]);gl.uniform1f(i.shadowOn,this.hasShadow?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(i.shadowTex,0);
    this.drawMesh(this.back,i);this.drawMesh(this.place,i);this.drawMesh(this.person,i);this.dirty=false;return true
  }
}
