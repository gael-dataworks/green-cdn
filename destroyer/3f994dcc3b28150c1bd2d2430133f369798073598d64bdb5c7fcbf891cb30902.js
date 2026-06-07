export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const bookW = 0.32;      // Width (X)
  const bookH = 0.44;      // Height (Y)
  const bookD = 0.06;      // Thickness (Z)
  const coverOverhang = 0.005;
  const spineR = 0.015;    // Radius of spine curve

  // --- Materials ---
  // Leather: Dark green, matte/satin finish
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3e,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Paper: Aged beige
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc5,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Gold: Embossed decoration
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- 1. Paper Block (The Pages) ---
  // Slightly smaller than cover, visible at the fore-edge (front)
  const paperW = bookW - 0.008;
  const paperH = bookH - 0.008;
  const paperD = bookD - 0.004;
  const paper_block = new THREE.Mesh(
    new THREE.BoxGeometry(paperW, paperH, paperD),
    paperMat
  );
  // Position so the spine aligns with cover spine, but front is exposed
  // Cover spine is at -bookW/2. Paper spine should be slightly inside.
  paper_block.position.set(-0.002, 0, 0); 
  root.add(paper_block);

  // --- 2. Cover Structure ---
  const coverGroup = new THREE.Group();
  root.add(coverGroup);

  // Front Board
  const frontBoard = new THREE.Mesh(
    new THREE.BoxGeometry(bookW, bookH, 0.004),
    leatherMat
  );
  frontBoard.position.set(0, 0, paperD / 2 + 0.002);
  coverGroup.add(frontBoard);

  // Back Board
  const backBoard = new THREE.Mesh(
    new THREE.BoxGeometry(bookW, bookH, 0.004),
    leatherMat
  );
  backBoard.position.set(0, 0, -paperD / 2 - 0.002);
  coverGroup.add(backBoard);

  // Spine (Rounded Cylinder Segment)
  // Cylinder is Y-up. We need it along Y, curved in XZ.
  // Radius = spineR. Angle = ~90 degrees (PI/2).
  const spineGeom = new THREE.CylinderGeometry(spineR, spineR, bookH, 8, 1, false, 0, Math.PI / 2);
  const spine = new THREE.Mesh(spineGeom, leatherMat);
  // Rotate to align curve with X axis (spine runs along Y)
  // Default cylinder is along Y. Open part faces +X.
  // We want spine at the back (-X side of book).
  spine.rotation.z = Math.PI; // Flip open side to -X
  spine.position.set(-bookW / 2 + spineR, 0, 0);
  coverGroup.add(spine);

  // Spine Caps (Top and Bottom of the spine curve)
  const spineCapGeom = new THREE.SphereGeometry(spineR, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
  const spineCapTop = new THREE.Mesh(spineCapGeom, leatherMat);
  spineCapTop.rotation.z = Math.PI;
  spineCapTop.rotation.y = Math.PI / 2;
  spineCapTop.position.set(-bookW / 2 + spineR, bookH / 2, 0);
  coverGroup.add(spineCapTop);

  const spineCapBot = new THREE.Mesh(spineCapGeom, leatherMat);
  spineCapBot.rotation.z = 0;
  spineCapBot.rotation.y = -Math.PI / 2;
  spineCapBot.position.set(-bookW / 2 + spineR, -bookH / 2, 0);
  coverGroup.add(spineCapBot);

  // --- 3. Gold Decorations (Front Cover) ---
  
  // Border Line (Thin box frame)
  const borderW = bookW - 0.04;
  const borderH = bookH - 0.04;
  const borderThick = 0.001;
  // Top/Bottom
  addBox(borderW, borderThick, 0.001, goldMat, 0, borderH / 2, frontBoard.position.z + 0.001);
  addBox(borderW, borderThick, 0.001, goldMat, 0, -borderH / 2, frontBoard.position.z + 0.001);
  // Left/Right
  addBox(borderThick, borderH, 0.001, goldMat, -borderW / 2, 0, frontBoard.position.z + 0.001);
  addBox(borderThick, borderH, 0.001, goldMat, borderW / 2, 0, frontBoard.position.z + 0.001);

  // Corner Flourishes (Procedural Shapes)
  // Using small flattened boxes to simulate embossed gold leaf patterns
  function addCornerDecor(x, y, rotZ) {
    const group = new THREE.Group();
    group.position.set(x, y, frontBoard.position.z + 0.0015);
    group.rotation.z = rotZ;
    
    // Central motif
    const center = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.001), goldMat);
    group.add(center);
    
    // Leaves/Petals
    const leafGeom = new THREE.BoxGeometry(0.015, 0.008, 0.001);
    const l1 = new THREE.Mesh(leafGeom, goldMat);
    l1.position.set(0.01, 0.005, 0);
    l1.rotation.z = 0.5;
    group.add(l1);
    
    const l2 = new THREE.Mesh(leafGeom, goldMat);
    l2.position.set(0.01, -0.005, 0);
    l2.rotation.z = -0.5;
    group.add(l2);
    
    const l3 = new THREE.Mesh(leafGeom, goldMat);
    l3.position.set(-0.01, 0.005, 0);
    l3.rotation.z = 2.5;
    group.add(l3);

    const l4 = new THREE.Mesh(leafGeom, goldMat);
    l4.position.set(-0.01, -0.005, 0);
    l4.rotation.z = -2.5;
    group.add(l4);

    coverGroup.add(group);
  }

  // 4 Corners
  addCornerDecor(borderW / 2 - 0.01, borderH / 2 - 0.01, 0); // Top Right
  addCornerDecor(-borderW / 2 + 0.01, borderH / 2 - 0.01, Math.PI / 2); // Top Left
  addCornerDecor(-borderW / 2 + 0.01, -borderH / 2 + 0.01, Math.PI); // Bottom Left
  addCornerDecor(borderW / 2 - 0.01, -borderH / 2 + 0.01, -Math.PI / 2); // Bottom Right

  // Small center accent
  const centerAccent = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.001), goldMat);
  centerAccent.position.set(0, 0, frontBoard.position.z + 0.0015);
  coverGroup.add(centerAccent);


  // --- 4. Spine Decorations (DataTexture for "Daniel" and Bands) ---
  // Since we can't load fonts, we generate a texture for the spine details.
  const spineW = 64;
  const spineH = 256;
  const spineData = new Uint8Array(spineW * spineH * 4);
  
  // Fill with transparent green (match leather roughly but alpha 0)
  // Actually, we map this ON TOP of the leather material or as a decal?
  // Best approach: Create a decal mesh that wraps the spine.
  
  for (let i = 0; i < spineW * spineH; i++) {
    spineData[i * 4] = 212;     // R (Gold)
    spineData[i * 4 + 1] = 175; // G
    spineData[i * 4 + 2] = 55;  // B
    spineData[i * 4 + 3] = 0;   // Alpha (start transparent)
  }

  // Helper to draw rect on texture
  function drawRect(tx, ty, tw, th) {
    for (let y = ty; y < ty + th; y++) {
      for (let x = tx; x < tx + tw; x++) {
        if (x >= 0 && x < spineW && y >= 0 && y < spineH) {
          const idx = (y * spineW + x) * 4;
          spineData[idx + 3] = 255; // Opaque gold
        }
      }
    }
  }

  // Draw Bands (Horizontal lines)
  // Top Band
  drawRect(5, 20, 54, 4);
  drawRect(5, 26, 54, 2);
  // Middle Bands (around text)
  drawRect(5, 100, 54, 3);
  drawRect(5, 130, 54, 3);
  // Bottom Band
  drawRect(5, 230, 54, 4);
  drawRect(5, 236, 54, 2);

  // Draw "Daniel" approximation (Pixel art style text)
  // D
  for(let y=140; y<180; y++) { drawRect(10, y, 2, 1); drawRect(10, 140, 10, 2); drawRect(10, 178, 10, 2); drawRect(18, 150, 2, 20); }
  // a
  for(let y=150; y<178; y++) { drawRect(24, y, 2, 1); } drawRect(24, 165, 8, 2); drawRect(30, 150, 2, 15);
  // n
  for(let y=150; y<178; y++) { drawRect(36, y, 2, 1); } drawRect(36, 150, 8, 2); drawRect(42, 150, 2, 28);
  // i
  drawRect(48, 155, 2, 23); drawRect(48, 145, 2, 3);
  // e
  for(let y=150; y<178; y++) { drawRect(54, y, 2, 1); } drawRect(54, 150, 8, 2); drawRect(54, 165, 6, 2); drawRect(54, 176, 8, 2);
  // l
  drawRect(60, 150, 2, 28);

  const spineTexture = new THREE.DataTexture(spineData, spineW, spineH, THREE.RGBAFormat);
  spineTexture.colorSpace = THREE.SRGBColorSpace;
  spineTexture.needsUpdate = true;

  const spineDecalMat = new THREE.MeshStandardMaterial({
    map: spineTexture,
    transparent: true,
    metalness: 0.6,
    roughness: 0.3,
    side: THREE.DoubleSide
  });

  // Spine Decal Mesh (Slightly larger cylinder to prevent z-fighting)
  const spineDecalGeom = new THREE.CylinderGeometry(spineR + 0.0005, spineR + 0.0005, bookH * 0.9, 8, 1, false, 0, Math.PI / 2);
  const spineDecal = new THREE.Mesh(spineDecalGeom, spineDecalMat);
  spineDecal.rotation.z = Math.PI;
  spineDecal.position.set(-bookW / 2 + spineR + 0.0005, 0, 0);
  coverGroup.add(spineDecal);

  // --- 5. Spine Side Decor (Small gold bits on the rounded edge) ---
  // Just a few small boxes on the spine cylinder to simulate raised bands from the side
  const spineSideBand = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.005, 0.03), goldMat);
  spineSideBand.position.set(-bookW / 2 + spineR, 0.15, 0);
  spineSideBand.rotation.y = Math.PI / 2; // Face outward
  coverGroup.add(spineSideBand);
  
  const spineSideBand2 = spineSideBand.clone();
  spineSideBand2.position.y = -0.15;
  coverGroup.add(spineSideBand2);

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