export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const length = 1.0;
  const width = 0.45;
  const height = 0.35;
  const wheelRadius = 0.11;
  const wheelBase = 0.55; // distance between front and rear axle centers
  const bodyWidth = 0.38;
  
  // --- Materials ---
  const redPaintMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    metalness: 0.1,
    roughness: 0.3,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.8,
    roughness: 0.2,
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    emissive: 0xaa0000,
    emissiveIntensity: 0.3,
    roughness: 0.4,
  });

  // --- Helper Functions ---
  function addMesh(geom, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- 1. Main Body (Extruded Side Profile) ---
  // Create the side silhouette of a Beetle
  const bodyShape = new THREE.Shape();
  const h = height;
  const l = length / 2;
  
  // Start bottom rear
  bodyShape.moveTo(-l, -h * 0.4); 
  // Rear bumper line up
  bodyShape.lineTo(-l, -h * 0.25);
  // Rear deck slope
  bodyShape.lineTo(-l * 0.6, h * 0.1);
  // Rear window slope
  bodyShape.lineTo(-l * 0.2, h * 0.6);
  // Roof curve (approximated with bezier)
  bodyShape.quadraticCurveTo(0, h * 0.75, l * 0.3, h * 0.65);
  // Windshield slope
  bodyShape.lineTo(l * 0.6, h * 0.15);
  // Hood curve
  bodyShape.quadraticCurveTo(l * 0.8, h * 0.3, l, -h * 0.1);
  // Front bumper line down
  bodyShape.lineTo(l, -h * 0.25);
  // Bottom line back to start
  bodyShape.lineTo(-l, -h * 0.25);
  bodyShape.lineTo(-l, -h * 0.4);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyWidth,
    bevelEnabled: false,
    steps: 1
  });
  // Center the extrusion
  bodyGeom.translate(0, 0, -bodyWidth / 2);
  
  const mainBody = new THREE.Mesh(bodyGeom, redPaintMat);
  root.add(mainBody);

  // --- 2. Fenders (Wheel Arches) ---
  // Beetle has prominent rounded fenders. We use scaled spheres.
  const fenderGeom = new THREE.SphereGeometry(wheelRadius * 1.4, 32, 32);
  const fenderMat = redPaintMat;
  
  // Front Fenders
  const fFrontL = addMesh(fenderGeom, fenderMat, wheelBase / 2, -h * 0.35, bodyWidth / 2 + wheelRadius * 0.2);
  fFrontL.scale.set(0.6, 0.8, 0.6);
  const fFrontR = addMesh(fenderGeom, fenderMat, wheelBase / 2, -h * 0.35, -bodyWidth / 2 - wheelRadius * 0.2);
  fFrontR.scale.set(0.6, 0.8, 0.6);

  // Rear Fenders
  const fRearL = addMesh(fenderGeom, fenderMat, -wheelBase / 2, -h * 0.35, bodyWidth / 2 + wheelRadius * 0.2);
  fRearL.scale.set(0.7, 0.9, 0.7);
  const fRearR = addMesh(fenderGeom, fenderMat, -wheelBase / 2, -h * 0.35, -bodyWidth / 2 - wheelRadius * 0.2);
  fRearR.scale.set(0.7, 0.9, 0.7);

  // --- 3. Running Boards ---
  // Thin strips along the bottom sides
  const boardGeom = new THREE.BoxGeometry(length * 0.8, 0.02, 0.08);
  addMesh(boardGeom, redPaintMat, 0, -h * 0.45, bodyWidth / 2 + 0.04);
  addMesh(boardGeom, redPaintMat, 0, -h * 0.45, -bodyWidth / 2 - 0.04);

  // --- 4. Wheels ---
  const tireGeom = new THREE.TorusGeometry(wheelRadius, 0.04, 16, 32);
  const hubGeom = new THREE.CylinderGeometry(wheelRadius * 0.6, wheelRadius * 0.6, 0.05, 32);
  
  const wheelPositions = [
    [ wheelBase / 2, -h * 0.4 + wheelRadius,  bodyWidth / 2 + 0.05 ], // Front Left
    [ wheelBase / 2, -h * 0.4 + wheelRadius, -bodyWidth / 2 - 0.05 ], // Front Right
    [-wheelBase / 2, -h * 0.4 + wheelRadius,  bodyWidth / 2 + 0.05 ], // Rear Left
    [-wheelBase / 2, -h * 0.4 + wheelRadius, -bodyWidth / 2 - 0.05 ], // Rear Right
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    // Tire
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.position.set(wx, wy, wz);
    root.add(tire);

    // Hubcap
    const hub = new THREE.Mesh(hubGeom, chromeMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(wx, wy, wz + (wz > 0 ? 0.02 : -0.02)); // Slight offset to sit on tire face
    root.add(hub);
    
    // Hub detail (center cap)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16), chromeMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.set(wx, wy, wz + (wz > 0 ? 0.04 : -0.04));
    root.add(cap);
  });

  // --- 5. Bumpers ---
  // Front Bumper
  const frontBumperGeom = new THREE.TorusGeometry(length * 0.45, 0.025, 16, 32, Math.PI);
  const frontBumper = new THREE.Mesh(frontBumperGeom, chromeMat);
  frontBumper.rotation.y = Math.PI / 2;
  frontBumper.rotation.z = Math.PI / 2;
  frontBumper.position.set(length * 0.4, -h * 0.3, 0);
  root.add(frontBumper);

  // Rear Bumper
  const rearBumperGeom = new THREE.TorusGeometry(length * 0.45, 0.025, 16, 32, Math.PI);
  const rearBumper = new THREE.Mesh(rearBumperGeom, chromeMat);
  rearBumper.rotation.y = -Math.PI / 2;
  rearBumper.rotation.z = Math.PI / 2;
  rearBumper.position.set(-length * 0.4, -h * 0.3, 0);
  root.add(rearBumper);

  // --- 6. Windows ---
  // Side Windows (Door and Rear Quarter)
  const sideWindowGeom = new THREE.PlaneGeometry(0.15, 0.12);
  // Door window
  addMesh(sideWindowGeom, glassMat, 0.1, h * 0.35, bodyWidth / 2 + 0.005, 0, 0, 0);
  addMesh(sideWindowGeom, glassMat, 0.1, h * 0.35, -bodyWidth / 2 - 0.005, 0, 0, 0); // Right side (inside out normally, but DoubleSide implied or we flip)
  // Actually for right side we need to be careful with normals or just use DoubleSide. 
  // The material setup above doesn't explicitly set side, but standard is FrontSide. 
  // Let's just place them and rely on the fact that glass is thin. 
  // Better: use BoxGeometry for window frames or just place planes.
  // For simplicity, I'll use thin boxes for windows to avoid normal issues.
  const winBoxGeom = new THREE.BoxGeometry(0.15, 0.12, 0.01);
  addMesh(winBoxGeom, glassMat, 0.1, h * 0.35, bodyWidth / 2 + 0.02);
  addMesh(winBoxGeom, glassMat, 0.1, h * 0.35, -bodyWidth / 2 - 0.02);

  // Rear Quarter Window
  const rearWinBoxGeom = new THREE.BoxGeometry(0.12, 0.10, 0.01);
  addMesh(rearWinBoxGeom, glassMat, -0.25, h * 0.30, bodyWidth / 2 + 0.02);
  addMesh(rearWinBoxGeom, glassMat, -0.25, h * 0.30, -bodyWidth / 2 - 0.02);

  // Windshield
  const windShieldGeom = new THREE.BoxGeometry(0.02, 0.18, 0.35);
  const windShield = new THREE.Mesh(windShieldGeom, glassMat);
  windShield.position.set(length * 0.35, h * 0.45, 0);
  windShield.rotation.y = -0.4; // Slope back
  root.add(windShield);

  // Rear Window
  const rearWinGeom = new THREE.BoxGeometry(0.02, 0.15, 0.32);
  const rearWin = new THREE.Mesh(rearWinGeom, glassMat);
  rearWin.position.set(-length * 0.35, h * 0.45, 0);
  rearWin.rotation.y = 0.5; // Slope forward
  root.add(rearWin);

  // --- 7. Lights ---
  // Headlights (on front fenders)
  const headlightGeom = new THREE.SphereGeometry(0.04, 16, 16);
  addMesh(headlightGeom, headlightMat, length * 0.45, -h * 0.15, bodyWidth / 2 + 0.15);
  addMesh(headlightGeom, headlightMat, length * 0.45, -h * 0.15, -bodyWidth / 2 - 0.15);

  // Taillights (on rear body/fenders)
  const taillightGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 16);
  const tlLeft = new THREE.Mesh(taillightGeom, taillightMat);
  tlLeft.rotation.x = Math.PI / 2;
  tlLeft.position.set(-length * 0.45, -h * 0.15, bodyWidth / 2 + 0.15);
  root.add(tlLeft);
  
  const tlRight = new THREE.Mesh(taillightGeom, taillightMat);
  tlRight.rotation.x = Math.PI / 2;
  tlRight.position.set(-length * 0.45, -h * 0.15, -bodyWidth / 2 - 0.15);
  root.add(tlRight);

  // --- 8. Door Handles ---
  const handleGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8);
  const handleLeft = new THREE.Mesh(handleGeom, chromeMat);
  handleLeft.rotation.z = Math.PI / 2;
  handleLeft.position.set(0.15, h * 0.25, bodyWidth / 2 + 0.02);
  root.add(handleLeft);

  const handleRight = new THREE.Mesh(handleGeom, chromeMat);
  handleRight.rotation.z = Math.PI / 2;
  handleRight.position.set(0.15, h * 0.25, -bodyWidth / 2 - 0.02);
  root.add(handleRight);

  // --- 9. Split Rear Window Detail (Optional but iconic) ---
  // A thin black bar down the middle of the rear window
  const splitBarGeom = new THREE.BoxGeometry(0.01, 0.12, 0.02);
  const splitBarMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const splitBar = new THREE.Mesh(splitBarGeom, splitBarMat);
  splitBar.position.set(-length * 0.35, h * 0.45, 0);
  splitBar.rotation.y = 0.5;
  root.add(splitBar);

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