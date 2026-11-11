// Utilidades de dibujo de las animaciones 2D. Todas trabajan en coordenadas lógicas (640 × H) y con la paleta del tema activo.
// Convenciones de color (las mismas en todas las escenas, para que el alumno las reconozca):
//   C.ion  catión / ion positivo     C.anion  ion negativo     C.e  electrón     C.neutro  molécula o átomo neutro
//   C.gas  gas de fondo / colisión   C.foton  fotón / láser    C.metal  electrodos   C.campo  líneas de campo
//   C.m[i] iones de distinta m/z (de ligero a pesado)           C.calor  zonas calientes

const PALETAS = {
  light: {
    fondo: '#f7f8fa', panel: '#ffffff', texto: '#1c222a', texto2: '#4a535e', tenue: '#8a939e', linea: '#c9ced5', rejilla: '#e6e9ed',
    acento: '#1d63c9', ion: '#e8590c', anion: '#7048e8', e: '#1c7ed6', neutro: '#7c8692', gas: '#74b9e8', foton: '#f0a500',
    metal: '#9aa4b0', metalOsc: '#6f7a87', campo: 'rgba(29, 99, 201, 0.35)', calor: '#e03131', frio: '#1098ad', vacio: '#eef1f5',
    liquido: '#4dabf7', ok: '#2f9e44', mal: '#c92a4a',
    m: ['#e8590c', '#2f9e44', '#1971c2', '#ae3ec9', '#c2255c', '#f08c00'],
  },
  dark: {
    fondo: '#1b1f25', panel: '#22272e', texto: '#e5e8ec', texto2: '#b9c1ca', tenue: '#7d8792', linea: '#3c434c', rejilla: '#2a3038',
    acento: '#5da0f5', ion: '#ff8a3d', anion: '#9775fa', e: '#4dabf7', neutro: '#9aa4af', gas: '#4f8fc0', foton: '#ffc233',
    metal: '#7d8794', metalOsc: '#5a636e', campo: 'rgba(93, 160, 245, 0.4)', calor: '#ff6b6b', frio: '#3bc9db', vacio: '#20252c',
    liquido: '#4dabf7', ok: '#51cf66', mal: '#ff5c7a',
    m: ['#ff8a3d', '#51cf66', '#4dabf7', '#da77f2', '#f06595', '#ffa94d'],
  },
};

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** Avance 0→1 de t dentro de [a, b]. */
export const tramo = (t, a, b) => clamp((t - a) / (b - a));
export const suave = (k) => k * k * (3 - 2 * k);
export const easeOut = (k) => 1 - (1 - k) * (1 - k);
export const easeIn = (k) => k * k;
/** Generador pseudoaleatorio determinista (mulberry32): la misma semilla da siempre la misma escena. */
export function azar(semilla = 1) {
  let a = semilla >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

export function pincel(ctx, W, H) {
  let s = 1, temaAct = '', C = PALETAS.light;
  const g = {
    ctx, W, H, get C() { return C; },
    escala(k) { s = k; },
    tema() {
      const tm = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
      if (tm !== temaAct) { temaAct = tm; C = PALETAS[tm]; }
    },
    limpiar(col) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = col || C.fondo; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.setTransform(s, 0, 0, s, 0, 0); },

    /* ---- primitivas ---- */
    rect(x, y, w, h, { fill, stroke, lw = 1, r = 0, alpha = 1 } = {}) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath();
      if (r) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      ctx.restore();
    },
    circulo(x, y, r, { fill, stroke, lw = 1, alpha = 1 } = {}) {
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
      ctx.restore();
    },
    linea(pts, { color, lw = 1.5, dash, alpha = 1, cerrar = false, fill, cap = 'round' } = {}) {
      if (pts.length < 2) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      if (cerrar) ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (color) { ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = cap; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
      ctx.restore();
    },
    /** Curva suave por los puntos (Catmull-Rom). */
    curva(pts, op = {}) {
      if (pts.length < 3) return g.linea(pts, op);
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        for (let k = 0; k < 8; k++) {
          const u = k / 8, u2 = u * u, u3 = u2 * u;
          out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
        }
      }
      out.push(pts[pts.length - 1]);
      g.linea(out, op);
    },
    flecha(x1, y1, x2, y2, { color, lw = 1.6, punta = 7, alpha = 1, dash } = {}) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      g.linea([[x1, y1], [x2 - Math.cos(a) * punta * 0.6, y2 - Math.sin(a) * punta * 0.6]], { color: color || C.texto2, lw, alpha, dash });
      g.linea([[x2, y2], [x2 - Math.cos(a - 0.4) * punta, y2 - Math.sin(a - 0.4) * punta], [x2 - Math.cos(a + 0.4) * punta, y2 - Math.sin(a + 0.4) * punta]],
        { fill: color || C.texto2, alpha, cerrar: true });
    },
    texto(str, x, y, { size = 12, color, align = 'left', base = 'middle', weight = 500, alpha = 1, mono = false, italic = false } = {}) {
      ctx.save(); ctx.globalAlpha = alpha;
      ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${mono ? "'Cascadia Mono', Consolas, monospace" : "'Segoe UI', Inter, system-ui, sans-serif"}`;
      ctx.fillStyle = color || C.texto; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(str, x, y);
      ctx.restore();
    },
    /** Rótulo con fondo (para nombrar piezas sin tapar el dibujo). */
    rotulo(str, x, y, { size = 11, color, fondo, align = 'center', alpha = 1 } = {}) {
      ctx.save(); ctx.font = `600 ${size}px 'Segoe UI', Inter, system-ui, sans-serif`;
      const w = ctx.measureText(str).width + 10, h = size + 7;
      const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
      ctx.restore();
      g.rect(x0, y - h / 2, w, h, { fill: fondo || C.panel, stroke: C.linea, r: 4, alpha: alpha * 0.92 });
      g.texto(str, x0 + w / 2, y + 0.5, { size, color: color || C.texto2, align: 'center', weight: 600, alpha });
    },

    /* ---- especies ---- */
    /** Ion: círculo de color con su signo. `q` es la carga (+1, +2, −1…). */
    ion(x, y, { r = 6, q = 1, color, alpha = 1, signo = true, brillo = false } = {}) {
      const col = color || (q < 0 ? C.anion : C.ion);
      if (brillo) g.circulo(x, y, r * 2.2, { fill: col, alpha: alpha * 0.18 });
      g.circulo(x, y, r, { fill: col, alpha });
      if (signo && r >= 4.5) {
        const sg = q < 0 ? '−' : '+', n = Math.abs(q);
        g.texto(n > 1 ? n + sg : sg, x, y + 0.5, { size: Math.max(7, r * (n > 1 ? 1.15 : 1.5)), color: '#fff', align: 'center', weight: 700, alpha });
      }
    },
    electron(x, y, { r = 2.6, alpha = 1, estela } = {}) {
      if (estela) g.linea([[x - estela[0], y - estela[1]], [x, y]], { color: C.e, lw: 1.4, alpha: alpha * 0.45 });
      g.circulo(x, y, r, { fill: C.e, alpha });
    },
    /** Molécula neutra esquemática: varios átomos unidos. `forma` 0…1 la deforma; `rot` la gira. */
    molecula(x, y, { r = 5, n = 4, rot = 0, color, alpha = 1, semilla = 3, roto = 0 } = {}) {
      const R = azar(semilla), at = [];
      let px = 0, py = 0;
      for (let i = 0; i < n; i++) {
        at.push([px, py]);
        const a = (R() - 0.5) * 2.2 + (i % 2 ? 0.6 : -0.6);
        px += Math.cos(a) * r * 1.5; py += Math.sin(a) * r * 1.5;
      }
      const cx = at.reduce((a, p) => a + p[0], 0) / n, cy = at.reduce((a, p) => a + p[1], 0) / n;
      const ca = Math.cos(rot), sa = Math.sin(rot);
      const P = at.map(([u, v], i) => {
        u -= cx; v -= cy;
        const sep = roto * (i < n / 2 ? -1 : 1) * r * 2;
        return [x + u * ca - v * sa + sep, y + u * sa + v * ca];
      });
      for (let i = 1; i < n; i++) if (!(roto > 0.05 && i === Math.ceil(n / 2))) g.linea([P[i - 1], P[i]], { color: color || C.neutro, lw: r * 0.5, alpha: alpha * 0.8 });
      for (const p of P) g.circulo(p[0], p[1], r, { fill: color || C.neutro, alpha });
      return P;
    },
    gota(x, y, r, { alpha = 1, carga = 0 } = {}) {
      g.circulo(x, y, r, { fill: C.liquido, alpha: alpha * 0.55, stroke: C.liquido, lw: 1 });
      const R = azar(Math.round(x * 7 + y * 13));
      for (let i = 0; i < carga; i++) {
        const a = (i / carga) * Math.PI * 2 + R();
        g.texto('+', x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, { size: Math.max(6, r * 0.55), color: C.ion, align: 'center', weight: 800, alpha });
      }
    },
    /** Fotón / pulso láser: onda sinusoidal entre dos puntos, recorrida hasta la fracción k. */
    foton(x1, y1, x2, y2, { k = 1, amp = 4, long = 10, color, lw = 1.6, alpha = 1 } = {}) {
      const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, pts = [];
      for (let d = 0; d <= L * k; d += 1.5) { const w = Math.sin((d / long) * Math.PI * 2) * amp; pts.push([x1 + ux * d - uy * w, y1 + uy * d + ux * w]); }
      g.linea(pts, { color: color || C.foton, lw, alpha });
    },

    /* ---- piezas ---- */
    electrodo(x, y, w, h, { v, color, alpha = 1, r = 2 } = {}) {
      g.rect(x, y, w, h, { fill: color || C.metal, stroke: C.metalOsc, lw: 0.8, r, alpha });
      if (v != null) g.texto(v, x + w / 2, y + h / 2, { size: 9.5, color: '#fff', align: 'center', weight: 700, alpha });
    },
    /** Zona de vacío / cámara con borde. */
    camara(x, y, w, h, { titulo, alpha = 1 } = {}) {
      g.rect(x, y, w, h, { fill: C.vacio, stroke: C.linea, lw: 1.2, r: 8, alpha });
      if (titulo) g.texto(titulo, x + 8, y + 11, { size: 10, color: C.tenue, weight: 600, alpha });
    },
    /** Indicador de potencial o de magnitud: barra con etiqueta. */
    medidor(x, y, w, k, { etiqueta, color, alpha = 1 } = {}) {
      g.rect(x, y, w, 6, { fill: C.rejilla, r: 3, alpha });
      g.rect(x, y, w * clamp(k), 6, { fill: color || C.acento, r: 3, alpha });
      if (etiqueta) g.texto(etiqueta, x, y - 8, { size: 10, color: C.texto2, alpha });
    },
    /** Pequeño gráfico de ejes (para espectros, señales y transitorios). f(x 0…1) → y 0…1. */
    grafico(x, y, w, h, f, { color, titulo, ejeX, ejeY, n = 160, fill = true, alpha = 1, marcas } = {}) {
      g.rect(x, y, w, h, { fill: C.panel, stroke: C.linea, r: 4, alpha });
      const pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x + 6 + u * (w - 12), y + h - 14 - clamp(f(u), -0.05, 1.05) * (h - 28)]); }
      if (fill) g.linea([[x + 6, y + h - 14], ...pts, [x + w - 6, y + h - 14]], { fill: color ? color + '33' : C.campo, alpha, cerrar: true });
      g.linea(pts, { color: color || C.acento, lw: 1.4, alpha });
      g.linea([[x + 6, y + h - 14], [x + w - 6, y + h - 14]], { color: C.tenue, lw: 0.8, alpha });
      if (titulo) g.texto(titulo, x + 7, y + 9, { size: 9.5, color: C.texto2, weight: 600, alpha });
      if (ejeX) g.texto(ejeX, x + w - 6, y + h - 5, { size: 8.5, color: C.tenue, align: 'right', alpha });
      if (ejeY) g.texto(ejeY, x + 7, y + 20, { size: 8.5, color: C.tenue, alpha });
      if (marcas) for (const [u, txt] of marcas) g.texto(txt, x + 6 + u * (w - 12), y + h - 5, { size: 8.5, color: C.tenue, align: 'center', alpha });
    },
    /** Leyenda de colores: [[color, texto], …] en una fila. */
    leyenda(items, x, y, { size = 10 } = {}) {
      let cx = x;
      for (const [col, txt, tipo] of items) {
        if (tipo === 'e') g.circulo(cx + 4, y, 2.6, { fill: col }); else if (tipo === 'foton') g.foton(cx, y, cx + 10, y, { amp: 2, long: 5, color: col, lw: 1.2 });
        else g.circulo(cx + 4, y, 4, { fill: col });
        g.texto(txt, cx + 12, y + 0.5, { size, color: C.texto2 });
        ctx.save(); ctx.font = `500 ${size}px 'Segoe UI', Inter, system-ui, sans-serif`; cx += ctx.measureText(txt).width + 26; ctx.restore();
      }
    },
  };
  return g;
}
