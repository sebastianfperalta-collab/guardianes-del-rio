// Mundo: curva del río, agua, orillas, cielo y vegetación que crece con la limpieza
import * as THREE from 'three';
import { Lote, M4 } from './geo.js';

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
  uSol: { value: new THREE.Vector3(0.5, 0.75, -0.4).normalize() }, uLargo: { value: LARGO }
};
const nivelFog = `float f = smoothstep(uFogNear, uFogFar, length(vVista)); col = mix(col, uFogColor, f);`;

const RUIDO = `float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }`;

export function crearAgua() {
  const seg = 420, cols = 8; const pos = [], uv = [], idx = [];
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
    fragmentShader: `uniform float uTiempo, uLargo; uniform sampler2D uLimpia; uniform vec3 uFogColor, uSol; uniform float uFogNear,uFogFar;
      varying vec2 vUv; varying vec3 vVista; varying vec3 vMundo;
      ${RUIDO}
      float celdas(vec2 p, out float id){ vec2 i=floor(p), f=fract(p); float d=9.; id=0.;
        for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=vec2(h(i+g), h(i+g+17.3)); float dd=length(g+o-f); if(dd<d){ d=dd; id=h(i+g+5.1); } }
        return d; }
      void main(){
        float c = texture2D(uLimpia, vec2(vUv.x,.5)).r;
        float lado = abs(vUv.y), t = uTiempo;
        vec2 rio = vec2(vUv.y*4.8, vUv.x*uLargo);   // metros: a lo ancho y a lo largo de la corriente
        // ondas que bajan con la corriente
        vec2 a1 = vec2(rio.x*.9, rio.y*.45 + t*1.1), a2 = vec2(rio.x*2.1+4., rio.y + t*1.9);
        float n1 = vn(a1), n2 = vn(a2), n3 = vn(vec2(rio.x*.5-7., rio.y*.22 + t*.55));
        float w = n1*.55 + n2*.3 + n3*.15;
        float e = .3;
        float wx = (vn(a1+vec2(e*.9,0.))-n1)*.55 + (vn(a2+vec2(e*2.1,0.))-n2)*.3;
        float wz = (vn(a1+vec2(0.,e*.45))-n1)*.55 + (vn(a2+vec2(0.,e))-n2)*.3;
        vec3 nrm = normalize(vec3(-wx*1.8, 1., -wz*1.8));
        vec3 Vd = normalize(cameraPosition - vMundo);
        float fres = pow(1. - max(dot(Vd, nrm), 0.), 3.);
        // color según limpieza y profundidad (turquesa translúcido cuando está limpia)
        vec3 sucio = mix(vec3(.27,.21,.12), vec3(.40,.33,.20), smoothstep(.3,1.,lado));
        vec3 medio = mix(vec3(.10,.34,.38), vec3(.22,.55,.50), smoothstep(.3,1.,lado));
        vec3 limpio = mix(vec3(.02,.40,.60), vec3(.24,.86,.80), smoothstep(.15,.95,lado + (w-.5)*.3));
        // piedras del fondo visibles en la orilla
        float pid; float pd = celdas(rio*vec2(.85,.85) + nrm.xz*.25, pid);
        float piedra = smoothstep(.44,.30,pd) * step(.3,pid) * smoothstep(.40,.92,lado);
        limpio = mix(limpio, mix(vec3(.42,.66,.62), vec3(.80,.90,.78), pid), piedra*.6);
        limpio = mix(limpio, limpio*.72, smoothstep(.30,.46,pd)*smoothstep(.56,.44,pd)*step(.3,pid)*smoothstep(.40,.92,lado)*.6);
        vec3 col = mix(sucio, medio, smoothstep(0.,.5,c)); col = mix(col, limpio, smoothstep(.45,1.,c));
        col += (w-.5)*.10*(.4+c);
        // reflejo del cielo
        vec3 cieloC = mix(vec3(.60,.58,.48), vec3(.72,.91,1.), c);
        col = mix(col, cieloC, fres*(.22+.45*c));
        // red de luz tipo dibujo
        float red = smoothstep(.032,.0, abs(n1-n2)) * (.08+.42*c);
        col += vec3(.85,.97,1.)*red*(1.-lado*.3);
        // rachas de corriente
        float racha = smoothstep(.72,.82, vn(vec2(rio.x*1.6, rio.y*.12 + t*.9)));
        col = mix(col, vec3(.93,.98,1.), racha*(.07+.2*c));
        // destello del sol
        float sp = pow(max(dot(reflect(-uSol, nrm), Vd),0.), 70.);
        col += vec3(1.,.95,.8)*sp*(.25+1.3*c);
        // nata cuando está sucio
        float nata = smoothstep(.6,.74, vn(vec2(rio.x*.8+3., rio.y*.3 + t*.35))) * (1.-c);
        col = mix(col, vec3(.50,.46,.32), nata*.5);
        col = mix(col, col*.55, (1.-c)*.25*w);
        // espuma de orilla
        float borde = smoothstep(.8 + .1*n2, 1., lado);
        col = mix(col, mix(vec3(.78,.74,.60), vec3(1.), .25+.75*c), borde*(.55+.4*n1));
        float f = smoothstep(uFogNear,uFogFar,length(vVista)); col = mix(col,uFogColor,f);
        gl_FragColor = vec4(col,1.);
      }`
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; return m;
}

export function crearOrillas() {
  const E = [-1.4, -0.35, 0.02, 0.42, 0.88, 1.6, 3, 5, 7.5, 9.1, 10.9, 13, 18, 25, 34, 46, 62, 82];
  const K = E.length - 1, seg = 280; const meshes = [];
  for (const lado of [-1, 1]) {
    const pos = [], ss = [], tint = [], idx = [], hh = [];
    for (let i = 0; i <= seg; i++) {
      const s = i / seg, hw = anchoRio(s) / 2;
      for (let k = 0; k <= K; k++) {
        const muro = E[k] > 0 && E[k] < 12;
        const d = hw + E[k] + (muro ? (hash(i * 13.1 + k * 3.7 + lado) - 0.5) * 0.7 : 0);
        const p = puntoOrilla(s, lado, d); if (muro) p.y += (hash(i * 7.3 + k * 1.9 + lado) - 0.5) * 0.35; pos.push(p.x, p.y, p.z); ss.push(s); tint.push(hash(i * 31 + k * 7 + lado)); hh.push(alturaAcantilado(s, lado));
      }
    }
    for (let i = 0; i < seg; i++) for (let k = 0; k < K; k++) { const a = i * (K + 1) + k, b = a + K + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 1));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tint, 1));
    g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
    g.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      uniforms: uniformes, side: THREE.DoubleSide, extensions: { derivatives: true },
      vertexShader: `attribute float aS; attribute float aT; attribute float aH; varying float vS; varying float vT; varying float vH; varying vec3 vVista; varying vec3 vMundo;
        void main(){ vS=aS; vT=aT; vH=aH; vec4 mv=modelViewMatrix*vec4(position,1.); vVista=mv.xyz; vMundo=position; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D uLimpia; uniform vec3 uFogColor,uSol; uniform float uFogNear,uFogFar,uTiempo,uLargo;
        varying float vS; varying float vT; varying float vH; varying vec3 vVista; varying vec3 vMundo;
        ${RUIDO}
        void main(){
          float c = texture2D(uLimpia, vec2(vS,.5)).r;
          vec3 n = normalize(cross(dFdx(vMundo), dFdy(vMundo))); if(n.y<0.) n=-n;
          float dif = max(dot(n,uSol),0.);
          float roca = 1. - smoothstep(.55,.8,n.y);
          float al = vS*uLargo;
          // pasto suave con parches y florecitas
          float p1 = vn(vMundo.xz*.22), p2 = vn(vMundo.xz*1.7);
          vec3 verde = mix(vec3(.34,.67,.24), vec3(.60,.85,.33), p1);
          verde = mix(verde, vec3(.74,.90,.40), smoothstep(.62,.9,p2)*.5) * (.92 + .16*vT);
          vec3 seco = mix(vec3(.56,.50,.31), vec3(.46,.40,.27), p1);
          vec3 pasto = mix(seco, verde, smoothstep(.1,.7,c));
          vec2 cel = floor(vMundo.xz/11.); float hc = h(cel);
          float campo = step(.5,hc) * smoothstep(.84,.94,n.y) * smoothstep(.17,.24,vS) * (1.-smoothstep(.56,.61,vS)) * smoothstep(2.,3.5,vMundo.y);
          vec3 cult = hc>.84 ? vec3(.84,.72,.30) : hc>.67 ? vec3(.40,.66,.19) : vec3(.56,.42,.27);
          float surco = .82 + .18*step(.5, fract((hc>.67 ? vMundo.x : vMundo.z)*1.1));
          pasto = mix(pasto, mix(seco, cult*surco, .3+.7*c), campo*.9);
          vec2 fq = vMundo.xz*1.5, fi = floor(fq); float fh = h(fi);
          float punto = smoothstep(.17,.11, length(fract(fq)-.5 - (vec2(h(fi+3.1),h(fi+7.7))-.5)*.5)) * step(.7,fh) * smoothstep(.5,.9,c) * (1.-campo) * smoothstep(.8,.95,n.y);
          vec3 fcol = fh>.93 ? vec3(1.,.45,.62) : fh>.86 ? vec3(1.,.86,.25) : fh>.78 ? vec3(.78,.58,1.) : vec3(1.);
          pasto = mix(pasto, fcol, punto);
          float paramo = 1. - smoothstep(.12,.24,vS);
          pasto = mix(pasto, pasto*vec3(1.08,.96,.68) + vec3(.05,.03,0.), paramo*.5);
          pasto = mix(pasto, vec3(.42,.62,.40), smoothstep(8.,22.,vMundo.y)*.5);
          // muro de bloques de piedra clara apilados
          float fila = vMundo.y*1.05 + vn(vec2(al*.25, 1.7))*.45;
          float idf = floor(fila), ff = fract(fila);
          float ab = (al + h(vec2(idf,1.3))*9.) / (1.5 + h(vec2(idf,4.1))*1.3);
          float ida = floor(ab), fa = fract(ab), hb = h(vec2(ida, idf));
          vec3 rc = mix(vec3(.63,.53,.43), vec3(.88,.80,.66), hb);
          rc = mix(rc, vec3(.72,.72,.68), step(.8, h(vec2(ida+3.,idf))));
          float junta = smoothstep(.0,.08,ff)*smoothstep(1.,.92,ff)*smoothstep(.0,.05,fa)*smoothstep(1.,.95,fa);
          rc *= mix(.5,1.,junta) * (.9 + .18*ff);
          rc *= .93 + .14*vn(vec2(al*2.3, vMundo.y*4.));
          rc = mix(rc*.55, rc, smoothstep(-.1,1.1,vMundo.y));
          rc = mix(rc, vec3(.50,.48,.44), (1.-c)*.45);
          float musgo = smoothstep(.5,.78, vn(vec2(al*.8, vMundo.y*.9))) * c * smoothstep(.0,.5,n.y);
          rc = mix(rc, vec3(.34,.58,.22), musgo*.7);
          // enredaderas que cuelgan del borde y pasto que se asoma
          float cv = floor(al*1.4), lv = .5 + 2.8*h(vec2(cv,2.));
          float hoja = step(.3, vn(vec2(al*7., vMundo.y*3.5)));
          float vina = step(.42, h(vec2(cv,7.))) * smoothstep(vH - lv, vH - lv + .3, vMundo.y) * hoja * c;
          rc = mix(rc, mix(vec3(.18,.48,.17), vec3(.42,.74,.26), h(vec2(cv,5.))), vina*.92);
          rc = mix(rc, pasto, smoothstep(vH - .45, vH - .12, vMundo.y) * step(1.5, vH) * (.4+.6*c));
          vec3 col = mix(pasto, rc, roca);
          col *= vec3(.56,.60,.68) + vec3(1.,.94,.80)*.66*dif;
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
  const g = x.createLinearGradient(0, 0, 0, H / 2); g.addColorStop(0, '#2478c8'); g.addColorStop(0.5, '#6db8e8'); g.addColorStop(0.85, '#c4e9f6'); g.addColorStop(1, '#f2f7e6');
  x.fillStyle = g; x.fillRect(0, 0, W, H / 2); x.fillStyle = '#cfe9ee'; x.fillRect(0, H / 2, W, H / 2);
  // nubes pintadas con base sombreada
  const nube = (cx, cy, s) => {
    for (const dx of [0, -W, W]) {
      const px = cx + dx;
      x.fillStyle = '#c9dcec'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(px + (i - 2.5) * 26 * s, cy + 9 * s, 34 * s, 19 * s, 0, 0, 7); x.fill(); }
      x.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(px + (i - 2.5) * 25 * s, cy - Math.sin(i / 5 * Math.PI) * 24 * s, (25 + Math.sin(i * 2.3) * 9) * s, 0, 7); x.fill(); }
      x.fillStyle = 'rgba(255,244,214,.55)'; for (let i = 1; i < 5; i++) { x.beginPath(); x.arc(px + (i - 2.2) * 25 * s, cy - Math.sin(i / 5 * Math.PI) * 30 * s, 13 * s, 0, 7); x.fill(); }
    }
  };
  for (let i = 0; i < 24; i++) nube(hash(i * 3.3) * W, H * (0.17 + hash(i * 7.1) * 0.26), 0.7 + hash(i * 1.9) * 1.1);
  // cordilleras facetadas (periódicas para cerrar la costura) con bruma en la base
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
    const br = x.createLinearGradient(0, base - amp * 0.7, 0, base + 2); br.addColorStop(0, 'rgba(232,246,250,0)'); br.addColorStop(1, 'rgba(232,246,250,.55)');
    x.fillStyle = br; x.fillRect(0, base - amp * 0.7, W, amp * 0.7 + 2);
  };
  capa(H * 0.5, H * 0.14, '#a5cde0', '#93bed3', 0.3, 44);
  capa(H * 0.505, H * 0.095, '#7fb3c2', '#6ea2b4', 2.1, 36);
  capa(H * 0.51, H * 0.055, '#68a297', '#58917f', 4.4, 28);
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

// ---------- vegetación (color por vértice; el color de instancia solo matiza) ----------
const ico0 = new THREE.IcosahedronGeometry(1, 0), ico1 = new THREE.IcosahedronGeometry(1, 1);
const tetra = new THREE.TetrahedronGeometry(1), octa = new THREE.OctahedronGeometry(1), cil4 = new THREE.CylinderGeometry(1, 1, 1, 4);
const cono3 = new THREE.ConeGeometry(1, 1, 3), cono4 = new THREE.ConeGeometry(1, 1, 4), cil6 = new THREE.CylinderGeometry(1, 1, 1, 6);
const mul = (...ms) => ms.reduce((a, b) => a.clone().multiply(b));
export const GEOS = {
  pino() { // conífera de pisos redondeados
    const L = new Lote();
    L.add(new THREE.CylinderGeometry(0.11, 0.2, 1.3, 5, 1, true), 0x7a5230, M4(0, 0.65, 0), null, { var: 0.15, g: [0.65, 1] });
    const perfil = [[0.2, 1.0], [1.5, 1.08], [0.8, 2.4], [1.18, 2.42], [0.58, 3.45], [0.84, 3.48], [0.3, 4.5], [0.0, 4.95]];
    const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 8);
    { const n = g.attributes.normal.array, q = g.attributes.position.array; let d = 0; for (let i = 0; i < n.length; i += 3) d += n[i] * q[i] + n[i + 2] * q[i + 2]; if (d < 0) for (let i = 0; i < n.length; i++) n[i] = -n[i]; }
    L.add(g, (x, y) => (y > 3.3 ? 0x62c866 : y > 2.25 ? 0x52b85a : 0x45a851), null, null, { suave: true, g: [0.78, 1.12] });
    return L.geometria();
  },
  arbol() { // copa de masas redondas
    const L = new Lote();
    L.add(new THREE.CylinderGeometry(0.13, 0.26, 1.8, 6, 2, true), 0x7a5632, M4(0, 0.9, 0), null, { jit: 0.03, var: 0.15, g: [0.65, 1] });
    L.add(cono3, 0x7a5632, M4(0.35, 1.75, 0.05, 0, 0, -0.75, 0.09, 1.0, 0.09)); L.add(cono3, 0x7a5632, M4(-0.3, 1.8, 0.2, 0.3, 0, 0.7, 0.08, 0.9, 0.08));
    [[0, 2.6, 0, 1.25, 0x6cc04a, ico1], [0.92, 2.15, 0.1, 0.9, 0x7fd05a, ico0], [-0.82, 2.25, 0.4, 0.86, 0x5cb044, ico0], [0.1, 3.1, -0.5, 0.76, 0x8ad863, ico0], [-0.2, 2.05, -0.85, 0.72, 0x58aa42, ico0]]
      .forEach(([x, y, z, r, c, g], i) => L.add(g, c, M4(x, y, z, i, i * 2, 0, r, r * 0.88, r), null, { suave: 'esf', jit: 0.07, g: [0.66, 1.12] }));
    return L.geometria();
  },
  sauce() { // sauce llorón de la ribera
    const L = new Lote();
    L.add(new THREE.CylinderGeometry(0.14, 0.3, 2.6, 6, 2), 0x5e4a30, M4(0.1, 1.3, 0, 0, 0, -0.08), null, { jit: 0.04, var: 0.15, g: [0.65, 1] });
    L.add(ico1, 0x8cc65a, M4(0.2, 3.3, 0, 0, 0, 0, 1.75, 1.0, 1.75), null, { suave: 'esf', jit: 0.06, g: [0.7, 1.12] });
    for (let i = 0; i < 13; i++) {
      const a = i / 13 * 6.283, r = 1.25 + h1v(i) * 0.4, h = 1.5 + h1v(i * 3) * 1.1;
      L.add(cono4, i % 2 ? 0x9fd067 : 0x7fb84f, M4(0.2 + Math.cos(a) * r, 3.15 - h / 2, Math.sin(a) * r, Math.PI, a, 0, 0.2, h, 0.2), null, { g: [1.12, 0.7], var: 0.1 });
    }
    return L.geometria();
  },
  arbusto() {
    const L = new Lote();
    [[0, 0.42, 0, 0.62, 0x58aa42], [0.5, 0.32, 0.15, 0.46, 0x6cc04a]].forEach(([x, y, z, r, c], i) => L.add(ico0, c, M4(x, y, z, i, i * 1.7, 0, r, r * 0.85, r), null, { suave: 'esf', g: [0.6, 1.12] }));
    [[0.15, 0.97, 0.2], [-0.3, 0.7, 0.1], [0.6, 0.7, -0.05]].forEach(([x, y, z]) => L.add(tetra, 0xffffff, M4(x, y, z, 0, 0, 0, 0.1)));
    return L.geometria();
  },
  espiga() { // flor alta en espiga (el color lo da la instancia)
    const L = new Lote();
    L.add(cono3, 0x2f5a22, M4(0, 0.3, 0, 0, 0, 0, 0.025, 0.6, 0.025));
    for (let i = 0; i < 4; i++) { const g = new THREE.ConeGeometry(0.13 - i * 0.022, 0.2, 5, 1, true); L.add(g, 0xffffff, M4(0, 0.5 + i * 0.15, 0, 0, i * 0.6, 0), null, { g: [0.7, 1.1] }); }
    for (const a of [0.4, 3.5]) L.add(tetra, 0x2c5a24, mul(M4(0, 0.02, 0, 0, a, 0), M4(0.2, 0.1, 0, 0, 0, 0.5, 0.24, 0.02, 0.09)));
    return L.geometria();
  },
  mata() { // planta de hojas anchas
    const L = new Lote();
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + h1v(i) * 0.5, t = 0.45 + h1v(i * 3) * 0.5;
      L.add(octa, i % 2 ? 0x4fae4a : 0x62c055, mul(M4(0, 0.05, 0, 0, a, 0), M4(0, 0, 0, 0, 0, -t), M4(0, 0.3, 0, 0, 0, 0, 0.15, 0.34, 0.03)), null, { g: [0.62, 1.15] }); }
    return L.geometria();
  },
  helecho() { // helecho bajo de frondas arqueadas
    const L = new Lote();
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + h1v(i + 4) * 0.4, T = M4(0, 0.05, 0, 0, a, 0), c = i % 2 ? 0x3f9e44 : 0x55b84e;
      L.add(cono3, c, mul(T, M4(0, 0, 0, 0, 0, -0.75), M4(0, 0.3, 0, 0, 0, 0, 0.18, 0.6, 0.03)), null, { g: [0.7, 1.1] });
      L.add(cono3, c, mul(T, M4(0.4, 0.42, 0, 0, 0, -1.75), M4(0, 0.26, 0, 0, 0, 0, 0.14, 0.52, 0.025)), null, { g: [1.0, 0.8] }); }
    return L.geometria();
  },
  piedras() { // guijarros claros de la orilla
    const L = new Lote();
    [[0, 0.1, 0, 0.34, 0xd9d2c2], [0.42, 0.07, 0.18, 0.22, 0xc4bfb2], [-0.3, 0.06, 0.3, 0.2, 0xe6e0d2]].forEach(([x, y, z, r, c], i) => L.add(ico0, c, M4(x, y, z, i, i * 2.1, 0, r, r * 0.6, r * 0.85), null, { suave: 'esf', g: [0.7, 1.08] }));
    return L.geometria();
  },
  pasto() {
    const L = new Lote();
    for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + h1v(i), t = 0.15 + h1v(i * 5) * 0.45, h = 0.5 + h1v(i * 2) * 0.5;
      L.add(cono3, i % 2 ? 0x7cc24f : 0x65ad42, mul(M4(0, 0, 0, 0, a, 0), M4(0.05, 0, 0, 0, 0, -t), M4(0, h / 2, 0, 0, 0, 0, 0.055, h, 0.03)), null, { g: [0.5, 1.15] }); }
    return L.geometria();
  },
  junco() {
    const L = new Lote();
    for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + h1v(i + 9), t = 0.05 + h1v(i * 5 + 2) * 0.3, h = 1.2 + h1v(i * 2 + 1) * 0.8;
      L.add(cono3, i % 2 ? 0x7fa83e : 0x97b24c, mul(M4(0, 0, 0, 0, a, 0), M4(0.08, 0, 0, 0, 0, -t), M4(0, h / 2, 0, 0, 0, 0, 0.06, h, 0.035)), null, { g: [0.5, 1.12] }); }
    for (const [x, z, h] of [[0.05, 0.02, 1.7]]) { L.add(cono3, 0x86a646, M4(x, h / 2, z, 0, 0, 0, 0.022, h, 0.022)); L.add(cil4, 0x6b4426, M4(x, h - 0.05, z, 0, 0, 0, 0.055, 0.34, 0.055), null, { g: [0.8, 1.1] }); }
    return L.geometria();
  },
  lirio() {
    const L = new Lote(); const g = new THREE.CircleGeometry(0.75, 10, 0.35, 5.6); g.rotateX(-Math.PI / 2);
    L.add(g, 0x4aa84a, M4(0, 0.05, 0), null, { var: 0.2, g: [1, 1] }); const g2 = new THREE.RingGeometry(0.68, 0.76, 10, 1, 0.35, 5.6); g2.rotateX(-Math.PI / 2);
    L.add(g2, 0x2f8a3e, M4(0, 0.056, 0), null, { g: [1, 1] });
    return L.geometria();
  },
  loto() {
    const L = new Lote(); const g = new THREE.CircleGeometry(0.8, 10, 0.35, 5.6); g.rotateX(-Math.PI / 2);
    L.add(g, 0x55b052, M4(0, 0.05, 0), null, { var: 0.2, g: [1, 1] });
    for (let i = 0; i < 6; i++) L.add(cono3, 0xffffff, mul(M4(0.1, 0.07, -0.05, 0, i / 6 * 6.283, 0), M4(0, 0, 0, 0, 0, -1.0), M4(0, 0.17, 0, 0, 0, 0, 0.09, 0.36, 0.03)), null, { g: [0.85, 1.15] });
    for (let i = 0; i < 4; i++) L.add(cono3, 0xfff4f8, mul(M4(0.1, 0.09, -0.05, 0, i / 4 * 6.283 + 0.4, 0), M4(0, 0, 0, 0, 0, -0.45), M4(0, 0.15, 0, 0, 0, 0, 0.07, 0.3, 0.03)), null, { g: [0.9, 1.15] });
    L.add(tetra, 0xffd34d, M4(0.1, 0.16, -0.05, 0, 0, 0, 0.08));
    return L.geometria();
  },
  flor() {
    const L = new Lote();
    L.add(cono3, 0x2f5a22, M4(0, 0.22, 0, 0, 0, 0, 0.022, 0.44, 0.022));
    const pet = new THREE.ConeGeometry(0.15, 0.09, 5, 1, true); pet.rotateX(Math.PI);
    L.add(pet, 0xffffff, M4(0, 0.47, 0), null, { g: [0.75, 1.1] });
    L.add(tetra, 0xb08a1a, M4(0, 0.49, 0, 0, 0, 0, 0.05));
    return L.geometria();
  },
  frailejon() { // Espeletia: tronco con hojas secas, roseta plateada y flores amarillas
    const L = new Lote();
    L.add(new THREE.CylinderGeometry(0.2, 0.3, 1.3, 6, 2, true), 0x5a4a32, M4(0, 0.65, 0), null, { jit: 0.05, var: 0.3, g: [0.7, 1.05] });
    L.add(new THREE.ConeGeometry(0.42, 0.55, 6, 1, true), 0x7a6844, M4(0, 1.12, 0), null, { jit: 0.04, var: 0.25, g: [0.75, 1.05] });
    const hoja = (a, t, h, c) => L.add(cono4, c, mul(M4(0, 1.3, 0, 0, a, 0), M4(0, 0, 0, 0, 0, -t), M4(0, h / 2, 0, 0, 0, 0, 0.12, h, 0.04)), null, { g: [0.72, 1.14] });
    for (let i = 0; i < 8; i++) hoja(i / 8 * 6.283, 1.15, 0.95, i % 2 ? 0xb4c49a : 0xa6b78c);
    for (let i = 0; i < 7; i++) hoja(i / 7 * 6.283 + 0.35, 0.72, 1.05, i % 2 ? 0xc6d4b0 : 0xbccaa4);
    for (let i = 0; i < 4; i++) hoja(i / 4 * 6.283 + 0.15, 0.3, 0.95, 0xd6e0c4);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.283 + 0.6, T = mul(M4(0, 1.35, 0, 0, a, 0), M4(0, 0, 0, 0, 0, -0.42));
      L.add(cono3, 0xb9c49a, M4(0, 0.6, 0, 0, 0, 0, 0.03, 1.2, 0.03), T);
      L.add(octa, 0xffd92e, M4(0, 1.22, 0, 0, 0, 0, 0.13, 0.08, 0.13), T, { g: [0.85, 1.1] }); L.add(octa, 0xf2c21a, M4(0.1, 1.05, 0.03, 0, 0, 0, 0.09, 0.055, 0.09), T); L.add(octa, 0xffd92e, M4(-0.09, 0.95, -0.04, 0, 0, 0, 0.08, 0.05, 0.08), T);
    }
    return L.geometria();
  },
  roca() { // bloques facetados claros con musgo arriba
    const L = new Lote(), d = new THREE.DodecahedronGeometry(1, 0);
    const piel = (x, y) => (y > 0.66 ? 0x9cc07a : 0xe6ddca);
    L.add(d, piel, M4(0, 0, 0, 0.3, 0.4, 0, 1, 0.9, 0.95), null, { jit: 0.08, var: 0.12, g: [0.8, 1.1] });
    L.add(d, piel, M4(0.85, -0.25, 0.3, 1, 2, 0, 0.55, 0.5, 0.6), null, { jit: 0.06, var: 0.12, g: [0.8, 1.1] });
    return L.geometria();
  }
};
function h1v(n) { return hash(n * 1.37 + 0.11); }

// material con vaivén de viento (k = amplitud por altura al cuadrado)
function matFlora(k = 0, extra = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, ...extra });
  if (k) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTiempo = uniformes.uTiempo;
      sh.vertexShader = 'uniform float uTiempo;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float fz_ = instanceMatrix[3].x*.37 + instanceMatrix[3].z*.23; float y_ = max(position.y, 0.);
          transformed.x += sin(uTiempo*1.3 + fz_) * ${k.toFixed(4)} * y_*y_;
          transformed.z += cos(uTiempo*1.05 + fz_*1.3) * ${(k * 0.6).toFixed(4)} * y_*y_;
        #endif`);
    };
    m.customProgramCacheKey = () => 'flora' + k;
  }
  return m;
}

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
  const grupos = [], N = (n) => Math.round(n * cantidad);
  const pinos = new Grupo(GEOS.pino(), matFlora(0.004), N(290), { minEsc: 0.35 });
  const arboles = new Grupo(GEOS.arbol(), matFlora(0.006), N(210), { minEsc: 0.3 });
  const sauces = new Grupo(GEOS.sauce(), matFlora(0.008), N(60), { minEsc: 0.3 });
  const arbustos = new Grupo(GEOS.arbusto(), matFlora(0.03), N(280), { minEsc: 0.25 });
  const pastos = new Grupo(GEOS.pasto(), matFlora(0.12), N(330), { minEsc: 0.2 });
  const juncos = new Grupo(GEOS.junco(), matFlora(0.03), N(260), { minEsc: 0 });
  const lirios = new Grupo(GEOS.lirio(), matFlora(0, { side: THREE.DoubleSide }), 200, { minEsc: 0 });
  const lotos = new Grupo(GEOS.loto(), matFlora(0, { side: THREE.DoubleSide }), 72, { minEsc: 0 });
  const flores = new Grupo(GEOS.flor(), matFlora(0.1), N(380), { minEsc: 0 });
  const frail = new Grupo(GEOS.frailejon(), matFlora(0.004), 42, { minEsc: 0.6 });
  const rocas = new Grupo(GEOS.roca(), matFlora(0), N(170), { fija: true, alto: 0.7 });
  const espigas = new Grupo(GEOS.espiga(), matFlora(0.08), N(230), { minEsc: 0 });
  const matas = new Grupo(GEOS.mata(), matFlora(0.05), N(170), { minEsc: 0.15 });
  const helechos = new Grupo(GEOS.helecho(), matFlora(0.05), N(210), { minEsc: 0.1 });
  const piedras = new Grupo(GEOS.piedras(), matFlora(0), N(230), { fija: true });
  grupos.push(pinos, arboles, sauces, arbustos, pastos, juncos, lirios, lotos, flores, frail, rocas, espigas, matas, helechos, piedras);

  const matiz = [0xffffff, 0xe6f2dc, 0xf6ffe0, 0xd6e8d2, 0xfff6dc];
  const lad = (i, k) => (hash(i * k) < 0.5 ? -1 : 1);
  for (let i = 0; i < pinos.n; i++) {
    const s = hash(i * 3.1), lado = lad(i, 5.3), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.6 + Math.pow(hash(i * 7.7), 1.4) * 58);
    pinos.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 9.1) * 1.1 + (p.y > 6 ? 0.4 : 0), 0.15 + hash(i * 2.2) * 0.55); pinos.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < arboles.n; i++) {
    const s = hash(i * 4.1 + 50), lado = lad(i + 9, 6.3), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.6 + Math.pow(hash(i * 8.7 + 3), 1.3) * 45);
    arboles.poner(i, p, s, hash(i + 11) * 6.28, 0.8 + hash(i * 3.3) * 0.9, 0.2 + hash(i * 5.2) * 0.55); arboles.color(i, matiz[(i * 3) % 5]);
  }
  for (let i = 0; i < sauces.n; i++) {
    const s = 0.2 + hash(i * 5.7 + 2) * 0.6, lado = lad(i + 4, 3.9), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.5 + hash(i * 2.3 + 8) * 3.5);
    sauces.poner(i, p, s, hash(i + 21) * 6.28, 0.85 + hash(i * 3.7) * 0.5, 0.3 + hash(i * 6.2) * 0.45); sauces.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < arbustos.n; i++) {
    const s = hash(i * 2.7 + 31), lado = lad(i + 2, 7.1), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.2 + Math.pow(hash(i * 5.1 + 6), 1.6) * 34);
    arbustos.poner(i, p, s, hash(i + 5) * 6.28, 0.7 + hash(i * 4.3) * 1.0, 0.15 + hash(i * 3.2) * 0.5); arbustos.color(i, matiz[(i * 2) % 5]);
  }
  for (let i = 0; i < pastos.n; i++) {
    const s = hash(i * 1.7 + 12), lado = lad(i + 7, 2.9), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.1 + Math.pow(hash(i * 6.3 + 4), 1.5) * 16);
    pastos.poner(i, p, s, hash(i + 3) * 6.28, 0.8 + hash(i * 2.9) * 1.0, 0.1 + hash(i * 7.2) * 0.5); pastos.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < juncos.n; i++) {
    const s = hash(i * 2.9 + 7), lado = lad(i, 4.7), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw - 0.8 + hash(i * 6.1) * 0.8); p.y = -0.12;
    juncos.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 1.7) * 0.8, 0.35 + hash(i * 3.7) * 0.5); juncos.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < lirios.n; i++) {
    const s = 0.05 + hash(i * 3.7 + 1) * 0.95, hw = anchoRio(s) / 2, lado = lad(i, 5.9);
    const p = puntoOrilla(s, lado, hw * (0.2 + hash(i * 7.1) * 0.62)); p.y = 0.02;
    lirios.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 2.3) * 0.7, 0.45 + hash(i * 4.3) * 0.45); lirios.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < lotos.n; i++) {
    const s = 0.08 + hash(i * 6.1 + 4) * 0.9, hw = anchoRio(s) / 2, lado = lad(i + 1, 3.3);
    const p = puntoOrilla(s, lado, hw * (0.3 + hash(i * 5.3) * 0.5)); p.y = 0.02;
    lotos.poner(i, p, s, hash(i + 2) * 6.28, 0.8 + hash(i * 1.3) * 0.5, 0.55 + hash(i * 2.3) * 0.35); lotos.color(i, i % 3 ? 0xffffff : 0xffc4dc);
  }
  const fcol = [0xffd34d, 0xc58bff, 0xffffff, 0xff8fb3, 0xff9a4d];
  for (let i = 0; i < flores.n; i++) {
    const s = hash(i * 1.9 + 77), lado = lad(i, 8.1), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.3 + hash(i * 3.3) * 8);
    flores.poner(i, p, s, hash(i * 4.4) * 6.28, 1.0 + hash(i * 1.3) * 0.9, 0.5 + hash(i * 9.7) * 0.45); flores.color(i, fcol[i % 5]);
  }
  for (let i = 0; i < frail.n; i++) {
    const s = hash(i * 1.1 + 5) * 0.27, lado = lad(i, 4.4), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 3 + hash(i * 3.9) * 30);
    frail.poner(i, p, s, hash(i) * 6.28, 0.8 + hash(i * 2.1) * 0.8, 0.2 + hash(i * 3.1) * 0.4); frail.color(i, matiz[i % 3]);
  }
  for (let i = 0; i < rocas.n; i++) {
    const s = hash(i * 6.7 + 13), lado = lad(i, 2.3), hw = anchoRio(s) / 2;
    const enAgua = hash(i * 9.9) < .22;
    const p = enAgua ? puntoOrilla(s, lado, hw * (0.62 + hash(i * 3.3) * 0.33)) : puntoOrilla(s, lado, hw + hash(i * 3.1) * 14);
    if (enAgua) { p.y = 0; rocasAgua.push({ x: p.x, z: p.z, r: 0.5 + Math.pow(hash(i * 7.3), 2) * 2.4 }); }
    rocas.poner(i, p, s, hash(i) * 6.28, enAgua ? 0.5 + Math.pow(hash(i * 7.3), 2) * 2.4 : 0.4 + Math.pow(hash(i * 7.3), 2) * 1.3, 0);
    rocas.esc[i] = 1; rocas.escribir(i);
    rocas.color(i, [0xffffff, 0xf4eee2, 0xfaf6ee, 0xe8e2d4][i % 4]);
  }
  const ecol = [0xff5a5a, 0xff8fc0, 0x8f7bff, 0xffd34d, 0xff7a3a, 0xffffff];
  for (let i = 0; i < espigas.n; i++) {
    const s = hash(i * 2.3 + 41), lado = lad(i + 3, 6.7), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.15 + Math.pow(hash(i * 4.9), 1.6) * 9);
    espigas.poner(i, p, s, hash(i * 3.1) * 6.28, 0.9 + hash(i * 1.9) * 0.9, 0.45 + hash(i * 8.3) * 0.45); espigas.color(i, ecol[i % 6]);
  }
  for (let i = 0; i < matas.n; i++) {
    const s = hash(i * 3.3 + 19), lado = lad(i + 5, 5.1), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.1 + Math.pow(hash(i * 2.9), 1.5) * 7);
    matas.poner(i, p, s, hash(i * 2.1) * 6.28, 0.9 + hash(i * 6.1) * 1.0, 0.2 + hash(i * 4.7) * 0.5); matas.color(i, matiz[i % 5]);
  }
  for (let i = 0; i < helechos.n; i++) {
    const s = i % 3 ? hash(i * 1.3 + 23) : 0.78 + hash(i * 1.3 + 23) * 0.21, lado = lad(i + 8, 3.7), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw + 1.05 + Math.pow(hash(i * 5.7), 1.5) * 8);
    helechos.poner(i, p, s, hash(i * 4.1) * 6.28, 0.9 + hash(i * 3.9) * 1.1, 0.2 + hash(i * 2.7) * 0.5); helechos.color(i, matiz[(i * 2) % 5]);
  }
  for (let i = 0; i < piedras.n; i++) {
    const s = hash(i * 4.7 + 61), lado = lad(i + 6, 4.3), hw = anchoRio(s) / 2;
    const p = puntoOrilla(s, lado, hw - 0.5 + hash(i * 3.7) * 1.0); p.y = Math.max(p.y, -0.02);
    piedras.poner(i, p, s, hash(i * 2.9) * 6.28, 0.8 + hash(i * 5.1) * 1.2, 0); piedras.esc[i] = 1; piedras.escribir(i); piedras.color(i, [0xffffff, 0xf2ece0, 0xe4ded2][i % 3]);
  }
  for (const g of grupos) { g.mesh.instanceMatrix.needsUpdate = true; if (g.mesh.instanceColor) g.mesh.instanceColor.needsUpdate = true; escena.add(g.mesh); }
  return grupos;
}
