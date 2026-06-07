export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gray upholstered base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3d3d3d,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Black legs (metal or dark wood)
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  // White mattress fabric
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Light gray duvet
  const duvetMat = new THREE.MeshStandardMaterial({
    color: 0xe8e8e8,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Pillow fabric (slightly different shade)
  const pillowMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Beige throw blanket
  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xbcaaa4,
    metalness: 0.0,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const baseHeight = 0.25;
  const mattressThickness = 0.35;
  const legHeight = 0.12;
  const legRadius = 0.04;

  // --- 1. Bed Frame Base ---
  // Using a BoxGeometry for the main upholstered frame
  const baseGeom = new THREE.BoxGeometry(bedWidth + 0.1, baseHeight, bedLength + 0.1);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- 2. Legs ---
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
  const legPositions = [
    { x: (bedWidth / 2) - 0.1, z: (bedLength / 2) - 0.1 }, // Front Right (Z+)
    { x: -(bedWidth / 2) + 0.1, z: (bedLength / 2) - 0.1 }, // Front Left
    { x: (bedWidth / 2) - 0.1, z: -(bedLength / 2) + 0.1 }, // Back Right
    { x: -(bedWidth / 2) + 0.1, z: -(bedLength / 2) + 0.1 }, // Back Left
  ];

  legPositions.forEach((pos, index) => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(pos.x, legHeight / 2, pos.z);
    root.add(leg);
  });

  // --- 3. Mattress ---
  // Using a scaled SphereGeometry to get soft, rounded corners naturally
  const mattressGeom = new THREE.SphereGeometry(1, 32, 24);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  // Scale to bed dimensions: X=width, Y=thickness, Z=length
  // We add a little extra to mattress size so it overhangs the base slightly
  mattress.scale.set(bedWidth / 2 + 0.05, mattressThickness / 2, bedLength / 2 + 0.05);
  mattress.position.y = baseHeight + mattressThickness / 2;
  root.add(mattress);

  // --- 4. Duvet / Comforter ---
  // Main body of the duvet (scaled sphere/box hybrid feel)
  const duvetGeom = new THREE.SphereGeometry(1, 32, 24);
  const duvet = new THREE.Mesh(duvetGeom, duvetMat);
  // Slightly larger than mattress to look draped
  duvet.scale.set(bedWidth / 2 + 0.08, (mattressThickness * 0.8) / 2, bedLength / 2 + 0.08);
  duvet.position.y = baseHeight + mattressThickness + (mattressThickness * 0.2);
  duvet.position.z = 0.1; // Shifted slightly towards foot
  root.add(duvet);

  // Duvet fold at the head (a rolled cylinder shape)
  const duvetFoldGeom = new THREE.CylinderGeometry(0.15, 0.15, bedWidth + 0.2, 24);
  const duvetFold = new THREE.Mesh(duvetFoldGeom, duvetMat);
  duvetFold.rotation.z = Math.PI / 2;
  duvetFold.position.set(0, baseHeight + mattressThickness + 0.15, -bedLength / 2 + 0.3);
  root.add(duvetFold);

  // --- 5. Pillows ---
  // Using flattened spheres for soft pillow look
  const pillowGeom = new THREE.SphereGeometry(0.35, 24, 16);
  
  // Left Pillow
  const pillowLeft = new THREE.Mesh(pillowGeom, pillowMat);
  pillowLeft.scale.set(1.4, 0.6, 1.0); // Flatten and widen
  pillowLeft.position.set(-0.4, baseHeight + mattressThickness + 0.15, -bedLength / 2 + 0.4);
  pillowLeft.rotation.x = -0.3; // Tilted back
  pillowLeft.rotation.z = 0.1;
  root.add(pillowLeft);

  // Right Pillow
  const pillowRight = new THREE.Mesh(pillowGeom, pillowMat);
  pillowRight.scale.set(1.4, 0.6, 1.0);
  pillowRight.position.set(0.4, baseHeight + mattressThickness + 0.15, -bedLength / 2 + 0.4);
  pillowRight.rotation.x = -0.3;
  pillowRight.rotation.z = -0.1;
  root.add(pillowRight);

  // --- 6. Throw Blanket ---
  // Create a custom geometry for the draped throw
  const throwWidth = 0.6;
  const throwLength = 1.2;
  const throwSegmentsW = 20;
  const throwSegmentsL = 40;
  const throwGeom = new THREE.PlaneGeometry(throwWidth, throwLength, throwSegmentsW, throwSegmentsL);
  
  // Modify vertices to create draping and folds
  const posAttribute = throwGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < posAttribute.count; i++) {
    vertex.fromBufferAttribute(posAttribute, i);
    
    // Local coordinates: x is width (-0.3 to 0.3), y is length (-0.6 to 0.6)
    // We want to drape it across the bed.
    // Let's create a fold near one end.
    
    const u = (vertex.x + throwWidth / 2) / throwWidth; // 0 to 1
    const v = (vertex.y + throwLength / 2) / throwLength; // 0 to 1
    
    // Add some noise/waves for fabric feel
    const wave = Math.sin(u * Math.PI * 4) * 0.02 + Math.cos(v * Math.PI * 6) * 0.02;
    
    // Drape curve: higher in middle, lower at edges
    const drape = Math.sin(u * Math.PI) * 0.1;
    
    // Fold simulation: lift one end
    let zOffset = 0;
    if (v > 0.7) {
        zOffset = (v - 0.7) * 0.5; // Lift the end
    }
    
    // Apply modifications to Y (which is Z in world space after rotation)
    // PlaneGeometry is in XY plane. We will rotate it to XZ later.
    // So we modify vertex.z for height in local space before rotation? 
    // No, PlaneGeometry is flat on Z=0. We need to displace Z.
    
    vertex.z = wave + drape + zOffset;
    
    posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  throwGeom.computeVertexNormals();
  
  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  // Position: Across the foot/middle of the bed
  throwBlanket.rotation.x = -Math.PI / 2; // Lay flat on XZ plane
  throwBlanket.position.set(-0.3, baseHeight + mattressThickness + 0.05, 0.2);
  throwBlanket.rotation.z = 0.5; // Angle it slightly
  root.add(throwBlanket);

  // --- 7. Throw Fringe ---
  // Small cylinders along the edge of the throw
  const fringeCount = 15;
  const fringeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 8);
  const fringeMat = new THREE.MeshStandardMaterial({ color: 0xbcaaa4, metalness: 0.0, roughness: 0.9 });
  
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    const fringe = new THREE.Mesh(fringeGeom, fringeMat);
    
    // Position along the edge of the throw
    // The throw is rotated and positioned. We need to calculate world-ish positions relative to throw parent.
    // Simplified: Place them in a line along the throw's edge in local space of the throw, 
    // but since throw is rotated, it's easier to add them to root and calculate positions.
    
    // Let's approximate the edge line based on throw position and rotation
    const edgeX = -0.3 + (t * 0.6 * Math.cos(0.5)) - (0 * Math.sin(0.5)); // Approximate
    const edgeZ = 0.2 + (t * 0.6 * Math.sin(0.5)) + (0 * Math.cos(0.5));
    
    // Actually, simpler: The throw is a plane rotated -90 deg X. 
    // Its local Y axis corresponds to world Z (length). Its local X corresponds to world X (width).
    // The fringe is on the "bottom" edge in local UVs? Let's just place them manually relative to the blanket mesh.
    
    // Re-approach: Add fringe as children of the throwBlanket? 
    // If we add as children, we need to account for the throwBlanket's rotation.
    // The throwBlanket is rotated X -90. So local Y is Up. Local Z is Forward.
    // The fringe should hang down (local -Y).
    
    const fringeLocalX = (t - 0.5) * throwWidth;
    const fringeLocalY = throwLength / 2; // At the end
    
    fringe.position.set(fringeLocalX, fringeLocalY, 0);
    fringe.rotation.x = Math.PI / 2; // Point down along -Y
    fringe.position.y -= 0.04; // Half length
    
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