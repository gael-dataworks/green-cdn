export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gunmetal for blade, guard, pommel
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Slightly darker steel for the fuller (groove) to simulate depth/shadow
  const fullerMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    metalness: 0.5,
    roughness: 0.5,
  });

  // Dark leather/wrap for the grip
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const bladeLength = 0.65;
  const bladeWidthBase = 0.14;
  const bladeThickness = 0.025;
  
  const guardWidth = 0.24;
  const guardHeight = 0.06;
  const guardDepth = 0.04;

  const gripLength = 0.22;
  const gripRadius = 0.035;

  const pommelSize = 0.09;

  // --- 1. Blade ---
  // We model the blade as two halves to create the central fuller (groove) naturally
  const bladeShape = new THREE.Shape();
  // Start at guard (z=0), go to tip (z=bladeLength)
  // Right half profile
  bladeShape.moveTo(0, 0); 
  bladeShape.lineTo(bladeLength * 0.15, bladeWidthBase * 0.5); // Slight flare at base
  bladeShape.lineTo(bladeLength * 0.8, bladeWidthBase * 0.15); // Taper
  bladeShape.lineTo(bladeLength, 0); // Tip
  
  const bladeExtrudeSettings = {
    steps: 1,
    depth: bladeThickness * 0.5, // Half thickness
    bevelEnabled: false,
  };

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  // Center the geometry
  bladeGeom.translate(0, 0, -bladeLength * 0.5); 

  // Right half
  const bladeRight = new THREE.Mesh(bladeGeom, steelMat);
  bladeRight.rotation.x = Math.PI / 2; // Lay flat in XZ
  bladeRight.position.z = bladeLength * 0.5; // Push forward
  root.add(bladeRight);

  // Left half (mirrored)
  const bladeLeft = new THREE.Mesh(bladeGeom, steelMat);
  bladeLeft.rotation.x = Math.PI / 2;
  bladeLeft.scale.x = -1; // Mirror
  bladeLeft.position.z = bladeLength * 0.5;
  root.add(bladeLeft);

  // Central Fuller (The groove) - A thin dark strip between the halves
  const fullerGeom = new THREE.BoxGeometry(0.015, 0.005, bladeLength * 0.75);
  const fuller = new THREE.Mesh(fullerGeom, fullerMat);
  fuller.position.set(0, bladeThickness * 0.5 + 0.001, bladeLength * 0.5 - (bladeLength * 0.75) / 2);
  root.add(fuller);

  // Blade Decorations (Tribal patterns near guard)
  // We use small extruded shapes for the raised reliefs
  const decorMat = steelMat; 
  
  function addBladeDecor(x, z, rotZ) {
    const dShape = new THREE.Shape();
    dShape.moveTo(0, 0);
    dShape.lineTo(0.03, 0.01);
    dShape.lineTo(0.03, -0.01);
    dShape.lineTo(0, 0);
    const dGeom = new THREE.ExtrudeGeometry(dShape, { depth: 0.004, bevelEnabled: false });
    const mesh = new THREE.Mesh(dGeom, decorMat);
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.z = rotZ;
    mesh.position.set(x, bladeThickness * 0.5 + 0.002, z);
    root.add(mesh);
  }

  // Symmetric decorations
  addBladeDecor(0.04, bladeLength * 0.25, Math.PI / 2);
  addBladeDecor(-0.04, bladeLength * 0.25, -Math.PI / 2);
  addBladeDecor(0, bladeLength * 0.15, 0);


  // --- 2. Guard (Crossguard) ---
  // Main bar
  const guardGeom = new THREE.BoxGeometry(guardWidth, guardHeight, guardDepth);
  const guard = new THREE.Mesh(guardGeom, steelMat);
  guard.position.set(0, 0, 0); // At base of blade
  // Angle it slightly back for ergonomic look
  guard.rotation.x = -0.1; 
  root.add(guard);

  // Guard Decorations (Geometric reliefs on the face)
  function addGuardDecor(x) {
    // Diamond shape
    const gShape = new THREE.Shape();
    gShape.moveTo(0, 0.02);
    gShape.lineTo(0.015, 0);
    gShape.lineTo(0, -0.02);
    gShape.lineTo(-0.015, 0);
    const gGeom = new THREE.ExtrudeGeometry(gShape, { depth: 0.005, bevelEnabled: false });
    const mesh = new THREE.Mesh(gGeom, steelMat);
    mesh.position.set(x, 0, guardDepth * 0.5 + 0.002);
    root.add(mesh);
  }
  addGuardDecor(-0.06);
  addGuardDecor(0.06);
  // Center motif
  const centerDecorGeom = new THREE.BoxGeometry(0.04, 0.02, 0.005);
  const centerDecor = new THREE.Mesh(centerDecorGeom, steelMat);
  centerDecor.position.set(0, 0, guardDepth * 0.5 + 0.002);
  root.add(centerDecor);


  // --- 3. Grip (Handle) ---
  // Core cylinder
  const gripCoreGeom = new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 16);
  const gripCore = new THREE.Mesh(gripCoreGeom, gripMat);
  // Position grip behind guard, angled back
  gripCore.position.set(0, -gripLength * 0.5 * Math.sin(0.2), -gripLength * 0.5 * Math.cos(0.2));
  gripCore.rotation.x = -0.2; // Match guard angle
  root.add(gripCore);

  // Grip Wraps (Rings)
  const ringCount = 9;
  const ringSpacing = gripLength / (ringCount + 1);
  const ringGeom = new THREE.TorusGeometry(gripRadius + 0.002, 0.004, 8, 16);
  
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(ringGeom, gripMat);
    // Calculate position along the angled grip
    const localZ = -gripLength * 0.5 + (i + 1) * ringSpacing;
    // Transform local Z to world position based on grip rotation
    const posY = localZ * Math.sin(-0.2);
    const posZ = localZ * Math.cos(-0.2);
    
    ring.position.set(0, posY, posZ);
    ring.rotation.x = -0.2; // Align with grip
    root.add(ring);
  }


  // --- 4. Pommel ---
  // Bulbous cap
  const pommelGeom = new THREE.SphereGeometry(pommelSize, 16, 16);
  const pommel = new THREE.Mesh(pommelGeom, steelMat);
  pommel.scale.set(1, 1, 0.8); // Flatten slightly
  // Position at end of grip
  pommel.position.set(0, -gripLength * Math.sin(0.2), -gripLength * Math.cos(0.2));
  pommel.rotation.x = -0.2;
  root.add(pommel);

  // Pommel Symbol (Star/Cross on the end cap)
  const symbolGroup = new THREE.Group();
  // Vertical bar
  const symV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.005), steelMat);
  symbolGroup.add(symV);
  // Horizontal bar
  const symH = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.005), steelMat);
  symbolGroup.add(symH);
  
  symbolGroup.position.set(0, 0, pommelSize * 0.8 + 0.002); // On the face of the pommel
  // The pommel is rotated, so we need to align the symbol group to face "down/back" relative to sword
  // Actually, since pommel is a child of root and rotated, we can just add symbolGroup to pommel
  // But pommel is scaled. Let's add to root and position manually or add to pommel.
  // Adding to pommel is easier for hierarchy.
  pommel.add(symbolGroup);


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