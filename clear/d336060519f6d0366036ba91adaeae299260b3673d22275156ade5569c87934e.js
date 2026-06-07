export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Clear plastic body (transmission for glass-like effect)
  const clearMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Red matte plastic band and handle
  const redMat = new THREE.MeshStandardMaterial({
    color: 0xd93025,
    metalness: 0.1,
    roughness: 0.4,
  });

  // White glossy balls
  const ballMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const containerRadius = 0.42;
  const containerHeight = 0.75;
  const bandHeight = 0.28;
  const ballRadius = 0.065;
  const ballCount = 85;

  // --- Clear Body (Main Vessel) ---
  // Slightly larger radius to encompass the balls visually, 
  // but the red band sits on top of this or is same radius.
  // Let's make the clear body the outer shell.
  const bodyGeom = new THREE.CylinderGeometry(
    containerRadius, 
    containerRadius, 
    containerHeight, 
    32, 
    1, 
    true // openEnded false by default, but we want caps.
  );
  // Cap the ends visually if needed, CylinderGeometry does this.
  const body = new THREE.Mesh(bodyGeom, clearMat);
  root.add(body);

  // --- Red Band (Grip) ---
  // Slightly larger radius to sit on outside, or same radius. 
  // Let's make it slightly larger to be a distinct sleeve.
  const bandRadius = containerRadius + 0.015;
  const bandGeom = new THREE.CylinderGeometry(
    bandRadius, 
    bandRadius, 
    bandHeight, 
    32
  );
  const band = new THREE.Mesh(bandGeom, redMat);
  band.position.y = 0; // Centered
  root.add(band);

  // --- Handle ---
  // A torus segment or full torus attached to the band.
  // Image shows a loop handle.
  const handleTorusRadius = 0.11;
  const handleTubeRadius = 0.035;
  const handleGeom = new THREE.TorusGeometry(
    handleTorusRadius, 
    handleTubeRadius, 
    16, 
    32, 
    Math.PI * 1.8 // Almost a full circle, leaving a gap for attachment
  );
  const handle = new THREE.Mesh(handleGeom, redMat);
  // Position on the side of the band
  handle.position.set(bandRadius + handleTorusRadius * 0.2, 0, 0);
  // Rotate to stand vertically relative to the cylinder side
  handle.rotation.z = Math.PI / 2;
  handle.rotation.y = Math.PI / 2; // Face outward
  root.add(handle);

  // Handle connection stubs (to make it look attached to the band)
  const stubGeom = new THREE.CylinderGeometry(handleTubeRadius, handleTubeRadius, 0.04, 16);
  const stub1 = new THREE.Mesh(stubGeom, redMat);
  stub1.position.set(bandRadius, handleTorusRadius * 0.8, 0);
  stub1.rotation.z = Math.PI / 2;
  root.add(stub1);

  const stub2 = new THREE.Mesh(stubGeom, redMat);
  stub2.position.set(bandRadius, -handleTorusRadius * 0.8, 0);
  stub2.rotation.z = Math.PI / 2;
  root.add(stub2);


  // --- White Balls (Contents) ---
  // Use InstancedMesh for performance and deterministic placement
  const ballsGeom = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballsMesh = new THREE.InstancedMesh(ballsGeom, ballMat, ballCount);
  
  const dummy = new THREE.Object3D();
  const maxBallRadius = containerRadius - ballRadius - 0.02; // Keep inside walls
  const maxBallHeight = (containerHeight / 2) - ballRadius - 0.02;

  for (let i = 0; i < ballCount; i++) {
    // Deterministic pseudo-random placement using sine/cosine
    // Spiral distribution + vertical layers
    const angle = i * 2.4; // Golden angle approx
    const layer = Math.floor(i / 12);
    const radiusFactor = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.5));
    const r = radiusFactor * maxBallRadius;
    const y = (i % 12) * 0.14 - maxBallHeight; // Staggered vertical
    
    // Add some noise based on index to avoid perfect grid
    const noiseX = Math.sin(i * 13.5) * 0.02;
    const noiseY = Math.cos(i * 7.2) * 0.02;
    const noiseZ = Math.sin(i * 9.1) * 0.02;

    dummy.position.set(
      Math.cos(angle) * r + noiseX,
      y + noiseY,
      Math.sin(angle) * r + noiseZ
    );
    
    // Random rotation for variety (deterministic)
    dummy.rotation.set(
      Math.sin(i) * 0.5,
      Math.cos(i) * 0.5,
      Math.sin(i * 0.5) * 0.5
    );
    
    dummy.scale.setScalar(0.9 + Math.abs(Math.sin(i * 3)) * 0.2); // Slight size variation

    dummy.updateMatrix();
    ballsMesh.setMatrixAt(i, dummy.matrix);
  }
  
  root.add(ballsMesh);

  // --- End Caps (Optional visual reinforcement for clear plastic) ---
  // Sometimes clear cylinders need explicit caps to render thickness well
  const capGeom = new THREE.CylinderGeometry(containerRadius, containerRadius, 0.02, 32);
  const topCap = new THREE.Mesh(capGeom, clearMat);
  topCap.position.y = containerHeight / 2;
  root.add(topCap);
  
  const bottomCap = new THREE.Mesh(capGeom, clearMat);
  bottomCap.position.y = -containerHeight / 2;
  root.add(bottomCap);

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