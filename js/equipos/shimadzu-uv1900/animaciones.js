// Animaciones 2D «Cómo funciona» del equipo shimadzu-uv1900: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: 'uv-lamparas', titulo: 'Lámparas y espejo conmutador', p: { cambio: '300–350 nm' } };
const A2 = { anim: 'uv-monocromador', titulo: 'Monocromador Czerny-Turner', p: { banda: 1 } };
const A3 = { anim: 'uv-doble-haz', titulo: 'Doble haz: muestra y referencia', p: {} };
const A4 = { anim: 'uv-beer-lambert', titulo: 'Absorción en la cubeta: ley de Beer-Lambert', p: {} };
const A5 = { anim: 'uv-detector', titulo: 'Fotodiodo de silicio', p: {} };

export const ANIMACIONES = {
  lampara_d2: A1,
  lampara_wi: A1,
  espejo_conmutador: A1,
  casa_lamparas: A1,
  fuente_alimentacion: A1,
  monocromador: A2,
  rendija_entrada: A2,
  espejo_colimador: A2,
  red_difraccion: A2,
  espejo_focalizador: A2,
  rendija_salida: A2,
  filtro: A2,
  divisor_haz: A3,
  espejos_planos: A3,
  compartimento: A3,
  sistema_optico: A3,
  cubetas: A4,
  portacubetas: A4,
  tapa_muestras: A4,
  detectores: A5,
  electronica: A5,
};
