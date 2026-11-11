// Ambientación (v3): pueblos, vacas, cercas, ciudad, fábricas con humo, puentes, canoas, nubes, cascadas y letreros.
// Todo lo estático se fusiona en pocas mallas para que rinda en celular.
import * as THREE from 'three';
import { marco, puntoOrilla, anchoRio, alturaAcantilado, rocasAgua, rnd, uniformes } from './mundo.js';
import { Lote, M4, casco } from './geo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const G = {
  caja: new THREE.BoxGeometry(1, 1, 1),
  prisma: (() => { // largo en x, alto en y (de 0 a 1), ancho en z
    const v = [-.5, 0, -.5, -.5, 0, .5, -.5, 1, 0, .5, 0, -.5, .5, 0, .5, .5, 1, 0];
    const idx = [0, 1, 2, 3, 5, 4, 0, 2, 5, 0, 5, 3, 1, 4, 5, 1, 5, 2, 0, 3, 4, 0, 4, 1];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); return g; })(),
  cil: new THREE.CylinderGeometry(1, 1, 1, 8), cil4: new THREE.CylinderGeometry(1, 1, 1, 4), cil6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cono: new THREE.ConeGeometry(1, 1, 5), cono4: new THREE.ConeGeometry(1, 1, 4),
  esfera: new THREE.IcosahedronGeometry(1, 1), ico: new THREE.IcosahedronGeometry(1, 0), tetra: new THREE.TetrahedronGeometry(1)
};
const PAREDES = [0xf6efe2, 0xf8e7c4, 0xe9f1f2, 0xf4d9c4, 0xdfeacb], TEJAS = [0xc4513a, 0xd0633f, 0xb8452f, 0xd9744a];
const PUERTAS = [0x2f6f8a, 0x7a4a26, 0x2f7a4a, 0xa83a32], _x = V(1, 0, 0);
const AO = { g: [0.74, 1.05] };

// dirección hacia el río para un objeto en la orilla
const haciaRio = (s, lado) => { const m = marco(s); return Math.atan2(-m.nx * lado, -m.nz * lado); };
const enOrilla = (s, lado, e) => puntoOrilla(s, lado, anchoRio(s) / 2 + e);
// viga (caja) estirada entre dos puntos
function viga(L, a, b, w, h, hex, o) {
  const d = new THREE.Vector3().subVectors(b, a), l = d.length();
  L.add(G.caja, hex, new THREE.Matrix4().compose(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(_x, d.normalize()), new THREE.Vector3(l, h, w)), null, o);
}

function ventana(L, T, x, y, z, ry, w = 0.42, h = 0.4, i = 0, caja = true) {
  const R = M4(x, y, z, 0, ry, 0);
  const add = (hex, m, o) => L.add(G.caja, hex, R.clone().multiply(m), T, o);
  add(0xfdfaf2, M4(0, 0, 0, 0, 0, 0, w + 0.1, h + 0.1, 0.05));
  add(0x2f5a6e, M4(0, 0, 0.012, 0, 0, 0, w, h, 0.05), { g: [0.8, 1.25] });
  add(0xfdfaf2, M4(0, 0, 0.03, 0, 0, 0, 0.03, h, 0.03)); add(0xfdfaf2, M4(0, 0, 0.03, 0, 0, 0, w, 0.03, 0.03));
  for (const sg of [-1, 1]) add(PUERTAS[i % 4], M4(sg * (w / 2 + 0.1), 0, 0.02, 0, 0, 0, 0.13, h + 0.06, 0.03));
  if (caja) { add(0x7a4a26, M4(0, -h / 2 - 0.09, 0.08, 0, 0, 0, w + 0.12, 0.1, 0.14)); for (let k = 0; k < 4; k++) L.add(G.tetra, [0xe8403a, 0xffd34d, 0xff8fb3, 0xffffff][(k + i) % 4], R.clone().multiply(M4(-w / 2 + 0.06 + k * (w / 3), -h / 2 + 0.02, 0.1, k, k * 2, 0, 0.06)), T); }
}
function casa(L, p, ry, k = 1, i = 0, alta = false) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, k);
  const pared = PAREDES[i % 5], teja = TEJAS[(i * 3 + 1) % 4];
  const h = alta ? 2.5 : 1.55;
  L.add(G.caja, 0x9c9384, M4(0, 0.0, 0, 0, 0, 0, 2.4, 0.8, 2.0), T, { var: 0.14, g: [0.7, 1.05] });
  L.add(G.caja, pared, M4(0, 0.4 + h / 2, 0, 0, 0, 0, 2.05, h, 1.65), T, { g: [0.86, 1.04] });
  L.add(G.caja, 0xb9643a, M4(0, 0.52, 0, 0, 0, 0, 2.08, 0.26, 1.68), T); // zócalo pintado
  // techo con alero, cumbrera y vigas
  L.add(G.prisma, teja, M4(0, 0.4 + h, 0, 0, 0, 0, 2.7, 1.0, 2.3), T, { var: 0.1, g: [0.82, 1.08] });
  L.add(G.caja, 0x8a3324, M4(0, 0.4 + h + 1.0, 0, 0, 0, 0, 2.74, 0.08, 0.14), T);
  L.add(G.caja, 0x6b3f22, M4(0, 0.4 + h - 0.02, 0, 0, 0, 0, 2.5, 0.07, 2.1), T);
  // puerta con marco y escalón
  L.add(G.caja, 0xfdfaf2, M4(0.42, 0.4 + 0.47, 0.83, 0, 0, 0, 0.56, 0.98, 0.05), T);
  L.add(G.caja, PUERTAS[i % 4], M4(0.42, 0.4 + 0.44, 0.845, 0, 0, 0, 0.44, 0.88, 0.05), T, { g: [0.8, 1.1] });
  L.add(G.caja, 0xf2c14e, M4(0.57, 0.4 + 0.44, 0.88, 0, 0, 0, 0.04, 0.04, 0.03), T);
  L.add(G.caja, 0x8d877a, M4(0.42, 0.3, 1.1, 0, 0, 0, 0.75, 0.22, 0.3), T);
  ventana(L, T, -0.52, 0.4 + (alta ? 0.75 : 0.85), 0.83, 0, 0.42, 0.4, i);
  ventana(L, T, -1.03, 0.4 + 0.85, 0, -Math.PI / 2, 0.42, 0.4, i + 1, false);
  ventana(L, T, 1.03, 0.4 + 0.85, 0.1, Math.PI / 2, 0.42, 0.4, i + 1, false);
  // chimenea
  L.add(G.caja, 0x8d6e5a, M4(0.7, 0.4 + h + 0.75, -0.35, 0, 0, 0, 0.28, 0.9, 0.28), T, { var: 0.1 }); L.add(G.caja, 0x5a463a, M4(0.7, 0.4 + h + 1.22, -0.35, 0, 0, 0, 0.36, 0.07, 0.36), T);
  if (alta) {
    ventana(L, T, -0.52, 0.4 + 1.9, 0.83, 0, 0.4, 0.4, i + 2); ventana(L, T, 0.45, 0.4 + 1.9, 0.83, 0, 0.4, 0.4, i + 2, false);
    L.add(G.caja, 0x6b3f22, M4(0, 0.4 + 1.42, 1.0, 0, 0, 0, 2.15, 0.07, 0.36), T);
    for (let q = 0; q < 7; q++) L.add(G.caja, 0x6b3f22, M4(-1.0 + q * 0.333, 0.4 + 1.66, 1.15, 0, 0, 0, 0.05, 0.42, 0.05), T);
    L.add(G.caja, 0x7a4a26, M4(0, 0.4 + 1.88, 1.15, 0, 0, 0, 2.15, 0.06, 0.07), T);
    for (const x of [-1.0, 1.0]) L.add(G.caja, 0x6b3f22, M4(x, 0.4 + 0.7, 1.15, 0, 0, 0, 0.09, 1.4, 0.09), T);
  } else if (i % 2 === 0) { // corredor con postes
    L.add(G.caja, teja, M4(0, 0.4 + h - 0.12, 1.25, 0.22, 0, 0, 2.5, 0.06, 0.8), T, { var: 0.1 });
    for (const x of [-1.1, 1.1]) L.add(G.caja, 0x6b3f22, M4(x, 0.4 + (h - 0.25) / 2, 1.55, 0, 0, 0, 0.09, h - 0.25, 0.09), T);
  }
}
function vaca(L, p, ry, i) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 0.95), cafe = i % 3 === 1;
  const piel = (x, y, z) => (cafe ? (Math.sin(x * 5 + z * 3 + i) > 0.55 ? 0xf2ead8 : 0x9a5a34) : (Math.sin(x * 4.3 + i * 2) * Math.cos(z * 3.1 + y * 2 + i) > 0.12 ? 0x26262a : 0xf6f4ee));
  L.add(G.esfera, piel, M4(0, 0.82, 0, 0, 0, 0, 0.33, 0.32, 0.62), T, { suave: true, g: [0.78, 1.05] });
  L.add(G.caja, cafe ? 0x9a5a34 : 0xf6f4ee, M4(0, 0.86, -0.72, 0.35, 0, 0, 0.26, 0.3, 0.4), T, AO);
  L.add(G.caja, 0xe8b0a0, M4(0, 0.74, -0.93, 0.35, 0, 0, 0.2, 0.16, 0.12), T);
  for (const sg of [-1, 1]) { L.add(G.cono4, 0xe9e2cc, M4(sg * 0.12, 1.07, -0.62, 0, 0, -sg * 0.5, 0.03, 0.14, 0.03), T); L.add(G.caja, cafe ? 0x7a4426 : 0x26262a, M4(sg * 0.2, 0.96, -0.6, 0, 0, sg * 0.3, 0.14, 0.04, 0.08), T); }
  for (const [x, z] of [[-0.17, -0.38], [0.17, -0.38], [-0.17, 0.4], [0.17, 0.4]]) L.add(G.cil4, cafe ? 0x8a4e2c : 0xe9e6dc, M4(x, 0.28, z, 0, 0, 0, 0.065, 0.56, 0.065), T, { g: [0.6, 1] });
  L.add(G.cil4, 0x3a3a3a, M4(0, 0.6, 0.64, 0.25, 0, 0, 0.02, 0.55, 0.02), T); L.add(G.ico, 0xe8b0a0, M4(0, 0.55, 0.22, 0, 0, 0, 0.14, 0.09, 0.16), T);
}
function cerca(L, s0, s1, lado, e) {
  const n = Math.max(2, Math.round((s1 - s0) * 620 / 2.4)); let prev = null;
  for (let i = 0; i <= n; i++) {
    const p = enOrilla(s0 + (s1 - s0) * i / n, lado, e + Math.sin(i * 1.3) * 0.15);
    L.add(G.caja, 0x6b4a2a, M4(p.x, p.y + 0.4, p.z, 0, i, (rnd(i * 3.3) - 0.5) * 0.12, 0.1, 0.95, 0.1), null, { var: 0.2, g: [0.7, 1.05] });
    if (prev) for (const y of [0.35, 0.68]) viga(L, V(prev.x, prev.y + y, prev.z), V(p.x, p.y + y, p.z), 0.05, 0.07, 0x8a6a42, { var: 0.15 });
    prev = p;
  }
}
function edificio(L, p, ry, h, i) {
  const an = 2.4 + rnd(i * 3.1) * 1.0, fo = 2.2 + rnd(i * 4.7) * 0.8;
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1);
  const c = [0xc97b5a, 0xe0c9a6, 0xb9c4c9, 0xd9a07a, 0xe8e1d3, 0xa8b8a2][i % 6];
  L.add(G.caja, c, M4(0, h / 2, 0, 0, 0, 0, an, h, fo), T, { g: [0.78, 1.05] });
  L.add(G.caja, 0x5a5550, M4(0, 0.5, 0, 0, 0, 0, an + 0.06, 1.0, fo + 0.06), T);
  L.add(G.caja, [0xd9503a, 0x2f7fb8, 0x3fa56a, 0xf2c14e][i % 4], M4(0, 1.05, fo / 2 + 0.2, 0.35, 0, 0, an * 0.9, 0.05, 0.5), T); // toldo
  L.add(G.caja, 0x7a6e66, M4(0, h + 0.12, 0, 0, 0, 0, an + 0.16, 0.24, fo + 0.16), T);
  const nx = Math.max(2, Math.round(an / 0.75));
  for (let y = 1.7; y < h - 0.5; y += 1.05) for (let q = 0; q < nx; q++) {
    const x = (q - (nx - 1) / 2) * (an * 0.86 / nx) * 1.05, luz = rnd(i * 7.7 + y * 3.1 + q * 1.3) > 0.82;
    L.add(G.caja, luz ? 0xffe9a8 : 0x35566a, M4(x, y, fo / 2 + 0.01, 0, 0, 0, 0.42, 0.55, 0.04), T, luz ? { g: [1.3, 1.3] } : { g: [0.8, 1.2] });
  }
  for (let y = 1.7; y < h - 0.5; y += 1.05) { L.add(G.caja, 0x35566a, M4(an / 2 + 0.01, y, 0, 0, 0, 0, 0.04, 0.55, fo * 0.6), T, { g: [0.8, 1.2] }); L.add(G.caja, 0xe9e4d8, M4(0, y - 0.33, fo / 2 + 0.03, 0, 0, 0, an * 0.92, 0.05, 0.08), T); }
  if (i % 3 === 0) { for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) L.add(G.cil4, 0x4a4a4a, M4(0.6 + x, h + 0.55, -0.4 + z, 0, 0, 0, 0.03, 0.7, 0.03), T); L.add(G.cil, 0x2f6f9a, M4(0.6, h + 1.15, -0.4, 0, 0, 0, 0.4, 0.7, 0.4), T, AO); }
  if (i % 3 === 1) { L.add(G.cil4, 0x555555, M4(-0.6, h + 1.0, 0.3, 0, 0, 0, 0.025, 1.6, 0.025), T); L.add(G.caja, 0x555555, M4(-0.6, h + 1.5, 0.3, 0, 0, 0, 0.5, 0.03, 0.03), T); }
  if (i % 3 === 2) L.add(G.caja, 0x9aa0a6, M4(0.3, h + 0.4, 0.2, 0, 0.3, 0, 0.6, 0.35, 0.45), T, AO);
}
function fabrica(L, p, ry, chim) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1);
  L.add(G.caja, 0xa3a8ad, M4(0, 1.4, 0, 0, 0, 0, 6, 2.8, 3.6), T, { var: 0.06, g: [0.72, 1.05] });
  L.add(G.caja, 0x6f757b, M4(0, 0.35, 0, 0, 0, 0, 6.06, 0.7, 3.66), T);
  for (let q = 0; q < 3; q++) { L.add(G.prisma, 0x7d8a92, M4(-2 + q * 2, 2.8, 0, 0, 0, 0, 2.0, 0.8, 3.7), T, { var: 0.1 }); L.add(G.caja, 0x9fd3e6, M4(-2.48 + q * 2, 3.15, 0, 0, 0, -0.67, 0.04, 0.7, 3.3), T, { g: [0.9, 1.3] }); }
  L.add(G.caja, 0x4a4f55, M4(-1.6, 1.0, 1.81, 0, 0, 0, 1.6, 2.0, 0.05), T); for (let q = 0; q < 4; q++) L.add(G.caja, 0x35566a, M4(0.2 + q * 0.75, 1.9, 1.81, 0, 0, 0, 0.5, 0.6, 0.04), T, { g: [0.8, 1.2] });
  for (const [x, z, h] of [[2.2, -1.0, 7.5], [1.2, -1.2, 6.2]]) {
    const franja = (px, py) => (Math.floor(py * 0.9) % 2 === 0 && py > h * 0.55 ? 0xd9503a : 0xe6e2da);
    L.add(new THREE.CylinderGeometry(0.3, 0.45, h, 10, 8), franja, M4(x, h / 2, z), T, { suave: true, g: [0.8, 1.05] });
    L.add(G.cil, 0x55555a, M4(x, h + 0.05, z, 0, 0, 0, 0.36, 0.14, 0.36), T);
    chim.push(V(x, h + 0.3, z).applyMatrix4(T));
  }
  // tanques y barriles
  L.add(G.cil, 0x8f979e, M4(-3.8, 1.2, -0.6, 0, 0, 0, 0.8, 2.4, 0.8), T, { suave: true, g: [0.75, 1.05] }); L.add(G.cono, 0x7d858c, M4(-3.8, 2.6, -0.6, 0, 0, 0, 0.82, 0.4, 0.82), T);
  [[3.6, 0.9, 0x2f6f9a], [4.1, 0.6, 0xd9833a], [3.7, 0.35, 0x2f6f9a], [4.3, 1.1, 0x3a8a5a]].forEach(([x, z, c]) => L.add(G.cil, c, M4(x, 0.42, z, 0, 0, 0, 0.26, 0.84, 0.26), T, AO));
}
function iglesia(L, p, ry) {
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1.1), B = 0xf8f3e8;
  L.add(G.caja, 0xa89c8a, M4(0, 0.1, 0.3, 0, 0, 0, 2.9, 0.5, 5.2), T, { var: 0.1 });
  L.add(G.caja, B, M4(0, 1.3, 0, 0, 0, 0, 2.4, 2.5, 4), T, { g: [0.84, 1.04] });
  L.add(G.prisma, 0xb8452f, M4(0, 2.55, 0, 0, Math.PI / 2, 0, 4.3, 1.15, 2.8), T, { var: 0.1 });
  L.add(G.caja, B, M4(0, 2.6, 2.2, 0, 0, 0, 1.4, 5.0, 1.4), T, { g: [0.84, 1.04] });
  L.add(G.caja, 0xe6dccb, M4(0, 5.0, 2.2, 0, 0, 0, 1.55, 0.14, 1.55), T);
  for (const r of [0, Math.PI / 2]) L.add(G.caja, 0x3a2a22, M4(0, 4.4, 2.2, 0, r, 0, 0.5, 0.75, 1.42), T);
  L.add(G.cono4, 0xb8452f, M4(0, 5.85, 2.2, 0, Math.PI / 4, 0, 1.05, 1.6, 1.05), T, { var: 0.1 });
  L.add(G.caja, 0xf2c14e, M4(0, 6.95, 2.2, 0, 0, 0, 0.07, 0.6, 0.07), T); L.add(G.caja, 0xf2c14e, M4(0, 7.05, 2.2, 0, 0, 0, 0.32, 0.07, 0.07), T);
  L.add(G.caja, 0x6b3f22, M4(0, 0.95, 2.91, 0, 0, 0, 0.7, 1.3, 0.05), T, AO); L.add(G.cil, 0x6b3f22, M4(0, 1.6, 2.9, Math.PI / 2, 0, 0, 0.35, 0.05, 0.35), T);
  L.add(G.cil, 0x2f5a6e, M4(0, 3.0, 2.91, Math.PI / 2, 0, 0, 0.3, 0.05, 0.3), T, { g: [0.8, 1.3] });
  for (const z of [-1.2, 0, 1.0]) for (const sg of [-1, 1]) { L.add(G.caja, 0x2f5a6e, M4(sg * 1.21, 1.5, z, 0, 0, 0, 0.04, 0.9, 0.36), T, { g: [0.8, 1.3] }); L.add(G.caja, 0xe6dccb, M4(sg * 1.3, 1.0, z + 0.55, 0, 0, 0, 0.22, 2.0, 0.22), T, AO); }
  for (let q = 0; q < 3; q++) L.add(G.caja, 0x8d877a, M4(0, 0.1 + q * 0.12, 3.5 - q * 0.22, 0, 0, 0, 1.6, 0.12, 0.3), T);
}
function mansion(L, p, ry) { // casona junto al Salto
  const T = M4(p.x, p.y, p.z, 0, ry, 0, 1.3), B = 0xf1e6cf;
  L.add(G.caja, 0xa89c8a, M4(0, 0.2, 0, 0, 0, 0, 5.2, 0.6, 3.6), T, { var: 0.1 });
  L.add(G.caja, B, M4(0, 1.9, 0, 0, 0, 0, 4.4, 3, 3), T, { g: [0.82, 1.04] });
  L.add(G.prisma, 0x6a6f75, M4(0, 3.4, 0, 0, 0, 0, 4.9, 1.35, 3.4), T, { var: 0.1 });
  L.add(G.caja, 0xd9ccb2, M4(0, 2.0, 1.52, 0, 0, 0, 4.42, 0.1, 0.08), T);
  for (const x of [-1.5, -0.5, 0.5, 1.5]) for (const y of [1.2, 2.6]) { L.add(G.caja, 0xfdfaf2, M4(x, y, 1.51, 0, 0, 0, 0.55, 0.72, 0.04), T); L.add(G.caja, 0x2f5a6e, M4(x, y, 1.525, 0, 0, 0, 0.45, 0.62, 0.04), T, { g: [0.8, 1.3] }); }
  L.add(G.caja, 0x5a3a22, M4(0, 1.05, 1.54, 0, 0, 0, 0.6, 1.1, 0.05), T);
  for (const x of [-2.4, 2.4]) { L.add(G.caja, B, M4(x, 2.4, 0, 0, 0, 0, 1.2, 4.2, 1.2), T, { g: [0.82, 1.04] }); L.add(G.cono4, 0x6a6f75, M4(x, 5.15, 0, 0, Math.PI / 4, 0, 0.98, 1.4, 0.98), T); L.add(G.caja, 0x2f5a6e, M4(x, 3.4, 0.61, 0, 0, 0, 0.4, 0.7, 0.04), T, { g: [0.8, 1.3] }); }
  for (const x of [-1.0, 1.0]) L.add(G.cil, 0xfdfaf2, M4(x, 1.2, 1.9, 0, 0, 0, 0.09, 1.5, 0.09), T, AO);
  L.add(G.caja, 0xd9ccb2, M4(0, 2.0, 1.85, 0, 0, 0, 2.4, 0.1, 0.7), T);
}
function palafito(L, s, lado, i) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw - 0.9); p.y = 0;
  const ry = haciaRio(s, lado);
  const T = M4(p.x, 0, p.z, 0, ry, 0, 0.85);
  for (const [x, z] of [[-0.95, -0.75], [0.95, -0.75], [-0.95, 0.75], [0.95, 0.75], [0, 1.25]]) L.add(G.cil6, 0x5a3a1e, M4(x, 0.5, z, 0, 0, 0, 0.09, 2.2, 0.09), T, { var: 0.15, g: [0.55, 1.05] });
  L.add(G.caja, 0x7a5230, M4(0, 1.55, 0.2, 0, 0, 0, 2.6, 0.12, 2.6), T, { var: 0.1 });
  for (let q = 0; q < 6; q++) L.add(G.caja, 0x6b4422, M4(-1.25 + q * 0.5, 1.9, 1.45, 0, 0, 0, 0.06, 0.6, 0.06), T); L.add(G.caja, 0x8a5a2e, M4(0, 2.2, 1.45, 0, 0, 0, 2.6, 0.06, 0.08), T);
  casa(L, new THREE.Vector3(0, 1.3, 0).applyMatrix4(T), ry, 0.8, i);
  // pasarela al acantilado
  const H = alturaAcantilado(s, lado);
  for (let k = 0; k < 6; k++) L.add(G.caja, 0x8a5a2e, M4(0, 1.5 + (H - 1.5) * k / 6, -1.3 - k * 0.35, 0, 0, 0, 0.8, 0.08, 0.34), T);
}
const PINT = [[0x2f7fb8, 0x2a6da0, 0xf2f2ea], [0xd9503a, 0xbd4230, 0xf2c14e], [0x3fa56a, 0x35915c, 0xf2f2ea], [0xf2c14e, 0xdcae3c, 0x2f7fb8]];
function canoa(L, s, lado, i) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw - 1.1 - rnd(i) * 0.6);
  const m = marco(s), ry = Math.atan2(-m.tx, -m.tz) + (rnd(i * 3) - 0.5) * 0.6, c = PINT[i % 4];
  const T = M4(p.x, 0.0, p.z, 0, ry, 0, 0.5);
  casco(L, T, { NS: 8, K: 6, punta: 0.25, pal: [c[0], c[1], c[2]], dentro: [0xd9b77e, 0xc9a66c] });
  L.add(G.caja, 0x7a4e26, M4(0, 0.42, 0.3, 0, 0, 0, 1.5, 0.06, 0.3), T);
  // estaca de amarre
  const q = puntoOrilla(s, lado, hw - 0.35); L.add(G.cil6, 0x4e3318, M4(q.x, 0.3, q.z, 0, 0, 0.1, 0.06, 1.3, 0.06), null, { g: [0.6, 1] });
  viga(L, V(q.x, 0.85, q.z), V(p.x - m.tx * 1.1, 0.3, p.z - m.tz * 1.1), 0.025, 0.025, 0xd9c79a);
}
function puente(L, s, faroles) {
  const m = marco(s), hw = anchoRio(s) / 2;
  const yA = alturaAcantilado(s, 1), yB = alturaAcantilado(s, -1);
  const base = Math.max(3.3, Math.min(yA, yB) + 0.1), Lg = hw * 2 + 3.2, N = 20;
  const ry = Math.atan2(-m.nz, m.nx), tz = 1.7;
  const pt = (u, sg = 0, dy = 0) => { const off = (u - 0.5) * Lg; return V(m.x + m.nx * off + m.tx * sg * tz * 0.5, base + Math.sin(Math.PI * u) * 0.9 + dy, m.z + m.nz * off + m.tz * sg * tz * 0.5); };
  for (let i = 0; i < N; i++) { const p = pt(i / (N - 1)); L.add(G.caja, i % 2 ? 0x9a6a3a : 0x86562c, M4(p.x, p.y, p.z, 0, ry, (rnd(i * 5.1 + s) - 0.5) * 0.06, Lg / N * 0.94, 0.12, tz), null, { var: 0.14 }); }
  for (const sg of [-1, 1]) {
    for (let i = 0; i < N - 1; i += 3) { const u0 = i / (N - 1), u1 = Math.min(1, (i + 3) / (N - 1)); viga(L, pt(u0, sg, -0.12), pt(u1, sg, -0.12), 0.12, 0.14, 0x5e3d1e); viga(L, pt(u0, sg, 0.85), pt(u1, sg, 0.85), 0.07, 0.08, 0x7a5230); viga(L, pt(u0, sg, 0.45), pt(u1, sg, 0.45), 0.04, 0.05, 0x8a6a42); }
    for (let i = 0; i < N; i += 3) { const p = pt(i / (N - 1), sg, 0.38); L.add(G.caja, 0x5a3a1e, M4(p.x, p.y, p.z, 0, ry, 0, 0.11, 1.0, 0.11), null, { g: [0.7, 1.05] }); }
  }
  // pilotes en el agua con cruceta
  for (const sgn of [-1, 1]) {
    const off = sgn * (hw - 0.6), x = m.x + m.nx * off, z = m.z + m.nz * off, y = base + Math.sin(Math.PI * (off / Lg + 0.5)) * 0.9;
    for (const t of [-0.6, 0.6]) L.add(G.cil6, 0x4e3318, M4(x + m.tx * t, y / 2 - 0.4, z + m.tz * t, 0, 0, 0, 0.15, y + 0.8, 0.15), null, { var: 0.15, g: [0.5, 1.05] });
    viga(L, V(x + m.tx * -0.6, 0.5, z + m.tz * -0.6), V(x + m.tx * 0.6, y - 0.4, z + m.tz * 0.6), 0.07, 0.09, 0x5e3d1e);
    rocasAgua.push({ x, z, r: 0.6 });
  }
  for (const sgn of [-1, 1]) { const p = pt(sgn > 0 ? 1 : 0, 1, 0); farol(L, V(p.x, p.y - 0.1, p.z), faroles); }
}
function farol(L, p, faroles) {
  L.add(G.cil6, 0x3a2a1a, M4(p.x, p.y + 0.7, p.z, 0, 0, 0, 0.05, 1.5, 0.05));
  L.add(G.caja, 0x2a2a2a, M4(p.x, p.y + 1.62, p.z, 0, 0, 0, 0.2, 0.05, 0.2)); L.add(G.cono4, 0x2a2a2a, M4(p.x, p.y + 1.72, p.z, 0, Math.PI / 4, 0, 0.17, 0.14, 0.17));
  L.add(G.caja, 0xffe2a0, M4(p.x, p.y + 1.5, p.z, 0, 0, 0, 0.13, 0.2, 0.13), null, { g: [1.4, 1.4] });
  faroles.push(V(p.x, p.y + 1.5, p.z));
}
function helecho(L, p, k, i) { // helecho arborescente del bosque de niebla
  const T = M4(p.x, p.y, p.z, 0, rnd(i) * 6.28, 0, k);
  L.add(new THREE.CylinderGeometry(0.1, 0.17, 3.9, 6, 3), 0x5a432a, M4(0.12, 1.95, 0, 0, 0, -0.06), T, { jit: 0.03, var: 0.25, g: [0.6, 1.05] });
  for (let h = 0; h < 9; h++) {
    const a = h / 9 * Math.PI * 2, R = M4(0.24, 3.85, 0, 0, a, 0), c = h % 2 ? 0x4caf50 : 0x6cc24a;
    L.add(G.cono4, c, R.clone().multiply(M4(0, 0, 0, 0, 0, -1.05)).multiply(M4(0, 0.55, 0, 0, 0, 0, 0.3, 1.1, 0.04)), T, { g: [0.75, 1.1] });
    L.add(G.cono4, c, R.clone().multiply(M4(0.95, 0.52, 0, 0, 0, -1.9)).multiply(M4(0, 0.5, 0, 0, 0, 0, 0.26, 1.0, 0.04)), T, { g: [0.95, 0.75] });
  }
  L.add(G.ico, 0x7a5a34, M4(0.24, 3.9, 0, 0, 0, 0, 0.18), T);
}
function nube(L, x, y, z, k, i) {
  const T = M4(x, y, z, 0, rnd(i) * 6.28, 0, k);
  const n = 4 + Math.floor(rnd(i * 2) * 3);
  for (let j = 0; j < n; j++) { const a = (j - (n - 1) / 2) * 1.15, r = 1.0 + rnd(j * 7 + i) * 0.7 + Math.sin(j / (n - 1) * Math.PI) * 0.4; L.add(G.esfera, 0xffffff, M4(a, r * 0.55, (rnd(i + j) - 0.5) * 0.9, 0, 0, 0, r, r * 0.82, r), T, { suave: true, g: [0.8, 1.04] }); }
  L.add(G.esfera, 0xe6eff6, M4(0, 0.1, 0, 0, 0, 0, n * 0.72, 0.5, 1.25), T, { suave: true, g: [0.86, 1] });
}
function letrero(escena, s, lado, texto, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const pintar = () => {
    x.fillStyle = '#c99556'; x.fillRect(0, 0, 512, 192);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(90,55,25,${0.05 + rnd(i) * 0.1})`; x.fillRect(0, rnd(i * 3) * 192, 512, 2 + rnd(i * 7) * 5); }
    x.strokeStyle = '#6b4422'; x.lineWidth = 10; x.strokeRect(5, 5, 502, 182);
    x.fillStyle = '#3a2412'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 62; x.font = `700 ${fs}px Fredoka, Nunito, sans-serif`; while (x.measureText(texto).width > 460 && fs > 30) { fs -= 3; x.font = `700 ${fs}px Fredoka, Nunito, sans-serif`; }
    x.fillText(texto, 256, 78); x.font = '600 34px Nunito, sans-serif'; x.fillStyle = '#5a3a1e'; x.fillText(sub, 256, 142);
    tex.needsUpdate = true;
  };
  pintar(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(pintar);
  const p = enOrilla(s, lado, 1.9), m = marco(s), g = new THREE.Group();
  g.position.copy(p); g.rotation.y = Math.atan2(-m.tx - 0.55 * m.nx * lado, -m.tz - 0.55 * m.nz * lado);
  const L = new Lote();
  for (const xx of [-1.05, 1.05]) L.add(G.cil6, 0x5e3d1e, M4(xx, 1.0, 0, 0, 0, 0, 0.08, 2.6, 0.08), null, { var: 0.15, g: [0.6, 1.05] });
  L.add(G.caja, 0x7a5230, M4(0, 1.75, -0.03, 0, 0, 0, 2.6, 1.0, 0.07)); L.add(G.prisma, 0x8a3324, M4(0, 2.3, 0, 0, 0, 0, 2.9, 0.28, 0.5));
  g.add(L.malla());
  const cara = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 0.92), new THREE.MeshLambertMaterial({ map: tex })); cara.position.set(0, 1.75, 0.012); g.add(cara);
  escena.add(g); return g;
}

function brilloTex(r, g, b) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(0.25, `rgba(${r},${g},${b},.9)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export function crearDecor(escena, lugares = []) {
  const L = new Lote(), faroles = [], chim = [];
  let ic = 0;
  // casas por tramo (s, lado, e)
  const casas = [
    [0.05, 1, 4], [0.14, -1, 5.5], [0.22, 1, 3.5],
    [0.25, -1, 4], [0.29, 1, 4.5], [0.34, 1, 6], [0.36, -1, 3.5],
    [0.43, 1, 4], [0.47, -1, 5], [0.56, 1, 3.5], [0.59, -1, 6],
    [0.84, -1, 4], [0.9, 1, 4.5]
  ];
  for (const [s, l, e] of casas) casa(L, enOrilla(s, l, e), haciaRio(s, l), 1, ic++, rnd(s * 99) > 0.6);
  // curtiembre junto al primer vertimiento y fábrica en la ciudad
  fabrica(L, enOrilla(0.312, 1, 6.5), haciaRio(0.312, 1), chim);
  fabrica(L, enOrilla(0.652, -1, 7), haciaRio(0.652, -1), chim);
  iglesia(L, enOrilla(0.51, -1, 6.5), haciaRio(0.51, -1));
  // ciudad (tramo 4): edificios escalonados
  for (let i = 0; i < 34; i++) {
    const s = 0.61 + rnd(i * 4.1) * 0.17, l = i % 2 ? 1 : -1, e = 3.4 + rnd(i * 2.7) * 22;
    if (l === -1 && Math.abs(s - 0.652) < 0.014 && e < 13) continue;
    edificio(L, enOrilla(s, l, e), haciaRio(s, l), 3 + rnd(i * 5.3) * 6 * (e > 12 ? 1.4 : 1), i);
  }
  mansion(L, enOrilla(0.968, -1, 5), haciaRio(0.968, -1));
  // potreros con cercas y vacas (cuenca alta y sabana)
  const potreros = [[0.075, 0.125, 1, 6.5], [0.17, 0.215, -1, 7], [0.255, 0.3, -1, 8.5], [0.385, 0.425, 1, 7], [0.455, 0.5, 1, 8], [0.535, 0.575, -1, 8]];
  potreros.forEach(([a, b, l, e], k) => {
    cerca(L, a, b, l, e);
    for (let q = 0; q < 3; q++) { const s = a + (b - a) * (0.15 + 0.3 * q + rnd(k * 7 + q) * 0.1); vaca(L, enOrilla(s, l, e + 2 + rnd(k * 3 + q * 5) * 5), rnd(k * 11 + q * 3) * 6.28, k * 3 + q); }
  });
  // palafitos y canoas
  palafito(L, 0.27, -1, 1); palafito(L, 0.437, 1, 2); palafito(L, 0.535, -1, 3);
  for (let i = 0; i < 12; i++) canoa(L, 0.08 + rnd(i * 6.6) * 0.86, i % 2 ? 1 : -1, i);
  // escalera del muelle inicial
  { const s = 0.006, m = marco(s), H = alturaAcantilado(s, -1), hw = anchoRio(s) / 2, ry = Math.atan2(-m.tx, -m.tz);
    for (let k = 0; k < 9; k++) { const off = hw - 0.6 + k * 0.12, x = m.x - m.nx * off + m.tx * (1.6 - k * 0.42), z = m.z - m.nz * off + m.tz * (1.6 - k * 0.42); L.add(G.caja, k % 2 ? 0x8a5a2e : 0x7a4e26, M4(x, 0.6 + (H - 0.6) * k / 8, z, 0, ry, 0, 1.0, 0.1, 0.42), null, { var: 0.1 }); } }
  // puentes
  for (const s of [0.155, 0.375, 0.585, 0.695, 0.845]) puente(L, s, faroles);
  // helechos arborescentes (último tramo)
  for (let i = 0; i < 40; i++) { const s = 0.8 + rnd(i * 3.9) * 0.18, l = i % 2 ? 1 : -1; helecho(L, enOrilla(s, l, 1.6 + rnd(i * 2.2) * 9), 0.9 + rnd(i) * 0.6, i); }
  // faroles frente a casas
  for (const [s, l, e] of casas) farol(L, enOrilla(s, l, e - 1.7), faroles);

  const estatico = L.malla(); estatico.frustumCulled = false; escena.add(estatico);

  // letreros de madera al inicio de cada tramo
  const letreros = lugares.map((t, i) => letrero(escena, i / lugares.length + 0.02, i % 2 ? -1 : 1, t[0], t[1]));

  // nubes (se desplazan)
  const LN = new Lote();
  for (let i = 0; i < 26; i++) {
    const s = rnd(i * 5.1), m = marco(s), lat = (rnd(i * 2.9) - 0.5) * 160;
    nube(LN, m.x + m.nx * lat, 26 + rnd(i * 8.1) * 22, m.z + m.nz * lat - 20, 2 + rnd(i * 4.4) * 2.5, i);
  }
  const nubes = LN.malla(new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x8899aa, emissiveIntensity: 0.6 }));
  nubes.frustumCulled = false; escena.add(nubes);

  // cascadas (plano con rayas que bajan) con rocas en la base
  const P = [], UV = [], LR = new Lote(), bruma = [];
  const plano = (a, b, c, d) => { P.push(...a, ...b, ...c, ...a, ...c, ...d); UV.push(0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0); };
  const caidas = [[0.05, -1, 1.6], [0.11, 1, 2.2], [0.2, -1, 1.4], [0.235, 1, 1.8], [0.45, 1, 1.5], [0.66, -1, 1.3], [0.88, 1, 2.4], [0.925, -1, 2.0], [0.955, 1, 2.6]];
  caidas.forEach(([s, lado, w], k) => {
    const m = marco(s), hw = anchoRio(s) / 2, H = alturaAcantilado(s, lado);
    const pt = (e, y, t) => [m.x + m.nx * (hw + e) * lado + m.tx * t, y, m.z + m.nz * (hw + e) * lado + m.tz * t];
    plano(pt(0.12, H + 0.05, -w / 2), pt(0.12, H + 0.05, w / 2), pt(-0.05, -0.1, w * 0.62), pt(-0.05, -0.1, -w * 0.62));
    plano(pt(1.4, H + 0.06, -w / 2), pt(1.4, H + 0.06, w / 2), pt(0.12, H + 0.05, w / 2), pt(0.12, H + 0.05, -w / 2));
    const b = pt(-0.6, 0, 0); rocasAgua.push({ x: b[0], z: b[2], r: w * 0.6 });
    for (const [e, t, r] of [[0.1, -w * 0.75, 0.55], [0.0, w * 0.8, 0.45], [-0.5, w * 0.2, 0.3], [0.25, -w * 0.62, 0.4]]) { const q = pt(e, 0.1, t); LR.add(G.esfera, (x, y) => (y > 0.3 ? 0x8fb070 : 0xd8cfbd), M4(q[0], q[1], q[2], k, k * 2 + t, 0, r, r * 0.75, r), null, { jit: 0.2, var: 0.2, g: [0.6, 1.08] }); }
    for (const [e, t] of [[1.5, -w * 0.65], [1.5, w * 0.65]]) { const q = pt(e, H + 0.15, t); LR.add(G.esfera, 0xd8cfbd, M4(q[0], q[1], q[2], k, t, 0, 0.45, 0.35, 0.45), null, { jit: 0.2, var: 0.2, g: [0.65, 1.08] }); }
    for (let q = 0; q < 5; q++) bruma.push(pt(-0.5 - rnd(k * 5 + q) * 0.8, 0.3 + rnd(k * 3 + q * 2) * 0.9, (rnd(k + q * 7) - 0.5) * w * 1.3));
  });
  const rocasCaida = LR.malla(); rocasCaida.frustumCulled = false; escena.add(rocasCaida);
  const gc = new THREE.BufferGeometry(); gc.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); gc.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  const cascadas = new THREE.Mesh(gc, new THREE.ShaderMaterial({
    uniforms: uniformes, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; varying vec3 vVista; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vVista=mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uTiempo; uniform vec3 uFogColor; uniform float uFogNear,uFogFar; varying vec2 vUv; varying vec3 vVista;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      void main(){ float r = vn(vec2(vUv.x*9., vUv.y*2.5 + uTiempo*2.6))*.65 + vn(vec2(vUv.x*22., vUv.y*5. + uTiempo*4.2))*.35;
        vec3 c = mix(vec3(.50,.84,.94), vec3(1.), smoothstep(.32,.68,r));
        c = mix(c, vec3(1.), smoothstep(.25,.0,vUv.y)*.7);
        float a = (.78 + .22*r) * smoothstep(0.,.16,vUv.x) * smoothstep(1.,.84,vUv.x);
        float f = smoothstep(uFogNear,uFogFar,length(vVista)); c = mix(c,uFogColor,f);
        gl_FragColor = vec4(c, a); }`
  }));
  cascadas.frustumCulled = false; escena.add(cascadas);
  // bruma al pie de las caídas
  const bp = new Float32Array(bruma.length * 3); bruma.forEach((p, i) => bp.set(p, i * 3));
  const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  const brumas = new THREE.Points(gb, new THREE.PointsMaterial({ size: 2.6, map: brilloTex(255, 255, 255), transparent: true, depthWrite: false, opacity: 0.4 }));
  brumas.frustumCulled = false; escena.add(brumas);

  // anillos de espuma alrededor de rocas, pilotes y caídas
  const LE = new Lote(); const anillo = new THREE.RingGeometry(1, 1.32, 16); anillo.rotateX(-Math.PI / 2);
  const anillo2 = new THREE.RingGeometry(1.55, 1.68, 16); anillo2.rotateX(-Math.PI / 2);
  for (const r of rocasAgua) { LE.add(anillo, 0xffffff, M4(r.x, 0.03, r.z, 0, rnd(r.x) * 6, 0, r.r * 0.95), null, { g: [1, 1] }); LE.add(anillo2, 0xffffff, M4(r.x, 0.03, r.z, 0, 0, 0, r.r * 0.95), null, { g: [1, 1] }); }
  const espuma = LE.malla(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false }));
  espuma.frustumCulled = false; escena.add(espuma);

  // faroles encendidos
  const fp = new Float32Array(faroles.length * 3); faroles.forEach((p, i) => fp.set([p.x, p.y, p.z], i * 3));
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const luces = new THREE.Points(gf, new THREE.PointsMaterial({ size: 1.5, map: brilloTex(255, 200, 110), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  luces.frustumCulled = false; escena.add(luces);

  // humo de las chimeneas (se apaga cuando el río sana)
  const humo = [], gh = new THREE.IcosahedronGeometry(1, 1);
  chim.forEach((p, k) => { for (let q = 0; q < 5; q++) { const h = new THREE.Mesh(gh, new THREE.MeshLambertMaterial({ color: 0x77726a, transparent: true, opacity: 0.5, depthWrite: false })); h.userData = { p, f: q / 5 + k * 0.13 }; escena.add(h); humo.push(h); } });

  // orbes de vida (aparecen con la limpieza)
  const NO = 46, op = new Float32Array(NO * 3), base = [];
  for (let i = 0; i < NO; i++) base.push([rnd(i * 1.3) * 2 - 1, rnd(i * 2.1), rnd(i * 3.7) * 2 - 1, rnd(i * 4.9) * 6]);
  const go = new THREE.BufferGeometry(); go.setAttribute('position', new THREE.BufferAttribute(op, 3));
  const orbes = new THREE.Points(go, new THREE.PointsMaterial({ size: 0.9, map: brilloTex(110, 255, 225), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  orbes.frustumCulled = false; escena.add(orbes);

  return {
    estatico, nubes, cascadas, espuma, luces, orbes, letreros,
    animar(t, centro, limpio) {
      nubes.position.x = Math.sin(t * 0.02) * 10; nubes.position.z = Math.cos(t * 0.015) * 6;
      espuma.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.18;
      luces.material.opacity = 0.65 + Math.sin(t * 3.1) * 0.12;
      brumas.material.opacity = 0.32 + Math.sin(t * 1.7) * 0.08;
      for (const h of humo) {
        const u = h.userData, k = (t * 0.11 + u.f) % 1, lejos = Math.abs(u.p.z - centro.z) + Math.abs(u.p.x - centro.x) > 170;
        h.visible = !lejos && limpio < 0.85; if (!h.visible) continue;
        h.position.set(u.p.x + k * k * 4 + Math.sin(t * 0.7 + u.f * 9) * 0.3, u.p.y + k * 8, u.p.z + k * 1.5); h.scale.setScalar(0.5 + k * 2.2);
        h.material.opacity = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.6 * (1 - limpio * 0.9);
      }
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
