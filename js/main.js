// Visor técnico 3D genérico. Carga la configuración del equipo indicado en la URL (?eq=<id>)
// y monta escena, cámara, interacción, interfaz, recorrido y simulación.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { studioScene } from './studio.js';
import { initFlex, updateFlex } from './parts.js';
import { initPelicula } from './pelicula.js';
import { parts, finalizeParts, applyExplode,worldCenter, boxFor, setHighlight, setXray, setModeVisibility,
  partFromObject, isPickable, ownMeshes } from './parts.js';
import { EQUIPOS, MARCAS, TIPOS, equipo as metaDe } from './equipos/catalogo.js';
import { injectIcons, icon } from './icons.js';
import { montarAnimacion, abrirGrande, cerrarGrande } from './anim2d/motor.js';

injectIcons();
const $ = (id) => document.getElementById(id);
// Disposición adaptable (las mismas consultas que en css/styles.css, sección «Tabletas y móviles»)
const MQ = {
  cajon: matchMedia('(max-width: 860px), (max-height: 500px) and (max-width: 1000px)'), // estructura del modelo como cajón
  movil: matchMedia('(max-width: 760px) and (min-height: 501px)'),                       // móvil vertical: hojas inferiores
  tactil: matchMedia('(hover: none) and (pointer: coarse)'),
};

/* ===================== EQUIPO ===================== */
const qid = new URLSearchParams(location.search).get('eq');
const META = metaDe(qid) || EQUIPOS[0];
const CFG = (await import(`./equipos/${META.id}/index.js`)).default;
const { INFO, CATEGORIAS, RECORRIDO } = CFG;
// Animaciones 2D «Cómo funciona» por componente (opcional: js/equipos/<id>/animaciones.js)
const ANIM = await import(`./equipos/${META.id}/animaciones.js`).then((m) => m.ANIMACIONES || {}).catch(() => ({}));
const MODE_NAME = CFG.modos;
document.title = `${META.marca} ${META.modelo} · Visor técnico 3D`;
$('brandName').textContent = META.marca;
$('modelName').textContent = META.modelo;
$('typeLine').textContent = `${TIPOS[META.tipo].nombre} · Visor técnico 3D`;
// sigla del logotipo según la técnica (MS para los espectrómetros de masas)
{ const sigla = { 'UV-Vis': 'UV', FTIR: 'IR', RMN: 'RMN', GC: 'GC', HPLC: 'LC' }[META.tipo]; if (sigla) document.querySelector('#topbar .mark').textContent = sigla; }
document.querySelectorAll('#modeTabs button').forEach((b) => (b.textContent = MODE_NAME[b.dataset.mode]));
$('aboutBody').innerHTML = CFG.about;

const CAT_COLOR_LIST = ['#8b6fc9', '#d9773e', '#c9a227', '#2f9fc7', '#3a9a6a', '#c75b8a', '#8a94a0', '#6b7fc9', '#4aa3a0', '#b0705a'];
const CAT_COLOR = Object.fromEntries(CATEGORIAS.map((c, i) => [c, CAT_COLOR_LIST[i % CAT_COLOR_LIST.length]]));

/* ===================== RENDER ===================== */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'c3d';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
let envRT = null;

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1.0, 2500);
// near = 1 cm: buena precisión de profundidad a distancia (evita el parpadeo entre superficies muy próximas)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.9;
controls.autoRotateSpeed = 0.6;
controls.minDistance = 4;
controls.maxDistance = 1200;

const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3f46, 0.35);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 2.0);
key.position.set(50, 130, 70);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 400 });
key.shadow.bias = -0.0003; key.shadow.normalBias = 0.025; key.shadow.radius = 4;
scene.add(key);
const fill = new THREE.DirectionalLight(0xdfe9ff, 0.45); fill.position.set(-90, 40, 60); scene.add(fill);
const rim = new THREE.DirectionalLight(0xfff1e0, 0.55); rim.position.set(30, 50, -120); scene.add(rim);

// Suelo: solo recibe sombras (fondo transparente sobre el degradado CSS) + rejilla técnica que se desvanece.
const floor = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.ShadowMaterial({ opacity: 0.2 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
function gridTexture() {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const n = 50; // 500 cm / 10 cm
  for (let i = 0; i <= n; i++) {
    const p = (i / n) * S;
    g.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
    g.lineWidth = i % 5 === 0 ? 2.2 : 1.2;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
  }
  g.globalCompositeOperation = 'destination-in';
  const r = g.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S / 2);
  r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.55, 'rgba(0,0,0,0.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  return t;
}
const grid = new THREE.Mesh(new THREE.PlaneGeometry(500, 500),
  new THREE.MeshBasicMaterial({ map: gridTexture(), transparent: true, depthWrite: false, opacity: 0.25 }));
grid.rotation.x = -Math.PI / 2; grid.position.y = 0.03; grid.renderOrder = -1; scene.add(grid);

/* ===================== POSTPROCESADO: oclusión ambiental (GTAO) ===================== */
const AO_PR = Math.min(window.devicePixelRatio, 1.5);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(AO_PR);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, window.innerWidth * AO_PR, window.innerHeight * AO_PR);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 1.0;
gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, radiusExponent: 1, rings: 2, samples: 16 });
{
  // Las mallas casi transparentes (carcasas en modo transparencia, cuarzo, vidrio, haces) no proyectan oclusión.
  const base = gtao.overrideVisibility.bind(gtao);
  gtao.overrideVisibility = function () {
    base();
    this.scene.traverse((o) => {
      if (o.isMesh && o.material && o.material.transparent && o.material.opacity < 0.6) o.visible = false;
      if (o === grid) o.visible = false;
    });
  };
}
composer.addPass(gtao);
composer.addPass(new OutputPass());
const AO_DEF = {
  equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  analizador: { radius: 1.2, thickness: 1.2, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
};
const AO_PARAMS = CFG.ao || AO_DEF;
let aoOn = localStorage.getItem('ms-ao') !== 'off';

/* ===================== MODELO ===================== */
const root = new THREE.Group();
scene.add(root);
const eq = CFG.build(root);
finalizeParts(scene);
initFlex();
{
  // Cámara de sombras ajustada al tamaño del equipo (en reposo y explosionado), para que la sombra no se recorte
  // en los equipos grandes y tenga más resolución en los pequeños.
  const all = [...parts.keys()];
  const bb = boxFor(all, scene, 0, 0, 0, 0).union(boxFor(all, scene, 1, 1, 0, 0));
  const c = bb.getCenter(new THREE.Vector3()), R = bb.getSize(new THREE.Vector3()).length() / 2 * 1.15 + 10;
  const dir = key.position.clone().normalize();
  key.position.copy(c).addScaledVector(dir, R + 60); key.target.position.copy(c); scene.add(key.target);
  Object.assign(key.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 2 * R + 120 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = Math.max(0.025, (2 * R / 4096) * 0.6);
}

const byInfo = new Map();
for (const p of parts.values()) {
  if (!byInfo.has(p.info)) byInfo.set(p.info, []);
  byInfo.get(p.info).push(p);
}
const idsOf = (info) => (byInfo.get(info) || []).map((p) => p.id);
const infoMode = (info) => ((byInfo.get(info) || []).every((p) => p.level === 2) ? 'analizador' : 'equipo');
const EXTERIOR = new Set(CFG.EXTERIOR);
const MAIN_TAGS = new Set(CFG.MAIN_TAGS);

const POS = {};
{
  let n = 1;
  for (const cat of CATEGORIAS) for (const [id, d] of Object.entries(INFO)) if (d.cat === cat && byInfo.has(id)) POS[id] = n++;
  $('partCount').textContent = `${n - 1} componentes`;
}
const posLabel = (id) => String(POS[id] || 0).padStart(2, '0');

/* ===================== PANEL DE SIMULACIÓN (genérico) ===================== */
const SP = CFG.sim.panel;
const simVals = Object.fromEntries(SP.controles.map((c) => [c.id, c.value]));
$('simTitle').textContent = SP.titulo || 'Simulación';
$('chartT1').textContent = SP.graficas[0];
$('chartT2').textContent = SP.graficas[1] || '';
$('simRead').innerHTML = SP.lecturas.map(([id, l]) => `<div><span>${l}</span><b id="ro_${id}">–</b></div>`).join('');
$('simNote').innerHTML = SP.nota || '';
$('simLegend').innerHTML = (SP.leyenda || []).map(([c, l]) => `<span class="lg" style="background:${c}"></span>${l}`).join(' ');
$('simCtrls').innerHTML = SP.controles.map((c) =>
  `<label id="wrap_${c.id}">${c.label}<select id="ctl_${c.id}">${(c.opciones || []).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`).join('');
const sim = new CFG.sim.Clase(eq, {
  canvases: [$('cv1'), $('cv2')],
  read: Object.fromEntries(SP.lecturas.map(([id]) => [id, $('ro_' + id)])),
});
function syncSimCtrls() {
  for (const c of SP.controles) {
    const sel = $('ctl_' + c.id);
    if (c.dinamico) {
      const opts = sim.options(c.id) || [];
      sel.innerHTML = opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
      const v = sim.value(c.id); if (v != null) { sel.value = v; simVals[c.id] = v; }
    } else if (simVals[c.id] != null) sel.value = simVals[c.id];
    $('wrap_' + c.id).classList.toggle('hidden', c.visible ? !c.visible(simVals) : false);
  }
}
for (const c of SP.controles) {
  $('ctl_' + c.id).addEventListener('change', (e) => { simVals[c.id] = e.target.value; sim.setControl(c.id, e.target.value); syncSimCtrls(); });
}
syncSimCtrls();

/* ===================== TEMA ===================== */
function applyTheme(t) {
  const light = t === 'light';
  document.documentElement.dataset.theme = t;
  localStorage.setItem('ms-theme', t);
  if (envRT) envRT.dispose();
  envRT = pmrem.fromScene(studioScene(light), 0.035);
  scene.environment = envRT.texture;
  scene.environmentIntensity = light ? 0.72 : 1.05;
  hemi.intensity = light ? 0.4 : 0.45;
  key.intensity = light ? 1.7 : 2.0;
  floor.material.opacity = light ? 0.24 : 0.4;
  grid.material.color.setHex(light ? 0x56606c : 0x9aa6b4);
  grid.material.opacity = light ? 0.22 : 0.13;
  sim.setTheme(light);
  $('metaTheme')?.setAttribute('content', light ? '#ffffff' : '#1d2127');
}
$('btnTheme').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/* ===================== ESTADO ===================== */
const S = { mode: 'equipo', e1: 0, e2: 0, t1: 0, t2: 0, xray: false, sel: null, hover: null, tourHL: [], labels: true,
  simOn: false, tour: -1, lastE1: -1, lastE2: -1 };
const V3 = (a) => new THREE.Vector3(...a);
const DIRS = { equipo: V3(CFG.DIRS.equipo), analizador: V3(CFG.DIRS.analizador) };
const VIEWS = {
  front: new THREE.Vector3(0, 0.08, 1), right: new THREE.Vector3(1, 0.08, 0), top: new THREE.Vector3(0.001, 1, 0.02),
  iso: new THREE.Vector3(1, 0.82, 1),
};
const FOCO = CFG.FOCO;

/* ===================== CÁMARA ===================== */
/** Márgenes ocupados por la interfaz (px): el modelo se encuadra y se centra en el hueco libre. */
function uiInsets() {
  const W = window.innerWidth, wide = W > 860;
  if (MQ.cajon.matches) return insetsCompactos(W, window.innerHeight);
  // modo película: pantalla libre salvo la franja de subtítulos (y el panel de simulación, si está abierto)
  if (S.cine) return { left: 0, right: 0, top: 24, bottom: S.simOn ? 290 + 120 : 120 };
  const tourOn = S.tour >= 0, side = tourOn && S.simOn;          // con simulación, el recorrido se acopla a la derecha
  let right = 0;
  if (wide && !$('info').classList.contains('hidden')) right = $('info').offsetWidth + 20;
  else if (wide && side) right = $('tour').offsetWidth + 20;
  const top = 52 + (tourOn && !side ? $('tour').offsetHeight + 18 : 0);
  return { left: wide ? $('sidebar').offsetWidth + 20 : 0, right, top, bottom: 26 + 56 + (S.simOn ? 290 : 0) };
}
/** Tabletas y móviles: márgenes medidos sobre los paneles visibles (hojas inferiores, paneles laterales, barras).
 *  offsetTop/offsetLeft ignoran las transformaciones, así que las hojas cuentan con su posición final aunque estén entrando. */
function insetsCompactos(W, H) {
  const vis = (el) => el && el.offsetWidth > 0 && el.offsetHeight > 0;
  const sp = $('simpanel');
  if (S.cine) {
    const sim = S.simOn && vis(sp) ? sp : null;
    if (sim && sim.offsetWidth < W * 0.5) return { left: 0, right: W - sim.offsetLeft, top: 16, bottom: 80 };
    return { left: 0, right: 0, top: 24, bottom: (sim ? H - sim.offsetTop : 0) + (MQ.movil.matches ? 170 : 120) };
  }
  let top = $('topbar').offsetHeight, bottom = 0, left = 0, right = 0;
  const mt = $('modeTabs');
  if (MQ.movil.matches && vis(mt)) top = Math.max(top, mt.offsetTop + mt.offsetHeight);
  for (const el of [$('viewbar'), document.querySelector('.nav-main'), $('statusbar')]) if (vis(el)) bottom = Math.max(bottom, H - el.offsetTop);
  // la estructura del modelo es un selector pasajero: no se tiene en cuenta
  for (const el of [$('info'), sp, $('tour')]) {
    if (!vis(el)) continue;
    const x = el.offsetLeft, y = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
    if (w < W * 0.5) { if (x + w / 2 < W / 2) left = Math.max(left, x + w); else right = Math.max(right, W - x); }
    else if (y + h / 2 > H / 2) bottom = Math.max(bottom, H - y);
    else top = Math.max(top, y + h);
  }
  return { left: left ? left + 8 : 0, right: right ? right + 8 : 0, top: top + 6, bottom: bottom + 6 };
}
let fly = null, cineTick = null;
function flyTo(pos, target, dur = 1.2) {
  if (dur <= 0) { fly = null; camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
  fly = { p0: camera.position.clone(), q0: controls.target.clone(), p1: pos, q1: target, t: 0, dur };
}
function frameIds(ids, dir = null, dur = 1.2, pad = 1.15) {
  const e1 = S.mode === 'analizador' ? 0 : S.t1;
  const b = boxFor(ids, scene, e1, S.t2, S.e1, S.e2);
  if (b.isEmpty()) return;
  const c = b.getCenter(new THREE.Vector3());
  const r = Math.max(1.5, b.getSize(new THREE.Vector3()).length() / 2);
  // Ajuste a la zona libre de la pantalla (sin paneles laterales, barra de herramientas ni panel de simulación)
  // ventana de tamaño cero (pestaña oculta al cargar): se usa un tamaño de referencia para no producir NaN
  const W = window.innerWidth || 1440, Hh = window.innerHeight || 860;
  if (!(camera.aspect > 0)) { camera.aspect = W / Hh; camera.updateProjectionMatrix(); }
  const I = uiInsets();
  const availW = Math.max(200, W - I.left - I.right), availH = Math.max(160, Hh - I.top - I.bottom);
  const vf = THREE.MathUtils.degToRad(camera.fov / 2);
  const hf = Math.atan(Math.tan(vf) * camera.aspect);
  let dist = Math.max(r / Math.sin(vf) * (Hh / availH), r / Math.sin(hf) * (W / availW)) * pad * 0.9;
  const d = (dir ? (Array.isArray(dir) ? new THREE.Vector3(...dir) : dir.clone()) : camera.position.clone().sub(controls.target)).normalize();
  if (CFG.encuadreCaja) {
    // equipos alargados: ajuste a la caja proyectada en lugar de a la esfera envolvente
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize(), up = new THREE.Vector3().crossVectors(d, right);
    let hw = 0, hv = 0, hd = 0;
    for (const sx of [b.min.x, b.max.x]) for (const sy of [b.min.y, b.max.y]) for (const sz of [b.min.z, b.max.z]) {
      const p = new THREE.Vector3(sx, sy, sz).sub(c); hw = Math.max(hw, Math.abs(p.dot(right))); hv = Math.max(hv, Math.abs(p.dot(up))); hd = Math.max(hd, Math.abs(p.dot(d)));
    }
    dist = (Math.max(hv / Math.tan(vf) * (Hh / availH), hw / Math.tan(hf) * (W / availW)) + hd) * pad;
  }
  flyTo(c.clone().addScaledVector(d, dist), c, dur);
}
function setView(v) {
  const ids = S.sel ? idsOf(S.sel) : FOCO[S.mode];
  if (v === 'home') { frameIds(FOCO[S.mode], DIRS[S.mode], 1.0, S.mode === 'equipo' ? 1.0 : 1.15); return; }
  frameIds(ids, VIEWS[v], 1.0, S.sel ? 1.6 : 1.05);
}
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

/* ===================== MODO / EXPLOSIONADO / TRANSPARENCIA ===================== */
const slider = $('explode');
function syncSlider() {
  const v = S.mode === 'equipo' ? S.t1 : S.t2;
  slider.value = Math.round(v * 100);
  slider.style.setProperty('--v', Math.round(v * 100) + '%');   // relleno de la pista (estilo táctil)
  $('explodeVal').textContent = Math.round(v * 100) + ' %';
  slider.disabled = S.simOn && S.mode === 'analizador';
}
function setMode(mode, { frame = true } = {}) {
  S.mode = mode;
  document.querySelectorAll('#modeTabs button').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  setModeVisibility(mode);
  if (mode === 'analizador') S.t1 = 0;
  if (mode === 'equipo' && S.simOn) stopSim();
  grid.visible = floor.visible = mode === 'equipo';
  $('stMode').textContent = `${MODE_NAME[mode]} · Unidades: cm`;
  gtao.updateGtaoMaterial(AO_PARAMS[mode]);
  syncSlider();
  if (frame) frameIds(FOCO[mode], DIRS[mode]);
}
function setExplode(v) {
  if (S.mode === 'equipo') S.t1 = v; else S.t2 = v;
  syncSlider();
}
function setXrayState(on) {
  S.xray = on; $('tgXray').classList.toggle('on', on); setXray(on);
}
slider.addEventListener('input', () => setExplode(slider.value / 100));
document.querySelectorAll('#modeTabs button').forEach((b) => b.addEventListener('click', () => { endTour(); setMode(b.dataset.mode); }));
$('tgXray').addEventListener('click', () => setXrayState(!S.xray));
$('tgLabels').addEventListener('click', () => { S.labels = !S.labels; $('tgLabels').classList.toggle('on', S.labels); });
function setAO(on) { aoOn = on; $('tgAO').classList.toggle('on', on); localStorage.setItem('ms-ao', on ? 'on' : 'off'); }
setAO(aoOn);
$('tgAO').addEventListener('click', () => setAO(!aoOn));
$('tgRotate').addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; $('tgRotate').classList.toggle('on', controls.autoRotate); });

/* ===================== RESALTADO Y SELECCIÓN ===================== */
function refreshHighlight() {
  const sel = new Set([...(S.sel ? idsOf(S.sel) : []), ...S.tourHL]);
  const hov = new Set(S.hover && S.hover !== S.sel ? idsOf(S.hover) : []);
  for (const p of parts.values()) setHighlight([p.id], sel.has(p.id) ? 'sel' : hov.has(p.id) ? 'hover' : 'off');
  if (S.simOn && sim.keepGlow) sim.keepGlow();
}

function select(info, { focus = false } = {}) {
  S.sel = info && INFO[info] ? info : null;
  refreshHighlight();
  document.querySelectorAll('.item').forEach((el) => el.classList.toggle('sel', el.dataset.info === S.sel));
  $('stSel').innerHTML = S.sel ? `Selección: <b>${INFO[S.sel].nombre}</b> · Pos. ${posLabel(S.sel)}` : 'Sin selección';
  if (!S.sel) { cerrarAnimInfo(); $('info').classList.add('hidden'); document.body.classList.remove('info-open', 'info-full'); return; }
  showInfo(S.sel);
  if (focus) {
    const m = infoMode(S.sel);
    if (m !== S.mode) setMode(m, { frame: false });
    if (m === 'equipo' && !EXTERIOR.has(S.sel) && S.t1 < 0.5 && !S.xray) setXrayState(true);
    frameIds(idsOf(S.sel), null, 1.0, 1.6);
  }
}

function shortName(info) { return INFO[info].nombre.split(' (')[0].split(' / ')[0]; }

let animInfo = null, animTok = 0;
function cerrarAnimInfo() { animTok++; animInfo?.destroy(); animInfo = null; }
function showInfo(info) {
  cerrarAnimInfo();
  const d = INFO[info];
  const an = ANIM[info];
  const c = CAT_COLOR[d.cat] || '#8a94a0';
  const links = (d.une || []).filter((u) => INFO[u] && byInfo.has(u))
    .map((u) => `<button data-go="${u}"><span>${shortName(u)}</span>${icon('chev')}</button>`).join('');
  const m = infoMode(info);
  $('infoBody').innerHTML = `
    <div class="p-meta" style="--c:${c}"><span class="dot"></span>${d.cat}<span class="ref">Pos. ${posLabel(info)}</span></div>
    <h3>${d.nombre}</h3>
    <div class="en">${d.en}</div>
    <h4>Función</h4><p>${d.funcion}</p>
    ${an ? `<h4>Cómo funciona</h4><div id="infoAnim"></div>` : ''}
    ${d.detalles?.length ? `<h4>Descripción técnica</h4><ul>${d.detalles.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
    ${d.specs?.length ? `<h4>Datos técnicos</h4><table class="specs">${d.specs.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>` : ''}
    ${d.tune?.length ? `<h4>${CFG.tuneTitulo || 'Parámetros del informe de tune'}</h4><div class="tune">${d.tune.map((t) => `<code>${t}</code>`).join('')}</div>` : ''}
    ${links ? `<h4>Conexiones</h4><div class="links">${links}</div>` : ''}
    <div class="info-actions">
      <button class="btn small" id="infoFocus">${icon('focus')}Enfocar</button>
      ${m !== S.mode ? `<button class="btn small" id="infoMode">Abrir en ${MODE_NAME[m]}</button>` : ''}
    </div>`;
  $('info').classList.remove('hidden');
  document.body.classList.add('info-open');
  $('infoBody').scrollTop = 0;
  $('infoBody').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => select(b.dataset.go, { focus: true })));
  $('infoFocus').addEventListener('click', () => select(info, { focus: true }));
  $('infoMode')?.addEventListener('click', () => select(info, { focus: true }));
  if (an) {
    const tok = animTok;
    montarAnimacion($('infoAnim'), an, { alAmpliar: (est) => { animInfo?.setPlay(false); abrirGrande(an, est); } })
      .then((c) => { if (tok === animTok) animInfo = c; else c?.destroy(); });
  }
}
$('infoClose').addEventListener('click', () => select(null));

/* ===================== ESTRUCTURA DEL MODELO ===================== */
const closedCats = new Set();
function buildList() {
  const q = $('search').value.trim().toLowerCase();
  const html = [];
  for (const cat of CATEGORIAS) {
    const items = Object.entries(INFO).filter(([id, d]) => d.cat === cat && byInfo.has(id) &&
      (!q || (d.nombre + ' ' + d.en).toLowerCase().includes(q)));
    if (!items.length) continue;
    const closed = closedCats.has(cat) && !q;
    html.push(`<button class="cat ${closed ? 'closed' : ''}" data-cat="${cat}">${icon('chev')}${cat}<span class="n">${items.length}</span></button>`);
    html.push(`<div class="cat-items ${closed ? 'closed' : ''}">`);
    for (const [id] of items) {
      const md = infoMode(id) === 'analizador' ? '<span class="md">A</span>' : '';
      html.push(`<button class="item ${S.sel === id ? 'sel' : ''}" data-info="${id}" style="--c:${CAT_COLOR[cat]}" title="${INFO[id].nombre}">` +
        `<span>${shortName(id)}</span>${md}<span class="pos">${posLabel(id)}</span></button>`);
    }
    html.push('</div>');
  }
  $('partList').innerHTML = html.join('') || '<p class="empty">No hay componentes que coincidan con la búsqueda.</p>';
  $('partList').querySelectorAll('.cat').forEach((b) => b.addEventListener('click', () => {
    const c = b.dataset.cat; closedCats.has(c) ? closedCats.delete(c) : closedCats.add(c); buildList();
  }));
  $('partList').querySelectorAll('.item').forEach((b) => {
    b.addEventListener('click', () => { if (MQ.cajon.matches) setParts(false); select(b.dataset.info, { focus: true }); });
    b.addEventListener('mouseenter', () => { S.hover = b.dataset.info; refreshHighlight(); });
    b.addEventListener('mouseleave', () => { S.hover = null; refreshHighlight(); });
  });
}
$('search').addEventListener('input', buildList);

/* ===================== ETIQUETAS ===================== */
const tags = [];
for (const p of parts.values()) {
  if (!p.label || !INFO[p.info]) continue;
  const el = document.createElement('div');
  el.className = 'tag';
  el.textContent = shortName(p.info);
  el.addEventListener('click', () => select(p.info, { focus: true }));
  el.addEventListener('mouseenter', () => { S.hover = p.info; refreshHighlight(); });
  el.addEventListener('mouseleave', () => { S.hover = null; refreshHighlight(); });
  $('labels').appendChild(el);
  tags.push({ p, el, idx: tags.length });
}
const _v = new THREE.Vector3();
/** ¿Está la pieza de la etiqueta tapada por otra? (rayo desde la cámara a su centro; se recalcula cada pocos fotogramas) */
const _occRay = new THREE.Raycaster(), _oc = new THREE.Vector3(), _od = new THREE.Vector3();
let _occFrame = 0;
function occluded(t) {
  if (t.p.info === S.sel || t.p.info === S.hover) return false;
  if ((_occFrame + t.idx) % 8 !== 0 && t.occ !== undefined) return t.occ;
  worldCenter(t.p.id, _oc);
  _od.copy(_oc).sub(camera.position); const dist = _od.length(); _od.normalize();
  _occRay.set(camera.position, _od); _occRay.far = dist;
  const hits = _occRay.intersectObject(root, true);
  let occ = false;
  for (const h of hits) {
    if (!isPickable(h.object, S.xray)) continue;
    const q = partFromObject(h.object);
    if (!q || q.info === t.p.info) break;            // la primera superficie es de la propia pieza
    if (h.distance < dist - Math.max(2, t.p.radius * 0.9)) { occ = true; }
    break;
  }
  t.occ = occ;
  return occ;
}
/** Etiquetas sin solapes: se colocan por prioridad (seleccionada, bajo el cursor, más cercana) y se ocultan las que chocan. */
function updateTags() {
  const w = window.innerWidth, h = window.innerHeight;
  const cand = [];
  _occFrame++;
  for (const t of tags) {
    const { p, el } = t;
    let vis = S.labels && p.label === S.mode;
    if (vis && S.mode === 'equipo' && !EXTERIOR.has(p.info) && !S.xray && S.e1 < 0.3) vis = false;
    if (vis && S.mode === 'analizador' && S.e2 < 0.3 && !MAIN_TAGS.has(p.info)) vis = false;
    if (vis) { let any = false; ownMeshes(p.object, (m) => { if (m.visible) any = true; }); vis = any; }
    if (vis) {
      worldCenter(p.id, _v);
      _v.y += p.radius * 0.35;
      _v.project(camera);
      vis = _v.z < 1 && Math.abs(_v.x) < 1.05 && Math.abs(_v.y) < 1.05;
      if (vis && occluded(t)) vis = false;
      if (vis) {
        t.x = ((_v.x + 1) / 2) * w; t.y = ((1 - _v.y) / 2) * h; t.z = _v.z;
        t.pri = p.info === S.sel ? 0 : p.info === S.hover ? 1 : 2;
        cand.push(t);
      }
    }
    if (!vis) el.style.display = 'none';
  }
  cand.sort((a, b) => a.pri - b.pri || a.z - b.z);
  const placed = [];
  for (const t of cand) {
    const { el } = t;
    if (!t.w) { el.style.display = ''; t.w = el.offsetWidth; t.h = el.offsetHeight; }
    const r = { x0: t.x - t.w / 2 - 3, x1: t.x + t.w / 2 + 3, y0: t.y - 16 - t.h - 2, y1: t.y - 14 };
    const hit = t.pri === 2 && placed.some((q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0);
    if (hit) { el.style.display = 'none'; continue; }
    placed.push(r);
    el.style.display = ''; el.style.left = t.x + 'px'; el.style.top = t.y + 'px';
    el.classList.toggle('sel', t.p.info === S.sel);
  }
}
/* ===================== PUNTERO ===================== */
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseDirty = false, downAt = null;
const tooltip = $('tooltip');
function pick() {
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObject(root, true);
  for (const h of hits) if (isPickable(h.object, S.xray)) return partFromObject(h.object);
  return null;
}
// Táctil: sin resaltado «hover» al arrastrar; un toque selecciona, doble toque enfoca; los gestos de dos dedos no seleccionan.
const toques = new Set();
let multitoque = false, ultimoToque = null, ultimoTipo = 'mouse';
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  mouseDirty = true;
  tooltip.style.left = e.clientX + 'px'; tooltip.style.top = e.clientY + 'px';
});
renderer.domElement.addEventListener('pointerleave', () => { S.hover = null; tooltip.classList.add('hidden'); refreshHighlight(); });
renderer.domElement.addEventListener('pointerdown', (e) => {
  toques.add(e.pointerId); if (toques.size > 1) multitoque = true; ultimoTipo = e.pointerType;
  downAt = [e.clientX, e.clientY]; fly = null; closeMenu();
  if (MQ.cajon.matches) setParts(false);
  ocultarAyuda();
});
const finToque = (e) => { toques.delete(e.pointerId); const m = multitoque; if (!toques.size) multitoque = false; return m; };
renderer.domElement.addEventListener('pointercancel', (e) => { finToque(e); downAt = null; });
renderer.domElement.addEventListener('pointerup', (e) => {
  const multi = finToque(e);
  if (!downAt || e.button !== 0) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  const touch = e.pointerType === 'touch';
  if (multi || moved > (touch ? 10 : 5)) return;
  mouse.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  const p = pick();
  if (touch) {
    const now = performance.now(), u = ultimoToque;
    if (p && u && now - u.t < 380 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 32 && u.info === p.info) {
      ultimoToque = null; select(p.info, { focus: true }); return;
    }
    ultimoToque = { t: now, x: e.clientX, y: e.clientY, info: p ? p.info : null };
  }
  select(p ? p.info : null);
});
renderer.domElement.addEventListener('dblclick', () => { if (ultimoTipo === 'touch') return; const p = pick(); if (p) select(p.info, { focus: true }); });

function updateHover() {
  if (!mouseDirty) return;
  mouseDirty = false;
  const p = pick();
  const info = p && INFO[p.info] ? p.info : null;
  if (info !== S.hover) { S.hover = info; refreshHighlight(); }
  renderer.domElement.style.cursor = info ? 'pointer' : 'grab';
  if (info) { tooltip.textContent = INFO[info].nombre; tooltip.classList.remove('hidden'); } else tooltip.classList.add('hidden');
}

/* ===================== RECORRIDO GUIADO ===================== */
function startTour() { S.tour = 0; $('tour').classList.remove('hidden'); document.body.classList.add('tour-open'); $('btnTour').classList.add('on'); applyStep(); }
function endTour() {
  if (S.tour < 0) return;
  S.tour = -1; S.tourHL = []; $('tour').classList.add('hidden'); document.body.classList.remove('tour-open'); $('btnTour').classList.remove('on'); refreshHighlight();
}
function applyStep() {
  const st = RECORRIDO[S.tour], n = RECORRIDO.length;
  $('tourCount').textContent = `Recorrido · Paso ${String(S.tour + 1).padStart(2, '0')} de ${n}`;
  $('tourBar').style.width = ((S.tour + 1) / n) * 100 + '%';
  $('tourTitle').textContent = st.titulo;
  $('tourText').textContent = st.texto;
  // animación del paso: la indicada en el guion o la del primer componente resaltado (las piezas se traducen a su componente)
  const anId = st.anim || (st.resaltar || []).map((id) => (parts.has(id) ? parts.get(id).info : id)).find((id) => ANIM[id]);
  const an = anId && ANIM[anId];
  $('tourAnim').classList.toggle('hidden', !an);
  if (an) { $('tourAnim').querySelector('span').textContent = `Animación: ${an.titulo || 'cómo funciona'}`; $('tourAnim').onclick = () => abrirGrande(an); }
  $('tourDots').innerHTML = RECORRIDO.map((s, i) => `<i class="${i === S.tour ? 'on' : i < S.tour ? 'done' : ''}" data-i="${i}" title="${s.titulo}"></i>`).join('');
  $('tourDots').querySelectorAll('i').forEach((d) => d.addEventListener('click', () => { S.tour = +d.dataset.i; applyStep(); }));
  $('tourPrev').disabled = S.tour === 0;
  $('tourNext').innerHTML = S.tour === n - 1 ? 'Finalizar' : `Siguiente${icon('next')}`;
  select(null);
  if (!st.sim && S.simOn) stopSim();
  setMode(st.modo, { frame: false });
  if (st.e1 != null) S.t1 = st.e1;
  if (st.e2 != null) S.t2 = st.e2;
  setXrayState(!!st.xray);
  if (st.sim && !S.simOn) startSim({ frame: false });
  syncSlider();
  S.tourHL = st.resaltar.flatMap((id) => (parts.has(id) ? [id] : idsOf(id)));
  refreshHighlight();
  frameIds(st.foco, st.dir ? V3(st.dir) : DIRS[st.modo], 1.3, st.pad || (st.modo === 'equipo' ? 1.05 : 1.2));
}
$('btnTour').addEventListener('click', () => (S.tour >= 0 ? endTour() : startTour()));
$('tourClose').addEventListener('click', endTour);
$('tourPrev').addEventListener('click', () => { if (S.tour > 0) { S.tour--; applyStep(); } });
$('tourNext').addEventListener('click', () => {
  if (S.tour < RECORRIDO.length - 1) { S.tour++; applyStep(); } else endTour();
});

/* ===================== SIMULACIÓN ===================== */
function startSim({ frame = true } = {}) {
  S.simOn = true;
  $('simpanel').classList.remove('hidden');
  document.body.classList.add('sim-open');
  $('btnSim').classList.add('on');
  if (S.mode !== 'analizador') setMode('analizador', { frame: false });
  S.t2 = 0;
  if (S.xrayAntes === undefined) S.xrayAntes = S.xray;
  setXrayState(true);
  sim.start();
  syncSimCtrls();
  refreshHighlight();
  syncSlider();
  if (frame) frameIds(CFG.sim.foco, CFG.sim.dir ? V3(CFG.sim.dir) : DIRS.analizador, 1.2, CFG.sim.pad || 1.15);
}
function stopSim() {
  S.simOn = false;
  sim.stop();
  // la simulación activa la transparencia: al terminar se restaura el estado anterior (salvo dentro del recorrido)
  if (S.xrayAntes !== undefined && S.tour < 0) setXrayState(S.xrayAntes);
  S.xrayAntes = undefined;
  $('simpanel').classList.add('hidden');
  document.body.classList.remove('sim-open');
  $('btnSim').classList.remove('on');
  refreshHighlight();
  syncSlider();
}
$('btnSim').addEventListener('click', () => { endTour(); S.simOn ? stopSim() : startSim(); });
$('simClose').addEventListener('click', stopSim);

/* ===================== SELECTOR DE EQUIPO ===================== */
function buildMenu() {
  const html = [];
  for (const marca of Object.keys(MARCAS)) {
    const lista = EQUIPOS.filter((e) => e.marca === marca);
    if (!lista.length) continue;
    html.push(`<div class="menu-grp">${marca}</div>`);
    for (const e of lista) {
      html.push(`<a class="menu-item ${e.id === META.id ? 'cur' : ''}" href="visor.html?eq=${e.id}">` +
        `<span class="mi-name">${e.modelo}</span><span class="badge-t">${e.tipo}</span></a>`);
    }
  }
  html.push(`<a class="menu-foot" href="index.html">${icon('grid')}Ver catálogo y comparativa</a>`);
  $('eqMenu').innerHTML = html.join('');
}
function closeMenu() { $('eqMenu').classList.add('hidden'); $('eqSwitch').classList.remove('open'); }
$('eqSwitch').addEventListener('click', (e) => {
  e.stopPropagation();
  const hid = $('eqMenu').classList.toggle('hidden');
  $('eqSwitch').classList.toggle('open', !hid);
});
document.addEventListener('click', (e) => { if (!$('eqMenu').contains(e.target)) closeMenu(); });
buildMenu();

/* ===================== RECURSOS ===================== */
const RES_ICON = { 'Vídeo': 'video', 'PDF': 'file', 'Manual': 'book', 'Página': 'page' };
function buildResources() {
  const R = CFG.RECURSOS || [];
  const total = R.reduce((s, g) => s + g.items.length, 0);
  $('resBody').innerHTML = `<p class="res-intro">${total} recursos seleccionados sobre el ${META.marca} ${META.modelo}: documentación del fabricante,
    vídeos y guías de laboratorios universitarios. Los enlaces se abren en una pestaña nueva.</p>` +
    R.map((g) => `<h4>${g.grupo}</h4><div class="res-list">${g.items.map((it) => `
      <a class="res" href="${it.url}" target="_blank" rel="noopener noreferrer">
        <span class="res-ic">${icon(RES_ICON[it.tipo] || 'page')}</span>
        <span class="res-main"><b>${it.titulo}</b><small>${it.desc}</small></span>
        <span class="res-meta"><span>${it.tipo}</span><span>${it.idioma}</span><span>${it.fuente}</span></span>
        ${icon('ext', 'res-ext')}
      </a>`).join('')}</div>`).join('');
}
buildResources();
$('btnRes').addEventListener('click', () => $('recursos').classList.remove('hidden'));
$('resClose').addEventListener('click', () => $('recursos').classList.add('hidden'));
$('recursos').addEventListener('click', (e) => { if (e.target.id === 'recursos') $('recursos').classList.add('hidden'); });

/* ===================== MODAL / TECLADO ===================== */
$('btnAbout').addEventListener('click', () => $('about').classList.remove('hidden'));
$('aboutClose').addEventListener('click', () => $('about').classList.add('hidden'));
$('about').addEventListener('click', (e) => { if (e.target.id === 'about') $('about').classList.add('hidden'); });
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Escape') {
    if (cerrarGrande()) return;
    $('about').classList.add('hidden'); $('recursos').classList.add('hidden'); closeMenu();
    if (document.body.classList.contains('parts-open')) { setParts(false); return; }
    if (S.tour >= 0) endTour(); else select(null);
  }
  if (S.tour >= 0 && e.key === 'ArrowRight') $('tourNext').click();
  if (S.tour >= 0 && e.key === 'ArrowLeft') $('tourPrev').click();
});

/* ===================== TABLETAS Y MÓVILES ===================== */
// «Componentes»: la estructura del modelo como cajón (tabletas) u hoja inferior (móvil vertical)
function setParts(on) {
  const b = document.body;
  if (on === b.classList.contains('parts-open')) return;
  b.classList.toggle('parts-open', on);
  $('btnParts').classList.toggle('on', on);
  $('btnParts').setAttribute('aria-expanded', on);
  if (on) $('partList').querySelector('.item.sel')?.scrollIntoView({ block: 'nearest' });
}
$('btnParts').addEventListener('click', () => setParts(!document.body.classList.contains('parts-open')));
$('partsClose').addEventListener('click', () => setParts(false));
document.querySelectorAll('.nav-main .tbtn:not(#btnParts)').forEach((b) => b.addEventListener('click', () => setParts(false)));
// barra de vista compacta: «más» despliega las vistas restantes y los conmutadores
$('tgMore').addEventListener('click', () => {
  const on = document.body.classList.toggle('vb-more');
  $('tgMore').classList.toggle('on', on); $('tgMore').setAttribute('aria-expanded', on);
});
/** Hojas inferiores del móvil: arrastrar el asa hacia abajo cierra (o reduce), hacia arriba amplía. */
function arrastreHoja(hoja, { cerrar, ampliar, reducir, ampliada = () => false }) {
  const cab = hoja.querySelector('.panel-head');
  let y0 = null, dy = 0;
  cab.addEventListener('pointerdown', (e) => {
    if (!MQ.movil.matches || e.button !== 0 || e.target.closest('button, input, select, a')) return;
    y0 = e.clientY; dy = 0; cab.setPointerCapture(e.pointerId); hoja.style.transition = 'none';
  });
  cab.addEventListener('pointermove', (e) => {
    if (y0 === null) return;
    dy = e.clientY - y0;
    hoja.style.transform = dy > 0 ? `translateY(${dy}px)` : '';
  });
  const fin = () => {
    if (y0 === null) return;
    y0 = null; hoja.style.transform = ''; hoja.style.transition = '';
    if (dy > 70) { if (ampliada() && reducir) reducir(); else cerrar(); }
    else if (dy < -40 && ampliar) ampliar();
  };
  cab.addEventListener('pointerup', fin); cab.addEventListener('pointercancel', fin);
}
arrastreHoja($('sidebar'), { cerrar: () => setParts(false) });
arrastreHoja($('info'), { cerrar: () => select(null), ampliar: () => document.body.classList.add('info-full'),
  reducir: () => document.body.classList.remove('info-full'), ampliada: () => document.body.classList.contains('info-full') });
// Ayuda de gestos táctiles (barra de estado, ventana de información y aviso inicial)
let ayuda = null;
function ocultarAyuda() { if (ayuda) { ayuda.classList.remove('show'); setTimeout(() => ayuda?.remove(), 400); ayuda = null; } }
if (MQ.tactil.matches) {
  const txt = 'Un dedo: orbitar · Dos dedos: zoom y desplazar · Doble toque: enfocar pieza';
  document.querySelector('#statusbar .hint').textContent = txt;
  $('navHelp').innerHTML = `
    <tr><td>Orbitar</td><td>Arrastrar con un dedo</td></tr>
    <tr><td>Zoom / desplazar</td><td>Pellizcar / arrastrar con dos dedos</td></tr>
    <tr><td>Seleccionar</td><td>Tocar la pieza, su etiqueta o su nombre en «Componentes»</td></tr>
    <tr><td>Enfocar</td><td>Doble toque sobre la pieza</td></tr>
    <tr><td>Fichas</td><td>Arrastrar el asa hacia arriba para ampliar, hacia abajo para cerrar</td></tr>`;
  ayuda = document.createElement('div');
  ayuda.className = 'toast'; ayuda.textContent = txt;
  document.body.appendChild(ayuda);
  setTimeout(() => ayuda?.classList.add('show'), 900);
  setTimeout(ocultarAyuda, 7000);
  for (const ev of ['pointerdown', 'click', 'keydown']) document.addEventListener(ev, ocultarAyuda, { capture: true, once: true });
}
// película: un toque muestra la barra de control (pelicula.js la muestra con mousemove)
window.addEventListener('touchstart', () => { if (S.cine) window.dispatchEvent(new MouseEvent('mousemove')); }, { passive: true });
// iOS: sin zoom de página por pellizco (el lienzo 3D gestiona sus propios gestos)
document.addEventListener('gesturestart', (e) => e.preventDefault());

window.addEventListener('resize', () => {
  if (!window.innerWidth || !window.innerHeight) return;
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  if (!Number.isFinite(camera.position.x)) frameIds(FOCO[S.mode], DIRS[S.mode], 0, 1.0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* ===================== BUCLE ===================== */
buildList();
setMode('equipo', { frame: false });
frameIds(FOCO.equipo, DIRS.equipo, 0, 1.0);

const clock = new THREE.Clock();
const viewOff = { x: -140, y: 0 };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
function loop() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const k = Math.min(1, dt * 5);
  S.e1 += (S.t1 - S.e1) * k; S.e2 += (S.t2 - S.e2) * k;
  if (Math.abs(S.t1 - S.e1) < 1e-4) S.e1 = S.t1;
  if (Math.abs(S.t2 - S.e2) < 1e-4) S.e2 = S.t2;
  applyExplode(S.e1, S.e2);
  if (CFG.onExplode && (Math.abs(S.e1 - S.lastE1) > 1e-5 || Math.abs(S.e2 - S.lastE2) > 1e-5)) {
    CFG.onExplode(eq, S.e1, S.e2); S.lastE1 = S.e1; S.lastE2 = S.e2;
    scene.updateMatrixWorld(true); updateFlex();
  }
  if (CFG.tick) CFG.tick(eq, dt, S);
  if (fly) {
    fly.t += dt;
    const u = Math.min(1, fly.t / fly.dur), e = easeIO(u);
    camera.position.lerpVectors(fly.p0, fly.p1, e);
    controls.target.lerpVectors(fly.q0, fly.q1, e);
    if (u >= 1) fly = null;
  }
  {
    const w = window.innerWidth, h = window.innerHeight;
    const { left, right, top, bottom } = uiInsets();
    const tx = -(left - right) / 2, ty = (bottom - top) / 2;
    viewOff.x += (tx - viewOff.x) * Math.min(1, dt * 6);
    viewOff.y += (ty - viewOff.y) * Math.min(1, dt * 6);
    camera.setViewOffset(w, h, viewOff.x, viewOff.y, w, h);
  }
  if (cineTick) cineTick(dt, !!fly);
  controls.update();
  sim.update(dt);
  updateHover();
  if (aoOn) composer.render(dt); else renderer.render(scene, camera);
  updateTags();
  requestAnimationFrame(loop);
}
loop();
window.app = { S, camera, controls, select, setMode, frameIds, startSim, stopSim, startTour, endTour, setXrayState, sim, applyTheme, setView, gtao, setAO, eq,
  parts, idsOf, refreshHighlight, syncSlider, setCineTick: (f) => { cineTick = f; } };
initPelicula(window.app, CFG, { marca: META.marca, modelo: META.modelo, linea: TIPOS[META.tipo].nombre });
setTimeout(() => { $('loading').style.opacity = 0; setTimeout(() => $('loading').remove(), 400); }, 250);
