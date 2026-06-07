export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Black glossy paint (capped metalness at 0.6 per rules)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Tinted glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    ior: 1.5,
  });

  // Chrome trim
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.1,
  });

  // Rubber tires
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Silver rims
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Red taillight
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0x880000,
    emissive: 0x440000,
    emissiveIntensity: 0.5,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Clear headlight
  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.2,
    metalness: 0.0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.9,
  });

  // --- Dimensions ---
  const L = 2.2; // Length
  const W = 0.85; // Width
  const H = 0.65; // Height
  const wheelR = 0.16;
  const wheelW = 0.11;
  const axleY = wheelR;
  const axleZFront = L * 0.35;
  const axleZRear = -L * 0.35;

  // --- 1. Main Body (Extruded Side Profile) ---
  // Define side silhouette in XY plane (X=Length, Y=Height)
  const bodyShape = new THREE.Shape();
  // Start rear bottom
  bodyShape.moveTo(-L / 2, 0.05);
  // Rear bumper up
  bodyShape.lineTo(-L / 2, 0.25);
  // Trunk slope
  bodyShape.lineTo(-L * 0.3, 0.45);
  // Roof (coupe slope)
  bodyShape.quadraticCurveTo(-L * 0.1, 0.55, 0, 0.58);
  bodyShape.quadraticCurveTo(L * 0.15, 0.55, L * 0.35, 0.42);
  // Hood slope
  bodyShape.lineTo(L / 2, 0.28);
  // Front bumper down
  bodyShape.lineTo(L / 2, 0.05);
  // Bottom line
  bodyShape.lineTo(-L / 2, 0.05);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: W,
    bevelEnabled: false,
  });
  // Center geometry
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
  // Rotate so Length is along Z (facing +Z)
  bodyMesh.rotation.y = -Math.PI / 2;
  root.add(bodyMesh);

  // --- 2. Glass (Windshield, Side, Rear) ---
  const glassGroup = new THREE.Group();
  
  // Windshield (Front)
  const windshieldGeom = new THREE.PlaneGeometry(W * 0.9, 0.35);
  const windshield = new THREE.Mesh(windshieldGeom, glassMat);
  windshield.position.set(0, H * 0.6, L * 0.38);
  windshield.rotation.x = -Math.PI / 3.5; // Slope back
  windshield.rotation.y = Math.PI / 2; // Face forward
  glassGroup.add(windshield);

  // Rear Window
  const rearWindowGeom = new THREE.PlaneGeometry(W * 0.85, 0.3);
  const rearWindow = new THREE.Mesh(rearWindowGeom, glassMat);
  rearWindow.position.set(0, H * 0.65, -L * 0.3);
  rearWindow.rotation.x = Math.PI / 2.5; // Slope forward
  rearWindow.rotation.y = Math.PI / 2;
  glassGroup.add(rearWindow);

  // Side Windows (Left & Right)
  // Simplified as trapezoids/planes
  const sideWindowShape = new THREE.Shape();
  sideWindowShape.moveTo(0, 0);
  sideWindowShape.lineTo(L * 0.6, 0);
  sideWindowShape.lineTo(L * 0.45, 0.25);
  sideWindowShape.lineTo(-L * 0.25, 0.25);
  sideWindowShape.lineTo(-L * 0.1, 0);
  sideWindowShape.lineTo(0, 0);
  
  const sideWindowGeom = new THREE.ExtrudeGeometry(sideWindowShape, { depth: 0.02, bevelEnabled: false });
  sideWindowGeom.center();
  
  for (const side of [-1, 1]) {
    const win = new THREE.Mesh(sideWindowGeom, glassMat);
    win.position.set(side * (W / 2 + 0.01), H * 0.55, 0);
    // The extrusion is along Z, shape in XY. 
    // We want it on the side of the car (X axis).
    // Rotate 90 deg around Y to face X? No, car faces Z.
    // Side of car is X plane.
    // So rotate 90 deg around Y.
    win.rotation.y = side * Math.PI / 2; 
    glassGroup.add(win);
  }
  root.add(glassGroup);

  // --- 3. Chrome Trim ---
  const trimGroup = new THREE.Group();

  // Window Line Trim (Thin tube along the glass top)
  // Front windshield top
  const wsTrim = new THREE.Mesh(new THREE.TorusGeometry(W * 0.45, 0.015, 8, 16, Math.PI), chromeMat);
  wsTrim.rotation.x = Math.PI / 2;
  wsTrim.rotation.y = Math.PI / 2;
  wsTrim.position.set(0, H * 0.75, L * 0.38);
  trimGroup.add(wsTrim);

  // Side skirt (Long thin box along bottom)
  const skirtGeom = new THREE.BoxGeometry(0.02, 0.04, L * 0.8);
  for (const side of [-1, 1]) {
    const skirt = new THREE.Mesh(skirtGeom, chromeMat);
    skirt.position.set(side * (W / 2 + 0.01), 0.08, 0);
    trimGroup.add(skirt);
  }

  // Side Vent (Front Fender) - 3 slats
  const ventGeom = new THREE.BoxGeometry(0.01, 0.015, 0.12);
  const ventX = W / 2 + 0.01;
  const ventZ = L * 0.25;
  const ventY = 0.25;
  for (let i = 0; i < 3; i++) {
    const slat = new THREE.Mesh(ventGeom, chromeMat);
    slat.position.set(ventX, ventY + i * 0.025, ventZ);
    slat.rotation.y = -0.2;
    trimGroup.add(slat);
    // Mirror side
    const slatR = slat.clone();
    slatR.position.set(-ventX, ventY + i * 0.025, ventZ);
    slatR.rotation.y = 0.2;
    trimGroup.add(slatR);
  }
  root.add(trimGroup);

  // --- 4. Wheels ---
  const wheelGroup = new THREE.Group();
  const tireGeom = new THREE.TorusGeometry(wheelR, wheelW, 12, 24);
  // Rim geometry (Multi-spoke simulation)
  const rimGeom = new THREE.CylinderGeometry(wheelR * 0.8, wheelR * 0.8, 0.05, 20);
  const spokeGeom = new THREE.BoxGeometry(0.02, wheelR * 0.9, 0.02);
  
  const wheelPositions = [
    [W / 2 + 0.02, axleY, axleZFront],
    [-W / 2 - 0.02, axleY, axleZFront],
    [W / 2 + 0.02, axleY, axleZRear],
    [-W / 2 - 0.02, axleY, axleZRear],
  ];

  for (const [x, y, z] of wheelPositions) {
    const wGroup = new THREE.Group();
    wGroup.position.set(x, y, z);
    // Wheels face X axis (side of car), so rotate 90 deg around Y
    wGroup.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;

    // Tire
    const tire = new THREE.Mesh(tireGeom, tireMat);
    // Torus is XY plane, we want it in YZ plane (facing X).
    // Default Torus is in XY. Rotate 90 around X? 
    // If we rotate group Y by 90, the local X becomes Z, local Z becomes -X.
    // Torus in XY -> Rotate X 90 -> YZ.
    tire.rotation.x = Math.PI / 2;
    wGroup.add(tire);

    // Rim Base
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2; // Match tire
    wGroup.add(rim);

    // Spokes (5 double-spokes)
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      spoke.position.y = Math.cos(angle) * wheelR * 0.4;
      spoke.position.z = Math.sin(angle) * wheelR * 0.4;
      spoke.rotation.x = angle; 
      // Actually simpler: rotate the spoke mesh around center
      spoke.rotation.x = Math.PI / 2; // Flat against rim face
      spoke.position.set(0, Math.cos(angle) * wheelR * 0.4, Math.sin(angle) * wheelR * 0.4);
      spoke.rotation.z = angle; // Radiate
      wGroup.add(spoke);
    }
    
    // Center cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), chromeMat);
    cap.rotation.x = Math.PI / 2;
    wGroup.add(cap);

    wheelGroup.add(wGroup);
  }
  root.add(wheelGroup);

  // --- 5. Lights ---
  // Headlights (Front)
  const hlGeom = new THREE.BoxGeometry(0.15, 0.08, 0.05);
  for (const side of [-1, 1]) {
    const hl = new THREE.Mesh(hlGeom, headLightMat);
    hl.position.set(side * (W * 0.35), 0.25, L / 2);
    hl.rotation.y = side * 0.1; // Slight angle
    root.add(hl);
  }

  // Taillights (Rear - Slim horizontal)
  const tlGeom = new THREE.BoxGeometry(0.3, 0.06, 0.05);
  for (const side of [-1, 1]) {
    const tl = new THREE.Mesh(tlGeom, tailLightMat);
    tl.position.set(side * (W * 0.35), 0.35, -L / 2);
    tl.rotation.y = side * 0.1;
    root.add(tl);
  }

  // --- 6. Details ---
  // Mirrors
  const mirrorGeom = new THREE.BoxGeometry(0.08, 0.05, 0.12);
  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(mirrorGeom, bodyMat);
    mirror.position.set(side * (W / 2 + 0.05), H * 0.55, L * 0.3);
    mirror.rotation.y = side * 0.2;
    root.add(mirror);
  }

  // Door Handles (Small chrome boxes)
  const handleGeom = new THREE.BoxGeometry(0.08, 0.02, 0.04);
  for (const side of [-1, 1]) {
    const h1 = new THREE.Mesh(handleGeom, chromeMat);
    h1.position.set(side * (W / 2 + 0.01), H * 0.45, L * 0.1);
    root.add(h1);
    const h2 = new THREE.Mesh(handleGeom, chromeMat);
    h2.position.set(side * (W / 2 + 0.01), H * 0.45, -L * 0.15);
    root.add(h2);
  }

  // Shark Fin Antenna
  const antennaShape = new THREE.Shape();
  antennaShape.moveTo(0, 0);
  antennaShape.lineTo(0.05, 0.1);
  antennaShape.lineTo(-0.02, 0.1);
  antennaShape.lineTo(0, 0);
  const antennaGeom = new THREE.ExtrudeGeometry(antennaShape, { depth: 0.04, bevelEnabled: false });
  const antenna = new THREE.Mesh(antennaGeom, bodyMat);
  antenna.position.set(0, H * 0.62, -L * 0.2);
  antenna.rotation.x = -Math.PI / 6;
  root.add(antenna);

  // Grille (Front - Vertical slats)
  const grilleGroup = new THREE.Group();
  const slatGeom = new THREE.BoxGeometry(0.02, 0.15, 0.02);
  for (let i = -2; i <= 2; i++) {
    const slat = new THREE.Mesh(slatGeom, chromeMat);
    slat.position.set(i * 0.06, 0.2, L / 2 + 0.02);
    grilleGroup.add(slat);
  }
  root.add(grilleGroup);

  // Exhaust Tips (Rear)
  const exhaustGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 12);
  for (const side of [-1, 1]) {
    const ex = new THREE.Mesh(exhaustGeom, chromeMat);
    ex.rotation.x = Math.PI / 2;
    ex.position.set(side * (W * 0.3), 0.1, -L / 2 - 0.05);
    root.add(ex);
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