export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark painted metal (base, top, cage, handle)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.4,
  });

  // Glowing frosted glass globe
  const globeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
    emissive: 0xaaccff,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const baseR = 0.18;
  const baseH = 0.14;
  const globeH = 0.42;
  const globeTopR = 0.14;
  const globeMidR = 0.19;
  const topCapH = 0.12;
  const totalH = baseH + globeH + topCapH;
  
  // --- Base (Fuel Fount) ---
  // Main cylindrical tank
  const baseGeom = new THREE.CylinderGeometry(baseR, baseR * 0.95, baseH, 32);
  const base = new THREE.Mesh(baseGeom, metalMat);
  base.position.y = baseH / 2;
  root.add(base);

  // Filler cap (small cylinder on the side)
  const capGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
  const fillerCap = new THREE.Mesh(capGeom, metalMat);
  fillerCap.rotation.x = Math.PI / 2;
  fillerCap.position.set(baseR * 0.6, baseH * 0.6, baseR * 0.8);
  root.add(fillerCap);

  // Base rim detail (slightly wider ring at very bottom)
  const rimGeom = new THREE.TorusGeometry(baseR + 0.01, 0.015, 8, 32);
  const baseRim = new THREE.Mesh(rimGeom, metalMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.01;
  root.add(baseRim);

  // --- Globe (Chimney) ---
  // Lathe profile for the curved glass shape
  const profilePoints = [
    new THREE.Vector2(0.14, 0),          // Bottom inner
    new THREE.Vector2(0.19, 0.05),       // Bottom flare
    new THREE.Vector2(0.19, globeH - 0.08), // Top straight section
    new THREE.Vector2(0.14, globeH),     // Top taper
    new THREE.Vector2(0.0, globeH),      // Close top
  ];
  const globeGeom = new THREE.LatheGeometry(profilePoints, 32);
  const globe = new THREE.Mesh(globeGeom, globeMat);
  globe.position.y = baseH + globeH / 2;
  root.add(globe);

  // --- Top Cap (Burner Housing) ---
  // Inverted frustum/cylinder shape
  const topCapGeom = new THREE.CylinderGeometry(globeTopR + 0.02, globeTopR + 0.04, topCapH, 32);
  const topCap = new THREE.Mesh(topCapGeom, metalMat);
  topCap.position.y = baseH + globeH + topCapH / 2;
  root.add(topCap);

  // Vent knob on top
  const knobGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
  const ventKnob = new THREE.Mesh(knobGeom, metalMat);
  ventKnob.position.y = baseH + globeH + topCapH + 0.015;
  root.add(ventKnob);

  // --- Cage / Wire Guard ---
  // 4 Vertical struts connecting base area to top cap area
  const strutHeight = globeH + topCapH * 0.5;
  const strutGeom = new THREE.CylinderGeometry(0.008, 0.008, strutHeight, 8);
  
  const strutPositions = [
    { x: baseR + 0.02, z: 0 },
    { x: -(baseR + 0.02), z: 0 },
    { x: 0, z: baseR + 0.02 },
    { x: 0, z: -(baseR + 0.02) },
  ];

  strutPositions.forEach(pos => {
    const strut = new THREE.Mesh(strutGeom, metalMat);
    // Position at midpoint of the strut span
    strut.position.set(pos.x, baseH + strutHeight / 2 - topCapH * 0.25, pos.z);
    root.add(strut);
  });

  // Horizontal wire loops (top and bottom of cage)
  const bottomWireR = baseR + 0.02;
  const bottomWireGeom = new THREE.TorusGeometry(bottomWireR, 0.006, 8, 32);
  const bottomWire = new THREE.Mesh(bottomWireGeom, metalMat);
  bottomWire.rotation.x = Math.PI / 2;
  bottomWire.position.y = baseH + 0.02;
  root.add(bottomWire);

  const topWireR = globeTopR + 0.02;
  const topWireGeom = new THREE.TorusGeometry(topWireR, 0.006, 8, 32);
  const topWire = new THREE.Mesh(topWireGeom, metalMat);
  topWire.rotation.x = Math.PI / 2;
  topWire.position.y = baseH + globeH + topCapH * 0.5;
  root.add(topWire);

  // --- Handle (Bail) ---
  // Semi-torus arching over the top
  // Torus is in XY plane by default. We need it in YZ or XZ plane standing up.
  // Let's use a Tube with a curve for better control, or a rotated Torus.
  // Rotated Torus: Default is XY. Rotate Z by 90 deg -> YZ plane.
  const handleR = 0.22;
  const handleTube = 0.012;
  const handleGeom = new THREE.TorusGeometry(handleR, handleTube, 8, 32, Math.PI);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  // Rotate to stand up (arch over Z axis)
  handle.rotation.z = Math.PI / 2; 
  handle.rotation.y = Math.PI / 2; // Align with lantern orientation
  // Position at top center
  handle.position.y = baseH + globeH + topCapH + handleR - 0.02;
  root.add(handle);

  // Handle attachment points (small loops on the cage)
  const attachLoopGeom = new THREE.TorusGeometry(0.015, 0.004, 8, 16);
  const attachLeft = new THREE.Mesh(attachLoopGeom, metalMat);
  attachLeft.rotation.y = Math.PI / 2;
  attachLeft.position.set(-(baseR + 0.02), baseH + globeH + topCapH * 0.5, 0);
  root.add(attachLeft);

  const attachRight = new THREE.Mesh(attachLoopGeom, metalMat);
  attachRight.rotation.y = Math.PI / 2;
  attachRight.position.set((baseR + 0.02), baseH + globeH + topCapH * 0.5, 0);
  root.add(attachRight);

  // Normalize to fit unit cube
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