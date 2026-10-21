/* eslint-disable */
// BATEC homepage interactions, ported 1:1 from the approved design preview.
// One shared "pulse" drives the hero ECG, the BPM readouts, the beating heart and the wardrobe.
// initHome() wires everything to the server-rendered markup and returns a cleanup function.

export function initHome(opts) {
  var offs = [], observers = [], timers = [], raf = 0, stopped = false;
  function on(t, type, fn, o) { if (!t) return; t.addEventListener(type, fn, o); offs.push(function () { t.removeEventListener(type, fn, o); }); }
  var ResizeObserver = function (cb) { var o = new window.ResizeObserver(cb); observers.push(o); return o; };
  var IntersectionObserver = function (cb, o2) { var o = new window.IntersectionObserver(cb, o2); observers.push(o); return o; };

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};

  /* ---------- Shared pulse: one heart rate drives the whole page ---------- */
  var Pulse={bpm:72,target:72,phase:0,excite:0,heat:0,dwell:0,
    kick:function(n){this.excite=Math.min(30,this.excite+n)}};
  function envelope(p){return Math.exp(-Math.pow((p-0.05)/0.045,2))+0.55*Math.exp(-Math.pow((p-0.22)/0.05,2))}
  // Hot zones: the closer the pointer gets to a call to action, the faster the heart beats
  var hotEls=[].slice.call(document.querySelectorAll("[data-race]")), pointer={x:-9999,y:-9999,on:false};
  on(window,"pointermove",function(e){ if(e.pointerType==="mouse"||e.pointerType==="pen"){pointer.x=e.clientX;pointer.y=e.clientY;pointer.on=true} },{passive:true});
  on(document,"pointerleave",function(){pointer.on=false});
  hotEls.forEach(function(el){
    on(el,"focus",function(){el._focus=true}); on(el,"blur",function(){el._focus=false});
    on(el,"touchstart",function(){el._touch=performance.now()},{passive:true});
  });
  function measureHeat(dt){
    var R=320, best=0, inside=false;
    hotEls.forEach(function(el){
      var r=el.getBoundingClientRect(), h=0;
      if(pointer.on){
        var dx=Math.max(r.left-pointer.x,0,pointer.x-r.right), dy=Math.max(r.top-pointer.y,0,pointer.y-r.bottom), d=Math.hypot(dx,dy);
        var q=clamp(1-d/R,0,1); h=q*q*(3-2*q); if(d===0) inside=true;
      }
      if(el._focus) {h=Math.max(h,0.8); inside=true}
      if(el._touch && performance.now()-el._touch<1500) {h=Math.max(h,0.9); inside=true}
      el._h=(el._h||0)+(h-(el._h||0))*(1-Math.exp(-dt*6));
      el.style.setProperty("--heat",el._h.toFixed(3));
      best=Math.max(best,h);
    });
    Pulse.heat=best;
    Pulse.dwell=inside?Math.min(4,Pulse.dwell+dt):Math.max(0,Pulse.dwell-dt*0.8);
  }
  var bpmEls=[].slice.call(document.querySelectorAll("[data-bpm]")), zoneEls=[].slice.call(document.querySelectorAll("[data-zone]")), lastShown=72, lastZone="";

  /* ---------- Hero video ---------- */
  var vid=document.getElementById("heroVid"), vidBtn=document.getElementById("vidBtn");
  var portrait=matchMedia("(max-aspect-ratio: 3/4)").matches;
  vid.poster=portrait?"/hero/hero-mobile.jpg":"/hero/hero-desktop.jpg";
  vid.src=portrait?"/hero/hero-mobile.mp4":"/hero/hero-desktop.mp4";
  function setVidUI(playing){
    vidBtn.setAttribute("aria-label",playing?"Pause video":"Play video");
    vidBtn.querySelector("svg").innerHTML=playing?'<rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/>':'<path d="M3 1 L13 7 L3 13 Z"/>';
  }
  vid.muted=true;
  if(!reduce){var pr=vid.play(); if(pr&&pr.catch)pr.catch(function(){setVidUI(false)}); setVidUI(true)} else setVidUI(false);
  on(vidBtn,"click",function(){ if(vid.paused){vid.play();setVidUI(true)} else {vid.pause();setVidUI(false)} });

  /* ---------- ECG monitor (sweeping trace) ---------- */
  var cv=document.getElementById("ecg"), cx=cv.getContext("2d"), W=0,H=64,buf=null,head=0,dpr=1;
  function ecgAt(p){
    return 0.12*Math.exp(-Math.pow((p-0.9)/0.03,2))
      -0.14*Math.exp(-Math.pow((p-0.035)/0.008,2))
      +1.0*Math.exp(-Math.pow((p-0.05)/0.009,2))
      -0.3*Math.exp(-Math.pow((p-0.066)/0.01,2))
      +0.24*Math.exp(-Math.pow((p-0.32)/0.05,2));
  }
  function sizeECG(){
    dpr=Math.min(2,window.devicePixelRatio||1); W=Math.max(1,Math.round(cv.clientWidth));
    cv.width=W*dpr; cv.height=H*dpr; buf=new Float32Array(W).fill(NaN); head=0;
    if(reduce){ for(var x=0;x<W;x++) buf[x]=ecgAt(((x/W)*3.5)%1); head=W-1; drawECG(); }
  }
  function drawECG(){
    cx.setTransform(dpr,0,0,dpr,0,0); cx.clearRect(0,0,W,H);
    var mid=H*0.62, amp=H*0.5*(1+(Pulse.bpm-72)/160);
    var g=cx.createLinearGradient(0,0,W,0), hp=head/W, gap=28/W;
    var a0=1-0.75*hp;
    g.addColorStop(0,"rgba(230,0,53,"+a0.toFixed(3)+")");
    g.addColorStop(clamp(hp,0,1),"rgba(255,40,90,1)");
    if(hp+gap<1){g.addColorStop(clamp(hp+gap,0,1),"rgba(230,0,53,.22)"); g.addColorStop(1,"rgba(230,0,53,"+a0.toFixed(3)+")");}
    cx.lineJoin="round"; cx.lineCap="round";
    for(var pass=0;pass<2;pass++){
      cx.beginPath(); var pen=false;
      for(var x=0;x<W;x++){var v=buf[x]; if(v!==v){pen=false;continue} var y=mid-v*amp; if(!pen){cx.moveTo(x,y);pen=true} else cx.lineTo(x,y)}
      if(pass===0){cx.strokeStyle="rgba(230,0,53,.35)";cx.lineWidth=6;cx.filter="blur(4px)"} else {cx.filter="none";cx.strokeStyle=g;cx.lineWidth=2}
      cx.stroke();
    }
    cx.filter="none";
    if(!reduce && buf[head]===buf[head]){
      var hy=mid-buf[head]*amp;
      cx.fillStyle="rgba(255,90,130,.35)"; cx.beginPath(); cx.arc(head,hy,9,0,7); cx.fill();
      cx.fillStyle="#fff"; cx.beginPath(); cx.arc(head,hy,2.6,0,7); cx.fill();
    }
  }
  sizeECG(); if("ResizeObserver" in window) new ResizeObserver(function(){ if(Math.round(cv.clientWidth)!==W) sizeECG(); }).observe(cv); else on(window,"resize",sizeECG);

  /* ---------- Ticker driven by scroll velocity ---------- */
  var track=document.getElementById("tickerTrack"), tx=0, lastY=window.scrollY, vel=0, dir=1;
  on(window,"scroll",function(){var y=window.scrollY; var d=y-lastY; lastY=y; vel=clamp(vel+Math.abs(d)*0.6,0,900); if(d!==0)dir=d>0?1:-1},{passive:true});

  /* ---------- Big heart + ripples ---------- */
  var heart=document.getElementById("bigHeart"), rc=document.getElementById("ripples"), rx=rc.getContext("2d"), rings=[];
  function sizeRipples(){var r=rc.getBoundingClientRect(); rc.width=r.width*dpr; rc.height=r.height*dpr}
  sizeRipples(); if("ResizeObserver" in window) new ResizeObserver(sizeRipples).observe(rc); else on(window,"resize",sizeRipples);
  function drawRipples(dt){
    var w=rc.width/dpr,h=rc.height/dpr; rx.setTransform(dpr,0,0,dpr,0,0); rx.clearRect(0,0,w,h);
    rings=rings.filter(function(r){r.t+=dt;return r.t<1.6});
    rings.forEach(function(r){
      var k=r.t/1.6, s=0.42+k*0.75;
      rx.save(); rx.translate(w/2,h*0.5); rx.scale(s*w/100*0.55,s*w/100*0.55); rx.translate(-50,-46);
      rx.strokeStyle="rgba(230,0,53,"+(0.5*(1-k)).toFixed(3)+")"; rx.lineWidth=1.4/(s*w/100*0.55);
      rx.stroke(new Path2D("M50 90 C18 66 0 48 0 26 C0 11 11 0 26 0 C36 0 44 5 50 13 C56 5 64 0 74 0 C89 0 100 11 100 26 C100 48 82 66 50 90 Z"));
      rx.restore();
    });
  }

  /* ---------- Wardrobe ---------- */
  var tees=opts.tees;
  var STORE=opts.store;
  var N=tees.length, rack=document.getElementById("rack"), closet=document.getElementById("closet"), cabinet=document.getElementById("cabinet");
  var hookSVG='<svg class="hook" viewBox="0 0 60 92" aria-hidden="true"><defs><linearGradient id="hk" x1="0" x2="1"><stop offset="0" stop-color="#6c6c69"/><stop offset=".35" stop-color="#f8f8f5"/><stop offset=".62" stop-color="#a6a6a3"/><stop offset="1" stop-color="#585855"/></linearGradient></defs>'
    +'<path d="M30 92 V60 C30 52 36 49 41 42 C47 33 45 18 34 13 C24 9 13 15 13 26" fill="none" stroke="#1d1d1c" stroke-width="6.6" stroke-linecap="round"/>'
    +'<path d="M30 92 V60 C30 52 36 49 41 42 C47 33 45 18 34 13 C24 9 13 15 13 26" fill="none" stroke="url(#hk)" stroke-width="5" stroke-linecap="round"/>'
    +'<path d="M29 90 V60 C29 52 35 48.5 40 41.5 C46 33 44 19 33.5 14" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.1" stroke-linecap="round"/>'
    +'<rect x="25" y="62" width="10" height="13" rx="2.2" fill="url(#hk)" stroke="#2a2a28" stroke-width=".8"/></svg>';
  var els=tees.map(function(t,i){
    var b=document.createElement("button"), f="/products/melted-heart-tee/"+t[0]+"-front.webp", k="/products/melted-heart-tee/"+t[0]+"-back.webp";
    b.type="button"; b.className="tee"; b.setAttribute("role","option"); b.setAttribute("tabindex","-1");
    b.setAttribute("aria-label","Melted Heart Tee, "+t[1]+" / "+t[2]+", "+opts.priceWords);
    b.innerHTML=hookSVG+'<div class="card">'
      +'<div class="face front"><img src="'+f+'" alt="" draggable="false"><i class="shade" style="--m:url('+f+')"></i></div>'
      +'<div class="face back"><img src="'+k+'" alt="" draggable="false" loading="lazy"><i class="shade" style="--m:url('+k+')"></i></div></div>';
    rack.appendChild(b); return b;
  });
  var sw=document.getElementById("swatches"), swBtns=tees.map(function(t,i){
    var b=document.createElement("button"); b.type="button"; b.setAttribute("aria-label",t[1]+" / "+t[2]); b.setAttribute("aria-pressed","false");
    b.innerHTML='<span style="background:linear-gradient(135deg,'+t[3]+' 50%,'+(t[4].split("|")[0])+' 50%)"></span>';
    on(b,"click",function(){select(i,true)});
    sw.insertBefore(b,sw.querySelector(".nav-arrows")); return b;
  });
  // per-tee physical state: position, depth, turn, swing (spring), light
  var st=tees.map(function(){return{x:0,px:0,z:0,ry:0,rz:0,av:0,s:1,dim:0}});
  var focus=0, focusT=0, sel=0, TW=200, avail=0, dragging=false;
  function layoutSize(){
    var w=rack.clientWidth;
    TW = w<700 ? Math.min(w*0.56,280) : clamp(w*0.21,180,270);
    cabinet.style.setProperty("--tw",TW+"px"); avail=Math.max(0,w-TW);
    els.forEach(function(e){e.style.transformOrigin=(TW/2)+"px "+(TW*0.024).toFixed(1)+"px"});
    cabinet.style.setProperty("--drawer-h",(document.getElementById("drawerFront").offsetHeight+16)+"px");
  }
  layoutSize(); if("ResizeObserver" in window) new ResizeObserver(layoutSize).observe(rack); else on(window,"resize",layoutSize);
  if(matchMedia("(hover: none)").matches) document.getElementById("closetHint").textContent="Swipe along the rail · tap a tee to turn it";
  function idxFromX(clientX){var r=rack.getBoundingClientRect(); return clamp((clientX-r.left-TW/2)/Math.max(1,avail)*(N-1),0,N-1)}
  function updateFlipLabel(){document.getElementById("diFlip").textContent=els[sel].classList.contains("flipped")?"View front":"View back"}
  function select(i,jump){
    i=clamp(i,0,N-1);
    if(i!==sel){ els[sel].classList.remove("flipped"); sel=i; Pulse.kick(3); }
    if(jump) focusT=i;
    var t=tees[i];
    document.getElementById("diCount").textContent=String(i+1).padStart(2,"0")+" / "+String(N).padStart(2,"0");
    document.getElementById("diColor").textContent=t[1]+" / "+t[2];
    document.getElementById("diDot").style.background="linear-gradient(135deg,"+t[3]+" 50%,"+t[4].split("|")[0]+" 50%)";
    var buy=document.getElementById("diBuy");
    if(t[5]){ buy.href=STORE+"/products/"+t[5]; buy.classList.remove("soon"); buy.removeAttribute("aria-disabled"); buy.innerHTML='Buy now <span class="arrow" aria-hidden="true">↗</span>'; buy.setAttribute("aria-label","Buy "+t[1]+" / "+t[2]+", "+opts.priceWords+", in the BATEC store (opens in a new tab)"); }
    else { buy.removeAttribute("href"); buy.classList.add("soon"); buy.setAttribute("aria-disabled","true"); buy.textContent="Coming soon"; buy.removeAttribute("aria-label"); }
    els.forEach(function(e,k){e.setAttribute("aria-selected",k===i?"true":"false")});
    swBtns.forEach(function(b,k){b.setAttribute("aria-pressed",k===i?"true":"false")});
    updateFlipLabel();
  }
  function flip(i){ select(i); els[i].classList.toggle("flipped"); updateFlipLabel(); st[i].av+= (Math.random()<.5?-1:1)*40; }
  on(rack,"pointermove",function(e){ if(e.pointerType==="mouse"||e.pointerType==="pen"||dragging){ focusT=idxFromX(e.clientX); var r=Math.round(focusT); if(r!==sel)select(r)} });
  on(rack,"pointerdown",function(e){ if(e.pointerType!=="mouse"){dragging=true; focusT=idxFromX(e.clientX); select(Math.round(focusT))} });
  on(window,"pointerup",function(){dragging=false; focusT=sel});
  on(rack,"pointerleave",function(){ if(!dragging) focusT=sel });
  els.forEach(function(b,i){ on(b,"click",function(){ if(i===sel) flip(i); else select(i,true); }); });
  on(rack,"keydown",function(e){
    if(e.key==="ArrowRight"){select(sel+1,true);e.preventDefault()}
    else if(e.key==="ArrowLeft"){select(sel-1,true);e.preventDefault()}
    else if(e.key==="Enter"||e.key===" "){flip(sel);e.preventDefault()}
  });
  on(document.getElementById("prevTee"),"click",function(){select((sel-1+N)%N,true)});
  on(document.getElementById("nextTee"),"click",function(){select((sel+1)%N,true)});
  on(document.getElementById("diFlip"),"click",function(){flip(sel)});
  select(4,true); focus=4;

  function layoutRack(t,dt){
    var k=1-Math.exp(-dt*(reduce?60:7));
    focus+=(focusT-focus)*k;
    var sigma=1.0, spread=3.6, w=[], e=[], sum=0, i;
    for(i=0;i<N;i++) w[i]=Math.exp(-Math.pow((i-focus)/sigma,2));
    for(i=0;i<N-1;i++){e[i]=1+spread*(w[i]+w[i+1])/2; sum+=e[i]}
    var x=0;
    for(i=0;i<N;i++){
      var d=i-focus, near=w[i], c=st[i], side=clamp(d,-1,1);
      var tx=x, tz=150*near-30*(1-near), try_=-side*66*(1-near), ts=0.92+0.12*near, tdim=0.38*(1-near)+0.1*Math.abs(side)*(1-near);
      c.x+=(tx-c.x)*k; c.z+=(tz-c.z)*k; c.ry+=(try_-c.ry)*k; c.s+=(ts-c.s)*k; c.dim+=(tdim-c.dim)*k;
      // pendulum: pushed tees swing on their hook, then settle
      var vx=(c.x-c.px)/Math.max(dt,1e-3); c.px=c.x;
      var idle=reduce?0:Math.sin(t*0.0009+i*1.9)*0.6;
      var target=reduce?0:clamp(-vx*0.03,-12,12)+idle;
      c.av+=(-(c.rz-target)*38-c.av*4.2)*dt; c.rz+=c.av*dt;
      if(reduce){c.rz=0;c.av=0}
      var el=els[i];
      el.style.transform="translate3d("+c.x.toFixed(1)+"px,0,"+c.z.toFixed(1)+"px) rotateY("+c.ry.toFixed(2)+"deg) rotateZ("+c.rz.toFixed(2)+"deg) scale("+c.s.toFixed(3)+")";
      el.style.zIndex=String(100-Math.round(Math.abs(d)*10));
      el.style.setProperty("--dim",c.dim.toFixed(3));
      if(i<N-1) x+=e[i]*avail/sum;
    }
  }
  // Doors: closed until the wardrobe scrolls into view (only when it starts below the fold)
  if(!reduce && "IntersectionObserver" in window && cabinet.getBoundingClientRect().top>window.innerHeight){
    cabinet.classList.add("shut");
    var dio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting){ timers.push(setTimeout(function(){if(stopped)return;cabinet.classList.remove("shut"); Pulse.kick(6); st.forEach(function(c,i){c.av+=(i%2?1:-1)*(20+i*3)})},250)); dio.disconnect(); } })},{threshold:0.35});
    dio.observe(cabinet);
  }

  /* ---------- Campaign flash follows the pointer ---------- */
  document.querySelectorAll(".shot").forEach(function(s){
    on(s,"pointermove",function(e){var r=s.getBoundingClientRect(); s.style.setProperty("--mx",(e.clientX-r.left)+"px"); s.style.setProperty("--my",(e.clientY-r.top)+"px"); s.style.setProperty("--fl","1")});
    on(s,"pointerleave",function(){s.style.setProperty("--fl","0")});
  });

  /* ---------- Main loop ---------- */
  var last=performance.now(), heroVisible=true, worldVisible=true, closetVisible=true;
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(en){
      if(en.target===cv)heroVisible=en.isIntersecting; else if(en.target===rc)worldVisible=en.isIntersecting; else closetVisible=en.isIntersecting;})});
    io.observe(cv); io.observe(rc); io.observe(closet);
  }
  function frame(now){
    if(stopped) return;
    var dt=Math.min(0.05,(now-last)/1000); last=now;
    // heart rate: proximity heat + time spent on the button + excitement from the wardrobe, eased in slowly
    measureHeat(dt);
    Pulse.excite*=Math.exp(-dt*0.35);
    Pulse.target=72+30*Pulse.heat+22*(Pulse.dwell/4)+Pulse.excite;
    var up=Pulse.target>Pulse.bpm;
    Pulse.bpm+=(Pulse.target-Pulse.bpm)*(1-Math.exp(-dt*(up?0.7:0.45)));
    var prev=Pulse.phase; Pulse.phase=(Pulse.phase+dt*Pulse.bpm/60)%1;
    var beatNow = Pulse.phase<prev;
    var env=envelope(Pulse.phase);
    var shown=Math.round(Pulse.bpm); if(shown!==lastShown){lastShown=shown; bpmEls.forEach(function(b){b.textContent=shown})}
    var z=Pulse.bpm<86?"resting":Pulse.bpm<104?"warm":"hot"; if(z!==lastZone){lastZone=z; zoneEls.forEach(function(el){el.textContent=z; el.setAttribute("data-z",z)})}
    document.querySelectorAll(".bpm i").forEach(function(i){i.style.setProperty("--b",(1+env*0.35).toFixed(3))});
    if(!reduce){
      // ECG sweep
      if(heroVisible && W>0){
        var speed=W/3.2, nx=head+speed*dt, steps=Math.max(1,Math.floor(nx)-Math.floor(head));
        for(var s=1;s<=steps;s++){
          var px=(Math.floor(head)+s)%W, ph=(prev+ (Pulse.phase-prev+(beatNow?1:0))*(s/steps))%1;
          buf[px]=ecgAt(ph);
          for(var g=1;g<=28;g++) buf[(px+g)%W]=NaN;
        }
        head=nx%W; drawECG();
      }
      // ticker
      vel*=Math.exp(-dt*3);
      var spd=(60+vel)*dir; tx-=spd*dt; var half=track.scrollWidth/2; if(half>0){ if(tx<=-half)tx+=half; if(tx>0)tx-=half; } track.style.transform="translate3d("+tx.toFixed(1)+"px,0,0)";
      // heart
      if(worldVisible){
        heart.style.setProperty("--hb",(1+env*0.05).toFixed(4)); heart.style.setProperty("--hg",env.toFixed(3));
        if(beatNow) rings.push({t:0});
        drawRipples(dt);
      }
    }
    if(closetVisible) layoutRack(now,dt);
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  if(reduce){ layoutRack(0,1); }


  /* ---------- Next drop countdown (only with a real launch date) ---------- */
  var next=document.getElementById("next"),launch=next&&next.getAttribute("data-launch");
  if(launch){var t=Date.parse(launch); if(!isNaN(t)){document.getElementById("countdown").hidden=false;document.getElementById("cd-tba").hidden=true;
    var pad=function(n){return String(n).padStart(2,"0")};
    var tick=function(){var d=Math.max(0,t-Date.now());document.getElementById("cd-d").textContent=pad(Math.floor(d/864e5));document.getElementById("cd-h").textContent=pad(Math.floor(d/36e5)%24);document.getElementById("cd-m").textContent=pad(Math.floor(d/6e4)%60);document.getElementById("cd-s").textContent=pad(Math.floor(d/1e3)%60)};
    tick();timers.push(setInterval(tick,1000))}}


  return function cleanup() {
    stopped = true;
    cancelAnimationFrame(raf);
    offs.forEach(function (f) { f(); });
    observers.forEach(function (o) { o.disconnect(); });
    timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    els.forEach(function (e) { e.remove(); });
    swBtns.forEach(function (b) { b.remove(); });
    cabinet.classList.remove("shut");
  };
}
