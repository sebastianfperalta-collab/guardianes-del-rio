// Objetos del juego: barca, basura, tubería, ave atrapada, fauna, bandada, luciérnagas, muelle
import * as THREE from 'three';
import { marco, puntoOrilla, anchoRio, limpiezaEn, rnd } from './mundo.js';
import { BASURA } from './datos.js';

const lam = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...o });
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); return x; };

// ---------- Barca (hoja) ----------
export function crearBarca() {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(0, -2.4); sh.bezierCurveTo(1.35, -1.4, 1.35, 1.3, 0, 2.4); sh.bezierCurveTo(-1.35, 1.3, -1.35, -1.4, 0, -2.4);
  const hull = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.1, bevelSegments: 1 });
  hull.rotateX(Math.PI / 2); hull.translate(0, 0.1, 0);
  const casco = mesh(hull, lam(0x9a6a3a)); g.add(casco);
  // interior más claro
  const sh2 = new THREE.Shape();
  sh2.moveTo(0, -2.1); sh2.bezierCurveTo(1.05, -1.2, 1.05, 1.1, 0, 2.1); sh2.bezierCurveTo(-1.05, 1.1, -1.05, -1.2, 0, -2.1);
  const fondo = mesh(new THREE.ShapeGeometry(sh2), lam(0xd8b57a, { side: THREE.DoubleSide })); fondo.rotation.x = -Math.PI / 2; fondo.position.y = 0.2; g.add(fondo);
  const banco = mesh(new THREE.BoxGeometry(1.7, 0.1, 0.4), lam(0x7a4e26)); banco.position.set(0, 0.42, 0.9); g.add(banco);
  // canasto para la basura (atrás)
  const canasto = new THREE.Group(); canasto.position.set(0, 0.2, 1.55);
  canasto.add(mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.5, 8, 1, true), lam(0xc98f4a, { side: THREE.DoubleSide })));
  const rell = mesh(new THREE.CircleGeometry(0.45, 8), lam(0x6b4a24)); rell.rotation.x = -Math.PI / 2; rell.position.y = -0.2; canasto.add(rell);
  g.add(canasto);
  // remo
  const remo = new THREE.Group(); remo.position.set(-0.9, 0.7, 0.3);
  remo.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 5), lam(0x6a4a24)));
  const pala = mesh(new THREE.BoxGeometry(0.28, 0.5, 0.04), lam(0x8a5a2a)); pala.position.y = -1.05; remo.add(pala);
  remo.rotation.z = 0.7; g.add(remo);
  g.userData = { remo, canasto };
  return g;
}

// ---------- Basura ----------
const geos = {
  botella: () => { const gp = new THREE.Group(); gp.add(mesh(new THREE.CylinderGeometry(.16, .16, .55, 8), lam(0x6fc7f0, { transparent: true, opacity: .85 }))); const t = mesh(new THREE.CylinderGeometry(.05, .08, .14, 6), lam(0xf2f2f2)); t.position.y = .34; gp.add(t); gp.rotation.z = Math.PI / 2.4; return gp; },
  bolsa: () => { const m = mesh(new THREE.IcosahedronGeometry(.34, 0), lam(0xeeeeee)); m.scale.set(1.3, .6, 1); return m; },
  lata: () => { const m = mesh(new THREE.CylinderGeometry(.14, .14, .3, 8), lam(0xb8bfcc)); m.rotation.z = 1.2; return m; },
  comida: () => { const gp = new THREE.Group(); gp.add(mesh(new THREE.IcosahedronGeometry(.26, 0), lam(0x9a7a3a))); const b = mesh(new THREE.IcosahedronGeometry(.16, 0), lam(0x7a8a3a)); b.position.set(.2, .1, 0); gp.add(b); return gp; },
  ramas: () => { const gp = new THREE.Group(); for (let i = 0; i < 3; i++) { const r = mesh(new THREE.CylinderGeometry(.04, .05, .9, 5), lam(0x5b4a28)); r.rotation.z = 1.2 + i * .5; r.rotation.y = i * 1.1; gp.add(r); } return gp; },
  llanta: () => { const m = mesh(new THREE.TorusGeometry(.42, .17, 6, 12), lam(0x2a2a2a)); m.rotation.x = Math.PI / 2.1; return m; }
};
const ORDEN = ['botella', 'bolsa', 'lata', 'comida', 'ramas', 'llanta'];
export const ICONO = { plastico: '🧴', metal: '🥫', organico: '🍂', llanta: '🛞' };
export const CAJA = { plastico: 'aprov', metal: 'aprov', organico: 'org', llanta: 'esp' };

export function crearBasura(escena, tramo, n, desde, hasta, semilla) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const r = rnd(semilla + i * 3.7);
    const idxTipo = r < .3 ? (i % 2 ? 0 : 1) : r < .5 ? 2 : r < .72 ? (i % 2 ? 3 : 4) : r < .88 ? (i % 3 ? 0 : 2) : 5;
    const tipo = ORDEN[idxTipo];
    const info = BASURA[Math.min(idxTipo, 5)];
    const s = desde + (hasta - desde) * ((i + 0.5 + (rnd(semilla + i * 9.1) - .5) * .5) / n);
    const m = marco(s), hw = anchoRio(s) / 2;
    const lat = (rnd(semilla + i * 5.5) - .5) * (hw * 1.5);
    const g = geos[tipo](); g.position.set(m.x + m.nx * lat, 0.05, m.z + m.nz * lat);
    g.userData = { tipo: BASURA[idxTipo].tipo, nombre: BASURA[idxTipo].nombre, s, tramo, recogida: false, f: rnd(i + semilla) * 6, y0: 0.05 };
    escena.add(g); lista.push(g);
  }
  return lista;
}

// ---------- Tubería que vierte ----------
export function crearTuberia(escena, s, lado) {
  const hw = anchoRio(s) / 2, p = puntoOrilla(s, lado, hw + 0.5); p.y = Math.max(1.3, p.y + 0.2);
  const g = new THREE.Group(); g.position.copy(p);
  const m = marco(s); g.rotation.y = Math.atan2(m.nx * lado, m.nz * lado);
  const tubo = mesh(new THREE.CylinderGeometry(.55, .55, 2.2, 10), lam(0x6b6b70)); tubo.rotation.x = Math.PI / 2; tubo.position.z = -0.3; g.add(tubo);
  const aro = mesh(new THREE.TorusGeometry(.58, .09, 5, 10), lam(0x4d4d52)); aro.position.z = -1.35; g.add(aro);
  const fluido = mesh(new THREE.CylinderGeometry(.42, .3, 3.2, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x5a3b18, transparent: true, opacity: .85 }));
  fluido.position.set(0, -1.3, -1.9); fluido.rotation.x = 0.35; g.add(fluido);
  const gotas = [];
  for (let i = 0; i < 10; i++) { const d = mesh(new THREE.SphereGeometry(.22, 5, 4), new THREE.MeshBasicMaterial({ color: 0x4a2e12 })); d.userData.t = i / 10; g.add(d); gotas.push(d); }
  g.userData = { tipo: 'tuberia', s, sellada: false, g1: fluido, gotas, prog: 0 };
  // mancha en el agua
  escena.add(g); return g;
}
export function animarTuberia(t, dt) {
  const u = t.userData; if (u.sellada) { u.g1.scale.y = Math.max(0.001, u.g1.scale.y - dt * 3); u.gotas.forEach((d) => d.visible = false); return; }
  for (const d of u.gotas) { d.userData.t = (d.userData.t + dt * 0.9) % 1; const k = d.userData.t; d.position.set(0, -0.2 - k * k * 2.6, -1.5 - k * 1.3); }
}

// ---------- Aves y animales ----------
function ave(cuerpo, pecho, pico, patas, escala = 1, cuello = 0.5) {
  const g = new THREE.Group();
  const c = mesh(new THREE.SphereGeometry(.4, 8, 6), lam(cuerpo)); c.scale.set(1, .8, 1.5); c.position.y = .55; g.add(c);
  const cu = mesh(new THREE.CylinderGeometry(.07, .1, cuello + .3, 5), lam(pecho)); cu.position.set(0, .8 + cuello * .4, -.45); cu.rotation.x = -.35; g.add(cu);
  const ca = mesh(new THREE.SphereGeometry(.14, 7, 5), lam(pecho)); ca.position.set(0, 1.0 + cuello * .8, -.62); g.add(ca);
  const pi = mesh(new THREE.ConeGeometry(.05, .3, 5), lam(pico)); pi.rotation.x = -Math.PI / 2; pi.position.set(0, 1.0 + cuello * .8, -.85); g.add(pi);
  for (const x of [-.12, .12]) { const p = mesh(new THREE.CylinderGeometry(.025, .025, .55, 4), lam(patas)); p.position.set(x, .27, .05); g.add(p); }
  const co = mesh(new THREE.ConeGeometry(.12, .45, 4), lam(cuerpo)); co.rotation.x = Math.PI / 2.4; co.position.set(0, .6, .75); g.add(co);
  g.scale.setScalar(escala); return g;
}
export function crearGarza() { return ave(0xf4f4f0, 0xffffff, 0xf0b030, 0x6a5a3a, 1.5, 1.0); }
export function crearTingua() { return ave(0x4b5560, 0x59636e, 0xd9c24a, 0xd8503a, 0.8, .1); }
export function crearPato() {
  const g = new THREE.Group();
  const c = mesh(new THREE.SphereGeometry(.4, 8, 6), lam(0x8a4a2a)); c.scale.set(1, .65, 1.4); c.position.y = .2; g.add(c);
  const ca = mesh(new THREE.SphereGeometry(.22, 8, 6), lam(0x1e1e24)); ca.position.set(0, .58, -.42); g.add(ca);
  const mj = mesh(new THREE.SphereGeometry(.1, 6, 5), lam(0xffffff)); mj.position.set(.12, .55, -.55); g.add(mj);
  const pi = mesh(new THREE.BoxGeometry(.14, .06, .28), lam(0x4a8ad0)); pi.position.set(0, .55, -.74); g.add(pi);
  const co = mesh(new THREE.ConeGeometry(.12, .4, 4), lam(0x8a4a2a)); co.rotation.x = Math.PI / 2 - .5; co.position.set(0, .4, .55); g.add(co);
  return g;
}
export function crearPez() {
  const g = new THREE.Group();
  const c = mesh(new THREE.SphereGeometry(.12, 7, 5), lam(0xe8eef2, { emissive: 0x334455 })); c.scale.set(.55, .55, 1.9); g.add(c);
  const co = mesh(new THREE.ConeGeometry(.09, .18, 4), lam(0xc8d4dc)); co.rotation.x = -Math.PI / 2; co.position.z = .27; g.add(co);
  return g;
}
export function crearFrailejonTap() { return null; }

export function crearBandada(escena, n = 14) {
  const aves = [];
  const ala = new THREE.BufferGeometry();
  ala.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, -.3, .2, 0, .5], 3)); ala.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2b3a3a, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    const a1 = mesh(ala, mat), a2 = mesh(ala, mat); a2.scale.x = -1; g.add(a1, a2);
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
  for (let i = 0; i < 6; i++) { const t = mesh(new THREE.BoxGeometry(2.6, .12, .42), lam(0x8a5a2e)); t.position.set(-3.6, .45, 1.8 - i * .5); g.add(t); }
  const base = mesh(new THREE.BoxGeometry(2.8, .1, 3.3), lam(0x6e4622)); base.position.set(-3.6, .36, .4); g.add(base);
  for (const [x, z] of [[-4.8, 1.9], [-2.4, 1.9], [-4.8, -1.1], [-2.4, -1.1]]) { const p = mesh(new THREE.CylinderGeometry(.09, .09, 1.2, 5), lam(0x4e3318)); p.position.set(x, .25, z); g.add(p); }
  // abuelo
  const ab = new THREE.Group(); ab.position.set(-3.8, .5, 0.4);
  const cuerpo = mesh(new THREE.ConeGeometry(.42, 1.3, 7), lam(0x3f6f8a)); cuerpo.position.y = .65; ab.add(cuerpo);
  const cab = mesh(new THREE.SphereGeometry(.22, 8, 6), lam(0xd6a37a)); cab.position.y = 1.5; ab.add(cab);
  const sombrero = mesh(new THREE.CylinderGeometry(.42, .42, .06, 10), lam(0xc9a15a)); sombrero.position.y = 1.62; ab.add(sombrero);
  const copa = mesh(new THREE.CylinderGeometry(.2, .26, .24, 8), lam(0xc9a15a)); copa.position.y = 1.74; ab.add(copa);
  const far = mesh(new THREE.SphereGeometry(.12, 7, 5), new THREE.MeshBasicMaterial({ color: 0xffd27a })); far.position.set(.5, 1.0, -.1); ab.add(far);
  ab.rotation.y = -Math.PI / 2 * 0.2; g.add(ab);
  escena.add(g); return g;
}

// ---------- Cascada del Tequendama (final) ----------
export function crearCascada(escena, s) {
  const m = marco(s), g = new THREE.Group(); g.position.set(m.x + m.tx * 6, 0, m.z + m.tz * 6); g.rotation.y = Math.atan2(-m.tx, -m.tz);
  const caida = mesh(new THREE.PlaneGeometry(anchoRio(s) + 1, 60, 1, 1), new THREE.MeshBasicMaterial({ color: 0xeaf8fb, transparent: true, opacity: .9, side: THREE.DoubleSide, fog: false }));
  caida.position.set(0, -29.5, -2); g.add(caida);
  const niebla = [];
  for (let i = 0; i < 10; i++) { const n = mesh(new THREE.SphereGeometry(3 + i % 3, 7, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, fog: false })); n.position.set((i - 5) * 1.2, -8 - i * 5, -4); n.userData.f = i; g.add(n); niebla.push(n); }
  g.userData = { niebla }; escena.add(g); return g;
}
