export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const BAG_WIDTH = 0.60;
  const BAG_HEIGHT = 0.36;
  const BAG_DEPTH = 0.06;
  const CORNER_RADIUS = 0.025;
  
  // Quilting grid
  const PUFF_ROWS = 5;
  const PUFF_COLS = 9;
  const PUFF_SPACING_X = BAG_WIDTH / (PUFF_COLS + 0.5);
  const PUFF_SPACING_Y = BAG_HEIGHT / (PUFF_ROWS + 0.5);
  const PUFF_SIZE = 0.022;
  const PUFF_HEIGHT = 0.008; // How much they bulge

  // --- Materials ---
  // Leather: Burgundy, soft sheen
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x8a3345,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Stitching: Darker, matte thread
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x551a2b,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Helper: Rounded Box Composition ---
  // We build a "pillowy" box using a core and 4 edge cylinders
  
  // 1. Core Box (Inner volume)
  const coreW = BAG_WIDTH - CORNER_RADIUS * 2;
  const coreH = BAG_HEIGHT - CORNER_RADIUS * 2;
  const coreD = BAG_DEPTH - CORNER_RADIUS * 2; // Leave room for edges
  
  const coreGeom = new THREE.BoxGeometry(coreW, coreH, coreD);
  const core = new THREE.Mesh(coreGeom, leatherMat);
  root.add(core);

  // 2. Edge Cylinders (Top, Bottom, Left, Right)
  // Top Edge
  const topEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(CORNER_RADIUS, CORNER_RADIUS, coreW, 16, 1, false, Math.PI, Math.PI),
    leatherMat
  );
  topEdge.rotation.z = Math.PI / 2;
  topEdge.rotation.y = Math.PI / 2; // Align with X axis
  topEdge.position.set(0, coreH / 2 + CORNER_RADIUS / 2, 0);
  root.add(topEdge);

  // Bottom Edge
  const botEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(CORNER_RADIUS, CORNER_RADIUS, coreW, 16, 1, false, Math.PI, Math.PI),
    leatherMat
  );
  botEdge.rotation.z = Math.PI / 2;
  botEdge.rotation.y = Math.PI / 2;
  botEdge.position.set(0, -coreH / 2 - CORNER_RADIUS / 2, 0);
  root.add(botEdge);

  // Left Edge
  const leftEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(CORNER_RADIUS, CORNER_RADIUS, coreH, 16, 1, false, Math.PI, Math.PI),
    leatherMat
  );
  leftEdge.rotation.x = Math.PI / 2;
  leftEdge.rotation.y = Math.PI / 2; // Align with Y axis
  leftEdge.position.set(-coreW / 2 - CORNER_RADIUS / 2, 0, 0);
  root.add(leftEdge);

  // Right Edge
  const rightEdge = new THREE.Mesh(
    new THREE.CylinderGeometry(CORNER_RADIUS, CORNER_RADIUS, coreH, 16, 1, false, Math.PI, Math.PI),
    leatherMat
  );
  rightEdge.rotation.x = Math.PI / 2;
  rightEdge.rotation.y = Math.PI / 2;
  rightEdge.position.set(coreW / 2 + CORNER_RADIUS / 2, 0, 0);
  root.add(rightEdge);

  // 3. Corner Spheres (To fill the gaps between cylinders)
  const cornerGeom = new THREE.SphereGeometry(CORNER_RADIUS, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const corners = [
    { x: -1, y: 1, rotZ: 0, rotY: 0 }, // Top Left
    { x: 1, y: 1, rotZ: 0, rotY: Math.PI }, // Top Right
    { x: -1, y: -1, rotZ: Math.PI, rotY: 0 }, // Bottom Left
    { x: 1, y: -1, rotZ: Math.PI, rotY: Math.PI }, // Bottom Right
  ];
  
  // We need 1/4 spheres for the corners. 
  // Actually, simpler: Just use full spheres scaled or clipped? 
  // Easiest robust way: Use 4 SphereGeometries and rotate/scale them to fit corners.
  // Or just ignore perfect corners if the cylinders overlap enough? 
  // Let's add 4 small spheres at the corners to smooth it out.
  const cornerSphereGeom = new THREE.SphereGeometry(CORNER_RADIUS, 16, 16);
  const cornerPositions = [
    [-coreW/2 - CORNER_RADIUS/2, coreH/2 + CORNER_RADIUS/2, 0],
    [coreW/2 + CORNER_RADIUS/2, coreH/2 + CORNER_RADIUS/2, 0],
    [-coreW/2 - CORNER_RADIUS/2, -coreH/2 - CORNER_RADIUS/2, 0],
    [coreW/2 + CORNER_RADIUS/2, -coreH/2 - CORNER_RADIUS/2, 0],
  ];
  
  // To make them 1/4 spheres, we can scale them? No, scaling distorts.
  // Just use full spheres, they will be mostly hidden inside the bag volume or at the very edge.
  // Given the view is mostly front, full spheres at corners work fine to round the profile.
  for (const pos of cornerPositions) {
    const c = new THREE.Mesh(cornerSphereGeom, leatherMat);
    c.position.set(...pos);
    root.add(c);
  }

  // --- Quilting (Front Face) ---
  // We place puffs and stitches on the front surface (Z = coreD/2 + small offset)
  const surfaceZ = coreD / 2 + 0.002;

  // 1. Puffs (InstancedMesh)
  const puffGeom = new THREE.SphereGeometry(PUFF_SIZE, 16, 16);
  // Flatten the sphere to look like a leather puff
  puffGeom.scale(1, 1, 0.4); 
  
  const puffCount = PUFF_ROWS * PUFF_COLS;
  const puffMesh = new THREE.InstancedMesh(puffGeom, leatherMat, puffCount);
  const dummy = new THREE.Object3D();

  let idx = 0;
  const puffPositions = []; // Store for stitch calculation

  for (let r = 0; r < PUFF_ROWS; r++) {
    for (let c = 0; c < PUFF_COLS; c++) {
      const x = (c - (PUFF_COLS - 1) / 2) * PUFF_SPACING_X;
      const y = (r - (PUFF_ROWS - 1) / 2) * PUFF_SPACING_Y;
      
      dummy.position.set(x, y, surfaceZ + PUFF_HEIGHT);
      dummy.updateMatrix();
      puffMesh.setMatrixAt(idx++, dummy.matrix);
      puffPositions.push({ x, y });
    }
  }
  root.add(puffMesh);

  // 2. Stitches (InstancedMesh)
  // Diamond pattern: Diagonal lines between puffs
  // We need lines connecting (r,c) to (r+1, c+1) and (r+1, c-1)
  const stitchLen = Math.sqrt(2 * PUFF_SPACING_X * PUFF_SPACING_X); // Approx diagonal distance
  const stitchGeom = new THREE.BoxGeometry(PUFF_SPACING_X * 0.8, 0.004, 0.002); // Thin thread
  
  // Estimate max stitches: ~2 per puff
  const maxStitches = puffCount * 2;
  const stitchMesh = new THREE.InstancedMesh(stitchGeom, stitchMat, maxStitches);
  
  let sIdx = 0;
  
  for (let r = 0; r < PUFF_ROWS - 1; r++) {
    for (let c = 0; c < PUFF_COLS - 1; c++) {
      // Center of the diamond cell formed by 4 puffs
      const x1 = (c - (PUFF_COLS - 1) / 2) * PUFF_SPACING_X;
      const y1 = (r - (PUFF_ROWS - 1) / 2) * PUFF_SPACING_Y;
      
      const x2 = ((c + 1) - (PUFF_COLS - 1) / 2) * PUFF_SPACING_X;
      const y2 = ((r + 1) - (PUFF_ROWS - 1) / 2) * PUFF_SPACING_Y;
      
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      
      // Diagonal /
      dummy.position.set(centerX, centerY, surfaceZ + 0.001);
      dummy.rotation.z = Math.PI / 4;
      dummy.scale.set(1, 1, 1); // Reset scale from previous
      dummy.updateMatrix();
      if (sIdx < maxStitches) stitchMesh.setMatrixAt(sIdx++, dummy.matrix);

      // Diagonal \ (for the other set of diamonds)
      // We need to iterate carefully to cover the whole grid.
      // The loop above covers the "Down-Right" connections.
      // We also need "Down-Left" connections for the full diamond lattice.
    }
  }
  
  // Second pass for the other diagonal direction to complete the lattice
  for (let r = 0; r < PUFF_ROWS - 1; r++) {
    for (let c = 1; c < PUFF_COLS; c++) {
       const x1 = (c - (PUFF_COLS - 1) / 2) * PUFF_SPACING_X;
       const y1 = (r - (PUFF_ROWS - 1) / 2) * PUFF_SPACING_Y;
       
       const x2 = ((c - 1) - (PUFF_COLS - 1) / 2) * PUFF_SPACING_X;
       const y2 = ((r + 1) - (PUFF_ROWS - 1) / 2) * PUFF_SPACING_Y;
       
       const centerX = (x1 + x2) / 2;
       const centerY = (y1 + y2) / 2;
       
       dummy.position.set(centerX, centerY, surfaceZ + 0.001);
       dummy.rotation.z = -Math.PI / 4;
       dummy.scale.set(1, 1, 1);
       dummy.updateMatrix();
       if (sIdx < maxStitches) stitchMesh.setMatrixAt(sIdx++, dummy.matrix);
    }
  }
  
  // Update count to actual used
  stitchMesh.count = sIdx;
  root.add(stitchMesh);

  // --- Side Fold Detail (Optional but adds realism) ---
  // The image shows the side curving back smoothly. 
  // Our cylinder edges handle the main rounding. 
  // We can add a subtle back panel to close the volume.
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(coreW, coreH, 0.01),
    leatherMat
  );
  backPanel.position.set(0, 0, -coreD / 2 - 0.005);
  root.add(backPanel);

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