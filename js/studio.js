// Entorno de iluminación de estudio fotográfico para los reflejos (PBR).
// Se genera por código: una sala neutra con cajas de luz (softboxes), como en un render de producto.
import * as THREE from 'three';

function panel(scene, w, h, intensity, pos, lookAt = [0, 0, 0]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  m.material.color.setScalar(intensity);
  m.position.set(...pos);
  m.lookAt(...lookAt);
  scene.add(m);
}

/** Devuelve una escena para PMREMGenerator.fromScene(). `light` = tema claro (sala más luminosa). */
export function studioScene(light) {
  const s = new THREE.Scene();
  const wall = light ? 0.55 : 0.16;
  const floor = light ? 0.32 : 0.06;
  const room = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ side: THREE.BackSide }));
  room.material.color.setScalar(wall);
  room.position.y = 6;
  s.add(room);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial());
  fl.material.color.setScalar(floor);
  fl.rotation.x = -Math.PI / 2; fl.position.y = -3.9;
  s.add(fl);
  // softbox cenital grande (luz principal), dos tiras laterales y un contraluz
  panel(s, 14, 9, 7, [0, 15.5, 2], [0, 0, 0]);
  panel(s, 3, 13, 5.5, [-18, 5, 6], [0, 2, 0]);
  panel(s, 3, 13, 4.0, [18, 5, -4], [0, 2, 0]);
  panel(s, 12, 3.5, 3.0, [0, 6, -19], [0, 3, 0]);
  panel(s, 9, 5, 2.2, [6, 3, 19], [0, 2, 0]);
  return s;
}
