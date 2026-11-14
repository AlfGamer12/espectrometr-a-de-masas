// Guion del modo película del Shimadzu IRSpirit con QATR-S (≈ 3 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/shimadzu-irspirit/01.mp3, 02.mp3…).
const EXT = ['carcasa_izq', 'panel_compartimento', 'bloque_derecho', 'cubierta_superior', 'chasis', 'abrazadera'];
const OPT = ['fuente_ir', 'divisor_haz', 'espejo_movil', 'qatr_cuerpo', 'detector', 'espejo_elipsoidal'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 13, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.6, 0.45, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El IRSpirit de Shimadzu es un espectrofotómetro infrarrojo por transformada de Fourier más pequeño que una hoja A3. Mide qué frecuencias infrarrojas absorben los enlaces de una muestra: una huella de sus grupos funcionales.',
  },
  {
    cap: 'Muestreo', titulo: 'El accesorio QATR-S', dur: 14, modo: 'equipo', e1: 0, foco: ['qatr_placa', 'abrazadera', 'cubierta_superior'], dir: [0.3, 0.95, 1], pad: 1.3,
    orbita: 2, acercar: 0.06, resaltar: ['qatr_placa', 'abrazadera', 'prisma_diamante'],
    texto: 'Aquí lleva montado el QATR-S, un accesorio de reflexión total atenuada con prisma de diamante. Su placa queda a ras de la cubierta: un líquido se mide con una gota y un sólido se aprieta contra el diamante con la abrazadera.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 14, modo: 'equipo', e1: 1, xray: false, foco: ['cubierta_superior', 'bloque_derecho', 'carcasa_izq', 'panel_compartimento', 'chasis'],
    dir: [0.7, 0.6, 1], pad: 0.95, trans: 3.0, orbita: -3, resaltar: [], eventos: [{ t: 5, xray: true }],
    texto: 'Sin la carcasa aparecen el compartimento de muestras en el centro, el interferómetro sellado a la derecha, el detector a la izquierda y, debajo, la electrónica.',
  },
  {
    cap: 'Fuente', titulo: 'Fuente y colimador', dur: 12, modo: 'analizador', e2: 0, xray: true, foco: ['fuente_ir', 'colimador', 'divisor_haz'], dir: [0.1, 1.1, -1], pad: 1.5,
    trans: 3.0, orbita: 3, acercar: 0.05, resaltar: ['fuente_ir', 'colimador'],
    texto: 'Una fuente cerámica caliente emite infrarrojo de espectro continuo. Un espejo curvo, con la fuente en su foco, lo convierte en un haz paralelo que entra en el interferómetro.',
  },
  {
    cap: 'Interferómetro', titulo: 'Michelson con incidencia de 30°', dur: 16, modo: 'analizador', e2: 0, xray: true, foco: ['divisor_haz', 'espejo_fijo', 'espejo_movil', 'colimador'],
    dir: [0.2, 1.3, 0.9], pad: 1.5, orbita: -3, acercar: 0.05, resaltar: ['divisor_haz', 'espejo_fijo', 'espejo_movil'],
    texto: 'El divisor de bromuro de potasio con germanio reparte el haz entre un espejo fijo y uno móvil. Al recombinarse, cada número de onda interfiere según la diferencia de camino. En el IRSpirit el haz incide a treinta grados sobre el divisor.',
  },
  {
    cap: 'Interferómetro', titulo: 'Láser y alineación dinámica', dur: 15, modo: 'analizador', e2: 0.3, xray: true, foco: ['laser_ref', 'detector_laser', 'espejo_fijo', 'divisor_haz'],
    dir: [0.35, 1.0, 1], pad: 1.4, orbita: 3, resaltar: ['laser_ref', 'detector_laser', 'espejo_fijo'],
    texto: 'Un láser de semiconductor recorre el mismo camino. Sus franjas marcan dónde se toma cada punto del interferograma y sirven para reorientar el espejo fijo cinco mil veces por segundo.',
  },
  {
    cap: 'Humedad', titulo: 'Interior seco', dur: 13, modo: 'analizador', e2: 0.6, xray: false, foco: ['desecante', 'interf_trasera', 'interf_tapa', 'espejo_fijo'],
    dir: [0.7, 0.6, -1], pad: 1.4, orbita: -3, resaltar: ['desecante'],
    texto: 'El bromuro de potasio absorbe la humedad. El interferómetro va sellado y un cartucho de gel de sílice, que se cambia por la ventana trasera, mantiene seco su interior.',
  },
  {
    cap: 'Muestra', titulo: 'Reflexión total atenuada', dur: 15, modo: 'analizador', e2: 0, xray: true, foco: ['optica_atr', 'prisma_diamante'], dir: [0.15, 0.45, 1], pad: 1.5,
    orbita: 2.5, acercar: 0.05, resaltar: ['optica_atr', 'prisma_diamante'],
    texto: 'En el accesorio, cuatro espejos llevan el haz hasta el diamante. Allí se refleja por completo, pero una onda evanescente penetra unas micras en la muestra, que absorbe en sus frecuencias propias.',
  },
  {
    cap: 'Detección', titulo: 'Detector DLATGS', dur: 13, modo: 'analizador', e2: 0, xray: true, foco: ['espejo_elipsoidal', 'detector', 'preamplificador'], dir: [-0.6, 0.7, 1], pad: 1.6,
    orbita: -2.5, acercar: 0.05, resaltar: ['espejo_elipsoidal', 'detector'],
    texto: 'Un espejo curvo concentra el haz en el detector piroeléctrico DLATGS. El infrarrojo modulado lo calienta unas milésimas de grado; su polarización cambia y aparece una corriente.',
  },
  {
    cap: 'Simulación', titulo: 'Del interferograma al espectro', dur: 15, modo: 'analizador', e2: 0, sim: true, ctl: { muestra: 'acetona', tecnica: 'atr', res: '4', scans: '4', vista: 'abs' },
    foco: OPT, dir: [0.15, 1.05, 1], pad: 1.05, resaltar: [],
    texto: 'El espejo móvil barre el retardo y el interferograma crece en torno a su pico central. La transformada de Fourier da el espectro y, dividido por el fondo, la absorbancia de la acetona, con el carbonilo a 1715 centímetros a la menos uno.',
  },
  {
    cap: 'Simulación', titulo: 'ATR frente a transmisión', dur: 15, modo: 'analizador', e2: 0, sim: true, ctl: { tecnica: 'trans' },
    foco: OPT, dir: [0.15, 1.05, 1], pad: 1.05, trans: 0.8, resaltar: [],
    texto: 'En transmisión la luz atraviesa toda la muestra. En ATR solo penetra unas micras, más cuanto mayor es la longitud de onda: por eso, en el espectro ATR, las bandas de número de onda bajo salen relativamente más intensas.',
  },
  {
    cap: 'Servicios', titulo: 'Electrónica', dur: 12, modo: 'equipo', e1: 1, sim: false, xray: true, foco: ['electronica', 'fuente_alimentacion', 'compartimento', 'cableado'],
    dir: [0.45, 0.9, 1], pad: 1.2, trans: 3.0, orbita: -3, resaltar: ['electronica', 'fuente_alimentacion', 'cableado'],
    texto: 'Bajo el compartimento, la placa de control gobierna el espejo y digitaliza el interferograma. El ordenador calcula la transformada de Fourier y presenta el espectro.',
  },
  {
    dur: 9, modo: 'equipo', e1: 0, foco: EXT, dir: [0.6, 0.45, 1], pad: 1.05, trans: 3.0, orbita: -2, resaltar: [],
    texto: 'De una gota sobre el diamante a un espectro de grupos funcionales: así trabaja un FTIR con ATR.',
  },
];
