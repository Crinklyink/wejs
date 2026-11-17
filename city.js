// Dusk skyline. Building blocks stay on a world-aligned street grid, so the
// regular street gaps still read as avenues through the isometric projection.
function buildCity(g) {
  const rand = () => g.rand();
  const between = (low, high) => low + (high - low) * rand();
  const pick = (items) => items[Math.floor(rand() * items.length)];
  const box = (...args) => g.box(...args);
  const glow = (amount) => ({ glow: amount });
  const ground = -34;
  const facades = [
    ['#35405c', '#202e45', '#546480', '#7892ac'],
    ['#344455', '#223344', '#4e6378', '#7d9aaa'],
    ['#504359', '#382f46', '#685777', '#9c8295'],
    ['#39415b', '#272e46', '#556079', '#8592a7'],
    ['#47465a', '#333449', '#625e73', '#998d98'],
    ['#34475b', '#263748', '#51667d', '#8d9fba']
  ];
  const warmWindows = ['#dfaa79', '#eeb98b', '#ffd29b', '#dba6a0', '#b78c76'];
  const coolWindows = ['#93adca', '#9dacce', '#c3c9da', '#919cbb', '#8fb7c6'];
  const shadedWindows = ['#2d3a53', '#37455e', '#48536b', '#414960', '#3b3e55'];

  // A vertical face, ordered counterclockwise towards its outward normal.
  function panel(wall, across, y, outward, width, height, color, options) {
    const left = across - width / 2, right = across + width / 2;
    const bottom = y - height / 2, top = y + height / 2;
    if (wall === 'front') {
      g.quad([left,bottom,outward], [right,bottom,outward],
             [right,top,outward], [left,top,outward], color, options);
    } else {
      g.quad([outward,bottom,right], [outward,bottom,left],
             [outward,top,left], [outward,top,right], color, options);
    }
  }

  function officeWall(wall, origin, face, width, roof, style, distance, palette) {
    const dense = distance < 29;
    const spacing = dense ? .83 : 1.08;
    const cols = Math.max(2, Math.floor((width - .22) / (style === 1 ? .7 : .56)));
    const cell = (width - .34) / cols;
    const litChance = between(.18, .48);
    const warm = rand() < .62;
    const firstY = Math.max(ground + .7, roof - (dense ? 19 : 13));
    for (let y = roof - .85; y >= firstY; y -= spacing) {
      const floorOpen = rand() > .18;
      if (style === 1) {
        panel(wall, origin, y, face, width - .21, .38, palette[1]);
      }
      let lights = rand() < litChance;
      for (let n = 0; n < cols; n++) {
        // Neighbouring offices share light and blind states within a floor.
        if (rand() < .44) lights = rand() < litChance;
        const lit = floorOpen && lights;
        if (!lit && rand() < (dense ? .38 : .77)) continue;
        const c = lit ? pick(rand() < (warm ? .78 : .26) ? warmWindows : coolWindows) : pick(shadedWindows);
        const h = style === 0 ? .37 : style === 1 ? .23 : .47;
        const cy = y + (lit && rand() < .2 ? -.06 : 0);
        panel(wall, origin - width/2 + .17 + cell*(n+.5), cy, face+.012,
              cell*(style === 1 ? .89 : .64), h, c, lit ? glow(between(.44,.74)) : undefined);
      }
    }
    if (style === 2 && dense) {
      const fins = Math.max(2, Math.floor(width / 1.2));
      for (let i=1; i<fins; i++) {
        panel(wall, origin-width/2+width*i/fins, (roof+firstY)/2, face+.026,
              .055, roof-firstY, palette[2]);
      }
    }
  }

  function rooftopTank(x, y, z, size, tint) {
    const r = .45*size, support = .62*size, height = 1.04*size;
    for (const dx of [-.31,.31]) for (const dz of [-.31,.31]) {
      box(x+dx*size, y+support/2, z+dz*size, .065*size, support, .065*size, '#313247');
    }
    box(x,y+support,z,r*2.0,.11*size,r*2.0,'#494052');
    g.cyl(x,y+support+height*.5,z,r,r,height,12,tint);
    for (const level of [.18,.5,.84]) {
      g.cyl(x,y+support+height*level,z,r+.014,r+.014,.035*size,12,'#363744');
    }
    g.cyl(x,y+support+height+.14*size,z,.01,r*1.13,.31*size,12,'#595260');
  }

  function antenna(x, y, z, h, light) {
    box(x,y+h/2,z,.042,h,.042,'#6b6b7e');
    box(x,y+h*.76,z,.46,.032,.032,'#777487');
    box(x,y+h*.87,z,.28,.032,.032,'#777487');
    if (light) box(x,y+h,z,.09,.09,.09,'#ff736e',glow(.98));
  }

  function shell(x, z, w, d, top, style, distance, palette) {
    box(x,(ground+top)/2,z,w,top-ground,d,palette[0]);
    officeWall('front',x,z+d/2+.014,w,top,style,distance,palette);
    officeWall('side',z,x+w/2+.014,d,top,style,distance,palette);
    box(x,top-.13,z,w+.12,.14,d+.12,palette[2]);
    if (distance > 33) return;
    // The front parapet and roof membrane are separate colours at this scale.
    box(x,top+.025,z,w-.12,.055,d-.12,palette[1]);
    box(x,top+.12,z+d/2-.04,w,.23,.1,palette[2]);
    box(x,top+.12,z-d/2+.04,w,.23,.1,palette[0]);
    box(x+w/2-.04,top+.12,z,.1,.23,d,palette[2]);
    box(x-w/2+.04,top+.12,z,.1,.23,d,palette[0]);
    if (style === 0) {
      for (let y=top-3; y>Math.max(ground+1,top-16); y-=4.98) {
        box(x,y,z,w+.065,.095,d+.065,palette[2]);
      }
    }
  }

  function building(x,z,w,d,top,distance,palette,style) {
    shell(x,z,w,d,top,style,distance,palette);
    const choice = rand();
    const headW = w*between(.36,.64), headD = d*between(.38,.64);
    const hx = x + w*between(-.1,.1), hz = z + d*between(-.08,.08);
    if (choice < .39) {
      const h = between(1,2.9);
      box(hx,top+h/2,hz,headW,h,headD,palette[0]);
      box(hx,top+h,hz,headW+.1,.15,headD+.1,palette[2]);
      for (let j=0; j<3; j++) {
        panel('front',hx,top+.4+j*.22,hz+headD/2+.012,headW*.63,.07,palette[1]);
      }
      if (rand() < .46) antenna(hx,top+h,hz,between(.8,2.85),distance < 28);
    } else if (choice < .6 && distance < 31) {
      rooftopTank(hx,top+.05,hz,between(.8,1.2),pick(['#705658','#665460','#625260']));
    } else if (distance < 35) {
      for (let j=0; j<2; j++) {
        const sx=hx+(j-.5)*headW*.66;
        box(sx,top+.2,hz,headW*.52,.38,headD*.65,palette[2]);
        g.cyl(sx,top+.405,hz,headW*.16,headW*.16,.04,12,palette[1]);
      }
      if (rand() < .35) antenna(x-w*.3,top,z+d*.24,between(1,2.5),false);
    }
  }

  // Keep the immediate roofline open in the middle. The lower far-district
  // roof datum compensates for the game's elevated orthographic camera.
  const specials = [[-13.7,-.35,4.5,3.6],[1.9,-14.7,4.75,3.7],[-15.3,-14.5,4.7,4.1]];
  for (let ix=-8; ix<=5; ix++) for (let iz=-9; iz<=4; iz++) {
    const x=ix*6.15+between(-.38,.38), z=iz*6.05+between(-.45,.45);
    const depth=-(x*.608+z*.794), screen=x*.794-z*.608;
    if (depth < 7 || depth > 48 || Math.abs(screen) > 37 || (x > -11.7 && z > -10.7)) continue;
    if (specials.some(([sx,sz,sw,sd])=>Math.abs(x-sx)<(sw+5.0)/2+.45 && Math.abs(z-sz)<(sd+5.1)/2+.5)) continue;
    if (rand() < .14) continue;
    const w=between(2.55,4.85), d=between(2.65,4.85);
    const top=-depth*.53+between(-3.3,2.7)+Math.min(2.6,Math.abs(screen)*.14);
    building(x,z,w,d,top,depth,pick(facades),Math.floor(rand()*3));
  }

  // A stepped limestone-and-copper tower on the west side.
  // Taller buildings across the river sit behind the low industrial district.
  // Vary their projected roofline to leave slivers of sunset between towers.
  for (let layer=0; layer<2; layer++) {
    for (let i=-17; i<=17; i++) {
      const across=i*(layer?1.6:2.3)+between(-.45,.45);
      const away=(layer?68:53)+between(-2.2,2.2);
      const x=across*.794-away*.608,z=-across*.608-away*.794;
      const projectedTop=(layer?6.1:4.4)+between(-1.6,1.65);
      const top=(projectedTop-away*Math.sin(.51))/Math.cos(.51);
      const w=between(1.2,2.1),d=between(1.2,2.4),p=pick(facades);
      box(x,top-9,z,w,18,d,p[0]);
      if(rand()<.53)box(x,top+.24,z,w*.61,.48,d*.62,p[0]);
      if(rand()<.2)antenna(x,top+.35,z,between(.4,1.3),false);
      for(let fl=0;fl<13;fl++)for(let j=0;j<3;j++)if(rand()<.51)
        panel('front',x+(j-1)*w*.28,top-.4-fl*.36,z+d*.5+.015,w*.13,.12,pick(warmWindows),glow(.56));
    }
  }

  {
    const [x,z,w,d]=specials[0], top=-3.9;
    const p=['#545061','#37394b','#696275','#9a8a90'];
    shell(x,z,w,d,top,2,18,p);
    for (const [dy,width,height,c] of [
      [0,3.38,1.8,'#5e5668'],[1.8,2.65,1.25,'#635a6c'],
      [3.05,1.72,1.13,'#716779'],[4.18,.94,.78,'#88798a']
    ]) {
      const dd=width*.85, cy=top+dy+height/2;
      box(x,cy,z,width,height,dd,c);
      for (let j=-1; j<=1; j++) {
        panel('front',x+j*width*.24,cy,z+dd/2+.015,.086,height*.63,'#e4b88c',glow(.53));
        panel('side',z+j*dd*.24,cy,x+width/2+.015,.074,height*.63,'#c6a399',glow(.43));
      }
      box(x,top+dy+height,z,width+.14,.09,dd+.14,'#8b7e8c');
    }
    g.cyl(x,top+5.36,z,.12,.55,.82,4,'#9d919c',{ry:Math.PI*.25});
    antenna(x,top+5.76,z,1.45,true);
  }

  // The MIRA hotel has a small rooftop channel-letter sign. Solid rectangular
  // letter segments remain clear from the apartment's oblique viewing angle.
  {
    const [x,z,w,d]=specials[1], top=-3.5, p=facades[2];
    shell(x,z,w,d,top,0,17,p);
    rooftopTank(x+1.13,top+.03,z-.62,1.13,'#6b5053');
    const letters=['10101/11111/10101/10101/10101','1/1/1/1/1',
      '110/101/110/101/101','010/101/111/101/101'];
    const pixel=.14, total=(5+1+3+3+3)*pixel;
    const signZ=z+d*.36, signY=top+.83;
    for (const dx of [-total*.4,total*.4]) {
      box(x+dx,top+.4,signZ,.055,.8,.055,'#473b4c');
      g.beam([x+dx,top+.65,signZ],[x+dx,top+.03,signZ-.59],.034,'#493b4d');
    }
    box(x,signY,signZ,total+.27,.89,.09,'#423747');
    let left=x-total/2;
    for (const glyph of letters) {
      const rows=glyph.split('/');
      rows.forEach((row,r)=>{
        for (let c=0;c<row.length;c++) if(row[c]==='1') {
          panel('front',left+(c+.5)*pixel,signY+(2-r)*pixel,signZ+.051,pixel*.98,pixel*.98,'#ff786c',glow(.96));
        }
      });
      left+=(rows[0].length+1)*pixel;
    }
  }

  // A mid-distance radio building breaks up the mechanical roof silhouettes.
  {
    const [x,z,w,d]=specials[2], top=-7.2, p=facades[1];
    shell(x,z,w,d,top,1,24,p);
    box(x,top+.48,z,w*.64,.96,d*.62,p[2]);
    const y=top+.96;
    for (const dx of [-.37,.37]) for (const dz of [-.37,.37]) {
      g.beam([x+dx,y,z+dz],[x+dx*.26,y+3.55,z+dz*.26],.042,'#727484');
    }
    for(let i=0;i<4;i++) {
      const a=y+i*.83, b=a+.83, r=.37-i*.061, nr=r-.061;
      g.beam([x-r,a,z+r],[x+nr,b,z+nr],.021,'#777488');
      g.beam([x+r,a,z+r],[x-nr,b,z+nr],.021,'#777488');
    }
    antenna(x,y+3.5,z,1.26,true);
  }
}
