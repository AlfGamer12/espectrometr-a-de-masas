// Recorrido guiado del Shimadzu IRSpirit con QATR-S.
export const RECORRIDO = [
  {
    titulo: 'Espectroscopía infrarroja por transformada de Fourier',
    texto: 'Los enlaces de una molécula vibran a frecuencias propias y absorben la radiación infrarroja de esas mismas frecuencias. El IRSpirit mide qué números de onda absorbe la muestra entre 7800 y 350 cm⁻¹: el espectro es una huella de sus grupos funcionales.',
    modo: 'equipo', e1: 0, xray: false, foco: ['carcasa_izq', 'panel_compartimento', 'bloque_derecho', 'cubierta_superior', 'chasis'], resaltar: [],
  },
  {
    titulo: 'Un FTIR más pequeño que una hoja A3',
    texto: 'El cuerpo mide 390 × 250 × 210 mm y pesa 8,5 kg, pero el compartimento de muestras tiene la anchura de los modelos grandes. Aquí lleva montado el QATR-S: su placa queda a ras de la cubierta y la muestra se coloca directamente sobre el prisma de diamante.',
    modo: 'equipo', e1: 0, xray: false, foco: ['abrazadera', 'qatr_placa', 'panel_compartimento'], dir: [0.3, 0.8, 1], pad: 1.1,
    resaltar: ['qatr_placa', 'abrazadera', 'prisma_diamante'],
  },
  {
    titulo: 'Fuente y colimador',
    texto: 'Una fuente cerámica caliente emite infrarrojo de espectro continuo. Un espejo curvo fuera de eje, con la fuente en su foco, lo convierte en un haz paralelo que entra en el interferómetro.',
    modo: 'analizador', e2: 0, xray: true, foco: ['fuente_ir', 'colimador', 'divisor_haz'], dir: [0.1, 1.1, -1], pad: 1.5, resaltar: ['fuente_ir', 'colimador'],
  },
  {
    titulo: 'El interferómetro de Michelson',
    texto: 'El divisor de KBr con germanio envía la mitad del haz al espejo fijo y la otra mitad al espejo móvil. Al recombinarse, cada número de onda interfiere de forma constructiva o destructiva según el retardo δ. En el IRSpirit el haz incide a 30° y los brazos forman 120°.',
    modo: 'analizador', e2: 0, xray: true, foco: ['divisor_haz', 'espejo_fijo', 'espejo_movil', 'colimador'], dir: [0.2, 1.3, 0.9], pad: 1.5,
    resaltar: ['divisor_haz', 'espejo_fijo', 'espejo_movil'],
  },
  {
    titulo: 'Láser de referencia y alineación dinámica',
    texto: 'Un láser de semiconductor recorre el interferómetro junto al infrarrojo. Cada paso por cero de sus franjas, cada λ/2 de retardo, dispara la toma de un punto del interferograma. Su señal también sirve para reorientar el espejo fijo con piezoeléctricos 5000 veces por segundo.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['laser_ref', 'detector_laser', 'espejo_fijo', 'divisor_haz'], dir: [0.35, 1.0, 1], pad: 1.4,
    resaltar: ['laser_ref', 'detector_laser', 'espejo_fijo'],
  },
  {
    titulo: 'Interior seco',
    texto: 'El KBr es higroscópico, así que el interferómetro va sellado y un cartucho de gel de sílice mantiene seco su interior. Se cambia por la ventana de mantenimiento trasera. El indicador naranja HUMIDITY se enciende mientras el interior está seco.',
    modo: 'analizador', e2: 0.6, xray: false, foco: ['desecante', 'interf_trasera', 'interf_tapa', 'espejo_fijo'], dir: [0.7, 0.6, -1], pad: 1.4,
    resaltar: ['desecante', 'interf_trasera', 'interf_frontal', 'interf_izq', 'interf_der', 'interf_tapa'],
  },
  {
    titulo: 'QATR-S: reflexión total atenuada',
    texto: 'Dentro del accesorio, cuatro espejos llevan el haz hasta el prisma de diamante. Su cara superior lo refleja totalmente, pero una onda evanescente penetra unas micras en la muestra: donde esta absorbe, el haz reflejado se debilita. La abrazadera asegura el contacto con los sólidos.',
    modo: 'analizador', e2: 0, xray: true, foco: ['optica_atr', 'prisma_diamante'], dir: [0.15, 0.45, 1], pad: 1.5,
    resaltar: ['optica_atr', 'prisma_diamante', 'abrazadera'],
  },
  {
    titulo: 'Detector DLATGS',
    texto: 'Un espejo curvo concentra el haz sobre el detector piroeléctrico DLATGS. El infrarrojo modulado calienta el cristal unas milésimas de grado y su polarización cambia: aparece una corriente proporcional a la variación de la radiación. Va termostatizado y no necesita nitrógeno líquido.',
    modo: 'analizador', e2: 0, xray: true, foco: ['espejo_elipsoidal', 'detector', 'preamplificador'], dir: [-0.6, 0.7, 1], pad: 1.6,
    resaltar: ['espejo_elipsoidal', 'detector', 'preamplificador'],
  },
  {
    titulo: 'Simulación: del interferograma al espectro',
    texto: 'El espejo móvil barre el retardo y el interferograma crece con su pico central en δ = 0. La transformada de Fourier da el espectro de haz simple; dividido por el fondo, la transmitancia y la absorbancia. Prueba a cambiar la resolución, el número de barridos y ATR frente a transmisión.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['fuente_ir', 'divisor_haz', 'espejo_movil', 'qatr_cuerpo', 'detector', 'espejo_elipsoidal'], dir: [0.15, 1.05, 1], resaltar: [],
  },
  {
    titulo: 'Electrónica y servicios',
    texto: 'Bajo el compartimento está la placa de control, que digitaliza el interferograma y gobierna el espejo móvil; detrás, la fuente de alimentación y la toma de red. El equipo se comunica con el ordenador, donde LabSolutions IR procesa los espectros.',
    modo: 'equipo', e1: 1, xray: true, sim: false, foco: ['electronica', 'fuente_alimentacion', 'compartimento', 'cableado'], dir: [0.45, 0.9, 1], pad: 1.2,
    resaltar: ['electronica', 'fuente_alimentacion', 'cableado'],
  },
];
