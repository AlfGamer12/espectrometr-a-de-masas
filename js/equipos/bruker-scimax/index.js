// Configuración del equipo para el visor: Bruker scimaX MRMS (FT-ICR).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'bruker-scimax',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  // la simulación ilumina los electrodos de excitación de la ParaCell: al salir de la película se apagan
  cineReset(eq) { if (eq.analyzer && eq.analyzer.exc) eq.analyzer.exc.material.emissiveIntensity = 0; },
  tuneTitulo: 'Parámetros en ftmsControl',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['panel_frontal', 'iman', 'carcasa_fuente', 'chasis', 'compresor_helio'],
    analizador: ['fuente_dual', 'cuadrupolo', 'optica_transferencia', 'paracell', 'preamplificador'],
  },
  DIRS: { equipo: [0.5, 0.45, 1], analizador: [0.35, 0.5, 1] },
  EXTERIOR: ['panel_frontal', 'carcasa', 'chasis', 'iman', 'carcasa_fuente', 'criorrefrigerador', 'compresor_helio', 'pc', 'laser_maldi'],
  MAIN_TAGS: ['fuente_dual', 'embudos', 'cuadrupolo', 'celda_colision', 'optica_transferencia', 'paracell'],
  ao: {
    equipo: { radius: 7.0, thickness: 7.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 2.0, thickness: 2.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['paracell', 'preamplificador', 'tubo_uhv'], dir: [0.5, 0.5, 1], pad: 1.5 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro <b>Bruker scimaX MRMS</b> (resonancia ciclotrónica de iones con transformada de Fourier): fuente dual ESI/MALDI,
      embudo de dos etapas, cuadrupolo, celda de colisión, óptica de transferencia, imán superconductor de 7 T refrigerado por conducción y celda ParaCell.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Mueble único que cubre consola e imán, cabeza frontal con la fuente ESI/MALDI, criorrefrigerador, compresor de helio, bombas, electrónica y puesto de control.</td></tr>
      <tr><td>Analizador</td><td>Trayecto iónico completo hasta la celda ICR, desmontable pieza a pieza.</td></tr>
      <tr><td>Simulación</td><td>Ciclo completo de acumulación, excitación y detección; transitorio y estructura isotópica fina en función de la duración
        del transitorio, la detección 1ω/2ω y el modo de procesado.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de la documentación de Bruker (página de producto, folleto del trayecto de iones, patente de la ParaCell) y de artículos científicos
      con un scimaX real. Las especificaciones de resolución, exactitud, campo y vacío, y la secuencia de componentes, corresponden al equipo.
      El aspecto exterior se ha contrastado con fotografías del equipo. Bruker no publica las dimensiones del sistema ni las del imán: el tamaño del mueble, del imán y de la celda son estimaciones, y la óptica de transferencia se ha acortado para que el analizador quepa en el mueble.
      Las masas de los isotopólogos están calculadas; sus abundancias son aproximadas.</p>`,
};
