// Configuración del equipo para el visor: Shimadzu IRSpirit (FTIR) con el accesorio ATR QATR-S.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

const OPTICA = ['fuente_ir', 'colimador', 'divisor_haz', 'espejo_fijo', 'espejo_movil', 'espejo_transferencia', 'qatr_cuerpo', 'qatr_placa', 'abrazadera',
  'espejo_elipsoidal', 'detector', 'preamplificador', 'interf_tapa', 'desecante'];

export default {
  id: 'shimadzu-irspirit',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  modos: { equipo: 'Equipo completo', analizador: 'Óptica e interferómetro' },
  FOCO: {
    equipo: ['carcasa_izq', 'panel_compartimento', 'bloque_derecho', 'cubierta_superior', 'chasis', 'panel_trasero', 'abrazadera'],
    analizador: OPTICA,
  },
  DIRS: { equipo: [0.42, 0.5, 1], analizador: [0.2, 0.95, 1] },
  EXTERIOR: ['carcasa', 'cubierta_superior', 'bloque_derecho', 'panel_compartimento', 'chasis', 'tapa_compartimento', 'pulsador_start',
    'indicador_humedad', 'ventana_mantenimiento', 'qatr_s', 'abrazadera', 'prisma_diamante'],
  MAIN_TAGS: ['fuente_ir', 'interferometro', 'divisor_haz', 'espejo_movil', 'qatr_s', 'prisma_diamante', 'detector', 'abrazadera'],
  ao: {
    equipo: { radius: 2.5, thickness: 2.5, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 0.9, thickness: 0.9, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: OPTICA, dir: [0.15, 1.05, 1], pad: 1.05 },
  about: `
    <p>Reconstrucción 3D de un espectrofotómetro infrarrojo por transformada de Fourier <b>Shimadzu IRSpirit</b> con el accesorio de reflexión total
      atenuada <b>QATR-S</b> (prisma de diamante, una reflexión, 45°): fuente cerámica, interferómetro de Michelson sellado con incidencia de 30° y
      alineación dinámica, divisor de KBr recubierto de germanio, láser de referencia de semiconductor, cartucho de gel de sílice y detector DLATGS
      termostatizado.</p>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de las páginas de producto y de opciones del IRSpirit y del IRSpirit-X, la nota de introducción al QATR-S, la pantalla de
      autodiagnóstico del IRSpirit publicada por Shimadzu, los artículos de mantenimiento del fabricante (gel de sílice, indicador de humedad) y
      fotografías del equipo del laboratorio. Las dimensiones exteriores (390 × 250 × 210 mm) y los colores siguen el equipo real.
      La <b>disposición interna, el tamaño de las piezas y el trazado del haz son aproximados</b>: Shimadzu no publica planos del interior.
      En la simulación, las posiciones de las bandas son reales; las intensidades relativas, la emisión de la fuente y el nivel de ruido son orientativos.</p>`,
};
