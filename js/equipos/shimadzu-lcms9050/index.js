// Configuración del equipo para el visor: Shimadzu LCMS-9050 (Q-TOF).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'shimadzu-lcms9050',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros en LabSolutions',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['lc', 'panel_frontal', 'unidad_ionizacion', 'chasis', 'bomba_rotatoria'],
    analizador: ['sonda_esi', 'q1', 'celda_colision', 'acelerador', 'tubo_vuelo', 'ireftof'],
  },
  DIRS: { equipo: [0.75, 0.4, 1], analizador: [1, 0.3, 0.75] },
  EXTERIOR: ['lc', 'panel_frontal', 'carcasa', 'chasis', 'unidad_ionizacion', 'ventana_fuente', 'bomba_rotatoria'],
  MAIN_TAGS: ['sonda_esi', 'linea_desolvatacion', 'uf_qarray', 'q1', 'celda_colision', 'acelerador', 'ireftof', 'detector_mcp'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.6, thickness: 1.6, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['sonda_esi', 'q1', 'acelerador', 'tubo_vuelo', 'ireftof'], dir: [1, 0.3, 0.75], pad: 1.25 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro <b>Shimadzu LCMS-9050</b> (Q-TOF): sonda ESI calefactada con sub-interfaz de calibrante, línea de desolvatación,
      UF-Qarray, UF-Lens, cuadrupolo, celda UFsweeper III con UFaccumulation, acelerador con UFgrating, tubo de vuelo termostatizado UF-FlightTube,
      reflectrón iRefTOF y detector MCP.</p>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de los folletos del LCMS-9050 y del LCMS-9030, el informe técnico C146-E470, las páginas de producto y el procedimiento de vacío
      de Shimadzu. Las especificaciones (resolución, exactitud, estabilidad, cambio de polaridad) y la secuencia de componentes corresponden a la documentación.
      Shimadzu no publica las dimensiones del 9050 (se usan las del 9030), ni la orientación, la longitud o el material del tubo de vuelo: la disposición
      interna del TOF es una estimación.</p>`,
};
