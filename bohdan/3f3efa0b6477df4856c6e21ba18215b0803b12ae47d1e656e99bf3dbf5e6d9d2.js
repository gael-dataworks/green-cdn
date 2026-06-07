export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Taupe/Beige fabric for mattress, duvet, pillows
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xB5ADA0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark legs
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2A2A2A,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const bedWidth = 1.0;
  const bedLength = 1.4;
  const mattressHeight = 0.25;
  const pillowWidth = 0.32;
  const pillowDepth = 0.50;
  const pillowHeight = 0.12;

  // --- 1. Mattress Base ---
  // The main structural box, visible at the sides and under the pillows
  const mattressGeom = new THREE.BoxGeometry(bedWidth, mattressHeight, bedLength);
  const mattress = new THREE.Mesh(mattressGeom, fabricMat);
  mattress.position.y = mattressHeight / 2;
  root.add(mattress);

  // --- 2. Legs ---
  // 4 small cylindrical legs at the corners
  const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 16);
  const legPositions = [
    [-bedWidth / 2 + 0.05, -0.04, -bedLength / 2 + 0.05], // Back Left
    [ bedWidth / 2 - 0.05, -0.04, -bedLength / 2 + 0.05], // Back Right
    [-bedWidth / 2 + 0.05, -0.04,  bedLength / 2 - 0.05], // Front Left
    [ bedWidth / 2 - 0.05, -0.04,  bedLength / 2 - 0.05], // Front Right
  ];
  
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- 3. Pillows ---
  // Two plump pillows at the head (negative Z end)
  // Using BoxGeometry with slight scaling to look soft
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowDepth);
  
  const pillowLeft = new THREE.Mesh(pillowGeom, fabricMat);
  pillowLeft.position.set(-pillowWidth / 2 - 0.02, mattressHeight + pillowHeight / 2, -bedLength / 2 + pillowDepth / 2 + 0.05);
  // Tilt slightly back
  pillowLeft.rotation.x = -0.1; 
  root.add(pillowLeft);

  const pillowRight = new THREE.Mesh(pillowGeom, fabricMat);
  pillowRight.position.set(pillowWidth / 2 + 0.02, mattressHeight + pillowHeight / 2, -bedLength / 2 + pillowDepth / 2 + 0.05);
  pillowRight.rotation.x = -0.1;
  root.add(pillowRight);

  // --- 4. Duvet ---
  const duvetGroup = new THREE.Group();

  // 4a. Duvet Top Surface (Quilted)
  // We use InstancedMesh for the puffy squares to keep draw calls low
  const quiltCols = 4;
  const quiltRows = 6;
  const puffWidth = (bedWidth - 0.1) / quiltCols;
  const puffDepth = (bedLength * 0.6) / quiltRows; // Covers most of the length
  const puffHeight = 0.06;
  
  const puffGeom = new THREE.BoxGeometry(puffWidth * 0.9, puffHeight, puffDepth * 0.9);
  // Add a slight rounding effect by scaling vertices? No, keep it simple Box.
  // To make it look puffy, we rely on the material and the grid arrangement.
  
  const puffCount = quiltCols * quiltRows;
  const puffMesh = new THREE.InstancedMesh(puffGeom, fabricMat, puffCount);
  
  const dummy = new THREE.Object3D();
  let idx = 0;
  
  // Start the quilt after the pillow area (folded back part)
  const quiltStartZ = -bedLength / 2 + 0.4; 
  
  for (let r = 0; r < quiltRows; r++) {
    for (let c = 0; c < quiltCols; c++) {
      const x = (c - (quiltCols - 1) / 2) * puffWidth;
      const z = quiltStartZ + (r + 0.5) * puffDepth;
      const y = mattressHeight + puffHeight / 2 + 0.01; // Slightly above mattress
      
      dummy.position.set(x, y, z);
      // Slight random variation in height for natural look? No, deterministic.
      // Maybe slight rotation for softness?
      dummy.rotation.set(0, 0, 0); 
      dummy.updateMatrix();
      puffMesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  duvetGroup.add(puffMesh);

  // 4b. Duvet Fold (The part turned back over the pillows)
  // A thick, rounded shape at the head
  const foldGeom = new THREE.BoxGeometry(bedWidth - 0.1, 0.15, 0.3);
  const fold = new THREE.Mesh(foldGeom, fabricMat);
  fold.position.set(0, mattressHeight + 0.1, -bedLength / 2 + 0.25);
  // Round the front edge visually by scaling or just accept box for low poly
  duvetGroup.add(fold);

  // 4c. Duvet Skirts (Sides and Foot)
  // Left Skirt
  const sideSkirtGeom = new THREE.BoxGeometry(0.08, mattressHeight + 0.1, bedLength * 0.6);
  const leftSkirt = new THREE.Mesh(sideSkirtGeom, fabricMat);
  leftSkirt.position.set(-bedWidth / 2 - 0.04, mattressHeight / 2, quiltStartZ + (quiltRows * puffDepth) / 2);
  duvetGroup.add(leftSkirt);

  // Right Skirt
  const rightSkirt = new THREE.Mesh(sideSkirtGeom, fabricMat);
  rightSkirt.position.set(bedWidth / 2 + 0.04, mattressHeight / 2, quiltStartZ + (quiltRows * puffDepth) / 2);
  duvetGroup.add(rightSkirt);

  // Foot Skirt (The thick end at the bottom)
  const footSkirtGeom = new THREE.BoxGeometry(bedWidth + 0.1, mattressHeight + 0.15, 0.15);
  const footSkirt = new THREE.Mesh(footSkirtGeom, fabricMat);
  footSkirt.position.set(0, mattressHeight / 2, bedLength / 2 - 0.05);
  duvetGroup.add(footSkirt);
  
  // Fill the gap between the quilt top and the foot skirt
  const footTopGeom = new THREE.BoxGeometry(bedWidth - 0.1, 0.05, 0.2);
  const footTop = new THREE.Mesh(footTopGeom, fabricMat);
  footTop.position.set(0, mattressHeight + 0.05, bedLength / 2 - 0.2);
  duvetGroup.add(footTop);

  root.add(duvetGroup);

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