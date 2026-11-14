// Recursos de consulta: documentación oficial, vídeos y guías. Enlaces comprobados en búsquedas y lecturas (nov. 2026).
export const RECURSOS = [
  {
    grupo: 'Documentación oficial del fabricante',
    items: [
      { titulo: '7890B GC · Advanced Operation (manual de operación avanzada)', url: 'https://www.agilent.com/cs/library/usermanuals/public/7890B_AdvOperationGuide.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Métodos, modos de control de caudal y presión, inyectores, detectores y configuración del FID.' },
      { titulo: '7890B GC · Troubleshooting', url: 'https://www.agilent.com/cs/library/usermanuals/public/7890B_Troubleshooting.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Diagnóstico de fugas, problemas de encendido del FID, ruido y deriva de la línea de base.' },
      { titulo: '7890B GC · Getting Started', url: 'https://www.agilent.com/cs/library/usermanuals/public/7890B_GettingStarted.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Descripción del equipo, teclado y pantalla, encendido y primer análisis.' },
      { titulo: 'Mantenimiento del GC 7890B (en español)', url: 'https://www.agilent.com/cs/library/usermanuals/public/ES_7890B_Maintaining.pdf',
        tipo: 'Manual', idioma: 'ES', fuente: 'Agilent', desc: 'Cambio de septum, liner, junta tórica y sello de oro; mantenimiento del FID y de la columna.' },
      { titulo: 'Hoja de especificaciones del 7890B', url: 'https://www.agilent.com/cs/library/datasheets/public/5991-1436EN.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Horno, control electrónico de la neumática, inyectores y detectores (FID: límite de detección, rango lineal, velocidad de datos).' },
      { titulo: 'Guía de preparación del laboratorio (GC, GC/MS y ALS)', url: 'https://agilent.com/cs/library/usermanuals/public/7890B_SitePrepGuide.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Dimensiones, alimentación eléctrica, gases, purezas, filtros y líneas de suministro.' },
      { titulo: '7693A Automatic Liquid Sampler · Instalación, operación y mantenimiento', url: 'https://www.agilent.com/cs/library/usermanuals/public/G4513-90010.pdf',
        tipo: 'Manual', idioma: 'EN', fuente: 'Agilent', desc: 'Torre de inyección, torreta, jeringas, lavados y bandeja de muestras.' },
    ],
  },
  {
    grupo: 'Artículos técnicos y vídeos',
    items: [
      { titulo: 'Cambio de liner, septum y junta tórica (serie de vídeos de diagnóstico)', url: 'https://community.agilent.com/technical/gc/m/videos/553',
        tipo: 'Vídeo', idioma: 'EN', fuente: 'Agilent', desc: 'Un ingeniero de servicio cambia el liner, el septum y la junta tórica en un 7890.' },
      { titulo: 'Cambio del septum en inyectores split/splitless y multimodo', url: 'https://community.agilent.com/knowledge/gc-portal/w/gc-knowledgebase/10464/replacing-the-inlet-septum-for-split-spitless-and-multimode-inlets',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Intervalo de cambio, apriete de la tuerca y purga antes de calentar.' },
      { titulo: 'Diagnóstico de un FID que no enciende', url: 'https://community.agilent.com/knowledge/gc-portal/kmp/gc-articles/kp103.troubleshooting-an-fid-not-igniting',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Caudales por defecto (H₂ 30, aire 400, auxiliar 25 mL/min), umbral de llama, encendedor, chorro y colector.' },
      { titulo: 'Configuración del gas auxiliar del FID en el 7890', url: 'https://community.agilent.com/knowledge/gc-portal/kmp/gc-articles/kp487.configuring-the-flame-ionization-detector-makeup-gas-for-agilent-7890-gc-systems',
        tipo: 'Página', idioma: 'EN', fuente: 'Agilent', desc: 'Recorrido del gas auxiliar y del hidrógeno hasta el chorro y elección de N₂ o He.' },
      { titulo: 'Detectores de GC: diseño y diagnóstico del FID (seminario)', url: 'https://agilent.com/cs/library/eseminars/public/gc-detector-design-troubleshooting-flame-ionization-fid-theory-basics-gas-flows-july212020.pdf',
        tipo: 'PDF', idioma: 'EN', fuente: 'Agilent', desc: 'Fundamentos del FID, caudales de gases y problemas habituales.' },
    ],
  },
  {
    grupo: 'Guías de universidades',
    items: [
      { titulo: 'Manual de usuario del CG serie 7890B (Univ. Nacional del Sur)', url: 'https://www.quimica.uns.edu.ar/images/stories/descargas/Manuales%20LIUC/CG-EM/CG-EM%20-%20Manual%20Usuario%20CG%20-%207890B%20series.pdf',
        tipo: 'Manual', idioma: 'ES', fuente: 'UNS (Argentina)', desc: 'Manual de usuario en español del cromatógrafo 7890B.' },
    ],
  },
];
