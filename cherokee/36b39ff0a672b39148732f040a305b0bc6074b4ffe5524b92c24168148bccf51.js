export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  // Approximate proportions based on a standard 4lb sledgehammer
  const handleLength = 1.2;
  const handleRadius = 0.045;
  const handleTaper = 0.035; // Radius at the end
  
  const headLength = 0.38;   // Distance between striking faces
  const headWidth = 0.14;    // Width of the block
  const headHeight = 0.11;   // Height of the block
  
  // --- Materials ---
  // Rusty Iron: Dark, rough, moderate metalness to avoid black rendering
  const rustyMetalMat = new THREE.MeshStandardMaterial({
    color: 0x523b2e,
    metalness: 0.35,
    roughness: 0.75,
    emissive: 0x1a120e,
    emissiveIntensity: 0.25
  });

  // Darker/Worn Handle Material (often wood or painted steel, here looks like worn painted steel)
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x2a221e,
    metalness: 0.2,
    roughness: 0.8,
    emissive: 0x0a0806,
    emissiveIntensity: 0.15
  });

  // --- Handle ---
  // Tapered cylinder. RadiusTop (near head) > RadiusBottom (end)
  const handleGeom = new THREE.CylinderGeometry(
    handleRadius, 
    handleTaper, 
    handleLength, 
    16
  );
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Rotate to lie along X axis (default cylinder is Y-up)
  handle.rotation.z = Math.PI / 2;
  // Position so the thick end is near the head center
  // Head center is at 0,0,0. Handle extends to -X.
  handle.position.set(-headLength / 2 - 0.05, 0, 0); 
  root.add(handle);

  // --- Head ---
  // The head is a blocky mass. We'll construct it from a main body and rounded faces.
  
  // Main Body (The "Eye" area and middle section)
  // Slightly narrower than the faces
  const bodyWidth = headWidth * 0.85;
  const bodyHeight = headHeight * 0.9;
  const bodyGeom = new THREE.BoxGeometry(headLength, bodyWidth, bodyHeight);
  const headBody = new THREE.Mesh(bodyGeom, rustyMetalMat);
  root.add(headBody);

  // Striking Faces (The "Peens")
  // These are roughly cylindrical or capsule-like blocks on the ends
  const faceDepth = 0.06; // How much the face protrudes/is distinct
  const faceGeom = new THREE.CylinderGeometry(
    headWidth * 0.55, // Radius approx half width
    headWidth * 0.55, 
    faceDepth, 
    16
  );
  
  // Rotate cylinder to face X-axis
  faceGeom.rotateZ(Math.PI / 2);

  // Left Face (Striking side 1)
  const faceLeft = new THREE.Mesh(faceGeom, rustyMetalMat);
  faceLeft.position.set(-headLength / 2 - faceDepth / 2 + 0.01, 0, 0);
  root.add(faceLeft);

  // Right Face (Striking side 2 - the main sledge face)
  const faceRight = new THREE.Mesh(faceGeom, rustyMetalMat);
  faceRight.position.set(headLength / 2 + faceDepth / 2 - 0.01, 0, 0);
  root.add(faceRight);

  // --- Collars / Reinforcement near handle ---
  // Often there's a slight bulge where the handle enters
  const collarGeom = new THREE.CylinderGeometry(
    bodyWidth * 0.55, 
    bodyWidth * 0.55, 
    0.08, 
    16
  );
  collarGeom.rotateZ(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeom, rustyMetalMat);
  collar.position.set(-headLength / 2 + 0.04, 0, 0);
  root.add(collar);

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