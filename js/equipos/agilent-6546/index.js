// Configuración del equipo para el visor: Agilent 6546 LC/Q-TOF.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'agilent-6546',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros en MassHunter',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['lc', 'panel_frontal', 'torre_tof', 'chasis', 'bomba_primaria'],
    analizador: ['nebulizador_ajs', 'cuadrupolo', 'celda_colision', 'pulsador', 'tubo_vuelo', 'espejo_iones'],
  },
  DIRS: { equipo: [0.55, 0.4, 1], analizador: [0.9, 0.4, 0.8] },
  EXTERIOR: ['lc', 'panel_frontal', 'carcasa', 'chasis', 'torre_tof', 'carcasa_fuente', 'bomba_primaria', 'cds'],
  MAIN_TAGS: ['nebulizador_ajs', 'capilar', 'octopolo', 'cuadrupolo', 'celda_colision', 'pulsador', 'espejo_iones', 'detector'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.6, thickness: 1.6, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['nebulizador_ajs', 'cuadrupolo', 'pulsador', 'tubo_vuelo', 'espejo_iones'], dir: [0.9, 0.4, 0.8], pad: 1.0 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro <b>Agilent 6546 LC/Q-TOF</b>: fuente Dual Agilent Jet Stream, capilar dieléctrico, octopolo, cuadrupolo,
      celda de colisión hexapolar, slicer, pulsador ortogonal, tubo de vuelo en torre con espejo de dos etapas y detector MCP con centelleador y fotomultiplicador.</p>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de la documentación de Agilent (página de producto, folleto, guía de preparación del sitio, guía de conceptos TOF/Q-TOF,
      nota técnica de óptica iónica y guía de usuario del 6545XT, con el mismo chasis). Las dimensiones exteriores (121,9 × 76,2 × 193 cm), el peso y las
      especificaciones corresponden a la documentación; la disposición interna, la longitud del tubo de vuelo y la configuración exacta de las bombas son
      aproximadas. Las masas exactas de la simulación son las de los compuestos y referencias indicados.</p>`,
};
