export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8B5A2B,
    metalness: 0.0,
    roughness: 0.5,
  });

  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x654321,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Handle ---
  // Long wooden cylinder
  const handleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 32);
  const handle = new THREE.Mesh(handleGeom, woodMat);
  handle.position.y = 0.0; // Centered vertically for now, will adjust
  root.add(handle);

  // --- End Cap ---
  // Small black cap at bottom
  const endCapGeom = new THREE.CylinderGeometry(0.026, 0.026, 0.015, 16);
  const endCap = new THREE.Mesh(endCapGeom, blackMat);
  endCap.position.y = -0.28;
  root.add(endCap);

  // --- Grip ---
  // Stacked black rings near the bottom
  const gripRingGeom = new THREE.CylinderGeometry(0.027, 0.027, 0.012, 16);
  const gripStartY = -0.20;
  const gripCount = 6;
  const gripSpacing = 0.015;
  for (let i = 0; i < gripCount; i++) {
    const ring = new THREE.Mesh(gripRingGeom, blackMat);
    ring.position.y = gripStartY + i * gripSpacing;
    root.add(ring);
  }

  // --- Collar ---
  // Black ring at top of handle where neck starts
  const collarGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.02, 16);
  const collar = new THREE.Mesh(collarGeom, blackMat);
  collar.position.y = 0.28;
  root.add(collar);

  // --- Neck ---
  // Curved black rod. Uses TubeGeometry with CatmullRomCurve3
  const neckPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.28, 0),      // Start at top of handle
    new THREE.Vector3(0, 0.35, 0.02),   // Slight curve forward
    new THREE.Vector3(0, 0.45, 0.05),   // More forward
    new THREE.Vector3(0, 0.55, 0.08),   // End point
  ]);

  const neckGeom = new THREE.TubeGeometry(neckPath, 20, 0.012, 12, false);
  const neck = new THREE.Mesh(neckGeom, blackMat);
  root.add(neck);

  // --- Hand ---
  // Flat wooden hand shape. ExtrudeGeometry from a 2D Shape.
  const handShape = new THREE.Shape();
  
  // Draw hand outline (relative to 0,0 at wrist base)
  const wristWidth = 0.04;
  const palmHeight = 0.06;
  const fingerLength = 0.08;
  const thumbLength = 0.04;
  
  // Start bottom left of wrist
  handShape.moveTo(-wristWidth / 2, 0);
  // Up to palm
  handShape.lineTo(-wristWidth / 2, palmHeight);
  // Thumb protrusion (left side in local UV, but let's orient for model)
  // The image shows the hand profile. Let's make a flat paddle shape.
  // Actually, looking at the image, it's a flat cutout of a hand.
  
  // Redefining shape for a flat hand silhouette
  handShape.moveTo(-0.02, 0); // Wrist left
  handShape.lineTo(-0.02, 0.05); // Up wrist
  handShape.lineTo(-0.03, 0.06); // Thumb base
  handShape.lineTo(-0.01, 0.08); // Thumb tip
  handShape.lineTo(0.00, 0.06); // Thumb valley
  handShape.lineTo(0.00, 0.12); // Index finger
  handShape.lineTo(0.015, 0.12); // Index width
  handShape.lineTo(0.015, 0.06); // Index base / Middle start
  handShape.lineTo(0.03, 0.06); // Middle finger side
  handShape.lineTo(0.03, 0.13); // Middle tip
  handShape.lineTo(0.045, 0.13); // Middle width
  handShape.lineTo(0.045, 0.06); // Middle base
  handShape.lineTo(0.06, 0.06); // Ring finger side
  handShape.lineTo(0.06, 0.11); // Ring tip
  handShape.lineTo(0.075, 0.11); // Ring width
  handShape.lineTo(0.075, 0.06); // Ring base
  handShape.lineTo(0.09, 0.06); // Pinky side
  handShape.lineTo(0.09, 0.09); // Pinky tip
  handShape.lineTo(0.10, 0.09); // Pinky width
  handShape.lineTo(0.10, 0.05); // Pinky base
  handShape.lineTo(0.02, 0.05); // Palm bottom right
  handShape.lineTo(0.02, 0); // Wrist right
  handShape.lineTo(-0.02, 0); // Close

  const handGeom = new THREE.ExtrudeGeometry(handShape, {
    depth: 0.008,
    bevelEnabled: false,
  });
  
  // Center the geometry
  handGeom.center();

  const hand = new THREE.Mesh(handGeom, woodMat);
  
  // Position hand at end of neck
  // The neck ends roughly at (0, 0.55, 0.08)
  hand.position.set(0, 0.55, 0.08);
  
  // Rotate hand to match the angle of the neck end
  // The neck curves forward (+Z) and up (+Y).
  // We need to tilt the hand back slightly so fingers point up/forward.
  hand.rotation.x = -Math.PI / 6; // Tilt back
  hand.rotation.z = Math.PI / 2;  // Stand up (since extrude is XY plane)
  hand.rotation.y = Math.PI;      // Face correct direction

  root.add(hand);

  // --- Finger Details (Carved lines) ---
  // Add thin dark lines on the hand to simulate finger joints/carving
  const lineMat = darkWoodMat;
  const lineGeom = new THREE.BoxGeometry(0.002, 0.001, 0.03);
  
  // Add a few lines on the fingers
  const fingerLines = [
    { x: 0.01, y: 0.02, z: 0.005 },
    { x: 0.03, y: 0.02, z: 0.005 },
    { x: 0.05, y: 0.02, z: 0.005 },
    { x: 0.07, y: 0.02, z: 0.005 },
  ];

  // Since hand is rotated, we need to add these as children of the hand 
  // or calculate world positions. Children is easier.
  // But hand rotation is complex. Let's just add them as children of 'hand'
  // and position them in local space of the hand before rotation? 
  // No, 'hand' is already rotated. 
  // Better: Create a group for the hand assembly, add mesh and lines to group.
  
  const handGroup = new THREE.Group();
  handGroup.position.copy(hand.position);
  handGroup.rotation.copy(hand.rotation);
  
  // Reset hand mesh to be child of group
  hand.position.set(0,0,0);
  hand.rotation.set(0,0,0);
  handGroup.add(hand);

  // Add lines in local space of the group (which matches hand orientation)
  // The extrusion was along Z. The hand lies in XY.
  // Lines should be across the fingers (along X in local space if fingers point Y)
  // My shape drawing had fingers pointing roughly +Y.
  
  const jointLineGeom = new THREE.BoxGeometry(0.04, 0.002, 0.005);
  
  const joints = [
    { x: 0.01, y: 0.04 },
    { x: 0.03, y: 0.04 },
    { x: 0.05, y: 0.04 },
    { x: 0.07, y: 0.04 },
  ];

  joints.forEach(j => {
    const line = new THREE.Mesh(jointLineGeom, lineMat);
    line.position.set(j.x - 0.04, j.y, 0.005); // Offset to center roughly
    handGroup.add(line);
  });

  root.add(handGroup);

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