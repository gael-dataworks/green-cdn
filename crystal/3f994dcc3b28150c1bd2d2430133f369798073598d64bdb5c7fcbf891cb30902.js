export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const bookW = 0.16;       // Width (spine to edge)
  const bookH = 0.23;       // Height
  const bookD = 0.045;      // Thickness (pages)
  const coverOverhang = 0.004;
  const spineRadius = bookD * 0.6;
  
  // --- Materials ---
  // Leather: Dark green, matte/satin finish
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3a,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Pages: Cream/off-white, rough
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xf2e8d5,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Gold Foil: Metallic, shiny but not mirror (foil stamp)
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Geometry Helpers ---

  // 1. Page Block
  // Slightly smaller than the cover dimensions
  const pageGeom = new THREE.BoxGeometry(bookW - 0.005, bookH - 0.005, bookD - 0.002);
  const pageBlock = new THREE.Mesh(pageGeom, pageMat);
  // Position pages so the spine edge aligns with the spine cylinder center logic later
  // We will group everything and adjust relative positions.
  root.add(pageBlock);

  // 2. Cover Boards (Front and Back)
  const boardGeom = new THREE.BoxGeometry(bookW + coverOverhang, bookH + coverOverhang, 0.003);
  
  const frontBoard = new THREE.Mesh(boardGeom, leatherMat);
  frontBoard.position.z = (bookD / 2) + 0.0015;
  root.add(frontBoard);

  const backBoard = new THREE.Mesh(boardGeom, leatherMat);
  backBoard.position.z = -(bookD / 2) - 0.0015;
  root.add(backBoard);

  // 3. Spine
  // Use a cylinder segment. 
  // We want a rounded spine connecting front and back.
  // A cylinder with thetaLength ~ 90 degrees (PI/2) works if oriented correctly.
  // However, to match the page block thickness, we might need a specific radius.
  // Let's use a CylinderGeometry with openEnded=true (caps false) and specific theta.
  // Actually, a simple Box with rounded edges via subdivision or just a Cylinder segment is fine.
  // Let's use a Cylinder segment for the roundness.
  
  const spineSegments = 16;
  const spineGeom = new THREE.CylinderGeometry(
    spineRadius, 
    spineRadius, 
    bookH + coverOverhang, 
    spineSegments, 
    1, 
    true, 
    0, 
    Math.PI / 2
  );
  
  const spine = new THREE.Mesh(spineGeom, leatherMat);
  // Rotate to align the curve outward along -X (if spine is at -X)
  // Standard book: Spine is usually on the left (-X) if front is +Z.
  spine.rotation.y = Math.PI / 2; 
  spine.position.set(-(bookW / 2) + spineRadius, 0, 0);
  root.add(spine);

  // 4. Gold Decoration on Front Cover
  const decorGroup = new THREE.Group();
  frontBoard.add(decorGroup);

  // Border Frame (4 lines)
  const borderOffset = 0.015;
  const lineWidth = 0.002;
  const lineDepth = 0.001; // Slightly raised
  
  // Top & Bottom lines
  const hLineGeom = new THREE.BoxGeometry(bookW - borderOffset * 2, lineWidth, lineDepth);
  const topLine = new THREE.Mesh(hLineGeom, goldMat);
  topLine.position.set(0, bookH / 2 - borderOffset, lineDepth / 2);
  decorGroup.add(topLine);

  const bottomLine = new THREE.Mesh(hLineGeom, goldMat);
  bottomLine.position.set(0, -bookH / 2 + borderOffset, lineDepth / 2);
  decorGroup.add(bottomLine);

  // Left & Right lines
  const vLineGeom = new THREE.BoxGeometry(lineWidth, bookH - borderOffset * 2, lineDepth);
  const leftLine = new THREE.Mesh(vLineGeom, goldMat);
  leftLine.position.set(-bookW / 2 + borderOffset, 0, lineDepth / 2);
  decorGroup.add(leftLine);

  const rightLine = new THREE.Mesh(vLineGeom, goldMat);
  rightLine.position.set(bookW / 2 - borderOffset, 0, lineDepth / 2);
  decorGroup.add(rightLine);

  // Corner Ornaments (Simplified geometric flowers)
  function addCornerOrnament(x, y) {
    const cluster = new THREE.Group();
    const petalGeom = new THREE.SphereGeometry(0.006, 8, 8);
    // Flatten petals
    petalGeom.scale(1, 0.3, 1); 

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeom, goldMat);
      const dist = 0.008;
      petal.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, lineDepth / 2);
      petal.rotation.z = angle;
      cluster.add(petal);
    }
    // Center dot
    const center = new THREE.Mesh(new THREE.CircleGeometry(0.003, 8), goldMat);
    center.position.z = lineDepth / 2 + 0.001;
    cluster.add(center);

    cluster.position.set(x, y, 0);
    decorGroup.add(cluster);
  }

  const cornerInset = 0.025;
  addCornerOrnament(-bookW / 2 + cornerInset, bookH / 2 - cornerInset); // Top Left
  addCornerOrnament(bookW / 2 - cornerInset, bookH / 2 - cornerInset);  // Top Right
  addCornerOrnament(-bookW / 2 + cornerInset, -bookH / 2 + cornerInset); // Bottom Left
  addCornerOrnament(bookW / 2 - cornerInset, -bookH / 2 + cornerInset);  // Bottom Right

  // Small mid-spine ornament on front
  const midOrn = new THREE.Mesh(new THREE.CircleGeometry(0.004, 8), goldMat);
  midOrn.position.set(0, 0, lineDepth / 2 + 0.001);
  decorGroup.add(midOrn);


  // 5. Spine Decoration (Texture for "Daniel" and bands)
  // We create a DataTexture for the spine to render the text and bands procedurally.
  const texW = 128;
  const texH = 256;
  const data = new Uint8Array(texW * texH * 4);
  
  // Base leather color for texture (matching leatherMat)
  const rBase = 26, gBase = 77, bBase = 58; 
  // Gold color
  const rGold = 212, gGold = 175, bGold = 55;

  for (let y = 0; y < texH; y++) {
    for (let x = 0; x < texW; x++) {
      const idx = (y * texW + x) * 4;
      
      // Add deterministic noise for leather texture
      const noise = ((Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10) | 0;
      
      let r = rBase + noise;
      let g = gBase + noise;
      let b = bBase + noise;
      let a = 255;

      // Draw Bands (Horizontal gold lines)
      // 3 bands typically: top, middle, bottom
      const bandHeight = 8;
      const bandPositions = [0.15 * texH, 0.5 * texH, 0.85 * texH];
      
      let isGold = false;
      
      for (let by of bandPositions) {
        if (y > by - bandHeight / 2 && y < by + bandHeight / 2) {
          isGold = true;
          break;
        }
      }

      // Draw Text "Daniel" (Approximated as blocks in the middle band)
      // Middle band is at 0.5 * texH.
      if (y > 0.45 * texH && y < 0.55 * texH) {
         // Simple blocky font simulation for "Daniel"
         // D: x=20-35
         if (x > 20 && x < 35 && y > 0.47 * texH && y < 0.53 * texH) isGold = true;
         // a: x=38-50
         if (x > 38 && x < 50 && y > 0.48 * texH && y < 0.53 * texH) isGold = true;
         // n: x=53-65
         if (x > 53 && x < 65 && y > 0.48 * texH && y < 0.53 * texH) isGold = true;
         // i: x=68-72
         if (x > 68 && x < 72 && y > 0.48 * texH && y < 0.53 * texH) isGold = true;
         // e: x=75-88
         if (x > 75 && x < 88 && y > 0.48 * texH && y < 0.53 * texH) isGold = true;
         // l: x=91-100
         if (x > 91 && x < 100 && y > 0.48 * texH && y < 0.53 * texH) isGold = true;
      }

      // Spine ornaments (Top and Bottom bands decoration)
      // Top band center ~ 0.15 * texH
      if (y > 0.12 * texH && y < 0.18 * texH) {
          // Central flower shape
          const cx = texW / 2;
          const cy = 0.15 * texH;
          const dist = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
          if (dist < 10) isGold = true;
      }
      // Bottom band center ~ 0.85 * texH
      if (y > 0.82 * texH && y < 0.88 * texH) {
          const cx = texW / 2;
          const cy = 0.85 * texH;
          const dist = Math.sqrt((x-cx)*(x-cx) + (y-cy)*(y-cy));
          if (dist < 10) isGold = true;
      }

      if (isGold) {
        data[idx] = rGold;
        data[idx+1] = gGold;
        data[idx+2] = bGold;
        data[idx+3] = 255;
      } else {
        data[idx] = r;
        data[idx+1] = g;
        data[idx+2] = b;
        data[idx+3] = 255;
      }
    }
  }

  const spineTexture = new THREE.DataTexture(data, texW, texH, THREE.RGBAFormat);
  spineTexture.colorSpace = THREE.SRGBColorSpace;
  spineTexture.needsUpdate = true;
  // Wrap to cover the cylinder segment
  spineTexture.wrapS = THREE.ClampToEdgeWrapping; 
  spineTexture.wrapT = THREE.ClampToEdgeWrapping;

  // Apply texture to spine material
  // We clone the leatherMat to keep the base properties but add the map
  const spineMat = leatherMat.clone();
  spineMat.map = spineTexture;
  spine.material = spineMat;


  // 6. Page Edge Detail (Optional: slight roughness on the side)
  // The page block is already cream. We can add a slight bevel or just leave it.
  // To make it look like stacked paper, we could use a texture, but solid color is safer for low poly.
  // Let's add a thin "headband" at the top and bottom of the spine edge.
  const headbandGeom = new THREE.BoxGeometry(0.002, 0.002, bookD);
  const headbandMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.8 }); // Red silk
  
  const topHeadband = new THREE.Mesh(headbandGeom, headbandMat);
  topHeadband.position.set(-(bookW/2) + 0.001, bookH/2 - 0.005, 0);
  root.add(topHeadband);

  const botHeadband = new THREE.Mesh(headbandGeom, headbandMat);
  botHeadband.position.set(-(bookW/2) + 0.001, -bookH/2 + 0.005, 0);
  root.add(botHeadband);


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