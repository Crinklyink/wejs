/* A perspective, depth-buffered triangle rasterizer for devices without WebGL.
   It consumes the same 3D geometry and camera as the hardware renderer. */
class SoftwareRenderer extends Camera{
 constructor(canvas){super(canvas);this.ctx=canvas.getContext('2d',{alpha:false});this.meshes=[];this.isSoftware=true;this.frameCount=0}
 build(farm,plots,story={}){
   this.farm=farm;this.meshes=[];this.dir=skyDirections(farm);
   if(!farm){let g=new Geometry(543);buildCity(g);this.meshes.push(g.data.packed())}
   let g=new Geometry(farm?43291:183);if(farm)buildFarm(g,plots,story);else buildPenthouse(g);this.meshes.push(g.data.packed());this.dirty=true
 }
 updatePanels(stocks){if(this.farm)return;const g=new Geometry(81);buildPanelContent(g,stocks);this.meshes[2]=g.data.packed();this.dirty=true}
 drawTriangle(a,b,c,col,w,h){
   const sx=h/(2*this.tanHalf),ax=w/2+a[0]*sx/a[2],ay=h/2-a[1]*sx/a[2],bx=w/2+b[0]*sx/b[2],by=h/2-b[1]*sx/b[2],cx=w/2+c[0]*sx/c[2],cy=h/2-c[1]*sx/c[2];
   const l=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),r=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.5)),t=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),bt=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.5));if(l>r||t>bt)return;
   const det=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(det)<.001)return;const da=(by-cy)/det,db=(cy-ay)/det,ea=(cx-bx)/det,eb=(ax-cx)/det,za=1/a[2],zb=1/b[2],zc=1/c[2],dz=da*(za-zc)+db*(zb-zc);
   for(let j=t;j<=bt;j++){let u=da*(l+.5-cx)+ea*(j+.5-cy),v=db*(l+.5-cx)+eb*(j+.5-cy),depth=zc+u*(za-zc)+v*(zb-zc),k=j*w+l;for(let i=l;i<=r;i++,k++,u+=da,v+=db,depth+=dz)if(u>=-.00001&&v>=-.00001&&u+v<=1.00001&&depth>this.zbuf[k]){this.zbuf[k]=depth;this.pixels[k]=col}}
 }
 render(){
   const w0=this.canvas.clientWidth,h0=this.canvas.clientHeight;if(!w0||!h0)return false;
   const scale=Math.min(1,1080/w0,780/h0),w=Math.max(1,Math.round(w0*scale)),h=Math.max(1,Math.round(h0*scale));this.cssW=w0;this.cssH=h0;
   if(this.canvas.width!==w||this.canvas.height!==h||!this.pic){this.canvas.width=w;this.canvas.height=h;this.pic=this.ctx.createImageData(w,h);this.pixels=new Uint32Array(this.pic.data.buffer);this.zbuf=new Float32Array(w*h);this.dirty=true}if(!this.dirty)return false;
   this.camera();this.zbuf.fill(0);const F=this.forward,R=this.right,U=this.up,E=this.eye,dir=this.dir;
   const top=this.farm?[93,140,163]:[51,75,114],bottom=this.farm?[244,211,155]:[239,169,130];for(let y=0;y<h;y++){const f=bound((1-(F[1]+(1-2*y/h)*this.tanHalf*U[1])*2),0,1);const v=bottom.map((q,i)=>Math.round(top[i]*(1-f)+q*f));this.pixels.fill((0xff000000|v[0]|v[1]<<8|v[2]<<16)>>>0,y*w,(y+1)*w)}
   const toCam=(x,y,z)=>{const a=x-E[0],b=y-E[1],c=z-E[2];return [a*R[0]+c*R[2],a*U[0]+b*U[1]+c*U[2],a*F[0]+b*F[1]+c*F[2]]};
   const near=.065,side=this.tanHalf*this.aspect,vert=this.tanHalf;
   let hand=null;
   if(this.effect&&this.actionMesh){if(performance.now()-this.effect.start<this.effect.length)hand=handMatrix(this,this.effect);else{this.effect=null;this.actionMesh=null}}
   const buffers=hand?[...this.meshes,this.actionMesh]:this.meshes;
   for(const data of buffers){const held=hand&&data===this.actionMesh;if(held)this.zbuf.fill(0);
   const project=held?(x,y,z)=>toCam(hand[0]*x+hand[4]*y+hand[8]*z+hand[12],hand[1]*x+hand[5]*y+hand[9]*z+hand[13],hand[2]*x+hand[6]*y+hand[10]*z+hand[14]):toCam;
   for(let j=0;j<data.length;j+=33){
     const a=project(data[j],data[j+1],data[j+2]),b=project(data[j+11],data[j+12],data[j+13]),c=project(data[j+22],data[j+23],data[j+24]);if(a[2]<near&&b[2]<near&&c[2]<near)continue;
     if(a[0]>side*a[2]&&b[0]>side*b[2]&&c[0]>side*c[2]||a[0]<-side*a[2]&&b[0]<-side*b[2]&&c[0]<-side*c[2]||a[1]>vert*a[2]&&b[1]>vert*b[2]&&c[1]>vert*c[2]||a[1]<-vert*a[2]&&b[1]<-vert*b[2]&&c[1]<-vert*c[2])continue;
     const nx=data[j+3],ny=data[j+4],nz=data[j+5],n=held?[hand[0]*nx+hand[4]*ny+hand[8]*nz,hand[1]*nx+hand[5]*ny+hand[9]*nz,hand[2]*nx+hand[6]*ny+hand[10]*nz]:[nx,ny,nz],di=Math.max(0,V3.dot(dir,n)),amb=.69+.14*n[1],em=data[j+10],fd=bound(((a[2]+b[2]+c[2])/3-28)/250,0,.55),fog=this.farm?[.75,.79,.74]:[.65,.62,.69];let col=0xff000000;
     for(let i=0;i<3;i++){const k=data[j+i+6],v=k*(amb+[.57,.37,.22][i]*di);col|=bound(Math.round(((v*(1-em)+k*1.12*em)*(1-fd)+fog[i]*fd)*255),0,255)<<(i*8)}
     if(a[2]>=near&&b[2]>=near&&c[2]>=near)this.drawTriangle(a,b,c,col,w,h);
     else{const vs=[a,b,c],out=[];for(let k=0;k<3;k++){const p=vs[k],q=vs[(k+1)%3];if(p[2]>=near)out.push(p);if((p[2]>=near)!==(q[2]>=near)){const rat=(near-p[2])/(q[2]-p[2]);out.push([p[0]+(q[0]-p[0])*rat,p[1]+(q[1]-p[1])*rat,near])}}for(let k=1;k<out.length-1;k++)this.drawTriangle(out[0],out[k],out[k+1],col,w,h)}
   }
   }this.ctx.putImageData(this.pic,0,0);this.dirty=false;return true
 }
}
