export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark green caps: matte/satin plastic or painted wood
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3e,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Glass: Transparent, slight green tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.92,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
    thickness: 0.5,
  });

  // Sand: Dark green granular
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3e,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometries ---

  // 1. Caps (Top and Bottom)
  // Profile: Flat bottom, vertical outer wall, rounded top edge, inner lip
  const capProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.24, 0.00),
    new THREE.Vector2(0.24, 0.05),
    new THREE.Vector2(0.22, 0.09), // rounded edge
    new THREE.Vector2(0.18, 0.09), // top of lip
    new THREE.Vector2(0.18, 0.00), // inner wall down
    new THREE.Vector2(0.00, 0.00),
  ];
  const capGeom = new THREE.LatheGeometry(capProfile, 32);

  const topCap = new THREE.Mesh(capGeom, capMat);
  topCap.position.y = 0.45;
  root.add(topCap);

  const bottomCap = new THREE.Mesh(capGeom, capMat);
  bottomCap.position.y = -0.45;
  bottomCap.rotation.x = Math.PI; // Flip upside down
  root.add(bottomCap);

  // 2. Glass Body
  // Profile connects the inner lips of the caps (radius 0.18)
  // Bulges out to ~0.23, narrows to neck ~0.02
  const glassProfile = [
    new THREE.Vector2(0.18, 0.40), // Top connection
    new THREE.Vector2(0.23, 0.20), // Upper bulb max
    new THREE.Vector2(0.02, 0.00), // Neck
    new THREE.Vector2(0.23, -0.20), // Lower bulb max
    new THREE.Vector2(0.18, -0.40), // Bottom connection
  ];
  // Use a curve for smoother glass profile
  const glassCurve = new THREE.CatmullRomCurve3(
    glassProfile.map((p) => new THREE.Vector3(p.x, p.y, 0))
  );
  const glassPoints = glassCurve.getSpacedPoints(50).map((p) => new THREE.Vector2(p.x, p.y));
  const glassGeom = new THREE.LatheGeometry(glassPoints, 32);

  const glassBody = new THREE.Mesh(glassGeom, glassMat);
  root.add(glassBody);

  // 3. Sand
  // Bottom Pile: Cone
  const sandBottomGeom = new THREE.ConeGeometry(0.20, 0.35, 32);
  const sandBottom = new THREE.Mesh(sandBottomGeom, sandMat);
  sandBottom.position.y = -0.35; // Sit on bottom
  root.add(sandBottom);

  // Top Sand: Inverted funnel shape draining into neck
  // We can approximate this with a cone that is scaled or a custom lathe
  // Let's use a cone scaled to fit the upper bulb
  const sandTopGeom = new THREE.ConeGeometry(0.20, 0.35, 32);
  const sandTop = new THREE.Mesh(sandTopGeom, sandMat);
  sandTop.position.y = 0.25; // Hang from top
  sandTop.rotation.x = Math.PI; // Point down
  root.add(sandTop);

  // Falling Stream: Thin cylinder
  const streamGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.30, 8);
  const sandStream = new THREE.Mesh(streamGeom, sandMat);
  sandStream.position.y = 0.0;
  root.add(sandStream);

  // 4. Floating Particles (Optional detail for falling sand)
  // Create a few small spheres along the stream path
  const particleGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const particlePositions = [0.1, 0.0, -0.1];
  for (const py of particlePositions) {
    const p = new THREE.Mesh(particleGeom, sandMat);
    p.position.set(0.01, py, 0); // Slight offset to be visible against stream
    root.add(p);
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