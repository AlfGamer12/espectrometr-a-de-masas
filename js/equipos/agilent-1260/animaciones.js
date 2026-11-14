// Animaciones 2D «Cómo funciona» del equipo agilent-1260: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const DESG = { anim: 'hplc-desgasificador', titulo: 'Desgasificador de vacío', p: { canales: 4, volumen: '1,5 mL por canal' } };
const BOMBA = { anim: 'hplc-bomba', titulo: 'Bomba de dos pistones en serie con MCGV', p: { presion: '600 bar', relacion: '2 : 1' } };
const INY = { anim: 'hplc-inyector', titulo: 'Válvula de inyección de 6 puertos', p: { volumen: '5 µL', bucle: '100 µL' } };
const COL = { anim: 'hplc-columna', titulo: 'Separación en fase reversa', p: { columna: 'C18, 150 × 4,6 mm, 5 µm' } };
const DAD = { anim: 'hplc-dad', titulo: 'Detector de diodos frente a monocromador de barrido', p: { diodos: 1024, rango: '190–950 nm' } };

export const ANIMACIONES = {
  desgasificador_vac: DESG,
  bomba: BOMBA, mcgv: BOMBA, cabezal: BOMBA, accionamiento: BOMBA, valvula_entrada: BOMBA, valvula_salida: BOMBA, amortiguador: BOMBA,
  muestreador: INY, valvula_iny: INY, dosificador: INY, aguja: INY,
  icc: COL, intercambiador: COL, columna: COL,
  dad: DAD, lampara_d2: DAD, lampara_w: DAD, acromatico: DAD, celda: DAD, lente_espectro: DAD, rendija: DAD, red: DAD, matriz: DAD,
};
