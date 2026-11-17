// All farm geometry is built in metres, with the soil surface at y = 0.
function buildFarm(g, plots) {
  const box = (...args) => g.box(...args);
  const cyl = (...args) => g.cyl(...args);
  const ball = (...args) => g.ball(...args);
  const beam = (...args) => g.beam(...args);
  const wood = { mat: 'wood' };
  const stone = { mat: 'stone' };
  const metal = { mat: 'metal' };
  const tau = Math.PI * 2;
  let scenerySeed = 578903;
  function random() {
    scenerySeed = (Math.imul(1664525, scenerySeed) + 1013904223) >>> 0;
    return scenerySeed / 4294967296;
  }
  const between = (a, b) => a + (b - a) * random();
  const pick = values => values[Math.floor(random() * values.length)];

  function fir(x, y, z, height, crown, lowerColor, upperColor) {
    cyl(x, y + height * 0.23, z, height * 0.044, height * 0.065, height * 0.46, 6, '#615e4d');
    cyl(x, y + height * 0.47, z, 0, crown, height * 0.66, 7, lowerColor);
    cyl(x, y + height * 0.7, z, 0, crown * 0.75, height * 0.64, 7, upperColor);
  }

  // Lower valley, with distant overlapping ridges on both sides of the view.
  function countryside() {
    box(-7, -10.2, -8, 175, 1, 175, '#a4a96c');
    const layers = [
      [-71, -65, 72, 34, 43, '#a4aa9e'], [-27, -83, 95, 39, 53, '#adb4a8'],
      [19, -76, 83, 34, 52, '#aab0a0'], [-93, -12, 58, 38, 74, '#a2afa4'],
      [-76, 20, 52, 33, 64, '#a2ad9b'], [-44, -41, 59, 25, 42, '#8a9d78'],
      [-14, -51, 55, 25, 35, '#97a784'], [18, -53, 63, 25, 41, '#9dad86'],
      [-51, -9, 45, 25, 48, '#8e9d75'], [-49, 22, 40, 24, 54, '#96a178']
    ];
    for (const [x, z, w, h, d, color] of layers) ball(x, -12.5, z, w, h, d, color);
    const fields = ['#c4b678', '#b4ae70', '#bfac69', '#9fa769', '#aab079', '#c5bc87'];
    for (let col = -3; col <= 2; col++) {
      for (let row = -3; row <= 2; row++) {
        if (row === 0 && col === 0) continue;
        const x = col * 13.5, z = row * 11.2;
        box(x, -9.45, z, 13.12, 0.2, 10.66, pick(fields));
        if ((col + row) % 2 === 0) {
          for (let line = -4; line <= 4; line++) {
            box(x, -9.335, z + line * 1.08, 12.9, 0.035, 0.19, '#b09f6c');
          }
        }
      }
    }
    const stands = [[-24,-16],[-13,-31],[5,-36],[25,-26],[-31,4],[-31,22],[-17,19],[17,-15]];
    for (const [cx,cz] of stands) {
      for (let i = 0; i < 10; i++) {
        const x = cx + between(-5.5, 5.5), z = cz + between(-3.6, 3.6);
        const h = between(3.2, 7.5);
        fir(x, -9.4, z, h, h * 0.32, '#63795b', '#78906b');
      }
    }
    for (const [x,z] of [[-16,-13],[-11,-16],[15,-23]]) {
      box(x, -8.35, z, 2.8, 2, 2.2, '#c9b89e');
      for (const sign of [-1,1]) {
        box(x + sign * .76, -7, z, 1.68, .17, 2.55, '#926f5d', {rz: -sign * .39});
      }
    }
  }

  function island() {
    box(0, -1.87, 0, 13.55, 2.29, 9.55, '#866248', stone);
    box(0, -.64, 0, 13.84, .55, 9.84, '#aa7952', stone);
    box(0, -.28, 0, 14.03, .35, 10.03, '#73513e', stone);
    box(0, -.089, 0, 14.06, .17, 10.06, '#98ad54');
    for (let i = 0; i < 19; i++) {
      const x = -6.48 + i * .72;
      const top = -.26 - between(0, .16);
      box(x, top, 4.952, between(.27,.72), between(.12,.30), .15, pick(['#896144','#9e6d4a','#ab7954']), stone);
      if (i % 2) {
        box(x+.13, between(-2.25,-1.08), 4.773, between(.26,.79), .1, .17, '#966f53', stone);
      }
      if (i % 3 === 0) {
        beam([x, -.07, 5.031], [x+.12, -.39, 5.025], .022, '#71523a');
        beam([x+.12, -.39, 5.025], [x+.05, -.54, 4.987], .014, '#71523a');
      }
    }
    for (let i = 0; i < 13; i++) {
      box(6.92, between(-.88,-.45), -4.55 + i*.74, .09, between(.10,.22), between(.30,.72), '#b7895c', stone);
    }
    // Gravel lane to the barn, and small access paths separating the plots.
    box(-2.12,.005,.93,1.27,.033,7.37,'#c5ae77',stone);
    box(-3.13,.013,-.6,2.45,.034,1.03,'#c5ae77',stone);
    box(1.15,.01,-.96,6.65,.035,.68,'#baa471',stone);
    box(1.17,.013,1.84,6.71,.035,.55,'#c1af78',stone);
    box(1.58,.012,2.42,.53,.034,4.16,'#c0ad75',stone);
    for(let i=0;i<57;i++){
      const horizontal = i % 3 === 0;
      box(horizontal ? between(-1.3,4.33) : between(-2.67,-1.66), .042,
        horizontal ? between(1.62,2.06) : between(-1.72,4.48), between(.044,.135), .018, .039,
        pick(['#deca99','#af996e','#cdbb87']), {ry:between(-1,1)});
    }
  }

  function barn() {
    const x = -4.02, z = -2.69, half = 1.95, front = -1.215, back = -4.165;
    const eave = 2.27, shoulder = 3.29, ridge = 3.74, shoulderX = 1.23;
    box(x,.10,z,4.03,.22,3.07,'#84755e',stone);
    box(x,1.195,z,3.90,2.13,2.95,'#9c4037',wood);
    const reds = ['#b74f43','#a94439','#bb5846','#a8473c','#ad493a'];
    const roofHeight = xx => xx < shoulderX ? ridge-(ridge-shoulder)*xx/shoulderX :
      shoulder-(shoulder-eave)*(xx-shoulderX)/(half-shoulderX);
    // Run continuous siding up through the gable so daylight never leaks through.
    for (let i=0; i<23; i++) {
      const dx = -half+(i+.5)*3.90/23;
      const h = roofHeight(Math.abs(dx)) - .14;
      for (const face of [front,back]) {
        box(x+dx, .14+h/2, face, .164, h,.07,reds[i%reds.length],wood);
      }
    }
    for(let i=0;i<17;i++) {
      const zz = back+(i+.5)*2.95/17;
      box(x+half,.14+(eave-.14)/2,zz,.072,eave-.14,.164,reds[(i+2)%reds.length],wood);
    }
    function roofStrip(x1,y1,x2,y2,side) {
      const len=Math.hypot(x2-x1,y2-y1), tilt=Math.atan2(y2-y1,x2-x1);
      const cx=x+(x1+x2)/2, cy=(y1+y2)/2;
      box(cx,cy+.04,z,len+.09,.105,3.34,'#455559',{rz:tilt,mat:'metal'});
      for(let i=0;i<11;i++) {
        box(cx,cy+.106,z-1.60+i*.319,len+.04,.029,.031, i%3 ? '#5b6b68':'#697977',{rz:tilt,mat:'metal'});
      }
      for (const face of [z+1.685,z-1.685]) {
        box(cx,cy,face,len+.14,.135,.080,'#d9caab',{rz:tilt,mat:'wood'});
      }
      box(x+x1, y1+.094, z,.083,.082,3.42,side,metal);
    }
    roofStrip(-2.06,2.16,-shoulderX,shoulder,'#526366');
    roofStrip(-shoulderX,shoulder,0,ridge,'#687677');
    roofStrip(0,ridge,shoulderX,shoulder,'#82908a');
    roofStrip(shoulderX,shoulder,2.06,2.16,'#657571');
    const trim='#e4d6b7';
    for(const xx of [x-half+.035,x+half-.035]) {
      for(const zz of [front,back]) box(xx,1.22,zz,.138,2.18,.14,trim,wood);
    }
    box(x,.24,front+.044,3.94,.093,.10,'#d1c3a4',wood);
    // Recessed sliding doors, strap hinges, tracks and the hayloft cross-buck.
    box(x,.99,front+.070,2.02,1.91,.088,'#4e372e');
    for(const sign of [-1,1]) {
      const dx=x+sign*.465;
      box(dx,.983,front+.12,.90,1.77,.092,'#8a392e',wood);
      for(let i=0;i<6;i++) box(dx-.369+i*.147,.98,front+.176,.131,1.69,.036,reds[(i+1)%5],wood);
      for(const edge of [-.426,.426]) box(dx+edge,.98,front+.202,.075,1.78,.065,trim,wood);
      for(const yy of [.15,1.81]) box(dx,yy,front+.202,.87,.075,.065,trim,wood);
      beam([dx-.381,.223,front+.246],[dx+.381,1.74,front+.246],.043,trim);
      beam([dx+.381,.223,front+.246],[dx-.381,1.74,front+.246],.043,trim);
      box(x+sign*.126,1.00,front+.278,.046,.19,.045,'#494a40',metal);
    }
    box(x,1.995,front+.18,2.34,.076,.089,'#4a504b',metal);
    for(const xx of [-.65,.65]) {
      box(x+xx,1.92,front+.22,.071,.18,.04,'#575951',metal);
    }
    box(x,2.68,front+.078,.75,.71,.095,'#603e32');
    box(x,2.68,front+.129,.60,.55,.068,'#af5947',wood);
    for(const xx of [-.357,.357]) box(x+xx,2.68,front+.175,.065,.69,.061,trim,wood);
    for(const yy of [2.37,2.99]) box(x,yy,front+.175,.77,.067,.061,trim,wood);
    beam([x-.285,2.44,front+.213],[x+.285,2.91,front+.213],.028,trim);
    beam([x+.285,2.44,front+.213],[x-.285,2.91,front+.213],.028,trim);
    for(const zz of [-3.53,-2.14]) {
      box(x+half+.06,1.41,zz,.12,.76,.95,trim,wood);
      box(x+half+.126,1.42,zz,.035,.59,.79,'#526b68');
      box(x+half+.145,1.42,zz,.042,.59,.040,trim);
      box(x+half+.146,1.42,zz,.042,.036,.79,trim);
      box(x+half+.125,1.00,zz,.19,.082,1.01,'#c0ae8d',wood);
    }
    box(x+1.42,1.73,front+.087,.19,.29,.11,'#4d4d42',metal);
    box(x+1.42,1.70,front+.19,.18,.21,.14,'#ffe3a2',{glow:.52});
    cyl(x+1.42,1.86,front+.18,.07,.18,.11,8,'#555e54',metal);
    // Roof lantern and a little iron weather vane.
    box(x,3.9,z-.36,.56,.43,.58,'#d6c6a5',wood);
    for(let i=0;i<4;i++) {
      box(x,3.78+i*.075,z-.054,.45,.031,.052,'#63716a',wood);
      box(x+.292,3.78+i*.075,z-.36,.052,.031,.46,'#63716a',wood);
    }
    cyl(x,4.21,z-.36,0,.485,.31,4,'#63756d',{ry:Math.PI/4,mat:'metal'});
    cyl(x,4.52,z-.36,.022,.03,.50,6,'#514e40',metal);
    beam([x-.30,4.63,z-.36],[x+.31,4.63,z-.36],.021,'#555344');
    box(x-.22,4.65,z-.36,.18,.12,.04,'#997e50',{rz:.15,mat:'metal'});
  }

  function fencePoint(x,z) {
    box(x,.41,z,.135,.82,.135,'#e1d7b7',wood);
    cyl(x,.85,z,0,.106,.12,4,'#e8dfbe',{ry:Math.PI/4});
  }
  function fence(x1,z1,x2,z2,segments) {
    const dx=(x2-x1)/segments, dz=(z2-z1)/segments;
    for (let i=0;i<=segments;i++) {
      const x=x1+dx*i,z=z1+dz*i;
      fencePoint(x,z);
      if (i===segments) break;
      for(const y of [.32,.63]) {
        box(x+dx/2,y,z+dz/2,Math.hypot(dx,dz),.111,.067,'#d5cfad',
          {ry:-Math.atan2(dz,dx),mat:'wood'});
      }
    }
  }

  function pump(x,z) {
    const dark='#7e7660', light='#b2a58a', hub=3.35;
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      box(x+sx*.50,.079,z+sz*.50,.24,.16,.24,'#9e9981',stone);
      beam([x+sx*.5,.14,z+sz*.5],[x+sx*.14,hub,z+sz*.14],.052,dark,metal);
    }
    for(let j=0;j<3;j++) {
      const y0=.25+j*.90,y1=y0+.86,r0=.50-(y0-.1)*.11,r1=.50-(y1-.1)*.11;
      beam([x-r0,y0,z+r0],[x+r1,y1,z+r1],.025,light,metal);
      beam([x+r0,y0,z+r0],[x-r1,y1,z+r1],.025,light,metal);
      beam([x+r0,y0,z-r0],[x+r1,y1,z+r1],.025,light,metal);
      beam([x-r0,y0,z+r0],[x+r0,y0,z+r0],.03,dark,metal);
    }
    box(x,hub,z,.26,.26,.56,'#776953',metal);
    const rotorZ=z+.29;
    for(let i=0;i<12;i++) {
      const a=(i+.26)*tau/12, xx=Math.cos(a), yy=Math.sin(a);
      beam([x+.12*xx,hub+.12*yy,rotorZ],[x+.82*xx,hub+.82*yy,rotorZ],.018,dark,metal);
      box(x+.691*xx,hub+.691*yy,rotorZ+.028,.42,.19,.045,
        i%3?'#b9b8a7':'#c7cabb',{rz:a+.17,mat:'metal'});
      box(x+.866*xx,hub+.866*yy,rotorZ+.056,.066,.187,.049,'#a65b48',{rz:a+.17,mat:'metal'});
    }
    ball(x,hub,rotorZ+.08,.22,.22,.17,'#987355',metal);
    // The weather tail extends behind the wheel.
    beam([x,hub,z-.20],[x,hub+.03,z-1.02],.031,dark,metal);
    box(x,hub+.04,z-.85,.04,.34,.40,'#ae654d',metal);
    cyl(x-.16,.43,z-.12,.069,.10,.82,8,'#7a9287',metal);
    beam([x-.16,.78,z-.1],[x+.31,.78,z-.1],.065,'#829b8e',metal);
    beam([x+.31,.78,z-.1],[x+.31,.62,z-.1],.056,'#829b8e',metal);
  }

  function tree(x,z,scale,fruit) {
    const h=scale;
    cyl(x,h*.63,z,.116*h,.177*h,1.26*h,7,'#796549',wood);
    beam([x,.64*h,z],[x-.39*h,1.25*h,z+.08*h],.087*h,'#786248');
    beam([x,.86*h,z],[x+.4*h,1.37*h,z+.04*h],.072*h,'#7e6648');
    const lobes=[[-.39,1.54,.01,1.04,.91],[.32,1.54,.18,.98,.91],[.02,1.85,-.25,1.17,1.0],[-.16,1.65,.39,.83,.83]];
    for(const [dx,y,dz,dw,dh] of lobes) {
      ball(x+dx*h,y*h,z+dz*h,dw*h,dh*h,dw*h,
        pick(['#6e954c','#789b4e','#819f50','#729346']));
    }
    for(let i=0;i<8;i++){
      const a=i*2.38,r=(i%3===0?.58:.49)*h;
      ball(x+Math.cos(a)*r,(1.53+(i%3)*.14)*h,z+Math.sin(a)*r,.121*h,.134*h,.121*h,fruit);
    }
  }

  function crate(x,z,scale,filled) {
    const w=.66*scale,d=.48*scale,h=.39*scale;
    box(x,.066*scale,z,w,.12*scale,d,'#785c43',wood);
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      box(x+sx*(w*.5-.03),h*.57,z+sz*(d*.5-.03),.055*scale,h,.055*scale,'#9b7953',wood);
    }
    for(let i=0;i<3;i++) {
      const y=(.11+i*.114)*scale;
      for(const sx of [-1,1]) box(x+sx*w/2,y,z,.046*scale,.088*scale,d,'#ab8053',wood);
      for(const sz of [-1,1]) box(x,y,z+sz*d/2,w,.088*scale,.046*scale,'#c09561',wood);
    }
    if (filled) for(let i=0;i<6;i++) {
      ball(x+((i%3)-1)*.168*scale,(.34+(i%2)*.025)*scale,z+(Math.floor(i/3)-.5)*.19*scale,
        .181*scale,.15*scale,.165*scale,i%3?'#c98341':'#a8573b');
    }
  }

  function hay(x,y,z,w,d,h) {
    box(x,y+h*.5,z,w,h,d,'#d9b152',wood);
    for (const sign of [-1,1]) {
      box(x+sign*w*.24,y+h*.5,z,.028,h+.013,d+.015,'#9d7950');
    }
    for(let i=0;i<4;i++) {
      box(x+(i-1.5)*w*.19,y+h*.39,z+d*.504,w*.15,.026,.014,'#ebc970');
    }
  }

  function plantingBed(x,z,plot) {
    const wet = plot.stage === 'watered', ready = plot.stage === 'ready';
    const dirt = wet ? '#604c3c' : '#806044';
    box(x,.068,z,2.75,.137,1.92,'#a18459',wood);
    box(x,.116,z,2.60,.118,1.77,dirt,stone);
    for(const side of [-1,1]) {
      box(x+side*1.35,.111,z,.095,.153,1.97,'#a38b62',wood);
      box(x,.116,z+side*.94,2.79,.165,.085,'#b39b70',wood);
    }
    for(let row=0;row<3;row++) {
      const zz=z+(row-1)*.52;
      box(x,.183,zz,2.48,.10,.27,wet?'#69513d':'#906b49',stone);
      for(let col=0;col<5;col++) {
        const xx=x+(col-2)*.478, jitter=.05*Math.sin(7*col+3*row);
        if(plot.stage === 'empty' || !plot.stage) {
          box(xx,.229,zz+jitter,.095,.015,.050,'#a17c54',{ry:(row+col)*.53});
          continue;
        }
        const gx=xx+jitter,gz=zz+jitter*.67, by=.229;
        if (plot.crop === 'corn') {
          const h=ready?.95:wet?.38:.17;
          cyl(gx,by+h*.50,gz,.018,.026,h,5,ready?'#809242':'#629344');
          for(let k=0;k<(ready?4:2);k++) {
            const sign=k%2?1:-1, rise=h*(.26+.14*k);
            box(gx+sign*h*.10,by+rise+h*.08,gz,.235*h,.056*h,.09*h,
              ready?'#8b9c4b':'#71a154',{rz:sign*.70,ry:k*.28});
          }
          if(ready) {
            ball(gx+.049,by+h*.61,gz+.035,.097,.22,.092,'#e0bd56',{rz:-.28});
            beam([gx,by+h*.94,gz],[gx-.048,by+h*1.06,gz],.013,'#dfc883');
            beam([gx,by+h*.94,gz],[gx+.041,by+h*1.06,gz+.018],.013,'#dfc883');
          }
        } else if(plot.crop === 'tomato') {
          const h=ready?.55:wet?.30:.12;
          cyl(gx,by+h*.45,gz,.013,.022,h*.9,5,'#638249');
          if(ready) {
            box(gx-.043,by+.35,gz-.018,.032,.70,.032,'#a68a5b',wood);
            for (const [lx,ly,lz] of [[-.084,.27,0],[.072,.37,.046],[.04,.25,-.073]]) {
              ball(gx+lx,by+ly,gz+lz,.135,.128,.13,'#c95039');
            }
          }
          for(let k=0;k<3;k++) {
            const a=(col+row)*.28+k*2.09;
            box(gx+Math.cos(a)*h*.13,by+h*(.48+k*.16),gz+Math.sin(a)*h*.13,h*.38,h*.11,h*.15,
              k%2?'#668e43':'#759a50',{ry:-a,rz:.28});
          }
        } else {
          const h=ready?.34:wet?.23:.12;
          if(ready) cyl(gx,by+.027,gz,.075,.041,.079,7,'#d78a41');
          for(let k=0;k<3;k++) {
            const a=k*2.09+(col+row)*.48;
            beam([gx,by+.028,gz],[gx+Math.cos(a)*h*.41,by+h*(k?1:.79),gz+Math.sin(a)*h*.41],
              h*.078,k%2?'#71994e':'#629047');
          }
        }
      }
    }
  }

  function duck(x,z,a) {
    const dx=Math.cos(a),dz=Math.sin(a);
    ball(x,.18,z,.28,.22,.24,'#eedfb9',{ry:-a});
    ball(x+dx*.116,.289,z+dz*.116,.15,.14,.15,'#eee4c8');
    box(x+dx*.210,.278,z+dz*.210,.085,.041,.055,'#dc9e49',{ry:-a});
    box(x-dx*.129,.229,z-dz*.129,.11,.091,.079,'#c6b993',{ry:-a,rz:.23});
  }

  function pond() {
    const x=5.70,z=.40;
    ball(x,.039,z,1.94,.166,2.20,'#9a9471');
    ball(x,.096,z,1.70,.078,1.94,'#6baba0');
    for(let i=0;i<9;i++) {
      const a=i*tau/9;
      ball(x+Math.cos(a)*.89,.115,z+Math.sin(a)*1.0,.25,.175,.20,
        pick(['#aaa58b','#969680','#b5ac90']));
    }
    for(let i=0;i<6;i++){
      const xx=x+.60+i*.052,zz=z-.59+Math.sin(i)*.15,h=.34+(i%3)*.11;
      beam([xx,.10,zz],[xx+.035,h,zz+.02],.017,'#7c8b4c');
      cyl(xx+.035,h+.047,zz+.02,.022,.025,.129,6,'#935f40');
    }
    for(let i=0;i<4;i++) {
      box(x-.23+(i%2)*.34,.139,z-.39+i*.20,i%2?.18:.30,.008,.019,'#a1cfba');
    }
    duck(x+.10,z-.17,-.95);
  }

  function meadow(x,z,w,d,amount) {
    for(let i=0;i<amount;i++) {
      const xx=x+between(-w/2,w/2),zz=z+between(-d/2,d/2),h=between(.095,.21);
      for(const sign of [-1,1]) {
        box(xx+sign*.026,h*.51,zz,.029,h,.03,pick(['#82994b','#718b46','#a5b35b']),
          {rz:-sign*.37,ry:i*.6});
      }
      if(i%3===0) {
        cyl(xx,h+.014,zz,.041,.031,.043,5,
          pick(['#dfb95b','#f0dc9c','#dca26a','#d7c2ad']));
      }
    }
  }

  countryside();
  island();
  barn();
  fence(-6.47,-4.58,6.40,-4.58,9);
  fence(-6.56,-4.47,-6.56,4.18,6);
  fence(-.90,4.55,5.92,4.55,5);
  fence(6.56,-4.3,6.56,-1.43,2);
  fence(-6.48,4.53,-3.59,4.53,2);
  tree(-5.76,1.25,1.19,'#bb5f3d');
  tree(-4.78,3.48,1.09,'#bb5e3e');
  tree(-.14,-3.32,1.08,'#c49242');
  pump(4.85,-3.00);
  pond();
  crate(-2.67,-1.00,.88,true);
  crate(-5.73,-.74,.94,true);
  crate(-6.12,-.36,.80,false);
  hay(-1.48,.025,-3.14,.87,.57,.46);
  hay(-1.41,.025,-3.81,.88,.57,.46);
  hay(-1.46,.49,-3.48,.79,.52,.42);
  // A small raised shelf, watering can and laid-down hand tools.
  box(2.11,.58,-3.20,1.42,.10,.60,'#ac8d64',wood);
  for(const xx of [1.57,2.66]) for(const zz of [-3.42,-3.00]) {
    box(xx,.27,zz,.082,.54,.081,'#85694f',wood);
  }
  cyl(1.86,.83,-3.23,.144,.171,.36,9,'#75998a',metal);
  beam([2.00,.78,-3.22],[2.16,.94,-3.22],.045,'#779686',metal);
  beam([1.72,.77,-3.22],[1.65,.92,-3.22],.023,'#637f74',metal);
  beam([1.65,.92,-3.22],[1.74,.99,-3.22],.023,'#637f74',metal);
  beam([2.34,.658,-3.15],[2.63,.657,-3.32],.021,'#8d6544');
  box(2.65,.66,-3.34,.13,.036,.082,'#82918a',{ry:.44,mat:'metal'});
  const centers=[[0,.5],[3.2,.5],[0,3.15],[3.2,3.15]];
  centers.forEach(([x,z],i)=>plantingBed(x,z,plots?.[i] || {stage:'empty',crop:'carrot'}));
  meadow(-5.31,2.08,1.55,3.09,30);
  meadow(5.78,3.35,1.51,2.14,20);
  meadow(2.00,-3.85,2.55,.48,16);
  meadow(-.64,-1.87,1.33,.43,9);
}
