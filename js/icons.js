// Iconos de línea (trazo 1,5 px) compartidos por la portada y el visor. Se insertan como sprite SVG.
const P = {
  tour: '<path d="M4 5h11M4 12h16M4 19h8" /><circle cx="19" cy="5" r="1.6" /><circle cx="16" cy="19" r="1.6" />',
  sim: '<path d="M3 17c3 0 3-10 6-10s3 10 6 10 3-6 6-6" /><path d="M3 21h18" />',
  info: '<circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" />',
  sun: '<circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />',
  home: '<path d="M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5" />',
  front: '<rect x="5" y="5" width="14" height="14" rx="1" /><path d="M5 19l-2 2M19 19l2 2" opacity=".35" />',
  side: '<path d="M8 5l9 2.5v12L8 17z" /><path d="M8 5v12" />',
  top: '<path d="M12 4l8 4-8 4-8-4z" /><path d="M4 8v8l8 4 8-4V8" opacity=".35" />',
  iso: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />',
  explode: '<rect x="9" y="9" width="6" height="6" /><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3" />',
  xray: '<rect x="3.5" y="5" width="17" height="14" rx="1.5" stroke-dasharray="2.5 2" /><rect x="8" y="9" width="8" height="6" />',
  tag: '<path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8.5" cy="8.5" r="1.4" />',
  ao: '<circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" opacity=".35" />',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" />',
  search: '<circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />',
  close: '<path d="M6 6l12 12M18 6L6 18" />',
  focus: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /><circle cx="12" cy="12" r="2.5" />',
  chev: '<path d="M9 6l6 6-6 6" />',
  down: '<path d="M6 9l6 6 6-6" />',
  prev: '<path d="M15 6l-6 6 6 6" />',
  next: '<path d="M9 6l6 6-6 6" />',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" />',
  book: '<path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h9" />',
  video: '<rect x="3.5" y="6" width="12" height="12" rx="2" /><path d="M15.5 10.5l5-3v9l-5-3z" />',
  file: '<path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" />',
  page: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5" /><path d="M3.5 8.5h17M7 12h6M7 15h9" />',
  ext: '<path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" />',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
  table: '<rect x="3.5" y="5" width="17" height="14" rx="1.5" /><path d="M3.5 10h17M3.5 14.5h17M9.5 5v14" />',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="1.5" /><path d="M10 9.2v5.6l4.8-2.8z" />',
  play: '<path d="M8 5.5v13l10.5-6.5z" />',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13" />',
  skipb: '<path d="M6 6v12M18 6l-8.5 6L18 18z" />',
  skipf: '<path d="M18 6v12M6 6l8.5 6L6 18z" />',
  cc: '<rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6" />',
  voz: '<path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />',
  musica: '<path d="M9 17.5V5.5l10-2v12" /><circle cx="6.5" cy="17.5" r="2.5" /><circle cx="16.5" cy="15.5" r="2.5" />',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />',
};

export function injectIcons() {
  const s = Object.entries(P).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
  const el = document.createElement('div');
  el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  el.innerHTML = `<svg width="0" height="0" aria-hidden="true"><defs>${s}</defs></svg>`;
  document.body.prepend(el);
}
export const icon = (k, cls = '') => `<svg class="${cls}"><use href="#i-${k}" /></svg>`;
