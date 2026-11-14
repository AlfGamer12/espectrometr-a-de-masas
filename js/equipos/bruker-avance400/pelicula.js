// Guion del modo película del Bruker AVANCE NEO 400 (≈ 3 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/bruker-avance400/01.mp3, 02.mp3…).
const EXT = ['iman', 'torretas', 'soporte', 'amortiguadores', 'samplecase', 'hppr', 'consola_frente', 'consola_der'];
const SIM = ['bobina_rf'];
// la simulación ilumina las bobinas de RF; al salir de ella se apagan
const apagar = (app) => { if (!app.S.simOn) for (const m of app.eq.bobinasRF || []) m.material.emissiveIntensity = 0; };

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 16, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.42, 0.34, 1], pad: 1.1, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El AVANCE NEO 400 de Bruker es un espectrómetro de resonancia magnética nuclear. Mide cómo responden los núcleos de hidrógeno de una molécula dentro de un campo magnético de nueve coma cuatro teslas.',
  },
  {
    cap: 'Imán', titulo: 'Superconductor a 4,2 K', dur: 17, modo: 'equipo', e1: 0, xray: true, foco: ['iman', 'torretas', 'soporte'], dir: [1, 0.35, 1], pad: 1.1,
    trans: 3.0, orbita: 2.5, acercar: 0.05, resaltar: ['bobina', 'bobina_apant'],
    texto: 'El cilindro blanco es un criostato. Dentro, una bobina de niobio-titanio sumergida en helio líquido conduce la corriente sin resistencia y crea un campo vertical, estable y muy homogéneo.',
  },
  {
    cap: 'Criostato', titulo: 'Helio, nitrógeno y vacío', dur: 17, modo: 'analizador', e2: 0, xray: false, foco: ['camara_vacio', 'deposito_he'], dir: [1, 0.4, 1], pad: 1.1,
    trans: 3.0, orbita: -3, acercar: 0.06, resaltar: ['deposito_he', 'deposito_n2', 'escudo_n2', 'escudo_he'],
    texto: 'El helio líquido está rodeado por una pantalla enfriada con su propio vapor, por un depósito de nitrógeno líquido a setenta y siete kelvin y por una cámara de alto vacío. Así entra muy poco calor y el helio dura mucho.',
  },
  {
    cap: 'Imán', titulo: 'Corriente persistente', dur: 15, modo: 'analizador', e2: 0, xray: true, foco: ['bobina', 'bobina_apant', 'interruptor'], dir: [1, 0.35, 1], pad: 1.25,
    trans: 3.0, orbita: 3, acercar: 0.05, resaltar: ['bobina', 'bobina_apant', 'interruptor'],
    texto: 'Un interruptor superconductor cierra la bobina sobre sí misma y la fuente se desconecta: la corriente circula sin pérdidas. Una bobina exterior con corriente opuesta confina el campo cerca del imán.',
  },
  {
    cap: 'Bore', titulo: 'Shims, sonda y muestra', dur: 17, modo: 'analizador', e2: 0.75, xray: false, foco: ['shims', 'sonda', 'elevador', 'muestra', 'spinner'], dir: [1, 0.3, 1], pad: 1.1,
    trans: 3.0, orbita: -2.5, resaltar: ['shims', 'sonda', 'elevador'], eventos: [{ t: 11, e2: 0 }],
    texto: 'Por el bore suben desde abajo el tubo de shims y la sonda, y baja desde arriba la muestra sobre un colchón de aire. Los shims afinan el campo hasta una parte en mil millones dentro de la muestra.',
  },
  {
    cap: 'Sonda', titulo: 'Bobinas de radiofrecuencia', dur: 16, modo: 'analizador', e2: 0, xray: true, foco: ['bobina_rf', 'sintonia', 'spinner'], dir: [1, 0.3, 1], pad: 1.4,
    trans: 3.0, orbita: 3, acercar: 0.06, resaltar: ['bobina_rf', 'muestra', 'sintonia'],
    texto: 'La disolución queda dentro de dos bobinas en silla de montar que crean un campo de radiofrecuencia horizontal. Unos condensadores las sintonizan a cuatrocientos megahercios y las adaptan a cincuenta ohmios.',
  },
  {
    cap: 'Simulación', titulo: 'Pulso de 90° y FID', dur: 20, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'acetato', campo: '400', angulo: '90', ns: '1', shim: '0.3' }, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: ['bobina_rf'],
    texto: 'Un pulso de unos diez microsegundos gira la magnetización noventa grados. Al precesar en el plano horizontal induce en la bobina una señal que se apaga en segundos: el FID. Su transformada de Fourier da el espectro.',
  },
  {
    cap: 'Simulación', titulo: 'Más transitorios, menos ruido', dur: 16, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { ns: '64' }, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: [],
    texto: 'Al sumar transitorios, la señal crece con su número y el ruido solo con su raíz cuadrada. Con sesenta y cuatro, la relación señal ruido es ocho veces mayor que con uno.',
  },
  {
    cap: 'Espectro', titulo: 'δ, J e integrales', dur: 20, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'acetato', ns: '16' }, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: [],
    texto: 'En el acetato de etilo, el metilo del acetilo es un singlete a dos coma cero cinco ppm. El CH₂ unido al oxígeno, con tres vecinos, es un cuadruplete, y su metilo, con dos vecinos, un triplete. Las áreas están en proporción dos, tres, tres.',
  },
  {
    cap: 'Campo', titulo: '400 frente a 60 MHz', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true,
    ctl: { muestra: 'bromopropano', campo: '400', ns: '16' }, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: [],
    eventos: [{ t: 10, ctl: { campo: '60', ns: '1024' } }],
    texto: 'Las constantes de acoplamiento no dependen del campo, pero la separación entre señales sí. A sesenta megahercios los multipletes del bromopropano ocupan más ppm, se acercan y se deforman, y la señal es mucho más débil.',
  },
  {
    cap: 'Electrónica', titulo: 'Preamplificador y consola', dur: 17, modo: 'analizador', e2: 0.5, xray: false, sim: false, accion: apagar,
    foco: ['hppr', 'fuente', 'amplificadores', 'transceptores', 'bsms', 'lock', 'vtu', 'servidor'], dir: [0.55, 0.45, 1], pad: 1.1, trans: 3.2, orbita: -2.5,
    resaltar: ['hppr', 'transceptores', 'amplificadores', 'lock'],
    texto: 'El preamplificador, junto al imán, amplifica la señal de microvoltios. En la consola, un transceptor por canal genera la frecuencia y digitaliza la respuesta, y el lock sigue el deuterio del disolvente para que el campo no derive.',
  },
  {
    cap: 'Automatización', titulo: 'SampleCase y seguridad', dur: 15, modo: 'equipo', e1: 0.6, xray: false, accion: apagar, foco: ['iman', 'samplecase', 'torretas', 'soporte', 'amortiguadores'],
    dir: [0.5, 0.4, 1], pad: 1.05, trans: 3.0, orbita: 2.5, resaltar: ['samplecase'],
    texto: 'El cambiador SampleCase deja hasta veinticuatro muestras en la boca del imán. Alrededor del equipo se respeta la línea de cinco gauss y la sala está ventilada por si el helio se evaporara de golpe.',
  },
  {
    dur: 10, modo: 'equipo', e1: 0, xray: false, accion: apagar, foco: EXT, dir: [0.42, 0.34, 1], pad: 1.1, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'Desplazamientos químicos, acoplamientos e integrales: el espectro de RMN describe la molécula protón a protón.',
  },
];
