// Configuración del equipo para el visor: Agilent 7890B GC con inyector automático 7693A, inyector split/splitless y FID.
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'agilent-7890b',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  tick(eq, dt) { eq.fan.rotation.z -= dt * 14; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  cineReset(eq) { for (const m of eq.llama) m.opacity = 0; },
  tuneTitulo: 'Parámetros del método',
  modos: { equipo: 'Equipo completo', analizador: 'Inyector, columna y FID' },
  FOCO: {
    equipo: ['als_torre', 'als_torreta', 'tapa_superior', 'teclado', 'puerta_horno', 'frontal_izq', 'chasis'],
    analizador: ['als_jeringa', 'als_torreta', 'tuerca_septum', 'liner', 'inyector_bloque', 'columna', 'jaula_columna', 'fid_castillo', 'fid_base', 'electrometro'],
  },
  DIRS: { equipo: [0.42, 0.3, 1], analizador: [-0.3, 0.32, 1] },
  EXTERIOR: ['carcasa', 'chasis', 'tapa_inyectores', 'puerta_horno', 'teclado', 'als_torre', 'als_torreta', 'panel_gases', 'filtros_gas', 'lineas_gas'],
  MAIN_TAGS: ['als_torreta', 'als_jeringa', 'liner', 'inyector_bloque', 'columna', 'fid_colector', 'fid_castillo', 'epc_inyector', 'epc_detector', 'electrometro', 'ventilador_horno'],
  ao: {
    equipo: { radius: 5.0, thickness: 5.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 1.0, thickness: 1.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.5, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['tuerca_septum', 'liner', 'inyector_bloque', 'columna', 'jaula_columna', 'fid_castillo', 'fid_base', 'electrometro'], dir: [-0.22, 0.26, 1], pad: 1.05 },
  about: `
    <p>Reconstrucción 3D de un cromatógrafo de gases <b>Agilent 7890B</b> con inyector automático <b>7693A</b>, inyector split/splitless
      con control electrónico de la neumática (EPC) y detector de ionización de llama (<b>FID</b>), a partir de las fotografías del equipo del laboratorio.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Equipo completo</td><td>Carcasa, horno, teclado, torre de inyección con su torreta, electrónica y la instalación de gases del laboratorio
        (reguladores de helio, aire, nitrógeno e hidrógeno, filtros y líneas de cobre). La vista explosionada retira paneles, puerta y torre.</td></tr>
      <tr><td>Inyector, columna y FID</td><td>Jeringa, carro y torreta del 7693A; tuerca, septum, cabeza, liner, bloque y base del inyector; módulos EPC y trampa de split;
        columna en su jaula con el ventilador y la resistencia del horno; base, chorro, colector, encendedor y electrómetro del FID.</td></tr>
      <tr><td>Recorrido</td><td>Doce pasos desde los gases del laboratorio hasta la señal del detector.</td></tr>
      <tr><td>Simulación</td><td>Separación de n-alcanos o de BTEX: programa del horno, gas portador y velocidad lineal (curva de van Deemter), relación de split
        y dimensiones de la columna; cromatograma con tiempos de retención, resolución del par crítico y respuesta del FID proporcional al número de carbonos.</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>El exterior sigue las fotografías del equipo del laboratorio y las imágenes de Agilent (módulo izquierdo con plataforma negra, puerta del horno,
      columna de teclado y pantalla, torre 7693A con torreta). Los datos técnicos proceden de la hoja de especificaciones del 7890B, de las especificaciones del
      7693A y de los artículos técnicos de Agilent sobre el FID. <b>La configuración del detector (FID) se ha deducido de los gases instalados en el laboratorio</b>
      (helio como portador, hidrógeno y aire para la llama, nitrógeno como gas auxiliar). Las medidas exteriores (50 × 59 × 54 cm) son las del fabricante;
      <b>la disposición interna y las dimensiones de las piezas son aproximadas</b> (no se dispone de planos del fabricante). La simulación usa un modelo
      simplificado: los tiempos y las alturas de pico son orientativos.</p>`,
};
