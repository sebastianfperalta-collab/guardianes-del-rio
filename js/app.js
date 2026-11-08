import * as THREE from 'three';
import { Mirada } from './controles.js';
import { audio } from './audio.js';
import { TRAMOS, ESPECIES } from './datos.js';
import * as M from './mundo.js';
import * as O from './objetos.js';
import { crearDecor } from './decor.js';

const CFG = Object.assign({ basuraPorTramo: null, rapido: false, organizacion: '', contacto: '' }, window.CONFIG || {});
const Q = new URLSearchParams(location.search);
if (Q.get('rapido')) CFG.rapido = true;
const $ = (id) => document.getElementById(id);
const clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;

// ---------- sonidos extra ----------
Object.assign(audio, {
  salpicar() { this.ruido(0.35, { vol: 0.28, filtro: 2500, hasta: 500 }); this.tono(420, 0.12, { vol: 0.12, hasta: 900 }); },
  recoger() { this.salpicar(); this.tono(660, 0.1, { tipo: 'triangle', vol: 0.14, retardo: 0.05 }); this.tono(880, 0.14, { tipo: 'triangle', vol: 0.14, retardo: 0.12 }); },
  obturador() { this.ruido(0.05, { vol: 0.4, filtro: 5000 }); this.ruido(0.07, { vol: 0.3, filtro: 3000, retardo: 0.09 }); },
  sellar() { this.tono(150, 0.25, { tipo: 'square', vol: 0.12, hasta: 80 }); this.tono(520, 0.35, { tipo: 'triangle', vol: 0.2, retardo: 0.15 }); this.tono(780, 0.4, { tipo: 'triangle', vol: 0.2, retardo: 0.3 }); },
  trino() { const f = 2200 + Math.random() * 1400; for (let i = 0; i < 3; i++) this.tono(f + i * 220, 0.07, { vol: 0.05, hasta: f * 1.25, retardo: i * 0.1 }); },
  fanfarria() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tono(f, 0.5, { tipo: 'triangle', vol: 0.16, retardo: i * 0.13 })); },
  bien() { this.tono(784, 0.12, { tipo: 'triangle', vol: 0.18 }); this.tono(1175, 0.2, { tipo: 'triangle', vol: 0.18, retardo: 0.09 }); }
});

// ---------- escena ----------
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
const escena = new THREE.Scene();
escena.fog = new THREE.Fog(0x9a9272, 22, 150);
const camara = new THREE.PerspectiveCamera(68, 1, 0.1, 600);
const rig = new THREE.Group(); rig.add(camara); camara.position.set(0, 1.55, 0.35); escena.add(rig);
const mirada = new Mirada(camara);

const hemi = new THREE.HemisphereLight(0xd6ecff, 0x7a6a4a, 0.9); escena.add(hemi);
const sol = new THREE.DirectionalLight(0xfff0d0, 1.2); sol.position.copy(M.uniformes.uSol.value).multiplyScalar(50); escena.add(sol);

const cielo = M.crearCielo(); escena.add(cielo);
const agua = M.crearAgua(); escena.add(agua);
const orillas = M.crearOrillas(); orillas.forEach((o) => escena.add(o));
const flora = M.crearFlora(escena, innerWidth < 500 ? 0.8 : 1);
const decor = crearDecor(escena);
const barca = O.crearBarca(); rig.add(barca); barca.position.y = 0.0;
const bandada = O.crearBandada(escena, 14);
const luciernagas = O.crearLuciernagas(escena, 70);
const muelle = O.crearMuelle(escena, 0.004);
const cascada = O.crearCascada(escena, 0.985);

// ---------- estado ----------
const NT = M.N_TRAMOS, LARGO = M.LARGO, TR = LARGO / NT;
const est = {
  fase: 'inicio', dist: 0, vel: 0, retro: false, tramo: 0, completado: [], t: 0,
  total: 0, selladas: 0, bien: 0, clasificadas: 0, especies: new Set(), nombre: '', gateMsg: 0
};
M.iniciarLimpieza(TRAMOS.map((t) => t.estado0));
const finTramo = (t) => (t === NT - 1 ? LARGO * 0.982 : (t + 1) * TR - 3);

// basura, tuberías, ave
const cantidades = (CFG.basuraPorTramo || TRAMOS.map((t) => t.basura)).map((n) => (CFG.rapido ? Math.ceil(n / 2) : n));
const basura = [], tuberias = [];
for (let t = 0; t < NT; t++) {
  const desde = t / NT + (t === 0 ? 0.04 : 0.014), hasta = (t + 1) / NT - 0.022;
  basura.push(...O.crearBasura(escena, t, cantidades[t], desde, hasta, 100 + t * 57));
}
const tubDef = [[1, 0.31, 1], [3, 0.63, -1], [3, 0.72, 1]];
for (const [t, s, lado] of tubDef) { const tb = O.crearTuberia(escena, s, lado); tb.userData.tramo = t; tuberias.push(tb); }

const metaTramo = (t) => Math.ceil(cantidades[t] * 0.6) + tuberias.filter((x) => x.userData.tramo === t).length;
const hechoTramo = (t) => basura.filter((b) => b.userData.tramo === t && b.userData.recogida).length + tuberias.filter((x) => x.userData.tramo === t && x.userData.sellada).length;
const pendientes = (t) => [...basura.filter((b) => b.userData.tramo === t && !b.userData.recogida), ...tuberias.filter((x) => x.userData.tramo === t && !x.userData.sellada)];

// anillos guía
const anillos = new Map();
const anilloGeo = new THREE.RingGeometry(0.55, 0.66, 20); anilloGeo.rotateX(-Math.PI / 2);
for (const b of basura) { const r = new THREE.Mesh(anilloGeo, new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.8, fog: false })); r.position.y = 0.04; escena.add(r); anillos.set(b, r); }

// fauna
const fauna = [];
function addFauna(id, obj, s, lado, d, thr, esc = 1, tipo = 'tierra') {
  const hw = M.anchoRio(s) / 2; const p = M.puntoOrilla(s, lado, d < 0 ? hw * -d : hw + d);
  if (tipo === 'agua' || tipo === 'orilla') p.y = 0;
  obj.position.copy(p); obj.userData = { id, s, thr, esc, tipo, cx: p.x, cz: p.z, f: Math.random() * 6, lado, visible: 0, rev: false };
  obj.rotation.y = Math.random() * 6; obj.scale.setScalar(0.001); escena.add(obj); fauna.push(obj); return obj;
}
for (const s of [0.44, 0.52, 0.64, 0.8, 0.9]) for (let k = 0; k < 3; k++) addFauna('guapucha', O.crearPez(), s + k * 0.003, 1, -0.35, 0.5, 2.2, 'pez');
for (const [s, l] of [[0.46, 1], [0.72, -1], [0.9, 1]]) addFauna('garza', O.crearGarza(), s, l, -0.82, 0.6, 1.4, 'orilla');
for (const [s, l] of [[0.4, -1], [0.55, 1], [0.78, -1]]) addFauna('pato', O.crearPato(), s, l, -0.55, 0.5, 1.5, 'agua');
const tingua = addFauna('tingua', O.crearTingua(), 0.5, -1, -0.92, 9, 1.6, 'agua'); 
for (const s of [0.035, 0.07, 0.115, 0.17]) {
  const fr = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x7c6a3a, flatShading: true })); tr.position.y = 0.7; fr.add(tr);
  const h1 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.1, 8), new THREE.MeshLambertMaterial({ color: 0xaec394, flatShading: true })); h1.position.y = 1.8; fr.add(h1);
  const h2 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 8), new THREE.MeshLambertMaterial({ color: 0xc4d3ae, flatShading: true })); h2.position.y = 2.3; fr.add(h2);
  addFauna('frailejon', fr, s, s * 100 % 2 < 1 ? 1 : -1, 2.6, -1, 1.7);
}

// ave atrapada (tramo 2)
const aveAtrapada = (() => {
  const g = O.crearTingua(); const s = 0.505, hw = M.anchoRio(s) / 2, p = M.puntoOrilla(s, 1, hw - 0.4); p.y = 0.05;
  g.position.copy(p); g.scale.setScalar(1.5);
  const bolsa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), new THREE.MeshLambertMaterial({ color: 0xe6e6e6, transparent: true, opacity: 0.75, flatShading: true })); bolsa.position.y = 0.55; bolsa.scale.set(1.3, 0.9, 1.2); g.add(bolsa);
  g.userData = { tipo: 'ave', s, tramo: 2, libre: false, prog: 0, bolsa };
  escena.add(g); return g;
})();

// ---------- HUD ----------
let toastT = 0;
function toast(txt, ms = 2200) { const t = $('toast'); t.innerHTML = txt; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
let pistaT = 0;
function pista(txt, ms = 5000) { const p = $('pista'); clearTimeout(pistaT); if (!txt) { p.classList.add('oculto'); return; } p.textContent = txt; p.classList.remove('oculto'); pistaT = setTimeout(() => p.classList.add('oculto'), ms); }
function hud() {
  const t = est.tramo; $('t-nombre').textContent = TRAMOS[t].nombre; $('t-lugar').textContent = `Tramo ${t + 1} de ${NT} · ${TRAMOS[t].lugar}`;
  $('c-basura').textContent = Math.min(hechoTramo(t), metaTramo(t)); $('c-meta').textContent = metaTramo(t);
  let m = 0; for (let i = 0; i < M.NB; i++) m += M.limpieza[i]; m /= M.NB;
  const pct = Math.round(m * 100); $('rio-pct').textContent = pct + '%'; $('rio-fill').style.width = pct + '%';
  document.querySelectorAll('#ruta b').forEach((n, i) => { n.className = est.completado[i] ? 'hecho' : i === t ? 'actual' : ''; });
  $('album-n').textContent = est.especies.size;
}
const fichas = () => {
  $('album-grid').innerHTML = ESPECIES.map((e) => est.especies.has(e.id)
    ? `<div class="ficha"><span class="ic">${{ tingua: '🐦', guapucha: '🐟', garza: '🕊️', pato: '🦆', frailejon: '🌿' }[e.id]}</span><b>${e.nombre}</b><i>${e.cien}</i>${e.dato}</div>`
    : `<div class="ficha vacia">?</div>`).join('');
};
$('btn-album').onclick = () => { audio.boton(); fichas(); $('album').classList.remove('oculto'); est.pausaAlbum = true; };
$('album-x').onclick = () => { $('album').classList.add('oculto'); est.pausaAlbum = false; };
$('btn-mudo').onclick = () => { audio.silenciar(!audio.mudo); $('btn-mudo').textContent = audio.mudo ? '🔇' : '🔊'; };

// ---------- entrada ----------
const proyecto = new THREE.Vector3();
function pantalla(obj, dy = 0.3) {
  obj.getWorldPosition(proyecto); proyecto.y += dy; proyecto.project(camara);
  if (proyecto.z > 1 || proyecto.z < -1) return null;
  return { x: (proyecto.x * 0.5 + 0.5) * innerWidth, y: (-proyecto.y * 0.5 + 0.5) * innerHeight };
}
function cercano(lista, px, py, radio, maxDist, filtro) {
  let mejor = null, md = radio; const pos = rig.position;
  for (const o of lista) {
    if (!filtro(o)) continue;
    const w = o.getWorldPosition(new THREE.Vector3()); if (w.distanceTo(pos) > maxDist) continue;
    const u = o.userData || {}; const q = pantalla(o, u.tipo === 'pez' ? 0.1 : u.tipo === 'agua' ? 0.4 : u.esc ? u.esc * 0.6 : 0.3); if (!q) continue;
    const d = Math.hypot(q.x - px, q.y - py); if (d < md) { md = d; mejor = o; }
  }
  return mejor;
}
const VEL_BARCA = 3.4, RETRO_V = 2.4;
const ptr = { id: null, x: 0, y: 0, x0: 0, y0: 0, t0: 0, mov: 0, hold: null, hp: 0 };
lienzo.addEventListener('pointerdown', (e) => {
  if (est.fase !== 'viaje' && est.fase !== 'inicio') return;
  if (ptr.id !== null) return;
  ptr.id = e.pointerId; ptr.x = ptr.x0 = e.clientX; ptr.y = ptr.y0 = e.clientY; ptr.t0 = performance.now(); ptr.mov = 0; ptr.hold = null; ptr.hp = 0;
  lienzo.setPointerCapture(e.pointerId);
  if (est.fase === 'viaje') {
    const objetivos = [...tuberias, aveAtrapada];
    const o = cercano(objetivos, e.clientX, e.clientY, 90, 26, (x) => !(x.userData.sellada || x.userData.libre));
    if (o) {
      ptr.hold = o; const m = $('mantener'); m.style.display = 'block'; m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
      $('mantener-txt').textContent = o.userData.tipo === 'ave' ? '🐦' : '🔧';
    }
  }
});
lienzo.addEventListener('pointermove', (e) => {
  if (e.pointerId !== ptr.id) return;
  const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y; ptr.x = e.clientX; ptr.y = e.clientY; ptr.mov += Math.abs(dx) + Math.abs(dy);
  if (!ptr.hold || ptr.mov > 40) { if (ptr.hold) cancelarHold(); mirada.arrastrar(dx, dy); }
});
function cancelarHold() { ptr.hold = null; ptr.hp = 0; $('mantener').style.display = 'none'; $('mantener-arco').style.strokeDashoffset = 264; }
lienzo.addEventListener('pointerup', (e) => {
  if (e.pointerId !== ptr.id) return;
  const tap = ptr.mov < 14 && performance.now() - ptr.t0 < 450 && !ptr.hold; ptr.id = null;
  const habiaHold = ptr.hold; cancelarHold();
  if (tap && est.fase === 'viaje') tocar(e.clientX, e.clientY);
});
lienzo.addEventListener('pointercancel', () => { ptr.id = null; cancelarHold(); });

const ondas = [];
function onda(x, z, c = 0xffffff) {
  const g = new THREE.RingGeometry(0.3, 0.42, 24); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, fog: false })); m.position.set(x, 0.06, z); escena.add(m); ondas.push({ m, t: 0 });
}
function tocar(x, y) {
  const b = cercano(basura, x, y, 95, 34, (o) => !o.userData.recogida);
  if (b) return recoger(b);
  const f = cercano(fauna, x, y, 110, 60, (o) => o.visible && o.userData.visible > 0.55);
  if (f) return foto(f);
}
function recoger(b) {
  const u = b.userData; u.recogida = true; u.anim = 0; est.total++;
  est.hechos = est.hechos || {}; (est.recogidasTramo = est.recogidasTramo || [[], [], [], [], []])[u.tramo].push({ tipo: u.tipo, nombre: u.nombre, icono: u.icono });
  audio.recoger(); const p = b.getWorldPosition(new THREE.Vector3()); onda(p.x, p.z);
  M.limpiar(u.s, Math.min(0.42, 0.03 * (TR / Math.max(1, cantidades[u.tramo]))) * 1.0, 12);
  const pr = hechoTramo(u.tramo), meta = metaTramo(u.tramo);
  if (pr === meta) toast('¡Suficiente para seguir! Puedes recoger más 🌿');
  hud();
}
function capturar(x, y) {
  renderer.render(escena, camara);
  const W = lienzo.width, H = lienzo.height, k = W / innerWidth;
  const lado = Math.min(W, H) * 0.62, cx = x * k, cy = y * (H / innerHeight);
  const c = document.createElement('canvas'); c.width = 640; c.height = 640;
  const sx = Math.min(Math.max(0, cx - lado / 2), W - lado), sy = Math.min(Math.max(0, cy - lado / 2), H - lado);
  c.getContext('2d').drawImage(lienzo, sx, sy, lado, lado, 0, 0, 640, 640);
  return c.toDataURL('image/jpeg', 0.9);
}
function foto(f) {
  const id = f.userData.id; const nuevo = !est.especies.has(id); const e = ESPECIES.find((x) => x.id === id);
  const p = pantalla(f, f.userData.tipo === 'pez' ? 0.1 : 0.7) || { x: innerWidth / 2, y: innerHeight / 2 };
  audio.obturador(); const fl = $('flash'); fl.style.transition = 'none'; fl.style.opacity = '0.9'; requestAnimationFrame(() => { fl.style.transition = 'opacity .6s'; fl.style.opacity = '0'; });
  const img = e.foto || capturar(p.x, p.y);
  if (nuevo) est.especies.add(id);
  est.pausaFoto = true; cancelarHold();
  $('pol-img').src = img; $('pol-tag').textContent = nuevo ? '¡Nueva especie en tu libreta!' : 'Ya estaba en tu libreta';
  $('pol-nom').textContent = e.nombre; $('pol-cien').textContent = e.cien; $('pol-dato').textContent = e.dato;
  setTimeout(() => $('polaroid').classList.remove('oculto'), 120);
  if (nuevo) setTimeout(() => audio.exito(), 150);
  hud();
}
$('pol-btn').onclick = () => { audio.boton(); $('polaroid').classList.add('oculto'); est.pausaFoto = false; };

// ---------- llamados a la acción ----------
const cta = $('cta'); const _tv = new THREE.Vector3(); let ctaT = 0;
function updateCTA(dt) {
  ctaT -= dt; if (ctaT > 0) return; ctaT = 0.08;
  let best = null, bd = 1e9, txt = '', dy = 0.3;
  if (est.fase === 'viaje' && !ptr.hold) {
    for (const tb of tuberias) { const u = tb.userData; if (u.sellada || !tb.visible) continue; const d = tb.getWorldPosition(_tv).distanceTo(rig.position); if (d < 34 && d < bd) { bd = d; best = tb; txt = '🔧 Mantén presionado para tapar'; dy = 1.4; } }
    if (!aveAtrapada.userData.libre) { const d = aveAtrapada.getWorldPosition(_tv).distanceTo(rig.position); if (d < 34 && d < bd) { bd = d; best = aveAtrapada; txt = '🐦 Mantén presionado para liberar'; dy = 1.8; } }
    for (const f of fauna) { const u = f.userData; if (!(f.visible && u.visible > 0.55)) continue; const d = f.getWorldPosition(_tv).distanceTo(rig.position); if (d < 50 && d < bd) { bd = d; best = f; txt = '📷 Toca para fotografiar'; dy = u.tipo === 'pez' ? 0.3 : 0.9; } }
  }
  const q = best && pantalla(best, dy);
  if (!q) { cta.classList.add('oculto'); return; }
  cta.textContent = txt; cta.style.left = q.x + 'px'; cta.style.top = q.y + 'px'; cta.classList.remove('oculto');
}

// ---------- tramos: clasificación y tarjetas ----------
const reglas = O.CAJA;
const nombreCaja = { aprov: 'Aprovechable (plástico, vidrio, cartón, metal)', org: 'Orgánico', esp: 'Residuo especial (llantas, pilas, bombillos, electrónicos)' };
let cola = [], colaI = 0, alTerminarClas = null;
function clasificar(t, fin) {
  const todas = (est.recogidasTramo && est.recogidasTramo[t]) || [];
  const ord = [...todas].sort((a, b) => (a.tipo === 'llanta') - (b.tipo === 'llanta')).reverse();
  const vistos = new Set(); cola = [];
  for (const it of ord) { if (cola.length < 5 && !vistos.has(it.tipo + it.nombre)) { vistos.add(it.tipo + it.nombre); cola.push(it); } }
  for (const it of ord) if (cola.length < 4 && !cola.includes(it)) cola.push(it);
  colaI = 0; alTerminarClas = fin;
  if (!cola.length) return fin();
  est.fase = 'dialogo'; $('clasif').classList.remove('oculto'); mostrarItem();
}
function mostrarItem() {
  const it = cola[colaI]; $('cl-item').textContent = it.icono || O.ICONO[it.tipo]; $('cl-item').style.animation = 'none'; void $('cl-item').offsetWidth; $('cl-item').style.animation = '';
  $('cl-nombre').textContent = it.nombre; $('cl-msg').textContent = ''; $('cl-paso').textContent = `${colaI + 1} / ${cola.length}`;
  document.querySelectorAll('.caneca').forEach((b) => (b.disabled = false));
}
document.querySelectorAll('.caneca').forEach((b) => (b.onclick = () => {
  const it = cola[colaI], ok = reglas[it.tipo] === b.dataset.c; est.clasificadas++;
  document.querySelectorAll('.caneca').forEach((x) => (x.disabled = true));
  if (ok) { est.bien++; audio.bien(); $('cl-msg').textContent = '¡Muy bien! ✅'; } else { audio.error(); $('cl-msg').textContent = `Casi: ${it.nombre.toLowerCase()} va en «${nombreCaja[reglas[it.tipo]]}».`; }
  setTimeout(() => { colaI++; if (colaI >= cola.length) { $('clasif').classList.add('oculto'); alTerminarClas(); } else mostrarItem(); }, ok ? 650 : 1600);
}));
let alCerrarTarjeta = null;
function tarjeta(sup, tit, txt, fuente, btn, fn) {
  $('tj-sup').textContent = sup; $('tj-tit').textContent = tit; $('tj-txt').textContent = txt; $('tj-fuente').textContent = fuente ? 'Fuente: ' + fuente : ''; $('tj-btn').textContent = btn;
  alCerrarTarjeta = fn; $('tarjeta').classList.remove('oculto'); est.fase = 'dialogo';
}
$('tj-btn').onclick = () => { audio.boton(); $('tarjeta').classList.add('oculto'); const f = alCerrarTarjeta; alCerrarTarjeta = null; if (f) f(); };

function terminarTramo(t) {
  est.vel = 0; est.fase = 'dialogo'; pista(null); audio.timbre();
  clasificar(t, () => {
    M.sumarTramo(t, 0.14); est.completado[t] = true;
    const d = TRAMOS[t];
    tarjeta(`Tramo ${t + 1} de ${NT} completado`, d.nombre, d.dato + '\n\n' + d.cierre, d.fuente, t === NT - 1 ? 'Ver mi diploma' : 'Seguir río abajo', () => {
      if (t === NT - 1) return finalizar();
      est.tramo = t + 1; est.fase = 'viaje'; est.retro = false; hud(); toast(TRAMOS[t + 1].nombre);
    });
  });
}

// ---------- diploma ----------
async function finalizar() {
  est.fase = 'fin'; audio.fanfarria();
  try { await document.fonts.load('700 60px Fredoka'); await document.fonts.load('500 26px Fredoka'); } catch (e) { /* sigue */ }
  const c = document.createElement('canvas'); c.width = 1400; c.height = 990; const x = c.getContext('2d');
  const rr = (X, Y, W, H, R) => { x.beginPath(); x.moveTo(X + R, Y); x.arcTo(X + W, Y, X + W, Y + H, R); x.arcTo(X + W, Y + H, X, Y + H, R); x.arcTo(X, Y + H, X, Y, R); x.arcTo(X, Y, X + W, Y, R); x.closePath(); };
  const fondo = x.createLinearGradient(0, 0, 1400, 990); fondo.addColorStop(0, '#0f3a3d'); fondo.addColorStop(1, '#071b1f'); x.fillStyle = fondo; x.fillRect(0, 0, 1400, 990);
  // destellos
  for (let i = 0; i < 70; i++) { const px = (Math.sin(i * 91.7) * 0.5 + 0.5) * 1400, py = (Math.sin(i * 53.3) * 0.5 + 0.5) * 990, r = 1 + (i % 4); const g = x.createRadialGradient(px, py, 0, px, py, r * 4); g.addColorStop(0, 'rgba(120,255,225,.9)'); g.addColorStop(1, 'rgba(120,255,225,0)'); x.fillStyle = g; x.fillRect(px - r * 4, py - r * 4, r * 8, r * 8); }
  // olas
  for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(0, 800 + k * 28); for (let i = 0; i <= 1400; i += 10) x.lineTo(i, 800 + k * 28 + Math.sin(i / 70 + k * 1.3) * 14); x.lineTo(1400, 990); x.lineTo(0, 990); x.closePath(); x.fillStyle = ['rgba(69,232,203,.25)', 'rgba(40,150,170,.45)', 'rgba(20,90,120,.8)'][k]; x.fill(); }
  // marco de vidrio
  x.shadowColor = 'rgba(69,232,203,.8)'; x.shadowBlur = 30; x.strokeStyle = 'rgba(118,246,222,.9)'; x.lineWidth = 4; rr(50, 50, 1300, 890, 40); x.stroke();
  x.shadowBlur = 0; x.strokeStyle = 'rgba(118,246,222,.3)'; x.lineWidth = 2; rr(68, 68, 1264, 854, 30); x.stroke();
  // cápsula
  x.fillStyle = 'rgba(118,246,222,.14)'; rr(500, 112, 400, 56, 18); x.fill(); x.strokeStyle = 'rgba(118,246,222,.6)'; x.stroke();
  x.textAlign = 'center'; x.fillStyle = '#c4fbef'; x.font = '600 26px Fredoka'; x.fillText('LOGRO DESBLOQUEADO', 700, 150);
  x.shadowColor = 'rgba(69,232,203,.7)'; x.shadowBlur = 24; x.fillStyle = '#ffffff'; x.font = '700 100px Fredoka'; x.fillText('Guardián del Río', 700, 280); x.shadowBlur = 0;
  x.fillStyle = '#a6d6cd'; x.font = '500 30px Fredoka'; x.fillText('Se otorga a', 700, 345);
  x.shadowColor = 'rgba(255,180,70,.7)'; x.shadowBlur = 20; x.fillStyle = '#ffc45e'; x.font = '700 80px Fredoka'; x.fillText(est.nombre || 'Guardián', 700, 440); x.shadowBlur = 0;
  x.fillStyle = '#e6fffa'; x.font = '500 30px Fredoka';
  ['por recorrer el río Bogotá desde el páramo de Guacheneque', 'hasta el Salto del Tequendama.'].forEach((l, i) => x.fillText(l, 700, 510 + i * 42));
  // fichas de logros
  const logros = [['🗑️', est.total, 'residuos'], ['🔧', est.selladas, 'vertimientos'], ['📷', `${est.especies.size}/${ESPECIES.length}`, 'especies'], ['♻️', `${est.bien}/${est.clasificadas}`, 'bien clasificados']];
  logros.forEach(([ic, n, t], i) => {
    const X = 190 + i * 265, Y = 600;
    x.fillStyle = 'rgba(0,0,0,.28)'; rr(X, Y, 230, 140, 22); x.fill(); x.strokeStyle = 'rgba(118,246,222,.5)'; x.lineWidth = 2; x.stroke();
    x.font = '40px sans-serif'; x.fillText(ic, X + 50, Y + 62);
    x.fillStyle = '#ffffff'; x.font = '700 44px Fredoka'; x.textAlign = 'left'; x.fillText(String(n), X + 92, Y + 66);
    x.fillStyle = '#a6d6cd'; x.font = '500 22px Fredoka'; x.textAlign = 'center'; x.fillText(t, X + 115, Y + 112); x.fillStyle = '#e6fffa';
  });
  x.fillStyle = '#c4fbef'; x.font = '500 24px Fredoka';
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  x.fillText('Del páramo al Magdalena: un solo río, muchas manos.  ·  ' + fecha + (CFG.organizacion ? '  ·  ' + CFG.organizacion : ''), 700, 895);
  $('dip-img').src = c.toDataURL('image/png'); $('dip-desc').href = c.toDataURL('image/png');
  $('contacto').textContent = CFG.contacto; $('final').classList.remove('oculto');
}
$('dip-otra').onclick = () => { $('final').classList.add('oculto'); est.fase = 'viaje'; est.vel = 0; pista(null); toast('Sigue explorando el río 🌿'); };

// ---------- inicio / historia ----------
const hist = [
  'Mi abuelo contaba que de niño se bañaba en este río. Hoy casi nadie se le acerca.',
  'Pero el río sigue ahí, desde el páramo hasta el Salto del Tequendama, esperando que alguien lo cuide.',
  'Te presto mi barca y mi libreta. Recoge lo que no debería estar, clasifícalo y mira cómo vuelve la vida.'
];
let hi = 0;
function verHist() { $('hist').textContent = hist[hi] || '«Guardián… ¿cómo te llamas?»'; if (hi >= hist.length) { $('nombre-wrap').classList.remove('oculto'); $('btn-sig').textContent = 'Zarpar'; $('hist').style.minHeight = '40px'; } }
verHist();
$('btn-sig').onclick = async () => {
  if (hi < hist.length) { hi++; audio.iniciar(); audio.boton(); verHist(); return; }
  est.nombre = $('nombre').value.trim(); audio.iniciar(); audio.salpicar();
  await Mirada.pedirPermiso();
  mirada.centrar(); mirada.calibrar();
  $('inicio').classList.add('oculto'); $('hud').classList.remove('oculto');
  audio.ambiente(true, 700, 0.12);
  est.fase = 'viaje'; est.vel = 0; hud(); toast(TRAMOS[0].nombre, 2600);
  setTimeout(() => pista('Toca la basura que flota para recogerla · mira alrededor moviendo el celular', 9000), 1800);
};

// ---------- bucle ----------
function redim() { renderer.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.fov = innerWidth < innerHeight ? 75 : 62; camara.updateProjectionMatrix(); }
addEventListener('resize', redim); redim();

const reloj = new THREE.Clock(); let ultFlora = 0, ultTrino = 0, global = 0;
const cFogSucio = new THREE.Color(0x9a9272), cFogLimpio = new THREE.Color(0xcfe9ee);
const tmp = new THREE.Vector3();

function bucle() {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.1, reloj.getDelta()); est.t += dt; const t = est.t;
  M.uniformes.uTiempo.value = t;

  // movimiento de la barca
  if (est.fase === 'viaje' && !est.pausaAlbum && !est.pausaFoto) {
    const fin = finTramo(est.tramo), pend = pendientes(est.tramo);
    const cumple = hechoTramo(est.tramo) >= metaTramo(est.tramo);
    est.freno = lerp(est.freno ?? 1, ptr.hold ? 0.1 : 1, Math.min(1, dt * 3));
    let objetivo = (est.retro ? -RETRO_V : VEL_BARCA) * est.freno;
    if (est.dist > fin - 8 && !est.retro) objetivo = Math.max(0, VEL_BARCA * (fin - est.dist) / 8);
    if (est.dist >= fin - 0.4 && !cumple) {
      if (!est.retro) {
        const menor = Math.min(...pend.map((p) => p.userData.s)) * LARGO; est.retroHasta = menor - 16;
        if (pend.length && est.retroHasta < est.dist - 6) { est.retro = true; toast('Volvamos por lo que quedó atrás 🛶'); }
      }
    }
    if (est.retro && (pend.length === 0 || est.dist <= est.retroHasta)) { est.retro = false; est.vel = Math.max(0, est.vel); }
    est.vel += (objetivo - est.vel) * Math.min(1, dt * 1.6);
    est.dist = clamp(est.dist + est.vel * dt, 0, LARGO * 0.982);
    if (est.dist >= fin - 0.5 && cumple && Math.abs(est.vel) < 0.5 && est.fase === 'viaje') terminarTramo(est.tramo);
    if (!est.retro && est.dist < fin - 0.5) est.tramo = Math.max(est.tramo, Math.min(NT - 1, Math.floor(est.dist / TR)));
  }
  const s = est.dist / LARGO; const m = M.marco(s);
  rig.position.set(m.x, 0.12 + Math.sin(t * 1.4) * 0.03, m.z);
  rig.rotation.set(Math.sin(t * 1.1) * 0.012, Math.atan2(-m.tx, -m.tz), Math.sin(t * 0.9) * 0.02);
  barca.userData.remo.rotation.z = 0.7 + Math.sin(t * 1.3) * 0.07;
  mirada.update();

  // ambiente global
  let g = 0; for (const d of [-20, 0, 25]) g += M.limpiezaEn(clamp(s + d / LARGO, 0, 1)); g /= 3;
  global += (g - global) * Math.min(1, dt * 1.2);
  M.uniformes.uFogColor.value.copy(cFogSucio).lerp(cFogLimpio, global); escena.fog.color.copy(M.uniformes.uFogColor.value);
  M.uniformes.uFogFar.value = 150 + global * 50; escena.fog.far = M.uniformes.uFogFar.value; M.uniformes.uFogNear.value = escena.fog.near;
  cielo.material.uniforms.uSucio.value = 1 - global; cielo.material.uniforms.uNiebla.value.copy(cFogSucio);
  cielo.position.copy(rig.position);
  hemi.intensity = 0.75 + global * 0.45; sol.intensity = 0.85 + global * 0.75;
  decor.animar(t, rig.position, global);

  // flora
  ultFlora += dt; if (ultFlora > 0.1) { for (const f of flora) f.actualizar(s, 0.2, ultFlora); ultFlora = 0; }

  // basura y anillos
  for (const b of basura) {
    const u = b.userData, a = anillos.get(b), cerca = Math.abs(u.s - s) < 0.12;
    if (u.recogida) {
      if (u.anim !== undefined && u.anim < 1) { u.anim += dt * 2.2; const k = Math.min(1, u.anim); canastoPos(tmp); b.position.lerp(tmp, k * 0.25 + 0.05); b.scale.setScalar(1 - k * 0.6); b.position.y += 0.05; if (k >= 1) { b.visible = false; } }
      a.visible = false; continue;
    }
    b.visible = cerca; a.visible = cerca;
    if (!cerca) continue;
    b.position.y = 0.05 + Math.sin(t * 1.6 + u.f) * 0.05; b.rotation.y += dt * 0.3;
    a.position.set(b.position.x, 0.05, b.position.z); const k = 1 + Math.sin(t * 3 + u.f) * 0.12; a.scale.set(k, k, k);
  }
  // tuberías
  for (const tb of tuberias) {
    O.animarTuberia(tb, dt); tb.visible = Math.abs(tb.userData.s - s) < 0.15;
    if (!tb.userData.sellada && Math.abs(tb.userData.s - s) < 0.03 && est.fase === 'viaje') pista('Mantén presionada la tubería para sellarla');
  }
  // ave atrapada
  const au = aveAtrapada.userData;
  if (au.libre) { au.vuelo = (au.vuelo || 0) + dt; aveAtrapada.position.y += dt * 4; aveAtrapada.position.z -= dt * 3; au.bolsa.visible = false; if (au.vuelo > 3) aveAtrapada.visible = false; }
  else if (Math.abs(au.s - s) < 0.03 && est.fase === 'viaje') pista('¡Un ave atrapada! Mantén presionado para liberarla');

  // mantener presionado
  if (ptr.hold) {
    ptr.hp += dt / (ptr.hold.userData.tipo === 'ave' ? 1.6 : 2.0);
    $('mantener-arco').style.strokeDashoffset = 264 * (1 - Math.min(1, ptr.hp));
    if (Math.random() < 0.12) audio.tic();
    if (ptr.hp >= 1) {
      const o = ptr.hold; cancelarHold();
      if (o.userData.tipo === 'ave') {
        o.userData.libre = true; tingua.userData.thr = 0; audio.exito(); audio.trino(); toast('¡Liberaste a una tingua bogotana! 🐦<br><small style="text-transform:none;letter-spacing:0;font-size:12px">Tócala para fotografiarla</small>', 3800);
        tingua.userData.s = o.userData.s; M.limpiar(o.userData.s, 0.18, 14);
      } else {
        o.userData.sellada = true; est.selladas++; audio.sellar(); toast('¡Vertimiento sellado! 🔧'); M.limpiar(o.userData.s, 0.3, 22); const p = o.position; onda(p.x, p.z, 0x2ec4b6);
      }
      hud();
    }
  }

  updateCTA(dt);
  // fauna
  for (const f of fauna) {
    const u = f.userData; const c = M.limpiezaEn(u.s);
    const debe = u.id === 'frailejon' || (u.id === 'tingua' ? aveAtrapada.userData.libre : c > u.thr);
    f.visible = true; u.visible += ((debe ? 1 : 0) - u.visible) * Math.min(1, dt * 1.5);
    f.scale.setScalar(Math.max(0.0001, u.visible * u.esc));
    if (u.tipo === 'pez') { const a = t * 0.8 + u.f; f.position.set(u.cx + Math.cos(a) * 1.4, -0.12 + Math.sin(t * 2 + u.f) * 0.05, u.cz + Math.sin(a) * 1.4); f.rotation.y = -a; }
    else if (u.tipo === 'agua') { f.position.y = Math.sin(t * 1.5 + u.f) * 0.04; f.position.x = u.cx + Math.sin(t * 0.3 + u.f) * 0.5; }
    else if (u.id === 'garza') f.rotation.y += Math.sin(t * 0.4 + u.f) * 0.004;
    f.visible = u.visible > 0.02;
  }
  O.animarBandada(bandada, t, rig.position, Math.round(2 + global * 12));
  O.animarLuciernagas(luciernagas, t, rig.position, global);
  cascada.userData.niebla.forEach((n) => { n.position.y = -8 - ((n.userData.f * 5 + t * 6) % 50); n.material.opacity = 0.25; });
  ultTrino += dt; if (ultTrino > 2.5 + Math.random() * 3) { ultTrino = 0; if (global > 0.35 && !audio.mudo) audio.trino(); }
  for (let i = ondas.length - 1; i >= 0; i--) { const w = ondas[i]; w.t += dt; w.m.scale.setScalar(1 + w.t * 5); w.m.material.opacity = Math.max(0, 0.9 - w.t * 1.6); if (w.t > 0.6) { escena.remove(w.m); ondas.splice(i, 1); } }
  if ((est.fase === 'viaje' || est.fase === 'inicio') && Math.floor(t * 4) % 3 === 0) hudRapido();

  renderer.render(escena, camara);
}
let hudT = 0; function hudRapido() { if (t_ahora() - hudT > 0.5) { hudT = t_ahora(); if (est.fase === 'viaje') hud(); } }
function t_ahora() { return performance.now() / 1000; }
function canastoPos(v) { barca.userData.canasto.getWorldPosition(v); v.y += 0.4; }
bucle();

// ganchos de prueba
window.__demo = {
  renderer, est, M, basura, tuberias, fauna, aveAtrapada, rig, camara, mirada, ptr,
  irA(d) { est.dist = d; est.tramo = Math.min(NT - 1, Math.floor(d / TR)); },
  todoTramo() { for (const b of basura) if (b.userData.tramo === est.tramo && !b.userData.recogida) recoger(b); for (const x of tuberias) if (x.userData.tramo === est.tramo && !x.userData.sellada) { x.userData.sellada = true; est.selladas++; M.limpiar(x.userData.s, 0.3, 22); } hud(); },
  empezar() { $('inicio').classList.add('oculto'); $('hud').classList.remove('oculto'); audio.iniciar(); est.fase = 'viaje'; hud(); }
};
if (Q.get('tramo')) { window.__demo.empezar(); window.__demo.irA(+Q.get('tramo') * TR + 2); }
