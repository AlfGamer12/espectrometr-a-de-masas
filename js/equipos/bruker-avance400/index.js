// Configuración del equipo para el visor: Bruker AVANCE NEO 400 (RMN de 400 MHz, imán Ascend 400 de 9,4 T).
import { buildEquipo } from './equipo.js';
import { INFO, CATEGORIAS } from './componentes.js';
import { RECORRIDO } from './recorrido.js';
import { Simulacion, PANEL } from './sim.js';
import { RECURSOS } from './recursos.js';
import { PELICULA } from './pelicula.js';

export default {
  id: 'bruker-avance400',
  build(root) { const eq = buildEquipo(root); eq.update(); return eq; },
  onExplode(eq) { eq.update(); },
  INFO, CATEGORIAS, RECORRIDO, RECURSOS, PELICULA,
  // la simulación ilumina las bobinas de RF: al salir de la película se apagan
  cineReset(eq) { for (const m of eq.bobinasRF || []) m.material.emissiveIntensity = 0; },
  tuneTitulo: 'Parámetros en TopSpin',
  encuadreCaja: true,
  modos: { equipo: 'Instalación completa', analizador: 'Imán y sonda' },
  FOCO: {
    equipo: ['iman', 'torretas', 'soporte', 'amortiguadores', 'samplecase', 'hppr', 'consola_frente', 'consola_der', 'consola_techo'],
    analizador: ['camara_vacio', 'sonda', 'shims', 'elevador'],
  },
  DIRS: { equipo: [0.42, 0.34, 1], analizador: [1, 0.42, 1] },
  EXTERIOR: ['iman', 'torretas', 'soporte', 'amortiguadores', 'samplecase', 'consola', 'estacion', 'preamplificador', 'cableado'],
  MAIN_TAGS: ['camara_vacio', 'deposito_n2', 'deposito_he', 'bobina', 'bobina_apant', 'cuellos', 'shims', 'sonda', 'elevador', 'preamplificador', 'transceptores', 'amplificadores'],
  ao: {
    equipo: { radius: 6.0, thickness: 6.0, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
    analizador: { radius: 2.5, thickness: 2.5, distanceExponent: 1.5, distanceFallOff: 1, scale: 1.4, samples: 16, screenSpaceRadius: false },
  },
  sim: { Clase: Simulacion, panel: PANEL, foco: ['bobina_rf'], dir: [1, 0.3, 1], pad: 1.6 },
  about: `
    <p>Reconstrucción 3D de un espectrómetro de resonancia magnética nuclear <b>Bruker AVANCE NEO 400</b> con imán superconductor <b>Ascend 400</b>
      (9,4 T, ¹H a 400 MHz, bore estándar de 54 mm), sonda de 5 mm a temperatura ambiente, preamplificador HPPR/2, cambiador SampleCase y consola AVANCE NEO.</p>
    <h4>Contenido</h4>
    <table class="specs">
      <tr><td>Instalación completa</td><td>Imán sobre su soporte con amortiguadores, torretas de helio y nitrógeno, cambiador de muestras, preamplificador, armario de la consola, cableado y puesto de control.</td></tr>
      <tr><td>Imán y sonda</td><td>Criostato en corte (cámara de vacío, pantallas, depósitos de nitrógeno y de helio, solenoide de NbTi y bobina de apantallamiento), shims, sonda con bobinas de RF y sintonía, muestra y spinner; preamplificador y módulos de la consola.</td></tr>
      <tr><td>Simulación</td><td>Espectro de ¹H calculado por diagonalización exacta del hamiltoniano de espín: pulso, FID, transformada de Fourier, efecto del ángulo de pulso, del número de transitorios, del shim y del campo (400 frente a 60 MHz).</td></tr>
    </table>
    <h4>Precisión y fuentes</h4>
    <p>Elaborado a partir de las páginas de Bruker sobre los imanes Ascend, la consola AVANCE NEO y el SampleCase, de la nota de lanzamiento de la AVANCE NEO
      y de las fichas de equipos AVANCE NEO 400 de laboratorios universitarios. Las frecuencias de resonancia, el campo, el bore, la temperatura del helio y los
      principios de funcionamiento corresponden al equipo. Bruker no publica planos del criostato ni del armario: <b>las dimensiones exteriores, los radios
      interiores, el número y la posición de las torretas y la disposición de los módulos de la consola son aproximados</b>, igual que la forma de los amortiguadores.
      En la simulación, desplazamientos químicos y constantes de acoplamiento son valores de bibliografía (redondeados); la relación señal/ruido es orientativa.</p>`,
};
