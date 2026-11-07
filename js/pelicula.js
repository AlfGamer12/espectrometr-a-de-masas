// Modo película: reproduce un guion de planos (cámara, explosionado, transparencia, resaltado, simulación) con transiciones suaves,
// órbita lenta de cámara, rótulos de capítulo y subtítulos. Si existen archivos audio/<id>/NN.mp3 los usa como narración.
// El guion de cada equipo está en js/equipos/<id>/pelicula.js:
//   { cap, titulo, texto, dur, modo, e1, e2, xray, foco, dir, pad, trans, orbita (°/s), acercar (fracción), resaltar, sim, ctl, eventos:[{t, e1|e2|xray|ctl|resaltar}] }
import * as THREE from 'three';
import { icon } from './icons.js';

/** Guion automático para los equipos sin guion propio: plano de apertura, un plano por paso del recorrido y cierre. */
function desdeRecorrido(CFG) {
  const R = CFG.RECORRIDO || [];
  if (!R.length) return [];
  const capDe = (st) => (st.sim ? 'Simulación' : st.modo === 'equipo' ? 'Equipo completo' : 'Analizador');
  const ext = { modo: 'equipo', e1: 0, e2: 0, xray: false, foco: CFG.FOCO.equipo, dir: CFG.DIRS.equipo, pad: 1.05, resaltar: [] };
  return [
    { ...ext, intro: true, tarjeta: 5, dur: 7, trans: 0, orbita: -2.2, acercar: 0.05, texto: '' },
    ...R.map((st, i) => ({
      cap: capDe(st), titulo: st.titulo, texto: st.texto, dur: Math.max(10, Math.round(st.texto.length / 15) + 2),
      modo: st.modo, e1: st.e1, e2: st.e2, xray: st.xray, sim: st.sim, foco: st.foco, dir: st.dir, pad: st.pad,
      resaltar: st.resaltar || [], orbita: i % 2 ? -3 : 3, acercar: 0.05, trans: 2.6,
    })),
    { ...ext, dur: 6, trans: 3, orbita: -2, sim: false, texto: '' },
  ];
}

export function initPelicula(app, CFG, META) {
  const btn = document.getElementById('btnFilm');
  const P = CFG.PELICULA && CFG.PELICULA.length ? CFG.PELICULA : desdeRecorrido(CFG);
  if (!P.length) { btn.remove(); return; }
  const S = app.S;

  /* ---------- interfaz ---------- */
  const el = document.createElement('div');
  el.id = 'cine'; el.className = 'hidden';
  el.innerHTML = `
    <div class="cine-vig"></div>
    <div class="cine-fade"></div>
    <div class="cine-card"><span class="kick"></span><h2></h2><p></p><div class="cine-end hidden">
      <button class="btn primary" data-a="again">${icon('rotate')}Ver de nuevo</button><button class="btn" data-a="exit">${icon('close')}Salir</button></div></div>
    <div class="cine-chap"><span class="num"></span><div><small></small><b></b></div></div>
    <div class="cine-sub"><span></span></div>
    <div class="cine-bar">
      <button class="cbtn" data-a="prev" title="Capítulo anterior (←)">${icon('skipb')}</button>
      <button class="cbtn big" data-a="play" title="Reproducir / pausa (espacio)">${icon('pause')}</button>
      <button class="cbtn" data-a="next" title="Capítulo siguiente (→)">${icon('skipf')}</button>
      <span class="time">0:00 / 0:00</span>
      <div class="cine-prog"></div>
      <button class="cbtn on" data-a="cc" title="Subtítulos (C)">${icon('cc')}</button>
      <button class="cbtn on hidden" data-a="voz" title="Narración">${icon('voz')}</button>
      <button class="cbtn on" data-a="son" title="Música y efectos">${icon('musica')}</button>
      <button class="cbtn" data-a="full" title="Pantalla completa (F)">${icon('full')}</button>
      <button class="cbtn" data-a="exit" title="Salir (Esc)">${icon('close')}</button>
    </div>`;
  document.body.appendChild(el);
  const q = (s) => el.querySelector(s);
  const sub = q('.cine-sub span'), prog = q('.cine-prog'), time = q('.time'), bar = q('.cine-bar');

  /* ---------- estado ---------- */
  const C = { on: false, play: false, k: 0, t: 0, dur: [], chunks: [], audio: [], cc: true, voz: true, son: true, ev: 0, prev: null, card: 0, fin: false };

  /* ---------- música de fondo y efectos (niveles discretos; la música baja mientras habla la narración) ---------- */
  const VOL = { musica: 0.13, musicaVoz: 0.055, whoosh: 0.2, subida: 0.28, tick: 0.16, ding: 0.24 };
  let musica = null, volM = 0;
  function sfx(nombre, delay = 0) {
    if (!C.son) return;
    setTimeout(() => { if (!C.on || !C.son) return; const a = new Audio(`audio/sfx/${nombre}.mp3`); a.volume = VOL[nombre]; a.play().catch(() => {}); }, delay);
  }
  function mezclar(dt) {
    const hablando = C.prev && !C.prev.paused && !C.prev.ended;
    const obj = C.on && C.son && C.play && !C.fin ? (hablando ? VOL.musicaVoz : VOL.musica) : 0;
    if (obj > 0 && !musica) { musica = new Audio('audio/musica-fondo.mp3'); musica.loop = true; musica.volume = 0; }
    if (!musica) return;
    volM += (obj - volM) * Math.min(1, dt * (obj > volM ? 0.8 : 2.5));
    if (volM < 0.003 && obj === 0) { volM = 0; if (!musica.paused) musica.pause(); }
    else if (musica.paused && obj > 0) musica.play().catch(() => {});
    musica.volume = Math.max(0, Math.min(1, volM));
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const total = () => C.dur.reduce((a, b) => a + b, 0);
  const startOf = (k) => C.dur.slice(0, k).reduce((a, b) => a + b, 0);

  function trocear(texto, dur) {
    // frases de ≤ 95 caracteres; cada una se muestra un tiempo proporcional a su longitud
    const partes = [];
    for (const f of texto.split(/(?<=[.;:!?])\s+/)) {
      if (f.length <= 120) { partes.push(f); continue; }
      let cur = '';
      for (const w of f.split(/(?<=,)\s+/)) {
        if ((cur + ' ' + w).trim().length > 110 && cur) { partes.push(cur.trim()); cur = w; } else cur += ' ' + w;
      }
      if (cur.trim()) partes.push(cur.trim());
    }
    const L = partes.reduce((a, p) => a + p.length, 0), t0 = 0.35, disp = Math.max(1, dur - 0.9);
    let acc = t0;
    return partes.map((p) => { const d = (p.length / L) * disp; const c = { a: acc, b: acc + d, p }; acc += d; return c; });
  }

  async function cargarAudio() {
    // audio/indice.json lista los equipos con narración generada (herramientas/generar_voz.mjs); así no se piden archivos inexistentes
    let conVoz = !!CFG.peliculaAudio;
    if (!conVoz) {
      try { const r = await fetch('audio/indice.json', { cache: 'no-cache' }); if (r.ok) conVoz = (await r.json()).includes(CFG.id); } catch { /* sin índice */ }
    }
    if (!conVoz) { C.audio = P.map(() => null); q('[data-a="voz"]').classList.add('hidden'); return; }
    const carga = P.map((_, k) => new Promise((res) => {
      const a = new Audio(); a.preload = 'auto';
      const fin = (v) => { clearTimeout(to); res(v); };
      const to = setTimeout(() => fin(null), 3000);
      a.addEventListener('loadedmetadata', () => fin(a), { once: true });
      a.addEventListener('error', () => fin(null), { once: true });
      a.src = `audio/${CFG.id}/${String(k + 1).padStart(2, '0')}.mp3`;
    }));
    C.audio = await Promise.all(carga);
    q('[data-a="voz"]').classList.toggle('hidden', !C.audio.some(Boolean));
  }

  function construirBarra() {
    const T = total();
    prog.innerHTML = P.map((sh, k) => `<i data-k="${k}" style="flex:${C.dur[k] / T}" title="${String(k + 1).padStart(2, '0')} · ${sh.cap || sh.titulo || ''}"><b></b></i>`).join('');
    prog.querySelectorAll('i').forEach((i) => i.addEventListener('click', () => irA(+i.dataset.k)));
  }

  /* ---------- planos ---------- */
  function aplicar(k, { trans } = {}) {
    const sh = P[k];
    C.k = k; C.t = 0; C.ev = 0; C.fin = false;
    if (!sh.sim && S.simOn) app.stopSim();
    app.setMode(sh.modo, { frame: false });
    if (sh.e1 != null) S.t1 = sh.e1;
    if (sh.e2 != null) S.t2 = sh.e2;
    app.setXrayState(!!sh.xray);
    if (sh.sim && !S.simOn) app.startSim({ frame: false });
    if (sh.ctl) for (const [id, v] of Object.entries(sh.ctl)) ctl(id, v);
    if (sh.accion) sh.accion(app);
    resaltar(sh.resaltar || []);
    app.syncSlider();
    const dt = trans ?? sh.trans ?? 2.6;
    app.frameIds(sh.foco, sh.dir || null, dt, sh.pad ?? 1.1);
    if (k > 0 && dt > 0.5) sfx('whoosh');
    if (sh.cap) sfx('tick', 450);
    // rótulo de capítulo
    const ch = q('.cine-chap');
    if (sh.cap) {
      ch.querySelector('.num').textContent = String(k + 1).padStart(2, '0');
      ch.querySelector('small').textContent = sh.cap; ch.querySelector('b').textContent = sh.titulo || '';
      ch.classList.remove('show'); void ch.offsetWidth; ch.classList.add('show');
    }
    q('.cine-card').classList.toggle('show', !!sh.intro);
    sub.textContent = ''; sub.parentElement.classList.remove('show');
    // narración
    if (C.prev) { C.prev.pause(); C.prev = null; }
    const a = C.audio[k];
    if (a && C.voz) { a.currentTime = 0; if (C.play) a.play().catch(() => {}); C.prev = a; }
    prog.querySelectorAll('i').forEach((i, j) => i.classList.toggle('done', j < k));
  }
  function ctl(id, v) {
    app.sim.setControl(id, v);
    const s = document.getElementById('ctl_' + id); if (s) s.value = v;
  }
  function resaltar(ids) {
    S.tourHL = ids.flatMap((id) => (app.parts.has(id) ? [id] : app.idsOf(id)));
    app.refreshHighlight();
  }
  function irA(k) {
    if (k < 0) k = 0;
    if (k >= P.length) { terminar(); return; }
    q('.cine-end').classList.add('hidden');
    aplicar(k, { trans: 1.6 });
  }
  function terminar() {
    C.fin = true; setPlay(false);
    if (C.prev) C.prev.pause();
    sfx('ding');
    const card = q('.cine-card');
    card.querySelector('.kick').textContent = META.marca;
    card.querySelector('h2').textContent = META.modelo;
    card.querySelector('p').textContent = 'Fin de la presentación';
    q('.cine-end').classList.remove('hidden');
    card.classList.add('show'); sub.parentElement.classList.remove('show');
  }

  /* ---------- reproducción ---------- */
  function setPlay(v) {
    C.play = v;
    q('[data-a="play"]').innerHTML = icon(v ? 'pause' : 'play');
    app.controls.enabled = !v;
    if (C.prev) { if (v && C.voz) C.prev.play().catch(() => {}); else C.prev.pause(); }
    el.classList.toggle('paused', !v);
  }
  const tick = (dt, volando) => {
    mezclar(dt);
    if (!C.on) return;
    const sh = P[C.k];
    if (C.play && !C.fin) {
      C.t += dt;
      // eventos dentro del plano
      const ev = sh.eventos || [];
      while (C.ev < ev.length && C.t >= ev[C.ev].t) {
        const e = ev[C.ev++];
        if (e.e1 != null) S.t1 = e.e1;
        if (e.e2 != null) S.t2 = e.e2;
        if (e.xray != null) app.setXrayState(e.xray);
        if (e.ctl) for (const [id, v] of Object.entries(e.ctl)) ctl(id, v);
        if (e.resaltar) resaltar(e.resaltar);
        app.syncSlider();
      }
      // movimiento lento de cámara: órbita alrededor del objetivo y ligero acercamiento
      if (!volando) {
        const off = app.camera.position.clone().sub(app.controls.target);
        if (sh.orbita) off.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(sh.orbita) * dt);
        if (sh.acercar) off.multiplyScalar(1 - (sh.acercar * dt) / C.dur[C.k]);
        app.camera.position.copy(app.controls.target).add(off);
      }
      if (C.t >= C.dur[C.k]) { if (C.k + 1 < P.length) aplicar(C.k + 1); else terminar(); }
    }
    // subtítulos
    const ch = C.chunks[C.k] || [];
    const c = ch.find((x) => C.t >= x.a && C.t < x.b);
    const box = sub.parentElement;
    if (C.cc && c && !C.fin) { if (sub.textContent !== c.p) sub.textContent = c.p; box.classList.add('show'); } else box.classList.remove('show');
    // barra de progreso
    const T = total(), now = startOf(C.k) + Math.min(C.t, C.dur[C.k]);
    time.textContent = `${fmt(now)} / ${fmt(T)}`;
    const cur = prog.children[C.k]; if (cur) cur.querySelector('b').style.width = `${Math.min(100, (C.t / C.dur[C.k]) * 100)}%`;
    if (sh.intro && C.t > (sh.tarjeta || 5)) q('.cine-card').classList.remove('show');
  };
  app.setCineTick(tick);

  /* ---------- entrar y salir ---------- */
  async function entrar() {
    if (S.tour >= 0) app.endTour();
    app.select(null);
    C.on = true; C.labels = S.labels; S.labels = false; S.cine = true;
    document.body.classList.add('cine-on');
    el.classList.remove('hidden');
    const fade = q('.cine-fade'); fade.classList.remove('out'); void fade.offsetWidth;
    const card = q('.cine-card');
    card.querySelector('.kick').textContent = META.marca;
    card.querySelector('h2').textContent = META.modelo;
    card.querySelector('p').textContent = META.linea;
    q('.cine-end').classList.add('hidden');
    await cargarAudio();
    C.dur = P.map((sh, k) => Math.max(sh.dur, C.audio[k] && isFinite(C.audio[k].duration) ? C.audio[k].duration + 0.9 : 0));
    C.chunks = P.map((sh, k) => trocear(sh.texto || '', C.audio[k] ? C.audio[k].duration + 0.4 : C.dur[k]));
    construirBarra();
    aplicar(0, { trans: 0 });
    setPlay(true);
    sfx('subida', 200);
    setTimeout(() => fade.classList.add('out'), 60);
    mostrarBarra();
  }
  function salir() {
    if (!C.on) return;
    C.on = false; setPlay(false); app.controls.enabled = true;
    if (C.prev) C.prev.pause();
    if (musica) { musica.pause(); musica.currentTime = 0; volM = 0; }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    el.classList.add('hidden'); document.body.classList.remove('cine-on');
    S.cine = false; S.labels = C.labels;
    if (S.simOn) app.stopSim();
    if (CFG.cineReset) CFG.cineReset(app.eq);
    S.tourHL = []; app.refreshHighlight();
    app.setXrayState(false); S.t2 = 0; app.setMode('equipo', { frame: false }); S.t1 = 0; app.syncSlider();
    app.setView('home');
  }

  /* ---------- controles ---------- */
  let ocultar = 0;
  function mostrarBarra() {
    bar.classList.add('show'); el.classList.remove('nocursor');
    clearTimeout(ocultar);
    ocultar = setTimeout(() => { if (C.play) { bar.classList.remove('show'); el.classList.add('nocursor'); } }, 2600);
  }
  el.addEventListener('mousemove', mostrarBarra);
  window.addEventListener('mousemove', () => { if (C.on) mostrarBarra(); });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'play') { if (C.fin) irA(0); setPlay(!C.play); }
    else if (a === 'prev') irA(C.t > 2.5 ? C.k : C.k - 1);
    else if (a === 'next') irA(C.k + 1);
    else if (a === 'cc') { C.cc = !C.cc; b.classList.toggle('on', C.cc); }
    else if (a === 'son') { C.son = !C.son; b.classList.toggle('on', C.son); }
    else if (a === 'voz') { C.voz = !C.voz; b.classList.toggle('on', C.voz); if (C.prev) { if (C.voz && C.play) C.prev.play().catch(() => {}); else C.prev.pause(); } }
    else if (a === 'full') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }
    else if (a === 'exit') salir();
    else if (a === 'again') { irA(0); setPlay(true); }
    mostrarBarra();
  });
  window.addEventListener('keydown', (e) => {
    if (!C.on) return;
    const k = e.key;
    if (k === ' ') { if (C.fin) irA(0); setPlay(!C.play); }
    else if (k === 'ArrowRight') irA(C.k + 1);
    else if (k === 'ArrowLeft') irA(C.t > 2.5 ? C.k : C.k - 1);
    else if (k === 'Escape') salir();
    else if (k === 'f' || k === 'F') q('[data-a="full"]').click();
    else if (k === 'c' || k === 'C') q('[data-a="cc"]').click();
    else return;
    e.preventDefault(); e.stopImmediatePropagation(); mostrarBarra();
  }, true);
  btn.addEventListener('click', entrar);
  app.pelicula = { entrar, salir, estado: C, ir: irA, tick, guion: P };
}
