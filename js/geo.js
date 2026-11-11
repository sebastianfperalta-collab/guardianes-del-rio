// Utilidades de modelado: fusiona piezas en una sola malla con color por vértice,
// degradado vertical (oclusión falsa), variación por cara y vértices desplazados.
import * as THREE from 'three';

const _c = new THREE.Color();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3();
export const h1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const h3 = (x, y, z) => { const k = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453; return k - Math.floor(k); };
export const M4 = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));

export class Lote {
  constructor() { this.P = []; this.C = []; this.N = []; }
  // color: hex o función (x,y,z)->hex evaluada en el centro de cada cara (espacio de la pieza)
  // o: { g:[abajo,arriba] degradado, var: variación de brillo por cara, jit: desplazamiento de vértices, suave: normales suaves }
  add(geo, color, local, global, o = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const p = g.attributes.position.array, nv = g.attributes.position.count;
    if (o.jit) for (let i = 0; i < nv; i++) {
      const x = Math.round(p[i * 3] * 500), y = Math.round(p[i * 3 + 1] * 500), z = Math.round(p[i * 3 + 2] * 500);
      p[i * 3] += (h3(x, y, z) - 0.5) * 2 * o.jit; p[i * 3 + 1] += (h3(y, z, x) - 0.5) * 2 * o.jit * (o.jitY ?? 1); p[i * 3 + 2] += (h3(z, x, y) - 0.5) * 2 * o.jit;
    }
    if (!g.attributes.normal || o.jit) g.computeVertexNormals();
    if (o.suave === 'esf') { const n = g.attributes.normal.array; for (let i = 0; i < nv; i++) { const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2], l = Math.hypot(x, y, z) || 1; n[i * 3] = x / l; n[i * 3 + 1] = y / l; n[i * 3 + 2] = z / l; } }
    if (local) g.applyMatrix4(local);
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < nv; i++) { const y = p[i * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const gr = o.g || [0.8, 1.08], fn = typeof color === 'function';
    const cols = new Float32Array(nv * 3);
    for (let t = 0; t < nv; t += 3) {
      const cx = (p[t * 3] + p[t * 3 + 3] + p[t * 3 + 6]) / 3, cy = (p[t * 3 + 1] + p[t * 3 + 4] + p[t * 3 + 7]) / 3, cz = (p[t * 3 + 2] + p[t * 3 + 5] + p[t * 3 + 8]) / 3;
      const v = o.var ? 1 + (h3(cx * 7.13, cy * 5.31, cz * 3.77) - 0.5) * o.var : 1;
      _c.setHex(fn ? color(cx, cy, cz) : color);
      for (let k = 0; k < 3; k++) {
        const i = t + k, y = p[i * 3 + 1];
        const f = (gr[0] + (gr[1] - gr[0]) * (y1 > y0 ? (y - y0) / (y1 - y0) : 1)) * v;
        cols[i * 3] = _c.r * f; cols[i * 3 + 1] = _c.g * f; cols[i * 3 + 2] = _c.b * f;
      }
    }
    if (global) g.applyMatrix4(global);
    const nn = g.attributes.normal.array;
    for (let t = 0; t < nv; t += 3) {
      if (!o.suave) {
        _a.fromArray(p, t * 3); _b.fromArray(p, t * 3 + 3); _d.fromArray(p, t * 3 + 6);
        _n.subVectors(_b, _a).cross(_d.sub(_a)).normalize();
      }
      for (let k = 0; k < 3; k++) {
        const i = (t + k) * 3;
        this.P.push(p[i], p[i + 1], p[i + 2]); this.C.push(cols[i], cols[i + 1], cols[i + 2]);
        if (o.suave) this.N.push(nn[i], nn[i + 1], nn[i + 2]); else this.N.push(_n.x, _n.y, _n.z);
      }
    }
    return this;
  }
  tri(a, b, c, hex, f = 1) {
    _a.fromArray(a); _b.fromArray(b); _d.fromArray(c); _n.subVectors(_b, _a).cross(_d.sub(_a)).normalize();
    _c.setHex(hex);
    for (const q of [a, b, c]) { this.P.push(q[0], q[1], q[2]); this.C.push(_c.r * f, _c.g * f, _c.b * f); this.N.push(_n.x, _n.y, _n.z); }
    return this;
  }
  quad(a, b, c, d, hex, f = 1) { this.tri(a, b, c, hex, f); this.tri(a, c, d, hex, f); return this; }
  // cara orientada hacia fuera de un punto de referencia
  quadDesde(ref, a, b, c, d, hex, f = 1, haciaRef = false) {
    _a.fromArray(a); _b.fromArray(b); _d.fromArray(c); _n.subVectors(_b, _a).cross(_d.sub(_a));
    const s = _n.x * (a[0] + c[0] - 2 * ref[0]) + _n.y * (a[1] + c[1] - 2 * ref[1]) + _n.z * (a[2] + c[2] - 2 * ref[2]);
    if ((s < 0) !== haciaRef) this.quad(a, d, c, b, hex, f); else this.quad(a, b, c, d, hex, f);
    return this;
  }
  get triangulos() { return this.P.length / 9; }
  geometria() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    return g;
  }
  malla(mat) {
    const m = new THREE.Mesh(this.geometria(), mat || new THREE.MeshLambertMaterial({ vertexColors: true }));
    return m;
  }
}

// Casco de canoa por secciones: tablas de colores, interior, borda y piso
export function casco(L, T, o = {}) {
  const { largo = 5, ancho = 1.05, alto = 0.5, punta = 0.42, NS = 14, K = 8,
    pal = [0xa8703a, 0x8f5b2e, 0xb57a42, 0x9a6433], dentro = [0xdcb980, 0xcfa96e], borda = 0x5e3d1e, piso = [0xc79b62, 0xb98a52], costillas = 0x8a5a2e } = o;
  const v = new THREE.Vector3();
  const P = (u, th, inn) => {
    const e = Math.abs(2 * u - 1), w = ancho * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.62);
    const yr = alto + punta * Math.pow(e, 2.4), yk = 0.02 + 0.3 * Math.pow(e, 3), a = th * Math.PI / 2;
    let x = w * Math.sign(a) * Math.pow(Math.abs(Math.sin(a)), 0.8), y = yk + (yr - yk) * Math.pow(1 - Math.cos(a), 0.9);
    if (inn) { x *= 0.9 * inn; y += 0.06 * Math.cos(a) + (inn < 1 ? 0.012 : 0); }
    v.set(x, y, (u - 0.5) * largo); if (T) v.applyMatrix4(T); return [v.x, v.y, v.z];
  };
  const eje = (u) => { v.set(0, alto * 0.7, (u - 0.5) * largo); if (T) v.applyMatrix4(T); return [v.x, v.y, v.z]; };
  for (let i = 0; i < NS; i++) {
    const u0 = i / NS, u1 = (i + 1) / NS, ref = eje((u0 + u1) / 2);
    for (let k = 0; k < K; k++) {
      const t0 = k / K * 2 - 1, t1 = (k + 1) / K * 2 - 1, banda = Math.min(k, K - 1 - k);
      const f = 0.86 + 0.14 * (Math.abs(t0 + t1) / 2) + (h1(i * 3.1 + k * 7.7) - 0.5) * 0.08;
      L.quadDesde(ref, P(u0, t0), P(u1, t0), P(u1, t1), P(u0, t1), pal[banda % pal.length], f);
      L.quadDesde(ref, P(u0, t0, 1), P(u1, t0, 1), P(u1, t1, 1), P(u0, t1, 1), dentro[banda % dentro.length], 0.78 + 0.22 * (Math.abs(t0 + t1) / 2), true);
    }
    // borda
    for (const sg of [-1, 1]) { const a = P(u0, sg), b = P(u1, sg), c = P(u1, sg, 1), d = P(u0, sg, 1); a[1] += 0.03; b[1] += 0.03; c[1] += 0.03; d[1] += 0.03; L.quadDesde([ref[0], ref[1] - 5, ref[2]], a, b, c, d, borda, 1.05); L.quadDesde(ref, P(u0, sg), P(u1, sg), b, a, borda, 0.9); }
  }
  // piso de tablas y costillas
  const F = 0.42;
  for (let i = 2; i < NS - 2; i++) {
    const u0 = i / NS, u1 = (i + 1) / NS;
    for (let q = 0; q < 4; q++) {
      const a0 = -F + q * F / 2, a1 = a0 + F / 2;
      const A = P(u0, -F, 1), B = P(u0, F, 1), C = P(u1, -F, 1), D = P(u1, F, 1);
      const mix = (p0, p1, t) => [p0[0] + (p1[0] - p0[0]) * t, p0[1] + 0.035, p0[2] + (p1[2] - p0[2]) * t];
      const t0 = (a0 + F) / (2 * F), t1 = (a1 + F) / (2 * F);
      L.quadDesde([A[0], A[1] - 5, A[2]], mix(A, B, t0), mix(C, D, t0), mix(C, D, t1), mix(A, B, t1), piso[q % 2], 0.92 + h1(i + q * 9) * 0.12);
    }
  }
  for (let i = 2; i < NS - 1; i += 2) {
    const u = i / NS, du = 0.012, ref = eje(u);
    for (let k = 0; k < K; k++) { const t0 = k / K * 2 - 1, t1 = (k + 1) / K * 2 - 1; if (Math.abs(t0 + t1) / 2 < F) continue; L.quadDesde(ref, P(u - du, t0, 0.96), P(u + du, t0, 0.96), P(u + du, t1, 0.96), P(u - du, t1, 0.96), costillas, 0.95, true); }
  }
  return L;
}
