export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gray upholstered base
  const baseMat = new THREE.MeshStandardMaterial({
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
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Light gray/beige duvet and pillows
  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Tan throw blanket
  const throwMat = new THREE.MeshStandardMaterial({
    color: 0xc4a582,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const baseHeight = 0.30;
  const mattressThickness = 0.28;
  const legHeight = 0.12;
  const legRadius = 0.04;

  // --- 1. Base Frame ---
  const baseGeom = new THREE.BoxGeometry(bedWidth, baseHeight, bedLength);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- 2. Legs ---
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
  const legOffsets = [
    { x: -1, z: -1 }, { x: 1, z: -1 },
    { x: -1, z: 1 }, { x: 1, z: 1 }
  ];
  
  for (const offset of legOffsets) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(
      offset.x * (bedWidth / 2 - 0.1),
      legHeight / 2,
      offset.z * (bedLength / 2 - 0.1)
    );
    root.add(leg);
  }

  // --- 3. Mattress ---
  // Slightly smaller than base to sit inside/on top
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.05, mattressThickness, bedLength - 0.05);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = baseHeight + mattressThickness / 2;
  root.add(mattress);

  // --- 4. Pillows ---
  // Two flattened spheres at the head
  const pillowGeom = new THREE.SphereGeometry(0.35, 24, 16);
  const pillowPositions = [
    { x: -0.45, z: -0.75, rot: 0.2 },
    { x: 0.45, z: -0.75, rot: -0.2 }
  ];

  for (const p of pillowPositions) {
    const pillow = new THREE.Mesh(pillowGeom, linenMat);
    pillow.scale.set(1.2, 0.35, 0.8); // Flatten and widen
    pillow.position.set(p.x, baseHeight + mattressThickness + 0.1, p.z);
    pillow.rotation.x = -0.3; // Lean back
    pillow.rotation.z = p.rot; // Angle slightly inward/outward
    root.add(pillow);
  }

  // --- 5. Duvet (Main Cover) ---
  // Use a plane with vertex displacement to simulate soft folds
  const duvetSegments = 30;
  const duvetGeom = new THREE.PlaneGeometry(bedWidth - 0.1, bedLength - 0.1, duvetSegments, duvetSegments);
  
  // Displace vertices to create organic folds
  const posAttr = duvetGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i); // This is actually Z in local space before rotation
    
    // Simple deterministic noise for folds
    const fold = Math.sin(x * 3.0) * 0.03 + Math.cos(y * 2.0) * 0.04;
    // Add a "pillow bump" at the head
    const headBump = (y < -0.5) ? Math.exp(-Math.pow(y + 0.8, 2) * 10) * 0.15 : 0;
    
    posAttr.setZ(i, fold + headBump);
  }
  duvetGeom.computeVertexNormals();

  const duvet = new THREE.Mesh(duvetGeom, linenMat);
  duvet.rotation.x = -Math.PI / 2; // Lay flat
  duvet.position.y = baseHeight + mattressThickness + 0.02; // Slightly above mattress
  root.add(duvet);

  // --- 6. Throw Blanket ---
  // Smaller displaced plane, rotated and placed at foot-left
  const throwW = 0.7;
  const throwL = 0.9;
  const throwGeom = new THREE.PlaneGeometry(throwW, throwL, 20, 20);
  const tPosAttr = throwGeom.attributes.position;
  
  for (let i = 0; i < tPosAttr.count; i++) {
    const x = tPosAttr.getX(i);
    const y = tPosAttr.getY(i);
    // More chaotic folds for the throw
    const fold = Math.sin(x * 5.0 + y * 3.0) * 0.04 + Math.cos(x * 2.0) * 0.03;
    // Drape curve
    const drape = (x > 0.1) ? (x - 0.1) * 0.1 : 0; 
    tPosAttr.setZ(i, fold + drape);
  }
  throwGeom.computeVertexNormals();

  const throwBlanket = new THREE.Mesh(throwGeom, throwMat);
  throwBlanket.rotation.x = -Math.PI / 2;
  throwBlanket.rotation.z = 0.3; // Angled across the corner
  throwBlanket.position.set(-0.3, baseHeight + mattressThickness + 0.06, 0.4);
  root.add(throwBlanket);

  // --- 7. Throw Fringes ---
  // Small cylinders hanging from the edge of the throw
  const fringeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6);
  const fringeCount = 12;
  
  for (let i = 0; i < fringeCount; i++) {
    const t = i / (fringeCount - 1);
    // Position along the bottom edge of the throw (local X axis of the plane)
    const localX = (t - 0.5) * throwW;
    const localZ = throwL / 2; 
    
    // Transform to world space roughly matching the throw's position/rotation
    // Simplified: just place them relative to the throw mesh
    const fringe = new THREE.Mesh(fringeGeom, throwMat);
    fringe.position.set(localX, -0.04, localZ); // Hang down (-Y in plane local, but plane is rotated)
    // Since plane is rotated X -90, local Y is world Z (up/down relative to plane), local Z is world Y (up)
    // Wait, PlaneGeometry is XY. Rotated X -90 makes it XZ plane.
    // So local Y is World -Z (down into bed). Local Z is World Y (up).
    // We want fringes to hang down in World Y.
    // So we need to rotate the fringe cylinders to point down World Y.
    
    fringe.rotation.x = Math.PI / 2; // Point along Z
    fringe.position.set(localX, 0, localZ); // On the plane surface
    
    // Parent to throw so they move together, but we need to adjust orientation
    // Actually, easier to just add them to the throw mesh group if we had one, 
    // but let's just add to root and calculate pos.
    // Or simpler: Add to throwBlanket, but rotate the fringe to hang "down" relative to the draped cloth.
    // Given the complexity, let's just attach to the throw mesh and let the throw's rotation handle it mostly,
    // but fringes need to point to world -Y.
    
    // Let's skip complex fringe physics and just add static cylinders to the root at the throw location
    // to simulate the look without heavy math.
    const worldPos = new THREE.Vector3(localX, 0, localZ).applyMatrix4(throwBlanket.matrixWorld);
    const f = new THREE.Mesh(fringeGeom, throwMat);
    f.position.copy(worldPos);
    f.position.y -= 0.04; // Hang down
    root.add(f);
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