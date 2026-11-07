// Registro de piezas: explosionado, resaltado, rayos X y visibilidad por modo.
import * as THREE from 'three';

export const parts = new Map();

/**
 * Crea un grupo-pieza.
 * opts: { info, level (1 = equipo, 2 = analizador), offset [x,y,z], shell (se vuelve
 *         translúcida en modo rayos X), label ('equipo' | 'analizador' | null),
 *         mode ('equipo' | 'analizador' -> modo al que pertenece) }
 */
export function makePart(parent, id, opts = {}) {
  const g = new THREE.Group();
  g.name = id;
  g.userData.partId = id;
  parent.add(g);
  parts.set(id, {
    id,
    info: opts.info || id,
    object: g,
    level: opts.level || 1,
    offset: new THREE.Vector3(...(opts.offset || [0, 0, 0])),
    base: new THREE.Vector3(),
    shell: !!opts.shell,
    label: opts.label || null,
    mode: opts.mode || 'equipo',
    onlyAnalyzer: !!opts.onlyAnalyzer,
    centerLocal: new THREE.Vector3(),
    radius: 1,
  });
  return g;
}

/** Recorre las mallas propias de una pieza (sin entrar en sub-piezas). */
export function ownMeshes(obj, fn, root = obj) {
  if (obj !== root && obj.userData.partId) return;
  if (obj.isMesh) fn(obj);
  for (const c of obj.children) ownMeshes(c, fn, root);
}

/** Debe llamarse una vez que todo está construido. */
export function finalizeParts(scene) {
  // Material único por malla -> resaltado independiente.
  scene.traverse((o) => {
    if (o.isMesh && !o.userData.noClone) {
      o.material = o.material.clone();
      // Rótulos, pantallas y rejillas son planos pegados a una superficie: se adelantan en profundidad para que no parpadeen.
      if (o.geometry.type === 'PlaneGeometry' || o.userData.decal) {
        o.material.polygonOffset = true; o.material.polygonOffsetFactor = -2; o.material.polygonOffsetUnits = -4;
        o.castShadow = false;
      }
      o.userData.baseOpacity = o.material.opacity;
      o.userData.baseTransparent = o.material.transparent;
      o.userData.baseDepthWrite = o.material.depthWrite;
      o.userData.baseEmissive = o.material.emissive ? o.material.emissive.clone() : null;
      o.userData.baseEmissiveI = o.material.emissiveIntensity ?? 1;
    }
  });
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  for (const p of parts.values()) {
    p.base.copy(p.object.position);
    box.makeEmpty();
    ownMeshes(p.object, (m) => {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
      box.union(tmp);
    });
    if (box.isEmpty()) p.object.traverse((m) => {
      if (m.isMesh) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
        tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); box.union(tmp); }
    });
    const c = box.getCenter(new THREE.Vector3());
    p.radius = Math.max(0.3, box.getSize(new THREE.Vector3()).length() / 2);
    p.centerLocal.copy(p.object.worldToLocal(c.clone()));
  }
}

/* ---------- Cables y mangueras flexibles ----------
 * Cada punto de control sigue a la pieza que se le indique al explosionar, de modo que el cable
 * permanece conectado y pasa por los pasamuros de los paneles en lugar de quedar suelto o atravesarlos.
 * pts: [[x, y, z, 'idPieza'?], ...] en coordenadas del padre, en reposo. Sin id, el punto sigue a la pieza que contiene el cable. */
const flexes = [];
export function cableFlex(parent, pts, r, mat, { seg = 72, radial = 10 } = {}) {
  const m = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  const f = { m, parent, r, seg, radial, key: '', pts: pts.map((p) => ({ local: new THREE.Vector3(p[0], p[1], p[2]), anchor: p[3] || null })) };
  flexes.push(f);
  buildFlex(f, f.pts.map((p) => p.local));
  return m;
}
function buildFlex(f, pts) {
  f.m.geometry.dispose();
  f.m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), f.seg, f.r, f.radial, false);
}
/** Tras finalizeParts, con todo en reposo. */
export function initFlex() {
  for (const f of flexes) {
    f.parent.updateWorldMatrix(true, false);
    for (const p of f.pts) {
      p.world0 = f.parent.localToWorld(p.local.clone());
      p.part = p.anchor ? parts.get(p.anchor) : partFromObject(f.parent);
      if (p.anchor && !p.part) console.warn('cableFlex: pieza desconocida', p.anchor);
      p.inv0 = p.part ? p.part.object.matrixWorld.clone().invert() : null;
    }
  }
}
const _w = new THREE.Vector3();
/** Recalcula los cables (llamar con las matrices del mundo actualizadas). */
export function updateFlex() {
  for (const f of flexes) {
    if (!f.pts[0].world0) continue;
    const pts = f.pts.map((p) => (p.part ? f.parent.worldToLocal(_w.copy(p.world0).applyMatrix4(p.inv0).applyMatrix4(p.part.object.matrixWorld)).clone() : p.local.clone()));
    const key = pts.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`).join(';');
    if (key !== f.key) { f.key = key; buildFlex(f, pts); }
  }
}

const ease = (t) => t * t * (3 - 2 * t);

export function applyExplode(e1, e2) {
  for (const p of parts.values()) {
    const t = ease(p.level === 1 ? e1 : e2);
    p.object.position.copy(p.base).addScaledVector(p.offset, t);
  }
}

export function worldCenter(id, target = new THREE.Vector3()) {
  const p = parts.get(id);
  return target.copy(p.centerLocal).applyMatrix4(p.object.matrixWorld);
}

/** Caja envolvente de varias piezas para unos valores de explosionado dados. */
export function boxFor(ids, scene, e1, e2, cur1, cur2) {
  applyExplode(e1, e2);
  scene.updateMatrixWorld(true);
  // Caja real de las mallas propias de cada pieza, ligeramente contraída hacia su centro
  // (las cajas alineadas a los ejes sobrestiman el volumen de las piezas inclinadas o redondeadas).
  const b = new THREE.Box3();
  const tmp = new THREE.Box3(), pb = new THREE.Box3();
  const c = new THREE.Vector3(), s = new THREE.Vector3();
  for (const id of ids) {
    const p = parts.get(id);
    if (!p) continue;
    pb.makeEmpty();
    ownMeshes(p.object, (m) => {
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      tmp.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); pb.union(tmp);
    });
    if (pb.isEmpty()) continue;
    pb.getCenter(c); pb.getSize(s).multiplyScalar(0.5 * 0.82);
    b.expandByPoint(c.clone().add(s)); b.expandByPoint(c.clone().sub(s));
  }
  applyExplode(cur1, cur2);
  scene.updateMatrixWorld(true);
  return b;
}

const HL = new THREE.Color(0x1d63c9);
const HOVER = new THREE.Color(0x3d7fd6);

export function setHighlight(ids, level) {
  // level: 'sel' | 'hover' | 'off'
  for (const id of ids) {
    const p = parts.get(id);
    if (!p) continue;
    ownMeshes(p.object, (m) => {
      const mat = m.material;
      if (!mat.emissive) return;
      if (level === 'off') {
        mat.emissive.copy(m.userData.baseEmissive || new THREE.Color(0));
        mat.emissiveIntensity = m.userData.baseEmissiveI;
      } else {
        mat.emissive.copy(level === 'sel' ? HL : HOVER);
        mat.emissiveIntensity = level === 'sel' ? 0.32 : 0.16;
      }
    });
  }
}

export function setXray(on) {
  for (const p of parts.values()) {
    if (!p.shell) continue;
    ownMeshes(p.object, (m) => {
      const mat = m.material;
      if (on) {
        mat.transparent = true;
        mat.opacity = Math.min(m.userData.baseOpacity, 0.13);
        mat.depthWrite = false;
      } else {
        mat.transparent = m.userData.baseTransparent;
        mat.opacity = m.userData.baseOpacity;
        mat.depthWrite = m.userData.baseDepthWrite;
      }
      mat.needsUpdate = true;
    });
  }
}

export function setModeVisibility(mode) {
  for (const p of parts.values()) {
    let vis = true;
    if (p.mode === 'equipo') vis = mode === 'equipo';
    if (p.onlyAnalyzer) vis = mode === 'analizador';
    ownMeshes(p.object, (m) => { m.visible = vis; });
  }
}

/** ¿Es visible (y seleccionable) esta malla? */
export function isPickable(m, xray) {
  if (!m.visible) return false;
  const p = partFromObject(m);
  if (!p) return false;
  if (xray && p.shell) return false;
  return true;
}

export function partFromObject(o) {
  while (o) {
    if (o.userData && o.userData.partId) return parts.get(o.userData.partId);
    o = o.parent;
  }
  return null;
}
