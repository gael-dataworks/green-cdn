export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Polished metal. Using emissive to ensure brightness in no-env-map render.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE8C84A,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xE8C84A,
    emissiveIntensity: 0.35,
  });

  // Emerald/Green Gem: Physical material for transmission/gloss.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x008f45,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.6,
    transparent: true,
  });

  // --- Constants ---
  const RAY_COUNT = 18;
  const RAY_LENGTH = 0.38;
  const RAY_TIP_RADIUS = 0.018;
  const RAY_BASE_RADIUS = 0.055;
  const CENTER_CLUSTER_RADIUS = 0.09;

  // --- Rays (Sunburst Spikes) ---
  // Using InstancedMesh for the 18 identical rays.
  const rayGeom = new THREE.CylinderGeometry(
    RAY_TIP_RADIUS, 
    RAY_BASE_RADIUS, 
    RAY_LENGTH, 
    8 // Low poly count for faceted look
  );
  // Shift geometry so pivot is at the base (center of brooch), not center of cylinder.
  // Cylinder is centered at 0,0,0 by default. We want the wide end at the center.
  // The cylinder goes from -h/2 to +h/2. We want -h/2 to be at the brooch center.
  // So we translate the geometry up by h/2.
  rayGeom.translate(0, 0, RAY_LENGTH / 2);

  const rays = new THREE.InstancedMesh(rayGeom, goldMat, RAY_COUNT);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    // Position: The base is at (0,0,0). The ray points outward.
    // Since we translated geometry so base is at origin, we just rotate.
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, angle);
    dummy.updateMatrix();
    rays.setMatrixAt(i, dummy.matrix);
  }
  root.add(rays);

  // --- Center Medallion ---
  
  // Base plate behind the stones
  const centerBaseGeom = new THREE.CylinderGeometry(0.085, 0.085, 0.04, 32);
  const centerBase = new THREE.Mesh(centerBaseGeom, goldMat);
  centerBase.position.z = -0.02; // Slightly behind the main plane
  root.add(centerBase);

  // Bezel Rim (Torus) holding the outer stones
  const bezelRimGeom = new THREE.TorusGeometry(0.065, 0.018, 16, 32);
  const bezelRim = new THREE.Mesh(bezelRimGeom, goldMat);
  bezelRim.rotation.x = Math.PI / 2; // Lay flat in XY
  root.add(bezelRim);

  // Inner Bezel for center stone
  const innerBezelGeom = new THREE.TorusGeometry(0.045, 0.012, 16, 32);
  const innerBezel = new THREE.Mesh(innerBezelGeom, goldMat);
  innerBezel.rotation.x = Math.PI / 2;
  root.add(innerBezel);

  // --- Stones ---

  // Center Stone (Large)
  const centerStoneGeom = new THREE.OctahedronGeometry(0.035, 0);
  const centerStone = new THREE.Mesh(centerStoneGeom, gemMat);
  centerStone.position.z = 0.02;
  root.add(centerStone);

  // Outer Stones (8 smaller ones)
  const outerStoneCount = 8;
  const outerStoneRadius = 0.065; // Distance from center
  const outerStoneGeom = new THREE.OctahedronGeometry(0.018, 0);
  
  for (let i = 0; i < outerStoneCount; i++) {
    const angle = (i / outerStoneCount) * Math.PI * 2;
    const x = Math.cos(angle) * outerStoneRadius;
    const y = Math.sin(angle) * outerStoneRadius;
    
    const stone = new THREE.Mesh(outerStoneGeom, gemMat);
    stone.position.set(x, y, 0.02);
    // Rotate stone to face outward/up slightly? No, flat is fine for this style.
    root.add(stone);
  }

  // --- Pin Stem (Backing) ---
  // Visible on the right side in reference. A simple curved tube.
  const pinPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, 0.12, -0.05),
    new THREE.Vector3(0.05, -0.12, -0.05),
  ]);
  const pinGeom = new THREE.TubeGeometry(pinPath, 8, 0.012, 8, false);
  const pinStem = new THREE.Mesh(pinGeom, goldMat);
  root.add(pinStem);

  // Pin Clasp (C-shape at bottom of stem)
  const claspGeom = new THREE.TorusGeometry(0.015, 0.006, 8, 16, Math.PI);
  const clasp = new THREE.Mesh(claspGeom, goldMat);
  clasp.position.set(0.05, -0.12, -0.05);
  clasp.rotation.x = Math.PI / 2;
  clasp.rotation.y = Math.PI; 
  root.add(clasp);

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