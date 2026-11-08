// Configuración del equipo para el visor: Bruker microflex LRF.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'bruker-microflex',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  /** El modo película enciende el haz láser del analizador fuera de la simulación: se apaga al salir. */
  cineReset(eq) { if (eq.analyzer && eq.analyzer.laser) eq.analyzer.laser.material.opacity = 0; },
  tuneTitulo: 'Parámetros del método de adquisición',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['cubierta_tubo', 'panel_frontal', 'tapa_superior', 'chasis', 'pc'],
    analizador: ['diana', 'electrodos_fuente', 'tubo_vuelo', 'reflector', 'detector_lineal'],
  },
  DIRS: { equipo: [0.7, 0.35, 1], analizador: [1, 0.25, 0.6] },
  EXTERIOR: ['cubierta_tubo', 'panel_frontal', 'carcasa', 'chasis', 'tapa_carga', 'pc', 'panel_trasero', 'filtro_aire'],
  MAIN_TAGS: ['diana', 'electrodos_fuente', 'tubo_vuelo', 'reflector', 'detector_lineal', 'detector_reflector', 'optica_laser'],
  ao: {
    equipo: { radius: 5.0, thickness: 5.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.4, thickness: 1.4, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['diana', 'tubo_vuelo', 'reflector', 'detector_lineal', 'detector_reflector'], dir: [1, 0.2, 0.55], pad: 1.1 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro de masas <b>Bruker microflex LRF</b>: desorción/ionización láser asistida por matriz (MALDI) con láser de
      nitrógeno, extracción pulsada retardada, tubo de vuelo con reflector de dos etapas sin rejillas y detectores de placas de microcanales.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Torre de sobremesa con puerto de carga y esclusa, cámara de la fuente, láser y fibra óptica, bombas, electrónica y PC.</td></tr>
      <tr><td>Analizador</td><td>Diana MSP 96, mesa XY, electrodos de extracción, lente, selector PCIS, tubo de vuelo, reflector y detectores.</td></tr>
      <tr><td>Recorrido</td><td>Secuencia de 10 pasos desde la preparación de la muestra hasta la detección.</td></tr>
      <tr><td>Simulación</td><td>Tiempos de vuelo calculados, modos lineal y reflectrón, extracción retardada y tres muestras de referencia.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir del manual de usuario del microflex (Bruker Daltonik, 2008), la página y el folleto del microflex LRF, el manual de flexControl y
      las guías de preparación de muestras y de mantenimiento de Bruker. Los componentes, su función y los parámetros de láser y vacío corresponden a la documentación del equipo;
      los valores de IS1, IS2, lente y retardo PIE son típicos y aproximados. La orientación del tubo de vuelo, sus dimensiones y la disposición interna son aproximadas. Las masas de los
      patrones de péptidos son monoisotópicas; las de proteínas, medias.</p>`,
};
