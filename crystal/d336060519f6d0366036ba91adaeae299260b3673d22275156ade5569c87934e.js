export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear plastic for the main body and caps
  const clearPlasticMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Red glossy plastic for the band and handle
  const redPlasticMat = new THREE.MeshStandardMaterial({
    color: 0xd93025,
    metalness: 0.1,
    roughness: 0.3,
  });

  // White pearl-like material for the beads
  const whiteBeadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const containerRadius = 0.30;
  const containerHeight = 0.60;
  const wallThickness = 0.015;
  const innerRadius = containerRadius - wallThickness;
  
  const bandHeight = 0.14;
  const bandY = 0.0; // Centered vertically

  const handleTorusRadius = 0.09;
  const handleTubeRadius = 0.025;
  const handleX = containerRadius + handleTorusRadius - 0.02; // Slightly offset from surface

  const beadRadius = 0.035;

  // --- Container Body (Clear Cylinder) ---
  // We model the main clear volume. The red band will be slightly larger or overlay it.
  // To make it look like a container, we can use a hollow cylinder or just a solid transparent one.
  // A solid transparent cylinder with beads inside works well visually.
  const bodyGeom = new THREE.CylinderGeometry(
    containerRadius, 
    containerRadius, 
    containerHeight, 
    32
  );
  const container_body = new THREE.Mesh(bodyGeom, clearPlasticMat);
  root.add(container_body);

  // --- End Caps (Optional reinforcement for clarity, or just rely on body) ---
  // Let's add thin caps to define the ends clearly
  const capGeom = new THREE.CylinderGeometry(containerRadius, containerRadius, 0.02, 32);
  
  const top_cap = new THREE.Mesh(capGeom, clearPlasticMat);
  top_cap.position.y = containerHeight / 2 + 0.01;
  root.add(top_cap);

  const bottom_cap = new THREE.Mesh(capGeom, clearPlasticMat);
  bottom_cap.position.y = -containerHeight / 2 - 0.01;
  root.add(bottom_cap);

  // --- Red Band ---
  // A cylinder segment around the middle
  const bandGeom = new THREE.CylinderGeometry(
    containerRadius + 0.005, // Slightly larger than body to sit on outside
    containerRadius + 0.005, 
    bandHeight, 
    32
  );
  const red_band = new THREE.Mesh(bandGeom, redPlasticMat);
  red_band.position.y = bandY;
  root.add(red_band);

  // --- Handle ---
  // A torus attached to the side of the red band
  // Torus is in XY plane by default. We want it in YZ plane (vertical loop) or XZ?
  // Looking at image, handle is on the side, loop goes up/down.
  // Default Torus is XY. Rotate Z by 90 deg -> YZ plane.
  const handleGeom = new THREE.TorusGeometry(
    handleTorusRadius, 
    handleTubeRadius, 
    16, 
    32, 
    Math.PI * 1.6 // Almost a full circle, leaving a gap for attachment if needed, but let's make it a loop
  );
  // Actually, let's make it a partial torus or just a full torus intersecting the band.
  // A full torus intersecting looks like a handle.
  const handle_full = new THREE.TorusGeometry(handleTorusRadius, handleTubeRadius, 16, 32);
  const handle = new THREE.Mesh(handle_full, redPlasticMat);
  handle.position.set(containerRadius, 0, 0); // On the side
  handle.rotation.z = Math.PI / 2; // Stand it up vertically
  // Shift it so it attaches to the band
  handle.position.x = containerRadius + handleTorusRadius * 0.2; 
  root.add(handle);

  // --- Beads (White Spheres) ---
  // Deterministic placement using a simple LCG
  const beadGeom = new THREE.SphereGeometry(beadRadius, 16, 16);
  
  // LCG parameters
  let seed = 12345;
  function nextRandom() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  const beadCount = 80;
  const safeInnerRadius = innerRadius - beadRadius - 0.01;
  const safeHalfHeight = containerHeight / 2 - beadRadius - 0.02;

  for (let i = 0; i < beadCount; i++) {
    // Generate random position within cylinder bounds
    // Use rejection sampling or cylindrical coordinates
    const angle = nextRandom() * Math.PI * 2;
    const r = Math.sqrt(nextRandom()) * safeInnerRadius; // Uniform in circle
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = (nextRandom() * 2 - 1) * safeHalfHeight;

    const bead = new THREE.Mesh(beadGeom, whiteBeadMat);
    bead.position.set(x, y, z);
    // Add a tiny random rotation for variety (deterministic)
    bead.rotation.set(nextRandom() * Math.PI, nextRandom() * Math.PI, 0);
    root.add(bead);
  }

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