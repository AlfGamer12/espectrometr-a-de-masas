// Esquemas de línea del trayecto de iones de cada técnica (SVG generado), para la portada.
// Estilo de plano técnico: trazos finos, eje iónico discontinuo, rótulos en versalitas.

const W = 360, H = 120, AXY = 58;

const GLYPH = {
  GC: (x, w) => `<circle cx="${x + w / 2}" cy="${AXY}" r="13" /><circle cx="${x + w / 2}" cy="${AXY}" r="9" /><circle cx="${x + w / 2}" cy="${AXY}" r="5" />`,
  LC: (x, w) => `<rect x="${x + w / 2 - 5}" y="${AXY - 18}" width="10" height="36" rx="2" /><path d="M${x + w / 2 - 5} ${AXY - 8}h10M${x + w / 2 - 5} ${AXY + 8}h10" />`,
  'Láser': (x, w) => `<path d="M${x + 6} ${AXY - 20}l${w - 14} 18" class="beam" /><rect x="${x + 2}" y="${AXY - 27}" width="12" height="10" rx="1.5" />`,
  EI: (x, w) => `<rect x="${x + 6}" y="${AXY - 16}" width="${w - 12}" height="32" rx="3" /><path d="M${x + w / 2 - 6} ${AXY - 24}c2-4 4 4 6 0s4 4 6 0" />`,
  ESI: (x, w) => `<path d="M${x + 4} ${AXY - 3}h12l6 3-6 3h-12z" /><path d="M${x + 24} ${AXY}l${w - 30} -10M${x + 24} ${AXY}l${w - 30} 10M${x + 24} ${AXY}h${w - 30}" class="thin" />`,
  MALDI: (x, w) => `<rect x="${x + 6}" y="${AXY - 20}" width="5" height="40" /><circle cx="${x + 14}" cy="${AXY}" r="2.5" class="fill" /><path d="M${x + 18} ${AXY - 14}v28M${x + 26} ${AXY - 14}v28" />`,
  Q: (x, w) => rods(x, w),
  Q1: (x, w) => rods(x, w),
  Q3: (x, w) => rods(x, w),
  q2: (x, w) => `<rect x="${x + 3}" y="${AXY - 13}" width="${w - 6}" height="26" rx="6" />${[0, 1, 2].map((i) => `<circle cx="${x + 10 + i * (w - 20) / 2}" cy="${AXY + (i % 2 ? 6 : -6)}" r="1.6" class="fill" />`).join('')}`,
  TOF: (x, w) => `<rect x="${x + 2}" y="${AXY - 12}" width="${w - 4}" height="24" rx="2" /><path d="M${x + w - 2} ${AXY - 18}v36" />`,
  'Imán': (x, w) => `<path d="M${x + 2} ${AXY + 14}A${w - 4} ${w - 4} 0 0 1 ${x + w - 2} ${AXY - 18}L${x + w - 2} ${AXY - 4}A${w - 18} ${w - 18} 0 0 0 ${x + 16} ${AXY + 14}z" /><path d="M${x + 9} ${AXY + 14}A${w - 11} ${w - 11} 0 0 1 ${x + w - 2} ${AXY - 11}" class="thin" />`,
  ESA: (x, w) => `<path d="M${x + 3} ${AXY - 14}A${w} ${w} 0 0 1 ${x + w - 3} ${AXY + 6}" /><path d="M${x + 3} ${AXY - 4}A${w - 10} ${w - 10} 0 0 1 ${x + w - 13} ${AXY + 6}" />`,
  TIMS: (x, w) => `<rect x="${x + 2}" y="${AXY - 11}" width="${w - 4}" height="22" rx="3" />${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${x + 7 + i * (w - 14) / 6} ${AXY - 11}v22" class="thin" />`).join('')}`,
  oTOF: (x, w) => `<rect x="${x + 2}" y="${AXY - 6}" width="12" height="12" rx="1.5" /><rect x="${x + 18}" y="${AXY - 30}" width="${w - 22}" height="18" rx="2" /><path d="M${x + 8} ${AXY - 6}V${AXY - 21}H${x + w - 6}" class="thin" />`,
  ICR: (x, w) => `<rect x="${x + 2}" y="${AXY - 22}" width="${w - 4}" height="44" rx="10" /><rect x="${x + 14}" y="${AXY - 7}" width="${w - 28}" height="14" rx="2" />`,
  Neb: (x, w) => `<path d="M${x + 2} ${AXY + 6}h8" /><rect x="${x + 10}" y="${AXY - 8}" width="${w - 12}" height="16" rx="8" /><path d="M${x + 14} ${AXY}h${w - 20}" class="thin" />`,
  ICP: (x, w) => `<path d="M${x + 2} ${AXY - 7}h${w - 16}M${x + 2} ${AXY + 7}h${w - 16}" />${[0, 1, 2].map((i) => `<ellipse cx="${x + w - 26 + i * 5}" cy="${AXY}" rx="2" ry="11" class="thin" />`).join('')}<path d="M${x + w - 22} ${AXY}c4-9 14-7 20 0c-6 7-16 9-20 0z" class="fill" />`,
  Conos: (x, w) => `<path d="M${x + 4} ${AXY - 18}L${x + 15} ${AXY - 2}M${x + 4} ${AXY + 18}L${x + 15} ${AXY + 2}" /><path d="M${x + 16} ${AXY - 13}L${x + 26} ${AXY - 1.5}M${x + 16} ${AXY + 13}L${x + 26} ${AXY + 1.5}" />`,
  ORS: (x, w) => `<rect x="${x + 3}" y="${AXY - 13}" width="${w - 6}" height="26" rx="6" />${[0, 1, 2, 3].map((i) => `<path d="M${x + 9} ${AXY - 7 + i * 4.7}h${w - 18}" class="thin" />`).join('')}`,
  Det: (x, w) =>`<path d="M${x + 4} ${AXY - 14}l${w - 10} 6v16l-${w - 10} 6z" />`,
};
function rods(x, w) {
  return `<rect x="${x + 2}" y="${AXY - 14}" width="${w - 4}" height="6" rx="3" /><rect x="${x + 2}" y="${AXY + 8}" width="${w - 4}" height="6" rx="3" />` +
    `<rect x="${x + 2}" y="${AXY - 4}" width="${w - 4}" height="3" rx="1.5" opacity=".5" /><rect x="${x + 2}" y="${AXY + 2}" width="${w - 4}" height="3" rx="1.5" opacity=".5" />`;
}
const WIDTH = { 'Imán': 56, ESA: 44, TIMS: 54, oTOF: 66, ICR: 74, GC: 40, LC: 34, 'Láser': 36, EI: 36, ESI: 46, MALDI: 34, Q: 70, Q1: 46, q2: 40, Q3: 46, TOF: 120, Det: 26, Neb: 48, ICP: 52, Conos: 30, ORS: 46 };
const LABEL = { 'Imán': 'Imán (B)', ESA: 'ESA (E)', TIMS: 'TIMS', oTOF: 'oa-TOF', ICR: 'Celda ICR', GC: 'GC', LC: 'LC', 'Láser': 'Láser', EI: 'Fuente EI', ESI: 'ESI', MALDI: 'MALDI', Q: 'Cuadrupolo', Q1: 'Q1', q2: 'q2 (CID)', Q3: 'Q3', TOF: 'Tubo de vuelo', Det: 'Detector', Neb: 'Nebulizador', ICP: 'Plasma', Conos: 'Conos', ORS: 'ORS⁴' };

export function esquema(etapas) {
  const total = etapas.reduce((s, k) => s + WIDTH[k], 0);
  const gap = Math.max(8, (W - 20 - total) / (etapas.length - 1));
  let x = 10;
  const parts = [];
  for (const k of etapas) {
    const w = WIDTH[k];
    parts.push(`<g class="blk">${GLYPH[k](x, w)}</g><text x="${x + w / 2}" y="${H - 14}">${LABEL[k]}</text>`);
    x += w + gap;
  }
  return `<svg class="esq" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <path d="M10 ${AXY}H${W - 10}" class="axis" />${parts.join('')}</svg>`;
}
