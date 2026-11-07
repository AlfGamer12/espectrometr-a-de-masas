// Configuración del equipo para el visor: sector magnético de doble enfoque (modelo didáctico tipo Thermo DFS).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'sector-doble-enfoque',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros de sintonía',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['gc', 'panel_frontal', 'tapa_analizador', 'chasis', 'enfriador'],
    analizador: ['fuente_ei', 'iman', 'esa', 'multiplicador', 'tubo_vuelo'],
  },
  DIRS: { equipo: [0.6, 0.55, 1], analizador: [0.3, 1, 0.55] },
  EXTERIOR: ['gc', 'panel_frontal', 'tapa_analizador', 'consola', 'chasis', 'enfriador', 'linea_transferencia'],
  MAIN_TAGS: ['fuente_ei', 'rendija_entrada', 'iman', 'esa', 'multiplicador', 'tubo_vuelo'],
  ao: {
    equipo: { radius: 7.0, thickness: 7.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 2.5, thickness: 2.5, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['fuente_ei', 'iman', 'esa', 'multiplicador'], dir: [0.3, 1, 0.55], pad: 1.0 },
  about: `
    <p>Reconstrucción 3D didáctica de un <b>espectrómetro de masas de sector magnético de doble enfoque</b> acoplado a cromatografía de gases (GC-HRMS),
      basada en el Thermo Scientific DFS: geometría Nier–Johnson inversa, imán laminado de 65° y 350 mm de radio, analizador electrostático toroidal,
      rendijas de tántalo motorizadas y detector con dínodo de conversión.</p>
    <p>Ninguno de los tres fabricantes del catálogo (Agilent, Shimadzu, Bruker) comercializa actualmente sectores magnéticos; por eso se presenta como
      modelo genérico con referencias comerciales (Thermo Fisher Scientific y JEOL).</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Consola, plataforma antivibratoria, bombas, fuentes del imán y de alta tensión, enfriador y cromatógrafo.</td></tr>
      <tr><td>Analizador</td><td>Fuente EI, lentes, rendijas, sector magnético, sector eléctrico y detector.</td></tr>
      <tr><td>Simulación</td><td>Barrido magnético con trayectorias calculadas, efecto del ancho de rendija sobre la resolución y dobletes de masa.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Las especificaciones del imán (65°, 350 mm), la tensión de aceleración, la resolución y las dimensiones de la consola proceden de la documentación
      de Thermo Fisher. El radio y el ángulo del sector eléctrico, la disposición interna y las dimensiones de las piezas son aproximados.
      Las masas exactas de TCDD y PFK proceden del método EPA 1613B.</p>`,
};
