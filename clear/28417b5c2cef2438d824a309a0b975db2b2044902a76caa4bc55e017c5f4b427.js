export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Matte black plastic for lid and feet
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Blue plastic handle
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x0044aa,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Glowing LED strip inside handle
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 2.5,
    toneMapped: false,
  });

  // Logo texture generation
  const logoSize = 256;
  const logoData = new Uint8Array(logoSize * logoSize * 4);
  // Fill transparent background
  for (let i = 0; i < logoData.length; i += 4) {
    logoData[i] = 0;     // R
    logoData[i + 1] = 0; // G
    logoData[i + 2] = 0; // B
    logoData[i + 3] = 0; // A (transparent)
  }
  // Helper to draw text blocks
  function drawText(text, startX, startY, fontSize, colorR, colorG, colorB) {
    const ctx = { data: logoData, w: logoSize, h: logoSize };
    // Simple block font simulation
    const charWidth = fontSize * 0.6;
    let cx = startX;
    for (let c = 0; c < text.length; c++) {
      const char = text[c];
      if (char === ' ') { cx += charWidth; continue; }
      
      // Define simple 5x7 bitmap for letters needed: N, U, R, C, A, L, O, F, E
      // This is a very simplified rasterizer for the prompt constraints
      // We will just draw rectangles for simplicity to ensure legibility without external fonts
      // Actually, let's just draw the bounding boxes for the letters to represent the logo
      // "NURCAL"
      if (char === 'N' || char === 'U' || char === 'R' || char === 'C' || char === 'A' || char === 'L' || char === 'O' || char === 'F' || char === 'E') {
         // Draw a block
         for (let y = 0; y < fontSize; y++) {
           for (let x = 0; x < charWidth; x++) {
             // Add some noise/texture to look like print
             const px = Math.floor(cx + x);
             const py = Math.floor(startY + y);
             if (px >= 0 && px < logoSize && py >= 0 && py < logoSize) {
               const idx = (py * logoSize + px) * 4;
               // Simple shape logic for 'N' as example, but for generic text let's just fill rect
               // To make it look like text, we rely on the arrangement. 
               // Since I can't easily draw complex glyphs without a font map, 
               // I will draw solid bars that represent the text lines.
               // Wait, I can draw specific shapes for N, U, R, C, A, L.
               
               let draw = false;
               const nx = x / charWidth;
               const ny = y / fontSize;

               if (char === 'N') {
                 if (nx < 0.2 || nx > 0.8 || Math.abs(ny - nx) < 0.15) draw = true;
               } else if (char === 'U') {
                 if (nx < 0.2 || nx > 0.8 || ny > 0.8) draw = true;
               } else if (char === 'R') {
                 if (nx < 0.2 || (ny < 0.5 && nx < 0.8 && ny > 0.2) || (ny > 0.5 && nx > 0.5 && nx < 0.8 && ny < 0.8 && (nx-0.5) > (ny-0.5))) draw = true; 
                 // Simplified R
                 if (nx < 0.2) draw = true;
                 if (ny < 0.45 && nx < 0.7) draw = true;
                 if (ny > 0.45 && nx > 0.4 && nx < 0.8 && ny < 0.9) draw = true;
                 if (ny > 0.7 && nx > 0.6) draw = true; // leg
               } else if (char === 'C') {
                 if ((ny < 0.2 || ny > 0.8) && nx < 0.8) draw = true;
                 if (nx < 0.2) draw = true;
               } else if (char === 'A') {
                 if (nx < 0.2 || nx > 0.8 || ny > 0.7) draw = true;
                 if (ny > 0.4 && ny < 0.6 && nx > 0.3 && nx < 0.7) draw = false; // hole
                 else if (ny > 0.4 && ny < 0.6) draw = true;
               } else if (char === 'L') {
                 if (nx < 0.2 || ny > 0.8) draw = true;
               } else if (char === 'O') {
                 if ((nx < 0.2 || nx > 0.8) && ny > 0.1 && ny < 0.9) draw = true;
                 if ((ny < 0.2 || ny > 0.8) && nx > 0.2 && nx < 0.8) draw = true;
               } else if (char === 'F') {
                 if (nx < 0.2 || (ny < 0.2 && nx < 0.8) || (ny > 0.4 && ny < 0.6 && nx < 0.6)) draw = true;
               } else if (char === 'E') {
                 if (nx < 0.2 || (ny < 0.2 && nx < 0.8) || (ny > 0.4 && ny < 0.6 && nx < 0.6) || (ny > 0.8 && nx < 0.8)) draw = true;
               }

               if (draw) {
                 logoData[idx] = colorR;
                 logoData[idx+1] = colorG;
                 logoData[idx+2] = colorB;
                 logoData[idx+3] = 255;
               }
             }
           }
         }
      }
      cx += charWidth + 2;
    }
  }

  // Draw NURCAL
  drawText("NURCAL", 40, 100, 40, 30, 30, 30);
  // Draw COFFEE smaller below
  drawText("COFFEE", 50, 155, 20, 60, 60, 60);

  const logoTexture = new THREE.DataTexture(logoData, logoSize, logoSize, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  // Flip Y because texture coords often differ from screen coords
  logoTexture.flipY = true; 

  const logoMat = new THREE.MeshStandardMaterial({
    map: logoTexture,
    transparent: true,
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide
  });

  // --- Dimensions ---
  const bodyRadius = 0.3;
  const bodyHeight = 0.55;
  const baseHeight = 0.08;
  const baseRadius = 0.36;
  const lidHeight = 0.04;
  
  // --- Base ---
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = -bodyHeight / 2 - baseHeight / 2;
  root.add(base);

  // Feet (4 small black cylinders)
  const footGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.015, 16);
  const footPositions = [
    [baseRadius * 0.8, 0, baseRadius * 0.8],
    [-baseRadius * 0.8, 0, baseRadius * 0.8],
    [baseRadius * 0.8, 0, -baseRadius * 0.8],
    [-baseRadius * 0.8, 0, -baseRadius * 0.8],
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, blackMat);
    foot.position.set(x, -bodyHeight / 2 - baseHeight + 0.007, z);
    root.add(foot);
  }

  // --- Body ---
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = -baseHeight / 2 + bodyHeight / 2;
  root.add(body);

  // Seam ring near bottom of body
  const seamGeom = new THREE.TorusGeometry(bodyRadius + 0.002, 0.003, 16, 32);
  const seam = new THREE.Mesh(seamGeom, blackMat);
  seam.rotation.x = Math.PI / 2;
  seam.position.y = -baseHeight / 2 + 0.08;
  root.add(seam);

  // --- Lid ---
  const lidGeom = new THREE.CylinderGeometry(bodyRadius + 0.01, bodyRadius + 0.01, lidHeight, 32);
  const lid = new THREE.Mesh(lidGeom, blackMat);
  lid.position.y = bodyHeight / 2 + lidHeight / 2 - baseHeight / 2;
  root.add(lid);

  // Lid Knob
  const knobGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.03, 16);
  const knob = new THREE.Mesh(knobGeom, blackMat);
  knob.position.y = lid.position.y + lidHeight / 2 + 0.015;
  root.add(knob);

  // --- Spout ---
  // Cone geometry, rotated to point forward-left
  const spoutHeight = 0.12;
  const spoutRadiusBase = 0.06;
  const spoutRadiusTip = 0.03;
  const spoutGeom = new THREE.CylinderGeometry(spoutRadiusTip, spoutRadiusBase, spoutHeight, 16);
  const spout = new THREE.Mesh(spoutGeom, bodyMat);
  // Position: Top left of body
  spout.position.set(-bodyRadius * 0.8, bodyHeight / 2 - 0.05, bodyRadius * 0.8);
  // Rotate to point out and up slightly
  spout.rotation.z = Math.PI / 2; // Point along X
  spout.rotation.y = -Math.PI / 4; // Angle towards front
  spout.rotation.x = -0.2; // Tilt up
  root.add(spout);

  // --- Handle ---
  // Curve path for the handle
  const handlePathPoints = [
    new THREE.Vector3(bodyRadius, bodyHeight * 0.35, 0), // Top attach
    new THREE.Vector3(bodyRadius + 0.12, bodyHeight * 0.35, 0), // Out
    new THREE.Vector3(bodyRadius + 0.12, -bodyHeight * 0.25, 0), // Down
    new THREE.Vector3(bodyRadius, -bodyHeight * 0.25, 0), // Bottom attach
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePathPoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  root.add(handle);

  // Handle Glow Strip (Inner side)
  // Slightly smaller radius curve
  const glowPathPoints = [
    new THREE.Vector3(bodyRadius + 0.02, bodyHeight * 0.3, 0),
    new THREE.Vector3(bodyRadius + 0.08, bodyHeight * 0.3, 0),
    new THREE.Vector3(bodyRadius + 0.08, -bodyHeight * 0.2, 0),
    new THREE.Vector3(bodyRadius + 0.02, -bodyHeight * 0.2, 0),
  ];
  const glowCurve = new THREE.CatmullRomCurve3(glowPathPoints);
  const glowGeom = new THREE.TubeGeometry(glowCurve, 20, 0.012, 8, false);
  const glowStrip = new THREE.Mesh(glowGeom, glowMat);
  root.add(glowStrip);

  // --- Logo Plate ---
  // Plane slightly offset from body surface
  const logoWidth = 0.18;
  const logoHeight = 0.08;
  const logoGeom = new THREE.PlaneGeometry(logoWidth, logoHeight);
  const logoMesh = new THREE.Mesh(logoGeom, logoMat);
  // Position on front of body
  logoMesh.position.set(bodyRadius + 0.002, 0, 0);
  // Rotate to face outward (cylinder normal at x=radius, z=0 is +X)
  // Plane faces +Z by default, so rotate Y by 90 deg
  logoMesh.rotation.y = Math.PI / 2;
  root.add(logoMesh);

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