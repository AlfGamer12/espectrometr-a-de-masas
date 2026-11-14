// Recorrido guiado del Bruker AVANCE NEO 400.
const SIM = ['bobina_rf'];
export const RECORRIDO = [
  {
    titulo: 'Resonancia magnética nuclear',
    texto: 'Los núcleos de ¹H se comportan como pequeños imanes. En un campo magnético intenso precesan a una frecuencia proporcional al campo: en este imán de 9,4 T, a 400 MHz. Un pulso de radiofrecuencia los saca del equilibrio y la señal que emiten al volver revela el entorno químico de cada protón.',
    modo: 'equipo', e1: 0, xray: false, foco: ['iman', 'torretas', 'soporte', 'amortiguadores', 'samplecase', 'hppr', 'consola_frente', 'consola_der'], pad: 1.1, resaltar: [],
  },
  {
    titulo: 'Un imán superconductor de 9,4 T',
    texto: 'El cilindro blanco es un criostato. Dentro, una bobina de niobio-titanio sumergida en helio líquido a 4,2 K conduce la corriente sin resistencia. El campo es vertical y la muestra entra por el bore de 54 mm que atraviesa el imán de arriba abajo.',
    modo: 'equipo', e1: 0, xray: true, foco: ['iman', 'torretas', 'soporte'], dir: [1, 0.35, 1], pad: 1.1,
    resaltar: ['bobina', 'bobina_apant'],
  },
  {
    titulo: 'Helio, nitrógeno y vacío',
    texto: 'La bobina trabaja en un depósito de helio líquido. Lo protegen una pantalla enfriada por el vapor de helio, un depósito de nitrógeno líquido a 77 K y una cámara de alto vacío que elimina la conducción y la convección. El helio se rellena a intervalos largos; el nitrógeno, más a menudo.',
    modo: 'analizador', e2: 0, xray: false, foco: ['camara_vacio', 'deposito_he'], dir: [1, 0.4, 1], pad: 1.1,
    resaltar: ['deposito_he', 'deposito_n2', 'escudo_n2', 'escudo_he'],
  },
  {
    titulo: 'Corriente persistente',
    texto: 'Una vez cargado, un interruptor superconductor cierra la bobina sobre sí misma y se desconecta la fuente: la corriente sigue circulando sin pérdidas. Una segunda bobina, con corriente opuesta, confina el campo de dispersión cerca del imán.',
    modo: 'analizador', e2: 0, xray: true, foco: ['bobina', 'bobina_apant', 'interruptor'], dir: [1, 0.35, 1], pad: 1.25,
    resaltar: ['bobina', 'bobina_apant', 'interruptor'],
  },
  {
    titulo: 'Shims, sonda y elevador',
    texto: 'Por el bore entran desde abajo el tubo de shims y la sonda, y desde arriba baja la muestra con su spinner, empujada por aire. Los shims corrigen el campo hasta una parte en mil millones dentro de la muestra; la sonda sitúa sus bobinas de radiofrecuencia en el centro magnético.',
    modo: 'analizador', e2: 0.75, xray: false, foco: ['shims', 'sonda', 'elevador', 'muestra', 'spinner'], dir: [1, 0.3, 1], pad: 1.1,
    resaltar: ['shims', 'sonda', 'elevador'],
  },
  {
    titulo: 'La muestra en el centro magnético',
    texto: 'Un tubo de 5 mm con unos 0,6 mL de disolución en un disolvente deuterado queda dentro de dos bobinas en silla de montar. Su campo de radiofrecuencia es horizontal, perpendicular a B₀. Unos condensadores sintonizan la bobina a 400 MHz y la adaptan a 50 Ω.',
    modo: 'analizador', e2: 0, xray: true, foco: ['bobina_rf', 'sintonia', 'spinner'], dir: [1, 0.3, 1], pad: 1.4,
    resaltar: ['bobina_rf', 'muestra', 'sintonia'],
  },
  {
    titulo: 'Pulso de 90° y FID',
    texto: 'Un pulso de unos 10 µs gira 90° la magnetización, que pasa al plano horizontal y precesa a 400 MHz. Al hacerlo induce en la misma bobina una señal que se amortigua en segundos: el FID (señal de inducción libre). Un pulso de 180° la invierte y no da señal.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: ['bobina_rf'],
  },
  {
    titulo: 'De la señal en el tiempo al espectro',
    texto: 'El FID es la suma de las oscilaciones de todos los protones. Su transformada de Fourier separa cada frecuencia. Promediar transitorios mejora la relación señal/ruido como √NS: con 16 transitorios, cuatro veces más que con uno.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: [], anim: 'transceptores',
  },
  {
    titulo: 'Desplazamiento químico y acoplamiento',
    texto: 'Los electrones apantallan cada núcleo de forma distinta: la posición en ppm (δ) indica el entorno químico. Los protones vecinos, a través de los enlaces, desdoblan cada señal en n + 1 líneas separadas por J. El área de cada multiplete es proporcional al número de protones.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: SIM, dir: [1, 0.3, 1], pad: 1.6, resaltar: [], anim: 'estacion',
  },
  {
    titulo: 'Preamplificador y consola',
    texto: 'Junto al imán, el HPPR/2 deja pasar los pulsos hacia la sonda y amplifica con poco ruido la señal de microvoltios. En la consola, un transceptor por canal genera la frecuencia, recibe y digitaliza; los amplificadores de RF dan la potencia de los pulsos.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['hppr', 'fuente', 'amplificadores', 'transceptores', 'bsms', 'lock', 'vtu', 'servidor'], dir: [0.55, 0.45, 1], pad: 1.1,
    resaltar: ['hppr', 'transceptores', 'amplificadores'],
  },
  {
    titulo: 'Lock y shim',
    texto: 'El canal de lock vigila sin pausa la resonancia del deuterio del disolvente, a 61,4 MHz, y corrige el campo para que no derive. La unidad BSMS suministra las corrientes de los shims y el aire del elevador.',
    modo: 'analizador', e2: 0.5, xray: false, foco: ['bsms', 'lock', 'vtu', 'transceptores'], dir: [0.45, 0.35, 1], pad: 1.4,
    resaltar: ['lock', 'bsms'],
  },
  {
    titulo: 'Automatización y seguridad',
    texto: 'El SampleCase coloca hasta 24 muestras por turno en la boca del elevador. Alrededor del imán se marca la línea de 5 G: no deben acercarse marcapasos ni herramientas de hierro. Si la bobina perdiera la superconductividad (quench), el helio se evaporaría de golpe; por eso la sala está ventilada.',
    modo: 'equipo', e1: 0.6, xray: false, foco: ['iman', 'samplecase', 'torretas', 'soporte', 'amortiguadores'], dir: [0.5, 0.4, 1], resaltar: ['samplecase', 'torretas'],
  },
];
