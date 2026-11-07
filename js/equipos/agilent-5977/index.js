// Configuración del equipo para el visor: Agilent 5977 GC/MSD.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'agilent-5977',
  build(root) { const eq = buildEquipo(root); eq.updateHose(); return eq; },
  tick(eq, dt) { eq.rotor.rotation.y += dt * 9; eq.fan.rotation.z -= dt * 6; },
  onExplode(eq) { eq.updateHose(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['gc', 'carcasa_superior', 'chasis', 'bomba_previa', 'panel_frontal'],
    analizador: ['repulsor', 'cuadrupolo', 'multiplicador', 'hed', 'filamento1', 'filamento2', 'calefactor_fuente', 'columna_extremo', 'carcasa_detector'],
  },
  DIRS: { equipo: [0.78, 0.45, 0.62], analizador: [0.8, 0.38, 0.5] },
  EXTERIOR: ['gc', 'gc_puerta', 'gc_inyector', 'panel_frontal', 'carcasa', 'chasis', 'bomba_previa', 'manguera_previa'],
  MAIN_TAGS: ['cuerpo_fuente', 'cuadrupolo', 'radiador', 'hed', 'multiplicador', 'columna'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.2, thickness: 1.2, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['repulsor', 'cuadrupolo', 'multiplicador', 'hed', 'filamento1', 'filamento2', 'calefactor_fuente', 'columna_extremo', 'carcasa_detector'] },
  about: `
    <p>Reconstrucción 3D de un sistema GC/MSD de cuadrupolo simple de la serie <b>Agilent 5977</b>: ionización por impacto
      electrónico, filtro de masas hiperbólico de cuarzo y detector de triple eje.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Carcasa, cámara de vacío, bombas, electrónica e interfaz con el cromatógrafo. La vista explosionada muestra
        cómo se retiran los paneles y cómo sale el analizador con la placa lateral.</td></tr>
      <tr><td>Analizador</td><td>Fuente de iones, lentes, filtro cuadrupolar y detector, desmontables pieza a pieza.</td></tr>
      <tr><td>Recorrido</td><td>Secuencia de 10 pasos desde el cromatógrafo hasta la adquisición de datos.</td></tr>
      <tr><td>Simulación</td><td>Trayectorias iónicas, barrido U/V, espectro resultante y diagrama de estabilidad.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de documentación técnica pública (manuales de operación y mantenimiento de la serie 5977, hojas de
      especificaciones y bibliografía de espectrometría de masas). Los componentes, su función y su forma de unión corresponden al equipo real.
      Las <b>dimensiones y la disposición interna son aproximadas</b>: no se han utilizado planos CAD del fabricante. Los espectros de la simulación son orientativos.</p>`,
};
