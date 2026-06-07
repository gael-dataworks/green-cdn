export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const bookWidth = 0.30;   // X: Spine to Fore-edge
  const bookHeight = 0.45;  // Z: Top to Bottom
  const bookThickness = 0.05; // Y: Thickness
  
  // Colors
  const COLOR_LEATHER = 0x1a4d2e; // Deep forest green
  const COLOR_GOLD = 0xd4af37;    // Metallic gold
  const COLOR_PAGE = 0xf0e6d2;    // Cream paper
  const COLOR_GOLD_DARK = 0xaa8c2c;

  // --- Materials ---
  // Leather: Matte, low metalness, high roughness
  const leatherMat = new THREE.MeshStandardMaterial({
    color: COLOR_LEATHER,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Pages: Matte, off-white
  const pageMat = new THREE.MeshStandardMaterial({
    color: COLOR_PAGE,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Gold Embossing: Shiny, moderate metalness (capped at 0.6)
  const goldMat = new THREE.MeshStandardMaterial({
    color: COLOR_GOLD,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Geometry Helpers ---

  // 1. Page Block (Inner pages)
  const pageGeom = new THREE.BoxGeometry(bookWidth - 0.004, bookThickness - 0.004, bookHeight - 0.004);
  const pages = new THREE.Mesh(pageGeom, pageMat);
  // Position pages slightly inset from the spine side to allow cover thickness
  pages.position.set(0.002, 0, 0); 
  root.add(pages);

  // 2. Covers (Front, Back, Spine, Top, Bottom)
  // Front Cover
  const coverFrontGeom = new THREE.BoxGeometry(bookWidth, 0.002, bookHeight);
  const coverFront = new THREE.Mesh(coverFrontGeom, leatherMat);
  coverFront.position.set(0, bookThickness / 2 + 0.001, 0);
  root.add(coverFront);

  // Back Cover
  const coverBack = new THREE.Mesh(coverFrontGeom, leatherMat);
  coverBack.position.set(0, -bookThickness / 2 - 0.001, 0);
  root.add(coverBack);

  // Spine (Rounded approximation using Cylinder)
  // Cylinder is Y-up. We need it along Z. Rotate X by 90.
  // Radius = thickness/2. Height = bookHeight.
  // We only need a segment of a cylinder for a rounded spine, but a box is often safer for alignment.
  // Let's use a Box for the spine to match the flat covers, slightly rounded visually by lighting.
  const spineGeom = new THREE.BoxGeometry(0.002, bookThickness + 0.004, bookHeight);
  const spine = new THREE.Mesh(spineGeom, leatherMat);
  spine.position.set(-bookWidth / 2 - 0.001, 0, 0);
  root.add(spine);

  // Top Edge Cover
  const topGeom = new THREE.BoxGeometry(bookWidth, 0.002, 0.002);
  const topCover = new THREE.Mesh(topGeom, leatherMat);
  topCover.position.set(0, 0, bookHeight / 2 + 0.001);
  root.add(topCover);

  // Bottom Edge Cover
  const bottomCover = new THREE.Mesh(topGeom, leatherMat);
  bottomCover.position.set(0, 0, -bookHeight / 2 - 0.001);
  root.add(bottomCover);

  // Fore-edge Cover (Thin strip on the right)
  const foreGeom = new THREE.BoxGeometry(0.002, bookThickness + 0.004, bookHeight);
  const foreCover = new THREE.Mesh(foreGeom, leatherMat);
  foreCover.position.set(bookWidth / 2 + 0.001, 0, 0);
  root.add(foreCover);

  // --- Gold Embossing Details (Front Cover) ---

  // Border Frame
  const borderInset = 0.025;
  const borderThick = 0.001;
  const borderDepth = 0.0015; // Slightly raised

  // Top/Bottom Borders
  const hBorderGeom = new THREE.BoxGeometry(bookWidth - borderInset * 2, borderThick, borderDepth);
  const hBorderTop = new THREE.Mesh(hBorderGeom, goldMat);
  hBorderTop.position.set(0, bookThickness / 2 + 0.002 + borderDepth/2, bookHeight / 2 - borderInset);
  root.add(hBorderTop);

  const hBorderBottom = new THREE.Mesh(hBorderGeom, goldMat);
  hBorderBottom.position.set(0, bookThickness / 2 + 0.002 + borderDepth/2, -bookHeight / 2 + borderInset);
  root.add(hBorderBottom);

  // Left/Right Borders
  const vBorderGeom = new THREE.BoxGeometry(borderThick, borderDepth, bookHeight - borderInset * 2);
  const vBorderLeft = new THREE.Mesh(vBorderGeom, goldMat);
  vBorderLeft.position.set(-bookWidth / 2 + borderInset, bookThickness / 2 + 0.002 + borderDepth/2, 0);
  root.add(vBorderLeft);

  const vBorderRight = new THREE.Mesh(vBorderGeom, goldMat);
  vBorderRight.position.set(bookWidth / 2 - borderInset, bookThickness / 2 + 0.002 + borderDepth/2, 0);
  root.add(vBorderRight);

  // Corner Ornaments (Procedural Meshes)
  // We create a small cluster of gold shapes for each corner
  function addCornerOrnament(x, z, rotZ) {
    const group = new THREE.Group();
    
    // Central rosette
    const center = new THREE.Mesh(new THREE.CircleGeometry(0.008, 8), goldMat);
    center.rotation.x = -Math.PI / 2;
    group.add(center);

    // Leaves/Petals
    const leafGeom = new THREE.CircleGeometry(0.006, 6);
    const positions = [
      [0.012, 0, 0],
      [-0.012, 0, Math.PI],
      [0, 0.012, Math.PI/2],
      [0, -0.012, -Math.PI/2],
      [0.008, 0.008, Math.PI/4],
      [-0.008, -0.008, -3*Math.PI/4],
      [0.008, -0.008, -Math.PI/4],
      [-0.008, 0.008, 3*Math.PI/4]
    ];

    for (const [px, py, pr] of positions) {
      const leaf = new THREE.Mesh(leafGeom, goldMat);
      leaf.position.set(px, py, 0.001);
      leaf.rotation.x = -Math.PI / 2;
      leaf.rotation.z = pr;
      leaf.scale.set(1, 0.4, 1); // Flatten to look like a leaf
      group.add(leaf);
    }

    group.position.set(x, bookThickness / 2 + 0.002 + borderDepth, z);
    group.rotation.z = rotZ;
    // Tilt slightly to follow cover normal (which is flat Y)
    root.add(group);
  }

  const cornerOffset = 0.035;
  addCornerOrnament(-bookWidth/2 + cornerOffset, bookHeight/2 - cornerOffset, 0); // Top Left
  addCornerOrnament(bookWidth/2 - cornerOffset, bookHeight/2 - cornerOffset, Math.PI/2); // Top Right
  addCornerOrnament(bookWidth/2 - cornerOffset, -bookHeight/2 + cornerOffset, Math.PI); // Bottom Right
  addCornerOrnament(-bookWidth/2 + cornerOffset, -bookHeight/2 + cornerOffset, -Math.PI/2); // Bottom Left

  // --- Spine Details (Texture for Text & Bands) ---
  // Modeling text "Daniel" with meshes is complex. We use a DataTexture as per handbook.
  
  const spineW = 64;
  const spineH = 256;
  const spineData = new Uint8Array(spineW * spineH * 4);
  
  // Fill background (Leather Green)
  for (let i = 0; i < spineW * spineH; i++) {
    spineData[i * 4 + 0] = 26;  // R
    spineData[i * 4 + 1] = 77;  // G
    spineData[i * 4 + 2] = 46;  // B
    spineData[i * 4 + 3] = 255; // A
  }

  // Helper to draw gold pixel
  function setGold(x, y) {
    if (x < 0 || x >= spineW || y < 0 || y >= spineH) return;
    const idx = (y * spineW + x) * 4;
    spineData[idx + 0] = 212; // R
    spineData[idx + 1] = 175; // G
    spineData[idx + 2] = 55;  // B
    spineData[idx + 3] = 255;
  }

  // Draw Bands (Horizontal lines on spine)
  // Spine in UV space: X is thickness, Y is height.
  // We want bands near top and bottom.
  const bandY1 = Math.floor(spineH * 0.15);
  const bandY2 = Math.floor(spineH * 0.85);
  const bandHeight = 4;
  
  for (let y = bandY1; y < bandY1 + bandHeight; y++) {
    for (let x = 4; x < spineW - 4; x++) setGold(x, y);
  }
  for (let y = bandY2; y < bandY2 + bandHeight; y++) {
    for (let x = 4; x < spineW - 4; x++) setGold(x, y);
  }

  // Draw Text "Daniel" vertically centered
  // Simple 5x7 bitmap font map
  const font = {
    'D': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
    'a': [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10001, 0b10001],
    'n': [0b00000, 0b00000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
    'i': [0b00100, 0b00000, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
    'e': [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110],
    'l': [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110]
  };

  const text = "Daniel";
  const charW = 6;
  const charH = 8;
  const totalTextW = text.length * charW;
  const startX = Math.floor((spineW - totalTextW) / 2);
  const startY = Math.floor(spineH / 2 - charH / 2);

  for (let c = 0; c < text.length; c++) {
    const char = text[c];
    const map = font[char] || font['a'];
    for (let row = 0; row < 7; row++) {
      const bits = map[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          // Draw pixel
          const px = startX + c * charW + col;
          const py = startY + row;
          // Draw a 2x2 block for visibility
          setGold(px, py);
          setGold(px+1, py);
          setGold(px, py+1);
          setGold(px+1, py+1);
        }
      }
    }
  }

  const spineTexture = new THREE.DataTexture(spineData, spineW, spineH, THREE.RGBAFormat);
  spineTexture.colorSpace = THREE.SRGBColorSpace;
  spineTexture.needsUpdate = true;
  // Wrap to avoid seams if UVs slightly off
  spineTexture.wrapS = THREE.ClampToEdgeWrapping;
  spineTexture.wrapT = THREE.ClampToEdgeWrapping;

  const spineTextMat = new THREE.MeshStandardMaterial({
    map: spineTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Apply texture to spine mesh
  // The spine mesh is a box. We need to ensure UVs map correctly or replace geometry.
  // BoxGeometry UVs are per face. The spine face is at x = -width/2.
  // Default BoxGeometry UVs for that face should work (0,0 to 1,1).
  spine.material = spineTextMat;

  // Add small gold bands as meshes on top of texture for relief
  const spineBandGeom = new THREE.BoxGeometry(0.002, 0.001, bookWidth - 0.04); // Thin strip along spine width
  const bandTop = new THREE.Mesh(spineBandGeom, goldMat);
  bandTop.rotation.z = Math.PI / 2;
  bandTop.position.set(-bookWidth/2 - 0.001, bookThickness/2 + 0.002, bookHeight/2 - bandY1/spineH * bookHeight);
  root.add(bandTop);

  const bandBottom = new THREE.Mesh(spineBandGeom, goldMat);
  bandBottom.rotation.z = Math.PI / 2;
  bandBottom.position.set(-bookWidth/2 - 0.001, bookThickness/2 + 0.002, -bookHeight/2 + bandY1/spineH * bookHeight);
  root.add(bandBottom);
  
  // Spine corner ornaments (smaller versions)
  function addSpineOrnament(z) {
     const group = new THREE.Group();
     const center = new THREE.Mesh(new THREE.CircleGeometry(0.005, 6), goldMat);
     center.rotation.x = -Math.PI/2;
     group.add(center);
     
     // Simple cross shape
     const bar = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.001, 0.015), goldMat);
     bar.rotation.x = -Math.PI/2;
     group.add(bar);
     const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.001, 0.002), goldMat);
     bar2.rotation.x = -Math.PI/2;
     group.add(bar2);

     group.position.set(-bookWidth/2 - 0.001, bookThickness/2 + 0.002, z);
     group.rotation.y = Math.PI / 2; // Face outward from spine
     root.add(group);
  }
  
  addSpineOrnament(bookHeight/2 - 0.05);
  addSpineOrnament(-bookHeight/2 + 0.05);


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