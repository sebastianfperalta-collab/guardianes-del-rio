// Objetos del juego (v3): canoa de tablas, residuos, vertimiento, fauna, bandada, luciérnagas, muelle
import * as THREE from 'three';
import { marco, puntoOrilla, anchoRio, rnd, uniformes } from './mundo.js';
import { Lote, M4, casco } from './geo.js';

const matVC = new THREE.MeshLambertMaterial({ vertexColors: true });
const matVC2 = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
const matVidrio = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.86 });
const G = {
  esf: new THREE.SphereGeometry(1, 12, 9), esf2: new THREE.SphereGeometry(1, 8, 6), ico: new THREE.IcosahedronGeometry(1, 0), ico1: new THREE.IcosahedronGeometry(1, 1),
  caja: new THREE.BoxGeometry(1, 1, 1), cil: new THREE.CylinderGeometry(1, 1, 1, 10), cil6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cono: new THREE.ConeGeometry(1, 1, 8), cono4: new THREE.ConeGeometry(1, 1, 4)
};
const S = { suave: true };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _y = V(0, 1, 0);
// matriz para estirar un cilindro/cono unitario entre dos puntos
function entre(a, b, r) {
  const d = new THREE.Vector3().subVectors(b, a), l = d.length();
  return new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(_y, d.normalize()), new THREE.Vector3(r, l, r));
}
const torno = (pts, seg = 10) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// ---------- Canoa ----------
export function crearBarca() {
  const g = new THREE.Group(), L = new Lote();
  casco(L, null, { punta: 0.2 });
  // bancos
  for (const [z, w] of [[0.55, 1.68], [-1.05, 1.46]]) {
    L.add(G.caja, 0x7a4e26, M4(0, 0.44, z, 0, 0, 0, w, 0.06, 0.36), null, { var: 0.1 });
    L.add(G.caja, 0x5e3d1e, M4(0, 0.39, z, 0, 0, 0, w * 0.97, 0.05, 0.1));
  }
  // roda de proa con franjas y popa
  const proa = M4(0, 0.5, -2.5, -0.3, 0, 0);
  L.add(G.caja, 0x5e3d1e, M4(0, 0, 0, 0, 0, 0, 0.1, 0.5, 0.15), proa, { var: 0.08 });
  [[0.17, 0xf7c948], [0.115, 0x2b5fa8], [0.06, 0xd23c3c]].forEach(([y, c]) => L.add(G.caja, c, M4(0, y, 0, 0, 0, 0, 0.115, 0.05, 0.165), proa));
  L.add(G.ico, 0x5e3d1e, M4(0, 0.27, 0, 0, 0.6, 0, 0.075), proa);
  L.add(G.caja, 0x5e3d1e, M4(0, 0.5, 2.5, 0.25, 0, 0, 0.1, 0.5, 0.14), null, { var: 0.08 });
  // cuerda enrollada y balde en la proa
  const cuerda = new THREE.TorusGeometry(0.19, 0.04, 5, 12); cuerda.rotateX(Math.PI / 2);
  L.add(cuerda, 0xd9c79a, M4(0.3, 0.2, -1.62), null, { var: 0.15 }); L.add(cuerda, 0xcdb98a, M4(0.31, 0.27, -1.61, 0, 0.5, 0, 0.85), null, { var: 0.15 });
  L.add(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 10, 1, true), 0x3a7ca5, M4(-0.32, 0.3, -1.6), null, { g: [0.7, 1.05] });
  L.add(new THREE.TorusGeometry(0.16, 0.012, 4, 10, Math.PI), 0x8a8a8a, M4(-0.32, 0.42, -1.6));
  const m = L.malla(matVC2); g.add(m);
  // farol de proa
  const farol = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd98a })); farol.position.set(0, 0.8, -2.62); farol.scale.setScalar(0.8); g.add(farol);
  // canasto tejido (atrás)
  const canasto = new THREE.Group(); canasto.position.set(0, 0.37, 1.38); canasto.scale.setScalar(0.78);
  const LC = new Lote();
  for (let i = 0; i < 5; i++) LC.add(new THREE.CylinderGeometry(0.46 + i * 0.025, 0.44 + i * 0.025, 0.1, 12, 1, true), i % 2 ? 0xc98f4a : 0xa9743a, M4(0, -0.2 + i * 0.1, 0, 0, i * 0.26, 0), null, { var: 0.14 });
  LC.add(new THREE.TorusGeometry(0.57, 0.035, 5, 14), 0x8a5a2e, M4(0, 0.27, 0, Math.PI / 2, 0, 0));
  LC.add(new THREE.CircleGeometry(0.44, 12), 0x6b4a24, M4(0, -0.24, 0, -Math.PI / 2, 0, 0));
  canasto.add(LC.malla(matVC2)); g.add(canasto);
  // remo
  const remo = new THREE.Group(); remo.position.set(-0.92, 0.7, 0.3);
  const LR = new Lote();
  LR.add(G.cil6, 0x7a5630, M4(0, 0, 0, 0, 0, 0, 0.028, 2.0, 0.028));
  LR.add(G.esf2, 0x9a6a3a, M4(0, -1.22, 0, 0, 0, 0, 0.15, 0.3, 0.025), null, { g: [0.85, 1.05] });
  LR.add(G.esf2, 0xd23c3c, M4(0, -1.42, 0, 0, 0, 0, 0.1, 0.1, 0.027));
  LR.add(G.esf2, 0x5e3d1e, M4(0, 1.0, 0, 0, 0, 0, 0.05));
  remo.add(LR.malla(matVC)); remo.rotation.z = 0.7; g.add(remo);
  g.userData = { remo, canasto };
  return g;
}

// ---------- Residuos ----------
const tilt = (rz, rx = 0, s = 1.2) => M4(0, 0, 0, rx, 0, rz, s);
const modelos = {
  botella(L) {
    const T = tilt(Math.PI / 2.4);
    L.add(torno([[0, -0.3], [0.15, -0.3], [0.17, -0.25], [0.17, 0.1], [0.08, 0.24], [0.06, 0.3], [0.06, 0.36]]), 0x7fd0f2, null, T, { ...S, g: [0.85, 1.1] });
    L.add(new THREE.CylinderGeometry(0.175, 0.175, 0.18, 10, 1, true), (x, y) => (y > -0.02 ? 0xe04b3a : 0xf6f6f6), M4(0, -0.08, 0), T, S);
    L.add(G.cil, 0x2a6fdb, M4(0, 0.385, 0, 0, 0, 0, 0.068, 0.06, 0.068), T);
  },
  frascoVidrio(L) {
    const T = tilt(Math.PI / 2.2);
    L.add(torno([[0, -0.25], [0.2, -0.25], [0.22, -0.2], [0.22, 0.12], [0.15, 0.2], [0.15, 0.26]]), 0x4aa866, null, T, { ...S, g: [0.8, 1.1] });
    L.add(G.cil, 0xc9c9c9, M4(0, 0.29, 0, 0, 0, 0, 0.165, 0.07, 0.165), T); L.add(G.cil, 0xf2ead0, M4(0, -0.05, 0, 0, 0, 0, 0.224, 0.16, 0.224), T, S);
  },
  bolsa(L) {
    const T = tilt(0);
    L.add(G.ico1, 0xf1f1f1, M4(0, 0.05, 0, 0, 0, 0, 0.44, 0.19, 0.34), T, { jit: 0.09, var: 0.14, g: [0.82, 1.05] });
    for (const x of [-0.12, 0.12]) L.add(new THREE.TorusGeometry(0.1, 0.022, 4, 8, Math.PI), 0xe4e4e4, M4(x, 0.2, 0, 0, Math.PI / 2, 0), T);
  },
  vaso(L) {
    const T = tilt(0.45);
    L.add(new THREE.CylinderGeometry(0.17, 0.12, 0.34, 10, 1, true), (x, y) => (Math.abs(y) < 0.05 ? 0xe04b3a : 0xffffff), null, T, { ...S, g: [0.86, 1.05] });
    L.add(new THREE.CircleGeometry(0.12, 10), 0xe9e9e9, M4(0, -0.17, 0, Math.PI / 2, 0, 0), T);
    L.add(G.cil6, 0x3fb56a, M4(0.05, 0.12, 0, 0, 0, -0.25, 0.014, 0.42, 0.014), T);
  },
  tapa(L) {
    const T = tilt(0.5, 0.3);
    L.add(new THREE.CylinderGeometry(0.14, 0.14, 0.055, 14), 0xe04b3a, null, T, { var: 0.12 });
    L.add(G.cil, 0xf27a6a, M4(0, 0.03, 0, 0, 0, 0, 0.1, 0.01, 0.1), T);
  },
  lata(L) {
    const T = tilt(1.2);
    L.add(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 12), (x, y) => (Math.abs(y) < 0.09 ? 0xd8392f : 0xc4cad4), null, T, { ...S, g: [0.85, 1.08] });
    L.add(G.cil, 0x9aa0aa, M4(0, 0.153, 0, 0, 0, 0, 0.115, 0.012, 0.115), T); L.add(G.caja, 0x6f757f, M4(0.03, 0.163, 0, 0, 0, 0, 0.07, 0.008, 0.035), T);
  },
  cajaCarton(L) {
    const T = tilt(0.12, 0.08);
    L.add(G.caja, 0xc9955a, M4(0, 0, 0, 0, 0.5, 0, 0.5, 0.3, 0.4), T, { var: 0.08, g: [0.78, 1.05] });
    L.add(G.caja, 0x7a5a34, M4(0, 0.146, 0, 0, 0.5, 0, 0.46, 0.012, 0.36), T);
    const R = M4(0, 0, 0, 0, 0.5, 0);
    L.add(G.caja, 0xd3a064, M4(0, 0.2, 0.26, 0.9, 0, 0, 0.5, 0.02, 0.2).premultiply(R), T); L.add(G.caja, 0xbd8a50, M4(0, 0.2, -0.26, -0.9, 0, 0, 0.5, 0.02, 0.2).premultiply(R), T);
    L.add(G.caja, 0xe8d9b0, M4(0.251, 0, 0, 0, 0, 0, 0.006, 0.3, 0.07).premultiply(R), T);
  },
  periodico(L) {
    const T = tilt(0.1, 0.2);
    L.add(G.caja, 0xe9e4d2, M4(0, 0, 0, 0, 0.6, 0, 0.55, 0.035, 0.4), T, { g: [0.85, 1.02] });
    L.add(G.caja, 0xddd6c0, M4(0.03, -0.03, 0.02, 0, 0.45, 0, 0.55, 0.03, 0.4), T);
    const R = M4(0, 0.019, 0, 0, 0.6, 0);
    L.add(G.caja, 0x3a3a3a, M4(-0.08, 0, -0.13, 0, 0, 0, 0.32, 0.004, 0.05).premultiply(R), T);
    for (let i = 0; i < 4; i++) L.add(G.caja, 0x8f8f88, M4(0, 0, -0.05 + i * 0.055, 0, 0, 0, 0.46, 0.004, 0.02).premultiply(R), T);
  },
  comida(L) { // corazón de manzana y hueso
    const T = tilt(1.1, 0.2);
    for (const y of [-0.14, 0.14]) L.add(G.esf2, 0xc8402e, M4(0, y, 0, 0, 0, 0, 0.14, 0.07, 0.14), T, { ...S, g: [0.8, 1.08] });
    L.add(G.cil6, 0xf3e6b8, M4(0, 0, 0, 0, 0, 0, 0.06, 0.26, 0.06), T, { jit: 0.06 }); L.add(G.cil6, 0x5b4a28, M4(0.01, 0.23, 0, 0, 0, 0.3, 0.012, 0.1, 0.012), T);
    L.add(G.cil6, 0xefe8d8, M4(0.3, -0.05, 0.12, 0, 0.4, Math.PI / 2, 0.025, 0.3, 0.025), null); for (const x of [0.15, 0.45]) L.add(G.esf2, 0xefe8d8, M4(x * 1.0 - 0.0, -0.05, 0.12 - (x - 0.3) * 0.42, 0, 0, 0, 0.05), null, S);
  },
  cascara(L) {
    for (let i = 0; i < 4; i++) L.add(G.cono4, 0xf5d033, M4(0.17, 0.03, 0, 0, 0, -1.25, 0.075, 0.42, 0.018), M4(0, 0.06, 0, 0, i * Math.PI / 2 + 0.3, 0, 1.2), { g: [1.05, 0.8] });
    L.add(G.cil6, 0x6b5a2a, M4(0, 0.13, 0, 0, 0, 0, 0.035, 0.1, 0.035)); L.add(G.esf2, 0xe8c12a, M4(0, 0.07, 0, 0, 0, 0, 0.08, 0.05, 0.08), null, S);
  },
  ramas(L) {
    const pts = [[V(-0.5, 0.02, 0), V(0.5, 0.1, 0.1)], [V(0, 0.06, 0.05), V(0.3, 0.14, -0.35)], [V(-0.15, 0.04, 0.02), V(-0.4, 0.12, 0.3)]];
    for (const [a, b] of pts) L.add(G.cil6, 0x5b4a28, entre(a, b, 0.035), null, { var: 0.2 });
    [[0.5, 0.12, 0.1, 0.4], [0.3, 0.16, -0.36, 1.2], [-0.4, 0.14, 0.3, 2.2], [0.1, 0.1, 0.12, 3]].forEach(([x, y, z, r], i) => L.add(G.ico, i % 2 ? 0x9a8a3a : 0x7a8a3a, M4(x, y, z, 0.3, r, 0, 0.13, 0.02, 0.07)));
  },
  llanta(L) {
    const T = tilt(0, Math.PI / 2.15);
    L.add(new THREE.TorusGeometry(0.4, 0.17, 7, 18), 0x2b2b2e, null, T, { var: 0.25, g: [0.8, 1.15] });
    L.add(new THREE.TorusGeometry(0.25, 0.03, 4, 18), 0x5a5a60, M4(0, 0, 0.05), T);
  },
  pila(L) {
    const T = tilt(Math.PI / 2.5);
    L.add(new THREE.CylinderGeometry(0.085, 0.085, 0.26, 10), (x, y) => (y > 0.04 ? 0xd4a437 : 0x26262a), null, T, S);
    L.add(G.cil, 0xc9c9c9, M4(0, 0.145, 0, 0, 0, 0, 0.03, 0.03, 0.03), T);
  },
  bombillo(L) {
    const T = tilt(0.9);
    L.add(G.esf, 0xfff6c8, M4(0, 0.06, 0, 0, 0, 0, 0.16), T, { ...S, g: [0.85, 1.1] });
    L.add(new THREE.CylinderGeometry(0.1, 0.07, 0.12, 8, 1, true), 0xfff6c8, M4(0, -0.11, 0), T, S);
    L.add(G.cil, 0x8a8a8a, M4(0, -0.21, 0, 0, 0, 0, 0.07, 0.1, 0.07), T, { g: [0.7, 1.1] }); L.add(G.cil, 0x55555a, M4(0, -0.27, 0, 0, 0, 0, 0.035, 0.03, 0.035), T);
  },
  celular(L) {
    const T = tilt(0.2, -1.2);
    L.add(G.caja, 0x22262e, M4(0, 0, 0, 0, 0, 0, 0.2, 0.36, 0.035), T);
    L.add(G.caja, 0x4a6a8a, M4(0, 0, 0.019, 0, 0, 0, 0.17, 0.3, 0.004), T, { g: [0.8, 1.2] }); L.add(G.caja, 0xbcd2e6, M4(0.01, 0.02, 0.022, 0, 0, 0.7, 0.012, 0.26, 0.002), T);
  }
};
const TRANSPARENTE = { botella: 1, frascoVidrio: 1 };
const cacheGeo = {};
function modelo(k) {
  if (!cacheGeo[k]) { const L = new Lote(); modelos[k](L); cacheGeo[k] = L.geometria(); }
  return new THREE.Mesh(cacheGeo[k], TRANSPARENTE[k] ? matVidrio : matVC2);
}
// catálogo: peso = qué tan frecuente es; cada tipo cae en una canasta
export const CATALOGO = [
  { tipo: 'plastico', nombre: 'Botella plástica', icono: '🧴', geo: 'botella', peso: 5 },
  { tipo: 'plastico', nombre: 'Bolsa de plástico', icono: '🛍️', geo: 'bolsa', peso: 4 },
  { tipo: 'plastico', nombre: 'Vaso desechable', icono: '🥤', geo: 'vaso', peso: 3 },
  { tipo: 'plastico', nombre: 'Tapa de gaseosa', icono: '🔴', geo: 'tapa', peso: 2 },
  { tipo: 'metal', nombre: 'Lata de bebida', icono: '🥫', geo: 'lata', peso: 4 },
  { tipo: 'vidrio', nombre: 'Frasco de vidrio', icono: '🫙', geo: 'frascoVidrio', peso: 3 },
  { tipo: 'carton', nombre: 'Caja de cartón', icono: '📦', geo: 'cajaCarton', peso: 3 },
  { tipo: 'carton', nombre: 'Periódico mojado', icono: '📰', geo: 'periodico', peso: 2 },
  { tipo: 'organico', nombre: 'Restos de comida', icono: '🍗', geo: 'comida', peso: 3 },
  { tipo: 'organico', nombre: 'Cáscara de fruta', icono: '🍌', geo: 'cascara', peso: 3 },
  { tipo: 'organico', nombre: 'Ramas y hojas secas', icono: '🍂', geo: 'ramas', peso: 2 },
  { tipo: 'llanta', nombre: 'Llanta vieja', icono: '🛞', geo: 'llanta', peso: 1 },
  { tipo: 'pila', nombre: 'Pila usada', icono: '🔋', geo: 'pila', peso: 2 },
  { tipo: 'bombillo', nombre: 'Bombillo fundido', icono: '💡', geo: 'bombillo', peso: 1 },
  { tipo: 'electronico', nombre: 'Celular viejo', icono: '📱', geo: 'celular', peso: 1 }
];
export const ICONO = Object.fromEntries(CATALOGO.map((c) => [c.tipo, c.icono]));
export const CAJA = { plastico: 'aprov', metal: 'aprov', vidrio: 'aprov', carton: 'aprov', organico: 'org', llanta: 'esp', pila: 'esp', bombillo: 'esp', electronico: 'esp' };

// selecciona un objeto del catálogo con pesos, evitando repetir el anterior
function elegir(r, prev) {
  const total = CATALOGO.reduce((a, c) => a + c.peso, 0);
  let x = r * total;
  for (const c of CATALOGO) { x -= c.peso; if (x <= 0) return c.nombre === prev ? CATALOGO[(CATALOGO.indexOf(c) + 3) % CATALOGO.length] : c; }
  return CATALOGO[0];
}

export function crearBasura(escena, tramo, n, desde, hasta, semilla) {
  const lista = []; let prev = null;
  for (let i = 0; i < n; i++) {
    const c = elegir(rnd(semilla + i * 7.3), prev); prev = c.nombre;
    const s = desde + (hasta - desde) * ((i + 0.5 + (rnd(semilla + i * 9.1) - .5) * .5) / n);
    const m = marco(s), hw = anchoRio(s) / 2;
    const lat = (rnd(semilla + i * 5.5) - .5) * (hw * 1.5);
    const g = modelo(c.geo); g.position.set(m.x + m.nx * lat, 0.05, m.z + m.nz * lat); g.rotation.y = rnd(semilla + i * 3.3) * 6.28;
    g.userData = { tipo: c.tipo, nombre: c.nombre, icono: c.icono, s, tramo, recogida: false, f: rnd(i + semilla) * 6, y0: 0.05 };
    escena.add(g); lista.push(g);
  }
  return lista;
}

// ---------- Vertimiento ----------
let _tm = null;
function texMancha() {
  if (_tm) return _tm;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (_tm = new THREE.CanvasTexture(c));
}
export function crearTuberia(escena, s, lado) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw + 0.5); p.y = Math.max(1.3, p.y + 0.2);
  const g = new THREE.Group(); g.position.copy(p);
  const m = marco(s); g.rotation.y = Math.atan2(m.nx * lado, m.nz * lado);
  const L = new Lote();
  // cabezal de concreto con manchas
  L.add(G.caja, (x, y) => (y < -0.5 ? 0x6d6a5c : 0xa9a79f), M4(0, -0.15, 0.45, 0, 0, 0, 2.5, 2.1, 0.6), null, { var: 0.12, g: [0.75, 1.05] });
  L.add(G.caja, 0xbab8b0, M4(0, 0.98, 0.42, 0, 0, 0, 2.75, 0.2, 0.75), null, { var: 0.08 });
  for (const x of [-1.32, 1.32]) L.add(G.caja, 0x9a988f, M4(x, -0.3, 0.1, 0, 0, 0, 0.22, 1.8, 0.9), null, { var: 0.1, g: [0.7, 1.05] });
  // tubo con óxido
  const tubo = new THREE.CylinderGeometry(0.55, 0.55, 1.9, 14, 3, true); tubo.rotateX(Math.PI / 2);
  L.add(tubo, (x, y, z) => (y < -0.3 ? 0x6a4a34 : 0x7b7b80), M4(0, 0, -0.45), null, { ...S, var: 0.16 });
  const aro = new THREE.TorusGeometry(0.58, 0.1, 6, 14);
  L.add(aro, 0x55555a, M4(0, 0, -1.38), null, { var: 0.1 }); L.add(aro, 0x66666b, M4(0, 0, -0.2, 0, 0, 0, 1, 1, 0.7));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; L.add(G.cil6, 0x3c3c40, M4(Math.cos(a) * 0.62, Math.sin(a) * 0.62, -1.45, Math.PI / 2, 0, 0, 0.05, 0.06, 0.05)); }
  L.add(new THREE.CircleGeometry(0.54, 14), 0x14100c, M4(0, 0, -0.5, 0, Math.PI, 0));
  g.add(L.malla(matVC2));
  // chorro con vetas que bajan
  const H = p.y, pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push(V(0, -0.28 - u * u * (H - 0.28), -1.3 - u * 1.35)); }
  const chorro = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.33, 8), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 } }, transparent: true,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT; varying vec2 vUv; void main(){ float r=sin(vUv.y*18.+sin(vUv.x*9.-uT*7.)*1.4)*.5+.5; float v=sin(vUv.x*26.-uT*11.)*.5+.5;
      vec3 c=mix(vec3(.26,.16,.07),vec3(.45,.31,.14),r*.6+v*.4); gl_FragColor=vec4(c,.93); }`
  }));
  g.add(chorro);
  const gotas = [];
  for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(G.esf2, new THREE.MeshBasicMaterial({ color: 0x4a2e12 })); d.scale.setScalar(0.16); d.userData.t = i / 8; g.add(d); gotas.push(d); }
  // mancha en el agua
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(2.1, 20), new THREE.MeshBasicMaterial({ color: 0x3a2610, map: texMancha(), transparent: true, opacity: 0.8, depthWrite: false }));
  mancha.rotation.x = -Math.PI / 2; mancha.position.set(0, -H + 0.035, -2.9); mancha.scale.set(1, 1.5, 1); g.add(mancha);
  // tapa con volante (aparece al sellar)
  const LT = new Lote(); const disco = new THREE.CylinderGeometry(0.66, 0.66, 0.14, 14); disco.rotateX(Math.PI / 2);
  LT.add(disco, 0x2e9e6b, null, null, { g: [0.8, 1.1] });
  LT.add(new THREE.TorusGeometry(0.32, 0.05, 5, 14), 0xf2c14e, M4(0, 0, -0.16));
  for (const r of [0, Math.PI / 2]) LT.add(G.caja, 0xf2c14e, M4(0, 0, -0.16, 0, 0, r, 0.62, 0.06, 0.05));
  LT.add(G.cil6, 0xd9a92e, M4(0, 0, -0.12, Math.PI / 2, 0, 0, 0.07, 0.12, 0.07));
  const tapa = LT.malla(matVC); tapa.position.z = -1.5; tapa.scale.setScalar(0.001); tapa.visible = false; g.add(tapa);
  g.userData = { tipo: 'tuberia', s, sellada: false, g1: chorro, gotas, prog: 0, tapa, mancha, H, t: 0 };
  escena.add(g); return g;
}
export function animarTuberia(tb, dt) {
  const u = tb.userData; u.t += dt; u.g1.material.uniforms.uT.value = u.t;
  if (u.sellada) {
    u.g1.scale.y = Math.max(0.001, u.g1.scale.y - dt * 3); u.g1.visible = u.g1.scale.y > 0.01; u.gotas.forEach((d) => d.visible = false);
    u.tapa.visible = true; const k = Math.min(1, u.tapa.scale.x + dt * 3.5); u.tapa.scale.setScalar(k); u.tapa.rotation.z = (1 - k) * 4;
    u.mancha.material.opacity = Math.max(0, u.mancha.material.opacity - dt * 0.35); u.mancha.visible = u.mancha.material.opacity > 0.01;
    return;
  }
  for (const d of u.gotas) { d.userData.t = (d.userData.t + dt * 0.9) % 1; const k = d.userData.t; d.position.set(Math.sin(k * 40) * 0.25, -0.3 - k * k * (u.H - 0.3), -1.4 - k * 1.5); }
  const e = 1 + Math.sin(u.t * 1.7) * 0.06; u.mancha.scale.set(e, 1.5 * e, 1);
}

// ---------- Aves y animales ----------
const OJO = 0x15151a;
export function crearGarza() {
  const L = new Lote(), blanco = 0xf7f7f2, pata = 0x33332e;
  for (const x of [-0.1, 0.1]) {
    L.add(G.cil6, pata, entre(V(x, 0.62, 0.05), V(x, 0.32, 0.13), 0.024)); L.add(G.cil6, pata, entre(V(x, 0.32, 0.13), V(x, 0, 0.04), 0.02));
    L.add(G.esf2, pata, M4(x, 0.32, 0.13, 0, 0, 0, 0.032));
    for (const a of [-0.5, 0, 0.5]) L.add(G.cil6, 0x8a8a3a, entre(V(x, 0.01, 0.04), V(x + Math.sin(a) * 0.13, 0.01, 0.04 - Math.cos(a) * 0.13), 0.012));
  }
  L.add(G.esf, blanco, M4(0, 0.82, 0.08, -0.28, 0, 0, 0.3, 0.3, 0.56), null, { ...S, g: [0.78, 1.06] });
  for (const x of [-1, 1]) L.add(G.esf, 0xe9e9e2, M4(x * 0.27, 0.86, 0.2, -0.3, x * 0.08, 0, 0.07, 0.2, 0.5), null, { ...S, g: [0.8, 1.04] });
  L.add(G.cono, 0xeeeee8, M4(0, 0.72, 0.72, 1.85, 0, 0, 0.13, 0.5, 0.05), null, { g: [0.85, 1.05] });
  const cuello = new THREE.CatmullRomCurve3([V(0, 0.95, -0.36), V(0, 1.22, -0.42), V(0, 1.42, -0.3), V(0, 1.66, -0.38), V(0, 1.86, -0.56)]);
  L.add(new THREE.TubeGeometry(cuello, 12, 0.062, 7), blanco, null, null, { ...S, g: [0.85, 1.06] });
  L.add(G.esf, blanco, M4(0, 1.87, -0.62, 0.15, 0, 0, 0.09, 0.09, 0.14), null, S);
  L.add(G.cono, 0xf2b632, M4(0, 1.85, -0.93, -Math.PI / 2 - 0.08, 0, 0, 0.04, 0.42, 0.04), null, { g: [1.05, 0.85] });
  for (const x of [-0.07, 0.07]) L.add(G.esf2, OJO, M4(x, 1.9, -0.68, 0, 0, 0, 0.02));
  L.add(G.cono4, blanco, M4(0, 1.9, -0.42, 1.9, 0, 0, 0.02, 0.26, 0.012));
  return L.malla(matVC);
}
export function crearTingua() {
  const L = new Lote(), pata = 0xe06a3a;
  for (const x of [-0.09, 0.09]) {
    L.add(G.cil6, pata, entre(V(x, 0.36, 0.05), V(x, 0.2, 0.1), 0.02)); L.add(G.cil6, pata, entre(V(x, 0.2, 0.1), V(x, 0, 0.03), 0.017));
    for (const a of [-0.55, 0, 0.55]) L.add(G.cil6, pata, entre(V(x, 0.01, 0.03), V(x + Math.sin(a) * 0.15, 0.01, 0.03 - Math.cos(a) * 0.15), 0.011));
  }
  // dorso pardo con estrías, flancos barrados, pecho gris
  const cuerpo = (x, y, z) => (y > 0.5 ? (Math.sin(x * 60 + z * 22) > 0.2 ? 0x4a3d2a : 0x8a744c) : z > 0.1 && y < 0.42 ? (Math.sin(z * 55) > 0 ? 0x2e2e2e : 0xe8e4da) : 0x8d8e8c);
  L.add(G.esf, cuerpo, M4(0, 0.5, 0.05, -0.12, 0, 0, 0.22, 0.2, 0.36), null, { ...S, g: [0.82, 1.05] });
  L.add(G.cono4, 0x4a3d2a, M4(0, 0.62, 0.42, 2.3, 0, 0, 0.09, 0.22, 0.04));
  L.add(G.cil, 0x8d8e8c, entre(V(0, 0.56, -0.2), V(0, 0.72, -0.3), 0.085), null, S);
  L.add(G.esf, (x, y) => (y > 0.8 ? 0x4a4038 : 0x85888a), M4(0, 0.76, -0.33, 0, 0, 0, 0.1, 0.095, 0.115), null, S);
  L.add(G.cono, 0xe2552a, M4(0, 0.735, -0.6, -Math.PI / 2 + 0.16, 0, 0, 0.032, 0.36, 0.032), null, { g: [1.1, 0.75] });
  for (const x of [-0.075, 0.075]) L.add(G.esf2, 0x8a2a1a, M4(x, 0.78, -0.38, 0, 0, 0, 0.02));
  return L.malla(matVC);
}
export function crearPato() {
  const L = new Lote();
  L.add(G.esf, (x, y, z) => (y > 0.33 ? 0x7a3a1c : y < 0.1 ? 0xb9a58c : 0xa4502a), M4(0, 0.2, 0.02, 0, 0, 0, 0.4, 0.27, 0.56), null, { ...S, g: [0.8, 1.06], var: 0.08 });
  L.add(G.esf, 0x8a4222, M4(0, 0.34, -0.28, 0, 0, 0, 0.17, 0.16, 0.16), null, S);
  L.add(G.esf, (x, y, z) => (y > 0.6 || z > -0.34 ? 0x1c1c22 : 0xf6f6f2), M4(0, 0.57, -0.42, 0, 0, 0, 0.2, 0.19, 0.21), null, S);
  L.add(G.esf, 0x5aa6e8, M4(0, 0.5, -0.69, 0.12, 0, 0, 0.1, 0.045, 0.17), null, { ...S, g: [0.85, 1.1] });
  L.add(G.esf2, 0x3f86c8, M4(0, 0.5, -0.83, 0, 0, 0, 0.085, 0.03, 0.05), null, S);
  for (const x of [-0.14, 0.14]) L.add(G.esf2, OJO, M4(x, 0.62, -0.52, 0, 0, 0, 0.025));
  for (let i = -2; i <= 2; i++) L.add(G.cono4, 0x3a2a1c, M4(i * 0.05, 0.47, 0.58, 0.55, 0, -i * 0.16, 0.035, 0.42, 0.012), null, { g: [1.1, 0.8] });
  for (const x of [-1, 1]) L.add(G.esf2, 0x8a4222, M4(x * 0.33, 0.27, 0.1, 0, x * 0.1, 0, 0.07, 0.15, 0.36), null, S);
  return L.malla(matVC);
}
export function crearPez() {
  const L = new Lote();
  L.add(G.esf, (x, y) => (y > 0.022 ? 0x7f927f : y > -0.012 ? 0x34474e : 0xf2f6f8), M4(0, 0, 0, 0, 0, 0, 0.062, 0.075, 0.23), null, { ...S, g: [0.9, 1.1] });
  const cola = [[0, 0, 0.2], [0, 0.1, 0.36], [0, 0, 0.3], [0, -0.1, 0.36]];
  L.quad(cola[0], cola[1], cola[2], cola[3], 0xb9c8cc); L.quad(cola[0], cola[3], cola[2], cola[1], 0xb9c8cc);
  L.tri([0, 0.07, -0.04], [0, 0.13, 0.08], [0, 0.065, 0.1], 0x8fa39a); L.tri([0, 0.07, -0.04], [0, 0.065, 0.1], [0, 0.13, 0.08], 0x8fa39a);
  for (const x of [-0.045, 0.045]) L.add(G.esf2, OJO, M4(x, 0.02, -0.16, 0, 0, 0, 0.014));
  return L.malla(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x223344 }));
}

export function crearBandada(escena, n = 14) {
  const aves = [];
  const ala = new THREE.BufferGeometry();
  ala.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -.12, 1, 0, -.3, .25, 0, .4, 0, 0, -.12, .25, 0, .4, 0, 0, .25], 3)); ala.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2b3a3a, side: THREE.DoubleSide });
  const cuerpo = new THREE.OctahedronGeometry(1); cuerpo.scale(0.09, 0.07, 0.42);
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const a1 = new THREE.Mesh(ala, mat), a2 = new THREE.Mesh(ala, mat); a2.scale.x = -1; g.add(a1, a2, new THREE.Mesh(cuerpo, mat));
    g.userData = { a1, a2, r: 18 + rnd(i) * 30, fase: rnd(i + 5) * 6.28, v: .25 + rnd(i + 9) * .2, h: 14 + rnd(i + 3) * 14 };
    g.scale.setScalar(.9 + rnd(i * 2) * .7); escena.add(g); aves.push(g);
  }
  return aves;
}
export function animarBandada(aves, t, centro, visibles) {
  aves.forEach((g, i) => {
    const u = g.userData; const a = t * u.v + u.fase;
    g.position.set(centro.x + Math.cos(a) * u.r, u.h + Math.sin(t * 1.3 + i) * 1.2, centro.z - 25 + Math.sin(a) * u.r);
    g.rotation.y = -a + Math.PI; const f = Math.sin(t * 7 + i * 1.7) * .55; u.a1.rotation.z = f; u.a2.rotation.z = -f;
    g.visible = i < visibles;
  });
}

export function crearLuciernagas(escena, n = 70) {
  const pos = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,240,150,1)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const m = new THREE.PointsMaterial({ size: .38, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; escena.add(pts);
  pts.userData = { n, base: Array.from({ length: n }, (_, i) => [rnd(i) * 2 - 1, rnd(i + 70), rnd(i + 140) * 2 - 1, rnd(i + 3) * 6]) };
  return pts;
}
export function animarLuciernagas(p, t, centro, clean) {
  const a = p.geometry.attributes.position.array, b = p.userData.base;
  for (let i = 0; i < p.userData.n; i++) {
    const q = b[i];
    a[i * 3] = centro.x + q[0] * 22 + Math.sin(t * .6 + q[3]) * 1.5;
    a[i * 3 + 1] = .5 + q[1] * 5 + Math.sin(t * .9 + q[3]) * .6;
    a[i * 3 + 2] = centro.z + q[2] * 22 + Math.cos(t * .5 + q[3]) * 1.5;
  }
  p.geometry.attributes.position.needsUpdate = true;
  p.material.opacity = Math.max(0, (clean - .3) * 1.4) * (.6 + .4 * Math.sin(t * 2));
}

// ---------- Muelle y abuelo ----------
export function crearMuelle(escena, s) {
  const m = marco(s), g = new THREE.Group();
  g.position.set(m.x, 0, m.z); g.rotation.y = Math.atan2(-m.tx, -m.tz);
  const L = new Lote(), X = -3.6;
  for (let i = 0; i < 8; i++) L.add(G.caja, i % 2 ? 0x94643a : 0x80552c, M4(X + (rnd(i) - 0.5) * 0.08, 0.46, 1.95 - i * 0.44, 0, (rnd(i * 3) - 0.5) * 0.05, 0, 2.7, 0.1, 0.4), null, { var: 0.12 });
  for (const x of [-1.2, 1.2]) L.add(G.caja, 0x5e3d1e, M4(X + x, 0.36, 0.4, 0, 0, 0, 0.12, 0.12, 3.5));
  const postes = [[-1.25, 1.95], [1.25, 1.95], [-1.25, -1.1], [1.25, -1.1], [1.25, 0.45]];
  for (const [x, z] of postes) { L.add(G.cil6, 0x4e3318, M4(X + x, 0.35, z, 0, 0, 0, 0.1, 1.7, 0.1), null, { var: 0.15, g: [0.6, 1.05] }); L.add(G.cil6, 0x6b4a2a, M4(X + x, 1.22, z, 0, 0, 0, 0.125, 0.06, 0.125)); }
  // cuerda entre postes del lado del agua
  for (const [a, b] of [[1, 4], [4, 3]]) { const A = V(X + postes[a][0], 1.05, postes[a][1]), B = V(X + postes[b][0], 1.05, postes[b][1]), C = A.clone().lerp(B, 0.5); C.y -= 0.18; L.add(G.cil6, 0xd9c79a, entre(A, C, 0.022)); L.add(G.cil6, 0xd9c79a, entre(C, B, 0.022)); }
  // cajas, costal y poste con farol
  L.add(G.caja, 0xb5854c, M4(X - 0.85, 0.75, 1.5, 0, 0.3, 0, 0.5, 0.48, 0.5), null, { var: 0.1, g: [0.75, 1.05] }); L.add(G.caja, 0x9a6e3c, M4(X - 0.8, 1.13, 1.48, 0, -0.2, 0, 0.36, 0.3, 0.36), null, { var: 0.1 });
  L.add(G.ico1, 0xd8c8a0, M4(X - 0.9, 0.68, 0.75, 0, 0, 0, 0.3, 0.2, 0.24), null, { jit: 0.1, g: [0.75, 1.05] });
  L.add(G.cil6, 0x3a2a1a, M4(X - 1.25, 1.6, -1.1, 0, 0, 0, 0.05, 2.2, 0.05)); L.add(G.caja, 0x3a2a1a, M4(X - 1.02, 2.66, -1.1, 0, 0, 0, 0.5, 0.05, 0.05));
  L.add(G.caja, 0x2a2a2a, M4(X - 0.8, 2.48, -1.1, 0, 0, 0, 0.16, 0.05, 0.16)); L.add(G.cono4, 0x2a2a2a, M4(X - 0.8, 2.58, -1.1, 0, Math.PI / 4, 0, 0.14, 0.12, 0.14));
  g.add(L.malla(matVC));
  const luz = new THREE.Mesh(G.esf2, new THREE.MeshBasicMaterial({ color: 0xffd27a })); luz.scale.setScalar(0.09); luz.position.set(X - 0.8, 2.38, -1.1); g.add(luz);
  // abuelo con ruana y sombrero
  const A = new Lote();
  for (const x of [-0.11, 0.11]) { A.add(G.cil6, 0x3d3a36, M4(x, 0.42, 0, 0, 0, 0, 0.085, 0.7, 0.085), null, { g: [0.75, 1] }); A.add(G.caja, 0x2a2018, M4(x, 0.05, 0.04, 0, 0, 0, 0.14, 0.1, 0.26)); }
  const ruana = (x, y) => { const b = Math.floor(y * 14); return b % 5 === 0 ? 0xe8dcc0 : b % 5 === 2 ? 0x5a3a28 : 0x9a5f3c; };
  A.add(new THREE.CylinderGeometry(0.19, 0.5, 0.78, 12, 6), ruana, M4(0, 1.08, 0), null, { ...S, g: [0.8, 1.05] });
  A.add(G.cil6, 0x9a5f3c, entre(V(0.24, 1.36, 0), V(0.5, 1.62, 0.12), 0.07)); A.add(G.esf2, 0xd6a37a, M4(0.54, 1.68, 0.14, 0, 0, 0, 0.07), null, S);
  A.add(G.cil6, 0x9a5f3c, entre(V(-0.24, 1.36, 0), V(-0.4, 1.0, 0.12), 0.07)); A.add(G.esf2, 0xd6a37a, M4(-0.42, 0.95, 0.14, 0, 0, 0, 0.065), null, S);
  A.add(G.cil6, 0xd6a37a, M4(0, 1.5, 0, 0, 0, 0, 0.07, 0.1, 0.07));
  A.add(G.esf, 0xd6a37a, M4(0, 1.63, 0, 0, 0, 0, 0.16, 0.17, 0.16), null, { ...S, g: [0.88, 1.05] });
  A.add(G.caja, 0xf4f4f0, M4(0, 1.585, 0.15, 0, 0, 0, 0.17, 0.04, 0.05)); A.add(G.esf2, 0xc98f6a, M4(0, 1.63, 0.165, 0, 0, 0, 0.03));
  for (const x of [-0.06, 0.06]) { A.add(G.esf2, OJO, M4(x, 1.67, 0.145, 0, 0, 0, 0.018)); A.add(G.caja, 0xe9e9e4, M4(x, 1.705, 0.14, 0, 0, x * 3, 0.06, 0.015, 0.03)); }
  A.add(G.cil, 0xf2ead8, M4(0, 1.76, 0, 0.06, 0, 0, 0.36, 0.025, 0.36), null, { g: [0.85, 1.05] });
  A.add(new THREE.CylinderGeometry(0.15, 0.19, 0.2, 10), 0xf2ead8, M4(0, 1.87, 0)); A.add(G.cil, 0x222222, M4(0, 1.8, 0, 0, 0, 0, 0.195, 0.05, 0.195));
  const ab = A.malla(matVC); ab.position.set(X - 0.2, 0.5, 0.4); ab.rotation.y = Math.PI / 2 - 0.35; g.add(ab);
  const far = new THREE.Mesh(G.esf2, new THREE.MeshBasicMaterial({ color: 0xffd27a })); far.scale.setScalar(0.08); far.position.set(-0.42, 0.78, 0.14); ab.add(far);
  escena.add(g); return g;
}

// ---------- Salto del Tequendama (final) ----------
export function crearCascada(escena, s) {
  const m = marco(s), g = new THREE.Group(); g.position.set(m.x + m.tx * 6, 0, m.z + m.tz * 6); g.rotation.y = Math.atan2(-m.tx, -m.tz);
  const caida = new THREE.Mesh(new THREE.PlaneGeometry(anchoRio(s) + 1, 60, 1, 1), new THREE.ShaderMaterial({
    uniforms: uniformes, transparent: true, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uTiempo; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float r=vn(vec2(vUv.x*14., vUv.y*9.+uTiempo*3.)); vec3 c=mix(vec3(.72,.92,.97),vec3(1.),smoothstep(.3,.7,r)); gl_FragColor=vec4(c,.94); }`
  }));
  caida.position.set(0, -29.5, -2); g.add(caida);
  const niebla = [];
  for (let i = 0; i < 10; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(3 + i % 3, 9, 7), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, fog: false, depthWrite: false })); n.position.set((i - 5) * 1.2, -8 - i * 5, -4); n.userData.f = i; g.add(n); niebla.push(n); }
  g.userData = { niebla }; escena.add(g); return g;
}
