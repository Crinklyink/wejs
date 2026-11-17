/* Rounded, smooth geometry shares a single interleaved buffer with the city meshes. */
Geometry.prototype.smoothFace=function(a,b,c,d,norm,color,o){
 const col=rgb(color),m=matIds[o.mat]||0,out=m===13?this.glass:this.data;
 for(const k of [0,1,2,0,2,3])out.push(...[a,b,c,d][k],...norm[k],...col,m,o.glow||0)
};
Geometry.prototype.surface=function(rows,cols,fn,color,o={}){
 const pts=Array.from({length:rows+1},(_,i)=>Array.from({length:cols+1},(_,j)=>fn(j/cols,i/rows)));
 const norms=pts.map((row,i)=>row.map((p,j)=>V3.unit(V3.cross(V3.sub(pts[Math.min(rows,i+1)][j],pts[Math.max(i-1,0)][j]),V3.sub(row[Math.min(cols,j+1)],row[Math.max(j-1,0)])))));
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)this.smoothFace(pts[i][j],pts[i+1][j],pts[i+1][j+1],pts[i][j+1],[norms[i][j],norms[i+1][j],norms[i+1][j+1],norms[i][j+1]],color,o)
};
Geometry.prototype.roundBox=function(x,y,z,w,h,d,r,color,o={}){
 r=Math.min(r,w*.475,h*.475,d*.475);if(r<=.001)return this.box(x,y,z,w,h,d,color,o);
 const hlf=[w*.5,h*.5,d*.5],rot=rotator(o),cen=[x,y,z];
 function cuts(e){return [-e,-e+r*.39,-e+r,e-r,e-r*.39,e]}
 for(const [axis,u,v] of [[0,1,2],[1,2,0],[2,0,1]])for(const sign of [-1,1]){
   const a=cuts(hlf[u]),b=cuts(hlf[v]),points=[],norms=[];
   for(const uu of a)for(const vv of b){const p=[0,0,0];p[axis]=hlf[axis]*sign;p[u]=uu;p[v]=vv;
     const base=p.map((q,i)=>bound(q,-hlf[i]+r,hlf[i]-r)),n=V3.unit(V3.sub(p,base)),vec=rot(base.map((q,i)=>q+n[i]*r));points.push(vec.map((q,i)=>q+cen[i]));norms.push(rot(n))}
   for(let i=0;i<a.length-1;i++)for(let j=0;j<b.length-1;j++){const k=i*b.length+j,face=sign>0?[k,k+b.length,k+b.length+1,k+1]:[k,k+1,k+b.length+1,k+b.length];this.smoothFace(...face.map(n=>points[n]),face.map(n=>norms[n]),color,o)}
 }
};
const SURFACE_VERT=`attribute vec3 pos,normal,color;attribute vec2 material;uniform mat4 vp,lightVP,handTransform;uniform float clock,farm,handPass;varying vec3 p,n,c;varying vec2 m;varying vec4 shadowP;
void main(){p=pos;n=normal;m=material;if(farm>.5 && material.x>14.5 && material.x<16.5){float sway=sin(pos.x*.8+pos.z*.36+clock*1.7)+.5*sin(pos.z*.9+clock*2.37);p.x+=.012*sway*clamp(pos.y*2.,0.,2.);p.z+=.007*sway;}
 if(material.x>20.5 && material.x<21.5){vec2 origin=vec2(4.85,3.35);float spin=clock*.43;mat2 rotor=mat2(cos(spin),sin(spin),-sin(spin),cos(spin));p.xy=origin+rotor*(p.xy-origin);n.xy=rotor*n.xy;m.x=4.;}
 if(material.x>21.5 && material.x<22.5){float block=floor((p.z+12.)/24.)*24.;p.z+=mod(block+132.+clock*3.8,264.)-132.-block;m.x=4.;}
 if(material.x>22.5 && material.x<23.5){float block=floor((p.x+12.)/24.)*24.;p.x+=mod(block+132.-clock*3.2,264.)-132.-block;m.x=4.;}
 if(material.x>23.5 && material.x<24.5){float fall=fract(clock*1.85+floor((p.z+.13)*400.)*.279);p.y-=fall*fall*.63;p.x-=fall*.11;p.z-=fall*.15;m.x=20.;}
 if(handPass>.5){p=(handTransform*vec4(p,1.)).xyz;n=mat3(handTransform)*n;}c=color;shadowP=lightVP*vec4(p,1.);gl_Position=vp*vec4(p,1.);}`;
const DEPTH_VERT=`attribute vec3 pos;attribute vec2 material;uniform mat4 vp;varying vec3 dp;varying float dm;void main(){dp=pos;dm=material.x;gl_Position=vp*vec4(pos,1.);}`;
const DEPTH_FRAG=`precision highp float;varying vec3 dp;varying float dm;float canopyMask(vec3 q){q=floor(q*8.5);return fract(sin(dot(q,vec3(12.9898,78.233,31.42)))*43758.5453);}void main(){if(dm>24.5 && canopyMask(dp)<.28)discard;vec4 v=fract(gl_FragCoord.z*vec4(1.,255.,65025.,16581375.));v-=v.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=v;}`;
function perspective(fov,aspect,near,far){const y=1/Math.tan(fov/2);return [y/aspect,0,0,0,0,y,0,0,0,0,(far+near)/(near-far),-1,0,0,2*near*far/(near-far),0]}
const skyDirections=farm=>V3.unit(farm?[-.65,.43,-.59]:[-.70,.22,-.64]);
class Camera {
 constructor(canvas){this.canvas=canvas;this.yaw=.49;this.pitch=-.055;this.x=-1.43;this.z=3.28;this.eyeHeight=1.66;this.fov=70;this.quality=2;this.dirty=true;this.sceneDirty=true;this.clock=0;this.weather=0}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return false;
   const scale=Math.min(this.quality>=3?Math.max(1.6,devicePixelRatio):this.quality>=2?Math.max(1,Math.min(1.5,devicePixelRatio)):0.82,4096/Math.max(h,w));
   this.cssW=w;this.cssH=h;const rw=Math.round(w*scale),rh=Math.round(h*scale);
   if(this.canvas.width!==rw||this.canvas.height!==rh){this.canvas.width=rw;this.canvas.height=rh;this.dirty=true}return true
 }
 camera(){
   const a=this.yaw,t=this.pitch;this.eye=[this.x,this.eyeHeight,this.z];this.forward=[Math.sin(a)*Math.cos(t),Math.sin(t),-Math.cos(a)*Math.cos(t)];this.right=[Math.cos(a),0,Math.sin(a)];this.up=V3.cross(this.right,this.forward);this.aspect=this.cssW/this.cssH;
   this.fovRad=this.fov*Math.PI/180;this.tanHalf=Math.tan(this.fovRad*.5);const view=viewMatrix(this.eye,this.eye.map((n,i)=>n+this.forward[i]));this.vp=matrixMult(perspective(this.fovRad,this.aspect,.095,this.farm?330:32),view);this.cityVP=matrixMult(perspective(this.fovRad,this.aspect,8.5,420),view)
 }
 project(x,y,z){const p=V3.sub([x,y,z],this.eye),depth=V3.dot(p,this.forward);if(depth<=.055)return [-9999,-9999,depth];
   return [(1+V3.dot(p,this.right)/(depth*this.tanHalf*this.aspect))*this.cssW*.5,(1-V3.dot(p,this.up)/(depth*this.tanHalf))*this.cssH*.5,depth]
 }
 setPose(x,z,yaw,pitch,eyeHeight){Object.assign(this,{x,z,yaw,pitch,eyeHeight,dirty:true})}
}
class Renderer extends Camera {
 constructor(canvas){super(canvas);const gl=this.gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL unavailable');
   const compile=(vs,fs)=>{const p=gl.createProgram();for(const [type,src] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p};
   this.main=compile(SURFACE_VERT,SURFACE_FRAG);this.depth=compile(DEPTH_VERT,DEPTH_FRAG);this.sky=compile(SKY_VERT,SKY_FRAG);
   const info=p=>Object.fromEntries(['pos','normal','color','material','vp','lightVP','eye','lightDir','clock','farm','weather','shadowOn','shadowTex','camForward','camRight','camUp','tanHalf','aspect','handTransform','handPass','reflectReady','viewSize','captureFloor','glassBack','glassSide','woodFloor'].map((k,i)=>[k,i<4?gl.getAttribLocation(p,k):gl.getUniformLocation(p,k)]));
   this.mi=info(this.main);this.di=info(this.depth);this.si=info(this.sky);this.full=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.full);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   this.frame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.frame);this.ssize=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),2048);
   this.shadow=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,this.ssize,this.ssize,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
   for(const k of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
   gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.shadow,0);this.db=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this.db);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,this.ssize,this.ssize);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.db);this.hasShadow=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
   this.available=['pos','normal','color','material'];this.staticMeshes=[];this.glassMeshes=[]
 }
 mesh(data){if(!data?.length)return null;const gl=this.gl,b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer:b,count:data.length/11}}
 build(farm,plots,story={}){
   this.farm=farm;this.refKey='';const gl=this.gl;for(const m of [...this.staticMeshes,...this.glassMeshes])if(m)gl.deleteBuffer(m.buffer);this.staticMeshes=[];this.glassMeshes=[];
   if(!farm){let g=new Geometry(543);buildCity(g);this.staticMeshes.push(this.mesh(g.data))}
   let g=new Geometry(farm?43291:183);if(farm)buildFarm(g,plots,story);else{buildPenthouse(g);addWindowGlass(g)}
   this.local=this.mesh(g.data);this.staticMeshes.push(this.local);this.glassMeshes.push(this.mesh(g.glass));this.dir=skyDirections(farm);
   const shadowRadius=farm?27:11.5;this.lightVP=matrixMult(ortho(shadowRadius,shadowRadius,.1,135),viewMatrix(this.dir.map(x=>x*62),[0,0,0]));this.sceneDirty=this.dirty=true
 }
 draw(mesh,i){if(!mesh)return;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
   for(const [k,size,offset] of [['pos',3,0],['normal',3,12],['color',3,24],['material',2,36]])if(i[k]>=0){gl.enableVertexAttribArray(i[k]);gl.vertexAttribPointer(i[k],size,gl.FLOAT,false,44,offset)}gl.drawArrays(gl.TRIANGLES,0,mesh.count);for(const k of this.available)if(i[k]>=0)gl.disableVertexAttribArray(i[k])
 }
 common(i){const gl=this.gl;gl.uniform1f(i.farm,this.farm?1:0);gl.uniform1f(i.clock,this.clock);gl.uniform1f(i.weather,this.weather);gl.uniform3fv(i.lightDir,this.dir)}
  prepareReflections(){
   const gl=this.gl,w=Math.min(960,Math.max(64,Math.round(this.canvas.width*.42))),h=Math.min(700,Math.max(64,Math.round(this.canvas.height*.42)));
   if(this.refBuffers?.[0]?.w===w&&this.refBuffers[0].h===h)return;
   for(const a of this.refBuffers||[]){gl.deleteFramebuffer(a.fb);gl.deleteTexture(a.tex);gl.deleteRenderbuffer(a.depth)}
   this.refBuffers=[0,1,2].map(()=>{const fb=gl.createFramebuffer(),tex=gl.createTexture(),depth=gl.createRenderbuffer();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);for(const k of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
     gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);return {fb,tex,depth,w,h,ok:gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE}});
   gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.refKey=''
  }
  reflections(){
   if(this.farm||this.quality<2)return false;this.prepareReflections();if(!this.refBuffers.every(a=>a.ok))return false;
   const key=[...this.eye,this.yaw,this.pitch,this.fov,this.cssW,this.cssH].join(',');if(key===this.refKey)return true;
   this.refKey=key;const gl=this.gl,i=this.mi;gl.useProgram(this.main);this.common(i);gl.uniform1f(i.reflectReady,0);gl.uniform1f(i.handPass,0);gl.uniform1f(i.shadowOn,this.hasShadow?1:0);gl.uniformMatrix4fv(i.lightVP,false,this.lightVP);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(i.shadowTex,0);
   for(const [j,k] of ['glassBack','glassSide','woodFloor'].entries()){gl.activeTexture(gl.TEXTURE1+j);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(i[k],j+1)}
   const planes=[[2,-4.57],[0,-6.39],[1,.032]];
   for(let j=0;j<3;j++){const a=this.refBuffers[j],[axis,loc]=planes[j],eye=this.eye.slice(),reflection=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];reflection[axis*5]=-1;reflection[12+axis]=2*loc;eye[axis]=2*loc-eye[axis];
     gl.bindFramebuffer(gl.FRAMEBUFFER,a.fb);gl.viewport(0,0,a.w,a.h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.uniform1f(i.captureFloor,j===2?1:0);gl.uniform3fv(i.eye,eye);gl.uniformMatrix4fv(i.vp,false,matrixMult(this.vp,reflection));this.draw(this.local,i)}
   gl.uniform1f(i.captureFloor,0);gl.activeTexture(gl.TEXTURE0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);return true
  }

 render(){
   if(!this.resize()||!this.dirty)return false;this.camera();const gl=this.gl;
   if(this.sceneDirty&&this.hasShadow){gl.bindFramebuffer(gl.FRAMEBUFFER,this.frame);gl.viewport(0,0,this.ssize,this.ssize);gl.enable(gl.DEPTH_TEST);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.depth);gl.uniformMatrix4fv(this.di.vp,false,this.lightVP);this.draw(this.local,this.di);this.sceneDirty=false}
   const reflectOn=this.reflections();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.useProgram(this.sky);const s=this.si;this.common(s);gl.uniform3fv(s.camForward,this.forward);gl.uniform3fv(s.camRight,this.right);gl.uniform3fv(s.camUp,this.up);gl.uniform1f(s.tanHalf,this.tanHalf);gl.uniform1f(s.aspect,this.aspect);gl.bindBuffer(gl.ARRAY_BUFFER,this.full);gl.enableVertexAttribArray(s.pos);gl.vertexAttribPointer(s.pos,2,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,3);gl.disableVertexAttribArray(s.pos);
   gl.enable(gl.DEPTH_TEST);gl.useProgram(this.main);const i=this.mi;this.common(i);gl.uniformMatrix4fv(i.vp,false,this.vp);gl.uniformMatrix4fv(i.lightVP,false,this.lightVP);gl.uniform3fv(i.eye,this.eye);gl.uniform1f(i.handPass,0);gl.uniform1f(i.reflectReady,reflectOn?1:0);gl.uniform1f(i.captureFloor,0);gl.uniform2f(i.viewSize,this.canvas.width,this.canvas.height);for(const [j,name] of ['glassBack','glassSide','woodFloor'].entries()){gl.activeTexture(gl.TEXTURE1+j);gl.bindTexture(gl.TEXTURE_2D,reflectOn?this.refBuffers[j].tex:this.shadow);gl.uniform1i(i[name],j+1)}gl.uniform1f(i.shadowOn,this.hasShadow?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(i.shadowTex,0);
   if(!this.farm){gl.uniformMatrix4fv(i.vp,false,this.cityVP);this.draw(this.staticMeshes[0],i);gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(i.vp,false,this.vp)}this.draw(this.local,i);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);for(const m of this.glassMeshes)this.draw(m,i);gl.depthMask(true);gl.disable(gl.BLEND);
   if(this.effect&&this.actionMesh){if(performance.now()-this.effect.start<this.effect.length){gl.clear(gl.DEPTH_BUFFER_BIT);gl.uniform1f(i.handPass,1);gl.uniformMatrix4fv(i.handTransform,false,handMatrix(this,this.effect));this.draw(this.actionMesh,i);gl.uniform1f(i.handPass,0)}else{gl.deleteBuffer(this.actionMesh.buffer);this.actionMesh=null;this.effect=null}}
   this.dirty=false;return true
 }
}
function addWindowGlass(g){
 const o={mat:'glass'};g.quad([-6.29,.18,-4.57],[6.31,.18,-4.57],[6.31,3.50,-4.57],[-6.29,3.50,-4.57],'#a4c0c8',o);
 g.quad([-6.39,.18,4.54],[-6.39,.18,-4.56],[-6.39,3.50,-4.56],[-6.39,3.50,4.54],'#a4c0c8',o)
}
function handMatrix(r,e){
 const t=bound((performance.now()-e.start)/e.length,0,1),action=e.action,reach=Math.sin(Math.PI*t),sw=Math.sin(Math.PI*Math.min(1,t*1.45)),lift=Math.min(1,t*5,(1-t)*5);
 const ox=.33-.065*reach,oy=-.69+.35*lift+(action==='coffee'?.12:0)*reach,oz=-.51-.11*reach;
 const rx=action==='plant'?-.55*sw+.8*reach:action==='coffee'?.48*reach:-.12*reach;
 const rz=action==='water'?.62*reach:action==='harvest'?-.18*reach:.03;const rot=rotator({rx,rz});
 const convert=(v,translate=false)=>r.right.map((n,i)=>n*v[0]+r.up[i]*v[1]-r.forward[i]*v[2]+(translate?r.eye[i]:0));
 const tr=convert([ox,oy,oz],true);return new Float32Array([...convert(rot([1,0,0])),0,...convert(rot([0,1,0])),0,...convert(rot([0,0,1])),0,...tr,1])
}
function performAction(name,crop){
 closeDialog();soundscape.cue(name);
 if(renderer&&!renderer.isSoftware){
   const g=new Geometry(22);buildHandProp(g,name,crop);if(name==='water')for(let j=0;j<48;j++)g.ball(-.20+g.rand()*.023,.056+g.rand()*.018,-.083+j*.0009,.0037,.013,.0037,'#89b8ca',{mat:'droplet',glow:.30});const gl=renderer.gl;
   if(renderer.actionMesh)gl.deleteBuffer(renderer.actionMesh.buffer);
   renderer.actionMesh=renderer.mesh(g.data);renderer.effect={action:name,start:performance.now(),length:name==='water'?1700:1250};renderer.dirty=true
 }
}

