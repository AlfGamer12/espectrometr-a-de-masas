// Recursos de consulta del Bruker AVANCE NEO 400 y de la RMN. Enlaces abiertos y comprobados (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: 'Imanes Ascend · página de producto', url: 'https://www.bruker.com/en/products-and-solutions/mr/nmr/ascend-nmr-magnets.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Bore estándar de 54 mm, apantallamiento activo, baño de helio a 4,2 K y estabilidad del campo.' },
      { titulo: 'Consolas AVANCE NEO', url: 'https://www.bruker.com/neo',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Arquitectura de transceptores por canal, lock digital, sintonía automática y servidor de adquisición.' },
      { titulo: 'SampleCase · cambiador de muestras', url: 'https://www.bruker.com/en/products-and-solutions/mr/nmr/nmr-automation/SampleCase.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: '24 o 60 posiciones, versiones calefactada y refrigerada, tubos de 1 a 10 mm.' },
      { titulo: 'TopSpin · software de RMN', url: 'https://www.bruker.com/en/products-and-solutions/mr/nmr-software/topspin.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Programa de adquisición y procesado de los espectrómetros AVANCE.' },
      { titulo: 'Lanzamiento de la AVANCE NEO (2017)', url: 'https://www.selectscience.net/article/next-generation-nmr-platform-and-console-takes-magnetic-resonance-research-to-a-new-level',
        tipo: 'Página', idioma: 'EN', fuente: 'SelectScience', desc: 'Transceptor por canal, recepción múltiple y servidor de adquisición integrado.' },
    ],
  },
  {
    grupo: 'Laboratorios universitarios con un AVANCE NEO 400',
    items: [
      { titulo: 'Avance NEO 400 · Iowa State University', url: 'https://www.cif.iastate.edu/nmr/neo400',
        tipo: 'Página', idioma: 'EN', fuente: 'Iowa State', desc: 'Imán UltraShield de 9,4 T, sonda Prodigy, SampleCase de 24 posiciones y control de temperatura.' },
      { titulo: 'O400 · University of Toronto', url: 'https://csicomp.chem.utoronto.ca/instrumentation/o400',
        tipo: 'Página', idioma: 'EN', fuente: 'U. Toronto', desc: 'Tres canales, sonda iProbe HFX y SampleCase de 24 posiciones.' },
      { titulo: 'AV NEO 400 · Universidad de Oslo', url: 'https://mn.uio.no/kjemi/english/research/infrastructure/nmr/instruments/AV%20NEO%20400',
        tipo: 'Página', idioma: 'EN', fuente: 'U. Oslo', desc: 'Equipo instalado en 2021 con cambiador de 24 posiciones.' },
    ],
  },
  {
    grupo: 'Fundamentos y material didáctico',
    items: [
      { titulo: 'The Basics of NMR (J. P. Hornak)', url: 'https://www.cis.rit.edu/htbooks/nmr/',
        tipo: 'Página', idioma: 'EN', fuente: 'RIT', desc: 'Texto introductorio clásico: espín, pulsos, FID, transformada de Fourier e instrumentación.' },
      { titulo: 'NMR Info/Data (colección de H. Reich)', url: 'https://organicchemistrydata.org/hansreich/resources/nmr/',
        tipo: 'Página', idioma: 'EN', fuente: 'ACS Div. Org. Chem.', desc: 'Desplazamientos químicos, acoplamientos, efectos de segundo orden y espectros comentados.' },
      { titulo: 'Quench · MagLab Dictionary', url: 'https://nationalmaglab.org/about-the-maglab/around-the-lab/maglab-dictionary/quench/',
        tipo: 'Página', idioma: 'EN', fuente: 'National MagLab', desc: 'Qué ocurre cuando un imán superconductor pierde la superconductividad.' },
    ],
  },
];
