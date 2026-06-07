export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Aged Paper Material (for the page block edges)
  const paperMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc3,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Worn Leather Material (procedural texture)
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a2a,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Generate Procedural Leather Texture
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Deterministic pseudo-random helper
  function noise(x, y) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  }

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Base dark brown
      let r = 60, g = 40, b = 30;
      
      // Add grain noise
      const n = noise(x * 0.05, y * 0.05);
      const variation = (n - 0.5) * 40;
      r += variation; g += variation * 0.8; b += variation * 0.6;

      // Add the specific "Vein" scratch seen in the reference
      // A curved line running diagonally across the center
      const nx = x / texSize;
      const ny = y / texSize;
      // Curve equation approx: x = y^2 * scale + offset
      const curveX = 0.3 + 0.4 * Math.pow((ny - 0.5) * 2, 2); 
      const dist = Math.abs(nx - curveX);
      
      if (dist < 0.03) {
        // Vein color (lighter, yellowish)
        r = 140; g = 110; b = 80;
        // Soften edges of the vein
        const alpha = 1.0 - (dist / 0.03);
        r = r * alpha + 60 * (1-alpha);
        g = g * alpha + 40 * (1-alpha);
        b = b * alpha + 30 * (1-alpha);
      }

      // Random scuffs/scratches
      if (noise(x * 0.2, y * 0.2) > 0.98) {
        r += 30; g += 20; b += 10;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
      data[i + 3] = 255;
    }
  }

  const leatherTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  leatherTex.colorSpace = THREE.SRGBColorSpace;
  leatherTex.wrapS = THREE.RepeatWrapping;
  leatherTex.wrapT = THREE.RepeatWrapping;
  leatherTex.needsUpdate = true;
  leatherMat.map = leatherTex;

  // Spine Band Material (slightly different leather look, maybe darker/worn)
  const spineBandMat = new THREE.MeshStandardMaterial({
    color: 0x4a2e20,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  // Book is oriented: Y=Up (Height), X=Width (Spine to Edge), Z=Thickness
  const bookHeight = 0.80;
  const bookWidth = 0.55;
  const bookThickness = 0.14;
  const coverThickness = 0.025;

  // --- Geometry Construction ---

  // 1. Page Block (The core)
  // Slightly smaller than the full outer dimensions to allow for cover overlap
  const pageW = bookWidth - 0.01; 
  const pageH = bookHeight - 0.02;
  const pageT = bookThickness - 0.01; // Pages are thinner than the spine structure usually
  
  const pageGeom = new THREE.BoxGeometry(pageW, pageH, pageT);
  const pages = new THREE.Mesh(pageGeom, paperMat);
  root.add(pages);

  // 2. Cover Front
  const coverFrontGeom = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
  const coverFront = new THREE.Mesh(coverFrontGeom, leatherMat);
  coverFront.position.set(0, 0, pageT / 2 + coverThickness / 2);
  root.add(coverFront);

  // 3. Cover Back
  const coverBackGeom = new THREE.BoxGeometry(bookWidth, bookHeight, coverThickness);
  const coverBack = new THREE.Mesh(coverBackGeom, leatherMat);
  coverBack.position.set(0, 0, -pageT / 2 - coverThickness / 2);
  root.add(coverBack);

  // 4. Cover Spine (Wraps the left edge)
  // Needs to cover the side of the pages and overlap front/back slightly
  const spineW = coverThickness; 
  const spineH = bookHeight;
  const spineD = bookThickness + coverThickness * 2; // Wraps around
  
  const spineGeom = new THREE.BoxGeometry(spineW, spineH, spineD);
  const spine = new THREE.Mesh(spineGeom, leatherMat);
  // Position at the left edge of the page block
  spine.position.set(-pageW / 2 - spineW / 2, 0, 0);
  root.add(spine);

  // 5. Spine Bands (Raised ridges)
  // 3 bands distributed vertically
  const bandPositions = [-0.25, 0.0, 0.25];
  const bandGeom = new THREE.BoxGeometry(0.008, 0.04, spineD + 0.005);
  
  bandPositions.forEach(yPos => {
    const band = new THREE.Mesh(bandGeom, spineBandMat);
    // Position on the spine surface (facing -X)
    band.position.set(-pageW / 2 - spineW / 2 - 0.004, yPos, 0);
    root.add(band);
  });

  // 6. Corner Wear & Battering (Procedural chunks)
  // Simulate the frayed/bumped corners seen in the image
  const cornerMat = new THREE.MeshStandardMaterial({
    color: 0x6b4635, // Slightly lighter/worn leather
    metalness: 0.0,
    roughness: 0.9,
  });

  const cornerPositions = [
    // Front face corners
    { x: pageW/2, y: pageH/2, z: pageT/2 },
    { x: pageW/2, y: -pageH/2, z: pageT/2 },
    { x: -pageW/2, y: pageH/2, z: pageT/2 },
    { x: -pageW/2, y: -pageH/2, z: pageT/2 },
    // Back face corners
    { x: pageW/2, y: pageH/2, z: -pageT/2 },
    { x: pageW/2, y: -pageH/2, z: -pageT/2 },
    { x: -pageW/2, y: pageH/2, z: -pageT/2 },
    { x: -pageW/2, y: -pageH/2, z: -pageT/2 },
  ];

  const cornerGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  
  cornerPositions.forEach((pos, i) => {
    // Only add wear to some corners to look natural, or all for very worn look
    // Image shows significant wear on front-left and bottom-right
    if (i === 0 || i === 3 || i === 5 || i === 6) { 
      const chunk = new THREE.Mesh(cornerGeom, cornerMat);
      chunk.position.set(pos.x, pos.y, pos.z);
      // Randomize rotation slightly for irregular look (deterministic based on index)
      chunk.rotation.set(i * 0.5, i * 0.3, i * 0.2);
      chunk.scale.setScalar(0.8 + (i % 3) * 0.1);
      root.add(chunk);
    }
  });

  // 7. Frayed Edge Details (Thin tubes along the spine edge)
  // Simulate the fibrous look on the spine edges
  const fiberMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 1.0,
  });
  
  const fiberGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.03, 5);
  fiberGeom.rotateZ(Math.PI / 2); // Orient along Z (spine depth)
  
  // Add fibers along the top and bottom of the spine
  for (let i = 0; i < 8; i++) {
    const zOffset = (i / 7 - 0.5) * spineD;
    const fiberTop = new THREE.Mesh(fiberGeom, fiberMat);
    fiberTop.position.set(-pageW/2 - spineW/2, pageH/2 + 0.005, zOffset);
    fiberTop.rotation.y = (i % 2) * 0.5; // Slight variation
    root.add(fiberTop);

    const fiberBot = new THREE.Mesh(fiberGeom, fiberMat);
    fiberBot.position.set(-pageW/2 - spineW/2, -pageH/2 - 0.005, zOffset);
    fiberBot.rotation.y = (i % 2) * -0.5;
    root.add(fiberBot);
  }

  // 8. Small Hole/Indentation on Spine (seen in reference)
  const holeGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8);
  holeGeom.rotateZ(Math.PI / 2);
  const hole = new THREE.Mesh(holeGeom, spineBandMat); // Darker inside
  hole.position.set(-pageW/2 - spineW/2 - 0.004, -0.1, 0);
  root.add(hole);


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