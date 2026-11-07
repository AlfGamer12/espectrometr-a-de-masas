// Simulación del Agilent 6546: parámetros del Q-TOF común.
import { crearSimQTOF, panelQTOF } from '../../simqtof.js';
import { AX } from './geometria.js';

// Resolución FWHM: > 30 000 a m/z 118 y > 60 000 a m/z 2722, independiente de la velocidad de adquisición.
const R = (m) => 30000 + Math.max(0, m - 118) * (30000 / 2604);
export const Simulacion = crearSimQTOF(AX, { R, ppm: 0.8, deriva: 6, pulsos: 14000, lo: 100, hi: 1000 });
export const PANEL = panelQTOF({ ms: 'MS (TOF)', msms: 'Auto MS/MS', allions: 'All Ions MS/MS' });
