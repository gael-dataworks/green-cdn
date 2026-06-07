export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed silver: metalness capped at 0.6 to avoid black reflections, roughness 0.5 for brushed look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Dark interior / oxidized silver
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.7,
    roughness: 0.8,
  });

  // Gem materials (Physical for transmission/sparkle)
  function createGemMat(colorHex) {
    return new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.9,
      ior: 1.5,
      transparent: true,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
  }

  const gemColors = [0xffffff, 0x4488ff, 0xff88aa, 0x88ffaa, 0xffdd88];
  const gemMats = gemColors.map(c => createGemMat(c));

  // --- Dimensions ---
  const boxW = 0.6;
  const boxH = 0.35;
  const boxD = 0.5;
  const wallThick = 0.04;
  const cornerR = 0.06;

  // --- Base Group ---
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  // Base Outer Shell (Rounded Box approximation using Cylinder corners + Boxes)
  // To keep it simple and robust, we use a BoxGeometry for the main block and rely on lighting.
  // But to match the rounded look, let's compose it.
  
  // Central block
  const baseCoreGeom = new THREE.BoxGeometry(boxW - 2 * cornerR, boxH, boxD);
  const baseCore = new THREE.Mesh(baseCoreGeom, silverMat);
  baseGroup.add(baseCore);

  // Side blocks (Left/Right)
  const sideGeom = new THREE.BoxGeometry(cornerR * 2, boxH, boxD);
  const leftSide = new THREE.Mesh(sideGeom, silverMat);
  leftSide.position.set(-(boxW / 2 - cornerR), 0, 0);
  baseGroup.add(leftSide);
  const rightSide = new THREE.Mesh(sideGeom, silverMat);
  rightSide.position.set((boxW / 2 - cornerR), 0, 0);
  baseGroup.add(rightSide);

  // Corner cylinders (Front-Left, Front-Right, Back-Left, Back-Right)
  const cornerGeom = new THREE.CylinderGeometry(cornerR, cornerR, boxH, 8);
  // Rotate to stand vertically (default cylinder is Y-up, which is correct for height)
  // But we need quarter cylinders? No, full cylinders at corners overlap.
  // Let's just use full cylinders at the 4 corners for a "pill" shape effect.
  const cornerPositions = [
    [-(boxW/2 - cornerR), 0, -(boxD/2 - cornerR)],
    [(boxW/2 - cornerR), 0, -(boxD/2 - cornerR)],
    [-(boxW/2 - cornerR), 0, (boxD/2 - cornerR)],
    [(boxW/2 - cornerR), 0, (boxD/2 - cornerR)],
  ];
  
  for (const [x, y, z] of cornerPositions) {
    const corner = new THREE.Mesh(cornerGeom, silverMat);
    corner.position.set(x, y, z);
    baseGroup.add(corner);
  }

  // Base Interior (Hollow look)
  const innerW = boxW - 2 * wallThick;
  const innerH = boxH - wallThick;
  const innerD = boxD - 2 * wallThick;
  const baseInnerGeom = new THREE.BoxGeometry(innerW, innerH, innerD);
  const baseInner = new THREE.Mesh(baseInnerGeom, darkMat);
  baseInner.position.set(0, wallThick / 2, 0); // Sit on bottom
  baseGroup.add(baseInner);

  // --- Lid Group ---
  // Pivot point at the back top edge of the base
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, boxH / 2, -boxD / 2);
  root.add(lidGroup);

  // Rotate lid open (approx 100 degrees)
  lidGroup.rotation.x = -Math.PI * 0.55;

  // Lid Geometry (Similar to base but flatter/shorter)
  const lidH = 0.12;
  
  // Lid Core
  const lidCoreGeom = new THREE.BoxGeometry(boxW - 2 * cornerR, lidH, boxD);
  const lidCore = new THREE.Mesh(lidCoreGeom, silverMat);
  lidCore.position.set(0, lidH / 2, boxD / 2); // Offset to align pivot
  lidGroup.add(lidCore);

  // Lid Sides
  const lidLeft = new THREE.Mesh(sideGeom, silverMat); // Reuse sideGeom (height matches base, adjust scale if needed)
  // Actually lid sides should be lidH high.
  const lidSideGeom = new THREE.BoxGeometry(cornerR * 2, lidH, boxD);
  const lidLeftSide = new THREE.Mesh(lidSideGeom, silverMat);
  lidLeftSide.position.set(-(boxW / 2 - cornerR), lidH / 2, boxD / 2);
  lidGroup.add(lidLeftSide);
  
  const lidRightSide = new THREE.Mesh(lidSideGeom, silverMat);
  lidRightSide.position.set((boxW / 2 - cornerR), lidH / 2, boxD / 2);
  lidGroup.add(lidRightSide);

  // Lid Corners
  const lidCornerGeom = new THREE.CylinderGeometry(cornerR, cornerR, lidH, 8);
  const lidCornerPositions = [
    [-(boxW/2 - cornerR), lidH/2, -(boxD/2 - cornerR) + boxD], // Back Left (relative to lid local)
    [(boxW/2 - cornerR), lidH/2, -(boxD/2 - cornerR) + boxD],  // Back Right
    [-(boxW/2 - cornerR), lidH/2, (boxD/2 - cornerR) + boxD],  // Front Left
    [(boxW/2 - cornerR), lidH/2, (boxD/2 - cornerR) + boxD],   // Front Right
  ];
  // Wait, lid local Z is 0 at hinge. Base depth is boxD. Lid extends +Z.
  // So corners are at z=0 (hinge) and z=boxD (front).
  // Correcting positions relative to lidGroup (pivot at back-top of base):
  // Lid extends from z=0 to z=boxD.
  const lcp = [
    [-(boxW/2 - cornerR), lidH/2, cornerR],       // Back Left
    [(boxW/2 - cornerR), lidH/2, cornerR],        // Back Right
    [-(boxW/2 - cornerR), lidH/2, boxD - cornerR],// Front Left
    [(boxW/2 - cornerR), lidH/2, boxD - cornerR], // Front Right
  ];

  for (const [x, y, z] of lcp) {
    const c = new THREE.Mesh(lidCornerGeom, silverMat);
    c.position.set(x, y, z);
    lidGroup.add(c);
  }

  // Lid Interior
  const lidInnerGeom = new THREE.BoxGeometry(innerW, lidH - wallThick, innerD);
  const lidInner = new THREE.Mesh(lidInnerGeom, darkMat);
  lidInner.position.set(0, wallThick/2, boxD/2);
  lidGroup.add(lidInner);

  // --- Hinge ---
  const hingeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 12);
  hingeGeom.rotateZ(Math.PI / 2); // Align along X
  const hinge = new THREE.Mesh(hingeGeom, silverMat);
  hinge.position.set(0, 0, 0); // At pivot
  root.add(hinge); // Hinge stays with base/pivot point, effectively connecting them

  // --- Handle (Pull Ring) ---
  // Attached to front face of base
  const handleTorus = new THREE.TorusGeometry(0.05, 0.012, 8, 16);
  const handle = new THREE.Mesh(handleTorus, silverMat);
  handle.position.set(0, 0, boxD / 2 + 0.02);
  handle.rotation.x = Math.PI / 2; // Face forward (Z)
  baseGroup.add(handle);
  
  // Handle mount (small bar)
  const handleMount = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), silverMat);
  handleMount.rotation.z = Math.PI / 2;
  handleMount.position.set(0, 0, boxD / 2 + 0.01);
  baseGroup.add(handleMount);

  // --- Gems ---
  // Gem geometry: Small sphere or cylinder
  const gemGeom = new THREE.SphereGeometry(0.025, 16, 16);
  
  function addGem(x, y, z, colorIndex, parent) {
    const mat = gemMats[colorIndex % gemMats.length];
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(x, y, z);
    // Slightly offset outward to sit on surface
    parent.add(gem);
  }

  // Lid Gems (Grid pattern on top surface)
  // Top surface is at y = lidH (relative to lidGroup) + some offset for curvature? 
  // Our lid is flat boxes. Top is y = lidH.
  const gemRows = 3;
  const gemCols = 5;
  const gemSpacingX = (boxW - 0.1) / gemCols;
  const gemSpacingZ = (boxD - 0.1) / gemRows;
  
  for (let r = 0; r < gemRows; r++) {
    for (let c = 0; c < gemCols; c++) {
      const gx = -boxW/2 + 0.1 + c * gemSpacingX + (r%2)*0.03; // Staggered
      const gz = 0.1 + r * gemSpacingZ;
      const gy = lidH + 0.025; // Sit on top
      // Random-ish color selection based on index
      addGem(gx, gy, gz, (r * 5 + c) % 5, lidGroup);
    }
  }

  // Base Side Gems (Scattered on front and sides)
  // Front face: z = boxD/2
  const frontGemPositions = [
    [-0.2, 0.05], [0.0, 0.15], [0.2, 0.05], [-0.1, -0.1], [0.15, -0.15]
  ];
  for (const [x, y] of frontGemPositions) {
    addGem(x, y, boxD/2 + 0.025, (x*10)%5, baseGroup);
  }
  
  // Side faces
  const sideGemPositions = [
    [-boxW/2 - 0.025, 0.1, 0.1],
    [-boxW/2 - 0.025, -0.1, -0.1],
    [boxW/2 + 0.025, 0.0, 0.2],
    [boxW/2 + 0.025, -0.15, -0.2]
  ];
  for (const [x, y, z] of sideGemPositions) {
    addGem(x, y, z, (y*10)%5, baseGroup);
  }

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