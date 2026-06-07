export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear container material (transmission for glass/plastic look)
  const containerMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Red band and handle material (plastic)
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xe33636,
    metalness: 0.1,
    roughness: 0.4,
  });

  // White balls material (pearlescent plastic)
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const containerRadius = 0.30;
  const containerHeight = 0.60;
  const bandRadius = 0.315; // Slightly larger than container
  const bandHeight = 0.20;
  const ballRadius = 0.035;

  // --- Container Body (Transparent Cylinder) ---
  const containerGeom = new THREE.CylinderGeometry(
    containerRadius,
    containerRadius,
    containerHeight,
    32
  );
  const container = new THREE.Mesh(containerGeom, containerMat);
  root.add(container);

  // --- Red Band (Sleeve) ---
  const bandGeom = new THREE.CylinderGeometry(
    bandRadius,
    bandRadius,
    bandHeight,
    32
  );
  const redBand = new THREE.Mesh(bandGeom, redMat);
  root.add(redBand);

  // --- Handle (Tube Geometry) ---
  // Create a handle shape attached to the side of the red band
  // Path: Start on band surface, curve out, go up, curve back in
  const handlePoints = [
    new THREE.Vector3(0, -0.08, bandRadius),       // Bottom attach
    new THREE.Vector3(0, -0.08, bandRadius + 0.12), // Bottom out
    new THREE.Vector3(0, 0.08, bandRadius + 0.12),  // Top out
    new THREE.Vector3(0, 0.08, bandRadius),         // Top attach
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 8, false);
  const handle = new THREE.Mesh(handleGeom, redMat);
  root.add(handle);

  // --- Balls (InstancedMesh) ---
  // Fill the container with white balls
  const ballGeom = new THREE.SphereGeometry(ballRadius, 16, 16);
  // Estimate count: Volume of cylinder / Volume of ball * packing factor
  // V_cyl = pi * r^2 * h = 3.14 * 0.09 * 0.6 = 0.17
  // V_ball = 4/3 * pi * r^3 = 1.33 * 3.14 * 0.00004 = 0.00017
  // Count ~ 1000? Too many. Let's aim for ~150 visible balls.
  const ballCount = 150;
  const balls = new THREE.InstancedMesh(ballGeom, ballMat, ballCount);

  const dummy = new THREE.Object3D();
  let index = 0;

  // Deterministic distribution: Layers of circles
  const layers = 12;
  const layerHeight = containerHeight / layers;
  
  for (let i = 0; i < layers; i++) {
    const y = -containerHeight / 2 + layerHeight / 2 + i * layerHeight;
    // Vary radius per layer to simulate packing
    const layerRadius = containerRadius - ballRadius - 0.01;
    // Number of balls in this layer
    const countInLayer = Math.floor(2 * Math.PI * layerRadius / (ballRadius * 2.2));
    
    for (let j = 0; j < countInLayer; j++) {
      if (index >= ballCount) break;
      
      const angle = (j / countInLayer) * Math.PI * 2;
      // Add a small deterministic offset based on layer index to break perfect symmetry
      const offsetAngle = angle + (i % 2) * (Math.PI / countInLayer);
      
      const x = Math.cos(offsetAngle) * layerRadius;
      const z = Math.sin(offsetAngle) * layerRadius;
      
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      balls.setMatrixAt(index, dummy.matrix);
      index++;
    }
  }
  
  // Fill remaining with random-ish positions if needed, but deterministic
  // Just fill center column for remaining
  while (index < ballCount) {
    const y = -containerHeight / 2 + ballRadius + (index % 10) * (containerHeight / 10);
    const r = (index % 3) * 0.05;
    const angle = (index * 137.5) * (Math.PI / 180); // Golden angle approx
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    balls.setMatrixAt(index, dummy.matrix);
    index++;
  }

  root.add(balls);

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