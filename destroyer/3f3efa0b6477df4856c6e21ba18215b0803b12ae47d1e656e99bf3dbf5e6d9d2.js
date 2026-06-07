export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Taupe fabric for bedding
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xbcaaa4,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Slightly darker fabric/wood for the bed base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x8d7b68,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Dark feet
  const footMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const baseHeight = 0.15;
  const mattressHeight = 0.30;
  const totalHeight = baseHeight + mattressHeight;
  
  const puffSize = 0.35; // Size of each quilted square
  const puffGap = 0.02;  // Gap between puffs (stitching line)

  // --- 1. Bed Base ---
  const baseGeom = new THREE.BoxGeometry(bedWidth + 0.1, baseHeight, bedLength + 0.1);
  const bed_base = new THREE.Mesh(baseGeom, baseMat);
  bed_base.position.y = baseHeight / 2;
  root.add(bed_base);

  // --- 2. Feet ---
  const footGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
  const footPositions = [
    [-(bedWidth/2 + 0.05), 0.04, -(bedLength/2 + 0.05)],
    [(bedWidth/2 + 0.05), 0.04, -(bedLength/2 + 0.05)],
    [-(bedWidth/2 + 0.05), 0.04, (bedLength/2 + 0.05)],
    [(bedWidth/2 + 0.05), 0.04, (bedLength/2 + 0.05)],
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // --- 3. Duvet / Comforter ---
  // We construct the duvet from a grid of "puffs" on top and side panels.
  
  const duvetGroup = new THREE.Group();
  root.add(duvetGroup);

  // Top surface puffs (Quilted grid)
  // Grid: 4 columns across width, ~5-6 rows along length
  const cols = 4;
  const rows = 6;
  const topStartZ = -(bedLength / 2) + 0.2; // Start slightly back from foot
  const topEndZ = (bedLength / 2) - 0.3;    // Stop before pillows
  
  // Calculate spacing to fit width
  const gridWidth = (cols * puffSize) + ((cols - 1) * puffGap);
  const startX = -gridWidth / 2 + puffSize / 2;
  
  const puffGeom = new THREE.BoxGeometry(puffSize, 0.12, puffSize, 4, 4, 4); // Segmented for softness

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (puffSize + puffGap);
      // Distribute along length
      const z = topStartZ + (r * (bedLength - 0.6) / rows); 
      
      // Add some random-looking variation to height for softness (deterministic based on index)
      const y = totalHeight + 0.02 + (Math.sin(c * 1.5 + r) * 0.01); 
      
      const puff = new THREE.Mesh(puffGeom, fabricMat);
      puff.position.set(x, y, z);
      // Slight random rotation for natural look
      puff.rotation.set(0, 0, (Math.cos(r) * 0.02)); 
      duvetGroup.add(puff);
    }
  }

  // Side Panels (Skirts)
  // Left Side
  const sideLeftGeom = new THREE.BoxGeometry(0.15, mattressHeight, bedLength - 0.4);
  const sideLeft = new THREE.Mesh(sideLeftGeom, fabricMat);
  sideLeft.position.set(-(bedWidth/2) - 0.05, baseHeight + mattressHeight/2, 0);
  sideLeft.rotation.z = 0.1; // Drape out slightly
  duvetGroup.add(sideLeft);

  // Right Side
  const sideRight = new THREE.Mesh(sideLeftGeom, fabricMat);
  sideRight.position.set((bedWidth/2) + 0.05, baseHeight + mattressHeight/2, 0);
  sideRight.rotation.z = -0.1;
  duvetGroup.add(sideRight);

  // Foot Side
  const sideFootGeom = new THREE.BoxGeometry(bedWidth + 0.4, mattressHeight, 0.15);
  const sideFoot = new THREE.Mesh(sideFootGeom, fabricMat);
  sideFoot.position.set(0, baseHeight + mattressHeight/2, -(bedLength/2) - 0.05);
  sideFoot.rotation.x = 0.1;
  duvetGroup.add(sideFoot);

  // Folded Top (near pillows)
  const foldGeom = new THREE.BoxGeometry(bedWidth - 0.2, 0.15, 0.4);
  const duvet_fold = new THREE.Mesh(foldGeom, fabricMat);
  duvet_fold.position.set(0, totalHeight + 0.05, (bedLength/2) - 0.25);
  duvetGroup.add(duvet_fold);


  // --- 4. Pillows ---
  const pillowGeom = new THREE.BoxGeometry(0.7, 0.15, 0.5);
  
  // Left Pillow
  const pillow_left = new THREE.Mesh(pillowGeom, fabricMat);
  pillow_left.position.set(-0.4, totalHeight + 0.15, (bedLength/2) - 0.3);
  pillow_left.rotation.x = -0.3; // Lean back
  pillow_left.rotation.z = 0.1;  // Slight tilt
  root.add(pillow_left);

  // Right Pillow
  const pillow_right = new THREE.Mesh(pillowGeom, fabricMat);
  pillow_right.position.set(0.4, totalHeight + 0.15, (bedLength/2) - 0.3);
  pillow_right.rotation.x = -0.3;
  pillow_right.rotation.z = -0.1;
  root.add(pillow_right);

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