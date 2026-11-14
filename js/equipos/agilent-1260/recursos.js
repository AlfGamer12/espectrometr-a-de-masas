// Recursos de consulta del Agilent 1260 Infinity II. Enlaces comprobados en noviembre de 2026. Agilent ha sustituido la serie por la
// 1260 Infinity III: las páginas de producto actuales corresponden a los mismos módulos (G7111B, G7129A/C, G7115A) en su nueva versión.
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: '1260 Infinity II Quaternary System · manual y guía rápida', url: 'https://www.agilent.com/cs/library/usermanuals/public/G7111ASystem.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Módulos del sistema, configuración de la pila y gestión de fugas y residuos.' },
      { titulo: 'Manual del Vialsampler 1260 Infinity II (copia de UNT)', url: 'https://chemistry.unt.edu/system/files/agilent_infinity_ii_vial_sampler_manual.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent · Univ. of North Texas', desc: 'Secuencia de muestreo e inyección, compartimento de columna integrado y mantenimiento.' },
      { titulo: '1260 Infinity III LC System', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-systems/analytical-hplc-systems/1260-lc-system',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Página actual del sistema, sucesor del 1260 Infinity II, con documentos y vídeos.' },
      { titulo: 'Bomba cuaternaria 1260 (G7111B)', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-components-accessories/hplc-pumps/1260-quaternary-pump',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Especificaciones de la bomba de mezcla a baja presión.' },
      { titulo: 'Vialsampler 1260 (G7129A/C)', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-components-accessories/hplc-injectors/1260-vialsampler',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Inyector automático de 132 viales con compartimento de columna opcional.' },
      { titulo: 'Detector de diodos WR 1260 (G7115A)', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-components-accessories/hplc-detectors/1260-diode-array-detector-wr',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Detector de 190 a 950 nm con rendija programable.' },
    ],
  },
  {
    grupo: 'Vídeos',
    items: [
      { titulo: 'Instalación del termostato de muestras InfinityLab', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-components-accessories/hplc-injectors/1260-infinity-ii-multisampler/install-infinitylab-sample-thermostat-video',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Agilent', desc: 'Vídeo enlazado desde la página del Vialsampler (2 min).' },
      { titulo: 'Vídeos de LC (Agilent Community)', url: 'https://community.agilent.com/knowledge/lc-portal/m/lc-videos',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Agilent', desc: 'Mantenimiento de bombas, celdas y conexiones de las series Infinity.' },
    ],
  },
  {
    grupo: 'Fundamentos',
    items: [
      { titulo: '¿Qué es la HPLC? (Agilent)', url: 'https://www.agilent.com/en/product/liquid-chromatography/hplc-fundamentals',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Principios de la cromatografía de líquidos y preguntas frecuentes.' },
    ],
  },
];
