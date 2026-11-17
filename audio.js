/* Original environmental score. All sources are synthesized locally by Web Audio. */
const soundscape = (() => {
  const floor = 0.00001;
  let ctx, master, roomSend, noise, scene, timer, napTimer;
  let enabled = false, hidden = false, location = 'city', unlocking = false;
  let stepNumber = 0, lastStep = -10, lastCue = '', cueAt = -10;
  let recordWanted=false, deck, recordTimer, recordOffset=0, instruments, score;
  const ear={x:1.18,z:3.43,yaw:-.22};
  const beatSeconds=60/74, recordLength=16*4*beatSeconds;
  const range = (a,b) => a + Math.random() * (b-a);
  const normalize = name => name === 'farm' ? 'farm' : 'city';

  function makeAudio() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      ctx = new Audio({latencyHint:'interactive'});
      master = ctx.createGain();
      master.gain.value = floor;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -13;
      limiter.knee.value = 12;
      limiter.ratio.value = 3;
      master.connect(limiter);
      limiter.connect(ctx.destination);

      // Early wall reflections give close sounds an address in the apartment.
      roomSend = ctx.createGain();
      roomSend.gain.value = 0.17;
      for (const [time, volume, position] of [[0.037,.67,-.48],[.073,.44,.56],[.134,.28,-.22]]) {
        const delay = ctx.createDelay(.2), dark = ctx.createBiquadFilter();
        const level = ctx.createGain();
        delay.delayTime.value = time;
        dark.type = 'lowpass';
        dark.frequency.value = 1750;
        level.gain.value = volume;
        roomSend.connect(delay).connect(dark).connect(level);
        pan(level,master,position);
      }
      // Filtering one long shared noise sample avoids allocating on every footstep.
      noise = ctx.createBuffer(1,Math.round(ctx.sampleRate*3.13),ctx.sampleRate);
      const samples = noise.getChannelData(0);
      for (let i=0;i<samples.length;i++) samples[i] = range(-1,1);
      return true;
    } catch {
      if (ctx) ctx.close().catch(()=>{});
      ctx = null;
      return false;
    }
  }

  function pan(source,dest,position) {
    if (!ctx.createStereoPanner) { source.connect(dest); return null; }
    const panner = ctx.createStereoPanner();
    panner.pan.value = position;
    source.connect(panner).connect(dest);
    return panner;
  }
  function ramp(gain,value,seconds) {
    const now = ctx.currentTime;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(Math.max(floor,gain.value),now); }
    gain.linearRampToValueAtTime(value,now+seconds);
  }
  function filter(type,hz,q=.72) {
    const node = ctx.createBiquadFilter();
    node.type = type; node.frequency.value = hz; node.Q.value = q;
    return node;
  }
  function oscillator(wave,hz) {
    const o = ctx.createOscillator();
    o.type = wave; o.frequency.value = hz;
    return o;
  }
  function noiseSource() {
    const n=ctx.createBufferSource();
    n.buffer=noise; n.loop=true;
    return n;
  }
  function voice(source,t,duration,attack,volume,position,after,destination,room=0) {
    const gain=ctx.createGain(), out=after || source;
    if (after) source.connect(after);
    out.connect(gain);
    const panner=pan(gain,destination,position), reflections=room ? ctx.createGain() : null;
    if(reflections){ reflections.gain.value=room; gain.connect(reflections).connect(roomSend); }
    gain.gain.setValueAtTime(floor,t);
    gain.gain.linearRampToValueAtTime(volume,t+attack);
    gain.gain.exponentialRampToValueAtTime(floor,t+duration);
    source.onended=()=>{ for(const n of [source,after,gain,panner,reflections]) if(n)n.disconnect(); };
    if(source.buffer) source.start(t,range(0,2.6)); else source.start(t);
    source.stop(t+duration+.015);
    return panner;
  }
  function tapTone(t,f,to,duration,volume,position=0,wave='sine',attack=.008,dest=master,room=.4) {
    const o=oscillator(wave,f);
    o.frequency.exponentialRampToValueAtTime(to,t+duration);
    voice(o,t,duration,attack,volume,position,null,dest,room);
  }
  function rustle(t,center,q,duration,attack,volume,position,dest=master,room=0) {
    return voice(noiseSource(),t,duration,attack,volume,position,filter('bandpass',center,q),dest,room);
  }
  function bedTone(s,source,processor,volume,position) {
    const gain=ctx.createGain();
    gain.gain.value=volume;
    source.connect(processor).connect(gain);
    const panner=pan(gain,s.bus,position);
    source.onended=()=>{for (const n of [source,processor,gain,panner]) if(n)n.disconnect();};
    if(source.buffer)source.start(ctx.currentTime,range(0,2.5));else source.start();
    s.sources.push(source);
    return gain;
  }
  function retireScene() {
    clearTimeout(timer); timer=null;
    if(!scene)return;
    const old=scene; scene=null;
    ramp(old.bus.gain,floor,.35);
    for(const s of old.sources)try{s.stop(ctx.currentTime+.39);}catch{}
    setTimeout(()=>old.bus.disconnect(),750);
  }

  // The same four pitches come home in a different voicing.
  function signature(farm,dest,volume=1) {
    const freqs=farm?[220,329.628,369.994,293.665]:[293.665,369.994,329.628,220];
    const offsets=farm?[0,.37,.86,1.65]:[0,.51,.80,1.55];
    freqs.forEach((f,i)=>{
      const t=ctx.currentTime+.16+offsets[i],side=(i-1.5)*.14;
      tapTone(t,f*1.001,f,1.50,.064*volume,side,'sine',.015,dest,.68);
      tapTone(t,f*2.002,f*1.998,.62,.020*volume,side,'sine',.008,dest,.64);
      tapTone(t,f*3.991,f*3.986,.24,.008*volume,side,'sine',.007,dest,.60);
    });
  }
  function birds(s) {
    const t=ctx.currentTime+.05, root=range(1650,2480), side=range(-.86,.86);
    const phrase=Math.random()<.48?[[0,1,1.38,.10],[.15,1.22,.89,.19],[.43,1.08,1.32,.11]]:
      [[0,.97,1.27,.09],[.13,1.07,1.39,.09],[.29,1.37,.94,.21]];
    for(const [delay,start,end,length] of phrase){
      const o=oscillator('sine',root*start);
      o.frequency.setValueAtTime(root*start,t+delay);
      o.frequency.exponentialRampToValueAtTime(root*end,t+delay+length*.57);
      o.frequency.exponentialRampToValueAtTime(root*end*.94,t+delay+length);
      voice(o,t+delay,length,.025,range(.019,.037),side,null,s.bus);
    }
  }
  function woodCreak(s) {
    const t=ctx.currentTime+.02, base=range(122,172), side=range(-.55,.55);
    for(let i=0;i<4;i++) {
      const dt=[0,.055,.147,.294][i], f=base*(1+i*.033);
      tapTone(t+dt,f,f*.91,.14,.019/(1+i*.17),side,'triangle',.03,s.bus,.42);
      rustle(t+dt,840+i*78,1.6,.11,.025,.016,side,s.bus);
    }
  }
  function cityPass(s) {
    const length=range(3.5,6.8), t=ctx.currentTime+.03, side=Math.random()<.5?-1:1;
    const p=rustle(t,range(210,440),.69,length,length*.42,range(.043,.072),side*.48,s.bus);
    if(p)p.pan.linearRampToValueAtTime(-side*.48,t+length);
    if(Math.random()<.22){
      for(const f of [223,282]){
        tapTone(t+length*.47,f,f*.984,.49,.008,side*.36,'triangle',.11,s.bus);
      }
    }
  }
  function nextEvent(s,first=false) {
    const farm=s.world==='farm';
    timer=setTimeout(()=>{
      if(!enabled || hidden || scene!==s || ctx.state!=='running')return;
      if(farm){
        if(Math.random()<.76)birds(s);else woodCreak(s);
        s.wind.gain.setTargetAtTime(range(.045,.115),ctx.currentTime,1.7);
      }else cityPass(s);
      nextEvent(s);
    },1000*(first?range(2.2,4.6):farm?range(4,12):range(8,20)));
  }
  function startScene(playTheme) {
    if(!enabled || hidden || !ctx || ctx.state!=='running' || scene?.world===location)return;
    retireScene();
    const s=scene={world:location,bus:ctx.createGain(),sources:[]};
    s.bus.gain.value=floor; s.bus.connect(master); ramp(s.bus.gain,1,1.1);
    if(location==='farm'){
      bedTone(s,noiseSource(),filter('lowpass',385),.11,-.22);
      s.wind=bedTone(s,noiseSource(),filter('bandpass',970,.58),.065,.48);
    }else{
      bedTone(s,noiseSource(),filter('lowpass',225),.14,-.46);
      bedTone(s,noiseSource(),filter('bandpass',660,.64),.037,.27);
      bedTone(s,oscillator('sine',73.4),filter('lowpass',175),.011,.14);
      bedTone(s,oscillator('sine',147.1),filter('lowpass',175),.004,.18);
    }
    if(playTheme)signature(location==='farm',s.bus,.75);
    nextEvent(s,true);
  }

  // Blue Sugar Tin. A sixteen-bar F-major ballad played a little behind the beat.
  // Each melody entry is [beat, MIDI pitch, beats held]. The rests belong to the tune.
  const recordBars=[
    [41,[52,57,60,67],[[.68,69,.56],[1.6,72,.72],[2.65,74,1.06]]],
    [38,[53,57,60,64],[[.12,72,1.05],[1.65,69,.50],[2.3,65,1.15]]],
    [43,[53,58,62,69],[[.62,67,.62],[1.65,70,.46],[2.34,69,.64],[3.30,65,.47]]],
    [36,[52,58,62,69],[[.1,64,1.69],[3.23,67,.42]]],
    [45,[53,57,60,67],[[.12,69,.95],[1.63,72,.51],[2.35,76,1.23]]],
    [34,[53,57,62,65],[[.12,74,.95],[1.62,72,.55],[2.62,69,1.1]]],
    [35,[53,56,62,65],[[.58,68,.67],[1.62,71,.59],[2.65,74,.95]]],
    [36,[53,58,62,67],[[.12,72,1.62],[2.68,67,.5],[3.38,64,.39]]],
    [33,[52,55,60,64],[[.66,67,.46],[1.34,69,.62],[2.30,72,1.32]]],
    [38,[54,60,63,69],[[.12,75,.92],[1.64,72,.52],[2.42,69,1.19]]],
    [43,[53,58,62,69],[[.14,70,.87],[1.47,67,.63],[2.65,65,.47],[3.36,62,.45]]],
    [36,[52,58,62,69],[[.14,64,1.47],[2.65,67,.45],[3.35,70,.44]]],
    [41,[52,57,60,67],[[.12,69,.88],[1.64,72,.52],[2.36,74,1.38]]],
    [38,[53,57,60,64],[[.12,72,.92],[1.62,69,.63],[2.46,65,1.03]]],
    [43,[53,58,62,69],[[.14,67,1.25],[1.98,62,.75],[3.14,65,.62]]],
    [36,[52,58,62,69],[[.12,64,1.20],[1.96,62,.54],[2.69,60,.93]]]
  ];
  function makeScore() {
    const events=[];
    recordBars.forEach(([root,voicing,melody],bar)=>{
      const add=(beat,kind,pitch,duration,level)=>events.push({time:(bar*4+beat)*beatSeconds,kind,pitch,length:duration*beatSeconds,level});
      for(const [beat,pitch,length] of melody)add(beat,'keys',pitch,length,.33);
      const changes=[[.02,2.12],[2.70,.73],[3.69,.26]];
      const entries=bar%4===3?[changes[0],changes[2]]:bar%2?[[.66,1.50],[2.42,.89]]:[changes[0],changes[1]];
      for(const [at,len] of entries)voicing.forEach((pitch,j)=>add(at+j*.012,'keys',pitch,len,.12+j*.007));
      add(.008,'bass',root,1.61,.70);
      add(2.028,'bass',bar%4===2?root+3:root+7,bar%4===3?.79:1.25,.55);
      if(bar%4===3)add(3.33,'bass',recordBars[(bar+1)%16][0]-1,.51,.42);
      add(.04,'sweep',0,.7,.048); add(1.04,'brush',0,.34,.075);
      add(2.05,'sweep',0,.70,.040);add(3.05,'brush',0,.30,.064);
      if(bar%4===1)add(3.68,'brush',0,.20,.038);
    });
    return events.sort((a,b)=>a.time-b.time);
  }
  function makeInstruments() {
    const hz=22050;
    function build(seconds,sample) {
      const b=ctx.createBuffer(1,Math.ceil(seconds*hz),hz), data=b.getChannelData(0);
      for(let n=0;n<data.length;n++)data[n]=sample(n/hz,n);
      return b;
    }
    // Tines have a brief, bright attack above a slowly drifting pair of fundamentals.
    const keys=build(3.5,t=>{
      const phase=2*Math.PI*220*t, strike=Math.exp(-t*8.1), fade=Math.exp(-t*1.25);
      const body=Math.sin(phase+.13*strike*Math.sin(phase*2.003))+.18*Math.sin(phase*1.0013);
      return (1-Math.exp(-t*200))*fade*(.54*body+.19*Math.sin(phase*2.001)*Math.exp(-t*1.4)+.13*Math.sin(phase*4.006)*strike);
    });
    // A damped plucked string adds the woody scrape before the bass fundamental blooms.
    const string=new Float32Array(Math.round(hz/82.407));
    for(let i=0;i<string.length;i++)string[i]=range(-1,1);
    const bass=build(3.6,(t,n)=>{
      const pos=n%string.length, s=string[pos];
      string[pos]=.4978*(s+string[(pos+1)%string.length]);
      const p=2*Math.PI*82.407*t;
      return (1-Math.exp(-t*100))*(.80*s+.44*Math.sin(p)*Math.exp(-t*1.95)+.15*Math.sin(2*p+.1)*Math.exp(-t*4.1));
    });
    return {keys,bass};
  }
  function playRecordNote(d,event,t) {
    const {kind,pitch,length,level}=event;
    if(kind==='sweep'||kind==='brush'){
      const sweeping=kind==='sweep';
      rustle(t,range(sweeping?980:1850,sweeping?1350:2460),.8,length,sweeping?.19:.024,level,0,d.input);
      return;
    }
    const source=ctx.createBufferSource(),env=ctx.createGain(),bass=kind==='bass';
    source.buffer=instruments[kind];
    source.playbackRate.value=Math.pow(2,(pitch-(bass?40:57))/12);
    source.connect(env).connect(d.input);
    const velocity=level*range(.92,1.035);
    env.gain.setValueAtTime(velocity,t);
    env.gain.setValueAtTime(velocity,t+length);
    env.gain.exponentialRampToValueAtTime(floor,t+length+(bass?.19:.27));
    source.onended=()=>{source.disconnect();env.disconnect();};
    source.start(t);source.stop(t+length+.29);
  }
  function scheduleRecord(d) {
    if(deck!==d)return;
    // Look ahead only a little: movement and lifting the stylus remain responsive.
    const now=ctx.currentTime,until=now+.3;
    while(d.origin+score[d.index].time<until){
      const event=score[d.index],t=d.origin+event.time;
      if(t>=now-.02)playRecordNote(d,event,Math.max(now+.001,t));
      if(++d.index===score.length){d.index=0;d.origin+=recordLength;}
    }
    recordTimer=setTimeout(()=>scheduleRecord(d),140);
  }
  function positionRecord(force=false) {
    if(!deck)return;
    const now=ctx.currentTime;
    if(!force && now-deck.positionAt<.04)return;
    deck.positionAt=now;
    const dx=-5.7-ear.x,dz=2.42-ear.z,dist=Math.hypot(dx,dz);
    const right=(Math.cos(ear.yaw)*dx+Math.sin(ear.yaw)*dz)/Math.max(.45,dist);
    if(deck.pan)deck.pan.pan.setTargetAtTime(Math.max(-.86,Math.min(.86,right*.88)),now,.065);
    deck.level.gain.setTargetAtTime(.81/(1+.17*dist+.010*dist*dist),now,.10);
    deck.eq.frequency.setTargetAtTime(6150/(1+.078*dist),now,.13);
  }
  function pauseRecord(reset=false) {
    clearTimeout(recordTimer);recordTimer=null;
    if(deck){
      const d=deck;deck=null;
      recordOffset=((ctx.currentTime-d.origin)%recordLength+recordLength)%recordLength;
      ramp(d.input.gain,floor,.065);
      try{d.vinyl.stop(ctx.currentTime+.09);}catch{}
      setTimeout(()=>{for(const n of [d.input,d.eq,d.level,d.pan,d.vinyl,d.dust,d.dustLevel])if(n)n.disconnect();},150);
    }
    if(reset)recordOffset=0;
  }
  function syncRecord() {
    if(!recordWanted || !enabled || hidden || location!=='city' || ctx?.state!=='running'){
      pauseRecord();return;
    }
    if(deck)return;
    instruments=instruments||makeInstruments();score=score||makeScore();
    const d=deck={input:ctx.createGain(),eq:filter('lowpass',5400),level:ctx.createGain(),positionAt:-1};
    d.input.gain.value=floor;d.input.connect(d.eq);d.pan=pan(d.eq,d.level,0);
    d.level.gain.value=floor;d.level.connect(master);d.level.connect(roomSend);
    d.dust=filter('bandpass',2600,.59);d.dustLevel=ctx.createGain();d.dustLevel.gain.value=.013;
    d.vinyl=noiseSource();d.vinyl.connect(d.dust).connect(d.dustLevel).connect(d.input);d.vinyl.start();
    d.origin=ctx.currentTime+.06-recordOffset;
    d.index=score.findIndex(e=>e.time>=recordOffset);
    if(d.index===-1){d.index=0;d.origin+=recordLength;}
    ramp(d.input.gain,1,.10);positionRecord(true);scheduleRecord(d);
  }

  function clearUnlock() {
    document.removeEventListener('pointerdown',gesture);
    document.removeEventListener('keydown',gesture);
    unlocking=false;
  }
  function armUnlock() {
    if(unlocking)return;
    document.addEventListener('pointerdown',gesture,{passive:true});
    document.addEventListener('keydown',gesture);
    unlocking=true;
  }
  function gesture(){if(enabled && !hidden)wake();}
  function wake(theme=false) {
    if(!enabled || hidden || (!ctx && !makeAudio()))return;
    clearTimeout(napTimer);
    const finish=()=>{
      if(!enabled || hidden || ctx.state!=='running')return;
      clearUnlock(); ramp(master.gain,.70,.17); startScene(theme);syncRecord();
    };
    if(ctx.state==='running'){finish();return;}
    armUnlock();ctx.resume().then(finish).catch(()=>{});
  }
  function quiet() {
    clearUnlock(); retireScene();pauseRecord();
    if(!ctx)return;
    ramp(master.gain,floor,.12);
    clearTimeout(napTimer);
    napTimer=setTimeout(()=>{if(!enabled||hidden)ctx.suspend().catch(()=>{});},170);
  }
  return {
    record(playing) {
      recordWanted=!!playing;
      if(!recordWanted){pauseRecord(true);return;}
      syncRecord();
    },
    listener(x,z,yaw) {
      if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(yaw))return;
      ear.x=x;ear.z=z;ear.yaw=yaw;positionRecord();
    },
    enable(on,world=location) {
      location=normalize(world); const prior=enabled; enabled=!!on;
      if(!enabled){quiet();return;}
      wake(!prior);
    },
    world(world) {
      const next=normalize(world);if(next===location)return;
      location=next; lastStep=-10; if(enabled&&!hidden)wake(true);
    },
    suspend(value) {
      hidden=!!value;
      if(hidden)quiet();else if(enabled)wake(false);
    },
    step(world,sprint=false) {
      if(!enabled || hidden || ctx?.state!=='running')return;
      const t=ctx.currentTime, min=sprint?.275:.39;
      if(t-lastStep<min)return;
      lastStep=t; const foot=++stepNumber%2?1:-1, side=foot*.16, weight=sprint?1.22:1;
      if(normalize(world)==='farm'){
        tapTone(t,range(67,87),41,.12,.084*weight,side,'sine',.011,master,0);
        rustle(t,range(480,800),.72,.15,.016,.13*weight,side);
        rustle(t+.035,range(1250,2050),.80,.10,.023,.065*weight,side);
      }else{
        tapTone(t,range(95,126),54,.115,.095*weight,side,'sine',.005,master,.8);
        tapTone(t+.013,foot>0?214:188,foot>0?196:172,.074,.025,side,'triangle',.008,master,.72);
        rustle(t,range(850,1300),.72,.061,.004,.088*weight,side,master,.65);
        rustle(t+.061,range(450,650),.8,.072,.009,.042*weight,-side,master,.45);
      }
    },
    cue(name) {
      if(!enabled || hidden || ctx?.state!=='running')return;
      const t=ctx.currentTime;
      if(lastCue===name&&t-cueAt<.13)return;
      lastCue=name;cueAt=t;
      if(name==='sleep'){
        for(const [delay,f] of [[0,220],[.23,164.814],[.57,146.832]])tapTone(t+delay,f,f,1.15,.044,-.13,'sine',.055);
      }else if(name==='water'||name==='watering'){
        rustle(t,2190,.68,.76,.09,.12,.10);
        for(let i=0;i<7;i++){
          const f=range(540,1190);
          tapTone(t+.11+i*.084,f*.82,f,.075,range(.013,.030),range(-.18,.22),'sine',.006,master,0);
        }
      }else if(name==='harvest'||name==='plant'){
        rustle(t,range(970,1390),.70,.28,.035,.13,.03);
        rustle(t+.08,2660,.98,.13,.011,.056,-.04);
        if(name==='harvest')tapTone(t+.12,391.995,391.995,.44,.032,.12,'sine',.012);
      }else if(name==='trade'||name==='buy'||name==='sell'){
        tapTone(t,493.883,493.883,.12,.037,.025,'sine');
        const f=name==='sell'?391.995:659.255;
        tapTone(t+.095,f,f,.19,.028,.11,'sine');
      }else if(name==='repair'){
        for(const dt of [0,.19,.43]){
          tapTone(t+dt,range(118,145),72,.16,.11,-.15,'triangle',.004);
          rustle(t+dt,1990,.68,.09,.003,.09,-.14);
        }
      }else{
        rustle(t,1120,.75,.07,.005,.04,.035,master,.36);
      }
    }
  };
})();
