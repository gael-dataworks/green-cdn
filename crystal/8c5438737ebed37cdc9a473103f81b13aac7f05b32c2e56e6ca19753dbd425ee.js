export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Cap metalness at 0.6 for no-env-map safety.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Emerald: Green gem. Use Physical for transmission/glass look.
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x006633,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.57,
    transparent: true,
  });

  // --- Dimensions ---
  const RAY_COUNT = 16;
  const RAY_LENGTH = 0.38;
  const RAY_BASE_RADIUS = 0.045;
  const RAY_TIP_RADIUS = 0.012;
  const CENTER_DISK_RADIUS = 0.11;
  const GEM_RING_RADIUS = 0.055;
  const GEM_COUNT = 8;

  // --- Geometries ---
  // Reuse geometries for instancing-like efficiency (manual looping here for transform control)
  const rayGeom = new THREE.CylinderGeometry(
    RAY_TIP_RADIUS,
    RAY_BASE_RADIUS,
    RAY_LENGTH,
    8 // Low poly for stylized look
  );
  // Shift geometry so pivot is at the base, not center
  // Cylinder is centered at 0. We want base at 0, tip at +length.
  // So translate Y by +length/2.
  rayGeom.translate(0, RAY_LENGTH / 2, 0);

  const centerDiskGeom = new THREE.CylinderGeometry(
    CENTER_DISK_RADIUS,
    CENTER_DISK_RADIUS,
    0.04,
    32
  );

  const centerGemGeom = new THREE.IcosahedronGeometry(0.035, 0);
  const smallGemGeom = new THREE.IcosahedronGeometry(0.014, 0);

  const pinGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.25, 8);
  pinGeom.rotateZ(Math.PI / 2); // Lie flat along X
  pinGeom.translate(0, 0, -0.06); // Push back

  // --- Rays ---
  // Fan out in XY plane.
  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    const ray = new THREE.Mesh(rayGeom, goldMat);
    // Rotate around Z to fan out.
    // The rayGeom is Y-up (pointing +Y).
    // We want it to point radially in XY plane.
    // Rotate Z by -90 deg makes Y point to +X.
    // Then rotate Z by `angle` distributes them.
    ray.rotation.z = angle - Math.PI / 2;
    root.add(ray);
  }

  // --- Center Disk ---
  const centerDisk = new THREE.Mesh(centerDiskGeom, goldMat);
  // Place slightly in front of ray bases to cover seams
  centerDisk.position.z = 0.01;
  root.add(centerDisk);

  // --- Center Gem ---
  const centerGem = new THREE.Mesh(centerGemGeom, emeraldMat);
  centerGem.position.z = 0.03; // Sit on top of disk
  root.add(centerGem);

  // --- Surrounding Gems ---
  for (let i = 0; i < GEM_COUNT; i++) {
    const angle = (i / GEM_COUNT) * Math.PI * 2;
    const x = Math.cos(angle) * GEM_RING_RADIUS;
    const y = Math.sin(angle) * GEM_RING_RADIUS;
    const gem = new THREE.Mesh(smallGemGeom, emeraldMat);
    gem.position.set(x, y, 0.03);
    // Orient gem flat to camera? Icosahedron is symmetric enough,
    // but let's rotate Z to align facets nicely if needed.
    gem.rotation.z = -angle; 
    root.add(gem);
  }

  // --- Pin (Back) ---
  // Simple bar to suggest functionality
  const pin = new THREE.Mesh(pinGeom, goldMat);
  // Pin usually runs horizontally or vertically. Let's do horizontal.
  // Already rotated in geom.
  // Add a small clasp hint
  const claspGeom = new THREE.BoxGeometry(0.04, 0.01, 0.01);
  const clasp = new THREE.Mesh(claspGeom, goldMat);
  clasp.position.set(0.12, 0, -0.06);
  root.add(clasp);
  
  root.add(pin);

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