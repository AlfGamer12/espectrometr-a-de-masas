// Configuración del equipo para el visor: Shimadzu LCMS-8060NX.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'shimadzu-lcms8060',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros en LabSolutions',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['lc', 'torre_fuente', 'carcasa_superior', 'chasis', 'bomba_rotatoria', 'panel_frontal'],
    analizador: ['sonda_esi', 'bloque_calefactor', 'q1', 'celda_multipolo', 'q3', 'multiplicador', 'dinodo_conversion'],
  },
  DIRS: { equipo: [0.55, 0.42, 0.9], analizador: [0.35, 0.5, 1] },
  EXTERIOR: ['lc', 'lc_botellas', 'lc_bomba', 'lc_inyector', 'lc_horno', 'tubo_peek', 'panel_frontal', 'carcasa', 'chasis', 'torre_fuente',
    'ventana_fuente', 'valvula_desvio', 'bomba_rotatoria', 'linea_vacio_previo', 'sonda_esi'],
  MAIN_TAGS: ['sonda_esi', 'linea_desolvatacion', 'uf_qarray', 'q1', 'celda_colision', 'q3', 'multiplicador'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.6, thickness: 1.6, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['sonda_esi', 'q1', 'celda_multipolo', 'q3', 'multiplicador'], dir: [0.3, 0.5, 1], pad: 1.05 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro de masas de triple cuadrupolo <b>Shimadzu LCMS-8060NX</b> acoplado a cromatografía de líquidos:
      ionización por electrospray con unidad IonFocus, línea de desolvatación, guías de iones UF-Qarray y UF-Lens, cuadrupolos Q1 y Q3 de barras
      hiperbólicas, celda de colisión UFsweeper III y detector con dínodo de conversión.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Unidad MS, unidad de ionización, cámara de vacío, bomba turbomolecular de tres entradas, bomba rotatoria,
        electrónica, gases y cromatógrafo de líquidos.</td></tr>
      <tr><td>Analizador</td><td>Trayecto iónico completo desde la sonda ESI hasta el detector, desmontable pieza a pieza.</td></tr>
      <tr><td>Recorrido</td><td>Secuencia de 10 pasos desde el cromatógrafo hasta el detector.</td></tr>
      <tr><td>Simulación</td><td>Modos MRM, barrido de iones producto y barrido Q1, con efecto de la energía de colisión.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de documentación pública de Shimadzu (folletos y especificaciones del LCMS-8060/8060NX, hoja técnica del LCMS-8040,
      folleto de consumibles y guía de fundamentos de LC-MS). Las dimensiones exteriores (1180 × 540 × 610 mm) y la secuencia de componentes
      corresponden al equipo real; la disposición interna, las dimensiones de las piezas y algunos valores marcados como aproximados son estimaciones.
      Las transiciones MRM de la simulación son de referencia y las abundancias, ilustrativas.</p>`,
};
