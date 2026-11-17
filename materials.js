// GPU-generated surface finishes, lighting, atmosphere and cloud layers.
// Geometry colours are authored in sRGB. Surface lighting is accumulated in linear light.
const [SURFACE_FRAG, SKY_VERT, SKY_FRAG] = (() => {
  const atmosphere = `
precision highp float;
uniform vec3 lightDir;
uniform float farm, weather, clock;
float saturate(float v) { return clamp(v, 0.0, 1.0); }
float hash2(vec2 p0) {
  vec3 a = fract(vec3(p0.xyx) * vec3(.1031,.1030,.0973));
  a += dot(a,a.yzx + 33.33);
  return fract((a.x+a.y)*a.z);
}
float noise2(vec2 xy) {
  vec2 k=floor(xy), f=fract(xy);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash2(k),hash2(k+vec2(1.,0.)),f.x),
             mix(hash2(k+vec2(0.,1.)),hash2(k+vec2(1.)),f.x),f.y);
}
vec3 horizonColor(vec3 ray, vec3 sun) {
  vec2 h = normalize(ray.xz + vec2(.00003,.00001));
  vec2 s = normalize(sun.xz + vec2(.00001,.00003));
  float facing = saturate(dot(h,s)*.5+.5);
  float bloom = pow(facing,3.5);
  vec3 cool = mix(vec3(.56,.57,.69),vec3(.75,.79,.80),farm);
  vec3 peach = mix(vec3(1.00,.61,.39),vec3(1.00,.81,.54),farm);
  vec3 horizon = mix(cool,peach,.12+.88*bloom);
  return mix(horizon,vec3(.68,.70,.73),saturate(weather)*.66);
}
vec3 skyBase(vec3 ray, vec3 sun) {
  float altitude = saturate(ray.y);
  vec3 rim = horizonColor(ray,sun);
  vec3 mid = mix(vec3(.39,.48,.66),vec3(.59,.74,.81),farm);
  vec3 zen = mix(vec3(.15,.24,.42),vec3(.28,.51,.69),farm);
  float w=saturate(weather);
  mid=mix(mid,vec3(.55,.62,.70),w*.55);
  zen=mix(zen,vec3(.41,.49,.60),w*.60);
  vec3 upper = mix(mid,zen,smoothstep(.10,1.00,altitude));
  vec3 sky = mix(rim,upper,1.0-exp(-altitude*4.7));
  float sep=max(0.,1.0-dot(ray,sun));
  sky += vec3(.20,.112,.044)*exp(-sep*7.5)*(1.-w*.71);
  sky += vec3(.16,.105,.040)*exp(-sep*65.)*(1.-w*.84);
  return mix(sky,rim*vec3(.77,.78,.84),smoothstep(.02,.56,-ray.y));
}
vec3 displayColor(vec3 hdr) {
  hdr=max(hdr,vec3(0.));
  vec3 mapped=hdr*(1.+.17*hdr)/(1.+.52*hdr);
  vec3 display=pow(mapped,vec3(1./2.15));
  float luma=dot(display,vec3(.2126,.7152,.0722));
  // A gentle film toe holds the black point in shade while keeping a soft
  // shoulder on pale bedding, sunlit grass and frosted lamp shades.
  display*=mix(.76,1.038,smoothstep(.10,.80,luma));
  return clamp(mix(vec3(dot(display,vec3(.2126,.7152,.0722))),display,1.075),0.,1.);
}
`;
  const surface = atmosphere + `
varying vec3 p,n,c;
varying vec2 m;
varying vec4 shadowP;
uniform vec3 eye;
uniform sampler2D shadowTex;
uniform float shadowOn;
uniform sampler2D glassBack,glassSide,woodFloor;
uniform vec2 viewSize;
uniform float reflectReady,captureFloor;

float rectOcclusion(vec2 at,vec2 center,vec2 halfSize,float spread) {
  vec2 d=abs(at-center)-halfSize;
  float outside=length(max(d,vec2(0.)));
  return 1.-smoothstep(0.,spread,outside);
}
float castShadow(vec3 geometricN,vec3 sun) {
  if(shadowOn<.5||shadowP.w<=.0001) return 1.;
  vec3 coord=shadowP.xyz/shadowP.w*.5+.5;
  if(coord.x<.0016||coord.y<.0016||coord.z<.002||
     coord.x>.9984||coord.y>.9984||coord.z>.998) return 1.;
  float bias=.00040+.00118*(1.-saturate(dot(geometricN,sun)));
  float value=0.;
  for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) {
    vec2 texel=vec2(float(x),float(y))*.00066;
    float depth=dot(texture2D(shadowTex,coord.xy+texel),vec4(1.,1./255.,1./65025.,1./16581375.));
    value+=step(coord.z-bias,depth);
  }
  return value/9.;
}

// Roughness is perceptual. Smith masking and Schlick Fresnel prevent implausible
// unbounded mirror highlights on grazing-angle eye rays.
vec3 directBRDF(vec3 albedo,vec3 f0,float metallic,float r,vec3 normal0,vec3 v,vec3 l,vec3 radiance) {
  float nl=max(dot(normal0,l),0.), nv=max(dot(normal0,v),.035);
  if(nl<.00001) return vec3(0.);
  vec3 hv=normalize(l+v+vec3(.00001));
  float nh=max(dot(normal0,hv),0.), vh=max(dot(v,hv),0.);
  float a=max(r*r,.025), aa=a*a, denom=nh*nh*(aa-1.)+1.;
  float d=aa/(3.14159*denom*denom+.00002);
  float k=(r+1.)*(r+1.)*.125;
  float masking=1./(4.*(nl*(1.-k)+k)*(nv*(1.-k)+k));
  vec3 fres=f0+(1.-f0)*pow(1.-vh,5.);
  vec3 diff=albedo*(1.-metallic)*(1.-fres);
  vec3 spec=min(vec3(5.),d*masking*fres);
  return (diff+spec)*radiance*nl;
}
vec3 practical(vec3 position,vec3 tint,float power,vec3 albedo,vec3 f0,float metal,float rough,vec3 norm,vec3 view) {
  vec3 delta=position-p;
  float d2=max(dot(delta,delta),.025);
  vec3 beam=delta*inversesqrt(d2);
  vec3 energy=tint*(power/(.66+d2));
  return directBRDF(albedo,f0,metal,max(.27,rough),norm,view,beam,energy) + albedo*energy*.085;
}
void main() {
  if(captureFloor>.5 && p.y<.11)discard;
  vec3 baseN=normalize(n), sun=normalize(lightDir+vec3(0.,.00001,0.));
  vec3 delta=eye-p; float distance0=max(length(delta),.001); vec3 view=delta/distance0;
  vec3 norm=baseN;
  float kind=floor(m.x+.5), emission=saturate(m.y), w=saturate(weather);
  if(kind==25.){vec3 cell=floor(p*8.5);if(fract(sin(dot(cell,vec3(12.9898,78.233,31.42)))*43758.5453)<.28)discard;kind=16.;}
  float detail=1.-smoothstep(5.,27.,distance0), fine=1.-smoothstep(1.,6.5,distance0);
  vec3 albedo=pow(clamp(c,0.,1.),vec3(2.15));
  float rough=.62,metal=.0,sheen=0.,gain=1.;
  vec2 slope=vec2(0.);
  vec3 absN=abs(baseN);
  vec3 tangent=absN.y>=max(absN.z,absN.x) ? vec3(1.,0.,0.) : vec3(0.,1.,0.);
  tangent=normalize(tangent-baseN*dot(baseN,tangent));
  vec3 bitangent=normalize(cross(baseN,tangent));
  vec2 st=vec2(dot(p,tangent),dot(p,bitangent));
  // Thin glazing is drawn in a separate depth-tested, alpha-blended pass.
  if(kind==13.) {
    if(dot(norm,view)<0.) norm=-norm;
    float ndv=saturate(dot(norm,view)), grazing=pow(1.-ndv,4.);
    vec3 refl=reflect(-view,norm);
    vec3 sky=skyBase(refl,sun);
    float glint=pow(max(dot(refl,sun),0.),640.);
    vec3 tint=mix(vec3(.42,.55,.60),sky,.72)+vec3(.45,.35,.22)*glint;
    if(farm<.5 && reflectReady>.5){
      vec2 uv=gl_FragCoord.xy/viewSize;
      vec4 room=abs(norm.z)>abs(norm.x)?texture2D(glassBack,uv):texture2D(glassSide,uv);
      tint=mix(tint,room.rgb*.92+.025,room.a*.93);
    }
    gl_FragColor=vec4(tint,clamp(.065+.31*grazing+.10*glint,.045,.46));
    return;
  }
  if(kind==1.||kind==5.||kind==6.||kind==19.) {
    bool bark=kind==19.,walnut=kind==5.;
    rough=bark?.85:(walnut?.41:.47);
    if(detail>.001) {
      float scale=bark?.72:1.;
      vec2 wood=st*scale;
      float bend=noise2(wood*vec2(.65,2.6))-.5;
      float fibre=noise2(wood*vec2(1.9,38.)+vec2(0.,bend*2.8));
      float cathedral=noise2(wood*vec2(.43,3.9));
      float ring=sin(wood.y*(bark?49.:62.)+bend*6.5+cathedral*8.);
      float pore=noise2(wood*vec2(18.,168.));
      float dark=smoothstep(.46,.95,fibre)*(.5+.5*ring);
      gain+=detail*((fibre-.50)*(bark?.59:.35)+(cathedral-.50)*.13+(ring*.5-.5)*.083-dark*(bark?.22:.14));
      gain-=fine*smoothstep(.67,.91,pore)*(walnut?.15:.19);
      slope.y=detail*(ring*.046+(fibre-.5)*(bark?.22:.081));
      if(kind==5.||kind==6.) albedo*=mix(vec3(1.02,.98,.91),vec3(1.025,.96,.86),dark*detail);
    }
  } else if(kind==2.||kind==7.) {
    rough=kind==7.?.81:.86; sheen=.10;
    if(detail>.001) {
      float slub=noise2(st*vec2(16.,76.));
      float warp=sin(st.x*811.+slub*1.7),weft=sin(st.y*1190.);
      gain+=detail*.095*(slub-.5)+fine*.035*warp*weft;
      slope=vec2(warp,weft)*.021*fine;
    }
  } else if(kind==8.) {
    rough=.42;sheen=.075;
    if(detail>.001) {
      float pebble=noise2(st*118.);
      gain+=detail*(noise2(st*5.)-.5)*.09+fine*(pebble-.5)*.10;
      rough+=fine*(pebble-.5)*.16;slope.x=(pebble-.5)*.08*fine;
    }
  } else if(kind==3.||kind==9.||kind==10.||kind==18.) {
    rough=kind==9.?.25:kind==10.?.85:.76;
    if(detail>.001) {
      float mottled=noise2(st*(kind==18.?28.:5.));
      float grit=noise2(st*(kind==10.?114.:76.));
      if(kind==9.) {
        float fold=st.y*2.1+st.x*.63+noise2(st*2.2)*.75+mottled*.23;
        float seam=1.-smoothstep(.020,.12,abs(fract(fold)-.50));
        float hairline=1.-smoothstep(.012,.055,abs(fract(fold*1.73+.27)-.48));
        gain+=detail*((mottled-.5)*.09-.17*seam-.064*hairline);
      } else {
        float intensity=kind==10.?.11:kind==18.?.66:.33;
        gain+=detail*(mottled-.5)*intensity+fine*(grit-.5)*intensity*.7;
        slope.y=(mottled-.5)*detail*intensity*.19;
      }
    }
  } else if(kind==4.||kind==11.) {
    metal=kind==11.?.84:.67;rough=kind==11.?.29:.36;
    if(detail>.001) {
      float brush=noise2(st*vec2(14.,210.));
      rough+=(brush-.5)*.12*fine;
      gain+=(brush-.5)*.028*fine;
    }
  } else if(kind==12.) {
    rough=.22;
  } else if(kind==14.) {
    rough=.23;emission=max(emission,.41);
  } else if(kind==15.||kind==16.||kind==17.) {
    rough=kind==16.?.53:.88;
    float spread=kind==15.?3.4:5.3;
    float field=noise2(st*spread);
    gain+=(field-.5)*(kind==17.?.58:.37);
    if(kind==15.||kind==16.) {
      // Broad-leaf and turf hues shift independently from the yellow sunlight.
      // Scale the red channel on green leaves only; flowers keep their pigments.
      float green=smoothstep(-.03,.10,c.g-c.r);
      albedo*=mix(vec3(1.),mix(vec3(.69,.95,.78),vec3(.87,1.04,.88),field),green);
    } else {
      albedo*=vec3(.83,.78,.73);
    }
    if(detail>.001) {
      float clod=noise2(st*(kind==17.?27.:72.));
      gain+=detail*(clod-.5)*(kind==17.?.34:.17);
      slope.x=(clod-.5)*detail*.10;
    }
  } else if(kind==20.) {
    rough=.13;
    float t=clock*.35;
    slope=vec2(sin(st.y*7.4+st.x*3.7+t)+.39*sin(st.y*17.-t*1.7),
               cos(st.x*8.5-t*.8)+.52*sin(st.y*13.+st.x*8.+t))*.050;
  }
  norm=normalize(baseN+tangent*slope.x+bitangent*slope.y);
  albedo*=max(.40,gain);
  float interior=(1.-farm)*(1.-smoothstep(6.50,7.5,abs(p.x)))*(1.-smoothstep(4.68,5.7,abs(p.z)))*
                  smoothstep(-.50,-.14,p.y)*(1.-smoothstep(3.85,4.45,p.y));
  float ao=1.;
  if(interior>.01) {
    float edgeGap=max(min(6.35-abs(p.x),4.54-abs(p.z)),0.);
    float wallJunction=(1.-smoothstep(.0,.50,edgeGap))*(1.-smoothstep(.0,.42,max(0.,p.y)));
    float ceilingEdge=(1.-smoothstep(0.,.32,edgeGap))*smoothstep(3.18,3.66,p.y);
    ao-=interior*(.21*wallJunction+.10*ceilingEdge);
    if(p.y<.29 && baseN.y>.55) {
      float low=1.-smoothstep(.05,.28,p.y);
      float bed=rectOcclusion(p.xz,vec2(-4.45,-2.10),vec2(1.09,1.39),.65);
      float seat=rectOcclusion(p.xz,vec2(3.98,.45),vec2(1.89,.49),.48);
      float desk=rectOcclusion(p.xz,vec2(3.77,-3.37),vec2(1.52,.38),.71);
      float coffee=rectOcclusion(p.xz,vec2(2.74,2.33),vec2(.65,.24),.36);
      ao*=1.-low*max(max(.43*bed,.37*seat),max(.14*desk,.23*coffee));
    }
  }
  float hemi=saturate(norm.y*.5+.5);
  vec3 indirect=mix(vec3(.23,.22,.26),vec3(.62,.70,.89),hemi);
  indirect=mix(indirect,mix(vec3(.25,.27,.22),vec3(.63,.75,.86),hemi),farm);
  if(interior>.01) {
    vec3 windowLight=normalize(vec3(-.70,.44,-.88));
    float glassFalloff=exp(-.135*max(0.,min(p.x+6.40,p.z+4.60)));
    float windowFacing=.26+.74*saturate(dot(norm,windowLight));
    vec3 roomFill=mix(vec3(.22,.18,.17),vec3(.41,.46,.57),hemi);
    roomFill+=vec3(.30,.34,.46)*glassFalloff*windowFacing;
    float cove=smoothstep(2.42,3.66,p.y)*(.30+.7*exp(-1.75*max(0.,min(6.3-abs(p.x),4.5-abs(p.z)))));
    roomFill+=vec3(.39,.190,.073)*cove;
    indirect=mix(indirect,roomFill,interior);
  }
  vec3 f0=mix(vec3(kind==20.?.020:.042),clamp(albedo,.015,.93),metal);
  float ndv=saturate(dot(norm,view));
  vec3 fres=f0+(max(vec3(1.-rough),f0)-f0)*pow(1.-ndv,5.);
  vec3 refl=reflect(-view,norm);
  vec3 env=pow(max(skyBase(refl,sun),vec3(.01)),vec3(2.15));
  env=mix(env,vec3(.34,.37,.44),rough*rough*.64);
  if(interior>.01) env=mix(env,env*(.35+.47*smoothstep(-.18,.81,-min(refl.x,refl.z)))+vec3(.026,.021,.016),interior);
  vec3 result=albedo*indirect*(1.-metal*.86)*ao + env*fres*ao*(1.-rough*.46);
  vec3 solar=mix(vec3(1.64,.94,.52),vec3(1.52,1.26,.92),farm)*(1.-w*.71);
  float shadow=castShadow(baseN,sun);
  result+=directBRDF(albedo,f0,metal,rough,norm,view,sun,solar)*shadow;
  if(interior>.01) {
    vec3 warm=vec3(1.,.51,.245);
    result+=interior*(practical(vec3(-2.5,1.2,-3.2),warm,2.26,albedo,f0,metal,rough,norm,view)
                    +practical(vec3(2.10,1.46,-3.41),vec3(1.,.64,.34),1.67,albedo,f0,metal,rough,norm,view)
                    +practical(vec3(5.70,2.05,-.89),warm,2.97,albedo,f0,metal,rough,norm,view));
  }
  result+=albedo*sheen*pow(1.-ndv,3.);
  if(kind==16.) result+=albedo*solar*.21*max(0.,dot(-norm,sun))*(.36+.64*shadow);
  if(kind==20.) {
    result=mix(result,env,clamp(.25+.65*pow(1.-ndv,3.),.0,.90));
    result+=solar*pow(max(dot(refl,sun),0.),180.)*.40;
  }
  if(emission>0.) {
    vec3 selfLight=max(pow(max(c,vec3(.0)),vec3(1.80)),albedo);
    result=mix(result,selfLight*(kind==14.?1.18:1.54)+result*.20,emission);
  }
  float haze=smoothstep(43.-w*12.,203.-w*21.,distance0)*mix(.64,.82,w);
  vec3 hazeTint=horizonColor(-view,sun)*mix(vec3(.83,.88,.96),vec3(.97,.99,1.),farm);
  vec3 shown=mix(displayColor(result),hazeTint,haze);
  if(reflectReady>.5 && interior>.9 && p.y<.085 && baseN.y>.90 && (kind==1.||kind==5.||kind==6.)){
    vec2 uv=gl_FragCoord.xy/viewSize,blur=vec2(.0028,.007);
    vec4 bounced=(texture2D(woodFloor,uv)*2.+texture2D(woodFloor,uv+blur)+texture2D(woodFloor,uv-blur)+texture2D(woodFloor,uv+vec2(-blur.x,blur.y))+texture2D(woodFloor,uv+vec2(blur.x,-blur.y)))/6.;
    shown=mix(shown,bounced.rgb*vec3(.97,.88,.76),bounced.a*(.075+.13*pow(1.-ndv,3.)));
  }
  gl_FragColor=vec4(shown,1.);
}
`;
  const skyVert = `
attribute vec2 pos;
varying vec2 uv;
void main() {
  uv=pos;
  gl_Position=vec4(pos,1.,1.);
}
`;
  const skyFrag = atmosphere + `
varying vec2 uv;
uniform vec3 camForward,camRight,camUp;
uniform float tanHalf,aspect;
float cloudField(vec2 q) {
  mat2 spin=mat2(.82,-.57,.57,.82);
  float total=noise2(q)*.54;
  q=spin*q*2.06+vec2(7.4,-11.8);
  total+=noise2(q)*.265;
  q=spin*q*2.09+vec2(-5.5,4.7);
  total+=noise2(q)*.13;
  q=spin*q*2.02+vec2(3.1,9.2);
  return total+noise2(q)*.065;
}
void main() {
  vec3 ray=normalize(camForward+camRight*(uv.x*aspect*tanHalf)+camUp*(uv.y*tanHalf));
  vec3 sun=normalize(lightDir+vec3(0.,.00001,0.));
  float w=saturate(weather),sep=max(0.,1.-dot(ray,sun));
  vec3 sky=skyBase(ray,sun);
  float directDisc=1.-smoothstep(.000012,.000048,sep);
  float aureole=exp(-sep*890.);
  sky+=vec3(.23,.142,.065)*aureole*(1.-.75*w);
  sky=mix(sky,vec3(1.,.963,.80),directDisc*(1.-.61*w));
  if(ray.y>-.035) {
    // Thin-shell projection compresses cloud banks towards the horizon.
    // Two altitudes and independent wind speeds establish visible depth.
    float altitude=max(ray.y,0.);
    vec2 plane=ray.xz/(.16+altitude*.92);
    float t=mod(clock,36000.)*.0015;
    vec2 high=plane*vec2(2.55,4.4)+vec2(23.3+t*.65,-11.6);
    float ice=noise2(high*.61+noise2(high*1.6)*.92);
    float wisps=smoothstep(.39,.73,ice)*smoothstep(.22,.70,noise2(high*vec2(1.1,3.5)));
    wisps*=smoothstep(-.035,.15,ray.y)*(.21+w*.16);
    sky=mix(sky,mix(vec3(.86,.75,.70),vec3(.90,.90,.86),farm),wisps);
    vec2 q=plane*vec2(1.35,1.67)+vec2(5.5+t,2.1+t*.17);
    float body=cloudField(q);
    float threshold=mix(.555,.433,w);
    float density=smoothstep(threshold-.055,threshold+.098,body);
    density*=smoothstep(-.032,.070,ray.y);
    if(density>.001) {
      vec2 towards=normalize(sun.xz+vec2(.0001));
      // Sampling the cloud field along the projected sun direction produces
      // changing silver linings and warmer cloud faces, with cool undersides.
      float facingMass=cloudField(q+towards*.235);
      float slope=saturate(.52+(body-facingMass)*3.16);
      float silver=saturate((threshold+.058-body)*9.)*(.30+.70*exp(-sep*3.1));
      float horizonWarm=exp(-altitude*3.4)*(.30+.70*exp(-sep*1.85));
      vec3 shadow=mix(vec3(.43,.475,.58),vec3(.60,.64,.69),farm);
      vec3 daylit=mix(vec3(.84,.74,.74),vec3(.94,.89,.82),farm);
      vec3 sunlit=mix(daylit,vec3(1.,.74,.55),horizonWarm*(1.-farm*.35));
      vec3 cloud=mix(shadow,sunlit,.20+.67*slope+.13*silver);
      cloud=mix(cloud,sky,.095+.24*(1.-smoothstep(.05,.35,altitude)));
      sky=mix(sky,cloud,density*(.85+.12*w));
    }
  }
  // Sub-LSB dithering suppresses visible bands along the amber horizon.
  sky+=(hash2(gl_FragCoord.xy)-.5)/255.;
  gl_FragColor=vec4(clamp(sky,0.,1.),1.);
}
`;
  return [surface,skyVert,skyFrag];
})();
