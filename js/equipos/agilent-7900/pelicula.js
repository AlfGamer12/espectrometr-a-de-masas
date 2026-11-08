// Guion del modo película del Agilent 7900 ICP-MS (≈ 3 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/agilent-7900/01.mp3, 02.mp3…).
const plasma = (on) => (app) => { if (!app.S.simOn) for (const m of app.eq.analyzer.plasma) m.material.opacity = on ? 0.82 : 0; };
const EXT = ['automuestreador', 'bomba_peristaltica', 'panel_frontal', 'chasis', 'bomba_rotatoria'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 13, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.8, 0.36, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    accion: plasma(false),
    texto: 'El Agilent 7900 es un ICP-MS, un espectrómetro de masas con plasma de argón. No mide moléculas, sino elementos: metales y trazas en agua, alimentos o suelos, desde nanogramos por litro.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'De la disolución al aerosol', dur: 14, modo: 'equipo', e1: 0, foco: ['automuestreador', 'bomba_peristaltica', 'residuos', 'puerta_muestras'],
    dir: [0.12, 0.32, 1], pad: 1.15, orbita: 1.6, acercar: 0.05, resaltar: ['automuestreador', 'bomba_peristaltica'],
    texto: 'El automuestreador lleva la sonda a cada tubo y la bomba peristáltica aspira la muestra a caudal constante. La misma bomba retira el drenaje hacia el bidón de residuos.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 14, modo: 'equipo', e1: 1, foco: ['caja_antorcha', 'camara_vacio', 'bomba_turbo', 'generador_rf', 'control_gases', 'electronica', 'chasis'],
    dir: [0.8, 0.5, 0.8], pad: 1.1, trans: 3.0, orbita: -3, resaltar: [],
    texto: 'Sin los paneles se ve la arquitectura interna: a la izquierda, la muestra y la antorcha; en el centro, la cámara de vacío; debajo, los gases, el generador de radiofrecuencia y la electrónica.',
  },
  {
    cap: 'Introducción de muestra', titulo: 'Nebulizador y cámara de Scott', dur: 15, modo: 'analizador', e2: 0.2, xray: false, foco: ['nebulizador', 'camara_nebulizacion', 'peltier'],
    dir: [-0.5, 0.42, 1], pad: 1.35, trans: 3.0, orbita: 4, acercar: 0.08, resaltar: ['nebulizador', 'camara_nebulizacion'],
    texto: 'El nebulizador MicroMist rompe la disolución con un chorro de argón. En la cámara de doble paso, a dos grados, las gotas grandes se pierden por el drenaje y solo las más finas siguen hacia la antorcha.',
  },
  {
    cap: 'Plasma', titulo: 'Antorcha, bobina y ShieldTorch', dur: 18, modo: 'analizador', e2: 0, xray: false, foco: ['antorcha', 'bobina', 'escudo_antorcha'],
    dir: [0.3, 0.32, 1], pad: 1.45, orbita: 3.5, acercar: 0.06, accion: plasma(true), resaltar: [],
    texto: 'El aerosol entra por el centro de la antorcha de cuarzo. La bobina, a veintisiete megahercios, mantiene un plasma de argón de seis a diez mil kelvin, donde la muestra se atomiza y se ioniza. Una lámina de platino, el ShieldTorch, evita descargas en la interfaz.',
  },
  {
    cap: 'Interfaz', titulo: 'Conos de muestreo y de separación', dur: 14, modo: 'analizador', e2: 0.45, xray: false, foco: ['cono_muestreo', 'interfaz', 'cono_separador'],
    dir: [-0.6, 0.3, 1], pad: 1.45, orbita: 5, accion: plasma(true), resaltar: [],
    texto: 'El cono de muestreo extrae el centro del plasma por un orificio de alrededor de un milímetro. Tras él, a unos cientos de pascales, el cono de separación toma la parte central del chorro y la deja pasar a la óptica iónica.',
  },
  {
    cap: 'Óptica iónica', titulo: 'Lente Omega fuera de eje', dur: 12, modo: 'analizador', e2: 0, xray: true, foco: ['lentes_extraccion', 'lente_omega'],
    dir: [0.35, 0.3, 1], pad: 1.6, orbita: 4, acercar: 0.06, accion: plasma(true), resaltar: ['lentes_extraccion', 'lente_omega'],
    texto: 'Las lentes de extracción aceleran los iones positivos y la lente Omega los desvía fuera del eje. Los fotones del plasma y las partículas neutras siguen en línea recta y no alcanzan el detector.',
  },
  {
    cap: 'Celda ORS⁴', titulo: 'Eliminar las interferencias', dur: 17, modo: 'analizador', e2: 0, xray: true, foco: ['celda_ors', 'lente_kd'],
    dir: [0.3, 0.42, 1], pad: 1.5, orbita: 3, acercar: 0.05, accion: plasma(true), resaltar: ['celda_ors', 'octopolo', 'lente_kd'],
    texto: 'El argón y la matriz forman iones poliatómicos con la misma masa que los analitos, como el cloruro de argón sobre el arsénico. En la celda con helio estos iones, más voluminosos, pierden más energía en los choques y una barrera de potencial los rechaza.',
  },
  {
    cap: 'Analizador', titulo: 'Cuadrupolo y detector', dur: 13, modo: 'analizador', e2: 0, xray: true, foco: ['cuadrupolo', 'detector'],
    dir: [0.45, 0.4, 1], pad: 1.3, orbita: -3, acercar: 0.05, accion: plasma(true), resaltar: ['cuadrupolo', 'detector'],
    texto: 'El cuadrupolo salta de una masa a otra en fracciones de milisegundo y deja pasar un solo isótopo cada vez. El detector cuenta cada ion con un rango dinámico de once órdenes de magnitud.',
  },
  {
    cap: 'Simulación', titulo: 'Sin gas frente a helio', dur: 22, modo: 'analizador', e2: 0, sim: true, ctl: { muestra: 'hcl', celda: 'nogas' },
    foco: ['camara_nebulizacion', 'antorcha', 'cono_muestreo', 'lente_omega', 'celda_ors', 'cuadrupolo', 'detector'], dir: [0.1, 0.32, 1], pad: 1.1, resaltar: [],
    eventos: [{ t: 11, ctl: { celda: 'he' } }],
    texto: 'En una digestión con ácido clorhídrico y sin gas en la celda, el cloro da resultados falsos: el arsénico y el vanadio salen por exceso. Con helio, las barras rojas de los poliatómicos desaparecen y la concentración medida coincide con la real.',
  },
  {
    cap: 'Servicios', titulo: 'Vacío, gases y refrigeración', dur: 14, modo: 'equipo', e1: 1, sim: false, xray: false,
    foco: ['camara_vacio', 'bomba_turbo', 'bomba_rotatoria', 'control_gases', 'enfriador'], dir: [-0.55, 0.62, -0.85], pad: 1.05, trans: 3.2, orbita: -3,
    accion: plasma(false), resaltar: ['camara_vacio', 'bomba_turbo', 'bomba_rotatoria', 'enfriador'],
    texto: 'Una turbo de flujo dividido y una bomba rotatoria mantienen tres etapas de vacío. El equipo necesita además argón, helio, agua de refrigeración para la interfaz y extracción sobre la chimenea.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [0.8, 0.36, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Del líquido al recuento de iones en apenas unos segundos: así mide un ICP-MS la composición elemental de una muestra.',
  },
];
