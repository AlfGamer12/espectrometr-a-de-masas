// Configuración del equipo para el visor: Agilent 7900 ICP-MS.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'agilent-7900',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  tick(eq, dt) { eq.rotor.rotation.z -= dt * 2.2; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  cineReset(eq) { for (const m of eq.analyzer.plasma) m.material.opacity = 0; },
  tuneTitulo: 'Parámetros en MassHunter',
  encuadreCaja: true,
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['automuestreador', 'bomba_peristaltica', 'panel_frontal', 'chasis', 'bomba_rotatoria'],
    analizador: ['nebulizador', 'camara_nebulizacion', 'antorcha', 'cono_muestreo', 'lente_omega', 'celda_ors', 'cuadrupolo', 'detector'],
  },
  DIRS: { equipo: [0.55, 0.42, 1], analizador: [0.15, 0.42, 1] },
  EXTERIOR: ['automuestreador', 'bomba_peristaltica', 'panel_frontal', 'puerta_muestras', 'carcasa', 'chasis', 'bomba_rotatoria', 'enfriador'],
  MAIN_TAGS: ['nebulizador', 'camara_nebulizacion', 'antorcha', 'bobina', 'cono_muestreo', 'cono_separador', 'lente_omega', 'celda_ors', 'cuadrupolo', 'detector'],
  ao: {
    equipo: { radius: 4.0, thickness: 4.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.0, thickness: 1.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['camara_nebulizacion', 'antorcha', 'cono_muestreo', 'lente_omega', 'celda_ors', 'cuadrupolo', 'detector'], dir: [0.1, 0.32, 1], pad: 1.1 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro de masas con plasma acoplado inductivamente <b>Agilent 7900 ICP-MS</b>: automuestreador, bomba peristáltica,
      nebulizador MicroMist, cámara de Scott refrigerada por Peltier, antorcha de cuarzo con ShieldTorch, bobina de RF de 27 MHz, conos de muestreo y de
      separación, lente Omega fuera de eje, celda de colisión/reacción ORS⁴, cuadrupolo hiperbólico y detector ortogonal.</p>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir del folleto y las especificaciones típicas del 7900, la lista de preparación del sitio, documentación técnica de Agilent sobre el modo
      helio y los conos, y bibliografía de ICP-MS. Las dimensiones del mueble, la secuencia de componentes y sus funciones corresponden al equipo real.
      El exterior (puerta negra superior izquierda, tapa blanca, bomba peristáltica en el lateral izquierdo, chimenea y SPS 4) sigue las
      fotografías del fabricante. La <b>disposición interna y las dimensiones de las piezas son aproximadas</b> (no se dispone de planos CAD). Las señales de la simulación son orientativas.</p>`,
};
