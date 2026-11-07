// Recursos de consulta del Bruker microflex. Enlaces localizados en búsquedas (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: 'microflex LRF · página del producto', url: 'https://www.bruker.com/en/products-and-solutions/mass-spectrometry/maldi-tof/microflex.html',
        tipo: 'Página', idioma: 'EN', fuente: 'Bruker', desc: 'Láser de N₂ a 60 Hz, turbo de 70 L/s, detectores MCP, reflector sin rejillas.' },
      { titulo: 'Folleto microflex LRF (2017)', url: 'https://www.agsanalitica.com/archivos/productos/215/1852682_microflex_LRF.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Bruker', desc: 'Resolución de 15 000, entrega por fibra óptica, AnchorChip y aplicaciones.' },
      { titulo: 'MALDI Biotyper sirius one', url: 'https://www.bruker.com/es/products-and-solutions/microbiology-and-diagnostics/microbial-identification/maldi-biotyper-sirius-one-system.html',
        tipo: 'Página', idioma: 'ES', fuente: 'Bruker', desc: 'Versión actual para microbiología: láser smartbeam y limpieza de fuente sin ventear.' },
      { titulo: 'Bruker Guide to MALDI Sample Preparation', url: 'https://massspec.chem.ucsb.edu/files/resources/bruker_sample_prep.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Bruker', desc: 'Dianas, limpieza y protocolos con HCCA, DHB, SA y HPA.' },
      { titulo: 'MALDI Biotyper · Troubleshooting & Maintenance Guide', url: 'https://data.hnt.no/eqspublic/pasientforlop/docs/doc_37541/attachments/1880263_MBT_Troubleshooting_Guide_Version_1.0_09-2020.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Bruker', desc: 'Indicadores LED, junta del puerto, limpieza de la fuente y comprobación del detector.' },
    ],
  },
  {
    grupo: 'Manuales',
    items: [
      { titulo: 'microflex User Manual v1.2 (2008)', url: 'https://cpb-us-w2.wpmucdn.com/sites.udel.edu/dist/b/702/files/2015/12/microflex-User-Manual-1-2_2008-08-29-1xim3le.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Univ. of Delaware', desc: 'Esquema del equipo, extracción retardada, vacío, indicadores, láser y detectores.' },
      { titulo: 'flexControl 3.4 User Manual', url: 'https://www.cmu.edu/chemistry/facilities/cma/instruments/manuals/flexcontrol-user-manual.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Carnegie Mellon Univ.', desc: 'Parámetros IS1, IS2, lente, PIE, supresión de matriz y calibración.' },
    ],
  },
  {
    grupo: 'Vídeos',
    items: [
      { titulo: 'MALDI Biotyper · vídeos de formación', url: 'https://www.bruker.com/en/services/training/microbiology-and-diagnostics/maldi-biotyper-training-movies.html',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Bruker', desc: 'Preparación del patrón BTS, matriz HCCA, transferencia directa y adquisición.' },
      { titulo: 'MALDI Biotyper system', url: 'https://www.news-medical.net/video/MALDI-Biotyper-system',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Bruker', desc: 'Presentación del sistema (6 min).' },
      { titulo: 'MALDI-TOF process', url: 'https://www.news-medical.net/video/MALDI-TOF-process',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Bruker', desc: 'Ionización y separación por tiempo de vuelo en dos minutos.' },
      { titulo: 'MALDI-TOF Mass Spectrometry (JoVE)', url: 'https://www.jove.com/v/5691/maldi-tof-mass-spectrometry-principle-operation-and-uses',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'JoVE', desc: 'Principio, matriz y funcionamiento (puede requerir suscripción).' },
    ],
  },
  {
    grupo: 'Guías de universidades y artículos',
    items: [
      { titulo: 'Bruker MicroFlex · laboratorio de EM', url: 'https://sites.udel.edu/mslab/instruments/bruker-maldi/',
        tipo: 'Página', idioma: 'EN', fuente: 'Univ. of Delaware', desc: 'Usos de los modos lineal y reflectrón; enlaces al manual y a los procedimientos.' },
      { titulo: 'Bruker microflex LRF · ficha del laboratorio', url: 'https://massspec.chem.wisc.edu/bruker-microflex-lrf/',
        tipo: 'Página', idioma: 'EN', fuente: 'Univ. of Wisconsin', desc: 'Guía de uso y documentos de preparación de muestras.' },
      { titulo: 'TOFSim: simulación de un TOF lineal', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11887436/',
        tipo: 'Página', idioma: 'EN', fuente: 'PMC (artículo)', desc: 'Modelo de la fuente y del vuelo con parámetros IS1, IS2, lente y PIE.' },
    ],
  },
];
