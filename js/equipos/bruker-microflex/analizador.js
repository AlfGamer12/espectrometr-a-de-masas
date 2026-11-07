// Analizador del microflex LRF: diana MSP 96 en la mesa XY, electrodos de la fuente (P1/IS1, P2/IS2, tierra), lente,
// selector PCIS, tubo de vuelo, reflector de dos etapas sin rejillas y detectores MCP lineal y de reflexión.
// Coordenadas LOCALES (cm): eje iónico = +X (en el mundo apunta hacia abajo).
import * as THREE from 'three';
import { M } from '../../materials.js';
import { mesh, rbox, box, washerX, cylX, cylY, cylZ, tubeX, tubePath, screws } from '../../geom.js';
import { makePart } from '../../parts.js';
import { AX, ORIGEN } from './geometria.js';

const L2 = (offset, label = true, extra = {}) =>
  ({ level: 2, offset, mode: 'analizador', label: label ? 'analizador' : null, ...extra });

/** Textura de la diana MSP 96: acero con 96 posiciones y anillos marcados. */
function targetTexture() {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 720;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 1080, 720); gr.addColorStop(0, '#c9ccd0'); gr.addColorStop(1, '#a9adb2');
  g.fillStyle = gr; g.fillRect(0, 0, 1080, 720);
  for (let i = 0; i < 9000; i++) { const v = 150 + Math.random() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v},0.25)`; g.fillRect(Math.random() * 1080, Math.random() * 720, 2, 2); }
  g.font = '600 26px Arial'; g.fillStyle = '#4a4f55';
  const rows = 'ABCDEFGH';
  for (let r = 0; r < 8; r++) {
    g.fillText(rows[r], 28, 108 + r * 80);
    for (let col = 0; col < 12; col++) {
      const x = 100 + col * 80, y = 100 + r * 80;
      g.strokeStyle = '#5b6066'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 28, 0, Math.PI * 2); g.stroke();
      if ((r * 12 + col) % 7 < 3) { // depósitos de matriz cristalizada
        g.fillStyle = 'rgba(235,225,190,0.9)'; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(250,245,220,0.9)';
        for (let k = 0; k < 14; k++) { const a = Math.random() * 6.28, rr = Math.random() * 18; g.fillRect(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 3, 2); }
      }
    }
  }
  for (let col = 0; col < 12; col++) g.fillText(String(col + 1), 90 + col * 80 - (col > 8 ? 8 : 0), 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildAnalizador(parent) {
  const refs = {};
  const A = makePart(parent, 'analizador', { level: 1, offset: [0, 0, 0], mode: 'analizador', label: 'equipo' });
  A.position.copy(ORIGEN);
  A.rotation.z = -Math.PI / 2; // +X local -> -Y mundo

  /* ---------------- DIANA Y MESA XY ---------------- */
  {
    const g = makePart(A, 'diana', L2([-6, 0, 0]));
    const tm = new THREE.MeshStandardMaterial({ map: targetTexture(), metalness: 0.85, roughness: 0.38 });
    // placa de 54 × 36 mm: cara activa hacia +X (hacia el tubo de vuelo)
    const plate = mesh(rbox(0.3, 5.4, 3.6, 0.04), M.aceroPulido, [-0.15, 0, 0]);
    g.add(plate);
    g.add(mesh(new THREE.PlaneGeometry(5.4, 3.6), tm, [0.005, 0, 0], [0, Math.PI / 2, 0]));
    // portadiana (target carrier)
    g.add(mesh(rbox(0.4, 7.2, 5.2, 0.15), M.aluminio, [-0.5, 0, 0]));
    for (const y of [-3.1, 3.1]) g.add(mesh(box(0.3, 0.5, 4.6), M.aluminio, [-0.2, y, 0]));
  }
  {
    const g = makePart(A, 'mesa_xy', L2([-12, 0, 0]));
    g.add(mesh(rbox(0.8, 12, 9, 0.2), M.anodizado, [-1.3, 0, 0]));
    g.add(mesh(rbox(0.6, 10, 7, 0.2), M.aluminio, [-2.1, 0, 0]));
    for (const z of [-3, 3]) g.add(mesh(cylY(0.22, 12, 16), M.aceroPulido, [-1.75, 0, z]));       // guías Y
    for (const y of [-4.5, 4.5]) g.add(mesh(cylZ(0.22, 9, 16), M.aceroPulido, [-2.55, y, 0]));    // guías Z
    g.add(mesh(rbox(1.4, 3, 2.4, 0.3), M.plasticoNegro, [-3.3, 5.2, 2.6]));                        // motor paso a paso (por debajo de la tapa de la cámara)
    g.add(mesh(rbox(1.4, 2.4, 3, 0.3), M.plasticoNegro, [-3.3, -5.0, -2.8]));
  }

  /* ---------------- ELECTRODOS DE LA FUENTE ---------------- */
  {
    const g = makePart(A, 'electrodos_fuente', L2([3, 0, 0]));
    g.add(mesh(washerX(3.6, 0.35, 0.12, 64), M.aceroPulido, [AX.P2, 0, 0]));          // P2 (IS2)
    g.add(mesh(washerX(3.6, 0.6, 0.15, 64), M.acero, [AX.GND, 0, 0]));                // electrodo a tierra
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2;
      g.add(mesh(cylX(0.22, 1.0, 12), M.ceramica, [(AX.P2 + AX.GND) / 2, Math.cos(a) * 3.1, Math.sin(a) * 3.1])); }
    // cable de P2 hasta su conector, junto al pasamuros central de la pared de la cámara
    g.add(mesh(tubePath([[AX.P2, 3.6, 0], [AX.P2 - 0.6, 5.2, 0.3], [0.7, 7.0, 0.1], [1.0, 7.95, 0]], 0.12, 24, 8), M.ptfe));
    g.add(mesh(cylY(0.32, 0.6, 16), M.aceroPulido, [1.0, 8.2, 0]));
  }
  {
    const g = makePart(A, 'lente', L2([5, 0, 0]));
    g.add(mesh(tubeX(1.5, 1.2, 1.4, 48), M.aceroPulido, [AX.LENS, 0, 0]));
    g.add(mesh(washerX(2.4, 1.2, 0.12, 48), M.acero, [AX.LENS - 0.8, 0, 0]));
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5;
      g.add(mesh(cylX(0.18, 1.2, 12), M.ceramica, [AX.LENS - 1.3, Math.cos(a) * 2.0, Math.sin(a) * 2.0])); }
  }
  {
    const g = makePart(A, 'pcis', L2([7, 0, 0]));
    for (let i = 0; i < 7; i++) g.add(mesh(box(0.08, 2.2, 0.06), i % 2 ? M.oro : M.aceroPulido, [AX.PCIS0 + 0.6, 0, -0.9 + i * 0.3]));
    for (const z of [-1.3, 1.3]) g.add(mesh(box(0.5, 2.8, 0.25), M.ceramica, [AX.PCIS0 + 0.6, 0, z]));   // marco cerámico
    for (const y of [-1.7, 1.7]) g.add(mesh(box(1.4, 0.15, 2.2), M.aceroPulido, [AX.PCIS0 + 1.4, y, 0]));   // placas deflectoras
  }

  /* ---------------- LÁSER: CABEZAL ÓPTICO Y CÁMARA ---------------- */
  {
    const g = makePart(A, 'optica_laser', L2([0, -8, 0]));
    const h = AX.LASER_HEAD;
    g.add(mesh(rbox(2.4, 2.4, 2.4, 0.3), M.anodizado, [h.x, h.y, h.z]));
    g.add(mesh(cylY(0.7, 2.2, 32), M.aceroOscuro, [h.x - 0.9, h.y + 1.6, h.z], [0, 0, 0.75]));  // tubo de la lente
    g.add(mesh(cylY(0.62, 0.2, 32), M.vidrio, [h.x - 1.65, h.y + 2.45, h.z], [0, 0, 0.75]));   // lente de enfoque
    g.add(mesh(cylY(0.25, 2.6, 16), M.cable, [h.x + 0.4, h.y - 2.5, h.z]));                     // fibra óptica (hasta el conector SMA de la pared)
    // haz láser hasta la diana
    const beamMat = M.haz.clone(); beamMat.color.setHex(0x8a63ff);
    const p0 = new THREE.Vector3(h.x - 1.7, h.y + 2.5, h.z), p1 = AX.TARGET.clone();
    const d = p1.clone().sub(p0);
    const beam = mesh(new THREE.CylinderGeometry(0.05, 0.12, d.length(), 12, 1, true), beamMat);
    beam.position.copy(p0).addScaledVector(d, 0.5); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    beam.userData.noClone = true; beam.castShadow = false; beam.raycast = () => {};
    g.add(beam); refs.laser = beam;
  }
  {
    const g = makePart(A, 'camara_ccd', L2([0, 6, 6]));
    const c = AX.CAM;
    const cam = new THREE.Group(); cam.position.copy(c);
    cam.quaternion.setFromUnitVectors(new THREE.Vector3(-1, 0, 0), AX.TARGET.clone().sub(c).normalize());
    g.add(cam);
    cam.add(mesh(rbox(2.6, 1.8, 1.8, 0.25), M.plasticoNegro, [0.6, 0, 0]));
    cam.add(mesh(cylX(0.55, 1.4, 24), M.aceroOscuro, [-1.3, 0, 0]));
    cam.add(mesh(cylX(0.45, 0.1, 24), M.vidrio, [-2.05, 0, 0]));
    g.add(mesh(tubePath([[c.x + 1.2, c.y, c.z], [c.x + 2.2, c.y + 1, c.z + 1], [c.x + 3, c.y + 2.4, c.z + 2]], 0.12, 16, 6), M.cable));
    g.add(mesh(cylY(0.3, 0.6, 12), M.aceroPulido, [c.x + 3, c.y + 2.6, c.z + 2]));      // conector de la cámara
  }

  /* ---------------- TUBO DE VUELO Y REFLECTOR ---------------- */
  {
    const g = makePart(A, 'tubo_vuelo', L2([0, 0, -12], true, { shell: true }));
    g.add(mesh(tubeX(AX.TUBE_R + 0.3, AX.TUBE_R, AX.TUBE1 - AX.TUBE0, 64), M.acero, [(AX.TUBE0 + AX.TUBE1) / 2, 0, 0]));
    for (const x of [AX.TUBE0 + 0.5, 40, AX.TUBE1 - 0.5]) {
      g.add(mesh(tubeX(AX.TUBE_R + 1.1, AX.TUBE_R + 0.2, 0.9, 64), M.aceroPulido, [x, 0, 0]));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2;
        g.add(mesh(cylX(0.18, 1.2, 6), M.tornillo, [x, Math.cos(a) * (AX.TUBE_R + 0.75), Math.sin(a) * (AX.TUBE_R + 0.75)])); }
    }
    g.add(mesh(cylZ(1.4, 3.4, 40), M.acero, [30, 0, AX.TUBE_R + 1.4]));             // puerto de la turbo
    g.add(mesh(cylZ(2.2, 0.5, 40), M.aceroPulido, [30, 0, AX.TUBE_R + 3.0]));
    // brazo lateral del detector de reflexión
    g.add(mesh(cylY(1.2, 3.0, 32), M.acero, [AX.DET_R.x, AX.TUBE_R + 1.2, 0]));
  }
  {
    const g = makePart(A, 'reflector', L2([12, 0, 0]));
    const n = 16;
    for (let i = 0; i < n; i++) {
      const x = AX.REF0.x + (i / (n - 1)) * (AX.REF1.x - AX.REF0.x);
      g.add(mesh(washerX(2.8, 2.1, 0.12, 56), i < 4 ? M.aceroPulido : M.acero, [x, 0, 0]));
    }
    g.add(mesh(washerX(2.8, 0.9, 0.2, 56), M.aceroPulido, [AX.REF1.x + 0.3, 0, 0]));   // placa final con paso central
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      g.add(mesh(cylX(0.18, AX.REF1.x - AX.REF0.x + 0.6, 12), M.ceramica, [(AX.REF0.x + AX.REF1.x) / 2, Math.cos(a) * 2.5, Math.sin(a) * 2.5])); }
    // la placa final es semitransparente a los iones en modo lineal (paso central)
    g.add(mesh(washerX(0.9, 0.4, 0.34, 32), M.aceroOscuro, [AX.REF1.x + 0.3, 0, 0]));
  }

  /* ---------------- DETECTORES ---------------- */
  {
    const g = makePart(A, 'detector_lineal', L2([10, 0, 0]));
    const x = AX.DET_L.x;
    g.add(mesh(washerX(2.6, 0, 0.35, 56), M.ceramica, [x + 0.6, 0, 0]));
    g.add(mesh(washerX(1.6, 0, 0.06, 56), M.vidrioPlomo, [x, 0, 0]));                // MCP 1
    g.add(mesh(washerX(1.6, 0, 0.06, 56), M.vidrioPlomo, [x + 0.12, 0, 0]));         // MCP 2 (chevron)
    g.add(mesh(washerX(2.0, 1.6, 0.34, 56), M.aceroPulido, [x + 0.06, 0, 0]));          // anillo que abarca las dos MCP (sin caras coplanares)
    g.add(mesh(washerX(2.2, 0, 0.12, 56), M.aceroPulido, [x + 0.9, 0, 0]));           // ánodo
    g.add(mesh(cylX(0.35, 2, 16), M.aceroOscuro, [x + 2, 0, 0]));
    g.add(mesh(tubePath([[x + 3, 0, 0], [x + 3.4, 1.0, 0], [x + 2.6, 3.2, 0.6], [x + 2.5, 4.05, 0.8]], 0.14, 20, 8), M.cable));
    g.add(mesh(cylY(0.3, 0.7, 12), M.aceroPulido, [x + 2.5, 4.4, 0.8]));                // conector de señal
  }
  {
    const g = makePart(A, 'detector_reflector', L2([0, 6, 0]));
    const p = AX.DET_R;
    const d = new THREE.Group(); d.position.copy(p); d.rotation.z = Math.PI / 2; g.add(d);
    d.add(mesh(washerX(1.0, 0, 0.06, 40), M.vidrioPlomo, [0, 0, 0]));
    d.add(mesh(washerX(1.0, 0, 0.06, 40), M.vidrioPlomo, [-0.12, 0, 0]));
    d.add(mesh(washerX(1.4, 0, 0.3, 40), M.ceramica, [-0.5, 0, 0]));
    d.add(mesh(cylX(0.3, 1.6, 16), M.aceroOscuro, [-1.4, 0, 0]));
  }

  refs.group = A;
  return refs;
}
