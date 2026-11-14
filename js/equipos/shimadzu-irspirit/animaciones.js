// Animaciones 2D «Cómo funciona» del Shimadzu IRSpirit: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const VIB = { anim: 'ir-vibraciones', titulo: 'Vibraciones moleculares y absorción infrarroja', p: {} };
const MICH = { anim: 'ir-michelson', titulo: 'Interferómetro de Michelson (incidencia de 30°)', p: { angulo: 30, laser: 'láser de semiconductor (≈ 854 nm)' } };
const FT = { anim: 'ir-fourier', titulo: 'Del interferograma al espectro', p: { resolucion: '0,9 cm⁻¹', software: 'el ordenador (LabSolutions IR)' } };
const ATR = { anim: 'ir-atr', titulo: 'Reflexión total atenuada con prisma de diamante', p: { n1: 2.4, n2: 1.5, angulo: 45, prisma: 'diamante', accesorio: 'QATR-S' } };
const DET = { anim: 'ir-detector', titulo: 'Detector piroeléctrico DLATGS', p: { material: 'DLATGS', control: true } };

export const ANIMACIONES = {
  fuente_ir: VIB,
  colimador: VIB,
  compartimento: VIB,
  ventanas: VIB,
  interferometro: MICH,
  divisor_haz: MICH,
  espejo_fijo: MICH,
  espejo_movil: MICH,
  laser_ref: MICH,
  detector_laser: MICH,
  espejo_transferencia: MICH,
  electronica: FT,
  analizador: FT,
  qatr_s: ATR,
  prisma_diamante: ATR,
  optica_atr: ATR,
  abrazadera: ATR,
  espejo_elipsoidal: DET,
  detector: DET,
  preamplificador: DET,
};
