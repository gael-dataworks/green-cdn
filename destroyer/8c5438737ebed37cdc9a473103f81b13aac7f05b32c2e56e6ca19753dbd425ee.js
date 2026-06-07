export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Gold: Brightened for no-env render per metal brightness handbook
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe8c84a,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xe8c84a,
    emissiveIntensity: 0.35,
  });

  // Emerald: Gemstone properties
  const emeraldMat = new THREE.MeshPhysicalMaterial({
    color: 0x108a55,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.57,
    transparent: true,
  });

  // --- Sunburst Face ---
  const faceGroup = new THREE.Group();

  // 1. Rays (16 spokes)
  // Using tapered cylinders to simulate the sunburst spikes
  const rayGeom = new THREE.CylinderGeometry(0.025, 0.065, 0.55, 16);
  // Rotate geometry so it lies flat in XZ plane, pointing outward from center
  rayGeom.rotateX(Math.PI / 2);
  // Shift geometry so pivot is at the inner end, not center
  rayGeom.translate(0, 0, 0.275);

  const rayCount = 16;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const ray = new THREE.Mesh(rayGeom, goldMat);
    ray.rotation.y = -angle;
    // Slight random-ish variation in length is forbidden, so we keep them uniform
    // but we can scale slightly for visual interest if needed. Keeping uniform for now.
    faceGroup.add(ray);
  }

  // 2. Center Base Plate (under the stones)
  const centerBaseGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 32);
  const centerBase = new THREE.Mesh(centerBaseGeom, goldMat);
  centerBase.position.y = 0.02; // Sit on top of rays
  faceGroup.add(centerBase);

  // 3. Bezel (Ring around stones)
  const bezelGeom = new THREE.TorusGeometry(0.14, 0.025, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = 0.025;
  faceGroup.add(bezel);

  // 4. Stones
  // Central large stone
  const centerStoneGeom = new THREE.SphereGeometry(0.055, 16, 16);
  const centerStone = new THREE.Mesh(centerStoneGeom, emeraldMat);
  centerStone.position.y = 0.055;
  faceGroup.add(centerStone);

  // Surrounding smaller stones (8 stones)
  const surroundStoneGeom = new THREE.SphereGeometry(0.028, 16, 16);
  const surroundCount = 8;
  const surroundRadius = 0.085;
  for (let i = 0; i < surroundCount; i++) {
    const angle = (i / surroundCount) * Math.PI * 2;
    const x = Math.cos(angle) * surroundRadius;
    const z = Math.sin(angle) * surroundRadius;
    const stone = new THREE.Mesh(surroundStoneGeom, emeraldMat);
    stone.position.set(x, 0.055, z);
    faceGroup.add(stone);
  }

  // Add small gold beads between surround stones (prong tips)
  const beadGeom = new THREE.SphereGeometry(0.015, 8, 8);
  for (let i = 0; i < surroundCount; i++) {
    const angle = (i / surroundCount) * Math.PI * 2;
    const x = Math.cos(angle) * (surroundRadius + 0.01);
    const z = Math.sin(angle) * (surroundRadius + 0.01);
    const bead = new THREE.Mesh(beadGeom, goldMat);
    bead.position.set(x, 0.03, z);
    faceGroup.add(bead);
  }

  root.add(faceGroup);

  // --- Ring Band (Shank) ---
  // Visible on the right side, curving back.
  // We use a TubeGeometry with a custom path to model the shank.
  const shankPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, 0.0, -0.1),   // Start behind right side of face
    new THREE.Vector3(0.25, -0.15, -0.2), // Curve back and down
    new THREE.Vector3(0.20, -0.35, 0.0),  // Bottom of curve
    new THREE.Vector3(0.0, -0.45, 0.1),   // Continue around
    new THREE.Vector3(-0.20, -0.35, 0.0), // Left side bottom
    new THREE.Vector3(-0.25, -0.15, -0.2) // Left side back
  ]);

  const shankGeom = new THREE.TubeGeometry(shankPath, 20, 0.035, 12, false);
  const shank = new THREE.Mesh(shankGeom, goldMat);
  root.add(shank);

  // Add a small connector piece to join shank to face smoothly
  const connectorGeom = new THREE.TorusGeometry(0.16, 0.035, 12, 16, Math.PI);
  const connector = new THREE.Mesh(connectorGeom, goldMat);
  connector.rotation.x = Math.PI / 2;
  connector.rotation.y = Math.PI / 2; // Orient to connect to side
  connector.position.set(0, 0, -0.1);
  // Actually, let's just rely on the tube path starting close enough.
  // To make it cleaner, let's add a small curved segment explicitly connecting face to shank start
  const joinCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.14, 0.02, 0), // Edge of face
    new THREE.Vector3(0.20, -0.05, -0.1),
    new THREE.Vector3(0.15, 0.0, -0.1) // Start of shank path
  );
  const joinGeom = new THREE.TubeGeometry(joinCurve, 10, 0.035, 12, false);
  const join = new THREE.Mesh(joinGeom, goldMat);
  root.add(join);

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