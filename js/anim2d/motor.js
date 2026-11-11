// Motor de las animaciones 2D «Cómo funciona». Cada escena vive en js/anim2d/escenas/<nombre>.js y exporta por defecto
// crear(p) → { titulo, dur, fases: [{ t, texto }], aspecto?, reiniciar?(), actualizar?(t, dt), dibujar(g, t) }.
// Coordenadas lógicas: 640 de ancho × 640/aspecto de alto (16:9 → 360). El tiempo es cíclico (0 … dur) y la escena debe
// poder dibujarse en cualquier t: si guarda estado, reiniciar() lo vacía y el motor lo reconstruye con actualizar() al saltar.
import { pincel } from './dibujo.js';

const PASO = 1 / 60;
const vistos = new Set();

/** Carga la escena `ref.anim` con los parámetros `ref.p` y la monta en `host`. Devuelve un controlador con destroy(). */
export async function montarAnimacion(host, ref, { grande = false, alAmpliar } = {}) {
  let mod;
  try { mod = await import(`./escenas/${ref.anim}.js`); } catch (e) { console.warn('Animación no disponible:', ref.anim, e); host.remove(); return null; }
  const esc = mod.default(ref.p || {});
  const aspecto = esc.aspecto || 16 / 9;
  const W = 640, H = Math.round(640 / aspecto);
  const fases = (esc.fases || [{ t: 0, texto: '' }]).slice().sort((a, b) => a.t - b.t);

  host.classList.add('a2d');
  host.innerHTML = `
    <div class="a2d-head">
      <span class="a2d-tit">${ref.titulo || esc.titulo || 'Cómo funciona'}</span>
      <span class="a2d-btns">
        <button class="a2d-b" data-a="play" title="Pausar / reproducir"></button>
        <button class="a2d-b" data-a="reset" title="Volver al inicio"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5" /></svg></button>
        <button class="a2d-b a2d-vel" data-a="vel" title="Velocidad">1×</button>
        ${alAmpliar ? `<button class="a2d-b" data-a="big" title="${grande ? 'Cerrar' : 'Ampliar'}">${grande
          ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>'
          : '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>'}</button>` : ''}
      </span>
    </div>
    <div class="a2d-lienzo" style="aspect-ratio:${W}/${H}"><canvas></canvas></div>
    <div class="a2d-tl"><i class="a2d-prog"></i>${fases.map((f, i) => `<b data-i="${i}" style="left:${(f.t / esc.dur) * 100}%"></b>`).join('')}</div>
    <p class="a2d-cap" aria-live="polite"></p>`;
  const cv = host.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const cap = host.querySelector('.a2d-cap');
  const prog = host.querySelector('.a2d-prog');
  const bPlay = host.querySelector('[data-a="play"]');
  const marcas = [...host.querySelectorAll('.a2d-tl b')];

  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let t = 0, vel = 1, jugando = !reducido, visible = true, raf = 0, ultimo = 0, faseAct = -1, vivo = true;
  const g = pincel(ctx, W, H);

  function avanzarHasta(obj) {
    // reconstruye el estado de escenas con memoria (partículas que se integran paso a paso)
    esc.reiniciar?.();
    if (esc.actualizar) for (let s = 0; s < obj; s += PASO) esc.actualizar(s, PASO);
  }
  function tamaño() {
    const r = cv.parentElement.getBoundingClientRect();
    if (!r.width) return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.width * (H / W) * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    g.escala(cv.width / W);
    return true;
  }
  function pintar() {
    if (!tamaño()) return;
    g.tema();
    g.limpiar();
    esc.dibujar(g, t);
    prog.style.width = (t / esc.dur) * 100 + '%';
    let f = 0;
    for (let i = 0; i < fases.length; i++) if (t >= fases[i].t) f = i;
    if (f !== faseAct) {
      faseAct = f; cap.textContent = fases[f].texto || '';
      marcas.forEach((m, i) => m.classList.toggle('on', i === f));
    }
  }
  function bucle(ahora) {
    raf = 0;
    if (!vivo) return;
    const dt = Math.min(0.05, ultimo ? (ahora - ultimo) / 1000 : 0) * vel;
    ultimo = ahora;
    if (jugando && visible && dt > 0) {
      let rest = dt;
      while (rest > 1e-6) {
        const d = Math.min(PASO, rest);
        esc.actualizar?.(t, d);
        t += d; rest -= d;
        if (t >= esc.dur) { t = 0; esc.reiniciar?.(); }
      }
    }
    pintar();
    if (jugando && visible) raf = requestAnimationFrame(bucle);
  }
  function arrancar() { if (!raf && vivo) { ultimo = 0; raf = requestAnimationFrame(bucle); } }
  function setPlay(on) {
    jugando = on;
    bPlay.innerHTML = on
      ? '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14" /></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M7 4.5v15l12-7.5z" /></svg>';
    if (on) arrancar(); else pintar();
  }
  function ir(nt) { t = Math.max(0, Math.min(esc.dur - 1e-3, nt)); avanzarHasta(t); pintar(); }

  bPlay.addEventListener('click', () => setPlay(!jugando));
  host.querySelector('[data-a="reset"]').addEventListener('click', () => { ir(0); if (!jugando) setPlay(true); });
  host.querySelector('[data-a="vel"]').addEventListener('click', (e) => {
    vel = vel === 1 ? 0.5 : vel === 0.5 ? 0.25 : 1;
    e.currentTarget.textContent = (vel === 1 ? '1' : vel === 0.5 ? '½' : '¼') + '×';
  });
  host.querySelector('[data-a="big"]')?.addEventListener('click', () => alAmpliar({ t, vel }));
  marcas.forEach((m) => m.addEventListener('click', () => ir(fases[+m.dataset.i].t + 1e-3)));
  host.querySelector('.a2d-tl').addEventListener('click', (e) => {
    if (e.target.tagName === 'B') return;
    const r = e.currentTarget.getBoundingClientRect();
    ir(((e.clientX - r.left) / r.width) * esc.dur);
  });

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) arrancar(); }, { threshold: 0.05 });
  io.observe(host);
  const ro = new ResizeObserver(() => { if (!jugando) pintar(); });
  ro.observe(cv.parentElement);
  const vis = () => { visible = !document.hidden; if (visible) arrancar(); };
  document.addEventListener('visibilitychange', vis);
  const tema = new MutationObserver(() => { if (!jugando) pintar(); });
  tema.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  esc.reiniciar?.();
  setPlay(jugando);
  pintar();
  vistos.add(ref.anim);

  return {
    escena: esc,
    ir, setPlay,
    set vel(v) { vel = v; const b = host.querySelector('.a2d-vel'); if (b) b.textContent = (v === 1 ? '1' : v === 0.5 ? '½' : '¼') + '×'; },
    get t() { return t; },
    destroy() {
      vivo = false; if (raf) cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); tema.disconnect();
      document.removeEventListener('visibilitychange', vis);
    },
  };
}

/* ===== Ventana ampliada (se usa desde la ficha y desde el recorrido) ===== */
let grandeAct = null;
export async function abrirGrande(ref, estado = {}) {
  cerrarGrande();
  const capa = document.createElement('div');
  capa.className = 'a2d-capa';
  capa.innerHTML = '<div class="a2d-caja"></div>';
  document.body.appendChild(capa);
  const caja = capa.firstChild;
  const cerrar = (e) => { if (e.target === capa) cerrarGrande(); };
  capa.addEventListener('click', cerrar);
  const ctl = await montarAnimacion(caja, ref, { grande: true, alAmpliar: () => cerrarGrande() });
  if (!ctl) { capa.remove(); return; }
  if (estado.t) ctl.ir(estado.t);
  if (estado.vel) ctl.vel = estado.vel;
  grandeAct = { capa, ctl };
}
export function cerrarGrande() {
  if (!grandeAct) return false;
  grandeAct.ctl.destroy(); grandeAct.capa.remove(); grandeAct = null;
  return true;
}
