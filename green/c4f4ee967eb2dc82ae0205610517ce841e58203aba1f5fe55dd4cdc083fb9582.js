export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const bedWidth = 1.60;
  const bedLength = 2.10;
  const frameHeight = 0.30;
  const legHeight = 0.15;
  const legRadius = 0.04;
  const mattressThickness = 0.25;
  
  // --- Materials ---
  // Dark gray upholstered frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark legs (metal or dark wood)
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.6,
  });

  // White mattress
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // White duvet (slightly brighter/cleaner)
  const duvetMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Beige throw blanket
  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // --- 1. Bed Frame ---
  // A thick platform box. Slightly inset from the absolute outer edge for style.
  const frameGeom = new THREE.BoxGeometry(bedWidth, frameHeight, bedLength);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.y = frameHeight / 2 + legHeight;
  root.add(frame);

  // --- 2. Legs ---
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
  const legOffsetX = bedWidth / 2 - 0.1;
  const legOffsetZ = bedLength / 2 - 0.1;
  
  const legPositions = [
    [ legOffsetX, legHeight / 2,  legOffsetZ],
    [-legOffsetX, legHeight / 2,  legOffsetZ],
    [ legOffsetX, legHeight / 2, -legOffsetZ],
    [-legOffsetX, legHeight / 2, -legOffsetZ],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- 3. Mattress ---
  // Slightly smaller than frame to sit inside/on top
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.04, mattressThickness, bedLength - 0.04);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = frameHeight + legHeight + mattressThickness / 2;
  root.add(mattress);

  // --- 4. Duvet ---
  // Covers the mattress, puffy.
  const duvetGeom = new THREE.BoxGeometry(bedWidth - 0.02, mattressThickness + 0.05, bedLength - 0.1);
  const duvet = new THREE.Mesh(duvetGeom, duvetMat);
  // Positioned slightly higher to look puffy, shifted slightly towards foot (-Z)
  duvet.position.y = frameHeight + legHeight + mattressThickness + 0.02;
  duvet.position.z = -0.05; 
  root.add(duvet);

  // Duvet fold at the head (simplified as a separate flattened box rotated)
  const foldGeom = new THREE.BoxGeometry(bedWidth - 0.1, 0.08, 0.25);
  const fold = new THREE.Mesh(foldGeom, duvetMat);
  fold.position.set(0, frameHeight + legHeight + mattressThickness + 0.15, bedLength / 2 - 0.2);
  fold.rotation.x = -Math.PI / 6; // Lean back slightly
  root.add(fold);

  // --- 5. Pillows ---
  // Two pillows at the head (+Z)
  const pillowWidth = 0.75;
  const pillowDepth = 0.50;
  const pillowHeight = 0.15;
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowDepth);
  
  const pillowLeft = new THREE.Mesh(pillowGeom, duvetMat);
  pillowLeft.position.set(-bedWidth / 4, frameHeight + legHeight + mattressThickness + 0.1, bedLength / 2 - 0.3);
  pillowLeft.rotation.x = -0.3; // Leaning back
  pillowLeft.rotation.z = 0.1;  // Slight tilt
  root.add(pillowLeft);

  const pillowRight = new THREE.Mesh(pillowGeom, duvetMat);
  pillowRight.position.set(bedWidth / 4, frameHeight + legHeight + mattressThickness + 0.1, bedLength / 2 - 0.3);
  pillowRight.rotation.x = -0.3;
  pillowRight.rotation.z = -0.1;
  root.add(pillowRight);

  // --- 6. Throw Blanket ---
  // Draped over the foot corner (negative Z, negative X side based on image)
  // We use a PlaneGeometry and modify vertices to create the drape shape
  const throwWidth = 0.7;
  const throwLength = 1.1;
  const throwSegments = 20;
  const throwGeom = new THREE.PlaneGeometry(throwWidth, throwLength, throwSegments, throwSegments);
  
  // Access position attribute to modify vertices
  const posAttr = throwGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  // We want the blanket to lie mostly flat but bunch up at one corner
  // Local coords of plane: X [-w/2, w/2], Y [-h/2, h/2] (before rotation)
  // We will rotate it later to lie on XZ plane.
  
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    // Normalize coords to -1 to 1 range for calculation
    const nx = vertex.x / (throwWidth / 2);
    const ny = vertex.y / (throwLength / 2); // This is the 'length' along the blanket
    
    // Create a "bunch" near the top-left corner of the blanket (before rotation)
    // Let's say the bunch is at x=-1, y=1 (top-left in UV space of plane)
    // Distance from bunch point
    const dist = Math.sqrt(Math.pow(nx - (-1), 2) + Math.pow(ny - 1, 2));
    
    // Lift vertices close to the bunch point
    if (dist < 1.2) {
      const lift = Math.max(0, (1.2 - dist) * 0.15);
      vertex.z += lift; // Z is the normal of the plane before rotation
    }
    
    // Add some noise/waviness to the rest to look like fabric
    const wave = Math.sin(nx * 5) * Math.cos(ny * 5) * 0.01;
    vertex.z += wave;

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  throwGeom.computeVertexNormals();

  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  
  // Position the blanket
  // It sits on the foot of the bed.
  // Bed foot is at -Z. Blanket draped over the left corner (-X).
  throwBlanket.position.set(-bedWidth / 4, frameHeight + legHeight + mattressThickness + 0.03, -bedLength / 2 + 0.2);
  throwBlanket.rotation.x = Math.PI / 2; // Lay flat on XZ
  throwBlanket.rotation.z = Math.PI / 4; // Rotate to align with corner
  
  root.add(throwBlanket);

  // --- 7. Fringes ---
  // Small cylinders hanging from the edge of the throw
  const fringeCount = 12;
  const fringeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8);
  const fringeMat = new THREE.MeshStandardMaterial({ color: 0xc4a47c, metalness: 0.0, roughness: 0.9 });
  
  // We need to place them along the edge of the throw blanket
  // The throw is rotated. We can just place them in world space relative to the blanket position
  // Or simpler: Add them as children of the throwBlanket mesh so they move with it.
  // But the throwBlanket is rotated. Let's calculate positions in local space of the blanket.
  // The "bottom" edge of the plane geometry (before rotation) is at y = -throwLength/2.
  // Wait, in my drape logic, the bunch was at y=1 (top). So the hanging edge is y=-1 (bottom).
  
  const fringeStartY = -throwLength / 2 + 0.05;
  const fringeEndY = -throwLength / 2 + 0.05; // It's a line along X
  
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    const fx = -throwWidth / 2 + t * throwWidth;
    const fy = -throwLength / 2 + 0.05; // Slightly up from absolute edge
    
    const fringe = new THREE.Mesh(fringeGeom, fringeMat);
    // In plane local space, Z is up. We want fringe to hang down (-Z).
    // But the plane is rotated. 
    // Easier: Just add them to the root and calculate world positions, 
    // OR add to throwBlanket and orient them correctly relative to the blanket surface.
    
    // Let's add to throwBlanket.
    // Local position on the plane surface:
    fringe.position.set(fx, fy, -0.04); // Hang down from surface (negative Z in plane local)
    // No rotation needed if cylinder is Y-up and we want it to hang along -Z? 
    // Cylinder is Y-up. We want it along -Z. Rotate X 90 deg.
    fringe.rotation.x = Math.PI / 2;
    
    throwBlanket.add(fringe);
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