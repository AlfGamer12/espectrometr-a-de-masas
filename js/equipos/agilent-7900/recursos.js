// Recursos de consulta del Agilent 7900 ICP-MS. Enlaces localizados durante la investigación (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: 'Agilent 7900 ICP-MS · página del producto', url: 'https://www.agilent.com/en/product/atomic-spectroscopy/inductively-coupled-plasma-mass-spectrometry-icp-ms/icp-ms-instruments/7900-icp-ms',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Ficha oficial del equipo.' },
      { titulo: 'Folleto del 7900 ICP-MS (5991-3719ES)', url: 'https://www.agilent.com/cs/library/brochures/5991-3719ES_7900_ICP-MS_Bro.pdf',
        tipo: 'PDF', idioma: 'ES', fuente: 'Agilent', desc: 'Hardware, modos de celda y prestaciones.' },
      { titulo: 'Póster del 7900 con vista en corte', url: 'https://www.agilent.com/cs/library/posters/public/7900%20ICP-MS%20wall%20poster%20v03.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Esquema del recorrido de iones.' },
      { titulo: 'Especificaciones típicas (5991-6397EN)', url: 'https://quantum.ee/failid/Upload/pdf/5991-6397en_7900_icp-ms_typical_performance_specs.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Dimensiones, sensibilidad, óxidos y límites de detección.' },
      { titulo: 'Lista de preparación del sitio (G8400-90020)', url: 'https://www.agilent.com/cs/library/sitepreparationchecklists/G8400-90020_SitePrepChecklist7900EN.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Gases, agua, extracción y espacio necesarios.' },
      { titulo: 'Mantenimiento del ICP-MS (vídeos)', url: 'https://icp-ms.help.agilent.com/en/Maintenance/Maintenance.htm',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Agilent', desc: 'Conos, antorcha, lentes, celda ORS⁴ y bomba rotatoria.' },
    ],
  },
  {
    grupo: 'Fundamentos',
    items: [
      { titulo: 'ICP-MS e ICP-QQQ: guía de introducción (5994-4830EN)', url: 'https://gcms.cz/labrulez-bucket-strapi-h3hsga3/primer_icp_mq_icp_qqq_5994_4830en_agilent_35e0426d71/primer-icp-mq-icp-qqq-5994-4830en-agilent.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Principios del plasma, la interfaz, la celda y el cuadrupolo.' },
      { titulo: 'Modo helio en ICP-MS (5994-1171EN)', url: 'https://www.agilent.com/cs/library/flyers/public/flyer_HE_He_mode_icp-ms-5994-1171en_us_agilent.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Discriminación por energía cinética.' },
      { titulo: 'Guía de cuidado de los conos (5994-0860EN)', url: 'https://www.agilent.com/cs/library/troubleshootingguide/public/technicaloverview-ICP-MS-guide-5994-0860EN-agilent.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Materiales, limpieza y sustitución.' },
      { titulo: 'Seminario web de ICP-MS (español)', url: 'https://www.agilent.com/cs/library/slidepresentation/Public/webinar_13march_ICPMS.pdf',
        tipo: 'PDF', idioma: 'ES', fuente: 'Agilent', desc: 'Diapositivas introductorias.' },
    ],
  },
  {
    grupo: 'Aplicaciones y uso real',
    items: [
      { titulo: 'Nanopartículas individuales con el 7900 (5991-4401EN)', url: 'https://icp-ms.help.agilent.com/ja/Learning/AppNotes/7900/5991-4401EN_AppNote_ICP-MS7900_nanoparticles.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Adquisición rápida de 0,1 ms.' },
      { titulo: 'Agua de mar sin diluir con UHMI', url: 'https://www.spectroscopyonline.com/view/icp-ms-configuration-and-optimization-for-successful-routine-analysis-of-undiluted-seawater',
        tipo: 'Página', idioma: 'EN', fuente: 'Spectroscopy', desc: 'Dilución en aerosol para matrices salinas.' },
      { titulo: 'Agilent 7900 en un servicio universitario (WWU)', url: 'https://amsec.wwu.edu/agilent-7900-icpms',
        tipo: 'Página', idioma: 'EN', fuente: 'Western Washington Univ.', desc: 'Equipo real con SPS 4.' },
    ],
  },
];
