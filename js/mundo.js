// Mundo: curva del río, agua, orillas, cielo y vegetación que crece con la limpieza
import * as THREE from 'three';

export const N_TRAMOS = 5;
export const LARGO_TRAMO = 130;          // metros aproximados por tramo
export const NB = 256;                   // celdas de limpieza a lo largo del río

const puntos = [];
for (let i = 0; i <= 13; i++) puntos.push(new THREE.Vector3(Math.sin(i * 0.85) * 34 + Math.sin(i * 0.3) * 10, 0, -i * 50));
export const curva = new THREE.CatmullRomCurve3(puntos, false, 'catmullrom', 0.5);
export const LARGO = curva.getLength();

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const rnd = hash;
const ruido = (x, z) => Math.sin(x * 0.07) * Math.cos(z * 0.06) + Math.sin(x * 0.19 + z * 0.13) * 0.5 + Math.cos(z * 0.23 - x * 0.11) * 0.3;
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const anchoRio = (s) => 9 + 2.5 * Math.sin(s * 23) + (s > 0.8 ? -1.5 : 0);
const _t = new THREE.Vector3(), _p = new THREE.Vector3();
export function marco(s) {
  s = Math.min(1, Math.max(0, s));
  curva.getPointAt(s, _p); curva.getTangentAt(s, _t);
  const nx = _t.z, nz = -_t.x;
  return { x: _p.x, z: _p.z, tx: _t.x, tz: _t.z, nx, nz };
}
// altura del terreno: d = distancia lateral desde el centro del río
export function alturaAcantilado(s, lado = 1) {
  const n1 = 0.5 + 0.5 * Math.sin(s * 37 + lado * 2.1) * Math.cos(s * 13 - lado);
  const n3 = 0.5 + 0.5 * Math.sin(s * 91 + lado * 5.7);
  const cañon = sm(0.78, 0.93, s), paramo = 1 - sm(0, 0.25, s);
  return 0.75 + 1.3 * n1 + 0.45 * n3 + paramo * 1.1 + cañon * 7;
}
export function alturaTerreno(s, d, x, z, lado = 1) {
  const hw = anchoRio(s) / 2, e = d - hw;
  if (e < 0) return Math.max(-1.2, -0.25 + e * 0.35);
  const cañon = sm(0.78, 0.93, s), paramo = 1 - sm(0, 0.25, s);
  let y = alturaAcantilado(s, lado) * sm(0, 0.85, e);
  const n2 = 0.5 + 0.5 * Math.sin(s * 23 + lado * 4.3 + 1.7);
  y += (0.6 + 2.2 * n2) * sm(9, 11, e) * (0.5 + paramo * 0.8 + cañon * 1.4);
  y += ruido(x, z) * 0.35 * sm(1.5, 6, e);
  const k = Math.max(0, (e - 13) / 60);
  y += (ruido(x * 0.7, z * 0.7) * 0.6 + 0.75) * 11 * Math.pow(k, 1.5) * (1 + paramo * 1.1 + cañon * 1.3);
  return y;
}
export function puntoOrilla(s, lado, d) {
  const m = marco(s);
  const x = m.x + m.nx * d * lado, z = m.z + m.nz * d * lado;
  return new THREE.Vector3(x, alturaTerreno(s, d, x, z, lado), z);
}

// textura 1D de limpieza (0 sucio .. 1 limpio)
export const limpieza = new Float32Array(NB);
const texData = new Uint8Array(NB);
export const texLimpia = new THREE.DataTexture(texData, NB, 1, THREE.RedFormat, THREE.UnsignedByteType);
texLimpia.minFilter = texLimpia.magFilter = THREE.LinearFilter;
texLimpia.wrapS = texLimpia.wrapT = THREE.ClampToEdgeWrapping;
export function subirTextura() { for (let i = 0; i < NB; i++) texData[i] = Math.round(Math.min(1, limpieza[i]) * 255); texLimpia.needsUpdate = true; }
export const limpiezaEn = (s) => { const f = Math.min(NB - 1.001, Math.max(0, s * (NB - 1))); const i = Math.floor(f); return limpieza[i] + (limpieza[i + 1] - limpieza[i]) * (f - i); };
export function limpiar(s, monto, sigma = 12) {
  const sg = sigma / LARGO;
  for (let i = 0; i < NB; i++) { const d = (i / (NB - 1) - s) / sg; if (Math.abs(d) < 3) limpieza[i] = Math.min(1, limpieza[i] + monto * Math.exp(-d * d * 0.5)); }
  subirTextura();
}
export function sumarTramo(t, monto) {
  const a = t / N_TRAMOS, b = (t + 1) / N_TRAMOS;
  for (let i = 0; i < NB; i++) { const s = i / (NB - 1); if (s >= a && s <= b) limpieza[i] = Math.min(1, limpieza[i] + monto); }
  subirTextura();
}
export function iniciarLimpieza(estados) {
  for (let i = 0; i < NB; i++) {
    const f = (i / (NB - 1)) * N_TRAMOS; const t = Math.min(N_TRAMOS - 1, Math.floor(f));
    const u = f - t; const a = estados[t], b = estados[Math.min(N_TRAMOS - 1, t + 1)];
    limpieza[i] = a + (b - a) * sm(0.75, 1, u) * (t < N_TRAMOS - 1 ? 1 : 0);
  }
  subirTextura();
}

export const uniformes = {
  uTiempo: { value: 0 }, uLimpia: { value: texLimpia },
  uFogColor: { value: new THREE.Color(0x9a9272) }, uFogNear: { value: 20 }, uFogFar: { value: 130 },
  uSol: { value: new THREE.Vector3(0.5, 0.75, -0.4).normalize() }
};
const nivelFog = `float f = smoothstep(uFogNear, uFogFar, length(vVista)); col = mix(col, uFogColor, f);`;

export function crearAgua() {
  const seg = 420, cols = 6; const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const s = i / seg, m = marco(s), hw = anchoRio(s) / 2;
    for (let j = 0; j <= cols; j++) {
      const v = j / cols * 2 - 1;
      pos.push(m.x + m.nx * v * (hw + 0.4), 0, m.z + m.nz * v * (hw + 0.4));
      uv.push(s, v);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j, b = a + cols + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: uniformes, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vVista; varying vec3 vMundo;
      void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vVista=mv.xyz; vMundo=(modelMatrix*vec4(position,1.)).xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTiempo; uniform sampler2D uLimpia; uniform vec3 uFogColor; uniform float uFogNear,uFogFar;
      varying vec2 vUv; varying vec3 vVista; varying vec3 vMundo;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){
        float c = texture2D(uLimpia, vec2(vUv.x,.5)).r;
        float lado = abs(vUv.y);
        vec3 sucio = mix(vec3(.30,.24,.14), vec3(.42,.36,.22), smoothstep(.3,1.,lado));
        vec3 medio = mix(vec3(.12,.38,.40), vec3(.22,.55,.50), smoothstep(.3,1.,lado));
        vec3 limpio = mix(vec3(.04,.40,.70), vec3(.22,.83,.86), smoothstep(.25,.95,lado));
        vec3 col = mix(sucio, medio, smoothstep(0.,.5,c)); col = mix(col, limpio, smoothstep(.45,1.,c));
        vec2 q = vec2(vMundo.x*.35 + vMundo.z*.1, vMundo.z*.35 - uTiempo*.9);
        float w = vn(q*1.6)*.6 + vn(q*3.4+uTiempo*.2)*.4;
        float racha = smoothstep(.70,.80, vn(vec2(vMundo.x*.22, vMundo.z*.09 - uTiempo*1.1)*2.3));
        col += (w-.5)*.10*(.5+c);
        col = mix(col, vec3(.92,.98,1.), racha*(.12+.3*c));
        float borde = smoothstep(.82,1.,abs(vUv.y));
        col = mix(col, vec3(1.), borde*(.35+.3*w));
        col = mix(col, col*.55, (1.-c)*.25*w);
        float brillo = pow(vn(q*9.+uTiempo*.5), 20.) * 2.2 * c;
        col += vec3(brillo);
        float f = smoothstep(uFogNear,uFogFar,length(vVista)); col = mix(col,uFogColor,f);
        gl_FragColor = vec4(col,1.);
      }`
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

export function crearOrillas() {
  const E = [-1.4, -0.35, 0.02, 0.42, 0.88, 1.6, 3, 5, 7.5, 9.1, 10.9, 13, 18, 25, 34, 46, 62, 82];
  const K = E.length - 1, seg = 260; const meshes = [];
  for (const lado of [-1, 1]) {
    const pos = [], ss = [], tint = [], idx = [];
    for (let i = 0; i <= seg; i++) {
      const s = i / seg, hw = anchoRio(s) / 2;
      for (let k = 0; k <= K; k++) {
        const muro = E[k] > 0 && E[k] < 12;
        const d = hw + E[k] + (muro ? (hash(i * 13.1 + k * 3.7 + lado) - 0.5) * 0.7 : 0);
        const p = puntoOrilla(s, lado, d); if (muro) p.y += (hash(i * 7.3 + k * 1.9 + lado) - 0.5) * 0.35; pos.push(p.x, p.y, p.z); ss.push(s); tint.push(hash(i * 31 + k * 7 + lado));
      }
    }
    for (let i = 0; i < seg; i++) for (let k = 0; k < K; k++) { const a = i * (K + 1) + k, b = a + K + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 1));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tint, 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: uniformes, side: THREE.DoubleSide, extensions: { derivatives: true },
      vertexShader: `attribute float aS; attribute float aT; varying float vS; varying float vT; varying vec3 vVista; varying vec3 vMundo;
        void main(){ vS=aS; vT=aT; vec4 mv=modelViewMatrix*vec4(position,1.); vVista=mv.xyz; vMundo=position; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D uLimpia; uniform vec3 uFogColor,uSol; uniform float uFogNear,uFogFar,uTiempo;
        varying float vS; varying float vT; varying vec3 vVista; varying vec3 vMundo;
        void main(){
          float c = texture2D(uLimpia, vec2(vS,.5)).r;
          vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo))); if(n.y<0.) n=-n;
          float luz = .58 + .62*max(dot(n,uSol),0.);
          float roca = 1. - smoothstep(.5,.8,n.y);
          float bf = fract(vMundo.y*1.5 + sin(vMundo.x*.31 + vMundo.z*.23)*.3);
          vec3 rc = bf < .34 ? vec3(.50,.31,.21) : bf < .67 ? vec3(.63,.42,.28) : vec3(.56,.37,.26);
          rc = mix(vec3(.36,.25,.19), rc, smoothstep(.0,1.2,vMundo.y));
          rc = mix(rc, vec3(.55,.52,.47), (1.-c)*.35);
          vec3 verde = mix(vec3(.38,.70,.24), vec3(.55,.82,.30), vT);
          verde = mix(verde, vec3(.42,.62,.36), smoothstep(6.,20.,vMundo.y)*.5);
          vec3 seco = mix(vec3(.58,.52,.33), vec3(.50,.43,.29), vT);
          vec3 pasto = mix(seco, verde, smoothstep(.1,.7,c));
          vec3 col = mix(pasto, rc, roca) * luz;
          float esp = (1.-smoothstep(.0,.32,vMundo.y)) * step(-.25,vMundo.y);
          esp *= .55 + .45*sin(uTiempo*2.2 + vMundo.x*1.7 + vMundo.z*1.3);
          col = mix(col, vec3(1.), esp*(.35+.55*c));
          float f = smoothstep(uFogNear,uFogFar,length(vVista)); col = mix(col,uFogColor,f);
          gl_FragColor = vec4(col,1.);
        }`
    });
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; meshes.push(m);
  }
  return meshes;
}

function panorama() {
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H / 2); g.addColorStop(0, '#2f86d0'); g.addColorStop(0.55, '#79c1ea'); g.addColorStop(1, '#d4f1f8');
  x.fillStyle = g; x.fillRect(0, 0, W, H / 2); x.fillStyle = '#cfe9ee'; x.fillRect(0, H / 2, W, H / 2);
  // nubes pintadas
  const nube = (cx, cy, s) => {
    for (const dx of [0, -W, W]) {
      const px = cx + dx;
      x.fillStyle = '#d6e6f2'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(px + (i - 2.5) * 26 * s, cy + 8 * s, 34 * s, 20 * s, 0, 0, 7); x.fill(); }
      x.fillStyle = '#ffffff'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(px + (i - 2) * 28 * s, cy - Math.sin(i / 4 * Math.PI) * 22 * s, (26 + Math.sin(i * 2.3) * 8) * s, 0, 7); x.fill(); }
    }
  };
  for (let i = 0; i < 22; i++) nube(hash(i * 3.3) * W, H * (0.2 + hash(i * 7.1) * 0.24), 0.7 + hash(i * 1.9) * 1.1);
  // cordilleras low-poly (periódicas para cerrar la costura)
  const capa = (base, amp, col, colSombra, fase, paso) => {
    const alt = (px) => { const u = px / W * Math.PI * 2; return amp * (0.55 + 0.25 * Math.sin(u * 3 + fase) + 0.15 * Math.sin(u * 7 + fase * 2) + 0.1 * Math.sin(u * 13 + fase * 3)); };
    let px = 0; const pts = [];
    while (px <= W) { pts.push([px, base - alt(px) * (0.8 + 0.4 * hash(px * 0.37 + fase))]); px += paso; }
    pts[pts.length - 1][1] = pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      x.fillStyle = y1 < y0 ? colSombra : col; x.beginPath(); x.moveTo(x0, base + 4); x.lineTo(x0, y0); x.lineTo(x1, y1); x.lineTo(x1, base + 4); x.fill();
    }
    x.fillStyle = col; x.fillRect(0, base, W, H - base);
  };
  capa(H * 0.5, H * 0.13, '#a9cfe0', '#98c1d4', 0.3, 44);
  capa(H * 0.505, H * 0.09, '#86b6c6', '#76a6b8', 2.1, 36);
  capa(H * 0.51, H * 0.055, '#6fa3ad', '#5f939e', 4.4, 28);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.minFilter = THREE.LinearFilter; return t;
}
export function crearCielo() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTex: { value: panorama() }, uNiebla: { value: new THREE.Color(0x9a9272) }, uSucio: { value: 1 }, uSol: uniformes.uSol },
    vertexShader: `varying vec2 vUv; varying vec3 vD; void main(){ vUv=uv; vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D uTex; uniform vec3 uNiebla,uSol; uniform float uSucio; varying vec2 vUv; varying vec3 vD;
      void main(){ vec3 c = texture2D(uTex, vUv).rgb;
        float s=max(dot(normalize(vD),normalize(uSol)),0.); c+=vec3(1.,.85,.6)*pow(s,20.)*.35+vec3(1.,.95,.8)*pow(s,500.)*1.5;
        c = mix(c, uNiebla, uSucio*.68*(1.-smoothstep(.05,.6,vD.y)*.35));
        gl_FragColor=vec4(c,1.); }`
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), mat); m.renderOrder = -1; return m;
}

// ---------- geometrías simples fusionadas ----------
function fusionar(lista) {
  const P = [], Nn = [];
  for (const { g, x = 0, y = 0, z = 0 } of lista) {
    const ng = g.index ? g.toNonIndexed() : g; ng.translate(x, y, z); ng.computeVertexNormals();
    P.push(...ng.attributes.position.array); Nn.push(...ng.attributes.normal.array);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  return out;
}
const geoPino = () => fusionar([
  { g: new THREE.CylinderGeometry(.12, .2, 1.2, 5), y: .6 },
  { g: new THREE.ConeGeometry(1.5, 2.1, 7), y: 2.0 }, { g: new THREE.ConeGeometry(1.15, 1.9, 7), y: 3.1 }, { g: new THREE.ConeGeometry(.75, 1.6, 7), y: 4.1 }
]);
const geoArbol = () => fusionar([
  { g: new THREE.CylinderGeometry(.14, .22, 1.6, 5), y: .8 },
  { g: new THREE.IcosahedronGeometry(1.25, 0), y: 2.4 }, { g: new THREE.IcosahedronGeometry(.9, 0), x: .8, y: 2.0 }, { g: new THREE.IcosahedronGeometry(.85, 0), x: -.7, y: 2.1, z: .3 }
]);
const geoJunco = () => fusionar([{ g: new THREE.ConeGeometry(.07, 1.7, 3), y: .85 }, { g: new THREE.ConeGeometry(.06, 1.3, 3), x: .15, y: .65, z: .05 }, { g: new THREE.ConeGeometry(.06, 1.5, 3), x: -.12, y: .75, z: -.08 }]);
const geoFrailejon = () => fusionar([
  { g: new THREE.CylinderGeometry(.18, .26, 1.4, 6), y: .7 },
  { g: new THREE.ConeGeometry(.7, 1.0, 8), y: 1.7 }, { g: new THREE.ConeGeometry(.5, 1.1, 8), y: 2.2 }
]);
const geoLirio = () => { const g = new THREE.CircleGeometry(.75, 9); g.rotateX(-Math.PI / 2); g.translate(0, .05, 0); return g; };
const geoFlor = () => fusionar([{ g: new THREE.CylinderGeometry(.015, .015, .4, 3), y: .2 }, { g: new THREE.ConeGeometry(.16, .22, 5), y: .5 }]);
const geoRoca = () => new THREE.IcosahedronGeometry(1, 0);

const dummy = new THREE.Object3D();
const col = new THREE.Color();
class Grupo {
  constructor(geo, mat, n, cfg) {
    this.n = n; this.cfg = cfg;
    this.mesh = new THREE.InstancedMesh(geo, mat, n); this.mesh.frustumCulled = false;
    this.px = new Float32Array(n); this.py = new Float32Array(n); this.pz = new Float32Array(n);
    this.rot = new Float32Array(n); this.sc = new Float32Array(n); this.thr = new Float32Array(n);
    this.s = new Float32Array(n); this.esc = new Float32Array(n);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }
  poner(i, p, s, rot, sc, thr) {
    this.px[i] = p.x; this.py[i] = p.y; this.pz[i] = p.z; this.s[i] = s; this.rot[i] = rot; this.sc[i] = sc; this.thr[i] = thr;
    this.esc[i] = this.cfg.minEsc || 0; this.escribir(i);
  }
  escribir(i) {
    const e = this.esc[i], sc = this.sc[i] * Math.max(e, 0.0001);
    dummy.position.set(this.px[i], this.py[i], this.pz[i]); dummy.rotation.set(0, this.rot[i], 0); dummy.scale.set(sc, sc * (this.cfg.alto || 1), sc);
    dummy.updateMatrix(); this.mesh.setMatrixAt(i, dummy.matrix);
  }
  color(i, hex) { col.setHex(hex); this.mesh.setColorAt(i, col); }
  actualizar(sBarco, rango, dt) {
    let cambio = false; const min = this.cfg.minEsc || 0;
    if (this.cfg.fija) return;
    for (let i = 0; i < this.n; i++) {
      if (Math.abs(this.s[i] - sBarco) > rango) continue;
      const c = limpiezaEn(this.s[i]);
      const objetivo = min + (1 - min) * sm(this.thr[i] - 0.1, this.thr[i] + 0.1, c);
      const d = objetivo - this.esc[i];
      if (Math.abs(d) > 0.004) { this.esc[i] += d * Math.min(1, dt * 2.2); this.escribir(i); cambio = true; }
    }
    if (cambio) this.mesh.instanceMatrix.needsUpdate = true;
  }
}

export const rocasAgua = [];
export function crearFlora(escena, cantidad = 1) {
  const grupos = [];
  const mLam = (extra = {}) => new THREE.MeshLambertMaterial({ flatShading: true, ...extra });
  const nPino = Math.round(380 * cantidad), nArb = Math.round(260 * cantidad);
  const pinos = new Grupo(geoPino(), mLam(), nPino, { minEsc: 0.35 });
  const arboles = new Grupo(geoArbol(), mLam(), nArb, { minEsc: 0.3 });
  const juncos = new Grupo(geoJunco(), mLam(), Math.round(420 * cantidad), { minEsc: 0 });
  const lirios = new Grupo(geoLirio(), mLam({ side: THREE.DoubleSide }), 150, { minEsc: 0 });
  const flores = new Grupo(geoFlor(), mLam(), Math.round(380 * cantidad), { minEsc: 0 });
  const frail = new Grupo(geoFrailejon(), mLam(), 70, { minEsc: 0.6 });
  const rocas = new Grupo(geoRoca(), mLam(), Math.round(160 * cantidad), { fija: true, alto: 0.7 });
  grupos.push(pinos, arboles, juncos, lirios, flores, frail, rocas);

  const verdes = [0x2f8a3e, 0x3fa046, 0x24753a, 0x52a83f], verdes2 = [0x62b846, 0x7cc94f, 0x55a83e, 0x8fd157];
  const seco = 0x7c6a3a;
  for (let i = 0; i < pinos.n; i++) {
    const s = hash(i * 3.1) , lado = hash(i * 5.3) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const d = hw + 1.6 + Math.pow(hash(i * 7.7), 1.4) * 58;
    const p = puntoOrilla(s, lado, d);
    pinos.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 9.1) * 1.1 + (p.y > 6 ? 0.4 : 0), 0.15 + hash(i * 2.2) * 0.55);
    pinos.color(i, verdes[i % 4]);
  }
  for (let i = 0; i < arboles.n; i++) {
    const s = hash(i * 4.1 + 50), lado = hash(i * 6.3 + 9) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const d = hw + 1.4 + Math.pow(hash(i * 8.7 + 3), 1.3) * 45;
    const p = puntoOrilla(s, lado, d);
    arboles.poner(i, p, s, hash(i + 11) * 6.28, 0.8 + hash(i * 3.3) * 0.9, 0.2 + hash(i * 5.2) * 0.55);
    arboles.color(i, verdes2[i % 4]);
  }
  for (let i = 0; i < juncos.n; i++) {
    const s = hash(i * 2.9 + 7), lado = hash(i * 4.7) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const d = hw - 0.8 + hash(i * 6.1) * 0.8;
    const p = puntoOrilla(s, lado, d); p.y = -0.12;
    juncos.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 1.7) * 0.9, 0.35 + hash(i * 3.7) * 0.5);
    juncos.color(i, i % 3 ? 0x6e9a3a : 0x93a64a);
  }
  for (let i = 0; i < lirios.n; i++) {
    const s = 0.05 + hash(i * 3.7 + 1) * 0.95, hw = anchoRio(s) / 2, lado = hash(i * 5.9) < .5 ? -1 : 1;
    const p = puntoOrilla(s, lado, hw * (0.2 + hash(i * 7.1) * 0.62)); p.y = 0.02;
    lirios.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 2.3) * 0.7, 0.45 + hash(i * 4.3) * 0.45);
    lirios.color(i, i % 2 ? 0x4aa84a : 0x62b84f);
  }
  const fcol = [0xffd34d, 0xc58bff, 0xffffff, 0xff8fb3, 0xff9a4d];
  for (let i = 0; i < flores.n; i++) {
    const s = hash(i * 1.9 + 77), lado = hash(i * 8.1) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const d = hw + 1.3 + hash(i * 3.3) * 8;
    const p = puntoOrilla(s, lado, d);
    flores.poner(i, p, s, 0, 0.9 + hash(i * 1.3) * 0.8, 0.5 + hash(i * 9.7) * 0.45);
    flores.color(i, fcol[i % 5]);
  }
  for (let i = 0; i < frail.n; i++) {
    const s = hash(i * 1.1 + 5) * 0.27, lado = hash(i * 4.4) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 3 + hash(i * 3.9) * 30);
    frail.poner(i, p, s, hash(i) * 6.28, 0.9 + hash(i * 2.1) * 0.9, 0.2 + hash(i * 3.1) * 0.4);
    frail.color(i, i % 2 ? 0x9bb080 : 0xb4c49a);
  }
  for (let i = 0; i < rocas.n; i++) {
    const s = hash(i * 6.7 + 13), lado = hash(i * 2.3) < .5 ? -1 : 1, hw = anchoRio(s) / 2;
    const enAgua = hash(i * 9.9) < .22;
    const p = enAgua ? puntoOrilla(s, lado, hw * (0.62 + hash(i * 3.3) * 0.33)) : puntoOrilla(s, lado, hw + hash(i * 3.1) * 14);
    if (enAgua) { p.y = 0; rocasAgua.push({ x: p.x, z: p.z, r: 0.5 + Math.pow(hash(i * 7.3), 2) * 2.4 }); }
    rocas.poner(i, p, s, hash(i) * 6.28, enAgua ? 0.5 + Math.pow(hash(i * 7.3), 2) * 2.4 : 0.4 + Math.pow(hash(i * 7.3), 2) * 1.3, 0);
    rocas.esc[i] = 1; rocas.escribir(i);
    rocas.color(i, [0xd9d3c4, 0xc9c0ac, 0xe8e2d4, 0xb9b09c][i % 4]);
  }
  for (const g of grupos) { g.mesh.instanceMatrix.needsUpdate = true; if (g.mesh.instanceColor) g.mesh.instanceColor.needsUpdate = true; escena.add(g.mesh); }
  return grupos;
}
