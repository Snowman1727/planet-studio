import * as THREE from 'three';

export function createAssets() {
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color, flatShading: true, roughness: 0.9, ...extra,
  });
  const materials = {
    bark: material(0x50433c), pine: material(0x245c4c), tip: material(0x387e60),
    snow: material(0xeffaf6), wood: material(0x735a4b), roof: material(0xbd5c59),
    window: material(0xf7c36c, { emissive: 0xe9a349, emissiveIntensity: 1.4 }),
    leaf: material(0x59a254), leafTip: material(0x99c76a), rock: material(0x8d9997),
    petals: material(0xe981ac), petalsAlt: material(0xa18cda),
    pollen: material(0xffd46d), mushroom: material(0xe66c59),
    cream: material(0xf3e2c4),
  };
  const parts = [];
  function part(type, geometry, mat, position = [0, 0, 0], scale = [1, 1, 1], snow = false) {
    const local = new THREE.Object3D();
    local.position.fromArray(position);
    local.scale.fromArray(scale);
    local.updateMatrix();
    parts.push({ type, geometry, mat, local: local.matrix.clone(), mesh: null, snow });
  }
  part('tree', new THREE.CylinderGeometry(0.018, 0.025, 0.2, 5), materials.bark, [0, 0.1, 0]);
  for (let i = 0; i < 3; i++) {
    const size = 1 - i * 0.22;
    part('tree', new THREE.ConeGeometry(0.115, 0.24, 6), i === 2 ? materials.tip : materials.pine, [0, 0.21 + i * 0.09, 0], [size, size, size]);
    part('tree', new THREE.ConeGeometry(0.093, 0.185, 6), materials.snow, [0, 0.255 + i * 0.09, 0], [size, size, size], true);
  }
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-0.17, 0);
  roofShape.lineTo(0, 0.15);
  roofShape.lineTo(0.17, 0);
  roofShape.closePath();
  const roof = new THREE.ExtrudeGeometry(roofShape, { depth: 0.29, bevelEnabled: false });
  part('house', new THREE.BoxGeometry(0.29, 0.2, 0.25), materials.wood, [0, 0.1, 0]);
  part('house', roof, materials.roof, [0, 0.2, -0.145]);
  part('house', roof, materials.snow, [0, 0.22, -0.145], [1.02, 0.94, 1], true);
  part('house', new THREE.BoxGeometry(0.06, 0.15, 0.06), materials.bark, [0.09, 0.32, -0.05]);
  part('house', new THREE.BoxGeometry(0.08, 0.02, 0.08), materials.snow, [0.09, 0.4, -0.05], [1, 1, 1], true);
  part('house', new THREE.BoxGeometry(0.06, 0.11, 0.012), materials.bark, [-0.065, 0.055, 0.13]);
  part('house', new THREE.BoxGeometry(0.065, 0.06, 0.015), materials.window, [0.064, 0.13, 0.13]);
  part('house', new THREE.BoxGeometry(0.006, 0.065, 0.018), materials.bark, [0.064, 0.13, 0.14]);
  part('house', new THREE.BoxGeometry(0.07, 0.006, 0.018), materials.bark, [0.064, 0.13, 0.14]);

  part('broadleaf', new THREE.CylinderGeometry(0.024, 0.04, 0.3, 5), materials.bark, [0, 0.15, 0]);
  part('broadleaf', new THREE.IcosahedronGeometry(0.155, 0), materials.leaf, [-0.02, 0.37, 0], [1.05, 1.18, 0.95]);
  part('broadleaf', new THREE.DodecahedronGeometry(0.115, 0), materials.leafTip, [0.075, 0.34, 0.03]);
  part('broadleaf', new THREE.IcosahedronGeometry(0.147, 0), materials.snow, [-0.02, 0.445, 0], [1.03, 0.45, 0.94], true);
  part('broadleaf', new THREE.DodecahedronGeometry(0.11, 0), materials.snow, [0.075, 0.39, 0.03], [1, 0.4, 1], true);

  for (const [i, x, z, h] of [[0, -0.032, 0, 0.1], [1, 0.035, 0.025, 0.075], [2, 0, -0.04, 0.085]]) {
    part('flowers', new THREE.CylinderGeometry(0.0035, 0.0045, h, 4), materials.pine, [x, h / 2, z]);
    part('flowers', new THREE.OctahedronGeometry(0.02), materials.tip, [x + 0.012, h * 0.5, z], [1, 0.25, 0.6]);
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * Math.PI * 2;
      part('flowers', new THREE.IcosahedronGeometry(0.015, 0), i === 1 ? materials.petalsAlt : materials.petals,
        [x + Math.cos(a) * 0.018, h, z + Math.sin(a) * 0.018], [1, 0.38, 1]);
    }
    part('flowers', new THREE.SphereGeometry(0.009, 5, 3), materials.pollen, [x, h + 0.005, z], [1, 0.65, 1]);
  }
  part('rock', new THREE.IcosahedronGeometry(0.13, 0), materials.rock, [0, 0.078, 0], [1.05, 0.75, 0.9]);
  part('rock', new THREE.IcosahedronGeometry(0.12, 0), materials.snow, [0, 0.119, 0], [1.04, 0.35, 0.9], true);

  part('mushroom', new THREE.CylinderGeometry(0.017, 0.025, 0.12, 6), materials.cream, [0, 0.06, 0]);
  part('mushroom', new THREE.CylinderGeometry(0.082, 0.082, 0.013, 8), materials.cream, [0, 0.12, 0]);
  part('mushroom', new THREE.SphereGeometry(0.084, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), materials.mushroom, [0, 0.122, 0], [1, 0.75, 1]);
  for (const [x, z] of [[0.025, 0.025], [-0.035, 0.02], [0.015, -0.04]]) {
    const y = 0.122 + 0.75 * Math.sqrt(0.084 ** 2 - x ** 2 - z ** 2);
    part('mushroom', new THREE.IcosahedronGeometry(0.012, 0), materials.cream, [x, y, z], [1, 0.35, 1]);
  }
  part('mushroom', new THREE.CylinderGeometry(0.009, 0.014, 0.07, 5), materials.cream, [0.068, 0.035, 0.025]);
  part('mushroom', new THREE.SphereGeometry(0.043, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2), materials.mushroom, [0.068, 0.07, 0.025], [1, 0.75, 1]);
  return { parts, materials };
}
