export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue painted metal body: Glossy, semi-metallic paint.
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x0044cc,
    metalness: 0.3,
    roughness: 0.25,
  });

  // Black plastic/rubber base and tube: Matte, non-metallic.
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Brass fittings: Shiny metal, capped metalness, slight emissive for brightness.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // --- 1. Blue Main Body (Lathe) ---
  // Profile points (radius, y) from bottom to top.
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.34, 0.00),   // Bottom edge
    new THREE.Vector2(0.34, 0.95),   // Main cylinder wall
    new THREE.Vector2(0.30, 1.10),   // Taper start
    new THREE.Vector2(0.22, 1.25),   // Shoulder
    new THREE.Vector2(0.12, 1.35),   // Neck base
    new THREE.Vector2(0.12, 1.45),   // Neck top
    new THREE.Vector2(0.00, 1.45),   // Top center
  ];
  const blueBodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const blueBody = new THREE.Mesh(blueBodyGeom, blueBodyMat);
  // Shift up so bottom of profile is at y=0 (will be covered by black base)
  blueBody.position.y = 0.10; 
  root.add(blueBody);

  // --- 2. Black Base Cap ---
  // Main cylindrical cap
  const blackBaseGeom = new THREE.CylinderGeometry(0.36, 0.36, 0.20, 32);
  const blackBase = new THREE.Mesh(blackBaseGeom, blackMat);
  blackBase.position.y = 0.00;
  root.add(blackBase);

  // Lip/Flange on the cap (Torus for rounded edge)
  const blackLipGeom = new THREE.TorusGeometry(0.38, 0.04, 16, 32);
  const blackLip = new THREE.Mesh(blackLipGeom, blackMat);
  blackLip.rotation.x = Math.PI / 2;
  blackLip.position.y = 0.08;
  root.add(blackLip);

  // --- 3. Top Outlet (Brass) ---
  const topOutletGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
  const topOutlet = new THREE.Mesh(topOutletGeom, brassMat);
  topOutlet.position.y = 1.52; // Above the blue body neck
  root.add(topOutlet);

  // --- 4. Bottom Inlet Tube (Black Curved Pipe) ---
  // Path: Down from center, then curve out to the side.
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.00, -0.10, 0.00), // Start at bottom of cap
    new THREE.Vector3(0.00, -0.60, 0.00), // Straight down
    new THREE.Vector3(-0.25, -0.75, 0.05), // Curve out and slightly forward
    new THREE.Vector3(-0.45, -0.75, 0.05), // End of black tube
  ]);
  
  const bottomTubeGeom = new THREE.TubeGeometry(tubePath, 20, 0.045, 12, false);
  const bottomTube = new THREE.Mesh(bottomTubeGeom, blackMat);
  root.add(bottomTube);

  // --- 5. Bottom Inlet Tip (Brass) ---
  // Small cylinder at the end of the black tube
  const tipGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16);
  const bottomTip = new THREE.Mesh(tipGeom, brassMat);
  // Position at the end of the curve, rotated to align with tube direction
  // The curve ends roughly at (-0.45, -0.75, 0.05) going roughly -X direction.
  bottomTip.position.set(-0.49, -0.75, 0.05);
  bottomTip.rotation.z = Math.PI / 2; // Align with X axis
  bottomTip.rotation.y = -0.1; // Slight angle to match curve tangent
  root.add(bottomTip);

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