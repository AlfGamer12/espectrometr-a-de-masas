// Bomba de vacío previo: rotatoria de paletas en baño de aceite (por defecto) o de membrana sin aceite (p.tipo = 'membrana').
// Paletas: rotor excéntrico tangente al estátor por arriba; dos paletas opuestas dividen el espacio en cámaras. Cada cámara aspira
// gas mientras crece, queda aislada, se comprime al estrecharse contra el punto de tangencia y sale por la válvula de escape cuando
// supera la presión atmosférica. Las moléculas dibujadas son fijas en coordenadas de cada cámara, así que se apiñan al comprimirse.
// Membrana: una biela sobre una excéntrica mueve la membrana; dos válvulas de láminas abren según la presión.
// Todo es función de t (sin estado). Parámetros:
//   p.tipo ('paletas' | 'membrana'), p.funcion (texto: qué evacúa en el equipo), p.dato (texto opcional con un dato documentado del equipo,
//   p. ej. 'velocidad de bombeo 65 m³/h' o 'vacío previo ≈ 2 mbar'), p.final (texto opcional: presión final, p. ej. '≈ 10⁻²–10⁻³ Torr').
import { tramo, suave, lerp, azar, clamp } from '../dibujo.js';

const TAU = Math.PI * 2;

export default function crear(p = {}) {
  return p.tipo === 'membrana' ? membrana(p) : paletas(p);
}

/* =================================== PALETAS =================================== */
function paletas(p) {
  const CS = [200, 206], RS = 96, RR = 62, EX = RS - RR, CR = [CS[0], CS[1] - EX]; // estátor, rotor (tangente arriba)
  const UIN = 0.62, UEX = TAU - 0.62;  // posiciones angulares de la entrada y del escape (medidas desde la tangencia)
  const PER = 6;                        // s por vuelta (18 s = 3 vueltas: bucle exacto)
  const RHO_EX = 5;                     // densidad relativa a la que se abre la válvula (didáctico, no a escala)
  const fi = (u) => 1.5 * Math.PI - u;  // ángulo en pantalla desde el centro del rotor
  const s = (u) => { const a = fi(u), de = -EX * Math.sin(a); return -de + Math.sqrt(de * de - EX * EX + RS * RS); };
  const pt = (u, r) => [CR[0] + Math.cos(fi(u)) * r, CR[1] + Math.sin(fi(u)) * r];
  const vol = (u1, u2) => { let a = 0; const n = 40; for (let i = 0; i < n; i++) { const u = u1 + (u2 - u1) * (i + 0.5) / n, r = s(u); a += 0.5 * (r * r - RR * RR) * (u2 - u1) / n; } return a; };
  const VMED = vol(0, Math.PI);
  const ESC = 22 / VMED;                // moléculas por unidad de área a la densidad de entrada
  const VSELLO = vol(UIN, Math.PI + UIN);
  const N0 = VSELLO * ESC;

  /** Cámara j (liderada por la paleta j): región angular, número de moléculas y estado. */
  function camara(j, TH) {
    const U = TH - j * Math.PI;
    if (U <= 0 || U >= 3 * Math.PI) return null;
    let lo, hi, n, estado, abierta = false;
    if (U <= Math.PI) { lo = 0; hi = U; n = ESC * vol(lo, hi); estado = 'admision'; }
    else if (U <= 2 * Math.PI) {
      lo = U - Math.PI; hi = U;
      if (lo < UIN) { n = ESC * vol(lo, hi); estado = 'admision'; } else { n = N0; estado = 'aislada'; }
    } else {
      lo = U - Math.PI; hi = TAU;
      const V = vol(lo, hi);
      if (N0 / Math.max(V, 1e-6) < RHO_EX * ESC) { n = N0; estado = 'compresion'; } else { n = RHO_EX * ESC * V; estado = 'escape'; abierta = lo < UEX; }
    }
    return { j, lo, hi, n, estado, abierta, rho: n / Math.max(1e-6, vol(lo, hi)) / ESC };
  }

  const fases = [
    { t: 0, texto: 'Bomba rotatoria de paletas: un rotor excéntrico gira dentro de un estátor cilíndrico y casi lo toca por arriba. Dos paletas deslizan en una ranura del rotor y se apoyan contra la pared, de modo que dividen el hueco en cámaras que cambian de volumen al girar.' },
    { t: 3.5, texto: 'Admisión: detrás de cada paleta que pasa por la entrada, la cámara crece y aspira gas del lado de vacío. Cuando la paleta siguiente rebasa la entrada, ese gas queda aislado y la paleta lo arrastra hacia el otro lado.' },
    { t: 7.5, texto: 'Compresión: al acercarse al punto de tangencia, la cámara se estrecha y el gas atrapado se comprime. Cuando su presión supera la atmosférica, abre la válvula de escape y sale.' },
    { t: 11.5, texto: 'El aceite sella las holguras entre rotor, paletas y estátor, lubrica y refrigera; la válvula de escape queda bajo aceite. El lastre de gas (gas ballast) deja entrar algo de aire durante la compresión para que el agua y los disolventes no condensen en el aceite.' },
    { t: 15, texto: `${p.funcion || 'Hace el vacío inicial desde la presión atmosférica y evacúa de forma continua el gas que descarga la bomba turbomolecular.'}${p.final ? ` Presión final: ${p.final}.` : ''}${p.dato ? ` ${p.dato[0].toUpperCase() + p.dato.slice(1)}.` : ''}` },
  ];

  return {
    titulo: 'Bomba rotatoria de paletas',
    dur: 18,
    fases,
    dibujar(g, t) {
      const C = g.C, aceite = C.foton;
      const TH = (t / PER) * TAU + 0.35;
      /* --- carcasa y baño de aceite --- */
      g.rect(70, 66, 260, 262, { fill: C.panel, stroke: C.metalOsc, lw: 1.4, r: 8 });
      g.rect(72, 150, 256, 176, { fill: aceite, alpha: 0.16, r: 6 });
      g.texto('Aceite', 300, 312, { size: 10, color: C.texto2, align: 'right', weight: 600 });
      /* --- tuberías de entrada y escape --- */
      const pin = pt(UIN, s(UIN)), pex = pt(UEX, s(UEX));
      g.rect(pin[0] - 12, 20, 24, pin[1] - 16, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2 });
      g.rect(pex[0] - 12, 20, 24, pex[1] - 16, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2 });
      g.rotulo('Entrada (lado de vacío)', pin[0] - 6, 14, { size: 10 });
      g.rotulo('Escape', pex[0] + 26, 14, { size: 10 });
      /* --- estátor --- */
      g.circulo(CS[0], CS[1], RS + 7, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      g.circulo(CS[0], CS[1], RS, { fill: C.vacio });
      // aberturas de los puertos
      for (const [x, y] of [pin, pex]) g.rect(x - 11, y - 12, 22, 16, { fill: C.vacio });
      /* --- cámaras de gas --- */
      const cams = [0, 1, 2].map((d) => camara(Math.floor(TH / Math.PI) - d, TH)).filter(Boolean);
      for (const cm of cams) {
        const RJ = azar(((cm.j % 6) + 6) % 6 * 13 + 5), n = Math.round(cm.n);
        const tinte = cm.estado === 'admision' ? 0 : clamp((cm.rho - 1) / (RHO_EX - 1));
        // sombreado según la densidad
        const pts = [];
        for (let i = 0; i <= 24; i++) pts.push(pt(lerp(cm.lo, cm.hi, i / 24), s(lerp(cm.lo, cm.hi, i / 24))));
        for (let i = 24; i >= 0; i--) pts.push(pt(lerp(cm.lo, cm.hi, i / 24), RR));
        g.linea(pts, { fill: C.gas, alpha: 0.08 + 0.32 * tinte, cerrar: true });
        for (let q = 0; q < 40; q++) {
          const fa = RJ(), fr = RJ();
          if (q >= n) continue;
          const u = lerp(cm.lo, cm.hi, 0.04 + fa * 0.92), r = RR + 3 + fr * Math.max(0, s(u) - RR - 6);
          const [x, y] = pt(u, r);
          g.circulo(x, y, 2.6, { fill: C.gas });
        }
      }
      /* --- rotor y paletas --- */
      const ang = -TH; // giro del rotor (sentido antihorario en pantalla)
      for (let k = 0; k < 2; k++) {
        const u = ((TH + k * Math.PI) % TAU + TAU) % TAU, a = fi(u), ext = s(u);
        const c = Math.cos(a), si = Math.sin(a);
        g.linea([[CR[0] + c * 8, CR[1] + si * 8], [CR[0] + c * (ext - 1), CR[1] + si * (ext - 1)]], { color: C.metalOsc, lw: 7, cap: 'butt' });
        g.linea([[CR[0] + c * 8, CR[1] + si * 8], [CR[0] + c * (ext - 1), CR[1] + si * (ext - 1)]], { color: C.metal, lw: 4.5, cap: 'butt' });
      }
      g.circulo(CR[0], CR[1], RR, { fill: C.metal, stroke: C.metalOsc, lw: 1.2, alpha: 0.95 });
      // ranura y marcas de giro
      const ua = ((TH % TAU) + TAU) % TAU, aa = fi(ua);
      g.linea([[CR[0] + Math.cos(aa) * RR, CR[1] + Math.sin(aa) * RR], [CR[0] - Math.cos(aa) * RR, CR[1] - Math.sin(aa) * RR]], { color: C.metalOsc, lw: 6.5, cap: 'butt' });
      g.circulo(CR[0], CR[1], 9, { fill: C.metalOsc });
      for (let k = 0; k < 2; k++) {
        const u = ((TH + k * Math.PI) % TAU + TAU) % TAU, a = fi(u), ext = s(u);
        g.linea([[CR[0] + Math.cos(a) * 12, CR[1] + Math.sin(a) * 12], [CR[0] + Math.cos(a) * (ext - 1), CR[1] + Math.sin(a) * (ext - 1)]], { color: C.metal, lw: 4.5, cap: 'butt' });
      }
      void ang;
      // película de aceite en la pared del estátor
      g.circulo(CS[0], CS[1], RS - 1, { stroke: aceite, lw: 2, alpha: 0.5 });
      /* --- válvula de escape y flujo --- */
      const salida = cams.some((c) => c.abierta);
      const vy = pex[1] - 70, vx = pex[0];
      const aV = salida ? 0.7 : 0.05;
      g.linea([[vx - 12, vy], [vx - 12 + Math.cos(-aV) * 24, vy + Math.sin(-aV) * 24]], { color: C.metalOsc, lw: 3.5 });
      g.rotulo('Válvula', vx + 46, vy + 2, { size: 9.5 });
      if (salida) for (let k = 0; k < 6; k++) { const y = vy + 40 - ((t * 70 + k * 13) % 90); if (y > 24) g.circulo(vx + Math.sin(k * 2.1 + t * 3) * 5, y, 2.6, { fill: C.gas }); }
      for (let k = 0; k < 4; k++) { const y = 30 + ((t * (88 * 5 / 18) + k * 22) % 88); if (y < pin[1] - 6) g.circulo(pin[0] + Math.sin(k * 1.7) * 5, y, 2.6, { fill: C.gas, alpha: 0.9 }); }
      g.flecha(CR[0] - 44, CR[1] - 4, CR[0] - 36, CR[1] + 20, { color: C.texto2, lw: 1.4, punta: 6 });
      g.rotulo('Rotor', CR[0], CR[1] + 30, { size: 10 });
      g.rotulo('Paleta', 118, 222, { size: 10 });
      g.rotulo('Estátor', 112, 296, { size: 10 });

      /* --- panel lateral: etapas del ciclo y presión del gas atrapado --- */
      const est = new Set(cams.map((c) => c.estado));
      const filas = [['admision', '1  Admisión'], ['aislada', '2  Gas aislado'], ['compresion', '3  Compresión'], ['escape', '4  Escape por la válvula']];
      g.texto('Ciclo de cada cámara', 382, 92, { size: 11, color: C.texto, weight: 700 });
      filas.forEach(([k, txt], i) => {
        const on = est.has(k);
        g.rect(382, 106 + i * 30, 220, 22, { fill: on ? C.gas : C.panel, stroke: C.linea, r: 5, alpha: on ? 0.28 : 1 });
        g.texto(txt, 392, 117.5 + i * 30, { size: 11, color: on ? C.texto : C.tenue, weight: on ? 700 : 500 });
      });
      const cc = cams.find((c) => c.estado === 'compresion' || c.estado === 'escape');
      const kP = cc ? clamp((cc.rho - 1) / (RHO_EX - 1)) : 0;
      g.medidor(382, 254, 220, kP, { etiqueta: 'Presión de la cámara que se comprime', color: kP >= 0.999 ? C.ion : C.acento });
      g.linea([[602, 248], [602, 266]], { color: C.ion, lw: 1.5 });
      g.texto('atmosférica: abre la válvula', 602, 278, { size: 9.5, color: C.ion, align: 'right', weight: 600 });
      g.texto('Escala de presiones esquemática', 382, 300, { size: 9.5, color: C.tenue, italic: true });
      g.leyenda([[C.gas, 'molécula de gas'], [aceite, 'aceite']], 382, 330, { size: 10 });
    },
  };
}

/* =================================== MEMBRANA =================================== */
function membrana(p) {
  const PER = 3;                    // s por ciclo (18 s = 6 ciclos)
  const X0 = 120, X1 = 300, YT = 146, YB = 172; // cámara: placa superior y anclaje de la membrana
  const CK = [210, 292], RK = 28, BIELA = 114;
  const RHO_EX = 3;
  const forma = (yc) => (x) => YB + (yc - YB) * (1 - ((x - (X0 + X1) / 2) / ((X1 - X0) / 2)) ** 2);
  const area = (yc) => { const f = forma(yc); let a = 0; for (let i = 0; i < 30; i++) { const x = X0 + (X1 - X0) * (i + 0.5) / 30; a += (f(x) - YT) * (X1 - X0) / 30; } return a; };
  const ycDe = (th) => CK[1] - RK * Math.cos(th) - BIELA;          // centro de la membrana
  const VMIN = area(ycDe(0)), VMAX = area(ycDe(Math.PI));
  const ESC = 26 / VMAX;

  function estado(t) {
    const th = (t / PER) * TAU, fase = ((th % TAU) + TAU) % TAU; // 0: arriba (volumen mínimo) · π: abajo (máximo)
    const V = area(ycDe(th));
    if (fase < Math.PI) return { th, V, n: ESC * V, entra: true, sale: false, txt: 'admision' };
    const N = ESC * VMAX, rho = N / V / ESC;
    if (rho < RHO_EX) return { th, V, n: N, entra: false, sale: false, rho, txt: 'compresion' };
    return { th, V, n: RHO_EX * ESC * V, entra: false, sale: true, rho: RHO_EX, txt: 'escape' };
  }

  const fases = [
    { t: 0, texto: 'Bomba de membrana: un motor hace girar una excéntrica que, mediante una biela, sube y baja una membrana elástica. Sobre ella hay una cámara cerrada por dos válvulas de láminas, una de entrada y otra de salida, que se abren solo por diferencia de presión.' },
    { t: 3.5, texto: 'Al bajar la membrana, la cámara se agranda, la presión interior cae por debajo de la de entrada, la válvula de entrada se abre y entra gas del lado de vacío.' },
    { t: 7.5, texto: 'Al subir, el volumen disminuye: la válvula de entrada se cierra y el gas se comprime. Cuando su presión supera la del escape, se abre la válvula de salida y el gas sale.' },
    { t: 11.5, texto: 'Ningún aceite toca el gas, así que la bomba no puede contaminar el vacío. A cambio, su presión final es más alta que la de una rotatoria de paletas; para mejorarla se conectan varios cabezales en serie.' },
    { t: 15, texto: `${p.funcion || 'Actúa como bomba de vacío previo de la turbomolecular.'}${p.dato ? ` ${p.dato[0].toUpperCase() + p.dato.slice(1)}.` : ''}` },
  ];

  return {
    titulo: 'Bomba de membrana',
    dur: 18,
    fases,
    dibujar(g, t) {
      const C = g.C, e = estado(t), yc = ycDe(e.th), f = forma(yc);
      /* --- cabezal --- */
      g.rect(96, 98, 228, 48, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      g.rect(96, 146, 24, 32, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      g.rect(300, 146, 24, 32, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      // tuberías
      g.rect(138, 24, 26, 76, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2 });
      g.rect(256, 24, 26, 76, { fill: C.vacio, stroke: C.metalOsc, lw: 1.2 });
      g.rect(139, 96, 24, 52, { fill: C.vacio }); g.rect(257, 96, 24, 52, { fill: C.vacio });
      g.rotulo('Entrada (lado de vacío)', 151, 14, { size: 10 });
      g.rotulo('Escape', 300, 14, { size: 10 });
      // cámara de gas
      const pts = [[X0, YT]];
      for (let i = 0; i <= 30; i++) { const x = X0 + (X1 - X0) * i / 30; pts.push([x, f(x)]); }
      pts.push([X1, YT]);
      const tinte = e.rho ? clamp((e.rho - 1) / (RHO_EX - 1)) : 0;
      g.linea(pts, { fill: C.vacio, cerrar: true });
      g.linea(pts, { fill: C.gas, alpha: 0.08 + 0.3 * tinte, cerrar: true });
      // membrana
      const mem = [];
      for (let i = 0; i <= 30; i++) { const x = X0 + (X1 - X0) * i / 30; mem.push([x, f(x) + 2]); }
      g.linea(mem, { color: C.anion, lw: 4 });
      g.rect(96, YB - 2, 24, 8, { fill: C.metalOsc }); g.rect(300, YB - 2, 24, 8, { fill: C.metalOsc });
      // moléculas en la cámara
      const RJ = azar(5), n = Math.round(e.n);
      for (let q = 0; q < 40; q++) {
        const fx = RJ(), fy = RJ();
        if (q >= n) continue;
        const x = X0 + 5 + fx * (X1 - X0 - 10), y = YT + 3 + fy * Math.max(0, f(x) - YT - 6);
        g.circulo(x, y, 2.6, { fill: C.gas });
      }
      // válvulas de láminas
      const aIn = e.entra ? 0.75 : 0, aOut = e.sale ? 0.75 : 0;
      g.linea([[139, 146], [139 + Math.cos(aIn) * 24, 146 + Math.sin(aIn) * 24]], { color: C.metalOsc, lw: 3.5 });
      g.linea([[257, 98], [257 + Math.cos(-aOut) * 24, 98 + Math.sin(-aOut) * 24]], { color: C.metalOsc, lw: 3.5 });
      g.linea([[92, 122], [142, 150]], { color: C.tenue, lw: 1 });
      g.rotulo('Válvula de entrada', 50, 122, { size: 9.5 });
      g.rotulo('Válvula de salida', 356, 76, { size: 9.5 });
      // flujos
      if (e.entra) for (let k = 0; k < 5; k++) { const y = 30 + ((t * (112 * 6 / 18) + k * 17) % 112); g.circulo(151 + Math.sin(k * 1.9) * 5, y, 2.6, { fill: C.gas }); }
      if (e.sale) for (let k = 0; k < 6; k++) { const y = 140 - ((t * (114 * 9 / 18) + k * 13) % 114); g.circulo(269 + Math.sin(k * 2.3) * 5, y, 2.6, { fill: C.gas }); }
      /* --- biela, excéntrica y motor --- */
      const pin = [CK[0] + RK * Math.sin(e.th), CK[1] - RK * Math.cos(e.th)];
      g.rect(150, 250, 120, 82, { fill: C.panel, stroke: C.metalOsc, lw: 1.2, r: 6 });
      g.circulo(CK[0], CK[1], RK + 8, { fill: C.metal, stroke: C.metalOsc, lw: 1 });
      g.circulo(CK[0], CK[1], 4, { fill: C.metalOsc });
      g.linea([[pin[0], pin[1]], [210, yc + 2]], { color: C.metalOsc, lw: 7 });
      g.linea([[pin[0], pin[1]], [210, yc + 2]], { color: C.metal, lw: 4 });
      g.circulo(pin[0], pin[1], 5, { fill: C.metalOsc });
      g.rect(196, yc - 1, 28, 8, { fill: C.metalOsc, r: 2 });
      g.rotulo('Membrana', 356, 186, { size: 10 });
      g.rotulo('Biela', 262, 222, { size: 10 });
      g.rotulo('Excéntrica (motor)', 210, 344, { size: 10 });

      /* --- panel lateral --- */
      const filas = [['admision', '1  Admisión'], ['compresion', '2  Compresión'], ['escape', '3  Escape']];
      g.texto('Ciclo', 420, 120, { size: 11, color: C.texto, weight: 700 });
      filas.forEach(([k, txt], i) => {
        const on = e.txt === k;
        g.rect(420, 134 + i * 30, 190, 22, { fill: on ? C.gas : C.panel, stroke: C.linea, r: 5, alpha: on ? 0.28 : 1 });
        g.texto(txt, 430, 145.5 + i * 30, { size: 11, color: on ? C.texto : C.tenue, weight: on ? 700 : 500 });
      });
      g.medidor(420, 258, 190, e.txt === 'admision' ? 0 : clamp(((e.rho || 1) - 1) / (RHO_EX - 1)), { etiqueta: 'Presión en la cámara', color: e.sale ? C.ion : C.acento });
      g.texto('Escala esquemática', 420, 282, { size: 9.5, color: C.tenue, italic: true });
      g.texto('Sin aceite', 420, 306, { size: 11, color: C.ok, weight: 700 });
      g.leyenda([[C.gas, 'molécula de gas'], [C.anion, 'membrana']], 420, 334, { size: 10 });
    },
  };
}
