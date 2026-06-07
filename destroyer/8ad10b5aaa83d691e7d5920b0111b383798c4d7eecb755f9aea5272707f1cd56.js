export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ivory/Cream band: Non-metal, satin finish.
  const ivoryMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Silver setting: Metal, polished but not mirror (capped metalness).
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Purple Gemstone: Physical material for transmission/glass look.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x7356c2,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
  });

  // --- Band ---
  // TorusGeometry lies in XY plane by default.
  // radius: 0.35, tube: 0.06
  const bandGeom = new THREE.TorusGeometry(0.35, 0.06, 16, 32);
  const band = new THREE.Mesh(bandGeom, ivoryMat);
  root.add(band);

  // --- Setting & Stone ---
  // Position on the outer edge of the torus along the +X axis.
  // Torus center is 0,0,0. Outer edge X = radius + tube = 0.35 + 0.06 = 0.41.
  const settingX = 0.35 + 0.06;

  // Silver backing/bezel
  const settingGeom = new THREE.BoxGeometry(0.055, 0.055, 0.025);
  const setting = new THREE.Mesh(settingGeom, silverMat);
  setting.position.set(settingX, 0, 0);
  root.add(setting);

  // Purple Gemstone (Square/Cushion cut approximation)
  // Slightly smaller than setting, pushed forward in +X.
  const gemGeom = new THREE.BoxGeometry(0.045, 0.045, 0.035);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  gem.position.set(settingX + 0.02, 0, 0);
  root.add(gem);

  // Optional: Tiny prongs at corners of the stone to secure it visually
  const prongGeom = new THREE.BoxGeometry(0.01, 0.01, 0.01);
  const prongPositions = [
    [0.025, 0.025, 0],
    [0.025, -0.025, 0],
    [-0.025, 0.025, 0],
    [-0.025, -0.025, 0],
  ];
  
  for (const [px, py, pz] of prongPositions) {
    const prong = new THREE.Mesh(prongGeom, silverMat);
    // Position relative to gem center, then offset to world
    prong.position.set(settingX + 0.02 + px, py, pz);
    // Push prongs slightly forward to overlap stone edge
    prong.position.x += 0.015; 
    root.add(prong);
  }

  fitToUnitCube(THREE, root);
  return root;
}

function fitToUnitCube(THREE, root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = 0.95 / maxDim;
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
}