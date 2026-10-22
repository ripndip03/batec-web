/* eslint-disable */
// BATEC homepage interactions, ported 1:1 from the approved design preview.
// One shared "pulse" drives the hero ECG, the BPM readouts, the beating heart, the wardrobe and the graffiti mural on its doors.
// initHome() wires everything to the server-rendered markup and returns a cleanup function.

export function initHome(opts) {
  var offs = [], observers = [], timers = [], raf = 0, stopped = false;
  function on(t, type, fn, o) { if (!t) return; t.addEventListener(type, fn, o); offs.push(function () { t.removeEventListener(type, fn, o); }); }
  function later(fn, ms) { var id = setTimeout(function () { if (!stopped) fn(); }, ms); timers.push(id); return id; }
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
  /* ---------- Graffiti mural painted on the wardrobe doors (original artwork, drawn live) ---------- */
  var doorEls=[cabinet.querySelector(".door.l"),cabinet.querySelector(".door.r")];
  var mCanvases=doorEls.map(function(d){var c=document.createElement("canvas");c.className="mural";c.setAttribute("aria-hidden","true");d.insertBefore(c,d.firstChild);return c});
  var mctx=mCanvases.map(function(c){return c.getContext("2d")});
  var MC=document.createElement("canvas"), mx=MC.getContext("2d");
  var TG=document.createElement("canvas"), tgx=TG.getContext("2d");
  var M={W:0,H:0,s:1,sL:1,dpr:1,back:null,front:null,marks:null,glow:null,corner:null,pat:null,clouds:[],flows:[],sparks:[],birds:[],melt:0.15,openT:-1,font:"Impact",env:0,base:0};
  var INK="#140f14", LINE="#2a1712";
  function rng(seed){return function(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  function layer(){var c=document.createElement("canvas");c.width=Math.ceil(M.W*M.dpr);c.height=Math.ceil(M.H*M.dpr);var g=c.getContext("2d");g.setTransform(M.dpr,0,0,M.dpr,0,0);g.lineJoin="round";g.lineCap="round";return [c,g]}
  function ink(g,fill,lw,col){g.fillStyle=fill;g.fill();g.lineWidth=lw;g.strokeStyle=col||INK;g.stroke()}
  function cyl(g,x0,x1,dark,mid,lit){var gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,dark);gr.addColorStop(0.5,mid);gr.addColorStop(0.86,lit);gr.addColorStop(1,mid);return gr}
  function palm(g,x,y,h,s,dark){
    g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+h*0.18,y-h*0.5,x+h*0.08,y-h);g.lineWidth=5*s;g.strokeStyle=INK;g.stroke();g.lineWidth=3*s;g.strokeStyle=dark?"#2a1d18":"#6b4630";g.stroke();
    var tx=x+h*0.08,ty=y-h;
    for(var i=0;i<8;i++){var a=-Math.PI*0.98+i*(Math.PI*0.98/7)+(i>3?0.12:-0.12),L=h*0.42;
      g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*L*0.6,ty+Math.sin(a)*L*0.6-7*s,tx+Math.cos(a)*L,ty+Math.sin(a)*L+L*0.38);
      g.lineWidth=5.5*s;g.strokeStyle=INK;g.stroke();g.lineWidth=3.4*s;g.strokeStyle=dark?(i%2?"#1d2a22":"#24352b"):(i%2?"#2f6b43":"#3f8a50");g.stroke();}
  }
  function block(g,r,x,bot,bw,bh,s,cols,lit,dark){
    var col=cols[Math.floor(r()*cols.length)];
    g.beginPath();g.rect(x,bot-bh,bw,bh+80*s);g.fillStyle=col;g.fill();
    g.fillStyle=dark?"rgba(0,0,0,.25)":"rgba(60,20,40,.22)";g.fillRect(x,bot-bh,bw*0.35,bh+80*s);
    if(!dark){g.fillStyle="rgba(255,170,100,.22)";g.fillRect(x+bw*0.72,bot-bh,bw*0.28,bh+80*s);}
    for(var wy=bot-bh+5*s;wy<bot;wy+=6.5*s)for(var wx=x+3*s;wx<x+bw-4*s;wx+=6*s){var v=r();g.fillStyle=v<lit?"rgba(255,214,140,.95)":(dark?"rgba(25,20,40,.9)":"rgba(70,50,90,.75)");g.fillRect(wx,wy,2.8*s,3.2*s)}
    if(r()<0.4){g.fillStyle=dark?"#141018":"#7a4a45";g.fillRect(x+bw*0.2,bot-bh-4*s,bw*0.25,4*s)}
    if(r()<0.25){g.beginPath();g.moveTo(x+bw*0.7,bot-bh);g.lineTo(x+bw*0.7,bot-bh-12*s);g.lineWidth=1*s;g.strokeStyle=dark?"#000":"#5a3a3a";g.stroke()}
    g.beginPath();g.rect(x,bot-bh,bw,bh+80*s);g.lineWidth=1*s;g.strokeStyle=dark?"rgba(0,0,0,.8)":"rgba(40,20,20,.55)";g.stroke();
  }
  function buildBack(){
    var L=layer(),c=L[0],g=L[1],r=rng(11),s=M.s,W=M.W,H=M.H,beach=M.hz+H*0.085;
    // Hotel Arts + Torre Mapfre on the seafront
    [W*0.1,W*0.135].forEach(function(x,i){var tt=beach-70*s-i*6*s;g.beginPath();g.rect(x-6*s,tt,12*s,beach-tt+20*s);g.fillStyle="#a98a86";g.fill();g.fillStyle="rgba(255,214,140,.75)";for(var wy=tt+4*s;wy<beach;wy+=4.5*s)g.fillRect(x-4*s,wy,8*s,1.1*s);g.strokeStyle="rgba(40,20,20,.55)";g.lineWidth=1*s;g.strokeRect(x-6*s,tt,12*s,beach-tt+20*s);
      g.strokeStyle="rgba(255,255,255,.35)";g.lineWidth=0.5*s;for(var gy=tt;gy<beach;gy+=10*s){g.beginPath();g.moveTo(x-6*s,gy);g.lineTo(x+6*s,gy+10*s);g.stroke()}});
    [[H*0.76,18,44,["#d9906a","#c4705a","#e8b48a","#b5604f","#dfa476","#c98563","#ecc79f","#cf8a7e"],0.14],[H*0.82,22,52,["#c07a5c","#a9614f","#d69a72","#b97a62","#e0b08a"],0.2]].forEach(function(rw){
      for(var x=-20*s;x<W;){var bw=(12+r()*28)*s,bh=(rw[1]+r()*(rw[2]-rw[1]))*s;block(g,r,x,rw[0],bw,bh,s,rw[3],rw[4],false);x+=bw}
    });
    var hz2=g.createLinearGradient(0,H*0.66,0,H*0.8);hz2.addColorStop(0,"rgba(255,170,140,.35)");hz2.addColorStop(1,"rgba(255,170,140,0)");g.fillStyle=hz2;g.globalCompositeOperation="source-atop";g.fillRect(0,H*0.6,W,H*0.25);g.globalCompositeOperation="source-over";
    M.back=c;
  }
  // Soft, painterly sunset clouds (pre-rendered, then drifted)
  function buildSky(){
    var cw=Math.ceil(M.W*1.6),c=document.createElement("canvas");c.width=Math.ceil(cw*M.dpr);c.height=Math.ceil(M.hz*M.dpr);var g=c.getContext("2d");g.setTransform(M.dpr,0,0,M.dpr,0,0);
    var r=rng(77),hz=M.hz,s=M.s;
    function puff(x,y,rx,ry,col,a){var gr=g.createRadialGradient(x,y,0,x,y,rx);gr.addColorStop(0,"rgba("+col+","+a+")");gr.addColorStop(1,"rgba("+col+",0)");g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);g.fillStyle=gr;g.fillRect(x-rx,y-rx,rx*2,rx*2);g.restore()}
    // high cirrus streaks catching pink light
    for(var i=0;i<26;i++){var y=hz*(0.08+r()*0.35),x=r()*cw,len=(120+r()*260)*s;for(var k=0;k<8;k++)puff(x+k*len/8,y+Math.sin(k)*2*s,len*0.14,3.5*s,"255,170,200",0.10+r()*0.06)}
    // mid-level cloud banks: dusky tops, glowing undersides
    for(i=0;i<16;i++){var by=hz*(0.45+r()*0.38),bx=r()*cw,bl=(160+r()*320)*s,f=by/hz;
      for(k=0;k<22;k++){var px=bx+r()*bl,py=by+(r()-.5)*10*s,pr=(16+r()*30)*s;
        puff(px,py-pr*0.25,pr,pr*0.42,f<0.65?"112,72,128":"150,82,120",0.22);
        puff(px,py+pr*0.12,pr*0.9,pr*0.22,f<0.65?"255,150,150":"255,176,110",0.30+f*0.25);}}
    // low haze band over the sea
    var hb=g.createLinearGradient(0,hz*0.8,0,hz);hb.addColorStop(0,"rgba(255,200,150,0)");hb.addColorStop(1,"rgba(255,215,160,.55)");g.fillStyle=hb;g.fillRect(0,hz*0.8,cw,hz*0.2);
    M.sky=c;M.skyW=cw;M.skyX=0;
  }
  function buildFront(){
    var L=layer(),c=L[0],g=L[1],r=rng(21),s=M.s,W=M.W,H=M.H,bot=H*0.92;
    for(var x=-20*s;x<W;){var bw=(18+r()*40)*s,bh=(18+r()*36)*s;block(g,r,x,bot,bw,bh,s,["#2c1f2e","#35233a","#281b2a","#3a2733"],0.28,true);x+=bw}
    palm(g,W*0.4,bot-10*s,58*M.sL,s,true);palm(g,W*0.7,bot-6*s,66*M.sL,s,true);palm(g,W*0.94,bot-8*s,52*M.sL,s,true);
    var gr=g.createLinearGradient(0,bot-30*s,0,H);gr.addColorStop(0,"rgba(20,10,30,0)");gr.addColorStop(1,"rgba(20,10,30,.6)");g.fillStyle=gr;g.fillRect(0,bot-30*s,W,H);
    M.front=c;
  }
  // ---- Sagrada Família
  function spire(g,x0,base,h,bw,s,kind,fl){
    var tipY=base-h, neck=tipY+h*0.16;
    g.beginPath();g.moveTo(x0-bw,base);g.lineTo(x0-bw,base-h*0.28);g.bezierCurveTo(x0-bw,base-h*0.62,x0-bw*0.42,neck+h*0.06,x0-bw*0.22,neck);g.lineTo(x0+bw*0.22,neck);g.bezierCurveTo(x0+bw*0.42,neck+h*0.06,x0+bw,base-h*0.62,x0+bw,base-h*0.28);g.lineTo(x0+bw,base);g.closePath();
    g.save();g.fillStyle=cyl(g,x0-bw,x0+bw,"#6a442d","#c99a66","#ffcf8e");g.fill();g.clip();
    // spiral of openings + vertical ribs
    for(var k=0,y=base-h*0.3;y>neck+6*s;y-=5.2*s,k++){var f=(base-y)/h,ww=bw*(1-Math.pow(f,1.6)*0.8),off=Math.sin(k*0.9)*ww*0.45;
      g.fillStyle="rgba(50,25,20,.85)";g.beginPath();g.ellipse(x0+off,y,Math.max(0.6*s,ww*0.14),1.9*s,0,0,7);g.fill();
      g.fillStyle="rgba(255,220,170,.35)";g.fillRect(x0+off+ww*0.14,y-1.5*s,0.8*s,3*s);}
    g.strokeStyle="rgba(60,35,25,.35)";g.lineWidth=0.7*s;for(var rx=-0.6;rx<=0.6;rx+=0.3){g.beginPath();g.moveTo(x0+rx*bw,base);g.quadraticCurveTo(x0+rx*bw*0.8,base-h*0.5,x0+rx*bw*0.2,neck);g.stroke()}
    g.restore();g.lineWidth=1.3*s;g.strokeStyle=LINE;g.stroke();
    // mosaic pinnacle (bishop's mitre style)
    var pw=bw*0.34;g.beginPath();g.moveTo(x0-pw,neck);g.lineTo(x0-pw*0.7,tipY+h*0.04);g.quadraticCurveTo(x0,tipY-h*0.01,x0+pw*0.7,tipY+h*0.04);g.lineTo(x0+pw,neck);g.closePath();
    g.save();g.fillStyle="#f3efe2";g.fill();g.clip();var mc=["#d23b3b","#f5c542","#f3efe2","#e8b23a","#b52a2a"];for(var yy=tipY-4*s;yy<neck;yy+=2.6*s)for(var xx=x0-pw;xx<x0+pw;xx+=2.6*s){g.fillStyle=mc[(Math.floor(xx*0.7+yy*1.3)%5+5)%5];g.fillRect(xx,yy,2.2*s,2.2*s)}g.restore();
    g.lineWidth=1.1*s;g.strokeStyle=LINE;g.stroke();
    for(var b=-1;b<=1;b++){g.beginPath();g.arc(x0+b*pw*0.55,tipY+h*0.035-Math.abs(b)*-2*s,1.9*s,0,7);ink(g,b?"#f5c542":"#ffffff",0.8*s,LINE)}
    if(kind==="cross"){var cy=tipY-12*s;g.save();g.shadowColor="rgba(190,220,255,1)";g.shadowBlur=14*s;g.fillStyle="#eaf4ff";g.fillRect(x0-1.6*s,cy-12*s,3.2*s,24*s);g.fillRect(x0-9*s,cy-1.6*s,18*s,3.2*s);g.restore();g.lineWidth=0.8*s;g.strokeStyle=LINE;g.strokeRect(x0-1.6*s,cy-12*s,3.2*s,24*s);g.strokeRect(x0-9*s,cy-1.6*s,18*s,3.2*s);}
    if(kind==="star"){g.save();g.shadowColor="rgba(255,240,200,1)";g.shadowBlur=12*s;g.beginPath();for(var i=0;i<12;i++){var a=i*Math.PI/6,rr=i%2?3*s:8*s;g.lineTo(x0+Math.cos(a)*rr,tipY-8*s+Math.sin(a)*rr)}g.closePath();g.fillStyle="#fff6d6";g.fill();g.restore();}
    fl.push({x:x0,y:neck-h*0.02,w:Math.max(2.4*s,bw*0.3),k:(x0*13%10)/10});
  }
  function crane(g,x,base,h,jib,s,dir){
    g.strokeStyle="rgba(250,190,70,.95)";g.lineWidth=1.4*s;g.beginPath();g.moveTo(x-2.5*s,base);g.lineTo(x-2.5*s,base-h);g.moveTo(x+2.5*s,base);g.lineTo(x+2.5*s,base-h);g.stroke();
    g.lineWidth=0.6*s;for(var y=base;y>base-h;y-=6*s){g.beginPath();g.moveTo(x-2.5*s,y);g.lineTo(x+2.5*s,y-6*s);g.stroke()}
    g.lineWidth=1.4*s;g.beginPath();g.moveTo(x-jib*0.25*dir,base-h);g.lineTo(x+jib*dir,base-h);g.moveTo(x,base-h);g.lineTo(x,base-h-10*s);g.lineTo(x+jib*0.8*dir,base-h);g.stroke();
    g.beginPath();g.moveTo(x+jib*0.6*dir,base-h);g.lineTo(x+jib*0.6*dir,base-h+18*s);g.lineWidth=0.6*s;g.stroke();
    g.fillStyle="#ff3b3b";g.beginPath();g.arc(x,base-h-10*s,1.8*s,0,7);g.fill();
  }
  // ---- Sagrada Família, 3/4 view with real volume (light from the sunset on the right), bold comic outline
  var SF_LIT=["#4e3221","#8f6542","#d6a970","#ffdca4","#9a6f48"],SF_FAR=["#3b281d","#6b4c35","#a8835c","#c9a77a","#73543b"];
  function sfGrad(g,x0,x1,far){var p=far?SF_FAR:SF_LIT,gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,p[0]);gr.addColorStop(0.28,p[1]);gr.addColorStop(0.66,p[2]);gr.addColorStop(0.84,p[3]);gr.addColorStop(1,p[4]);return gr}
  function sfTower(g,x,base,h,bw,s,o){
    o=o||{};var far=!!o.far,tipY=base-h,neck=tipY+h*0.17,sh=base-h*0.3,OUT=(far?1.6:2.4)*s;
    function hw(y){if(y>=sh)return bw;var t=(sh-y)/(sh-neck);return bw*(0.22+0.78*Math.pow(Math.max(0,1-t),1.05))}
    var P=new Path2D();P.moveTo(x-bw,base);P.lineTo(x-bw,sh);P.bezierCurveTo(x-bw,base-h*0.6,x-bw*0.45,neck+h*0.05,x-bw*0.22,neck);P.lineTo(x+bw*0.22,neck);P.bezierCurveTo(x+bw*0.45,neck+h*0.05,x+bw,base-h*0.6,x+bw,sh);P.lineTo(x+bw,base);P.closePath();
    g.save();g.fillStyle=sfGrad(g,x-bw,x+bw,far);g.fill(P);g.clip(P);
    // stacked tiers: each ring curves round the cylinder (3D), with a lit lip and a shadowed underside
    var tier=Math.max(4.5*s,h*0.055),k=0;
    for(var y=base-tier*0.6;y>neck;y-=tier,k++){var r=hw(y),e=r*0.24;
      g.beginPath();g.ellipse(x,y,r,e,0,0,Math.PI);g.lineWidth=Math.max(1,1.4*s);g.strokeStyle=far?"rgba(20,10,5,.55)":"rgba(45,25,12,.6)";g.stroke();
      g.beginPath();g.ellipse(x,y-1.3*s,r,e,0,0.15,Math.PI-0.15);g.lineWidth=Math.max(0.6,0.8*s);g.strokeStyle=far?"rgba(255,220,170,.18)":"rgba(255,232,190,.45)";g.stroke();
      // protruding blocks and openings wrapped on the cylinder
      for(var a=-1.2;a<=1.21;a+=0.6){var ang=a+(k%2)*0.3,cx2=x+r*Math.sin(ang),wid=r*0.2*Math.cos(ang);if(wid<0.6)continue;
        var yy=y-tier*0.82+e*Math.cos(ang),hh=tier*0.62;
        if((k+Math.round(a*10))%3===0){g.fillStyle=far?"rgba(15,8,5,.75)":"rgba(35,18,10,.85)";g.fillRect(cx2-wid*0.5,yy,wid,hh);g.fillStyle="rgba(255,200,130,"+(far?.12:.35)+")";g.fillRect(cx2+wid*0.32,yy+hh*0.1,Math.max(0.5,wid*0.18),hh*0.8)}
        else{g.fillStyle="rgba(255,236,200,"+(far?.08:(0.12+0.25*Math.max(0,Math.sin(ang+0.5))))+")";g.fillRect(cx2-wid*0.5,yy,wid,hh*0.8);g.fillStyle="rgba(40,20,10,.3)";g.fillRect(cx2-wid*0.5,yy+hh*0.8,wid,hh*0.2)}}}
    // turning edges darker, lit vertical band on the sunset side
    var cg=g.createLinearGradient(x-bw,0,x+bw,0);cg.addColorStop(0,"rgba(15,5,20,.55)");cg.addColorStop(0.3,"rgba(15,5,20,0)");cg.addColorStop(0.74,"rgba(255,235,200,.18)");cg.addColorStop(0.9,"rgba(0,0,0,0)");cg.addColorStop(1,"rgba(15,5,20,.35)");g.fillStyle=cg;g.fillRect(x-bw,tipY,bw*2,h);
    if(far){g.fillStyle="rgba(60,40,90,.25)";g.fillRect(x-bw,tipY,bw*2,h)}
    g.restore();
    g.lineJoin="round";g.lineWidth=OUT;g.strokeStyle=INK;g.stroke(P);
    // pinnacle: white stem, red ball, golden crown (the mosaic tops)
    var pw=bw*0.24,stemTop=tipY+h*0.04;
    var SP=new Path2D();SP.moveTo(x-pw,neck);SP.quadraticCurveTo(x-pw*0.75,neck-(neck-stemTop)*0.6,x-pw*0.35,stemTop);SP.lineTo(x+pw*0.35,stemTop);SP.quadraticCurveTo(x+pw*0.75,neck-(neck-stemTop)*0.6,x+pw,neck);SP.closePath();
    var sg=g.createLinearGradient(x-pw,0,x+pw,0);sg.addColorStop(0,"#b9b2a4");sg.addColorStop(0.6,"#fbf8f0");sg.addColorStop(1,"#d9d2c4");g.fillStyle=sg;g.fill(SP);g.lineWidth=OUT*0.7;g.strokeStyle=INK;g.stroke(SP);
    var rb=neck-(neck-stemTop)*0.45,br=Math.max(2,pw*0.95);
    function ball(cx3,cy3,r3,c1,c2){var bg=g.createRadialGradient(cx3+r3*0.35,cy3-r3*0.35,0,cx3,cy3,r3);bg.addColorStop(0,c1);bg.addColorStop(1,c2);g.beginPath();g.arc(cx3,cy3,r3,0,7);g.fillStyle=bg;g.fill();g.lineWidth=OUT*0.6;g.strokeStyle=INK;g.stroke()}
    ball(x,rb,br,"#ff6a5a","#9e1420");
    var cr=Math.max(2.4,pw*1.25),cy4=stemTop-cr*0.6;
    [-1,0,1].forEach(function(i){ball(x+i*cr*0.62,cy4+Math.abs(i)*cr*0.25,cr*(i?0.55:0.7),"#ffe9a0","#b8860b")});
    if(o.kind==="cross"){var cy=tipY-14*s,L=13*s,T=2.4*s;g.save();g.shadowColor="rgba(200,230,255,1)";g.shadowBlur=16*s;g.fillStyle="#f4faff";g.fillRect(x-T/2,cy-L,T,L*2);g.fillRect(x-L*0.7,cy-T/2,L*1.4,T);[[0,-L],[0,L],[-L*0.7,0],[L*0.7,0]].forEach(function(q){g.beginPath();g.arc(x+q[0],cy+q[1],T*0.9,0,7);g.fill()});g.restore();
      g.lineWidth=0.9*s;g.strokeStyle=INK;g.strokeRect(x-T/2,cy-L,T,L*2);g.strokeRect(x-L*0.7,cy-T/2,L*1.4,T);}
    if(o.kind==="star"){g.save();g.shadowColor="rgba(255,240,200,1)";g.shadowBlur=12*s;g.beginPath();for(var i=0;i<12;i++){var a2=i*Math.PI/6,rr=i%2?3*s:8.5*s;g.lineTo(x+Math.cos(a2)*rr,tipY-9*s+Math.sin(a2)*rr)}g.closePath();g.fillStyle="#fff6d6";g.fill();g.restore();g.lineWidth=0.8*s;g.strokeStyle=INK;g.stroke();}
    if(o.kind==="dove"){var dy=tipY-7*s;g.beginPath();g.moveTo(x-8*s,dy);g.quadraticCurveTo(x-4*s,dy-7*s,x,dy-1*s);g.quadraticCurveTo(x+4*s,dy-7*s,x+8*s,dy);g.quadraticCurveTo(x,dy+4*s,x-8*s,dy);g.closePath();g.fillStyle="#fbfbf7";g.fill();g.lineWidth=0.9*s;g.strokeStyle=INK;g.stroke();}
  }
  function sfCone(g,x,base,h,bw,s){
    var P=new Path2D();P.moveTo(x-bw,base);P.quadraticCurveTo(x-bw*0.9,base-h*0.55,x,base-h);P.quadraticCurveTo(x+bw*0.9,base-h*0.55,x+bw,base);P.closePath();
    g.fillStyle=sfGrad(g,x-bw,x+bw,false);g.fill(P);g.save();g.clip(P);g.strokeStyle="rgba(45,25,12,.5)";g.lineWidth=0.8*s;for(var y=base-h*0.2;y>base-h*0.85;y-=h*0.16){var r=bw*(1-(base-y)/h);g.beginPath();g.ellipse(x,y,r,r*0.25,0,0,Math.PI);g.stroke()}g.restore();
    g.lineWidth=1.6*s;g.strokeStyle=INK;g.stroke(P);g.beginPath();g.arc(x,base-h-1.6*s,2*s,0,7);g.fillStyle="#f5c542";g.fill();g.lineWidth=0.8*s;g.stroke();
  }
  function sagrada(g,cx,base,s,H,fl){
    var hMax=base-H*0.12,dx=22*s,dy=-15*s,OUT=2.4*s;
    crane(g,cx-120*s,base,hMax*0.78,70*s,s,1);crane(g,cx+128*s,base,hMax*0.68,60*s,s,-1);
    // far facade (seen through, darker and higher because it is further back)
    [[58,0.56],[74,0.63],[90,0.63],[106,0.56]].forEach(function(p){sfTower(g,cx+p[0]*s+dx,base+dy,hMax*p[1],10*s,s,{far:true})});
    // central towers: Evangelists, Mary (star) and Jesus (cross)
    sfTower(g,cx-44*s+dx*0.5,base-40*s,hMax*0.76-40*s,14*s,s,{kind:"dove"});
    sfTower(g,cx+44*s+dx*0.5,base-40*s,hMax*0.78-40*s,14*s,s,{kind:"dove"});
    sfTower(g,cx-22*s,base-40*s,hMax*0.86-40*s,15*s,s,{kind:"star"});
    sfTower(g,cx+24*s,base-40*s,hMax*0.82-40*s,14.5*s,s,{kind:"dove"});
    sfTower(g,cx+2*s,base-40*s,hMax-40*s,20*s,s,{kind:"cross"});
    // nave as a real block: lit right side, top face in perspective, front face
    var x0=cx-118*s,x1=cx+122*s,top=base-66*s;
    var R=new Path2D();R.moveTo(x1,base);R.lineTo(x1,top);R.lineTo(x1+dx,top+dy);R.lineTo(x1+dx,base+dy);R.closePath();var rg=g.createLinearGradient(x1,0,x1+dx,0);rg.addColorStop(0,"#e9bd84");rg.addColorStop(1,"#ffdba6");g.fillStyle=rg;g.fill(R);g.lineWidth=OUT;g.strokeStyle=INK;g.lineJoin="round";g.stroke(R);
    var T=new Path2D();T.moveTo(x0,top);T.lineTo(x0+dx,top+dy);T.lineTo(x1+dx,top+dy);T.lineTo(x1,top);T.closePath();g.fillStyle="#7d6a72";g.fill(T);g.save();g.clip(T);g.strokeStyle="rgba(30,20,30,.35)";g.lineWidth=0.8*s;for(var tx=x0;tx<x1+dx;tx+=7*s){g.beginPath();g.moveTo(tx,top);g.lineTo(tx+dx,top+dy);g.stroke()}g.restore();g.lineWidth=OUT;g.strokeStyle=INK;g.stroke(T);
    var F=new Path2D();F.rect(x0,top,x1-x0,base-top);g.fillStyle=sfGrad(g,x0,x1,false);g.fill(F);
    g.save();g.clip(F);
    // tall pointed windows with warm stained glass, buttresses between them
    for(var i=0;i<11;i++){var wx=x0+14*s+i*21*s,wy=base-12*s,wh=40*s,ww=7*s;
      g.beginPath();g.moveTo(wx-ww,wy);g.lineTo(wx-ww,wy-wh*0.7);g.quadraticCurveTo(wx,wy-wh*1.05,wx+ww,wy-wh*0.7);g.lineTo(wx+ww,wy);g.closePath();
      var gl=g.createLinearGradient(0,wy-wh,0,wy);gl.addColorStop(0,"#ffcf6a");gl.addColorStop(0.5,"#e0573f");gl.addColorStop(1,"#3a4fa8");g.fillStyle=gl;g.fill();g.lineWidth=1.2*s;g.strokeStyle=INK;g.stroke();
      g.beginPath();g.moveTo(wx,wy);g.lineTo(wx,wy-wh*0.85);g.moveTo(wx-ww,wy-wh*0.4);g.lineTo(wx+ww,wy-wh*0.4);g.lineWidth=0.7*s;g.stroke();
      var bx=wx+10.5*s;g.fillStyle="rgba(60,35,20,.35)";g.fillRect(bx-2.5*s,top,2*s,base-top);g.fillStyle="rgba(255,230,190,.35)";g.fillRect(bx-0.5*s,top,1.4*s,base-top);}
    g.strokeStyle="rgba(45,25,12,.45)";g.lineWidth=1*s;for(var ly=top+6*s;ly<base;ly+=16*s){g.beginPath();g.moveTo(x0,ly);g.lineTo(x1,ly);g.stroke()}
    g.restore();g.lineWidth=OUT;g.strokeStyle=INK;g.stroke(F);
    // little conical pinnacles crowding the roofline (Gaudí's "fruit" spires)
    for(i=0;i<14;i++){var px=x0+6*s+i*17.5*s+(i%2)*dx*0.5,pb=top+(i%2)*dy*0.5;sfCone(g,px,pb+2*s,(16+((i*7)%3)*6)*s,5*s,s)}
    // right side: a cluster of cones like the apse
    [[0,26],[9,34],[18,22]].forEach(function(q){sfCone(g,x1+q[0]*s+4*s,base+dy*0.4,q[1]*s,6*s,s)});
    // Passion facade towers (front left) and Nativity facade towers (front right)
    [[-104,0.5],[-88,0.6],[-72,0.6],[-56,0.5]].forEach(function(p){sfTower(g,cx+p[0]*s,base,hMax*p[1],12*s,s,{})});
    [[60,0.52],[76,0.62],[92,0.62],[108,0.52]].forEach(function(p){sfTower(g,cx+p[0]*s,base,hMax*p[1],12*s,s,{})});
    // Passion portico: slanted roof slab on leaning bone-like columns, statues in the shade
    var px0=cx-110*s,px1=cx-50*s,pm=(px0+px1)/2,pt=base-58*s;
    g.fillStyle="#2a1810";g.fillRect(px0+4*s,pt+10*s,px1-px0-8*s,base-pt-10*s);
    for(i=0;i<5;i++){var sx=px0+10*s+i*10*s;g.fillStyle="#efe8da";g.beginPath();g.ellipse(sx,base-7*s,2.3*s,6*s,0,0,7);g.fill();g.beginPath();g.arc(sx,base-14.5*s,1.9*s,0,7);g.fill()}
    [-0.42,-0.15,0.15,0.42].forEach(function(f2,j){var bx2=pm+f2*(px1-px0)*1.05;g.beginPath();g.moveTo(bx2-2.5*s,base);g.quadraticCurveTo(bx2+(j<2?5:-5)*s,base-25*s,bx2+(j<2?8:-8)*s,pt+12*s);g.lineWidth=5*s;g.strokeStyle=INK;g.stroke();g.lineWidth=3*s;g.strokeStyle="#d9b98a";g.stroke()});
    var RF=new Path2D();RF.moveTo(px0-8*s,pt+20*s);RF.lineTo(pm,pt-6*s);RF.lineTo(px1+8*s,pt+20*s);RF.lineTo(px1+8*s,pt+26*s);RF.lineTo(pm,pt);RF.lineTo(px0-8*s,pt+26*s);RF.closePath();
    var rfg=g.createLinearGradient(0,pt-6*s,0,pt+26*s);rfg.addColorStop(0,"#8c8f9e");rfg.addColorStop(1,"#4a4d5c");g.fillStyle=rfg;g.fill(RF);g.lineWidth=OUT;g.strokeStyle=INK;g.stroke(RF);
    g.save();g.clip(RF);g.strokeStyle="rgba(20,20,30,.4)";g.lineWidth=0.7*s;for(var rx=px0-8*s;rx<px1+8*s;rx+=4*s){g.beginPath();g.moveTo(rx,pt-8*s);g.lineTo(rx,pt+30*s);g.stroke()}g.restore();
    // stone grain on everything
    g.save();g.globalCompositeOperation="source-atop";var rr=rng(8);for(var n=0;n<2600;n++){var gx=cx-150*s+rr()*320*s,gy=base-hMax+rr()*hMax;g.fillStyle=rr()<.5?"rgba(60,30,20,.16)":"rgba(255,230,190,.14)";g.fillRect(gx,gy,1.1*s,1.1*s)}g.restore();
    // ground it in the city: a stone plaza under the temple, its shadow, trees, and Eixample blocks in front
    var gy0=base,gy1=base+H*0.07,pl=x0-34*s,pr=x1+dx+30*s;
    var PZ=new Path2D();PZ.moveTo(pl,gy0+4*s);PZ.lineTo(pl+dx,gy0+dy+4*s);PZ.lineTo(pr,gy0+dy+4*s);PZ.lineTo(pr-dx*0.2,gy1);PZ.lineTo(pl-dx*0.6,gy1);PZ.closePath();
    var pzg=g.createLinearGradient(0,gy0+dy,0,gy1);pzg.addColorStop(0,"#b89a7e");pzg.addColorStop(1,"#7e6250");g.fillStyle=pzg;g.fill(PZ);
    g.save();g.clip(PZ);var sh2=g.createRadialGradient(cx+dx*0.5,gy0+2*s,0,cx+dx*0.5,gy0+2*s,(x1-x0)*0.62);sh2.addColorStop(0,"rgba(30,10,30,.55)");sh2.addColorStop(1,"rgba(30,10,30,0)");g.save();g.translate(0,gy0);g.scale(1,0.28);g.fillStyle=sh2;g.fillRect(pl-20*s,-(x1-x0),pr-pl+40*s,(x1-x0)*2);g.restore();
      g.strokeStyle="rgba(60,35,25,.35)";g.lineWidth=0.7*s;for(var py=gy0+8*s;py<gy1;py+=6*s){g.beginPath();g.moveTo(pl-dx,py);g.lineTo(pr,py);g.stroke()}g.restore();
    g.lineWidth=1.6*s;g.strokeStyle=INK;g.stroke(PZ);
    // trees along the foot
    var tr=rng(17);for(i=0;i<9;i++){var tx2=pl+12*s+i*((pr-pl-24*s)/8),ty2=gy0+8*s+tr()*8*s,tw=(7+tr()*5)*s;
      g.beginPath();for(var b2=0;b2<4;b2++)g.arc(tx2+(b2-1.5)*tw*0.55,ty2-(b2%2)*tw*0.45,tw*0.62,0,Math.PI*2);var tg2=g.createRadialGradient(tx2+tw*0.4,ty2-tw*0.6,0,tx2,ty2,tw*1.6);tg2.addColorStop(0,"#7cc067");tg2.addColorStop(1,"#2c5a34");g.fillStyle=tg2;g.fill();g.lineWidth=1.2*s;g.strokeStyle=INK;g.stroke()}
    // a row of lit Eixample blocks in front hides the very bottom, so the temple sits among the streets
    var er=rng(23);for(var ex=pl-30*s;ex<pr+20*s;){var ebw=(14+er()*24)*s,ebh=(10+er()*16)*s;block(g,er,ex,gy1+2*s,ebw,ebh,s,["#c07a5c","#a9614f","#d69a72","#b97a62","#e0b08a"],0.2,false);g.beginPath();g.rect(ex,gy1+2*s-ebh,ebw,ebh);g.lineWidth=1.1*s;g.strokeStyle=INK;g.stroke();ex+=ebw}
  }
  function agbar(g,cx,base,s,H,fl){
    var h=H*0.56,w=Math.max(54*s,28),top=base-h,r=rng(4),R=w/2;
    var AP=new Path2D();AP.moveTo(cx-R,base);AP.lineTo(cx-R,top+w*0.95);AP.bezierCurveTo(cx-R,top+w*0.22,cx-w*0.22,top,cx,top);AP.bezierCurveTo(cx+w*0.22,top,cx+R,top+w*0.22,cx+R,top+w*0.95);AP.lineTo(cx+R,base);AP.closePath();M.agPath=AP;
    // soft contact shadow at the foot
    var cs0=g.createRadialGradient(cx,base,0,cx,base,w*0.9);cs0.addColorStop(0,"rgba(0,0,0,.5)");cs0.addColorStop(1,"rgba(0,0,0,0)");g.save();g.scale(1,0.25);g.fillStyle=cs0;g.fillRect(cx-w,base/0.25-w,w*2,w*2);g.restore();
    g.save();g.fillStyle="#141c44";g.fill(AP);g.clip(AP);
    // LED cells laid out on a cylinder: columns squeeze toward the edges, rows bow with the curvature
    var NC=20,rowH=Math.max(3.6*s,2.4),bow=rowH*0.9;
    for(var yy=top-rowH;yy<base;yy+=rowH){var f=Math.max(0,(yy-top)/h);
      for(var k=0;k<NC;k++){var a0=-Math.PI/2+Math.PI*k/NC,a1=-Math.PI/2+Math.PI*(k+1)/NC,x0=cx+R*Math.sin(a0),x1=cx+R*Math.sin(a1),y0=yy+bow*Math.cos(a0),y1=yy+bow*Math.cos(a1),am=(a0+a1)/2;
        var v=r(),light=0.45+0.55*Math.max(0,Math.cos(am-0.45));
        var hue=(205+f*215+Math.sin(k*0.7+yy*0.04)*18)%360;if(v>0.8&&v<0.9)hue=(hue+120+v*600)%360;
        var lum=(36+v*24)*light+8,inset=Math.min(0.9,(x1-x0)*0.12);
        g.beginPath();g.moveTo(x0+inset,y0+inset);g.lineTo(x1-inset,y1+inset);g.lineTo(x1-inset,y1+rowH-inset);g.lineTo(x0+inset,y0+rowH-inset);g.closePath();
        g.fillStyle=v<0.93?"hsl("+hue.toFixed(0)+",92%,"+lum.toFixed(0)+"%)":"rgba(255,255,255,"+(0.5+0.4*light).toFixed(2)+")";g.fill();}}
    // cylinder shading: dark turning edges, a bright vertical band where it faces the sunset
    var cg=g.createLinearGradient(cx-R,0,cx+R,0);cg.addColorStop(0,"rgba(0,0,20,.75)");cg.addColorStop(0.18,"rgba(0,0,20,.25)");cg.addColorStop(0.5,"rgba(0,0,0,0)");cg.addColorStop(0.68,"rgba(255,235,215,.28)");cg.addColorStop(0.76,"rgba(255,255,255,.08)");cg.addColorStop(0.92,"rgba(0,0,20,.35)");cg.addColorStop(1,"rgba(0,0,20,.7)");
    g.fillStyle=cg;g.fillRect(cx-R,top,w,h);
    var dome=g.createRadialGradient(cx+w*0.14,top+w*0.28,0,cx,top+w*0.35,w*0.62);dome.addColorStop(0,"rgba(235,245,255,.7)");dome.addColorStop(0.5,"rgba(220,240,255,.15)");dome.addColorStop(1,"rgba(220,240,255,0)");g.fillStyle=dome;g.fillRect(cx-R,top,w,w);
    g.restore();
    // bold outline + warm rim light on the sunset side
    g.lineJoin="round";g.lineWidth=3.2*s;g.strokeStyle=INK;g.stroke(AP);
    g.save();g.clip(AP);g.beginPath();g.moveTo(cx+R-2.2*s,base);g.lineTo(cx+R-2.2*s,top+w*0.95);g.bezierCurveTo(cx+R-2.2*s,top+w*0.3,cx+w*0.22,top+2*s,cx,top+2.2*s);g.lineWidth=2*s;g.strokeStyle="rgba(255,205,160,.7)";g.stroke();g.restore();
    [-0.3,-0.05,0.2,0.36].forEach(function(o,i){fl.push({x:cx+o*w,y:top+w*(0.12+Math.abs(o)*0.45),w:(3+i%2)*s,k:0.3+i*0.2})});
  }

  function telefonica(g,cx,base,s,H,fl){
    g.beginPath();g.moveTo(cx-120*s,base);g.quadraticCurveTo(cx-40*s,base-50*s,cx+10*s,base-48*s);g.quadraticCurveTo(cx+90*s,base-44*s,cx+160*s,base);g.closePath();
    var hill=g.createLinearGradient(0,base-50*s,0,base);hill.addColorStop(0,"#3d6a45");hill.addColorStop(1,"#1e3326");ink(g,hill,1.6*s);
    var b=base-44*s,topY=H*0.05,h=b-topY;
    var Lc=[[cx-10*s,b],[cx-6*s,b-h*0.35],[cx-22*s,b-h*0.7],[cx-30*s,topY+h*0.18]],Rc=[[cx+12*s,b],[cx+6*s,b-h*0.35],[cx-12*s,b-h*0.7],[cx-24*s,topY+h*0.17]];
    var P=new Path2D();P.moveTo(Lc[0][0],Lc[0][1]);P.bezierCurveTo(Lc[1][0],Lc[1][1],Lc[2][0],Lc[2][1],Lc[3][0],Lc[3][1]);P.lineTo(Rc[3][0],Rc[3][1]);P.bezierCurveTo(Rc[2][0],Rc[2][1],Rc[1][0],Rc[1][1],Rc[0][0],Rc[0][1]);P.closePath();
    // crisp white concrete with real volume: shadowed left edge, lit right edge
    g.fillStyle=cyl(g,cx-30*s,cx+12*s,"#8d89a6","#eeecf6","#ffffff");g.fill(P);
    g.save();g.clip(P);var sh=g.createLinearGradient(cx-30*s,0,cx+12*s,0);sh.addColorStop(0,"rgba(30,20,60,.55)");sh.addColorStop(0.35,"rgba(30,20,60,0)");sh.addColorStop(0.75,"rgba(255,220,190,.35)");sh.addColorStop(1,"rgba(30,20,60,.25)");g.fillStyle=sh;g.fillRect(cx-40*s,topY,60*s,h+10*s);g.restore();
    g.lineJoin="round";g.lineWidth=2.6*s;g.strokeStyle=INK;g.stroke(P);
    // the ring, clean and bold
    var rx=cx-24*s,ry=topY+h*0.3;
    g.beginPath();g.moveTo(cx-28*s,topY+h*0.18);g.lineTo(cx-40*s,topY);g.lineWidth=4*s;g.strokeStyle=INK;g.stroke();g.lineWidth=2*s;g.strokeStyle="#ffffff";g.stroke();
    g.beginPath();g.arc(cx-40*s,topY,3*s,0,7);ink(g,"#ff5a7a",1.2*s);
    // centre line of the shaft (for the drop that slides down it)
    M.telP={L:Lc,R:Rc,ring:[rx,ry],s:s,P:P};
  }
  function bz(p,t){var u=1-t;return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]]}
  // The tower itself melts like soft white wax. Ring, drips and drops are drawn as one "gooey" shape
  // (blurred + thresholded), so every joint is round and drops pinch off smoothly.
  var GOO={a:document.createElement("canvas"),b:document.createElement("canvas"),m:document.createElement("canvas"),t:document.createElement("canvas")};
  function drawTelDrop(g,t){
    var T=M.telP;if(!T)return;var s=T.s,S=0.8+0.2*(M.melt||0),d=M.dpr;
    var rx=T.ring[0],ry=T.ring[1],bx=rx-48*s,by=ry-22*s,bw=96*s,bh=250*s,W2=Math.ceil(bw*d),H2=Math.ceil(bh*d);
    [GOO.a,GOO.b,GOO.m,GOO.t].forEach(function(c){if(c.width!==W2||c.height!==H2){c.width=W2;c.height=H2}});
    var ga=GOO.a.getContext("2d");ga.setTransform(1,0,0,1,0,0);ga.clearRect(0,0,W2,H2);ga.setTransform(d,0,0,d,-bx*d,-by*d);ga.fillStyle="#000";ga.strokeStyle="#000";ga.lineCap="round";ga.lineJoin="round";
    var a=30*s,b=10*s,rot=-0.35,cs=Math.cos(rot),sn=Math.sin(rot);
    function sag(th){return S*s*(4+20*Math.pow(Math.max(0,Math.sin(th)),1.4)*(0.9+0.1*Math.sin(t*0.8+th*2)))}
    function rp(th){var x=a*Math.cos(th),y=b*Math.sin(th);return [rx+x*cs-y*sn,ry+x*sn+y*cs+sag(th)]}
    // ring band
    ga.beginPath();for(var k=0;k<=80;k++){var q=rp(k/80*Math.PI*2);if(k)ga.lineTo(q[0],q[1]);else ga.moveTo(q[0],q[1])}ga.closePath();ga.lineWidth=5.5*s;ga.stroke();
    // drips hanging from the lowest part; each swells, the long ones pinch off a drop
    var bulbs=[];
    [[1.0,0.55,0,0],[1.45,1.0,1.7,1],[1.9,0.75,3.1,0],[2.4,1.15,4.6,1],[2.85,0.5,0.9,0]].forEach(function(q){
      var r0=rp(q[0]),c=(t*0.16+q[2]*0.13)%1,L,R,base=(10+34*q[1])*s*S;
      if(q[3]){var gc=Math.min(1,c/0.8);L=base*(0.5+0.9*gc*gc);R=(3.6+2.6*gc)*s;}
      else{L=base*(0.85+0.15*Math.sin(t*0.7+q[2]));R=(3.4+1.2*q[1])*s;}
      ga.beginPath();ga.moveTo(r0[0],r0[1]);ga.quadraticCurveTo(r0[0]+1.5*s,r0[1]+L*0.5,r0[0],r0[1]+L);ga.lineWidth=R*1.15;ga.stroke();
      ga.beginPath();ga.arc(r0[0],r0[1]+L,R,0,7);ga.fill();bulbs.push([r0[0],r0[1]+L,R]);
      if(q[3]&&c>0.8){var f=(c-0.8)/0.2,yy=r0[1]+L+R*0.6+f*f*150*s,st2=1.4+1.6*f;ga.beginPath();ga.ellipse(r0[0],yy,R*0.78,R*st2,0,0,7);ga.fill();ga.beginPath();ga.moveTo(r0[0],yy-R*st2*0.6);ga.lineTo(r0[0],yy-R*st2*(1.6+f));ga.lineWidth=R*0.7*(1-f*0.6);ga.stroke();bulbs.push([r0[0],yy+R*st2*0.25,R*0.8])}});
    // a thick coat of wax rolling down the front of the shaft
    var fr=rp(Math.PI/2),cL=(48+10*Math.sin(t*0.5))*s*S;ga.beginPath();ga.moveTo(fr[0],fr[1]);ga.quadraticCurveTo(fr[0]+3*s,fr[1]+cL*0.5,fr[0]+4*s,fr[1]+cL);ga.lineWidth=7*s;ga.stroke();ga.beginPath();ga.arc(fr[0]+4*s,fr[1]+cL,5.5*s,0,7);ga.fill();bulbs.push([fr[0]+4*s,fr[1]+cL,5.5*s]);
    // gooey: blur, then sharpen the alpha back into a smooth edge
    var gb=GOO.b.getContext("2d");gb.setTransform(1,0,0,1,0,0);gb.clearRect(0,0,W2,H2);gb.filter="blur("+(2.6*s*d).toFixed(1)+"px)";gb.drawImage(GOO.a,0,0);gb.filter="none";
    var im=gb.getImageData(0,0,W2,H2),px=im.data;for(var n=3;n<px.length;n+=4){var v=(px[n]-120)*7;px[n]=v<0?0:v>255?255:v;px[n-3]=px[n-2]=px[n-1]=255}
    var gm=GOO.m.getContext("2d");gm.putImageData(im,0,0);
    var gt=GOO.t.getContext("2d");
    function tinted(fill,cutDx,cutDy){gt.setTransform(1,0,0,1,0,0);gt.globalCompositeOperation="source-over";gt.clearRect(0,0,W2,H2);gt.drawImage(GOO.m,0,0);gt.globalCompositeOperation="source-in";gt.fillStyle=fill;gt.fillRect(0,0,W2,H2);
      if(cutDx!==undefined){gt.globalCompositeOperation="destination-out";gt.drawImage(GOO.m,cutDx*d,cutDy*d)}gt.globalCompositeOperation="source-over";return GOO.t}
    g.save();
    // bold outline all round (also inside the ring hole)
    var o=2.2*s;tinted(INK);[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]].forEach(function(q){g.drawImage(GOO.t,bx+q[0]*o,by+q[1]*o,bw,bh)});
    // body: soft white wax, lit from the sunset on the right
    var wg=gt.createLinearGradient(0,0,W2,0);wg.addColorStop(0,"#b3afcb");wg.addColorStop(0.45,"#eceaf6");wg.addColorStop(0.7,"#ffffff");wg.addColorStop(1,"#e2dcea");
    tinted(wg);g.drawImage(GOO.t,bx,by,bw,bh);
    // round volume: shadow on the lower-right of every blob, glossy rim on the upper-left
    tinted("rgba(60,45,90,1)",-2.4*s,-3*s);g.globalAlpha=0.32;g.drawImage(GOO.t,bx,by,bw,bh);
    tinted("#ffffff",1.4*s,2*s);g.globalAlpha=0.9;g.drawImage(GOO.t,bx,by,bw,bh);g.globalAlpha=1;
    // specular dots on each bulb
    bulbs.forEach(function(q){g.beginPath();g.ellipse(q[0]-q[2]*0.35,q[1]-q[2]*0.3,q[2]*0.28,q[2]*0.38,-0.4,0,7);g.fillStyle="rgba(255,255,255,.95)";g.fill()});
    g.restore();
  }


  function buildMarks(){
    var L=layer(),c=L[0],g=L[1],W=M.W,H=M.H,base=H*0.9,s=M.sL;M.base=base;M.flows=[];
    var narrow=W<700,dummy=[];
    var A=layer();agbar(A[1],W*(narrow?0.62:0.6),base,s,H,dummy);M.ag=A[0];M.agP={cx:W*(narrow?0.62:0.6),h:H*0.56,w:Math.max(54*s,28)};M.agP.top=base-M.agP.h;M.agP.cut=M.agP.top+M.agP.h*0.36;
    telefonica(g,W*0.86,base,s,H,M.flows);
    sagrada(g,W*(narrow?0.32:0.3),base-H*0.065,s,H,dummy);
    M.marks=c;
    // colour of the Agbar facade just under the melt line, per finger
    var agc=A[1].getImageData(0,0,1,1);M.agFingers=[];var rr=rng(19),P=M.agP;
    for(var i=0;i<7;i++){var u=0.08+i*0.14+(rr()-.5)*0.05,fx=P.cx-P.w/2+u*P.w,px=A[0].getContext("2d").getImageData(Math.round(fx*M.dpr),Math.round((P.cut-3)*M.dpr),1,1).data;
      M.agFingers.push({u:u,len:0.45+rr()*0.95,ph:rr()*6,w:(0.07+rr()*0.06),col:"rgb("+px[0]+","+px[1]+","+px[2]+")"})}
    var G=layer(),gc=G[0],gg=G[1];gg.shadowColor="rgba(170,80,255,.9)";gg.shadowBlur=24*s;[c,M.ag].forEach(function(l){gg.drawImage(l,0,0,W,H)});gg.shadowColor="rgba(255,200,240,.8)";gg.shadowBlur=8*s;[c,M.ag].forEach(function(l){gg.drawImage(l,0,0,W,H)});M.glow=gc;
  }
  function buildCorner(){
    var L=layer(),c=L[0],g=L[1],W=M.W,H=M.H,s=M.sL,r=rng(31),cw=Math.min(W*0.3,280*s),ch=Math.min(H*0.24,120*s),y0=H-ch;
    g.save();g.beginPath();g.moveTo(0,y0+ch*0.2);g.bezierCurveTo(cw*0.35,y0-ch*0.05,cw*0.75,y0+ch*0.35,cw,y0+ch*0.75);g.quadraticCurveTo(cw*1.04,H,cw*1.06,H+4);g.lineTo(0,H+4);g.closePath();
    g.fillStyle="#2d4fb8";g.fill();g.clip();var pal=["#2d4fb8","#3b6fe0","#f4f1e6","#7fb8f0","#1f2f7a","#f2c230","#58b36a"],cell=9*s;
    for(var y=y0-cell;y<H+cell;y+=cell)for(var x=-cell;x<cw*1.1;x+=cell){var j=function(){return (r()-.5)*cell*0.55};g.beginPath();g.moveTo(x+j(),y+j());g.lineTo(x+cell+j(),y+j());g.lineTo(x+cell+j(),y+cell+j());g.lineTo(x+j(),y+cell+j());g.closePath();g.fillStyle=pal[Math.floor(r()*pal.length)];g.fill();g.lineWidth=0.9*s;g.strokeStyle=INK;g.stroke()}
    var sh=g.createLinearGradient(0,y0,0,H);sh.addColorStop(0,"rgba(255,200,140,.2)");sh.addColorStop(1,"rgba(20,10,30,.55)");g.fillStyle=sh;g.fillRect(0,y0-cell,cw*1.1,ch+cell);
    g.restore();
    g.beginPath();g.moveTo(0,y0+ch*0.2);g.bezierCurveTo(cw*0.35,y0-ch*0.05,cw*0.75,y0+ch*0.35,cw,y0+ch*0.75);g.lineWidth=10*s;g.strokeStyle=INK;g.stroke();g.lineWidth=6.5*s;g.strokeStyle="#f5c542";g.stroke();
    M.corner=c;
  }
  function layoutMural(){
    var w=doorEls[0].offsetWidth,h=doorEls[0].offsetHeight; if(!w||!h)return;
    M.dpr=Math.min(1.5,window.devicePixelRatio||1); M.W=w*2; M.H=h; M.s=clamp(Math.min(h/560,M.W/760),0.4,1.5); M.sL=clamp(Math.min(h/440,M.W/440),0.45,1.5);
    MC.width=TG.width=Math.ceil(M.W*M.dpr); MC.height=TG.height=Math.ceil(M.H*M.dpr);
    mCanvases.forEach(function(c){c.width=Math.ceil(w*M.dpr);c.height=Math.ceil(h*M.dpr)});
    var d=document.createElement("canvas");d.width=d.height=6;var dg=d.getContext("2d");dg.fillStyle="#000";dg.beginPath();dg.arc(3,3,1,0,7);dg.fill();M.pat=mx.createPattern(d,"repeat");
    var r=rng(3),s=M.s,i; M.hz=M.H*0.56;
    M.sparks=[];for(i=0;i<6;i++)M.sparks.push({x:0.03+r()*0.3,y:0.05+r()*0.25,ph:r()*9,sz:(4+r()*6)});
    M.birds=[];for(i=0;i<4;i++)M.birds.push({x:r()*M.W,y:M.H*(0.12+r()*0.25),sp:(10+r()*10)*s,ph:r()*6});
    buildSky(); buildBack(); buildVela(); buildMarks(); buildFront(); buildLizard();
    var f=(getComputedStyle(document.documentElement).getPropertyValue("--f-graffiti")||"").trim(); if(f) M.font=f;
  }
  function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
  function rgb(c){return "rgb("+c.map(function(v){return Math.round(v)}).join(",")+")"}
  function cloud(g,c,t,hz){
    var x0=c.x,y0=c.y+Math.sin(t*0.4+c.seed)*2*M.s,L=c.len,T=c.th,n=c.n,f=clamp(y0/hz,0,1);
    g.beginPath();g.moveTo(x0,y0);
    for(var k=0;k<n;k++){var xa=x0+L*(k/n),xb=x0+L*((k+1)/n),b=T*(0.8+0.3*Math.sin(k*1.7+c.seed+t*0.35));g.bezierCurveTo(xa+(xb-xa)*0.1,y0-b*1.3,xb-(xb-xa)*0.1,y0-b*1.3,xb,y0-(k===n-1?0:T*0.06))}
    g.bezierCurveTo(x0+L*0.7,y0+T*0.5,x0+L*0.25,y0+T*0.35,x0,y0);g.closePath();
    var topC=mix([92,58,120],[196,92,140],f), lowC=mix([214,110,150],[255,184,110],f), cg=g.createLinearGradient(0,y0-T*1.2,0,y0+T*0.5);
    cg.addColorStop(0,rgb(topC));cg.addColorStop(0.65,rgb(mix(topC,lowC,0.6)));cg.addColorStop(1,rgb(lowC));g.fillStyle=cg;g.fill();
    g.save();g.clip();g.globalAlpha=0.14;g.fillStyle=M.pat;g.fillRect(x0-T,y0-T*2,L+T*2,T*3);g.restore();
    g.lineWidth=1.1*M.s;g.strokeStyle="rgba(20,15,20,.6)";g.stroke();
    g.beginPath();g.moveTo(x0+L*0.08,y0+T*0.12);g.bezierCurveTo(x0+L*0.3,y0+T*0.36,x0+L*0.65,y0+T*0.42,x0+L*0.92,y0+T*0.05);g.lineWidth=1.6*M.s;g.strokeStyle="rgba(255,226,160,"+(0.35+f*0.5).toFixed(2)+")";g.stroke();
  }
  // Purple "lean" syrup running down a landmark
  function lean(g,f,t,m,s){
    var len=(20+44*f.k)*s*(0.7+0.3*Math.sin(t*0.7+f.k*9))*(1+m*2.2),w=f.w*1.35*(1+m*0.5),x=f.x,y=f.y+(M.base-f.y)*(0.01+m*0.05)*0.5;
    var wob=Math.sin(t*1.3+f.k*7)*1.2*s;
    g.beginPath();g.moveTo(x-w*0.55,y);
    g.bezierCurveTo(x-w*0.7+wob,y+len*0.35,x-w*0.35-wob,y+len*0.7,x-w*0.55,y+len);
    g.arc(x,y+len,w*0.75,Math.PI,0,true);
    g.bezierCurveTo(x+w*0.35-wob,y+len*0.7,x+w*0.7+wob,y+len*0.35,x+w*0.55,y);g.closePath();
    var lg=g.createLinearGradient(x-w,0,x+w,0);lg.addColorStop(0,"#3f0d73");lg.addColorStop(0.45,"#9b3dff");lg.addColorStop(0.7,"#c77dff");lg.addColorStop(1,"#4d1288");
    g.fillStyle=lg;g.fill();g.lineWidth=0.9*s;g.strokeStyle="#1d0436";g.stroke();
    g.beginPath();g.moveTo(x-w*0.15,y+2*s);g.quadraticCurveTo(x-w*0.25,y+len*0.5,x-w*0.1,y+len*0.85);g.lineWidth=Math.max(0.8,w*0.18);g.strokeStyle="rgba(255,255,255,.75)";g.stroke();
    // falling drop
    var cyc=(t*0.6+f.k*3)%1,dy=y+len+w*0.8+cyc*cyc*60*s*(1+m);
    if(cyc>0.15){g.beginPath();g.ellipse(x,dy,w*0.42,w*0.6,0,0,7);g.fillStyle="#9b3dff";g.fill();g.beginPath();g.arc(x-w*0.12,dy-w*0.15,w*0.13,0,7);g.fillStyle="rgba(255,255,255,.8)";g.fill();}
  }
  function renderTag(t,size,x0,y0){
    var g=tgx,W=M.W,H=M.H,lines=[["DROP 001",0.42,0,"black"],["SAFA",1,0.62,null],["MELTED HEART TEES",0.34,1.3,"#ffd6e8"]];
    g.setTransform(M.dpr,0,0,M.dpr,0,0);g.clearRect(0,0,W,H);g.textAlign="left";g.textBaseline="middle";
    lines.forEach(function(l){var fs=size*l[1];g.font=fs+"px "+M.font;var y=y0+l[2]*size;
      if(l[3]==="black"){var bg=g.createLinearGradient(0,y-fs*0.5,0,y+fs*0.5);bg.addColorStop(0,"#3a3a3a");bg.addColorStop(0.5,"#111");bg.addColorStop(1,"#000");g.fillStyle=bg}
      else if(l[3]){g.fillStyle=l[3]}else{var gr=g.createLinearGradient(0,y-fs*0.5,0,y+fs*0.5);gr.addColorStop(0,"#ffe0ee");gr.addColorStop(0.3,"#ff63a8");gr.addColorStop(0.7,"#f72575");gr.addColorStop(1,"#b3002a");g.fillStyle=gr}
      g.fillText(l[0],x0,y);
      g.save();g.globalCompositeOperation="source-atop";var rf=g.createLinearGradient(0,y-fs*0.48,0,y-fs*0.05);rf.addColorStop(0,"rgba(255,255,255,"+(l[3]==="black"?".55":".75")+")");rf.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=rf;g.fillRect(x0-10,y-fs*0.5,W,fs*0.45);g.restore();});
    g.save();g.globalCompositeOperation="source-atop";var sx=x0+((t*0.25)%1.6-0.3)*size*4;g.translate(sx,y0+size*0.6);g.rotate(0.5);var sh=g.createLinearGradient(-size*0.22,0,size*0.22,0);sh.addColorStop(0,"rgba(255,255,255,0)");sh.addColorStop(0.5,"rgba(255,255,255,.85)");sh.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=sh;g.fillRect(-size*0.22,-H,size*0.44,H*2);g.restore();
    return lines;
  }
  function drawTag(g,t){
    var W=M.W,H=M.H,s=M.s,size=clamp(Math.min(W*0.085,H*0.13),24,80),x0=Math.max(W*0.035,18),y0=H*0.1+size*0.2,k=1+M.env*0.025;
    var lines=renderTag(t,size,x0,y0),cx=x0+size*1.4,cy=y0+size*0.6;
    g.save();g.translate(cx,cy);g.rotate(-0.06);g.scale(k,k);g.translate(-cx,-cy);
    var glow=g.createRadialGradient(cx,cy,0,cx,cy,size*2.2);glow.addColorStop(0,"rgba(247,37,117,.28)");glow.addColorStop(1,"rgba(247,37,117,0)");g.fillStyle=glow;g.fillRect(cx-size*3,cy-size*2.4,size*6,size*4.8);
    g.textAlign="left";g.textBaseline="middle";g.lineJoin="round";
    lines.forEach(function(l){var fs=size*l[1],y=y0+l[2]*size;g.font=fs+"px "+M.font;
      g.fillStyle="#2a0f2e";for(var e=Math.round(5*l[1])+2;e>0;e--)g.fillText(l[0],x0+e*0.7*s,y+e*0.7*s);
      g.lineWidth=fs*0.17;g.strokeStyle=INK;g.strokeText(l[0],x0,y);
      g.lineWidth=fs*0.08;g.strokeStyle=l[3]==="black"?"#ffffff":"#fff4fa";g.strokeText(l[0],x0,y);
      if(l[3]===null){var tw=g.measureText(l[0]).width,r=rng(9);for(var d=0;d<6;d++){var dx=x0+tw*0.08+r()*tw*0.84,dl=(5+r()*12)*s*(1+M.melt*1.5)*(0.8+0.2*Math.sin(t*1.2+d)),dw=(2.6+r()*3)*s,dy0=y+fs*0.3;
        g.beginPath();g.moveTo(dx-dw/2,dy0);g.lineTo(dx-dw/2,dy0+dl);g.arc(dx,dy0+dl,dw/2,Math.PI,0,true);g.lineTo(dx+dw/2,dy0);g.closePath();g.fillStyle="#d4134f";g.fill();g.lineWidth=1.2*s;g.strokeStyle=INK;g.stroke()}}
    });
    g.restore();
    g.save();g.setTransform(1,0,0,1,0,0);g.translate(cx*M.dpr,cy*M.dpr);g.rotate(-0.06);g.scale(k,k);g.translate(-cx*M.dpr,-cy*M.dpr);g.drawImage(TG,0,0);g.restore();
    g.setTransform(M.dpr,0,0,M.dpr,0,0);
  }
  // Agbar: no melt, its LED skin glowing with colours that slowly flow up the facade
  function meltAgbar(g,t,S){
    var P=M.agP;g.drawImage(M.ag,0,0,M.W,M.H);if(!M.agPath)return;
    g.save();g.clip(M.agPath);g.globalCompositeOperation="soft-light";g.globalAlpha=0.55;
    var off=(t*0.08)%1,lg=g.createLinearGradient(0,P.top-P.h*(1-off),0,P.top+P.h*(1+off));
    ["#ff3d7f","#ffb03d","#fff04d","#4dff9a","#3db8ff","#9b4dff","#ff3d7f","#ffb03d","#fff04d","#4dff9a","#3db8ff"].forEach(function(c,k,arr){lg.addColorStop(k/(arr.length-1),c)});
    g.fillStyle=lg;g.fillRect(P.cx-P.w,P.top-4,P.w*2,P.h+8);
    g.globalCompositeOperation="screen";g.globalAlpha=0.18+0.12*(M.env||0);g.fillStyle="#ffffff";g.fillRect(P.cx-P.w,P.top-4,P.w*2,P.h+8);
    g.restore();
  }

  // W Barcelona ("Hotel Vela") as seen from the city: straight edge on the right, the sail curving up the left to the top-right corner
  function buildVela(){
    var L=layer(),c=L[0],g=L[1],s=M.sL,W=M.W,H=M.H,b=M.hz+H*0.085+2,cx=W*(W<700?0.745:0.73),h=H*(W<700?0.3:0.38),w=h*0.5,x1=cx+w*0.45,top=b-h,r=rng(57),d=w*0.07;
    function cb(p0,p1,p2,p3,t){var u=1-t;return [u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]}
    var A=[x1-w,b],B=[x1-w*1.07,b-h*0.62],C=[x1-w*0.72,top-h*0.02],D=[x1-w*0.03,top];
    var left=[],i2;for(i2=0;i2<=160;i2++)left.push(cb(A,B,C,D,i2/160));
    function xL(y){for(var k=1;k<left.length;k++){if((left[k][1]-y)*(left[k-1][1]-y)<=0){var a=left[k-1],bb=left[k],f=(y-a[1])/((bb[1]-a[1])||1);return a[0]+(bb[0]-a[0])*f}}return x1}
    var P=new Path2D();P.moveTo(A[0],A[1]);left.forEach(function(pt){P.lineTo(pt[0],pt[1])});P.lineTo(x1,top+h*0.012);P.lineTo(x1,b);P.closePath();
    // narrow right side wall for depth
    var SP=new Path2D();SP.moveTo(x1,top+h*0.012);SP.lineTo(x1+d,top+h*0.03);SP.lineTo(x1+d,b-d*0.1);SP.lineTo(x1,b);SP.closePath();
    var sg=g.createLinearGradient(x1,0,x1+d,0);sg.addColorStop(0,"#1d2a4a");sg.addColorStop(1,"#0f1730");g.fillStyle=sg;g.fill(SP);g.lineWidth=1*s;g.strokeStyle="#0c0f20";g.stroke(SP);
    g.save();g.clip(P);
    // glass: sky-blue reflection at the top, sunset tint, deeper sea-blue lower down
    var gl=g.createLinearGradient(0,top,0,b);gl.addColorStop(0,"#8b9ccc");gl.addColorStop(0.25,"#9a8fbf");gl.addColorStop(0.5,"#7a7fb0");gl.addColorStop(0.75,"#41609e");gl.addColorStop(1,"#253f78");g.fillStyle=gl;g.fillRect(x1-w*1.2,top,w*1.3,h);
    var rowH=Math.max(2.1,2.6*s),nc=16,cu=function(k){return 1-Math.cos(k/nc*Math.PI/2)};
    var warm=["#d99a76","#f0c08c","#c98a6e","#e7b48c","#b9786a"];
    for(var y=top;y<b;y+=rowH){var xl=xL(y+rowH/2);if(x1-xl<1)continue;var f=(y-top)/h;
      for(var k=0;k<nc;k++){var a0=xl+(x1-xl)*cu(k),a1=xl+(x1-xl)*cu(k+1),u=(k+0.5)/nc,v=r();
        // the reflected city: a mosaic of warm buildings across the middle of the glass
        var city=(f>0.28&&f<0.78&&u>0.35&&u<0.95)?(0.55-Math.abs(f-0.52)*1.6)*(u>0.5?1:0.6):0;
        if(v<city){g.fillStyle=warm[Math.floor(r()*warm.length)];g.globalAlpha=0.55+r()*0.35;g.fillRect(a0,y,a1-a0,rowH);g.globalAlpha=1;}
        else if(v>0.93){g.fillStyle="rgba(255,255,255,.18)";g.fillRect(a0,y,a1-a0,rowH)}
        else if(v<0.3){g.fillStyle="rgba(10,20,50,.12)";g.fillRect(a0,y,a1-a0,rowH)}}
      g.strokeStyle="rgba(15,20,45,.55)";g.lineWidth=0.5*s;g.beginPath();g.moveTo(xl,y);g.lineTo(x1,y);g.stroke();}
    g.strokeStyle="rgba(15,20,45,.45)";g.lineWidth=0.42*s;for(var k2=1;k2<nc;k2++){g.beginPath();for(var yy=top+1;yy<=b;yy+=2){var xx=xL(yy)+(x1-xL(yy))*cu(k2);if(yy===top+1)g.moveTo(xx,yy);else g.lineTo(xx,yy)}g.stroke()}
    // the surface turns away on the left: darker, glossier there; bright where it faces us
    for(var yy2=top;yy2<b;yy2+=3){var l2=xL(yy2);if(x1-l2<2)continue;var gr2=g.createLinearGradient(l2,0,x1,0);
      gr2.addColorStop(0,"rgba(10,15,40,.5)");gr2.addColorStop(0.18,"rgba(180,200,255,.18)");gr2.addColorStop(0.4,"rgba(0,0,0,0)");gr2.addColorStop(0.85,"rgba(255,210,180,.1)");gr2.addColorStop(1,"rgba(10,15,40,.25)");g.fillStyle=gr2;g.fillRect(l2,yy2,x1-l2,3)}
    g.restore();
    g.lineWidth=1.1*s;g.strokeStyle="#0c0f20";g.stroke(P);
    g.beginPath();left.slice(30,150).forEach(function(pt,ix){if(!ix)g.moveTo(pt[0]+0.8,pt[1]);else g.lineTo(pt[0]+0.8,pt[1])});g.lineWidth=1.1*s;g.strokeStyle="rgba(220,230,255,.55)";g.stroke();
    // the thin horizontal fins along the curved edge
    [0.18,0.28,0.38,0.62,0.7].forEach(function(fy){var y=top+h*fy,xl=xL(y);g.beginPath();g.moveTo(xl-w*0.07,y);g.lineTo(xl+w*0.12,y);g.lineWidth=1.6*s;g.strokeStyle="#0c0f20";g.stroke();g.lineWidth=0.8*s;g.strokeStyle="rgba(220,225,240,.8)";g.stroke()});
    [0.04,0.09].forEach(function(fy){var y=top+h*fy;g.beginPath();g.moveTo(x1-w*0.02,y);g.lineTo(x1+d+w*0.05,y+1);g.lineWidth=1.4*s;g.strokeStyle="#0c0f20";g.stroke();g.lineWidth=0.7*s;g.strokeStyle="rgba(220,225,240,.8)";g.stroke()});
    // low hotel block at its foot, to the right
    var pw=w*1.25,px2=x1-w*0.42,ph2=h*0.13;g.beginPath();g.moveTo(px2,b-ph2);g.lineTo(px2+d,b-ph2-d*0.5);g.lineTo(px2+pw+d,b-ph2-d*0.5);g.lineTo(px2+pw,b-ph2);g.closePath();g.fillStyle="#3a4a70";g.fill();g.lineWidth=0.8*s;g.strokeStyle="#0c0f20";g.stroke();
    g.beginPath();g.rect(px2,b-ph2,pw,ph2);var bg2=g.createLinearGradient(0,b-ph2,0,b);bg2.addColorStop(0,"#5f7fb4");bg2.addColorStop(1,"#2c4478");g.fillStyle=bg2;g.fill();g.stroke();
    g.strokeStyle="rgba(15,20,45,.5)";g.lineWidth=0.4*s;for(var lx=px2;lx<px2+pw;lx+=4*s){g.beginPath();g.moveTo(lx,b-ph2);g.lineTo(lx,b);g.stroke()}for(var ly=b-ph2;ly<b;ly+=3*s){g.beginPath();g.moveTo(px2,ly);g.lineTo(px2+pw,ly);g.stroke()}
    M.wv=c;M.wvPath=P;M.wvP={x:x1-w*0.5,b:b,h:h,w:w,top:top,sx:x1-w*0.17,sy:top+h*0.065,sz:w*0.17};
  }
  function drawVela(g,t){
    if(!M.wv)return;var p=M.wvP;g.drawImage(M.wv,0,0,M.W,M.H);
    // a band of light sliding across the glass
    // the glowing lilac W sign near the top (a plain letter, not the hotel brand's logo)
    var fam=(getComputedStyle(document.documentElement).getPropertyValue("--f-display")||"").trim()||"Arial Black",pulse=0.75+0.25*(M.env||0);
    g.save();g.font="900 "+p.sz+"px "+fam;g.textAlign="center";g.textBaseline="middle";
    g.shadowColor="rgba(190,120,255,"+(0.95*pulse).toFixed(2)+")";g.shadowBlur=p.sz*0.9;g.lineWidth=p.sz*0.1;g.strokeStyle="rgba(200,140,255,.9)";g.strokeText("W",p.sx,p.sy);
    g.shadowBlur=p.sz*0.45;g.fillStyle="#f3e2ff";g.fillText("W",p.sx,p.sy);g.shadowBlur=0;g.fillStyle="rgba(255,255,255,.85)";g.globalAlpha=0.6;g.fillText("W",p.sx,p.sy-p.sz*0.03);g.restore();
    g.save();g.clip(M.wvPath);var u=((t*0.12)%1.6)-0.3,bx=p.x-p.w+u*p.w*2.4,sh=g.createLinearGradient(bx-p.w*0.25,p.top,bx+p.w*0.25,p.b);
    sh.addColorStop(0,"rgba(255,255,255,0)");sh.addColorStop(0.5,"rgba(255,245,230,.4)");sh.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=sh;g.fillRect(p.x-p.w,p.top,p.w*2,p.h);g.restore();
  }
  var LIZARD_SRC="/mural/lizard-trencadis.webp";
  // A real lizard (photo) wearing a Gaudí trencadís decal, peeking over the parapet at the city
  function buildLizard(){
    if(!M.lizImg){M.lizImg=new Image();M.lizImg.onload=function(){M.lizReady=true;buildLizard();if(reduce)drawMural(0,0)};M.lizImg.src=LIZARD_SRC;}
    if(!M.lizReady||!M.W)return;
    var W=M.W,H=M.H,s=M.sL,hgt=Math.min(H*0.52,W*0.62*9/16)*0.7,wid=hgt*16/9,x=-wid*0.42,y=H-hgt*0.6;
    M.lizP={x:x,y:y,w:wid,h:hgt};
    var G=layer(),g=G[1];g.shadowColor="rgba(120,220,255,.85)";g.shadowBlur=18*s;g.drawImage(M.lizImg,x,y,wid,hgt);g.shadowColor="rgba(255,210,120,.6)";g.shadowBlur=7*s;g.drawImage(M.lizImg,x,y,wid,hgt);M.lizGlow=G[0];
    // 3D: a shaded sprite (light from the sunset on the right), a warm rim light and a soft cast shadow
    var dp=M.dpr,cw=Math.ceil(wid*dp),chh=Math.ceil(hgt*dp);
    function cv(){var c2=document.createElement("canvas");c2.width=cw;c2.height=chh;return c2}
    var sil=cv(),sg=sil.getContext("2d");sg.drawImage(M.lizImg,0,0,cw,chh);sg.globalCompositeOperation="source-in";sg.fillStyle="#000";sg.fillRect(0,0,cw,chh);
    var rim=cv(),rg=rim.getContext("2d");rg.drawImage(M.lizImg,0,0,cw,chh);rg.globalCompositeOperation="source-in";rg.fillStyle="#ffc488";rg.fillRect(0,0,cw,chh);
    var sh=cv(),shg=sh.getContext("2d");shg.drawImage(M.lizImg,0,0,cw,chh);shg.globalCompositeOperation="source-atop";
    var lg=shg.createLinearGradient(cw,0,0,chh);lg.addColorStop(0,"rgba(255,225,190,.3)");lg.addColorStop(0.4,"rgba(0,0,0,0)");lg.addColorStop(1,"rgba(10,10,40,.62)");shg.fillStyle=lg;shg.fillRect(0,0,cw,chh);
    // belly shadow that follows the lower contour (silhouette minus itself shifted up), blurred, multiplied in
    var band=cv(),bdg=band.getContext("2d");bdg.drawImage(sil,0,0);bdg.globalCompositeOperation="destination-out";bdg.drawImage(sil,0,-Math.round(chh*0.085));
    var bb=document.createElement("canvas");bb.width=cw;bb.height=chh;var bbg=bb.getContext("2d");bbg.shadowColor="rgba(12,6,30,.95)";bbg.shadowBlur=9*dp*s;bbg.shadowOffsetX=20000;bbg.drawImage(band,-20000,-Math.round(chh*0.012));
    shg.save();shg.globalCompositeOperation="source-atop";shg.globalAlpha=0.9;shg.drawImage(bb,0,0);shg.restore();
    var vg2=shg.createLinearGradient(0,0,0,chh);vg2.addColorStop(0,"rgba(0,0,0,0)");vg2.addColorStop(0.6,"rgba(0,0,0,0)");vg2.addColorStop(1,"rgba(10,8,30,.45)");shg.fillStyle=vg2;shg.fillRect(0,0,cw,chh);
    // cast shadow: blurred silhouette via the off-canvas shadow trick (works in every browser)
    var cs=document.createElement("canvas");cs.width=cw+Math.ceil(80*dp);cs.height=chh+Math.ceil(80*dp);var csg=cs.getContext("2d"),pad=40*dp;
    csg.shadowColor="rgba(0,0,0,.95)";csg.shadowBlur=10*dp*s;csg.shadowOffsetX=20000;csg.drawImage(sil,pad-20000,pad,cw,chh);
    M.liz3={sil:sil,rim:rim,shaded:sh,cast:cs,pad:pad/dp};
  }
  // A fly passes in front of the view like a shadow; the lizard snaps it up
  function bez(a,b,c,d,u){var v=1-u;return [v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0],v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1]]}
  function flyState(t){
    var p=M.lizP;if(!p)return null;
    var C=10,k=Math.floor(t/C),ph=t-k*C,r=rng(1000+k);
    var mx=p.x+p.w*0.858,my=p.y+p.h*0.2,ang=-0.38+(r()-0.5)*0.25,R=p.h*0.75,Tx=mx+Math.cos(ang)*R,Ty=my+Math.sin(ang)*R;
    var P0=[M.W*1.08,M.H*(0.12+r()*0.3)],P1=[M.W*(0.55+r()*0.3),M.H*(0.08+r()*0.3)],P2=[M.W*(0.15+r()*0.3),M.H*(0.15+r()*0.35)];
    var st={mx:mx,my:my,ang:ang,len:0,fx:0,fy:0,vis:true,scale:1,caught:false},TF=5.8,SH=0.18,BK=0.32;
    st.jaw=ph<TF-0.14?0:ph<TF?(ph-TF+0.14)/0.14:ph<TF+SH+BK?1:Math.max(0,1-(ph-TF-SH-BK)/0.22);
    if(ph<TF){var u=ph/TF,e=u<0.5?2*u*u:1-Math.pow(-2*u+2,2)/2,pt=bez(P0,P1,P2,[Tx,Ty],e),sw=(1-u)*M.H*0.06;
      st.fx=pt[0]+Math.sin(ph*3.1)*sw+Math.sin(ph*23)*2.2;st.fy=pt[1]+Math.cos(ph*2.7)*sw+Math.cos(ph*19)*2.2;
      st.scale=1+2.2*Math.max(0,Math.sin(u*Math.PI*1.15))*(1-u)*(1-u);}
    else if(ph<TF+SH){var v=(ph-TF)/SH;st.len=R*Math.sqrt(v);st.fx=Tx+Math.sin(ph*23)*1.5;st.fy=Ty+Math.cos(ph*19)*1.5;st.bow=0.22*(1-v);st.curl=0;st.whip=0.12;}
    else if(ph<TF+SH+BK){var w=(ph-TF-SH)/BK;st.len=R*(1-Math.pow(w,1.5));st.caught=true;st.curl=Math.min(1,w/0.22);st.bow=-0.25*w;st.whip=0.7*(1-w);}
    else st.vis=false;
    return st;
  }
  function drawTongue(g,p,t,st){
    var len=st.len,wb=p.h*0.034,N=14,c=[],L=[],R=[],k;
    g.save();g.translate(st.mx,st.my);g.rotate(st.ang);
    // centreline built from a bending angle: a slight bow on the way out, the tip curling round the fly, a whip on the way back
    var seg=len/N,th0=0,x=0,y=0,curl=st.curl||0,bow=st.bow||0,whip=st.whip||0;c.push([0,0,wb]);
    for(k=1;k<=N;k++){var u=k/N,sm=Math.max(0,Math.min(1,(u-0.55)/0.45));sm=sm*sm*(3-2*sm);
      th0=-bow*(u-0.5)*1.6+curl*sm*2.5+whip*Math.sin(u*Math.PI*2-t*26)*0.4*u;
      x+=Math.cos(th0)*seg;y+=Math.sin(th0)*seg;c.push([x,y,wb*(1-0.5*u)])}
    for(k=0;k<=N;k++){var a=c[Math.max(0,k-1)],b=c[Math.min(N,k+1)],dx=b[0]-a[0],dy=b[1]-a[1],dd=Math.hypot(dx,dy)||1,nx=-dy/dd,ny=dx/dd;L.push([c[k][0]+nx*c[k][2]/2,c[k][1]+ny*c[k][2]/2]);R.push([c[k][0]-nx*c[k][2]/2,c[k][1]-ny*c[k][2]/2])}
    var end=c[N],an=Math.atan2(end[1]-c[N-1][1],end[0]-c[N-1][0]),fl=p.h*0.07,fw=wb*0.52;
    var tg=g.createLinearGradient(0,-wb,0,wb);tg.addColorStop(0,"#ff8db0");tg.addColorStop(0.45,"#e8336f");tg.addColorStop(1,"#9e0f3d");
    g.beginPath();g.moveTo(L[0][0],L[0][1]);for(k=1;k<=N;k++)g.lineTo(L[k][0],L[k][1]);
    [0.42,-0.42].forEach(function(da,f){var a2=an+da,ex=end[0]+Math.cos(a2)*fl,ey=end[1]+Math.sin(a2)*fl,nx2=-Math.sin(a2)*fw/2,ny2=Math.cos(a2)*fw/2;
      g.lineTo(ex+nx2,ey+ny2);g.arc(ex,ey,fw/2,a2+Math.PI/2,a2-Math.PI/2,true);if(f===0)g.lineTo(end[0]-Math.cos(an)*fw*0.4,end[1]-Math.sin(an)*fw*0.4)});
    for(k=N;k>=0;k--)g.lineTo(R[k][0],R[k][1]);g.closePath();
    g.shadowColor="rgba(255,90,150,.7)";g.shadowBlur=p.h*0.04;g.fillStyle=tg;g.fill();g.shadowBlur=0;g.lineJoin="round";g.lineWidth=Math.max(0.7,p.h*0.0045);g.strokeStyle="#0a0608";g.stroke();
    g.beginPath();for(k=1;k<N-2;k++){var q=c[k];if(k===1)g.moveTo(q[0],q[1]-q[2]*0.22);else g.lineTo(q[0],q[1]-q[2]*0.22)}g.lineWidth=Math.max(0.8,wb*0.18);g.strokeStyle="rgba(255,255,255,.75)";g.lineCap="round";g.stroke();
    if(st.caught){var tip=c[N],ca=Math.cos(st.ang),sa=Math.sin(st.ang);st.fx=st.mx+tip[0]*ca-tip[1]*sa;st.fy=st.my+tip[0]*sa+tip[1]*ca;}
    g.restore();
  }
  function drawFly(g,t,st){
    if(!st||!st.vis)return;
    var sz=Math.max(7,M.H*0.026)*st.scale,pv=M.flyPrev||[st.fx,st.fy],dir=Math.atan2(st.fy-pv[1],st.fx-pv[0]);M.flyPrev=[st.fx,st.fy];
    if(st.caught)dir=st.ang+Math.PI;
    var flap=Math.abs(Math.sin(t*90));
    g.save();g.translate(st.fx,st.fy);g.rotate(dir);
    g.shadowColor="rgba(0,0,0,.55)";g.shadowBlur=sz*(0.35+0.25*st.scale);
    g.fillStyle="rgba(10,8,14,"+(0.55+0.25/st.scale).toFixed(2)+")";
    [-1,1].forEach(function(sd){g.save();g.rotate(sd*(0.35+flap*0.5));g.beginPath();g.ellipse(-sz*0.15,sd*sz*0.32,sz*0.62,sz*0.2*(0.5+flap*0.5),sd*0.25,0,7);g.globalAlpha=0.45;g.fill();g.restore()});
    g.beginPath();g.ellipse(0,0,sz*0.55,sz*0.3,0,0,7);g.fill();g.beginPath();g.arc(sz*0.55,0,sz*0.24,0,7);g.fill();
    g.strokeStyle="rgba(10,8,14,.6)";g.lineWidth=Math.max(0.6,sz*0.06);for(var l=-1;l<=1;l++){g.beginPath();g.moveTo(l*sz*0.2,0);g.lineTo(l*sz*0.25-sz*0.1,sz*0.45);g.moveTo(l*sz*0.2,0);g.lineTo(l*sz*0.25-sz*0.1,-sz*0.45);g.stroke()}
    g.restore();
  }
  function drawLizard(g,t){
    if(!M.lizReady||!M.lizP)return;
    var p=M.lizP;
    var L3=M.liz3,br=1+Math.sin(t*2.2)*0.006;
    // drop shadow behind the lizard so it pops out of the mural
    if(L3){g.save();g.globalAlpha=0.95;g.drawImage(L3.cast,p.x-L3.pad+p.w*0.06,p.y-L3.pad+p.h*0.08,p.w+L3.pad*2,p.h+L3.pad*2);g.restore();}
    g.save();g.translate(0,p.y+p.h);g.scale(1,br);g.translate(0,-(p.y+p.h));
    if(L3){g.globalAlpha=1;g.drawImage(L3.rim,p.x+p.h*0.022,p.y-p.h*0.022,p.w,p.h);
      var o=Math.max(1.6,p.h*0.012);[[1,0],[-1,0],[0,1],[0,-1],[0.7,0.7],[-0.7,0.7],[0.7,-0.7],[-0.7,-0.7]].forEach(function(dd){g.drawImage(L3.sil,p.x+dd[0]*o,p.y+dd[1]*o,p.w,p.h)});
      var jaw=(M.fly&&M.fly.jaw)||0;
      if(jaw<=0.001)g.drawImage(L3.shaded,p.x,p.y,p.w,p.h);
      else{var JP=[[0.876,0.165],[0.854,0.199],[0.833,0.231],[0.815,0.264],[0.802,0.352],[0.818,0.329],[0.844,0.278],[0.870,0.199],[0.883,0.18],[0.9,0.16]],
          hx=p.x+p.w*0.815,hy=p.y+p.h*0.264,ang=jaw*0.45;
        function jp(){var q=new Path2D();JP.forEach(function(v,k){var X=p.x+v[0]*p.w,Y=p.y+v[1]*p.h;if(k)q.lineTo(X,Y);else q.moveTo(X,Y)});q.closePath();return q}
        // upper head + body (everything except the lower jaw)
        g.save();var up=new Path2D();up.rect(p.x-50,p.y-50,p.w+100,p.h+100);up.addPath(jp());g.clip(up,"evenodd");g.drawImage(L3.shaded,p.x,p.y,p.w,p.h);g.restore();
        // inside of the mouth
        var tipU=[p.x+0.876*p.w,p.y+0.165*p.h],ca=Math.cos(ang),sa=Math.sin(ang),rx=tipU[0]-hx,ry=tipU[1]-hy,tipL=[hx+rx*ca-ry*sa,hy+rx*sa+ry*ca];
        g.beginPath();g.moveTo(hx,hy);g.lineTo(tipU[0],tipU[1]);g.lineTo(tipL[0]+p.w*0.004,tipL[1]);g.closePath();
        var mg=g.createLinearGradient(hx,hy,tipU[0],tipU[1]);mg.addColorStop(0,"#3a0614");mg.addColorStop(1,"#c2375e");g.fillStyle=mg;g.fill();var LW=Math.max(1.4,p.h*0.011);g.lineJoin="round";g.lineWidth=LW;g.strokeStyle="#0a0608";g.stroke();
        // lower jaw, rotated open around the mouth corner
        g.save();g.translate(hx,hy);g.rotate(ang);g.translate(-hx,-hy);var JJ=jp();g.save();g.clip(JJ);g.drawImage(L3.shaded,p.x,p.y,p.w,p.h);g.restore();g.lineJoin="round";g.lineWidth=LW;g.strokeStyle="#0a0608";g.stroke(JJ);g.restore();
        g.beginPath();g.moveTo(hx,hy);g.lineTo(tipU[0],tipU[1]);g.lineWidth=LW;g.strokeStyle="#0a0608";g.lineCap="round";g.stroke();
      }}else g.drawImage(M.lizImg,p.x,p.y,p.w,p.h);
    g.restore();
    // tongue: shoots out to catch the fly
    var st=M.fly=reduce?null:flyState(t);
    if(st&&st.len>0.5)drawTongue(g,p,t,st);
  }
  // One Sagrada Família tower bends over and melts like wax
  function meltTower(g,t,S){
    var p=M.mtP,d=M.dpr,s=M.sL,top=p.tip-30*s,cut=p.cut,x0=p.x0-p.bw-30*s,wid=p.bw*2+60*s,rh=1.5,dir=-1;
    g.drawImage(M.mt,0,cut*d,M.mt.width,M.mt.height-cut*d,0,cut,M.W,M.H-cut);
    for(var y=cut;y>top;y-=rh){var f=(cut-y)/(cut-top),dx=0,dy=0;
      g.drawImage(M.mt,x0*d,(y-rh)*d,wid*d,rh*d+1,x0+dx,y-rh+dy,wid,rh+0.6)}
    // wax runs down the shaft from the bend
    var drips=[];
    drips.forEach(function(q){var fx=p.x0+q[0]*p.bw*0.8,fw=p.bw*0.38,y0=cut-6*s,len=q[1]*S*120*s*(0.8+0.2*Math.sin(t*0.5+q[2]));
      g.beginPath();g.moveTo(fx-fw/2,y0);g.bezierCurveTo(fx-fw*0.6,y0+len*0.5,fx-fw*0.3,y0+len*0.85,fx-fw*0.35,y0+len);g.arc(fx,y0+len,fw*0.36,Math.PI,0,true);g.bezierCurveTo(fx+fw*0.3,y0+len*0.85,fx+fw*0.6,y0+len*0.5,fx+fw/2,y0);g.closePath();
      var lg=g.createLinearGradient(fx-fw/2,0,fx+fw/2,0);lg.addColorStop(0,"#7a5034");lg.addColorStop(0.5,"#d8a86f");lg.addColorStop(1,"#ffd59a");g.fillStyle=lg;g.fill();g.lineWidth=1*s;g.strokeStyle=LINE;g.stroke();
      g.beginPath();g.moveTo(fx-fw*0.1,y0+4*s);g.lineTo(fx-fw*0.15,y0+len*0.8);g.lineWidth=Math.max(0.8,fw*0.14);g.strokeStyle="rgba(255,240,210,.7)";g.stroke()});
    // drops falling from the drooping tip
    var tipX=p.x0,tipY=p.tip+p.h*0.18,cyc=(t*0.5)%1;
    if(false){g.beginPath();g.ellipse(tipX,tipY+cyc*cyc*90*s,3*s,4.2*s,0,0,7);g.fillStyle="#e2b47a";g.fill();g.lineWidth=0.8*s;g.strokeStyle=LINE;g.stroke()}
  }
  function drawMural(t,dt){
    var W=M.W,H=M.H,s=M.s,g=mx,hz=M.hz,m=M.melt,i,x,S=clamp(0.55+(m-0.15)/0.85*0.45,0,1);
    if(!W)return;
    g.setTransform(M.dpr,0,0,M.dpr,0,0);g.lineJoin="round";g.lineCap="round";
    // realistic dusk gradient
    var sky=g.createLinearGradient(0,0,0,hz);
    sky.addColorStop(0,"#16163a");sky.addColorStop(0.22,"#2f2756");sky.addColorStop(0.45,"#6e3a6c");sky.addColorStop(0.66,"#c4586a");sky.addColorStop(0.82,"#f0865a");sky.addColorStop(0.94,"#ffbb68");sky.addColorStop(1,"#ffe0a0");
    g.fillStyle=sky;g.fillRect(0,0,W,hz+2);
    var sunX=W*0.5,sunR=Math.max(H*0.05,14);
    var halo=g.createRadialGradient(sunX,hz,0,sunX,hz,H*0.7);halo.addColorStop(0,"rgba(255,240,190,.95)");halo.addColorStop(0.08,"rgba(255,214,140,.7)");halo.addColorStop(0.3,"rgba(255,160,110,.25)");halo.addColorStop(1,"rgba(255,140,90,0)");g.fillStyle=halo;g.fillRect(0,0,W,hz);
    M.skyX=(M.skyX+dt*4*s*(1+m))%M.skyW;g.drawImage(M.sky,-M.skyX,0,M.skyW,hz);g.drawImage(M.sky,M.skyW-M.skyX,0,M.skyW,hz);
    g.save();g.beginPath();g.rect(0,0,W,hz);g.clip();g.beginPath();g.arc(sunX,hz+sunR*0.35,sunR,0,7);var sd=g.createRadialGradient(sunX,hz,0,sunX,hz,sunR);sd.addColorStop(0,"#fffbe8");sd.addColorStop(0.7,"#ffe6a6");sd.addColorStop(1,"#ffc76a");g.fillStyle=sd;g.fill();g.restore();
    M.birds.forEach(function(b){b.x+=b.sp*dt;if(b.x>W+20)b.x=-20;var fl=Math.sin(t*6+b.ph)*2.4*s;g.beginPath();g.moveTo(b.x-6*s,b.y-fl);g.quadraticCurveTo(b.x-3*s,b.y-2.5*s,b.x,b.y);g.quadraticCurveTo(b.x+3*s,b.y-2.5*s,b.x+6*s,b.y-fl);g.lineWidth=1.3*s;g.strokeStyle="rgba(30,15,40,.75)";g.stroke()});
    // sea with sun glitter
    var beach=hz+H*0.085,sea=g.createLinearGradient(0,hz,0,beach);sea.addColorStop(0,"#5a6fa8");sea.addColorStop(0.5,"#3a5a96");sea.addColorStop(1,"#2d4d82");g.fillStyle=sea;g.fillRect(0,hz,W,beach-hz+2);
    for(i=0;i<22;i++){var ry=hz+2*s+i*((beach-hz)/22),rw=(sunR*2.2-i*sunR*0.07)*(0.6+0.4*Math.sin(t*2.2+i*1.3)),rx2=sunX+Math.sin(t*1.1+i*2.1)*6*s;if(rw<=0)continue;g.beginPath();g.moveTo(rx2-rw/2,ry);g.lineTo(rx2+rw/2,ry);g.lineWidth=1.1*s;g.strokeStyle="rgba(255,"+(215-i*3)+",140,"+(0.85-i*0.03).toFixed(2)+")";g.stroke()}
    g.strokeStyle="rgba(255,255,255,.18)";g.lineWidth=0.9*s;for(i=0;i<W/30;i++){var wx=((i*61+t*10*s)%(W+40))-20,wy=hz+5*s+((i*7)%10)*(beach-hz-8*s)/10;g.beginPath();g.moveTo(wx,wy);g.lineTo(wx+8*s,wy);g.stroke()}
    // the beach: wet sand, foam and a few umbrellas
    var sand=g.createLinearGradient(0,beach,0,beach+H*0.06);sand.addColorStop(0,"#d9a274");sand.addColorStop(1,"#c98a5f");g.fillStyle=sand;g.fillRect(0,beach,W,H*0.08);
    g.beginPath();for(x=0;x<=W;x+=6){var fy=beach+Math.sin(x*0.03+t*1.4)*1.6*s+Math.sin(x*0.011-t*0.8)*1.2*s;if(x===0)g.moveTo(x,fy);else g.lineTo(x,fy)}g.lineWidth=2.4*s;g.strokeStyle="rgba(255,248,235,.85)";g.stroke();
    g.beginPath();for(x=0;x<=W;x+=6){var fy2=beach+4*s+Math.sin(x*0.025-t*1.1+2)*1.4*s;if(x===0)g.moveTo(x,fy2);else g.lineTo(x,fy2)}g.lineWidth=1*s;g.strokeStyle="rgba(255,248,235,.45)";g.stroke();
    var uc=["#e04a5a","#f5c542","#3b6fe0","#f4f1e6","#58b36a"];for(i=0;i<Math.floor(W/90);i++){var ux=(i*97+30)%W,uy=beach+H*0.03+((i*13)%5)*s;g.beginPath();g.moveTo(ux,uy);g.lineTo(ux,uy-7*s);g.lineWidth=0.8*s;g.strokeStyle="#3a2a20";g.stroke();g.beginPath();g.arc(ux,uy-7*s,5*s,Math.PI,0);g.closePath();g.fillStyle=uc[i%uc.length];g.fill()}
    drawVela(g,t);
    g.drawImage(M.back,0,0,W,H);
    // landmarks
    g.save();g.globalCompositeOperation="screen";g.globalAlpha=clamp(0.3+M.env*0.25+m*0.3,0,1);g.drawImage(M.glow,0,0,W,H);g.restore();
    g.drawImage(M.marks,0,0,W,H);
    meltAgbar(g,t,S);
    drawTelDrop(g,t);
    g.drawImage(M.front,0,0,W,H);
    drawLizard(g,t);
    drawTag(g,t);
    drawFly(g,t,M.fly);
    M.sparks.forEach(function(p){var a=0.5+0.5*Math.sin(t*2.4+p.ph);if(a<0.3)return;var px=p.x*W,py=p.y*H,z=p.sz*s*(0.6+a*0.7);
      g.beginPath();g.moveTo(px,py-z);g.quadraticCurveTo(px,py,px+z,py);g.quadraticCurveTo(px,py,px,py+z);g.quadraticCurveTo(px,py,px-z,py);g.quadraticCurveTo(px,py,px,py-z);g.closePath();g.fillStyle="rgba(255,255,255,"+a.toFixed(2)+")";g.fill()});
    var vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*0.4,W/2,H/2,Math.max(W,H)*0.78);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(10,5,20,.38)");g.fillStyle=vg;g.fillRect(0,0,W,H);
    var half=MC.width/2;
    mctx.forEach(function(c,i){c.setTransform(1,0,0,1,0,0);c.drawImage(MC,i*half,0,half,MC.height,0,0,mCanvases[i].width,mCanvases[i].height)});
  }
  layoutMural(); if("ResizeObserver" in window) new ResizeObserver(function(){layoutMural(); if(reduce) drawMural(0,0)}).observe(doorEls[0]);
  if(document.fonts&&document.fonts.load){ document.fonts.load("40px "+M.font).then(function(){ if(reduce) drawMural(0,0); }).catch(function(){}); }
  if(reduce) drawMural(0,0);
  var openBtn=document.getElementById("openDoors"), closeBtn=document.getElementById("closeDoors");
  // Opening: the mural melts and speeds up first, then the doors swing open
  function openDoors(){ if(!cabinet.classList.contains("shut")||M.openT>=0)return; M.openT=0; Pulse.kick(8); later(function(){ cabinet.classList.remove("shut"); st.forEach(function(c,i){c.av+=(i%2?1:-1)*(20+i*3)}); },reduce?0:700); }
  function closeDoors(){ cabinet.classList.add("shut"); M.openT=-1; }
  on(openBtn,"click",openDoors); doorEls.forEach(function(d){on(d,"click",openDoors)}); on(closeBtn,"click",closeDoors);
  // If nobody opens them, the doors open by themselves a few seconds after the wardrobe is in view
  var autoOpened=false;
  if("IntersectionObserver" in window){
    var dio=new IntersectionObserver(function(es){es.forEach(function(en){ if(en.isIntersecting&&!autoOpened){ autoOpened=true; later(openDoors,11000); } })},{threshold:0.6});
    dio.observe(cabinet);
  }
  function muralFrame(t,dt){
    var shut=cabinet.classList.contains("shut");
    if(!shut && (M.openT<0 || M.openT>3)) return;
    if(M.openT>=0){ M.openT+=dt; M.melt=Math.min(1,0.15+M.openT/0.7); }
    else M.melt+=(0.15-M.melt)*(1-Math.exp(-dt*2));
    drawMural(t,dt);
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
    if(!reduce && closetVisible){ M.env=env; muralFrame(now/1000,dt); }
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
    mCanvases.forEach(function (c) { c.remove(); });
    cabinet.classList.add("shut");
  };
}
