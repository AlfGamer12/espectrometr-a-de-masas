// Configuración del equipo para el visor: Agilent 1260 Infinity II (HPLC modular con detector de diodos).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'agilent-1260',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  cineReset(eq) { for (const h of eq.circuito.haces) h.material.opacity = 0; },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  modos: { equipo: 'Equipo completo', analizador: 'Circuito de flujo' },
  FOCO: {
    equipo: ['bomba_carcasa', 'dad_carcasa', 'vs_carcasa', 'bandeja', 'botellas', 'residuos'],
    analizador: ['plataformas', 'deposito', 'desgasificador', 'red', 'aguja'],
  },
  DIRS: { equipo: [0.5, 0.3, 1], analizador: [0.3, 0.85, 1] },
  EXTERIOR: ['bandeja', 'botellas', 'bomba', 'dad', 'muestreador', 'icc', 'residuos', 'pc'],
  MAIN_TAGS: ['deposito', 'desgasificador_vac', 'mcgv', 'cabezal', 'valvula_purga', 'valvula_iny', 'aguja', 'columna', 'celda', 'lampara_d2', 'red', 'matriz'],
  ao: {
    equipo: { radius: 4.0, thickness: 4.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 2.0, thickness: 2.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['plataformas', 'deposito', 'aguja', 'red'], dir: [0.3, 0.9, 1], pad: 1.0 },
  about: `
    <p>Reconstrucción 3D de un cromatógrafo de líquidos <b>Agilent 1260 Infinity II</b> en una sola pila, como el del laboratorio: bandeja de
      disolventes, muestreador automático Vialsampler con compartimento de columna integrado, detector de diodos y bomba cuaternaria G7111B
      con desgasificador. El modo «Circuito de flujo» muestra, ampliados, el desgasificador, la válvula de gradiente, los dos pistones en serie,
      la válvula de inyección de seis puertos, la columna y la óptica del detector de diodos.</p>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de las fotografías del equipo del laboratorio y de la documentación de Agilent: manual del sistema cuaternario 1260
      Infinity II, manual de las bombas isocrática y cuaternarias, manual de los Vialsampler (G7129A/B/C) y manual de los detectores DAD WR y
      MWD. Las dimensiones de los módulos y las especificaciones son las de esos manuales.</p>
    <p>El laboratorio no indicó el modelo de detector: se ha supuesto un <b>DAD WR G7115A</b>, compatible con el módulo de 140 mm de las fotos.
      El panel con pestillo redondo bajo las puertas del muestreador se ha interpretado como la tapa del compartimento de columna integrado
      (G7130A). La disposición interna de cada módulo, el recorrido de los capilares y las dimensiones de la bandeja de disolventes son
      aproximados. La columna (C18, 150 × 4,6 mm, 5 µm) es un supuesto para la simulación, cuyos tiempos de retención, presiones y espectros
      son orientativos.</p>`,
};
