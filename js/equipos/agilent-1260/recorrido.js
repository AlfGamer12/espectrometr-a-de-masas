// Recorrido guiado del Agilent 1260 Infinity II.
const PILA = ['bomba_carcasa', 'dad_carcasa', 'vs_carcasa', 'bandeja', 'botellas'];

export const RECORRIDO = [
  {
    titulo: 'Un HPLC modular',
    texto: 'El 1260 Infinity II se monta apilando módulos del mismo ancho. De arriba abajo: la bandeja de disolventes, el muestreador automático con el compartimento de columna, el detector de diodos y la bomba cuaternaria. A la derecha baja la línea de residuos.',
    modo: 'equipo', e1: 0, xray: false, foco: [...PILA, 'residuos'], resaltar: [],
  },
  {
    titulo: 'Fase móvil',
    texto: 'Las botellas de la bandeja contienen la fase móvil. De cada tapón sale una línea con un filtro sumergido que baja hasta la bomba. En el laboratorio, una botella lleva acetonitrilo y agua premezclados al 70:30.',
    modo: 'equipo', e1: 0, xray: false, foco: ['bandeja', 'botellas'], dir: [0.4, 0.45, 1], pad: 1.3, resaltar: ['botellas'],
  },
  {
    titulo: 'Bomba cuaternaria',
    texto: 'La bomba desgasifica los disolventes, los mezcla en el lado de baja presión con la válvula de gradiente y los impulsa con dos pistones en serie. Alcanza 600 bar hasta 5 mL/min con un caudal casi sin pulsaciones.',
    modo: 'equipo', e1: 0, xray: true, foco: ['bomba_carcasa', 'bomba_interior'], dir: [0.5, 0.35, 1], pad: 1.12, resaltar: ['bomba_interior'],
  },
  {
    titulo: 'Muestreador automático',
    texto: 'Una pinza lleva cada vial bajo la aguja; el dosificador aspira la muestra hacia el bucle y la válvula de seis puertos la introduce en el flujo. Inyecta de 0,1 a 100 µL con una precisión mejor que el 0,25 %.',
    modo: 'equipo', e1: 0, xray: true, foco: ['vs_carcasa', 'vs_interior'], dir: [0.4, 0.35, 1], pad: 1.2, resaltar: ['vs_interior'],
  },
  {
    titulo: 'Compartimento de columna',
    texto: 'En la parte baja del muestreador, tras la tapa con el pestillo redondo, un intercambiador de calor atempera la fase móvil antes de la columna. Mantiene hasta 80 °C con una estabilidad de una décima de grado.',
    modo: 'equipo', e1: 0, xray: true, foco: ['icc'], dir: [0.75, 0.35, 0.7], pad: 1.1, resaltar: ['icc'],
  },
  {
    titulo: 'Detector de diodos',
    texto: 'La columna descarga en la celda de flujo del detector, situado bajo el muestreador. La luz de las lámparas de deuterio y wolframio atraviesa la celda y un espectrógrafo la reparte sobre 1024 fotodiodos.',
    modo: 'equipo', e1: 0, xray: true, foco: ['dad_carcasa', 'dad_interior'], dir: [0.5, 0.35, 1], pad: 1.08, resaltar: ['dad_interior', 'capilares'],
  },
  {
    titulo: 'Vista explosionada',
    texto: 'Al separar los módulos se ven los pasos de los capilares: bomba, válvula de inyección, columna, celda y residuos. El orden de la pila acorta los capilares y reduce el volumen de retardo.',
    modo: 'equipo', e1: 1, xray: false, foco: [...PILA, 'residuos'], dir: [0.6, 0.4, 1], resaltar: ['capilares'],
  },
  {
    titulo: 'Desgasificar y mezclar',
    texto: 'En el circuito de flujo, cada disolvente atraviesa un tubo de membrana dentro de una cámara en vacío que le extrae el aire disuelto. Después, la válvula de gradiente reparte cada carrera de aspiración entre los canales A y B.',
    modo: 'analizador', e2: 0, xray: false, foco: ['deposito', 'desgasificador', 'mcgv'], dir: [0.6, 0.6, 0.8], pad: 1.05, resaltar: ['desgasificador', 'mcgv'],
  },
  {
    titulo: 'Dos pistones en serie',
    texto: 'El primer pistón aspira por la válvula de entrada y empuja a través de la válvula de salida y el amortiguador; el segundo, movido a la mitad de velocidad, entrega el caudal mientras el primero vuelve a llenarse.',
    modo: 'analizador', e2: 0.3, xray: true, foco: ['cabezal', 'accionamiento', 'valvula_entrada', 'valvula_salida', 'amortiguador', 'valvula_purga'], dir: [0.25, 0.55, 1], pad: 1.2,
    resaltar: ['cabezal', 'valvula_entrada', 'valvula_salida'],
  },
  {
    titulo: 'Válvula de inyección',
    texto: 'En «bypass» la bomba alimenta directamente la columna mientras el dosificador carga la muestra en el bucle. Al girar el rotor a «mainpass», el flujo arrastra la muestra del bucle y la aguja hacia la columna.',
    modo: 'analizador', e2: 0, xray: false, foco: ['valvula_iny', 'dosificador', 'aguja', 'vial'], dir: [0.55, 0.5, 1], pad: 1.35, resaltar: ['valvula_iny'],
  },
  {
    titulo: 'Separación en la columna',
    texto: 'En la columna C18 los compuestos se reparten entre la fase móvil y la fase estacionaria apolar. Los más polares salen antes; al aumentar el porcentaje de acetonitrilo, los retenidos se despegan antes.',
    modo: 'analizador', e2: 0, xray: true, foco: ['intercambiador', 'columna'], dir: [0.65, 0.55, 0.8], pad: 1.0, resaltar: ['columna', 'intercambiador'],
  },
  {
    titulo: 'Óptica del detector de diodos',
    texto: 'La luz blanca atraviesa la celda antes de dispersarse. La red holográfica fija reparte todas las longitudes de onda a la vez sobre la matriz: no hay que barrer, y cada lectura contiene el espectro completo.',
    modo: 'analizador', e2: 0, xray: false, foco: ['lampara_w', 'lampara_d2', 'acromatico', 'celda', 'rendija', 'red', 'matriz'], dir: [0.75, 0.75, 0.6], pad: 1.2,
    resaltar: ['celda', 'red', 'matriz'],
  },
  {
    titulo: 'Simulación: separar cuatro compuestos',
    texto: 'Paracetamol, cafeína, ácido acetilsalicílico y ácido salicílico se separan en gradiente o en isocrático. Cambie el porcentaje de acetonitrilo, el caudal, la temperatura o la columna y observe la resolución, la presión y el espectro de cada pico.',
    modo: 'analizador', e2: 0, xray: true, sim: true, foco: ['plataformas', 'deposito', 'aguja', 'red'], dir: [0.3, 0.9, 1], resaltar: [],
  },
  {
    titulo: 'Residuos y control',
    texto: 'El eluyente que sale de la celda baja por el canal de la derecha hasta la botella de residuos. Los módulos se comunican entre sí y con el ordenador, donde el programa de datos cromatográficos controla el método y registra las señales.',
    modo: 'equipo', e1: 0, xray: false, sim: false, foco: ['pc', 'bomba_carcasa', 'vs_carcasa', 'residuos'], dir: [0.15, 0.3, 1], resaltar: ['residuos', 'pc'],
  },
];
