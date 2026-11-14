// Animaciones 2D «Cómo funciona» del equipo bruker-avance400: id de componente → escena de js/anim2d/escenas y sus parámetros.
// Los componentes que no aparecen aquí no tienen animación propia.
const A1 = { anim: 'rmn-espin', titulo: 'Espines nucleares en un campo de 9,4 T', p: { B: 9.4 } };
const A2 = { anim: 'rmn-iman', titulo: 'El imán superconductor', p: { B: 9.4 } };
const A3 = { anim: 'rmn-pulso', titulo: 'Pulso de 90° y FID', p: { p90: 10, mhz: 400 } };
const A4 = { anim: 'rmn-fid-fourier', titulo: 'Del FID al espectro' };
const A5 = { anim: 'rmn-desplazamiento', titulo: 'Apantallamiento y desplazamiento químico', p: { mhz: 400 } };
const A6 = { anim: 'rmn-acoplamiento', titulo: 'Acoplamiento J y regla n + 1', p: { J: 7.1, mhz: 400 } };

export const ANIMACIONES = {
  iman: A1,
  lock: A1,
  bobina: A2,
  bobina_apant: A2,
  interruptor: A2,
  deposito_he: A2,
  deposito_n2: A2,
  escudos: A2,
  camara_vacio: A2,
  sonda: A3,
  bobina_rf: A3,
  sintonia: A3,
  amplificadores: A3,
  preamplificador: A4,
  transceptores: A4,
  servidor: A4,
  shims: A4,
  muestra: A5,
  estacion: A6,
};
