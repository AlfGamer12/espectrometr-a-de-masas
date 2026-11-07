// Simulación del Shimadzu LCMS-9050: parámetros del Q-TOF común.
import { crearSimQTOF, panelQTOF } from '../../simqtof.js';
import { AX } from './geometria.js';

// Resolución de 45 000 FWHM (ligeramente menor a m/z bajas); exactitud < 1 ppm; tubo de vuelo termostatizado (deriva pequeña).
// Masas de referencia: agrupaciones [(NaI)ₙNa]⁺ del calibrante introducido por la sub-interfaz.
const R = (m) => 45000 * Math.min(1, 0.62 + m / 1000);
export const Simulacion = crearSimQTOF(AX, { R, ppm: 0.9, deriva: 2.5, pulsos: 10000, lo: 100, hi: 1000, refs: [172.88398, 622.5662, 922.35467] });
export const PANEL = panelQTOF({ ms: 'MS (TOF)', msms: 'DDA (MS/MS)', allions: 'DIA (todas las masas)' });
