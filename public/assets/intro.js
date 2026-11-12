/* Bey Perde — giriş animasyonu (tek 3D salon sahnesi, scroll ile kamera hareketi).
   Hareket azaltma tercihinde, düşük güçlü cihazlarda, veri tasarrufunda ya da WebGL yoksa
   sahne yüklenmez; yerine statik fotoğraf gösterilir. three.js yalnızca gerektiğinde yüklenir. */
(() => {
'use strict';
const intro = document.querySelector('[data-intro]');
if (!intro) return;
const rtl = document.documentElement.dir === 'rtl';
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const nav = navigator, conn = nav.connection || {};
const coarse = matchMedia('(pointer: coarse)').matches;
const small = matchMedia('(max-width: 900px)').matches;
function webgl() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (_) { return false; } }
const lowEnd = (nav.deviceMemory && nav.deviceMemory <= 2) || (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || conn.saveData || /2g/.test(conn.effectiveType || '');
const skip = intro.querySelector('[data-skip]');

function goStatic() {
  intro.classList.add('static');
  intro.classList.remove('ready');
  document.dispatchEvent(new CustomEvent('bp:intro-static'));
}
if (mqReduce.matches || lowEnd || !webgl()) { goStatic(); return; }
intro.classList.toggle('mobile', small || coarse);

skip && skip.addEventListener('click', (ev) => {
  ev.preventDefault();
  const r = intro.getBoundingClientRect();
  window.scrollTo({ top: window.scrollY + r.bottom, behavior: 'auto' });
  const h = document.getElementById('h-marka');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
});

function load(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const start = () => load('/js/three-0.149.0.min.js').then(init).catch(goStatic);
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 600 }); else setTimeout(start, 60);

function init() {
const T = window.THREE;
if (T.ColorManagement) T.ColorManagement.legacyMode = false;
const mobile = small || coarse;
const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
const Q = mobile ? { shadow: 1024, segs: 220, fibres: 4500, leaves: 18 } : { shadow: 2048, segs: 420, fibres: 9000, leaves: 34 };
const canvas = document.getElementById('stage');
let renderer;
try { renderer = new T.WebGLRenderer({ canvas, antialias: dpr < 2, powerPreference: 'high-performance', alpha: false }); }
catch (_) { goStatic(); return; }
renderer.setPixelRatio(dpr);
renderer.outputEncoding = T.sRGBEncoding;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = mobile ? T.PCFShadowMap : T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
canvas.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); goStatic(); }, false);

const scene = new T.Scene();
scene.background = new T.Color(0x14110e);
const camera = new T.PerspectiveCamera(50, 1, 0.05, 80);

/* ---------- procedural textures ---------- */
const rnd = (a,b)=>a+Math.random()*(b-a);
function tex(w,h,draw,rx=1,ry=1,srgb=true){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);
  if(srgb)t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
// grasscloth: horizontal fibres
const grass = tex(512,1024,(g,w,h)=>{
  g.fillStyle='#b3aa9d';g.fillRect(0,0,w,h);
  for(let i=0;i<Q.fibres;i++){
    const y=Math.random()*h, x=Math.random()*w, l=rnd(20,220), v=Math.floor(rnd(140,225));
    g.strokeStyle=`rgba(${v},${v-6},${v-16},${rnd(.25,.6)})`;g.lineWidth=rnd(.6,2.2);
    g.beginPath();g.moveTo(x,y);g.lineTo(x+l,y+rnd(-1.5,1.5));g.stroke();
    if(x+l>w){g.beginPath();g.moveTo(x-w,y);g.lineTo(x+l-w,y);g.stroke();}
  }
  for(let i=0;i<1400;i++){const y=Math.random()*h,x=Math.random()*w;g.fillStyle=`rgba(70,62,52,${rnd(.15,.4)})`;g.fillRect(x,y,rnd(10,80),rnd(.6,1.4));}
},1.1,1.1);
// linen / bouclé noise
function weave(base,var1){return tex(256,256,(g,w,h)=>{
  g.fillStyle=base;g.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){const v=Math.random()<.5?255:0;g.fillStyle=`rgba(${v},${v},${v},${rnd(.02,var1)})`;
    if(Math.random()<.5)g.fillRect(Math.random()*w,Math.random()*h,rnd(2,7),1);else g.fillRect(Math.random()*w,Math.random()*h,1,rnd(2,7));}
});}
const linen = weave('#ddd3c4',.09); linen.repeat.set(3,3);
const boucle = weave('#ece5da',.12); boucle.repeat.set(4,2);
const stone = tex(256,256,(g,w,h)=>{g.fillStyle='#cbbfae';g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${Math.random()<.5?255:90},${Math.random()<.5?250:80},${Math.random()<.5?240:70},${rnd(.03,.12)})`;
    g.beginPath();g.ellipse(Math.random()*w,Math.random()*h,rnd(1,9),rnd(.5,3),0,0,7);g.fill();}},1,1);
const floorTex = tex(1024,1024,(g,w,h)=>{
  const pw=128;
  for(let x=0;x<w;x+=pw){let y=-Math.random()*400;
    while(y<h){const l=rnd(300,520);const v=rnd(-14,14);
      g.fillStyle=`rgb(${150+v},${112+v},${80+v})`;g.fillRect(x,y,pw,l);
      for(let k=0;k<26;k++){g.strokeStyle=`rgba(80,52,30,${rnd(.05,.18)})`;g.lineWidth=rnd(.5,1.6);const gx=x+rnd(4,pw-4);
        g.beginPath();g.moveTo(gx,y);g.bezierCurveTo(gx+rnd(-6,6),y+l*.3,gx+rnd(-6,6),y+l*.6,gx+rnd(-3,3),y+l);g.stroke();}
      g.fillStyle='rgba(50,32,20,.55)';g.fillRect(x,y,pw,2);y+=l;}
    g.fillStyle='rgba(50,32,20,.5)';g.fillRect(x,0,2,h);}
},4.2,4.2);
const outside = tex(1024,640,(g,w,h)=>{
  const s=g.createLinearGradient(0,0,0,h*.6);s.addColorStop(0,'#7fb0dc');s.addColorStop(1,'#e6eef0');g.fillStyle=s;g.fillRect(0,0,w,h);
  g.filter='blur(5px)';
  for(let i=0;i<260;i++){const x=Math.random()*w,y=h*rnd(.3,.62),r=rnd(10,34);
    g.fillStyle=`rgb(${Math.floor(rnd(70,120))},${Math.floor(rnd(110,150))},${Math.floor(rnd(55,80))})`;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  g.filter='none';g.fillStyle='#9bb56a';g.fillRect(0,h*.62,w,h*.38);
  g.fillStyle='#c9c2b3';g.fillRect(0,h*.78,w,h*.06);
},1,1);

/* ---------- materials ---------- */
const M = {
  wall: new T.MeshStandardMaterial({color:0xece5da,roughness:.92}),
  hall: new T.MeshStandardMaterial({color:0x8c786a,roughness:.9}),
  trim: new T.MeshStandardMaterial({color:0xf1ebe1,roughness:.6}),
  paper: new T.MeshStandardMaterial({map:grass,bumpMap:grass,bumpScale:.012,roughness:.85,color:0xffffff}),
  floor: new T.MeshStandardMaterial({map:floorTex,roughness:.55}),
  door: new T.MeshStandardMaterial({color:0x5a3e2a,roughness:.5}),
  doorPanel: new T.MeshStandardMaterial({color:0x4d3423,roughness:.45}),
  metal: new T.MeshStandardMaterial({color:0x2a2622,roughness:.35,metalness:.6}),
  brass: new T.MeshStandardMaterial({color:0xc19a5b,roughness:.3,metalness:.45}),
  black: new T.MeshStandardMaterial({color:0x1c1b1a,roughness:.4,metalness:.3}),
  fon: new T.MeshStandardMaterial({map:linen,color:0xf2ebe0,roughness:.95,side:T.DoubleSide}),
  tul: new T.MeshLambertMaterial({color:0xfffaf2,emissive:0xfff1dc,emissiveIntensity:.42,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}),
  boucle: new T.MeshStandardMaterial({map:boucle,bumpMap:boucle,bumpScale:.02,roughness:1}),
  pillowB: new T.MeshStandardMaterial({color:0x8a5634,roughness:.95,map:boucle}),
  stone: new T.MeshStandardMaterial({map:stone,roughness:.5}),
  rug: new T.MeshStandardMaterial({map:boucle,color:0xf2ede4,roughness:1}),
  leaf: new T.MeshStandardMaterial({color:0x56663a,roughness:.8,flatShading:true}),
  pot: new T.MeshStandardMaterial({color:0xbfb4a3,roughness:.9}),
  sky: new T.MeshBasicMaterial({map:outside})
};

function add(geo,mat,x,y,z,o={}){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);
  if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;
  m.castShadow=o.cast!==false;m.receiveShadow=true;(o.parent||scene).add(m);return m;}
const box=(w,h,d)=>new T.BoxGeometry(w,h,d);

/* ---------- room shell: x -6..5, z -5..5, h 3.2 ---------- */
const H=3.2;
add(new T.PlaneGeometry(11,10),M.floor,-0.5,0,0,{rx:-Math.PI/2,cast:false});
add(new T.PlaneGeometry(11,10),new T.MeshStandardMaterial({color:0xece5da,roughness:.95,emissive:0x5a5048,emissiveIntensity:.35}),-0.5,H,0,{rx:Math.PI/2,cast:false});
add(new T.PlaneGeometry(11,H),M.wall,-0.5,H/2,-5,{cast:false});           // back (wallpaper) wall
add(new T.PlaneGeometry(10,H),M.wall,-6,H/2,0,{ry:Math.PI/2,cast:false});  // left wall
// right wall with window opening z -3..2, y 0..2.75
add(box(.2,H,2),M.wall,5.1,H/2,-4); add(box(.2,H,3),M.wall,5.1,H/2,3.5); add(box(.2,.45,5),M.wall,5.1,2.975,-0.5);
// front wall with door opening x -0.55..0.55, y 0..2.3
const FW=[M.wall,M.wall,M.wall,M.wall,M.hall,M.wall];
add(box(5.45,H,.15),FW,-3.275,H/2,5.075); add(box(4.45,H,.15),FW,2.775,H/2,5.075); add(box(1.1,.9,.15),FW,0,2.75,5.075);
// hallway outside the door
add(new T.PlaneGeometry(6,6.2),new T.MeshStandardMaterial({color:0x6e5f53,roughness:.95}),0,H,8,{rx:Math.PI/2,cast:false});
add(new T.PlaneGeometry(6,6),M.floor,0,0,8,{rx:-Math.PI/2,cast:false});
add(new T.PlaneGeometry(6,H),new T.MeshStandardMaterial({color:0x4a4038,roughness:.9}),0,H/2,11,{ry:Math.PI,cast:false});
// door casing (both faces)
for(const z of [5.17,4.98]){
  add(box(.09,2.38,.04),M.trim,-0.6,1.19,z); add(box(.09,2.38,.04),M.trim,0.6,1.19,z); add(box(1.29,.09,.04),M.trim,0,2.345,z);
}
// skirting + crown
add(box(11,.12,.03),M.trim,-0.5,.06,-4.985); add(box(11,.08,.06),M.trim,-0.5,H-.04,-4.97);
add(box(.03,.12,10),M.trim,-5.985,.06,0); add(box(.06,.08,10),M.trim,-5.97,H-.04,0);

/* ---------- arched wallpaper panels ---------- */
function arch(p,w,h,y0){const r=w/2;p.moveTo(-r,y0);p.lineTo(r,y0);p.lineTo(r,y0+h-r);p.absarc(0,y0+h-r,r,0,Math.PI,false);p.lineTo(-r,y0);return p;}
const pw=.82, ph=2.42, py=.28, t=.09;
const paperGeo=new T.ShapeGeometry(arch(new T.Shape(),pw,ph,py),32);
const outer=arch(new T.Shape(),pw+2*t,ph+2*t,py-t); outer.holes.push(arch(new T.Path(),pw,ph,py));
const frameGeo=new T.ExtrudeGeometry(outer,{depth:.035,bevelEnabled:true,bevelThickness:.01,bevelSize:.008,bevelSegments:2,curveSegments:32});
for(let i=0;i<8;i++){const x=-5.35+i*1.25;
  const p=add(paperGeo,M.paper,x,0,-4.994,{cast:false});
  add(frameGeo,M.trim,x,0,-4.998);
}

/* ---------- window, view, curtains ---------- */
add(new T.PlaneGeometry(18,11),M.sky,8.5,2.2,-0.5,{ry:-Math.PI/2,cast:false});
for(const z of [-3,-0.5,2]) add(box(.06,2.75,.06),M.black,5.02,1.375,z);
for(const y of [.03,.95,2.72]) add(box(.06,.06,5),M.black,5.02,y,-0.5);

function pleat(w,h,folds,amp,segs){
  const g=new T.PlaneGeometry(w,h,segs,8),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);const k=1+.35*(.5-y/h);
    p.setZ(i,amp*k*Math.sin((x/w+.5)*folds*Math.PI*2)+amp*.25*Math.sin((x/w)*folds*Math.PI*.7));}
  g.computeVertexNormals();return g;
}
const curtainH=2.95, cy=curtainH/2+.03;
add(pleat(5.6,curtainH,24,.035,Q.segs),M.tul,4.9,cy,-0.5,{ry:-Math.PI/2,cast:false});
for(const z of [-3.45,2.45]) add(pleat(1.25,curtainH,7,.075,Math.round(Q.segs/2.4)),M.fon,4.74,cy,z,{ry:-Math.PI/2});
const rodGeo=new T.CylinderGeometry(.018,.018,7.3,16);
add(rodGeo,M.black,4.72,3.02,-0.5,{rx:Math.PI/2}); add(rodGeo,M.black,4.87,3.02,-0.5,{rx:Math.PI/2});
for(const z of [-4.15,3.15]){
  add(new T.SphereGeometry(.065,24,16),new T.MeshStandardMaterial({color:0xe9e2d3,roughness:.4}),4.72,3.02,z);
  add(new T.CylinderGeometry(.024,.024,.04,16),M.black,4.72,3.02,z+(z<0?.07:-.07),{rx:Math.PI/2});
  add(new T.CylinderGeometry(.022,.022,.03,16),M.black,4.87,3.02,z+(z<0?.06:-.06),{rx:Math.PI/2});
}
for(const z of [-3.9,-0.5,2.9]) add(box(.32,.03,.03),M.black,4.86,3.02,z);
// rings on fon
for(const z0 of [-3.45,2.45]) for(let i=0;i<8;i++) add(new T.TorusGeometry(.03,.006,8,20),M.black,4.72,3.02,z0-.6+i*.17,{ry:Math.PI/2,cast:false});

/* ---------- furniture ---------- */
const sofa=new T.Group();sofa.position.set(-1.4,0,-4.05);scene.add(sofa);
const cap=(r,l)=>new T.CapsuleGeometry(r,l,8,24);
let s=add(cap(.27,2.35),M.boucle,0,.3,.05,{rz:Math.PI/2,parent:sofa});s.scale.set(1.15,1,1.75);
s=add(cap(.22,2.55),M.boucle,0,.66,-.33,{rz:Math.PI/2,parent:sofa});s.scale.set(1,1.15,1);
for(const x of [-1.42,1.42]){s=add(new T.SphereGeometry(.3,24,16),M.boucle,x,.45,0,{parent:sofa});s.scale.set(.75,1.05,1.65);}
const pil=new T.SphereGeometry(.22,24,16);
[[-.85,M.boucle,.1],[-.15,M.pillowB,-.05],[.6,M.boucle,.08]].forEach(([x,m,r])=>{s=add(pil,m,x,.78,-.12,{rz:r,parent:sofa});s.scale.set(1.15,1,.38);});
// throw
s=add(box(.6,.04,1.0),new T.MeshStandardMaterial({color:0xe3cfae,map:linen,roughness:1}),-.3,.53,.1,{rz:.04,parent:sofa});
// coffee table + objects
add(new T.CylinderGeometry(.64,.6,.38,64),M.stone,-1.15,.19,-2.3);
add(box(.36,.05,.26),new T.MeshStandardMaterial({color:0xe8e1d4,roughness:.8}),-1.4,.405,-2.2,{ry:.3});
add(box(.32,.04,.24),new T.MeshStandardMaterial({color:0x9a8c78,roughness:.8}),-1.38,.45,-2.21,{ry:.18});
add(new T.CylinderGeometry(.09,.08,.2,24),new T.MeshStandardMaterial({color:0xdde6e2,transparent:true,opacity:.35,roughness:.05}),-0.95,.48,-2.4,{cast:false});
const bloom=new T.MeshStandardMaterial({color:0xf7f3ea,roughness:.9});
for(let i=0;i<9;i++)add(new T.IcosahedronGeometry(rnd(.07,.1),1),bloom,-0.95+rnd(-.13,.13),.66+rnd(-.04,.06),-2.4+rnd(-.13,.13));
add(new T.CylinderGeometry(.05,.05,.08,20),new T.MeshStandardMaterial({color:0xb87a2c,emissive:0x8a4a10,emissiveIntensity:.6,transparent:true,opacity:.85}),-0.7,.42,-2.0);
const candle=new T.PointLight(0xffa64d,.35,2.2);candle.position.set(-0.7,.55,-2.0);scene.add(candle);
// rug
add(new T.PlaneGeometry(5,3.4),M.rug,-1.2,.006,-2.7,{rx:-Math.PI/2,cast:false});
// arc floor lamp
const arc=new T.QuadraticBezierCurve3(new T.Vector3(-3.95,.03,-3.75),new T.Vector3(-3.95,3.1,-3.5),new T.Vector3(-2.75,2.1,-3.15));
add(new T.TubeGeometry(arc,48,.016,8),M.brass,0,0,0);
add(new T.CylinderGeometry(.17,.19,.03,32),M.brass,-3.95,.015,-3.75);
const shade=add(new T.SphereGeometry(.2,32,16,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:0xc19a5b,roughness:.3,metalness:.45,side:T.DoubleSide}),-2.75,2.0,-3.15);
add(new T.SphereGeometry(.05,16,8),new T.MeshBasicMaterial({color:0xfff0cf}),-2.75,1.93,-3.15,{cast:false});
const lampL=new T.PointLight(0xffc98a,.75,6,1.6);lampL.position.set(-2.75,1.85,-3.15);scene.add(lampL);
// olive tree
add(new T.CylinderGeometry(.3,.24,.6,32),M.pot,-5.25,.3,-4.25);
add(new T.CylinderGeometry(.02,.035,1.6,8),new T.MeshStandardMaterial({color:0x5b4a39}),-5.25,1.3,-4.25);
for(let i=0;i<Q.leaves;i++){const a=Math.random()*6.28,r=rnd(.05,.45),y=rnd(1.3,2.35);
  add(new T.IcosahedronGeometry(rnd(.08,.17),0),M.leaf,-5.25+Math.cos(a)*r,y,-4.25+Math.sin(a)*r*.8);}

/* ---------- door ---------- */
const hinge=new T.Group();hinge.position.set(-0.55,0,5.06);scene.add(hinge);
add(box(1.1,2.3,.05),M.door,.55,1.15,0,{parent:hinge});
for(const z of [.03,-.03]){ add(box(.8,1.05,.012),M.doorPanel,.55,1.68,z,{parent:hinge}); add(box(.8,.8,.012),M.doorPanel,.55,.6,z,{parent:hinge}); }
for(const z of [.06,-.06]){ add(box(.2,.025,.025),M.brass,.9,1.02,z,{parent:hinge}); add(new T.CylinderGeometry(.03,.03,.03,16),M.brass,1.0,1.02,z*.75,{rx:Math.PI/2,parent:hinge}); }

/* ---------- lights ---------- */
scene.add(new T.HemisphereLight(0xfff3e2,0x6b5644,.5));
const sun=new T.DirectionalLight(0xffd6a0,2.5);
sun.position.set(15,6.6,7.5);sun.target.position.set(0,0,-4);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(Q.shadow,Q.shadow);
Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:45});
sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;sun.shadow.radius=3;
const bounce=new T.PointLight(0xfff0dc,.55,12,1.5);bounce.position.set(2.5,2.4,-1);scene.add(bounce);
const hall=new T.PointLight(0xffd7a8,.7,7,1.4);hall.position.set(0,2.7,7.6);scene.add(hall);


/* ---------- kamera yolu ---------- */
const K = [
 { p: 0.00, pos: [0, 1.58, 7.8], look: [0, 1.3, 0], fov: 46 },
 { p: 0.14, pos: [0, 1.6, 6.3], look: [-0.15, 1.4, -2], fov: 50 },
 { p: 0.25, pos: [0, 1.62, 3.7], look: [-0.9, 1.55, -5], fov: 52 },
 { p: 0.35, pos: [-1.0, 1.66, 0.7], look: [-1.4, 1.6, -5], fov: 50 },
 { p: 0.46, pos: [-1.9, 1.78, -2.25], look: [-2.0, 1.95, -5], fov: 45 },
 { p: 0.57, pos: [0.5, 1.68, -1.3], look: [5, 1.95, 0.2], fov: 50 },
 { p: 0.70, pos: [2.75, 1.45, -0.75], look: [5, 2.35, 1.4], fov: 41 },
 { p: 0.80, pos: [2.1, 1.62, 0.3], look: [5, 1.85, 0.7], fov: 48 },
 { p: 0.94, pos: [-4.55, 1.78, 4.25], look: [1.4, 1.1, -3.2], fov: 55 },
 { p: 1.00, pos: [-4.65, 1.8, 4.35], look: [1.4, 1.1, -3.2], fov: 55 }
];
const V = (a) => new T.Vector3(...a);
let cPos, cLook;
function buildPath() {
  if (camera.aspect > 1) { const o = rtl ? 1.15 : -1.15; K[0].pos = [o, 1.58, 7.8]; K[0].look = [o, 1.3, 0]; }
  else { K[0].pos = [0, 1.5, 9.3]; K[0].look = [0, 0.7, 0]; }
  cPos = new T.CatmullRomCurve3(K.map((k) => V(k.pos)), false, 'centripetal');
  cLook = new T.CatmullRomCurve3(K.map((k) => V(k.look)), false, 'centripetal');
}
const clamp = (x) => Math.min(1, Math.max(0, x));
const sm = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const lookV = new T.Vector3();
function placeCamera(p) {
  let i = 0; while (i < K.length - 2 && p >= K[i + 1].p) i++;
  // segment içinde doğrusal parametre: anahtar karelerde durma/hızlanma olmadan akıcı hareket
  const t = clamp((p - K[i].p) / (K[i + 1].p - K[i].p));
  const u = (i + t) / (K.length - 1);
  cPos.getPoint(u, camera.position); cLook.getPoint(u, lookV); camera.lookAt(lookV);
  const a = K[Math.max(0, i - 1)].fov, b = K[i].fov, c = K[i + 1].fov;
  let fov = b + (c - b) * ease(t) + 0 * a;
  if (camera.aspect < 1) fov *= 1.38;
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  const hr = ease(sm(0.025, 0.19, p)) * 1.72;
  if (hr !== hinge.rotation.y) { hinge.rotation.y = hr; renderer.shadowMap.needsUpdate = true; }
}

/* ---------- metin ve oklar ---------- */
const $ = (id) => document.getElementById(id);
const L = { hero: $('ihero'), l1: $('l1'), l2: $('l2'), out: $('ioutro') };
const rail = intro.querySelector('.rail'), railLi = [...intro.querySelectorAll('.rail li')];
const bar = intro.querySelector('.ibar span');
const NS = 'http://www.w3.org/2000/svg', svgEl = $('callouts');
function mk() { const g = document.createElementNS(NS, 'g'); g.innerHTML = '<path class="ln"/><path class="hd"/><g class="tg"><circle class="ring" r="15"/><circle class="dot" r="3.5"/></g>'; svgEl.appendChild(g); return { g, ln: g.querySelector('.ln'), hd: g.querySelector('.hd'), tg: g.querySelector('.tg'), ring: g.querySelector('.ring'), dot: g.querySelector('.dot') }; }
const C1 = mk(), C2 = mk();
const A1d = new T.Vector3(-2.85, 1.7, -4.99), A1m = new T.Vector3(-1.6, 1.75, -4.99), A2 = new T.Vector3(4.72, 1.9, 2.0);
const pv = new T.Vector3();
const band = (p, a, b, f = 0.035) => Math.min(sm(a - f, a, p), 1 - sm(b, b + f, p));
let VW = 1, VH = 1, isMob = false;
const fx = (n) => n.toFixed(1);
function callout(node, c, anchor, oArrow, draw, oText, pos) {
  node.style.opacity = oText.toFixed(3);
  node.style.visibility = oText < 0.01 ? 'hidden' : 'visible';
  node.style.setProperty('--ty', ((1 - sm(0, 1, oText)) * 105).toFixed(1) + '%');
  c.g.style.opacity = oArrow.toFixed(3);
  if (oArrow < 0.01 && oText < 0.01) return;
  const P = isMob ? pos.m : pos.d;
  let lx = P[0] * VW; if (rtl) lx = VW - lx - node.offsetWidth;
  node.style.transform = `translate3d(${fx(lx)}px,${fx(P[1] * VH)}px,0)`;
  pv.copy(anchor).project(camera);
  const vis = pv.z > 1 ? 0 : sm(1.08, 0.92, Math.abs(pv.x)) * sm(1.08, 0.92, Math.abs(pv.y));
  c.g.style.opacity = (oArrow * vis).toFixed(3);
  if (vis < 0.01) return;
  const tx = (pv.x + 1) / 2 * VW, ty = (1 - pv.y) / 2 * VH;
  const rl = lx, rt = P[1] * VH, rw = node.offsetWidth, rh = node.offsetHeight, rr = rl + rw, rb = rt + rh, stub = 34;
  let sx, sy, ex, ey;
  if (tx < rl - 24) { sx = rl - 16; sy = rt + rh * 0.62; ex = sx - stub; ey = sy; }
  else if (tx > rr + 24) { sx = rr + 16; sy = rt + rh * 0.62; ex = sx + stub; ey = sy; }
  else if (ty > rb) { sx = Math.min(Math.max(tx, rl), rr); sy = rb + 14; ex = sx; ey = sy + stub; }
  else { sx = Math.min(Math.max(tx, rl), rr); sy = rt - 14; ex = sx; ey = sy - stub; }
  const dx = tx - ex, dy = ty - ey, L2 = Math.hypot(dx, dy) || 1, ux = dx / L2, uy = dy / L2, gap = 12;
  const qx = tx - ux * gap, qy = ty - uy * gap, L1 = Math.hypot(ex - sx, ey - sy), Lb = Math.max(1, L2 - gap), d = draw * (L1 + Lb);
  let path = `M${fx(sx)},${fx(sy)}`;
  if (d <= L1) { const k = d / L1; path += ` L${fx(sx + (ex - sx) * k)},${fx(sy + (ey - sy) * k)}`; }
  else { const k = (d - L1) / Lb; path += ` L${fx(ex)},${fx(ey)} L${fx(ex + (qx - ex) * k)},${fx(ey + (qy - ey) * k)}`; }
  c.ln.setAttribute('d', path);
  const hv = sm(0.9, 1, draw), s = 11, bx = qx - ux * s, by = qy - uy * s, nx = -uy * s * 0.5, ny = ux * s * 0.5;
  c.hd.setAttribute('d', `M${fx(bx + nx)},${fx(by + ny)} L${fx(qx)},${fx(qy)} L${fx(bx - nx)},${fx(by - ny)}`);
  c.hd.style.opacity = hv; c.tg.style.opacity = hv;
  c.ring.setAttribute('cx', fx(tx)); c.ring.setAttribute('cy', fx(ty)); c.dot.setAttribute('cx', fx(tx)); c.dot.setAttribute('cy', fx(ty));
}
let lastIdx = -1;
function overlay(p) {
  const o = 1 - sm(0.01, 0.06, p);
  L.hero.style.opacity = o.toFixed(3); L.hero.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  L.hero.style.translate = `0 ${fx(-(1 - o) * 24)}px`;
  callout(L.l1, C1, isMob ? A1m : A1d, band(p, 0.30, 0.47, 0.012), sm(0.30, 0.36, p), band(p, 0.385, 0.47), { d: [0.56, 0.15], m: [0.07, 0.15] });
  callout(L.l2, C2, A2, band(p, 0.63, 0.79, 0.012), sm(0.63, 0.69, p), band(p, 0.715, 0.79), { d: [0.08, 0.15], m: [0.07, 0.14] });
  const oo = sm(0.9, 0.96, p);
  L.out.style.opacity = oo.toFixed(3); L.out.style.translate = `0 ${fx((1 - oo) * 18)}px`;
  const idx = p < 0.28 ? 0 : p < 0.56 ? 1 : p < 0.86 ? 2 : 3;
  if (idx !== lastIdx) { railLi.forEach((r, i) => r.classList.toggle('on', i === idx)); lastIdx = idx; }
  rail.style.opacity = sm(0.03, 0.09, p).toFixed(3);
  bar.style.transform = `scaleX(${p.toFixed(4)})`;
  if (skip) { const so = 1 - sm(0.9, 0.97, p); skip.style.opacity = so.toFixed(3); skip.style.visibility = so < 0.02 ? 'hidden' : 'visible'; }
}

/* ---------- döngü: yalnızca değişiklik olduğunda çizer ---------- */
let target = 0, cur = 0, visible = true, dirty = true, raf = 0, last = 0;
function readScroll() {
  const r = intro.getBoundingClientRect(); const max = r.height - innerHeight;
  target = max > 0 ? clamp(-r.top / max) : 0; wake();
}
function wake() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(now) {
  raf = 0;
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const k = 1 - Math.exp(-dt * 7.5);   // kare hızından bağımsız yumuşatma
  cur += (target - cur) * k;
  if (Math.abs(target - cur) < 0.00005) cur = target;
  placeCamera(cur); overlay(cur);
  renderer.render(scene, camera);
  if (cur !== target || dirty) { dirty = false; raf = requestAnimationFrame(frame); }
}
let lw = 0, lh = 0;
function resize(force) {
  const w = intro.clientWidth, h = window.innerHeight;
  // mobilde adres çubuğunun açılıp kapanmasıyla oluşan küçük yükseklik değişimlerini yok say
  if (!force && w === lw && Math.abs(h - lh) < 140) return;
  lw = w; lh = h; VW = w; VH = h; isMob = w < 700 || w / h < 1;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); buildPath();
  renderer.shadowMap.needsUpdate = true; dirty = true; wake();
}
addEventListener('scroll', readScroll, { passive: true });
addEventListener('resize', () => resize(false));
new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) wake(); }).observe(intro);
mqReduce.addEventListener && mqReduce.addEventListener('change', (ev) => { if (ev.matches) goStatic(); });
resize(true); readScroll(); cur = target;
renderer.shadowMap.needsUpdate = true;
placeCamera(cur); overlay(cur); renderer.render(scene, camera);
intro.classList.add('ready');
document.dispatchEvent(new CustomEvent('bp:intro-ready'));
}
})();
