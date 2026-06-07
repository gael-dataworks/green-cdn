export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Taupe/Beige fabric for mattress, comforter, pillows
  const fabricColor = 0x9e968b;
  const fabricMat = new THREE.MeshStandardMaterial({
    color: fabricColor,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark legs
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.3,
    roughness: 0.5,
  });

  // Quilted texture for comforter (grid pattern)
  // Create a simple grid pattern using DataTexture
  const texSize = 256;
  const texData = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      // Base color
      texData[idx] = 158; // R
      texData[idx + 1] = 150; // G
      texData[idx + 2] = 139; // B
      texData[idx + 3] = 255; // A

      // Grid lines (every ~32 pixels)
      if (x % 32 < 4 || y % 32 < 4) {
        texData[idx] = 130;
        texData[idx + 1] = 122;
        texData[idx + 2] = 115;
      }
    }
  }
  const quiltTexture = new THREE.DataTexture(texData, texSize, texSize, THREE.RGBAFormat);
  quiltTexture.colorSpace = THREE.SRGBColorSpace;
  quiltTexture.needsUpdate = true;
  quiltTexture.wrapS = THREE.RepeatWrapping;
  quiltTexture.wrapT = THREE.RepeatWrapping;
  
  const comforterMat = new THREE.MeshStandardMaterial({
    color: fabricColor,
    map: quiltTexture,
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- Dimensions ---
  const bedWidth = 1.6;
  const bedLength = 2.0;
  const bedHeight = 0.35;
  const mattressThickness = 0.25;
  const comforterThickness = 0.08;
  
  // --- Bed Base / Frame ---
  const baseGeom = new THREE.BoxGeometry(bedWidth, bedHeight, bedLength);
  const bedBase = new THREE.Mesh(baseGeom, fabricMat);
  bedBase.position.y = bedHeight / 2;
  root.add(bedBase);

  // --- Legs ---
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12);
  const legPositions = [
    [bedWidth / 2 - 0.1, 0, bedLength / 2 - 0.1],
    [-bedWidth / 2 + 0.1, 0, bedLength / 2 - 0.1],
    [bedWidth / 2 - 0.1, 0, -bedLength / 2 + 0.1],
    [-bedWidth / 2 + 0.1, 0, -bedLength / 2 + 0.1],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // --- Mattress ---
  // Slightly smaller than base to allow comforter to drape
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.02, mattressThickness, bedLength - 0.02);
  const mattress = new THREE.Mesh(mattressGeom, fabricMat);
  mattress.position.y = bedHeight + mattressThickness / 2;
  root.add(mattress);

  // --- Comforter ---
  // Main body covering the bed
  // Width covers sides, Length covers foot to head
  const comforterWidth = bedWidth + 0.4; // Drape over sides
  const comforterLength = bedLength + 0.2; 
  const comforterGeom = new THREE.BoxGeometry(comforterWidth, comforterThickness, comforterLength);
  const comforterBody = new THREE.Mesh(comforterGeom, comforterMat);
  // Position: sits on top of mattress, draped down
  comforterBody.position.y = bedHeight + mattressThickness + comforterThickness / 2 - 0.02;
  comforterBody.position.z = 0.1; // Shift slightly towards foot
  root.add(comforterBody);

  // Folded part at the head
  // This simulates the top edge folded back
  const foldGeom = new THREE.BoxGeometry(comforterWidth, comforterThickness * 2, 0.4);
  const comforterFold = new THREE.Mesh(foldGeom, comforterMat);
  // Position at the head, rotated to look like a fold
  comforterFold.position.y = bedHeight + mattressThickness + comforterThickness;
  comforterFold.position.z = -bedLength / 2 + 0.2;
  comforterFold.rotation.x = Math.PI / 2.5; // Angle the fold
  root.add(comforterFold);

  // --- Pillows ---
  const pillowWidth = 0.6;
  const pillowLength = 0.45;
  const pillowHeight = 0.12;
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowLength);
  
  // Left Pillow
  const pillowLeft = new THREE.Mesh(pillowGeom, fabricMat);
  pillowLeft.position.set(-0.4, bedHeight + mattressThickness + pillowHeight / 2 + 0.02, -0.6);
  pillowLeft.rotation.z = 0.1;
  pillowLeft.rotation.y = -0.2;
  root.add(pillowLeft);

  // Right Pillow
  const pillowRight = new THREE.Mesh(pillowGeom, fabricMat);
  pillowRight.position.set(0.4, bedHeight + mattressThickness + pillowHeight / 2 + 0.02, -0.6);
  pillowRight.rotation.z = -0.1;
  pillowRight.rotation.y = 0.2;
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