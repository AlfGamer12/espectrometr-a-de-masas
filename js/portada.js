// Portada: catálogo de equipos agrupado por área, principio de medida, marca o técnica; comparativa y clasificaciones.
import { EQUIPOS, MARCAS, TIPOS, CLASES, MODOS, AREAS } from './equipos/catalogo.js';
import { esquema } from './esquemas.js';
import { injectIcons, icon } from './icons.js';

injectIcons();
const $ = (id) => document.getElementById(id);
const F = { group: 'area', area: 'Todas', marca: 'Todas', tipo: 'Todas' };
const AREA_POR_NOMBRE = Object.fromEntries(Object.entries(AREAS).map(([k, a]) => [a.corto, k]));
const campos = (e) => AREAS[e.area || 'masas'].campos;
const nombreCorto = (e) => `${e.marca === 'Modelo didáctico' ? '' : e.marca + ' '}${e.modelo}`;

$('btnTheme').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t; localStorage.setItem('ms-theme', t);
});

function seg(el, values, key) {
  const x = el.scrollLeft;
  el.innerHTML = ['Todas', ...values].map((v) => `<button data-v="${v}" class="${F[key] === v ? 'active' : ''}">${v === 'Todas' ? 'Todas' : v}</button>`).join('');
  el.scrollLeft = x;
  el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { F[key] = b.dataset.v; seg(el, values, key); render(); }));
  el.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  fundido(el);
}
/** Móvil: los grupos de filtros que no caben se desplazan en horizontal; un fundido en el borde indica que hay más. */
function fundido(el) {
  const max = el.scrollWidth - el.clientWidth;
  el.classList.toggle('fade-l', max > 2 && el.scrollLeft > 2);
  el.classList.toggle('fade-r', max > 2 && el.scrollLeft < max - 2);
}
const FILTROS = ['fGroup', 'fArea', 'fMarca', 'fTipo'];
for (const id of FILTROS) $(id).addEventListener('scroll', () => fundido($(id)), { passive: true });
window.addEventListener('resize', () => FILTROS.forEach((id) => fundido($(id))));
seg($('fArea'), Object.values(AREAS).map((a) => a.corto), 'area');
seg($('fMarca'), Object.keys(MARCAS), 'marca');
seg($('fTipo'), Object.keys(TIPOS), 'tipo');
$('fGroup').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  F.group = b.dataset.v;
  $('fGroup').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  render();
}));
fundido($('fGroup'));

function card(e, i) {
  const t = TIPOS[e.tipo], c = campos(e);
  return `
  <article class="card">
    <a class="card-vis" href="visor.html?eq=${e.id}" aria-label="Abrir ${e.marca} ${e.modelo}">
      ${esquema(e.esquema)}
      <span class="card-num">${String(i + 1).padStart(2, '0')}</span>
    </a>
    <div class="card-body">
      <div class="card-top"><span class="c-brand">${e.marca}</span><span class="badge-t">${e.tipo}</span></div>
      <h3>${e.modelo}</h3>
      <div class="c-type">${t.nombre}</div>
      <p>${e.resumen}</p>
      <table class="mini">
        <tr><td>${c.entrada}</td><td>${e.entrada}</td></tr>
        <tr><td>${c.fuente}</td><td>${e.fuente}</td></tr>
        <tr><td>${c.analizador}</td><td>${e.analizador}</td></tr>
        <tr><td>${c.detector}</td><td>${e.detector}</td></tr>
      </table>
    </div>
    <div class="card-foot">
      <a class="btn primary" href="visor.html?eq=${e.id}">${icon('cube')}Abrir visor 3D</a>
      <span class="muted c-app">${e.aplicaciones}</span>
    </div>
  </article>`;
}

const GRUPOS = {
  area: { claves: () => Object.keys(AREAS), de: (e) => e.area, info: (k) => AREAS[k], titulo: (k, i) => i.nombre },
  clase: { claves: () => Object.keys(CLASES), de: (e) => e.clase, info: (k) => CLASES[k], titulo: (k, i) => i.nombre },
  marca: { claves: () => Object.keys(MARCAS), de: (e) => e.marca, info: (k) => MARCAS[k], titulo: (k) => k },
  tipo: { claves: () => Object.keys(TIPOS), de: (e) => e.tipo, info: (k) => TIPOS[k], titulo: (k, i) => i.nombre },
};

function render() {
  const areaSel = AREA_POR_NOMBRE[F.area];
  const list = EQUIPOS.filter((e) => (F.area === 'Todas' || e.area === areaSel) && (F.marca === 'Todas' || e.marca === F.marca) && (F.tipo === 'Todas' || e.tipo === F.tipo));
  const G = GRUPOS[F.group];
  const html = [];
  let maxN = 0;
  for (const k of G.claves()) {
    const sub = list.filter((e) => G.de(e) === k);
    if (!sub.length) continue;
    maxN = Math.max(maxN, sub.length);
    const info = G.info(k);
    const n = `${sub.length} equipo${sub.length > 1 ? 's' : ''}`;
    const sideline = F.group === 'marca' ? info.pais : F.group === 'tipo' ? `${info.fuente} · ${info.analizador}` : n;
    html.push(`<div class="group"><div class="group-head"><h3>${G.titulo(k, info)}</h3><span class="muted">${sideline}</span></div>
      <p class="group-desc">${info.desc}</p><div class="grid">${sub.map((e) => card(e, EQUIPOS.indexOf(e))).join('')}</div></div>`);
  }
  $('cards').classList.toggle('cols', maxN <= 1);
  $('cards').innerHTML = html.join('') || '<p class="empty">No hay equipos con esos filtros.</p>';
}
render();

// Comparativa: una tabla por área, con los rótulos propios de cada una
{
  const filas = ['entrada', 'fuente', 'analizador', 'detector', 'vacio', 'rango', 'resolucion'];
  $('cmpTables').innerHTML = Object.entries(AREAS).map(([k, a]) => {
    const eqs = EQUIPOS.filter((e) => e.area === k);
    if (!eqs.length) return '';
    const rows = [['Marca', 'marca'], ['Técnica', 'tipo'], ...filas.map((f) => [a.campos[f], f]), ['Aplicaciones típicas', 'aplicaciones']];
    return `<h4 class="cmp-area">${a.nombre}</h4>
      <div class="table-wrap"><table class="cmp">
      <thead><tr><th></th>${eqs.map((e) => `<th><a href="visor.html?eq=${e.id}">${e.marca}<b>${e.modelo}</b></a></th>`).join('')}</tr></thead>
      <tbody>${rows.map(([l, f]) => `<tr><td>${l}</td>${eqs.map((e) => `<td>${e[f]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }).join('');
}
// Técnicas
$('techGrid').innerHTML = Object.entries(TIPOS).map(([k, t]) => {
  const eqs = EQUIPOS.filter((e) => e.tipo === k);
  const c = eqs.length ? campos(eqs[0]) : AREAS.masas.campos;
  return `<div class="tech">
    <div class="tech-k">${k}</div>
    <h4>${t.nombre}</h4>
    <p>${t.desc}</p>
    <table class="mini"><tr><td>${c.fuente}</td><td>${t.fuente}</td></tr><tr><td>${c.analizador}</td><td>${t.analizador}</td></tr></table>
    <div class="tech-eq">${eqs.map((e) => `<a href="visor.html?eq=${e.id}">${e.marca} ${e.modelo}${icon('arrow')}</a>`).join('')}</div>
  </div>`;
}).join('');

// Clasificación por principio de medida
$('claseGrid').innerHTML = Object.entries(CLASES).map(([k, c]) => {
  const eqs = EQUIPOS.filter((e) => e.clase === k);
  if (!eqs.length) return '';
  return `<div class="tech">
    <div class="tech-k">${k}</div>
    <h4>${c.nombre}</h4>
    <p>${c.desc}</p>
    <div class="tech-eq">${eqs.map((e) => `<a href="visor.html?eq=${e.id}">${nombreCorto(e)} · ${TIPOS[e.tipo].analizador}${icon('arrow')}</a>`).join('')}</div>
  </div>`;
}).join('');
// Modos de adquisición (solo espectrometría de masas): matriz modo × equipo y fichas
{
  const eqs = EQUIPOS.filter((e) => e.area === 'masas');
  $('modosTable').innerHTML = `<thead><tr><th>Modo</th>${eqs.map((e) => `<th><a href="visor.html?eq=${e.id}">${e.marca === 'Modelo didáctico' ? 'Sector' : e.marca}<b>${e.modelo}</b></a></th>`).join('')}</tr></thead>
    <tbody>${MODOS.map((m) => `<tr><td><span class="m-grp">${m.grupo}</span>${m.nombre}</td>${eqs.map((e) => `<td class="chk">${m.equipos.includes(e.id) ? '<span class="dot-ok" title="Disponible"></span>' : '<span class="dot-no">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>`;
  $('modosGrid').innerHTML = MODOS.map((m) => `<div class="tech"><div class="tech-k">${m.grupo}</div><h4>${m.nombre}</h4><p>${m.desc}</p>
    <table class="mini"><tr><td>Uso típico</td><td>${m.uso}</td></tr></table>
    <div class="tech-eq">${eqs.filter((e) => m.equipos.includes(e.id)).map((e) => `<a href="visor.html?eq=${e.id}">${nombreCorto(e)}${icon('arrow')}</a>`).join('')}</div></div>`).join('');
}
