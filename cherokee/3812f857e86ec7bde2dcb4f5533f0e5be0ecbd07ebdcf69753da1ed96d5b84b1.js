export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Iridescent Sphere Material
  // Uses MeshPhysicalMaterial for thin-film interference (rainbow effect).
  // Metalness capped at 0.6 to avoid blackness without envMap.
  // Low roughness for sharp reflections.
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaaaaa,
    metalness: 0.6,
    roughness: 0.05,
    iridescence: 1.0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 400],
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });

  // Silver Cap Material
  // Polished metal look.
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometries & Meshes ---

  // 1. Sphere Body
  const sphereGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  root.add(sphere);

  // 2. Cap Assembly
  const capGroup = new THREE.Group();

  // Main faceted body of the cap
  // 16 segments gives a slight faceting similar to the reference's vertical panels
  const capBodyGeom = new THREE.CylinderGeometry(0.11, 0.13, 0.12, 16);
  const capBody = new THREE.Mesh(capBodyGeom, capMat);
  capBody.position.y = 0.06;
  capGroup.add(capBody);

  // Top rim of the cap
  const capTopGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.02, 16);
  const capTop = new THREE.Mesh(capTopGeom, capMat);
  capTop.position.y = 0.13;
  capGroup.add(capTop);

  // Bottom collar (where cap meets sphere)
  const capCollarGeom = new THREE.TorusGeometry(0.13, 0.015, 16, 32);
  const capCollar = new THREE.Mesh(capCollarGeom, capMat);
  capCollar.rotation.x = Math.PI / 2;
  capCollar.position.y = 0.0;
  capGroup.add(capCollar);

  capGroup.position.y = 0.5;
  root.add(capGroup);

  // 3. Hanging Loop
  // Thin wire loop standing vertically in the XY plane
  const loopGeom = new THREE.TorusGeometry(0.06, 0.004, 16, 32);
  const loop = new THREE.Mesh(loopGeom, capMat);
  loop.position.y = 0.5 + 0.14 + 0.06;
  root.add(loop);

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