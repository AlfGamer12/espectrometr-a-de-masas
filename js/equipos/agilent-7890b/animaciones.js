// Animaciones 2D «Cómo funciona» del Agilent 7890B GC-FID: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const INY = { anim: 'gc-split-splitless', titulo: 'Inyección split y splitless', p: { ratio: 50, columna: 1.2, temp: '250 °C', purga: '0,75 min', gas: 'helio' } };
const EPC = { anim: 'gc-epc', titulo: 'Control electrónico de la neumática', p: { caudal: 1.2, gas: 'he', L: 30, d: 0.25 } };
const COL = { anim: 'gc-columna', titulo: 'Separación en la columna capilar', p: { columna: '30 m × 0,25 mm d.i. × 0,25 µm', espesor: '0,25 µm', gas: 'helio', caudal: '1,2 mL/min', inyector: '250 °C' } };
const HORNO = { anim: 'gc-horno-rampa', titulo: 'Isotermo frente a programa de temperatura', p: { iso: 150, T0: 40, rampa: 10, Tf: 250, columna: '30 m × 0,25 mm × 0,25 µm' } };
const FID = { anim: 'gc-fid', titulo: 'Detector de ionización de llama', p: { h2: '30 mL/min', aire: '400 mL/min', aux: '25 mL/min', auxGas: 'N₂' } };

export const ANIMACIONES = {
  als_jeringa: INY,
  tuerca_septum: INY,
  septum: INY,
  inyector_cabeza: INY,
  liner: INY,
  inyector_bloque: INY,
  inyector_base: INY,
  trampa_split: INY,
  epc_inyector: EPC,
  epc_detector: EPC,
  lineas_neumaticas: EPC,
  columna: COL,
  jaula_columna: COL,
  horno: HORNO,
  puerta_horno: HORNO,
  ventilador_horno: HORNO,
  calefactor_horno: HORNO,
  fid_base: FID,
  fid_chorro: FID,
  fid_colector: FID,
  fid_castillo: FID,
  fid_ignitor: FID,
  electrometro: FID,
};
