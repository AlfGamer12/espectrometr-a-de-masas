// Biblioteca de materiales PBR usados en todo el modelo.
// Las texturas de superficie (metal cepillado, pintura en polvo, granallado, corrugado) se generan
// por código en un canvas: no se descarga ningún archivo.
import * as THREE from 'three';

/* ---------------- Texturas procedurales ---------------- */
function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}
/** Vetas finas en una dirección: metal cepillado / satinado. Gris medio-claro (multiplica la rugosidad). */
function brushed(seed = 1) {
  return canvasTex(512, (g, s) => {
    const r = rng(seed);
    g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const y = r() * s, v = 150 + r() * 105 | 0;
      g.strokeStyle = `rgba(${v},${v},${v},${0.18 + r() * 0.35})`;
      g.lineWidth = 0.4 + r() * 1.2;
      const x = r() * s, l = 40 + r() * 380;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * 1.5); g.stroke();
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s + l, y); g.stroke();
    }
  }, 0.35);
}
/** Grano fino uniforme: pintura en polvo / aluminio granallado. */
function speckle(seed = 2, base = 200, amp = 55, dots = 26000) {
  return canvasTex(512, (g, s) => {
    const r = rng(seed);
    g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, s, s);
    for (let i = 0; i < dots; i++) {
      const v = base + (r() - 0.5) * 2 * amp | 0;
      g.fillStyle = `rgba(${v},${v},${v},0.8)`;
      g.fillRect(r() * s, r() * s, 1 + r() * 1.6, 1 + r() * 1.6);
    }
  }, 0.5);
}
/** Anillos a lo largo de U: manguera corrugada (para TubeGeometry, U = longitud). */
export function ribTexture(count = 90) {
  const t = canvasTex(256, (g, s) => {
    const gr = g.createLinearGradient(0, 0, s, 0);
    gr.addColorStop(0, '#202020'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#202020');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
  });
  t.repeat.set(count, 1);
  return t;
}

const TX = {
  brushed: brushed(3),
  brushed2: brushed(9),
  powder: speckle(5, 205, 40),
  blasted: speckle(11, 190, 60, 40000),
  rubber: speckle(17, 140, 70, 20000),
};

const std = (o) => new THREE.MeshStandardMaterial(o);
const phys = (o) => new THREE.MeshPhysicalMaterial(o);

export const M = {
  // Metales
  acero:        std({ color: 0xc3c7cd, metalness: 1.0, roughness: 0.34, roughnessMap: TX.brushed, bumpMap: TX.brushed, bumpScale: 0.25 }),
  aceroOscuro:  std({ color: 0x80868e, metalness: 1.0, roughness: 0.46, roughnessMap: TX.blasted }),
  aceroPulido:  std({ color: 0xe2e4e8, metalness: 1.0, roughness: 0.14, roughnessMap: TX.brushed2 }),
  aluminio:     std({ color: 0xb9bec5, metalness: 0.95, roughness: 0.5, roughnessMap: TX.blasted, bumpMap: TX.blasted, bumpScale: 0.35 }),
  anodizado:    std({ color: 0x646b74, metalness: 0.75, roughness: 0.5, roughnessMap: TX.blasted }),
  oro:          std({ color: 0xe1ad4a, metalness: 1.0, roughness: 0.22, roughnessMap: TX.brushed2 }),
  cobre:        std({ color: 0xc57a3e, metalness: 1.0, roughness: 0.32 }),
  tungsteno:    std({ color: 0xd8d8d8, metalness: 1.0, roughness: 0.25, emissive: 0x000000 }),
  iman:         std({ color: 0x3c4046, metalness: 0.7, roughness: 0.38, roughnessMap: TX.blasted }),
  tornillo:     std({ color: 0xa9aeb5, metalness: 1.0, roughness: 0.3 }),
  tornilloNegro:std({ color: 0x2a2d31, metalness: 0.8, roughness: 0.42 }),

  // No metálicos
  ceramica:     std({ color: 0xf2eee4, metalness: 0.0, roughness: 0.72, roughnessMap: TX.powder, bumpMap: TX.powder, bumpScale: 0.15 }),
  cuarzo:       phys({ color: 0xe6f6ff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.32,
                       clearcoat: 1, clearcoatRoughness: 0.04, ior: 1.46, depthWrite: false, side: THREE.DoubleSide }),
  vidrio:       phys({ color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.3,
                       clearcoat: 1, depthWrite: false }),
  liquido:      std({ color: 0xd6e8ff, metalness: 0, roughness: 0.1, transparent: true, opacity: 0.65 }),
  vidrioPlomo:  std({ color: 0x3a2a20, metalness: 0.25, roughness: 0.32 }),   // dínodo continuo del EM
  poliimida:    std({ color: 0xa8601e, metalness: 0.1, roughness: 0.38 }),    // recubrimiento de la columna
  aislanteTerm: std({ color: 0xa3a8ad, metalness: 0.0, roughness: 0.95, bumpMap: TX.rubber, bumpScale: 0.6 }),
  goma:         std({ color: 0x232629, metalness: 0.0, roughness: 0.82, roughnessMap: TX.rubber }),
  plasticoNegro:std({ color: 0x1d1f23, metalness: 0.0, roughness: 0.5, roughnessMap: TX.powder }),
  cable:        std({ color: 0x2b2e33, metalness: 0.0, roughness: 0.55 }),
  cableGris:    std({ color: 0x9aa0a8, metalness: 0.0, roughness: 0.5 }),
  ptfe:         std({ color: 0xeeeeea, metalness: 0.0, roughness: 0.45 }),

  // Carcasas: chapa con pintura en polvo y una ligera capa de barniz
  carcasa:      phys({ color: 0xdfe2e6, metalness: 0.0, roughness: 0.55, roughnessMap: TX.powder, bumpMap: TX.powder, bumpScale: 0.2,
                       clearcoat: 0.25, clearcoatRoughness: 0.45 }),
  carcasaOsc:   phys({ color: 0x3b4048, metalness: 0.05, roughness: 0.6, roughnessMap: TX.powder, bumpMap: TX.powder, bumpScale: 0.2,
                       clearcoat: 0.2, clearcoatRoughness: 0.5 }),
  acento:       std({ color: 0x2a5d8f, metalness: 0.1, roughness: 0.45 }),
  negroBrillante: phys({ color: 0x141619, metalness: 0.1, roughness: 0.32, clearcoat: 1.0, clearcoatRoughness: 0.12 }),
  plata:        phys({ color: 0xc8ccd1, metalness: 0.65, roughness: 0.32, roughnessMap: TX.powder, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  grisClaro:    phys({ color: 0xd9dcdf, metalness: 0.0, roughness: 0.5, roughnessMap: TX.powder, bumpMap: TX.powder, bumpScale: 0.15,
                       clearcoat: 0.2, clearcoatRoughness: 0.5 }),
  molibdeno:    std({ color: 0xa4a8ae, metalness: 1.0, roughness: 0.3, roughnessMap: TX.brushed2 }),
  peekRojo:     std({ color: 0xb3262b, metalness: 0.0, roughness: 0.35 }),
  peekBeige:    std({ color: 0xcdb48c, metalness: 0.0, roughness: 0.45 }),
  azulBruker:   phys({ color: 0x1d3f73, metalness: 0.1, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
  disolvente:   std({ color: 0xcfe6ff, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.55 }),
  etiquetaAmarilla: std({ color: 0xf2c230, metalness: 0.0, roughness: 0.4 }),

  // Electrónica
  pcb:          std({ color: 0x1f5e3a, metalness: 0.15, roughness: 0.48, roughnessMap: TX.powder }),
  chip:         std({ color: 0x17191c, metalness: 0.2, roughness: 0.4 }),
  condensador:  std({ color: 0x2b4f8c, metalness: 0.25, roughness: 0.35 }),
  pantalla:     std({ color: 0x0b1418, metalness: 0.2, roughness: 0.15, emissive: 0x0d4e66, emissiveIntensity: 0.7 }),
  ledVerde:     std({ color: 0x1aff7a, emissive: 0x1aff7a, emissiveIntensity: 1.5 }),
  ledAmbar:     std({ color: 0xffb21a, emissive: 0xffb21a, emissiveIntensity: 1.2 }),

  // Efectos
  haz:          new THREE.MeshBasicMaterial({ color: 0x5fd4ff, transparent: true, opacity: 0.0,
                       blending: THREE.AdditiveBlending, depthWrite: false }),
};
