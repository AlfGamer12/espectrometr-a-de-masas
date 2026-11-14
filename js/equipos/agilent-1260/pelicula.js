// Guion del modo película del Agilent 1260 Infinity II (≈ 2,5 min). El texto de cada plano es a la vez subtítulo y guion de narración
// (audio opcional: audio/agilent-1260/01.mp3, 02.mp3…).
const EXT = ['bomba_carcasa', 'dad_carcasa', 'vs_carcasa', 'bandeja', 'botellas', 'residuos'];
const PILA = ['bomba_carcasa', 'dad_carcasa', 'vs_carcasa', 'bandeja', 'botellas'];

export const PELICULA = [
  {
    intro: true, tarjeta: 6, dur: 13, modo: 'equipo', e1: 0, xray: false, foco: EXT, dir: [0.55, 0.3, 1], pad: 1.05, trans: 0, orbita: -2.2, acercar: 0.06,
    texto: 'El Agilent 1260 Infinity II es un cromatógrafo de líquidos de alta eficacia. Separa los componentes de una mezcla y mide cuánto hay de cada uno.',
  },
  {
    cap: 'El sistema', titulo: 'Una pila de módulos', dur: 14, modo: 'equipo', e1: 0, foco: [...PILA, 'residuos'], dir: [0.35, 0.3, 1], pad: 1.1, orbita: 2, acercar: 0.05, resaltar: [],
    texto: 'Arriba, la bandeja con las botellas de fase móvil. Debajo, el muestreador automático con el compartimento de columna, el detector de diodos y la bomba cuaternaria.',
  },
  {
    cap: 'Bomba', titulo: 'Desgasificar, mezclar e impulsar', dur: 15, modo: 'equipo', e1: 0, xray: true, foco: ['bomba_carcasa', 'bomba_interior'], dir: [0.5, 0.35, 1], pad: 1.12,
    orbita: -3, acercar: 0.06, resaltar: ['bomba_interior'],
    texto: 'La bomba extrae el aire disuelto de los disolventes, los mezcla en la proporción programada y los impulsa a caudal constante, hasta seiscientos bares.',
  },
  {
    cap: 'Arquitectura', titulo: 'Vista explosionada', dur: 13, modo: 'equipo', e1: 1, xray: false, foco: [...PILA, 'residuos'], dir: [0.6, 0.4, 1], pad: 1.05, trans: 3, orbita: 3, resaltar: ['capilares'],
    texto: 'Separados los módulos, se ve el camino de los capilares: de la bomba a la válvula de inyección, de ahí a la columna y después a la celda del detector.',
  },
  {
    cap: 'Circuito de flujo', titulo: 'Desgasificador y válvula de gradiente', dur: 15, modo: 'analizador', e2: 0, xray: false, foco: ['deposito', 'desgasificador', 'mcgv'], dir: [0.6, 0.6, 0.8],
    pad: 1.05, trans: 3, orbita: 3, acercar: 0.06, resaltar: ['desgasificador', 'mcgv'],
    texto: 'Cada disolvente recorre un tubo de membrana dentro de una cámara en vacío, que le extrae los gases. Luego la válvula de gradiente abre cada canal durante una fracción de la carrera de aspiración.',
  },
  {
    cap: 'Bomba', titulo: 'Dos pistones en serie', dur: 17, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'grad', grad: 'g1', caudal: '1', temp: '30', col: 'c150', lambda: '254', vista: 'esp:1' },
    foco: ['cabezal', 'accionamiento', 'valvula_entrada', 'valvula_salida', 'amortiguador'], dir: [0.25, 0.55, 1], pad: 1.35, orbita: -3, acercar: 0.05, resaltar: ['valvula_entrada', 'valvula_salida'],
    texto: 'El primer pistón aspira por la válvula de entrada y empuja por la de salida. El segundo, a la mitad de velocidad, entrega el caudal mientras el primero vuelve a llenarse. Así el flujo apenas pulsa.',
  },
  {
    cap: 'Inyección', titulo: 'Válvula de seis puertos', dur: 14, modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['valvula_iny', 'dosificador', 'aguja', 'vial'], dir: [0.55, 0.5, 1], pad: 1.4,
    orbita: 3, acercar: 0.05, resaltar: ['valvula_iny'],
    texto: 'Mientras se carga la muestra, la válvula está en bypass. Al girar a mainpass, la fase móvil arrastra la muestra del bucle hacia la columna.',
  },
  {
    cap: 'Separación', titulo: 'La columna C18', dur: 16, modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['intercambiador', 'columna'], dir: [0.65, 0.55, 0.8], pad: 1.0, orbita: -2.5,
    acercar: 0.05, resaltar: ['columna'],
    texto: 'En la columna, los compuestos se reparten entre la fase móvil y la fase estacionaria. El paracetamol, el menos retenido, sale primero; el ácido salicílico, el último.',
  },
  {
    cap: 'Detección', titulo: 'Todas las longitudes de onda a la vez', dur: 16, modo: 'analizador', e2: 0, xray: false, sim: true,
    foco: ['lampara_w', 'lampara_d2', 'acromatico', 'celda', 'rendija', 'red', 'matriz'], dir: [0.75, 0.75, 0.6], pad: 1.2, orbita: 3, acercar: 0.05, resaltar: ['celda', 'red', 'matriz'],
    texto: 'La luz atraviesa la celda antes de dispersarse. Una red fija reparte el espectro sobre mil veinticuatro fotodiodos, que miden todas las longitudes de onda en cada lectura.',
  },
  {
    cap: 'Simulación', titulo: 'Gradiente y temperatura', dur: 22, modo: 'analizador', e2: 0, xray: true, sim: true, ctl: { modo: 'grad', grad: 'g1', caudal: '1', temp: '30', col: 'c150' },
    foco: ['plataformas', 'deposito', 'aguja', 'red'], dir: [0.3, 0.9, 1], pad: 1.0, resaltar: [],
    eventos: [{ t: 11, ctl: { temp: '50' } }],
    texto: 'Con un gradiente del diez al sesenta por ciento de acetonitrilo, los cuatro compuestos salen en unos diez minutos. Al subir la columna a cincuenta grados, todos se adelantan y baja la presión.',
  },
  {
    cap: 'Servicios', titulo: 'Residuos y control', dur: 12, modo: 'equipo', e1: 0, xray: false, sim: false, foco: ['pc', 'bomba_carcasa', 'vs_carcasa', 'residuos'], dir: [0.15, 0.3, 1], pad: 1.1,
    trans: 3, orbita: -2, resaltar: ['residuos', 'pc'],
    texto: 'El eluyente termina en la botella de residuos. Desde el ordenador se programa el método y se integran los picos del cromatograma.',
  },
  {
    dur: 8, modo: 'equipo', e1: 0, foco: EXT, dir: [0.55, 0.3, 1], pad: 1.05, trans: 3, orbita: -2, resaltar: [],
    texto: 'Bombear, inyectar, separar y detectar: así trabaja un cromatógrafo de líquidos.',
  },
];
