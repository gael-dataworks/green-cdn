export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear bottle material (plastic/glass)
  const bottleMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Orange juice liquid material
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffaa00,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.33,
    transparent: true,
    opacity: 0.9,
  });

  // Green cap material (plastic)
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2e8b57,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Gold ring material (metallic foil)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Geometries & Meshes ---

  // 1. Bottle Body (Outer Shell)
  // Profile points [radius, y]
  const bottleProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.28, 0.0),   // Bottom edge
    new THREE.Vector2(0.31, 0.12),  // Curve out
    new THREE.Vector2(0.34, 0.35),  // Max width
    new THREE.Vector2(0.31, 0.60),  // Taper in
    new THREE.Vector2(0.24, 0.80),  // Neck start
    new THREE.Vector2(0.24, 0.88),  // Neck top
    new THREE.Vector2(0.26, 0.90),  // Lip flare
    new THREE.Vector2(0.0, 0.90),   // Top center
  ];
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, bottleMat);
  root.add(bottle);

  // 2. Liquid (Inner Volume)
  // Slightly smaller profile to sit inside the glass
  const liquidProfile = [
    new THREE.Vector2(0.0, 0.02),
    new THREE.Vector2(0.26, 0.02),  // Bottom edge inset
    new THREE.Vector2(0.29, 0.12),  // Curve inset
    new THREE.Vector2(0.32, 0.35),  // Max width inset
    new THREE.Vector2(0.29, 0.60),  // Taper inset
    new THREE.Vector2(0.22, 0.80),  // Neck inset
    new THREE.Vector2(0.22, 0.84),  // Liquid surface level
    new THREE.Vector2(0.0, 0.84),   // Center of surface
  ];
  const liquidGeom = new THREE.LatheGeometry(liquidProfile, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  root.add(liquid);

  // 3. Cap Group
  const capGroup = new THREE.Group();
  
  // Cap Body
  const capGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.06, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 0.93; // Sit on top of lip
  capGroup.add(cap);

  // Cap Top Detail (slightly wider ridge for grip visual)
  const capTopGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.02, 32);
  const capTop = new THREE.Mesh(capTopGeom, capMat);
  capTop.position.y = 0.95;
  capGroup.add(capTop);

  // 4. Security Ring (Gold band below cap)
  const ringGeom = new THREE.CylinderGeometry(0.23, 0.23, 0.015, 32);
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.y = 0.90; // Just below the lip/cap interface
  capGroup.add(ring);

  root.add(capGroup);

  // --- Normalization ---
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