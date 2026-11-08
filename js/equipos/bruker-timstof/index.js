// Configuración del equipo para el visor: Bruker timsTOF Pro.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'bruker-timstof',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  tuneTitulo: 'Parámetros en timsControl',
  modos: { equipo: 'Equipo completo', analizador: 'Analizador' },
  FOCO: {
    equipo: ['panel_frontal', 'torre_tof', 'nanolc', 'chasis'],
    analizador: ['captivespray', 'tims_analisis', 'cuadrupolo', 'tubo_tof', 'reflectron', 'detector_mcp'],
  },
  DIRS: { equipo: [-0.75, 0.38, 0.85], analizador: [0.9, 0.45, 0.75] },
  EXTERIOR: ['panel_frontal', 'carcasa', 'chasis', 'torre_tof', 'nanolc', 'captivespray'],
  MAIN_TAGS: ['captivespray', 'tims', 'cuadrupolo', 'celda_colision', 'pusher', 'reflectron', 'detector_mcp'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.6, thickness: 1.6, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['captivespray', 'tims_analisis', 'cuadrupolo', 'tubo_tof', 'reflectron'], dir: [0.9, 0.45, 0.75], pad: 1.0 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro <b>Bruker timsTOF Pro</b>: fuente CaptiveSpray, capilar con deflexión, túnel de movilidad iónica atrapada (TIMS)
      de doble sección, cuadrupolo, celda de colisión y analizador de tiempo de vuelo ortogonal con reflectrón.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Cuerpo gris con columna frontal y torre del TOF azules, fuente sobre la banda frontal, nanoElute en su carro, bomba de vacío previo externa, cámaras de vacío, bombas y electrónica.</td></tr>
      <tr><td>Analizador</td><td>Trayecto iónico completo desde el emisor hasta el detector de microcanales.</td></tr>
      <tr><td>Simulación</td><td>Rampa del TIMS, mapa m/z–movilidad, selección PASEF y espectros MS/MS.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de las páginas de producto de Bruker y de los artículos que describen el instrumento (Meier et al. 2015, 2018 y 2021; Fernandez-Lima et al.
      2011). Los parámetros del TIMS (longitud, diámetro, rampa, RF, presión), del cuadrupolo, del TOF y del digitalizador corresponden a la documentación.
      El aspecto exterior se ha contrastado con fotografías del equipo; sus dimensiones (≈ 2,57 m de alto con la torre) son aproximadas, igual que la longitud de vuelo, la configuración de las bombas y la disposición interna. Los valores de 1/K₀ de los
      calibrantes son publicados; la nube de péptidos es ilustrativa.</p>`,
};
