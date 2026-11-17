/* Software triangle renderer for browsers with graphics acceleration disabled.
   The static environment keeps a color and depth buffer between character frames. */
class SoftwareRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:true});this.angle=.655;this.elev=.51;this.zoom=1;this.quality=1;this.dirty=true;this.sceneDirty=true;this.cacheKey=''}
 mesh(g){return new Float32Array(g.data)}
 drop(){}
 build(farm,plots){this.farm=farm;let g=new Geometry(farm?43291:543);if(farm){buildFarm(g,plots);this.back=null}else{buildCity(g);this.back=this.mesh(g);g=new Geometry(183);buildPenthouse(g)}this.place=this.mesh(g);this.dir=V3.unit(farm?[-.58,1,.42]:[-.35,1,.65]);this.sceneDirty=this.dirty=true}
 avatar(...args){Renderer.prototype.avatar.apply(this,args)}
 camera(){Renderer.prototype.camera.call(this)}
 project(...p){return Renderer.prototype.project.apply(this,p)}
 ground(...p){return Renderer.prototype.ground.apply(this,p)}
 raster(data,rgba,depth,clip=null){
   if(!data)return;const w=this.canvas.width,h=this.canvas.height,R=this.right,U=this.up,F=this.forward,sx=w/(2*this.halfW),sy=h/(2*this.halfH),oy=h*.5+this.target[1]*U[1]*sy,ox=w*.5,L=this.dir,fc=this.farm?[.74,.77,.68]:[.33,.35,.49],lim=clip||[0,0,w-1,h-1];
   for(let j=0;j<data.length;j+=33){
     const nx=data[j+3],ny=data[j+4],nz=data[j+5];if(nx*F[0]+ny*F[1]+nz*F[2]<-.001)continue;
     const x=data[j],y=data[j+1],z=data[j+2],x1=data[j+11],y1=data[j+12],z1=data[j+13],x2=data[j+22],y2=data[j+23],z2=data[j+24];
     const ax=ox+(x*R[0]+z*R[2])*sx,ay=oy-(x*U[0]+y*U[1]+z*U[2])*sy,bx=ox+(x1*R[0]+z1*R[2])*sx,by=oy-(x1*U[0]+y1*U[1]+z1*U[2])*sy,cx=ox+(x2*R[0]+z2*R[2])*sx,cy=oy-(x2*U[0]+y2*U[1]+z2*U[2])*sy;
     const left=Math.max(lim[0],Math.ceil(Math.min(ax,bx,cx)-.5)),right=Math.min(lim[2],Math.floor(Math.max(ax,bx,cx)-.5)),top=Math.max(lim[1],Math.ceil(Math.min(ay,by,cy)-.5)),bottom=Math.min(lim[3],Math.floor(Math.max(ay,by,cy)-.5));
     if(left>right||top>bottom)continue;const inv=1/((by-cy)*(ax-cx)+(cx-bx)*(ay-cy));if(!Number.isFinite(inv))continue;
     const zA=x*F[0]+y*F[1]+z*F[2],zB=x1*F[0]+y1*F[1]+z1*F[2],zC=x2*F[0]+y2*F[1]+z2*F[2],da=(by-cy)*inv,db=(cy-ay)*inv,ea=(cx-bx)*inv,eb=(ax-cx)*inv,delta=da*(zA-zC)+db*(zB-zC);
     const di=Math.max(0,nx*L[0]+ny*L[1]+nz*L[2]),amb=.82+.18*ny,glow=data[j+10],fd=bound((Math.hypot((x+x1+x2)/3,(z+z1+z2)/3)-10)/95,0,1),fog=fd*fd*(3-2*fd)*.84;
     let col=0xff000000;for(let k=0;k<3;k++){const c=data[j+6+k],light=(this.farm?[.77,.81,.84]:[.68,.69,.82])[k]*amb+(this.farm?[.46,.38,.26]:[.57,.38,.26])[k]*di;
       col|=bound(Math.round(((c*light*(1-glow)+c*(1.06+.14*glow)*glow)*(1-fog)+fc[k]*fog)*255),0,255)<<(8*k)}
     for(let py=top;py<=bottom;py++){
       let a=da*(left+.5-cx)+ea*(py+.5-cy),b=db*(left+.5-cx)+eb*(py+.5-cy),zz=zC+a*(zA-zC)+b*(zB-zC),idx=py*w+left;
       for(let px=left;px<=right;px++,idx++,a+=da,b+=db,zz+=delta){if(a>=-.00001&&b>=-.00001&&a+b<=1.00001&&zz>=depth[idx]){depth[idx]=zz;rgba[idx]=col}}
     }
   }
 }
 render(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return false;const scale=Math.min(1.5,this.quality,devicePixelRatio||1,1800/Math.max(r.width,r.height)),w=Math.max(1,Math.round(r.width*scale)),h=Math.max(1,Math.round(r.height*scale));this.cssW=r.width;this.cssH=r.height;
   const key=[w,h,this.angle,this.elev,this.zoom].join('/');if(!this.dirty&&key===this.cacheKey)return false;this.camera();
   if(this.sceneDirty||key!==this.cacheKey){this.canvas.width=w;this.canvas.height=h;this.base=new Uint32Array(w*h);this.z=new Float32Array(w*h);this.z.fill(-Infinity);this.raster(this.back,this.base,this.z);this.raster(this.place,this.base,this.z);this.img=this.ctx.createImageData(w,h);this.rgba=new Uint32Array(this.img.data.buffer);this.depth=new Float32Array(w*h);this.cacheKey=key;this.sceneDirty=false}
   this.rgba.set(this.base);this.depth.set(this.z);this.raster(this.person,this.rgba,this.depth);this.ctx.putImageData(this.img,0,0);this.dirty=false;return true
 }
}
