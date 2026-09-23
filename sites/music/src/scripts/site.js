import { COVER_PAL, COVERS } from "../data/covers.js";
/* The catalog comes from content/releases.json via the page (see index.astro). */
const RELEASES = JSON.parse(document.getElementById("releases-data").textContent);
(()=>{
const $=s=>document.querySelector(s);
const SPOTIFY="https://open.spotify.com/artist/4jsDAwTiXLfwp77EBqqHup";

const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
let g=.35;

/* ---------- color schemes ("skins"): CSS tokens + the colors the canvases draw with ---------- */
const SKINS={
  forest:{name:"FOREST CREAM",scheme:"light",css:{ink:"#ebe2c6",panel:"#e1d5b2",line:"#b8aa82",dim:"#5b644c",text:"#1e3323",cyan:"#4f7f4a",mag:"#b8562c",
      t1:"#2f6238",t2:"#9a4420",btnfg:"#f6f0dc",scan:"rgba(60,50,20,.08)",bandc:"rgba(79,127,74,.08)",
      winbg:"#d8cba4",winhi:"#f6efd9",winlo:"#5c5238",titlefg:"#f6f0dc",title:"linear-gradient(90deg,#2f6238,#6f8f4e 65%,#b8aa82)",
      saverbg:"radial-gradient(ellipse at center,#33442c 0%,#0e140c 75%)",statusfg:"#1e3323"},
    blend:"multiply",split:["#6f9f5a","#c8643a"],
    cover:{bg:[225,213,178],c:[79,127,74],m:[184,86,44],w:[30,51,35],g:[184,170,130]},
    brick:[70,88,60],brickVar:18,mortar:[196,184,140],exit:{edge:[184,86,44],arrow:[246,240,220],bg:[62,44,28]},
    cas:{M:[184,86,44],b:[62,54,38],W:[246,240,220],C:[111,159,90],k:[30,51,35],G:[120,106,74]},
    ceil:[[150,168,132],[214,210,180]],floor:[[122,112,80],[52,46,30]],floorLine:[92,84,58],fog:[206,206,178],noise:[111,159,90]}
};
let SK=SKINS.forest;

/* real cover art: each release's Spotify cover, downsampled to 32x32 and dithered into a 9-colour Forest Cream palette (row-major palette indices) */
function realCover(i){const s=COVERS[RELEASES[i].id];if(!s)return cover32(RELEASES[i].t);const S=32,d=new Uint8ClampedArray(S*S*4);for(let k=0;k<S*S;k++){const c=COVER_PAL[+s[k]];d[k*4]=c[0];d[k*4+1]=c[1];d[k*4+2]=c[2];d[k*4+3]=255}return new ImageData(d,S,S)}
function cover32(t){const a=cover(t),d=new Uint8ClampedArray(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const j=((y>>1)*16+(x>>1))*4,i=(y*32+x)*4;for(let k=0;k<4;k++)d[i+k]=a.data[j+k]}return new ImageData(d,32,32)}
/* placeholder pixel "sunset" for a release that has no pixel cover yet (16x16, seeded by title) */
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function cover(title){
  const r=rng(hash(title)),S=16,d=new Uint8ClampedArray(S*S*4);
  const P=SK.cover;
  const sun=r()<.5?P.c:P.m, sea=sun===P.c?P.m:P.c;
  const hz=8+Math.floor(r()*4), rad=2+Math.floor(r()*3), cx=4+Math.floor(r()*8), cy=hz-1-Math.floor(r()*3);
  const set=(x,y,c)=>{x=((x%S)+S)%S;const i=(y*S+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
  for(let y=0;y<S;y++)for(let x=0;x<S;x++)set(x,y,P.bg);
  const n=3+Math.floor(r()*4);for(let i=0;i<n;i++)set(Math.floor(r()*S),Math.floor(r()*(hz-3)),r()<.5?P.w:P.g);
  for(let y=0;y<hz;y++)for(let x=0;x<S;x++){
    if((x-cx)**2+(y-cy)**2<=rad*rad+1 && !(y>cy&&(y-cy)%2===1))set(x,y,sun)}
  for(let x=0;x<S;x++)set(x,hz,P.g);
  for(let y=hz+1;y<S;y++){const k=y-hz;
    for(let x=0;x<S;x++){
      if(Math.abs(x-cx)<=Math.max(0,rad-(k>>1)) && k%2===0)set(x,y,sun);
      else if(r()<.42-k*.03)set(x,y,k%2?sea:P.g)}}
  const gy=Math.floor(r()*S),sh=1+Math.floor(r()*3),row=d.slice(gy*S*4,(gy+1)*S*4);
  for(let x=0;x<S;x++){const i=(gy*S+((x+sh)%S))*4,j=x*4;d[i]=row[j];d[i+1]=row[j+1];d[i+2]=row[j+2];d[i+3]=255}
  return new ImageData(d,S,S);
}
$("#latest-cover").getContext("2d").putImageData(realCover(0),0,0);


/* small seeded PRNG (used for the maze brick texture) */
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* ---------- datamosh between two 16x16 images ---------- */
let moshTimer=null;
function mosh(ctx,A,B){
  clearTimeout(moshTimer);
  if(reduce||!A){ctx.putImageData(B,0,0);return}
  const S=B.width,N=9,dir=[...Array(4)].map(()=>(Math.random()*6-3)|0);let f=0;
  const tick=()=>{
    const out=ctx.createImageData(S,S),t=f/N;
    for(let y=0;y<S;y++){const off=dir[(y*4/S)|0]*(1-t)*2|0;
      for(let x=0;x<S;x++){
        const useB=Math.random()<t*1.15-.08, src=useB?B:A;
        const sx=((useB?x-off:x+off+f)%S+S)%S, i=(y*S+x)*4, j=(y*S+sx)*4;
        for(let k=0;k<4;k++)out.data[i+k]=src.data[j+k]}}
    ctx.putImageData(out,0,0);
    if(++f<=N)moshTimer=setTimeout(tick,55);else ctx.putImageData(B,0,0);
  };tick();
}

/* ---------- sfx (off by default) ---------- */
let sfx=false,ac=null;
function blip(f=660,d=.05){if(!sfx)return;try{ac=ac||new AudioContext();const o=ac.createOscillator(),v=ac.createGain();
  o.type="square";o.frequency.value=f;v.gain.setValueAtTime(.04,ac.currentTime);v.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);
  o.connect(v).connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}}
$("#sfx").addEventListener("click",e=>{sfx=!sfx;e.currentTarget.setAttribute("aria-pressed",sfx);e.currentTarget.textContent=sfx?"SFX ON":"SFX OFF";blip(880)});

/* ---------- track select ---------- */
const grid=$("#grid"),pctx=$("#portrait").getContext("2d");let covers=RELEASES.map((r,i)=>realCover(i));
let cur=-1,readyT=null;
grid.querySelectorAll(".tile").forEach((b,i)=>{
  b.querySelector("canvas").getContext("2d").putImageData(covers[i],0,0);
  b.addEventListener("mouseenter",()=>select(i));
  b.addEventListener("focus",()=>select(i));
  b.addEventListener("click",()=>{select(i);pick()});
});
function select(i){
  if(i===cur)return;
  const prev=cur;cur=i;
  grid.querySelectorAll(".tile").forEach((t,k)=>{t.setAttribute("aria-selected",k===i);t.tabIndex=k===i?0:-1});
  $("#d-title").textContent=RELEASES[i].t;$("#d-year").textContent=RELEASES[i].y;
  const R=RELEASES[i];$("#d-type").textContent=R.k;$("#d-listen").href=R.sp;$("#ready").textContent="";
  const also=[["APPLE MUSIC",R.am],["AMAZON",R.az],["DEEZER",R.dz]].filter(x=>x[1]);
  $("#d-also").innerHTML="ALSO ON "+also.map(([n,h])=>`<a href="${h}" target="_blank" rel="noopener">${n}</a>`).join("");
  mosh(pctx,prev<0?null:covers[prev],covers[i]);
  blip(520+i*30,.04);
}
function pick(){
  clearTimeout(readyT);$("#ready").textContent="READY! ▸ PRESS START";blip(990,.12);
  readyT=setTimeout(()=>$("#ready").textContent="",2200);
}
grid.addEventListener("keydown",e=>{
  const map={ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3};
  if(e.key in map){e.preventDefault();const n=cur+map[e.key];if(n>=0&&n<RELEASES.length)$("#tile-"+n).focus()}
});
select(0);

/* ---------- pixel wordmark with RGB split + tracking slices ---------- */
const mark=$("#mark"),mctx=mark.getContext("2d");
let mask=null,tints=null,buf=null;
function tint(src,col){const c=document.createElement("canvas");c.width=src.width;c.height=src.height;const x=c.getContext("2d");
  x.drawImage(src,0,0);x.globalCompositeOperation="source-in";x.fillStyle=col;x.fillRect(0,0,c.width,c.height);return c}
/* header font: Sixtyfour (locked 2026-09-22); rasterized small so the pixels stay chunky */
const HFONT={n:"Sixtyfour",s:14,w:400};
function buildMask(f){
  const lines=["MILKSHAKE","O'NEIL"],m=document.createElement("canvas"),x=m.getContext("2d");
  const font=`${f.w} ${f.s}px "${f.n}", monospace`;x.font=font;
  const ms=lines.map(l=>x.measureText(l));
  const asc=Math.ceil(Math.max(...ms.map(k=>k.actualBoundingBoxAscent||f.s*.8)));
  const desc=Math.ceil(Math.max(...ms.map(k=>k.actualBoundingBoxDescent||f.s*.2)));
  const left=Math.ceil(Math.max(0,...ms.map(k=>k.actualBoundingBoxLeft||0)));
  const w=Math.ceil(Math.max(...ms.map(k=>(k.actualBoundingBoxRight||k.width)+left)));
  const lh=asc+desc+Math.max(2,Math.round(f.s*.15));
  m.width=w+2;m.height=lh*lines.length;x.font=font;x.textBaseline="alphabetic";x.fillStyle="#fff";
  lines.forEach((l,i)=>x.fillText(l,left,i*lh+asc));
  const id=x.getImageData(0,0,m.width,m.height);for(let i=3;i<id.data.length;i+=4)id.data[i]=id.data[i]>110?255:0;
  x.putImageData(id,0,0);return m;
}
function drawMark(){
  const W=mark.width,H=mark.height,b=buf.getContext("2d");
  b.clearRect(0,0,W,H);b.globalCompositeOperation=SK.blend;
  const dx=reduce?1:Math.round(1+g*2+(Math.random()<g*.25?Math.random()*3:0));
  b.drawImage(tints.c,8-dx,2);b.drawImage(tints.m,8+dx,2);b.drawImage(tints.w,8,2);
  b.globalCompositeOperation="source-over";
  mctx.clearRect(0,0,W,H);
  for(let y=0;y<H;y+=2){
    const s=(!reduce&&Math.random()<g*.12)?Math.round((Math.random()*2-1)*g*10):0;
    mctx.drawImage(buf,0,y,W,2,s,y,W,2)}
}
let looping=false,fontReq=0;
function makeTints(){if(mask)tints={c:tint(mask,SK.split[0]),m:tint(mask,SK.split[1]),w:tint(mask,SK.css.text)}}
async function setFont(){
  const f=HFONT,req=++fontReq;
  try{await Promise.race([document.fonts.load(`${f.w} ${f.s}px "${f.n}"`),new Promise(r=>setTimeout(r,2000))])}catch(e){}
  if(req!==fontReq)return;
  mask=buildMask(f);
  makeTints();
  mark.width=mask.width+16;mark.height=mask.height+4;
  buf=document.createElement("canvas");buf.width=mark.width;buf.height=mark.height;
  drawMark();
  if(!reduce&&!looping){looping=true;let last=0;const loop=t=>{if(t-last>83){drawMark();last=t}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
}
setFont();

/* ---------- tracking slider ---------- */
const tr=$("#tracking");
try{const v=localStorage.getItem("tracking");if(v!==null)tr.value=v}catch(e){}
function setG(){g=tr.value/100;document.documentElement.style.setProperty("--glitch",g);try{localStorage.setItem("tracking",tr.value)}catch(e){}}
tr.addEventListener("input",setG);setG();

/* ---------- datamosh section heads on enter ---------- */
if(!reduce&&"IntersectionObserver" in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove("mosh");void e.target.offsetWidth;e.target.classList.add("mosh")}}),{threshold:.2});
  document.querySelectorAll(".watch").forEach(s=>io.observe(s));
}

/* ---------- counter + idle screensaver ---------- */
const t0=Date.now();let lastAct=Date.now(),grace=0,raf=0;
const saver=$("#saver"),sc=$("#saver-c"),sx=sc.getContext("2d");
function openSaver(){
  if(!saver.hidden||!mask)return;
  saver.hidden=false;grace=Date.now()+500;
  openMaze();
}
/* ---------- maze screensaver: low-res raycaster, right-hand wall follower ---------- */
function genMaze(n){
  const G=n*2+1,map=new Uint8Array(G*G).fill(1),seen=new Uint8Array(n*n),st=[[0,0]];
  seen[0]=1;map[G+1]=0;
  while(st.length){
    const [cx,cy]=st[st.length-1];
    const nb=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[cx+a,cy+b]).filter(([x,y])=>x>=0&&y>=0&&x<n&&y<n&&!seen[y*n+x]);
    if(!nb.length){st.pop();continue}
    const [nx,ny]=nb[Math.random()*nb.length|0];seen[ny*n+nx]=1;
    map[(cy*2+1+ny*2+1)/2*G+(cx*2+1+nx*2+1)/2]=0;map[(ny*2+1)*G+nx*2+1]=0;st.push([nx,ny]);
  }
  /* hang the nine release covers on walls that face a corridor */
  const cand=[];
  for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++)
    if(map[y*G+x]&&(!map[y*G+x-1]||!map[y*G+x+1]||!map[(y-1)*G+x]||!map[(y+1)*G+x]))cand.push(y*G+x);
  const posters=new Map();
  for(let i=0;i<covers.length&&cand.length;i++)posters.set(cand.splice(Math.random()*cand.length|0,1)[0],i);
  return{G,map,posters};
}
let BRICK,EXIT,CAS;
function buildTextures(){
BRICK=(()=>{const d=new Uint8ClampedArray(16*16*4),r=rng(7);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const mortar=y%4===3||((x+((y>>2)%2)*4)%8===7),i=(y*16+x)*4,v=r()*14|0;
    const vv=v*SK.brickVar/14,c=mortar?SK.mortar:[SK.brick[0]+vv,SK.brick[1]+vv,SK.brick[2]+vv];
    d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}
  return d})();
EXIT=(()=>{const d=new Uint8ClampedArray(16*16*4);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=(y*16+x)*4,edge=x<1||x>14||y<1||y>14,
    arrow=(y>=6&&y<=9&&x>=3&&x<=9)||(x>=9&&x<=12&&Math.abs(y-7.5)<=12.5-x);
    const c=edge?SK.exit.edge:arrow?SK.exit.arrow:SK.exit.bg;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}
  return d})();
/* pixel cassette sprite, 16x10, two frames so the reels turn */
const CAS_ROWS=[
".MMMMMMMMMMMMMM.",
"MbbbbbbbbbbbbbbM",
"MbWWWWWWWWWWWWbM",
"MbWCCCCCCCCCCWbM",
"MbWWk1kWWk1kWWbM",
"MbW2r2WWW2r2WWbM",
"MbWWk1kWWk1kWWbM",
"MbbbbbbbbbbbbbbM",
"MbbbGGGGGGGGbbbM",
".MMMGGkGGkGGMMM."];
function casFrame(f){
  const P={...SK.cas,r:SK.cas.C};
  P["1"]=f?P.k:P.r;P["2"]=f?P.r:P.k;
  const d=new Uint8ClampedArray(16*10*4);
  CAS_ROWS.forEach((row,y)=>[...row].forEach((ch,x)=>{const i=(y*16+x)*4;if(ch==="."){d[i+3]=0;return}
    const c=P[ch];d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}));
  return d;
}
CAS=[casFrame(0),casFrame(1)];
}

/* ---------- screensaver sky: drifting pixel clouds (512x64, wraps around, sampled by view angle) ---------- */
const SKYW=512,SKYH=64,CLOUD_DRIFT=.12;
const SKY=(()=>{const d=new Uint8ClampedArray(SKYW*SKYH*4),r=rng(6*977);
  const put=(x,y,c)=>{x=((x%SKYW)+SKYW)%SKYW;if(y<0||y>=SKYH)return;const i=(y*SKYW+x)*4;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255};
  const top=[132,160,118],hz=[216,212,182];
  for(let y=0;y<SKYH;y++){const t=y/(SKYH-1),c=[top[0]+(hz[0]-top[0])*t,top[1]+(hz[1]-top[1])*t,top[2]+(hz[2]-top[2])*t];for(let x=0;x<SKYW;x++)put(x,y,c)}
  for(let n=0;n<16;n++){const cx=r()*SKYW,cy=8+r()*30,parts=3+(r()*4|0),cells=[];
    for(let p=0;p<parts;p++)cells.push([cx+(r()-.5)*34,cy+(r()-.5)*6,8+r()*14,3+r()*4]);
    const inC=(x,y)=>cells.some(([a,b,w,h])=>((x-a)/w)**2+((y-b)/h)**2<=1);
    for(let y=0;y<SKYH;y++)for(let x=cx-60;x<cx+60;x++)if(inC(x,y))put(x|0,y,inC(x,y+2)?[240,234,212]:[204,200,172]);}
  return d})();
const CLOUD_FOG=[214,210,180];
function openMaze(){
  /* canvas matches the window's shape (85% of the screen), 192 px wide */
  const vw=sc.parentElement.clientWidth||800,vh=sc.parentElement.clientHeight||600;
  const W=192,H=Math.max(80,Math.min(220,Math.round(W*vh/vw)));
  sc.width=W;sc.height=H;
  const img=sx.createImageData(W,H),D=img.data,DX=[1,0,-1,0],DY=[0,1,0,-1];
  let M,px,py,dirI,ang,act,exits=0,noise=0,tapes=0,tick=0,cas=[];const zbuf=new Float32Array(W);
  const openTiles=()=>{const o=[];for(let y=1;y<M.G-1;y++)for(let x=1;x<M.G-1;x++)if(!M.map[y*M.G+x]&&(x+y>4))o.push([x+.5,y+.5]);return o};
  const placeCas=i=>{const o=openTiles().filter(([x,y])=>Math.hypot(x-px,y-py)>3&&!cas.some((c,k)=>k!==i&&c.x===x&&c.y===y));
    const [x,y]=o[Math.random()*o.length|0];cas[i]={x,y,ph:Math.random()*6.28}};
  const reset=()=>{M=genMaze(7);px=1.5;py=1.5;dirI=M.map[M.G+2]?1:0;ang=dirI*Math.PI/2;act=null;cas=[];for(let i=0;i<3;i++)placeCas(i)};
  reset();
  $("#hits").textContent="TAPES 0";$("#exits").textContent="EXITS 0";
  const open=(x,y)=>!M.map[y*M.G+x];
  const ease=t=>t<.5?2*t*t:1-(-2*t+2)**2/2;
  function decide(){
    const cx=px|0,cy=py|0;
    if(cx===M.G-2&&cy===M.G-2){exits++;$("#exits").textContent="EXITS "+exits;noise=14;blip(1200,.15);return}
    const r=(dirI+1)%4,l=(dirI+3)%4;
    if(open(cx+DX[r],cy+DY[r]))act={k:"turn",a0:ang,a1:ang+Math.PI/2,nd:r,t:0,then:true};
    else if(open(cx+DX[dirI],cy+DY[dirI]))act={k:"move",x0:px,y0:py,x1:px+DX[dirI],y1:py+DY[dirI],t:0};
    else act={k:"turn",a0:ang,a1:ang-Math.PI/2,nd:l,t:0};
  }
  function update(){
    if(noise>0){if(--noise===0)reset();return}
    cas.forEach((c,i)=>{if(Math.hypot(c.x-px,c.y-py)<.35){tapes++;$("#hits").textContent="TAPES "+tapes;blip(880,.08);placeCas(i)}});
    if(!act)decide();if(!act)return;
    if(act.k==="turn"){act.t+=1/16;ang=act.a0+(act.a1-act.a0)*ease(Math.min(1,act.t));
      if(act.t>=1){dirI=act.nd;ang=act.a1;act=act.then?{k:"move",x0:px,y0:py,x1:px+DX[dirI],y1:py+DY[dirI],t:0}:null}}
    else{act.t+=1/20;const e=ease(Math.min(1,act.t));px=act.x0+(act.x1-act.x0)*e;py=act.y0+(act.y1-act.y0)*e;if(act.t>=1)act=null}
  }
  function render(){
    if(noise>0){for(let i=0;i<D.length;i+=4){const v=Math.random()*255|0,k=Math.random();
      const n=SK.noise;D[i]=k<.12?n[0]:v;D[i+1]=k<.12?n[1]:v;D[i+2]=k<.12?n[2]:v;D[i+3]=255}sx.putImageData(img,0,0);return}
    const dx=Math.cos(ang),dy=Math.sin(ang),plx=-dy*.66,ply=dx*.66,G=M.G,K=W*.76,half=H/2,skyOff=tick*CLOUD_DRIFT;
    for(let x=0;x<W;x++){
      const cam=2*x/W-1,rx=dx+plx*cam,ry=dy+ply*cam;
      let mx=px|0,my=py|0,side=0;const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);
      let sxd,syd,stx,sty;
      if(rx<0){stx=-1;sxd=(px-mx)*ddx}else{stx=1;sxd=(mx+1-px)*ddx}
      if(ry<0){sty=-1;syd=(py-my)*ddy}else{sty=1;syd=(my+1-py)*ddy}
      for(let n=0;n<64;n++){if(sxd<syd){sxd+=ddx;mx+=stx;side=0}else{syd+=ddy;my+=sty;side=1}if(M.map[my*G+mx])break}
      const perp=Math.max(.05,side===0?sxd-ddx:syd-ddy),full=K/perp,lh=full*.62,top=half+full/2-lh;zbuf[x]=perp; /* walls ~2/3 height so the sky shows over them */
      let wx=side===0?py+perp*ry:px+perp*rx;wx-=Math.floor(wx);
      const key=my*G+mx,pi=M.posters.get(key),TS=pi!==undefined?32:16;
      let tx=wx*TS|0;if(side===0&&rx>0)tx=TS-1-tx;if(side===1&&ry<0)tx=TS-1-tx;
      const tex=pi!==undefined?covers[pi].data:(key===(G-1)*G+G-2||key===(G-2)*G+G-1)?EXIT:BRICK;
      const s1=side?.72:1,fo=Math.max(.18,Math.min(1,2.4/perp)),fg=CLOUD_FOG,F0=SK.floor[0],F1=SK.floor[1],FL=SK.floorLine;
      const sux=(((((ang+Math.atan(cam*.66))/(2*Math.PI))*SKYW*2+skyOff)|0)%SKYW+SKYW)%SKYW;
      for(let y=0;y<H;y++){
        const i=(y*W+x)*4;
        if(y<top){const sv=Math.min(SKYH-1,(y/half*SKYH)|0),j=(sv*SKYW+sux)*4;D[i]=SKY[j];D[i+1]=SKY[j+1];D[i+2]=SKY[j+2]}
        else if(y>=top+lh){const f=Math.min(1,(y-half)/half);
          if(((y-half)|0)%Math.max(2,(12*(1-f))|0)===0){D[i]=FL[0];D[i+1]=FL[1];D[i+2]=FL[2]}
          else{D[i]=F0[0]+(F1[0]-F0[0])*f;D[i+1]=F0[1]+(F1[1]-F0[1])*f;D[i+2]=F0[2]+(F1[2]-F0[2])*f}}
        else{const ty=Math.min(TS-1,((y-top)/lh*TS)|0),j=(ty*TS+tx)*4;
          D[i]=tex[j]*s1*fo+fg[0]*(1-fo);D[i+1]=tex[j+1]*s1*fo+fg[1]*(1-fo);D[i+2]=tex[j+2]*s1*fo+fg[2]*(1-fo)}
        D[i+3]=255}
    }
    /* spinning cassettes: billboard sprites, depth-tested per column */
    tick++;
    const det=plx*dy-dx*ply,fr=CAS[(tick>>3)&1];
    cas.map(c=>{const ox=c.x-px,oy=c.y-py;return{c,tx:(dy*ox-dx*oy)/det,ty:(-ply*ox+plx*oy)/det}})
      .filter(o=>o.ty>.2).sort((a,b)=>b.ty-a.ty).forEach(({c,tx,ty})=>{
        const spin=Math.cos(tick*.06+c.ph),sh=K*.34/ty,sw=sh*1.6*Math.abs(spin),cxs=W/2*(1+tx/ty);
        const cy=half+K*.06/ty+Math.sin(tick*.05+c.ph)*K*.04/ty,top=cy-sh/2,left=cxs-sw/2;
        if(sw<.5)return;
        const fog=Math.max(.25,Math.min(1,2.4/ty));
        for(let x=Math.max(0,left|0);x<Math.min(W,left+sw);x++){
          if(ty>=zbuf[x])continue;
          let u=((x-left)/sw*16)|0;if(spin<0)u=15-u;u=Math.max(0,Math.min(15,u));
          for(let y=Math.max(0,top|0);y<Math.min(H,top+sh);y++){
            const v=Math.min(9,((y-top)/sh*10)|0),j=(v*16+u)*4;if(!fr[j+3])continue;
            const i=(y*W+x)*4,sd=spin<0?.7:1,fc=CLOUD_FOG;D[i]=fr[j]*fog*sd+fc[0]*(1-fog);D[i+1]=fr[j+1]*fog*sd+fc[1]*(1-fog);D[i+2]=fr[j+2]*fog*sd+fc[2]*(1-fog)}}
      });
    sx.putImageData(img,0,0);
  }
  const step=()=>{update();render();raf=requestAnimationFrame(step)};
  if(reduce)render();else step();
}
function wake(){
  lastAct=Date.now();
  if(saver.hidden||Date.now()<grace)return;
  cancelAnimationFrame(raf);saver.hidden=true;
  document.body.classList.remove("wake");void document.body.offsetWidth;document.body.classList.add("wake");
  setTimeout(()=>document.body.classList.remove("wake"),400);
}
["pointermove","pointerdown","keydown","scroll","touchstart","wheel"].forEach(ev=>addEventListener(ev,wake,{passive:true}));
$("#run-saver").addEventListener("click",e=>{e.stopPropagation();openSaver()});
setInterval(()=>{
  const s=Math.floor((Date.now()-t0)/1000);
  $("#counter").textContent=`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s/60)%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  if(Date.now()-lastAct>30000)openSaver();
},1000);
/* ---------- skin switching ---------- */
function applySkin(key){
  SK=SKINS[key]||SKINS.forest;const root=document.documentElement;
  Object.entries(SK.css).forEach(([k,v])=>root.style.setProperty("--"+k,v));
  root.style.colorScheme=SK.scheme;
  covers=RELEASES.map((r,i)=>realCover(i));
  grid.querySelectorAll(".tile canvas").forEach((c,i)=>c.getContext("2d").putImageData(covers[i],0,0));
  $("#latest-cover").getContext("2d").putImageData(covers[0],0,0);
  if(cur>=0)pctx.putImageData(covers[cur],0,0);
  makeTints();if(buf)drawMark();
  buildTextures();
}
/* Forest Cream (locked 2026-09-22). Neon RGB / Neon Pastel / Riso Print live in the design history, not here. */
applySkin("forest");
})();
