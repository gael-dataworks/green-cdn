export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const bedWidth = 1.8;
  const bedLength = 2.2;
  const baseHeight = 0.12;
  const mattressHeight = 0.28;
  const totalHeight = baseHeight + mattressHeight;
  const legHeight = 0.06;
  const legRadius = 0.04;
  
  const duvetThickness = 0.14;
  const pillowWidth = 0.65;
  const pillowLength = 0.45;
  const pillowHeight = 0.18;

  // --- Materials ---
  // Fabric: Matte, high roughness, warm beige/taupe
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xb8b0a5,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Base: Darker, slightly smoother than fabric (upholstered base or wood)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x8c857a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Legs: Dark wood or metal
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // --- Helpers ---

  // Procedural Quilt Texture
  function createQuiltTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const gridColor = [160, 155, 145]; // Slightly darker beige for stitching
    const fillColor = [190, 185, 175]; // Lighter beige for puffs
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Create a grid pattern
        const gridSize = 32;
        const isLine = (x % gridSize < 3) || (y % gridSize < 3);
        
        const color = isLine ? gridColor : fillColor;
        // Add slight noise for fabric texture
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + 1) * 10;
        
        data[i] = color[0] + noise;
        data[i + 1] = color[1] + noise;
        data[i + 2] = color[2] + noise;
        data[i + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat to cover the duvet area nicely
    texture.repeat.set(6, 8); 
    return texture;
  }

  const quiltedMat = fabricMat.clone();
  quiltedMat.map = createQuiltTexture();
  // Adjust roughness slightly for the quilted look
  quiltedMat.roughness = 0.9;

  // --- Geometry Construction ---

  // 1. Base Frame
  const baseGeom = new THREE.BoxGeometry(bedWidth, baseHeight, bedLength);
  const baseFrame = new THREE.Mesh(baseGeom, baseMat);
  baseFrame.position.y = baseHeight / 2;
  root.add(baseFrame);

  // 2. Legs (4 corners, recessed)
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 12);
  const legOffsetX = bedWidth / 2 - 0.15;
  const legOffsetZ = bedLength / 2 - 0.15;
  const legPositions = [
    [ legOffsetX, legHeight / 2,  legOffsetZ],
    [-legOffsetX, legHeight / 2,  legOffsetZ],
    [ legOffsetX, legHeight / 2, -legOffsetZ],
    [-legOffsetX, legHeight / 2, -legOffsetZ],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(x, y, z);
    root.add(leg);
  }

  // 3. Mattress (Hidden mostly, but defines volume for pillows)
  const mattressGeom = new THREE.BoxGeometry(bedWidth - 0.02, mattressHeight, bedLength - 0.02);
  const mattress = new THREE.Mesh(mattressGeom, baseMat); // Use base color as it's barely seen
  mattress.position.y = baseHeight + mattressHeight / 2;
  root.add(mattress);

  // 4. Duvet / Comforter
  const duvetGroup = new THREE.Group();

  // Top Surface of Duvet
  // Slightly smaller than bed to allow for the fold and drape
  const duvetTopWidth = bedWidth;
  const duvetTopLength = bedLength - 0.3; // Leave space for the fold at head
  const duvetTopGeom = new THREE.BoxGeometry(duvetTopWidth, duvetThickness, duvetTopLength);
  const duvetTop = new THREE.Mesh(duvetTopGeom, quiltedMat);
  // Position on top of mattress
  duvetTop.position.set(0, totalHeight + duvetThickness / 2, -0.1); 
  duvetGroup.add(duvetTop);

  // Side Drops (Left & Right)
  const dropHeight = totalHeight - 0.05; // Hangs almost to floor
  const dropDepth = 0.15; // Thickness of the hanging fabric
  const sideDropGeom = new THREE.BoxGeometry(dropDepth, dropHeight, duvetTopLength);
  
  const sideDropLeft = new THREE.Mesh(sideDropGeom, quiltedMat);
  sideDropLeft.position.set(-bedWidth / 2 + dropDepth / 2, dropHeight / 2, -0.1);
  // Rotate to align with side? No, box is already oriented. 
  // Wait, BoxGeometry is centered. 
  // We want it to hang from the edge.
  // Let's re-orient: Width is thickness, Height is drop, Depth is length.
  sideDropLeft.rotation.y = Math.PI / 2; // Face inward
  sideDropLeft.position.set(-bedWidth / 2 + dropDepth / 2, totalHeight - duvetThickness/2 - dropHeight/2, -0.1);
  duvetGroup.add(sideDropLeft);

  const sideDropRight = sideDropLeft.clone();
  sideDropRight.position.set(bedWidth / 2 - dropDepth / 2, totalHeight - duvetThickness/2 - dropHeight/2, -0.1);
  duvetGroup.add(sideDropRight);

  // Foot Drop
  const footDropGeom = new THREE.BoxGeometry(bedWidth, dropHeight, dropDepth);
  const footDrop = new THREE.Mesh(footDropGeom, quiltedMat);
  footDrop.position.set(0, totalHeight - duvetThickness/2 - dropHeight/2, -bedLength / 2 + dropDepth / 2);
  duvetGroup.add(footDrop);

  // Head Fold (The rolled part at the top)
  // Simulates the duvet folded back over the top sheet/pillows area
  const foldRadius = 0.12;
  const foldGeom = new THREE.CylinderGeometry(foldRadius, foldRadius, bedWidth, 24);
  const duvetFold = new THREE.Mesh(foldGeom, quiltedMat);
  duvetFold.rotation.z = Math.PI / 2; // Roll along X axis
  // Position at the head of the bed, on top of the mattress/duvet base
  duvetFold.position.set(0, totalHeight + duvetThickness, bedLength / 2 - 0.2);
  duvetGroup.add(duvetFold);

  // Fill the gap between the fold and the main top
  const foldFillGeom = new THREE.BoxGeometry(bedWidth, duvetThickness, 0.2);
  const foldFill = new THREE.Mesh(foldFillGeom, quiltedMat);
  foldFill.position.set(0, totalHeight + duvetThickness/2, bedLength / 2 - 0.3);
  duvetGroup.add(foldFill);

  root.add(duvetGroup);

  // 5. Pillows
  const pillowGeom = new THREE.BoxGeometry(pillowWidth, pillowHeight, pillowLength);
  
  // Left Pillow
  const pillowLeft = new THREE.Mesh(pillowGeom, fabricMat);
  // Position on top of the fold
  pillowLeft.position.set(-pillowWidth / 2 - 0.05, totalHeight + duvetThickness + pillowHeight / 2, bedLength / 2 - 0.3);
  // Tilt back slightly
  pillowLeft.rotation.x = -0.3;
  pillowLeft.rotation.z = 0.1; // Slight natural tilt
  root.add(pillowLeft);

  // Right Pillow
  const pillowRight = new THREE.Mesh(pillowGeom, fabricMat);
  pillowRight.position.set(pillowWidth / 2 + 0.05, totalHeight + duvetThickness + pillowHeight / 2, bedLength / 2 - 0.3);
  pillowRight.rotation.x = -0.3;
  pillowRight.rotation.z = -0.1;
  root.add(pillowRight);

  // Normalize
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