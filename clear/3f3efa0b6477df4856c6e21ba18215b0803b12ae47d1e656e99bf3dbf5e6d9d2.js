export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Taupe/Grey-Beige fabric for duvet and pillows
  const fabricColor = 0xa69d92;
  const duvetMat = new THREE.MeshStandardMaterial({
    color: fabricColor,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Lighter beige for the mattress side (visible at foot/sides)
  const mattressMat = new THREE.MeshStandardMaterial({
    color: 0xdcd6cf,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Dark legs
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Procedural Quilt Texture (Bump Map) ---
  // Creates a grid of "puffy" squares to simulate the comforter quilting
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const gridSpacing = 32; // Size of one quilt square + seam
  const seamWidth = 4;
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Check if we are in a "seam" region
      const modX = x % gridSpacing;
      const modY = y % gridSpacing;
      const inSeamX = modX < seamWidth || modX > gridSpacing - seamWidth;
      const inSeamY = modY < seamWidth || modY > gridSpacing - seamWidth;

      let val = 200; // Base grey (puffy part)
      if (inSeamX || inSeamY) {
        val = 80; // Darker grey (seam/indentation)
      }
      
      // Add slight noise for fabric texture
      const noise = ((x * 17 + y * 31) % 20) - 10; 
      val = Math.max(0, Math.min(255, val + noise));

      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  const quiltTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  quiltTexture.colorSpace = THREE.SRGBColorSpace;
  quiltTexture.wrapS = THREE.RepeatWrapping;
  quiltTexture.wrapT = THREE.RepeatWrapping;
  quiltTexture.repeat.set(4, 6); // Repeat across the bed surface
  quiltTexture.needsUpdate = true;
  
  duvetMat.bumpMap = quiltTexture;
  duvetMat.bumpScale = 0.015;

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const mattressHeight = 0.30;
  const legHeight = 0.12;
  const overhangSide = 0.15;
  const overhangFoot = 0.20;
  const foldDepth = 0.50; // How far down the duvet is folded

  // --- 1. Mattress Base ---
  // Visible at the foot and sides where duvet doesn't cover
  const mattressGeom = new THREE.BoxGeometry(bedWidth, mattressHeight, bedLength);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.y = mattressHeight / 2 + legHeight;
  root.add(mattress);

  // --- 2. Legs ---
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, legHeight, 12);
  const legPositions = [
    [-bedWidth/2 + 0.15, legHeight/2, -bedLength/2 + 0.15],
    [ bedWidth/2 - 0.15, legHeight/2, -bedLength/2 + 0.15],
    [-bedWidth/2 + 0.15, legHeight/2,  bedLength/2 - 0.15],
    [ bedWidth/2 - 0.15, legHeight/2,  bedLength/2 - 0.15],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- 3. Comforter (Duvet) ---
  // Main body covering the bed
  const duvetWidth = bedWidth + overhangSide * 2;
  const duvetLength = bedLength + overhangFoot; // Extra length at foot
  const duvetThickness = 0.08;
  
  // We model the duvet in two parts: the main cover and the folded top part
  // Main part: covers from head to foot, draping down
  const mainDuvetGeom = new THREE.BoxGeometry(duvetWidth, duvetThickness, duvetLength);
  // Shift geometry so pivot is at top-back-center for easier folding logic if needed, 
  // but here we just position meshes.
  const mainDuvet = new THREE.Mesh(mainDuvetGeom, duvetMat);
  // Position: Centered on X, slightly higher than mattress top, shifted back to cover head
  mainDuvet.position.set(0, mattressHeight + legHeight + duvetThickness/2, 0);
  root.add(mainDuvet);

  // Folded part: At the head of the bed, angled down to simulate the fold
  // It sits on top of the main duvet
  const foldDuvetGeom = new THREE.BoxGeometry(duvetWidth, duvetThickness, foldDepth);
  const foldDuvet = new THREE.Mesh(foldDuvetGeom, duvetMat);
  // Position: At the head (negative Z), rotated to lie flat on the bed
  foldDuvet.position.set(0, mattressHeight + legHeight + duvetThickness * 1.5, -bedLength/2 + foldDepth/2);
  root.add(foldDuvet);

  // Side drapes (simplified as thin boxes hanging down)
  // Left drape
  const leftDrapeGeom = new THREE.BoxGeometry(overhangSide, mattressHeight + legHeight, duvetLength);
  const leftDrape = new THREE.Mesh(leftDrapeGeom, duvetMat);
  leftDrape.position.set(-bedWidth/2 - overhangSide/2, (mattressHeight + legHeight)/2, 0);
  root.add(leftDrape);

  // Right drape
  const rightDrape = new THREE.Mesh(leftDrapeGeom, duvetMat);
  rightDrape.position.set(bedWidth/2 + overhangSide/2, (mattressHeight + legHeight)/2, 0);
  root.add(rightDrape);

  // Foot drape (hanging down at the end)
  const footDrapeGeom = new THREE.BoxGeometry(duvetWidth, mattressHeight + legHeight, overhangFoot);
  const footDrape = new THREE.Mesh(footDrapeGeom, duvetMat);
  footDrape.position.set(0, (mattressHeight + legHeight)/2, bedLength/2 + overhangFoot/2);
  root.add(footDrape);

  // --- 4. Pillows ---
  const pillowWidth = 0.70;
  const pillowDepth = 0.50;
  const pillowHeight = 0.14;
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowDepth);
  
  // Left Pillow
  const pillowLeft = new THREE.Mesh(pillowGeom, duvetMat);
  pillowLeft.position.set(-pillowWidth/2 - 0.05, mattressHeight + legHeight + duvetThickness * 2.2, -bedLength/2 + 0.35);
  pillowLeft.rotation.x = -0.1; // Slight tilt back
  pillowLeft.rotation.z = 0.05; // Slight lean
  root.add(pillowLeft);

  // Right Pillow
  const pillowRight = new THREE.Mesh(pillowGeom, duvetMat);
  pillowRight.position.set(pillowWidth/2 + 0.05, mattressHeight + legHeight + duvetThickness * 2.2, -bedLength/2 + 0.35);
  pillowRight.rotation.x = -0.1;
  pillowRight.rotation.z = -0.05;
  root.add(pillowRight);

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