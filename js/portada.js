// Portada: catálogo de equipos agrupado por marca o por técnica, comparativa y clasificación.
import { EQUIPOS, MARCAS, TIPOS, CLASES, MODOS } from './equipos/catalogo.js';
import { esquema } from './esquemas.js';
import { injectIcons, icon } from './icons.js';

injectIcons();
const $ = (id) => document.getElementById(id);
const F = { group: 'clase', marca: 'Todas', tipo: 'Todas' };

$('btnTheme').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = t; localStorage.setItem('ms-theme', t);
});

function seg(el, values, key) {
  el.innerHTML = ['Todas', ...values].map((v) => `<button data-v="${v}" class="${F[key] === v ? 'active' : ''}">${v === 'Todas' ? 'Todas' : v}</button>`).join('');
  el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { F[key] = b.dataset.v; seg(el, values, key); render(); }));
}
seg($('fMarca'), Object.keys(MARCAS), 'marca');
seg($('fTipo'), Object.keys(TIPOS), 'tipo');
$('fGroup').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  F.group = b.dataset.v;
  $('fGroup').querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b));
  render();
}));

function card(e, i) {
  const t = TIPOS[e.tipo];
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
        <tr><td>Entrada</td><td>${e.entrada}</td></tr>
        <tr><td>Fuente</td><td>${e.fuente}</td></tr>
        <tr><td>Analizador</td><td>${e.analizador}</td></tr>
        <tr><td>Detector</td><td>${e.detector}</td></tr>
      </table>
    </div>
    <div class="card-foot">
      <a class="btn primary" href="visor.html?eq=${e.id}">${icon('cube')}Abrir visor 3D</a>
      <span class="muted c-app">${e.aplicaciones}</span>
    </div>
  </article>`;
}

function render() {
  const list = EQUIPOS.filter((e) => (F.marca === 'Todas' || e.marca === F.marca) && (F.tipo === 'Todas' || e.tipo === F.tipo));
  const keys = F.group === 'marca' ? Object.keys(MARCAS) : F.group === 'clase' ? Object.keys(CLASES) : Object.keys(TIPOS);
  const html = [];
  let maxN = 0;
  for (const k of keys) {
    const sub = list.filter((e) => (F.group === 'marca' ? e.marca : F.group === 'clase' ? e.clase : e.tipo) === k);
    if (!sub.length) continue;
    maxN = Math.max(maxN, sub.length);
    const info = F.group === 'marca' ? MARCAS[k] : F.group === 'clase' ? CLASES[k] : TIPOS[k];
    const title = F.group === 'marca' ? k : info.nombre;
    const sideline = F.group === 'marca' ? info.pais : F.group === 'clase' ? `${sub.length} equipo${sub.length > 1 ? 's' : ''}` : `${info.fuente} · ${info.analizador}`;
    html.push(`<div class="group"><div class="group-head"><h3>${title}</h3><span class="muted">${sideline}</span></div>
      <p class="group-desc">${info.desc}</p><div class="grid">${sub.map((e) => card(e, EQUIPOS.indexOf(e))).join('')}</div></div>`);
  }
  $('cards').classList.toggle('cols', maxN <= 1);
  $('cards').innerHTML = html.join('') || '<p class="empty">No hay equipos con esos filtros.</p>';
}
render();

// Comparativa
{
  const rows = [['Marca', 'marca'], ['Técnica', 'tipo'], ['Tipo de analizador', 'clase'], ['Introducción de muestra', 'entrada'], ['Fuente de iones', 'fuente'],
    ['Analizador', 'analizador'], ['Detector', 'detector'], ['Sistema de vacío', 'vacio'], ['Rango de masas', 'rango'],
    ['Resolución', 'resolucion'], ['Aplicaciones típicas', 'aplicaciones']];
  $('cmpTable').innerHTML = `<thead><tr><th></th>${EQUIPOS.map((e) => `<th><a href="visor.html?eq=${e.id}">${e.marca}<b>${e.modelo}</b></a></th>`).join('')}</tr></thead>
    <tbody>${rows.map(([l, k]) => `<tr><td>${l}</td>${EQUIPOS.map((e) => `<td>${e[k]}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
// Técnicas
$('techGrid').innerHTML = Object.entries(TIPOS).map(([k, t]) => {
  const eqs = EQUIPOS.filter((e) => e.tipo === k);
  return `<div class="tech">
    <div class="tech-k">${k}</div>
    <h4>${t.nombre}</h4>
    <p>${t.desc}</p>
    <table class="mini"><tr><td>Fuente</td><td>${t.fuente}</td></tr><tr><td>Analizador</td><td>${t.analizador}</td></tr></table>
    <div class="tech-eq">${eqs.map((e) => `<a href="visor.html?eq=${e.id}">${e.marca} ${e.modelo}${icon('arrow')}</a>`).join('')}</div>
  </div>`;
}).join('');

// Clasificación por analizador
$('claseGrid').innerHTML = Object.entries(CLASES).map(([k, c]) => {
  const eqs = EQUIPOS.filter((e) => e.clase === k);
  return `<div class="tech">
    <div class="tech-k">${k}</div>
    <h4>${c.nombre}</h4>
    <p>${c.desc}</p>
    <div class="tech-eq">${eqs.map((e) => `<a href="visor.html?eq=${e.id}">${e.marca === 'Modelo didáctico' ? '' : e.marca + ' '}${e.modelo} · ${TIPOS[e.tipo].analizador}${icon('arrow')}</a>`).join('')}</div>
  </div>`;
}).join('');
// Modos de adquisición: matriz modo × equipo y fichas
{
  const eqs = EQUIPOS;
  $('modosTable').innerHTML = `<thead><tr><th>Modo</th>${eqs.map((e) => `<th><a href="visor.html?eq=${e.id}">${e.marca === 'Modelo didáctico' ? 'Sector' : e.marca}<b>${e.modelo}</b></a></th>`).join('')}</tr></thead>
    <tbody>${MODOS.map((m) => `<tr><td><span class="m-grp">${m.grupo}</span>${m.nombre}</td>${eqs.map((e) => `<td class="chk">${m.equipos.includes(e.id) ? '<span class="dot-ok" title="Disponible"></span>' : '<span class="dot-no">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody>`;
  $('modosGrid').innerHTML = MODOS.map((m) => `<div class="tech"><div class="tech-k">${m.grupo}</div><h4>${m.nombre}</h4><p>${m.desc}</p>
    <table class="mini"><tr><td>Uso típico</td><td>${m.uso}</td></tr></table>
    <div class="tech-eq">${eqs.filter((e) => m.equipos.includes(e.id)).map((e) => `<a href="visor.html?eq=${e.id}">${e.marca === 'Modelo didáctico' ? '' : e.marca + ' '}${e.modelo}${icon('arrow')}</a>`).join('')}</div></div>`).join('');
}