// Recursos de consulta del Bruker scimaX MRMS y de la técnica FT-ICR. Enlaces localizados en búsquedas (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: 'scimaX · página del producto', url: 'https://www.bruker.com/en/products-and-solutions/mass-spectrometry/mrms/scimax.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Especificaciones oficiales: > 20 M de resolución, 600 ppb, imán de 7 T sin criógenos.' },
      { titulo: 'solariX · página del producto', url: 'https://www.bruker.com/en/products-and-solutions/mass-spectrometry/mrms/solarix.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'FT-ICR con imanes de 7; 9,4; 12 y 15 T, para comparar.' },
      { titulo: 'Lanzamiento del scimaX (ASMS 2018)', url: 'https://www.bruker.com/en/news-and-events/news/2018/bruker-introduces-scimax-mrms-for-novel-phenomics-workflow-and-further-enhances-the-tims-tofpro-for-pasef-proteomics-at-asms.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Imán Maxwell, resolución y flujo de 200 muestras al día.' },
      { titulo: 'scimaX Ion Path (folleto)', url: 'https://cdn.labwrench.com/eMan/manualNo/10496/bruker_optics_scimax_mrms_brochure.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Bruker', desc: 'Lista oficial de los componentes del trayecto de iones.' },
      { titulo: 'Bibliografía MRMS', url: 'https://www.bruker.com/en/landingpages/bdal/mrms-bibliography.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Artículos organizados por aplicación.' },
    ],
  },
  {
    grupo: 'Artículos y fundamentos',
    items: [
      { titulo: 'Marshall, Hendrickson y Jackson 1998 · FT-ICR: a primer', url: 'https://zenodo.org/record/1229283/files/article.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Mass Spectrom. Rev.', desc: 'Texto introductorio clásico sobre la física del ICR.' },
      { titulo: 'Tiquet et al. 2022 · detección 1ω/2ω en la ParaCell', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9260710/',
        tipo: 'Página', idioma: 'EN', fuente: 'Anal. Chem.', desc: 'Parámetros reales de un scimaX 2XR: transitorios, vacío, imagen MALDI.' },
      { titulo: 'Patente US9659761 · celda armonizada dinámicamente', url: 'https://patents.google.com/patent/US9659761/en',
        tipo: 'Página', idioma: 'EN', fuente: 'Google Patents', desc: 'Geometría de los segmentos de la ParaCell y sus ecuaciones.' },
      { titulo: 'Kilgour et al. 2013 · modo absorción (Autophaser)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3712280',
        tipo: 'Página', idioma: 'EN', fuente: 'Anal. Chem.', desc: 'Cómo el modo absorción duplica la resolución.' },
    ],
  },
  {
    grupo: 'Material didáctico y vídeos',
    items: [
      { titulo: 'Bruker scimaX · taking science to the max', url: 'https://www.news-medical.net/video/Brukers-scimaX-taking-science-to-the-max',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Bruker', desc: 'Presentación del equipo (≈ 5 min).' },
      { titulo: 'FT-ICR · MagLab Dictionary', url: 'https://nationalmaglab.org/about-the-maglab/around-the-lab/maglab-dictionary/fourier-transform-ion-cyclotron-resonance/',
        tipo: 'Página', idioma: 'EN', fuente: 'National MagLab', desc: 'Explicación sencilla de la técnica.' },
      { titulo: 'What’s in an oil drop? (petroleómica)', url: 'https://nationalmaglab.org/magnet-academy/read-science-stories/science-simplified/whats-in-an-oil-drop/',
        tipo: 'Página', idioma: 'EN', fuente: 'National MagLab', desc: 'Divulgación sobre el análisis del petróleo por FT-ICR.' },
      { titulo: 'Instrumentos ICR del NHMFL (hasta 21 T)', url: 'https://nationalmaglab.org/user-facilities/icr/instruments/',
        tipo: 'Página', idioma: 'EN', fuente: 'National MagLab', desc: 'Los FT-ICR de mayor campo del mundo.' },
    ],
  },
];
