// Ambientación estática fusionada en pocas mallas (rendimiento en celular)
import * as THREE from 'three';
import { marco, puntoOrilla, anchoRio, alturaAcantilado, alturaTerreno, rocasAgua, rnd, uniformes } from './mundo.js';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
const col = new THREE.Color();

class Lote {
  constructor() { this.P = []; this.C = []; }
  add(geo, hex, local, global) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (local) g.applyMatrix4(local);
    if (global) g.applyMatrix4(global);
    const p = g.attributes.position.array; col.setHex(hex);
    for (let i = 0; i < p.length; i++) this.P.push(p[i]);
    for (let i = 0; i < p.length / 3; i++) this.C.push(col.r, col.g, col.b);
  }
  malla(mat) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat || new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    m.frustumCulled = false; return m;
  }
}
const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(_v.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));

// geometrías base
const G = {
  caja: new THREE.BoxGeometry(1, 1, 1),
  prisma: (() => { // largo en x, alto en y (de 0 a 1), ancho en z
    const v = [-.5, 0, -.5, -.5, 0, .5, -.5, 1, 0, .5, 0, -.5, .5, 0, .5, .5, 1, 0];
    const idx = [0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); return g; })(),
  cil: new THREE.CylinderGeometry(1, 1, 1, 6),
  cono: new THREE.ConeGeometry(1, 1, 5),
  esfera: new THREE.IcosahedronGeometry(1, 1),
  ico: new THREE.IcosahedronGeometry(1, 0)
};
const PAREDES = [0xf4ede0, 0xf7e6c4, 0xeaf1f2, 0xf3d9c6], TEJAS = [0xc4513a, 0xd0633f, 0xb8452f, 0xd9744a];

// dirección hacia el río para un objeto en la orilla
const haciaRio = (s, lado) => { const m = marco(s); return Math.atan2(-m.nx * lado, -m.nz * lado); };

function casa(L, p, ry, k = 1, i = 0, alta = false) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, k);
  const pared = PAREDES[i % 4], teja = TEJAS[(i * 3 + 1) % 4];
  const h = alta ? 2.4 : 1.5;
  L.add(G.caja, 0x9c9384, M4(0, 0.1, 0, 0, 0, 0, 2.3, 0.6, 1.9), T);
  L.add(G.caja, pared, M4(0, 0.3 + h / 2, 0, 0, 0, 0, 2, h, 1.6), T);
  L.add(G.prisma, teja, M4(0, 0.3 + h, 0, 0, 0, 0, 2.4, 0.9, 1.95), T);
  L.add(G.caja, 0x6b3f22, M4(0.35, 0.75, 0.81, 0, 0, 0, 0.42, 0.8, 0.05), T);
  L.add(G.caja, 0x2f5a6e, M4(-0.5, 0.3 + h * 0.6, 0.81, 0, 0, 0, 0.42, 0.36, 0.05), T);
  L.add(G.caja, 0x2f5a6e, M4(-1.01, 0.3 + h * 0.6, 0, 0, 0, 0, 0.05, 0.36, 0.42), T);
  L.add(G.caja, 0x8d6e5a, M4(0.6, 0.3 + h + 0.7, -0.3, 0, 0, 0, 0.26, 0.7, 0.26), T);
  if (alta) L.add(G.caja, 0x6b3f22, M4(0, 0.3 + h * 0.5, 0.86, 0, 0, 0, 2.1, 0.08, 0.3), T); // balcón
}
function edificio(L, p, ry, h, i) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1);
  const c = [0xc97b5a, 0xe0c9a6, 0xb9c4c9, 0xd9a07a, 0xe8e1d3][i % 5];
  L.add(G.caja, c, M4(0, h / 2, 0, 0, 0, 0, 2.6, h, 2.4), T);
  L.add(G.caja, 0x7a6e66, M4(0, h + 0.1, 0, 0, 0, 0, 2.8, 0.2, 2.6), T);
  for (let y = 1; y < h - 0.4; y += 1.1) for (const x of [-0.75, 0, 0.75]) L.add(G.caja, 0x35566a, M4(x, y, 1.21, 0, 0, 0, 0.4, 0.5, 0.04), T);
  if (i % 3 === 0) L.add(G.cil, 0x8a8a8a, M4(0.7, h + 0.6, -0.5, 0, 0, 0, 0.35, 1, 0.35), T); // tanque
}
function iglesia(L, p, ry) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1.1);
  L.add(G.caja, 0xf6f1e6, M4(0, 1.2, 0, 0, 0, 0, 2.4, 2.4, 4), T);
  L.add(G.prisma, 0xb8452f, M4(0, 2.4, 0, 0, Math.PI / 2, 0, 4.2, 1.1, 2.7), T);
  L.add(G.caja, 0xf6f1e6, M4(0, 2.4, 2.2, 0, 0, 0, 1.3, 4.8, 1.3), T);
  L.add(G.cono, 0xb8452f, M4(0, 5.5, 2.2, 0, Math.PI / 4, 0, 1.0, 1.4, 1.0), T);
  L.add(G.caja, 0x6b3f22, M4(0, 0.7, 2.86, 0, 0, 0, 0.6, 1.2, 0.05), T);
}
function mansion(L, p, ry) { // casona junto al Salto
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1.3);
  L.add(G.caja, 0xa89c8a, M4(0, 0.2, 0, 0, 0, 0, 5, 0.6, 3.4), T);
  L.add(G.caja, 0xf1e6cf, M4(0, 1.9, 0, 0, 0, 0, 4.4, 3, 3), T);
  L.add(G.prisma, 0x6a6f75, M4(0, 3.4, 0, 0, 0, 0, 4.8, 1.3, 3.3), T);
  for (const x of [-1.5, -0.5, 0.5, 1.5]) for (const y of [1.2, 2.5]) L.add(G.caja, 0x2f5a6e, M4(x, y, 1.51, 0, 0, 0, 0.45, 0.6, 0.04), T);
  for (const x of [-2.4, 2.4]) { L.add(G.caja, 0xf1e6cf, M4(x, 2.4, 0, 0, 0, 0, 1.2, 4.2, 1.2), T); L.add(G.cono, 0x6a6f75, M4(x, 5.1, 0, 0, Math.PI / 4, 0, 0.95, 1.3, 0.95), T); }
}
function palafito(L, s, lado, i) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw - 0.9); p.y = 0;
  const ry = haciaRio(s, lado) + Math.PI / 2 * 0;
  const T = M4(p.x, 0, p.z, 0, ry, 0, 0.85);
  for (const [x, z] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) L.add(G.cil, 0x5a3a1e, M4(x, 0.5, z, 0, 0, 0, 0.09, 2.2, 0.09), T);
  L.add(G.caja, 0x7a5230, M4(0, 1.55, 0, 0, 0, 0, 2.4, 0.12, 2), T);
  casa(L, new THREE.Vector3(0, 1.3, 0).applyMatrix4(T), ry, 0.8, i);
  // pasarela al acantilado
  const H = alturaAcantilado(s, lado);
  for (let k = 0; k < 6; k++) L.add(G.caja, 0x8a5a2e, M4(0, 1.5 + (H - 1.5) * k / 6, -1.3 - k * 0.35, 0, 0, 0, 0.8, 0.08, 0.34), T);
}
function canoa(L, s, lado, i) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw - 1.1 - rnd(i) * 0.6); p.y = 0.05;
  const m = marco(s), ry = Math.atan2(-m.tx, -m.tz) + (rnd(i * 3) - 0.5) * 0.6;
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1);
  L.add(G.esfera, 0x8a5a2e, M4(0, 0, 0, 0, 0, 0, 0.42, 0.2, 1.5), T);
  L.add(G.caja, 0xd8b57a, M4(0, 0.13, 0, 0, 0, 0, 0.55, 0.04, 2.0), T);
  L.add(G.caja, 0x6b4a24, M4(0, 0.2, 0.3, 0, 0, 0, 0.6, 0.06, 0.18), T);
}
function puente(L, s, faroles) {
  const m = marco(s), hw = anchoRio(s) / 2;
  const yA = alturaAcantilado(s, 1), yB = alturaAcantilado(s, -1);
  const base = Math.max(3.3, Math.min(yA, yB) + 0.1), Lg = hw * 2 + 3.2, N = 18;
  const ry = Math.atan2(-m.nz, m.nx);
  const tz = 1.7;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), off = (u - 0.5) * Lg, y = base + Math.sin(Math.PI * u) * 0.9;
    const x = m.x + m.nx * off, z = m.z + m.nz * off;
    L.add(G.caja, i % 2 ? 0x9a6a3a : 0x8a5a2e, M4(x, y, z, 0, ry, 0, Lg / N * 1.02, 0.12, tz));
    if (i % 3 === 0) for (const sgn of [-1, 1]) {
      const px = x + m.tx * sgn * tz * 0.5, pz = z + m.tz * sgn * tz * 0.5;
      L.add(G.caja, 0x5a3a1e, M4(px, y + 0.4, pz, 0, ry, 0, 0.1, 0.8, 0.1));
      L.add(G.caja, 0x6b4422, M4(px, y + 0.78, pz, 0, ry, 0, Lg / N * 3.1, 0.07, 0.07));
    }
  }
  // pilotes en el agua
  for (const sgn of [-1, 1]) {
    const off = sgn * (hw - 0.6), x = m.x + m.nx * off, z = m.z + m.nz * off, y = base + Math.sin(Math.PI * (off / Lg + 0.5)) * 0.9;
    for (const t of [-0.6, 0.6]) L.add(G.cil, 0x4e3318, M4(x + m.tx * t, y / 2 - 0.4, z + m.tz * t, 0, 0, 0, 0.14, y + 0.8, 0.14));
    rocasAgua.push({ x, z, r: 0.6 });
  }
  for (const sgn of [-1, 1]) { const off = sgn * Lg * 0.5, p = new THREE.Vector3(m.x + m.nx * off, base + 1.3, m.z + m.nz * off); L.add(G.cil, 0x3a2a1a, M4(p.x, base + 0.6, p.z, 0, 0, 0, 0.06, 1.3, 0.06)); faroles.push(p); }
}
function helecho(L, p, k, i) { // helecho arborescente del bosque de niebla
  const T = M4(p.x, p.y, p.z, 0, rnd(i) * 6.28, 0, k);
  let x = 0, y = 0;
  for (let j = 0; j < 5; j++) { const nx = x + 0.08; L.add(G.cil, 0x6b4f2e, M4((x + nx) / 2, y + 0.4, 0, 0, 0, -0.08, 0.13 - j * 0.015, 0.82, 0.13 - j * 0.015), T); x = nx; y += 0.8; }
  for (let h = 0; h < 8; h++) {
    const a = h / 8 * Math.PI * 2;
    L.add(G.cono, h % 2 ? 0x4caf50 : 0x6cc24a, M4(x + Math.cos(a) * 0.9, y + 0.1, Math.sin(a) * 0.9, Math.sin(a) * 1.2 * 0, -a, Math.PI / 2 - 0.35, 0.3, 2.0, 0.08), T);
  }
}
function nube(L, x, y, z, k, i) {
  const T = M4(x, y, z, 0, rnd(i) * 6.28, 0, k);
  const n = 4 + Math.floor(rnd(i * 2) * 3);
  for (let j = 0; j < n; j++) { const a = (j - n / 2) * 1.1; L.add(G.esfera, 0xffffff, M4(a, Math.sin(j / (n - 1) * Math.PI) * 0.9, (rnd(i + j) - 0.5) * 0.8, 0, 0, 0, 1.1 + rnd(j * 7 + i) * 0.6), T); }
  L.add(G.esfera, 0xdbe8f2, M4(0, -0.35, 0, 0, 0, 0, n * 0.65, 0.55, 1.1), T);
}

function brilloTex(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(0.25, `rgba(${r},${g},${b},.9)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export function crearDecor(escena) {
  const L = new Lote(), faroles = [];
  let ic = 0;
  const enOrilla = (s, lado, e) => { const hw = anchoRio(s) / 2; return puntoOrilla(s, lado, hw + e); };
  // casas por tramo (s, lado, e)
  const casas = [
    [0.05, 1, 4], [0.14, -1, 5.5], [0.22, 1, 3.5],
    [0.25, -1, 4], [0.29, 1, 4.5], [0.34, 1, 6], [0.36, -1, 3.5],
    [0.43, 1, 4], [0.47, -1, 5], [0.56, 1, 3.5], [0.59, -1, 6],
    [0.84, -1, 4], [0.9, 1, 4.5]
  ];
  for (const [s, l, e] of casas) casa(L, enOrilla(s, l, e), haciaRio(s, l), 1, ic++, rnd(s * 99) > 0.6);
  // curtiembre (galpón) junto al primer vertimiento
  { const s = 0.312, p = enOrilla(s, 1, 4.5), T = M4(p.x, p.y, p.z, 0, haciaRio(s, 1), 0, 1);
    L.add(G.caja, 0x9aa0a6, M4(0, 1.2, 0, 0, 0, 0, 4.5, 2.4, 3), T); L.add(G.prisma, 0x7d8a92, M4(0, 2.4, 0, 0, 0, 0, 4.8, 0.7, 3.2), T);
    L.add(G.caja, 0x4a4f55, M4(-1.2, 0.8, 1.51, 0, 0, 0, 1.4, 1.6, 0.05), T); L.add(G.cil, 0x6a6a6a, M4(1.6, 3.4, -0.8, 0, 0, 0, 0.25, 2.5, 0.25), T); }
  iglesia(L, enOrilla(0.51, -1, 6), haciaRio(0.51, -1));
  // ciudad (tramo 4): edificios escalonados
  for (let i = 0; i < 34; i++) {
    const s = 0.61 + rnd(i * 4.1) * 0.17, l = i % 2 ? 1 : -1, e = 3.2 + rnd(i * 2.7) * 22;
    edificio(L, enOrilla(s, l, e), haciaRio(s, l), 2.5 + rnd(i * 5.3) * 6 * (e > 12 ? 1.4 : 1), i);
  }
  mansion(L, enOrilla(0.968, -1, 5), haciaRio(0.968, -1));
  // palafitos y canoas
  palafito(L, 0.27, -1, 1); palafito(L, 0.455, 1, 2); palafito(L, 0.535, -1, 3);
  for (let i = 0; i < 12; i++) canoa(L, 0.08 + rnd(i * 6.6) * 0.86, i % 2 ? 1 : -1, i);
  // escalera del muelle inicial
  { const s = 0.006, m = marco(s), H = alturaAcantilado(s, -1), hw = anchoRio(s) / 2, ry = Math.atan2(-m.tx, -m.tz);
    for (let k = 0; k < 9; k++) { const off = hw - 0.6 + k * 0.12, x = m.x - m.nx * off + m.tx * (1.6 - k * 0.42), z = m.z - m.nz * off + m.tz * (1.6 - k * 0.42); L.add(G.caja, 0x8a5a2e, M4(x, 0.6 + (H - 0.6) * k / 8, z, 0, ry, 0, 1.0, 0.1, 0.42)); } }
  // puentes
  for (const s of [0.155, 0.375, 0.585, 0.695, 0.845]) puente(L, s, faroles);
  // helechos arborescentes (último tramo)
  for (let i = 0; i < 40; i++) { const s = 0.8 + rnd(i * 3.9) * 0.18, l = i % 2 ? 1 : -1; helecho(L, enOrilla(s, l, 1.6 + rnd(i * 2.2) * 9), 0.9 + rnd(i) * 0.6, i); }
  // faroles frente a casas
  for (const [s, l, e] of casas) { const p = enOrilla(s, l, e - 1.6); L.add(G.cil, 0x3a2a1a, M4(p.x, p.y + 0.6, p.z, 0, 0, 0, 0.05, 1.2, 0.05)); faroles.push(new THREE.Vector3(p.x, p.y + 1.3, p.z)); }

  const estatico = L.malla(); escena.add(estatico);

  // nubes (se desplazan)
  const LN = new Lote();
  for (let i = 0; i < 30; i++) {
    const s = rnd(i * 5.1), m = marco(s), lat = (rnd(i * 2.9) - 0.5) * 160;
    nube(LN, m.x + m.nx * lat, 24 + rnd(i * 8.1) * 22, m.z + m.nz * lat - 20, 2 + rnd(i * 4.4) * 2.5, i);
  }
  const nubes = LN.malla(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, emissive: 0x8899aa, emissiveIntensity: 0.55 }));
  escena.add(nubes);

  // cascadas (plano con rayas que bajan)
  const P = [], UV = [];
  const plano = (a, b, c, d) => { P.push(...a, ...b, ...c, ...a, ...c, ...d); UV.push(0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0); };
  const caidas = [[0.05, -1, 1.6], [0.11, 1, 2.2], [0.2, -1, 1.4], [0.235, 1, 1.8], [0.45, 1, 1.5], [0.66, -1, 1.3], [0.88, 1, 2.4], [0.925, -1, 2.0], [0.955, 1, 2.6]];
  for (const [s, lado, w] of caidas) {
    const m = marco(s), hw = anchoRio(s) / 2, H = alturaAcantilado(s, lado);
    const pt = (e, y, t) => [m.x + m.nx * (hw + e) * lado + m.tx * t, y, m.z + m.nz * (hw + e) * lado + m.tz * t];
    plano(pt(0.12, H + 0.05, -w / 2), pt(0.12, H + 0.05, w / 2), pt(0.12, -0.1, w / 2), pt(0.12, -0.1, -w / 2));
    plano(pt(1.4, H + 0.06, -w / 2), pt(1.4, H + 0.06, w / 2), pt(0.12, H + 0.05, w / 2), pt(0.12, H + 0.05, -w / 2));
    const b = pt(-0.6, 0, 0); rocasAgua.push({ x: b[0], z: b[2], r: w * 0.6 });
  }
  const gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gc.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  const cascadas = new THREE.Mesh(gc, new THREE.ShaderMaterial({
    uniforms: uniformes, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vVista; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vVista=mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTiempo; uniform vec3 uFogColor; uniform float uFogNear,uFogFar; varying vec2 vUv; varying vec3 vVista;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float r = vn(vec2(vUv.x*7., vUv.y*2.5 + uTiempo*2.6));
        vec3 c = mix(vec3(.55,.88,.95), vec3(1.), smoothstep(.35,.7,r));
        float a = (.75 + .25*r) * smoothstep(0.,.18,vUv.x) * smoothstep(1.,.82,vUv.x);
        float f = smoothstep(uFogNear,uFogFar,length(vVista)); c = mix(c,uFogColor,f);
        gl_FragColor = vec4(c, a); }`
  }));
  cascadas.frustumCulled = false; escena.add(cascadas);

  // anillos de espuma alrededor de rocas, pilotes y caídas
  const LE = new Lote(); const anillo = new THREE.RingGeometry(1, 1.35, 14); anillo.rotateX(-Math.PI / 2);
  const anillo2 = new THREE.RingGeometry(1.55, 1.7, 14); anillo2.rotateX(-Math.PI / 2);
  for (const r of rocasAgua) { LE.add(anillo, 0xffffff, M4(r.x, 0.03, r.z, 0, rnd(r.x) * 6, 0, r.r * 0.95)); LE.add(anillo2, 0xffffff, M4(r.x, 0.03, r.z, 0, 0, 0, r.r * 0.95)); }
  const espuma = LE.malla(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
  escena.add(espuma);

  // faroles encendidos
  const fp = new Float32Array(faroles.length * 3); faroles.forEach((p, i) => fp.set([p.x, p.y, p.z], i * 3));
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const luces = new THREE.Points(gf, new THREE.PointsMaterial({ size: 1.6, map: brilloTex(255, 200, 110), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  luces.frustumCulled = false; escena.add(luces);

  // orbes de vida (aparecen con la limpieza)
  const NO = 46, op = new Float32Array(NO * 3), base = [];
  for (let i = 0; i < NO; i++) base.push([rnd(i * 1.3) * 2 - 1, rnd(i * 2.1), rnd(i * 3.7) * 2 - 1, rnd(i * 4.9) * 6]);
  const go = new THREE.BufferGeometry(); go.setAttribute('position', new THREE.BufferAttribute(op, 3));
  const orbes = new THREE.Points(go, new THREE.PointsMaterial({ size: 0.9, map: brilloTex(110, 255, 225), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  orbes.frustumCulled = false; escena.add(orbes);

  return {
    estatico, nubes, cascadas, espuma, luces, orbes,
    animar(t, centro, limpio) {
      nubes.position.x = Math.sin(t * 0.02) * 10; nubes.position.z = Math.cos(t * 0.015) * 6;
      espuma.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.18;
      luces.material.opacity = 0.65 + Math.sin(t * 3.1) * 0.12;
      for (let i = 0; i < NO; i++) {
        const q = base[i];
        op[i * 3] = centro.x + q[0] * 26 + Math.sin(t * 0.3 + q[3]) * 2;
        op[i * 3 + 1] = 1 + q[1] * 7 + Math.sin(t * 0.7 + q[3]) * 0.8;
        op[i * 3 + 2] = centro.z + q[2] * 26 + Math.cos(t * 0.25 + q[3]) * 2;
      }
      go.attributes.position.needsUpdate = true;
      orbes.material.opacity = Math.max(0, (limpio - 0.45) * 1.8) * (0.75 + 0.25 * Math.sin(t * 1.5));
    }
  };
}
