// Configuración del equipo para el visor: Shimadzu UV-1900i (espectrofotómetro UV-Vis de doble haz).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'shimadzu-uv1900',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  // El sistema óptico está encerrado en carcasas (casa de lámparas, monocromador, compartimento): al pasar a esa vista desde los
  // botones de modo se activa la transparencia para que se vea el camino de la luz. El recorrido y la película fijan la suya.
  tick(eq, dt, S) {
    if (S.mode !== eq.modoPrevio) {
      if (S.mode === 'analizador' && eq.modoPrevio === 'equipo' && S.tour < 0 && !S.cine && !S.simOn && !S.xray) window.app?.setXrayState(true);
      eq.modoPrevio = S.mode;
    }
  },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros de medida',
  modos: { equipo: 'Equipo completo', analizador: 'Sistema óptico' },
  FOCO: {
    equipo: ['base', 'carcasa_izq', 'carcasa_der', 'tapa_superior', 'panel_control', 'frontal'],
    analizador: ['casa_lamparas', 'monocromador', 'espejos_planos', 'divisor_haz', 'compartimento', 'detectores', 'banco_optico'],
  },
  // vista de presentación desde delante a la izquierda (como la fotografía del laboratorio); el sistema óptico, desde arriba
  DIRS: { equipo: [-0.62, 0.55, 1], analizador: [0.15, 1.05, 0.7] },
  EXTERIOR: ['carcasa', 'tapa_muestras', 'panel_control', 'pantalla'],
  MAIN_TAGS: ['lampara_d2', 'lampara_wi', 'espejo_conmutador', 'monocromador', 'red_difraccion', 'espejo_colimador', 'espejo_focalizador', 'divisor_haz', 'cubetas', 'detectores'],
  ao: {
    equipo: { radius: 3.0, thickness: 3.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.2, thickness: 1.2, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['casa_lamparas', 'monocromador', 'divisor_haz', 'portacubetas', 'detectores'], dir: [0.05, 1.2, 0.5], pad: 0.95 },
  cineReset(eq) {
    for (const m of [eq.analyzer.glowD2, eq.analyzer.glowWI, ...eq.analyzer.glowDet]) m.material.opacity = 0;
  },
  about: `
    <p>Reconstrucción 3D de un espectrofotómetro ultravioleta-visible de doble haz <b>Shimadzu UV-1900i</b>: lámparas de deuterio y halógena de
      wolframio con espejo conmutador, monocromador Czerny-Turner con red de difracción LO-RAY-LIGH, filtro de corte, divisor de haz, compartimento
      de muestras con cubetas de 10 mm, fotodiodos de silicio, electrónica y pantalla táctil.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Carcasa, tapa del compartimento, bloque de mando con la pantalla, fuente de alimentación y placa principal.
        La vista explosionada retira la cubierta y los paneles y deja ver el sistema óptico.</td></tr>
      <tr><td>Sistema óptico</td><td>Camino completo de la luz, desmontable pieza a pieza.</td></tr>
      <tr><td>Simulación</td><td>Barrido de un espectro con la luz recorriendo el equipo; efecto de la concentración, del paso óptico, del ancho de banda
        espectral y de la luz parásita; curva de calibrado.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de las páginas del fabricante (UV-1900i Plus: prestaciones; Shimadzu Design: UV-1900i), la nota de lanzamiento del UV-1900
      y la serie «Basics of UV-Vis-NIR Spectroscopy» de Shimadzu (fuentes de luz, monocromadores, detectores). El exterior sigue las fotografías del
      equipo del laboratorio (rotulado «UV-1900», el modelo anterior, con el mismo diseño exterior) y las del fabricante. Los componentes, su función y
      su orden en el camino de la luz corresponden al equipo real; <b>las medidas y la disposición interna son aproximadas</b> (no se dispone de
      planos). Los espectros de la simulación usan absortividades publicadas, pero la forma de las bandas es aproximada y el ruido es ilustrativo.</p>`,
};
