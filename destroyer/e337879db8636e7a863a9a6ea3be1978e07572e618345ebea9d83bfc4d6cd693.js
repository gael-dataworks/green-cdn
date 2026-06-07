export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark wood base (Rosewood/Mahogany look)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2318,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Gold/Brass bars - capped metalness, added emissive for brightness
  const barMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.3,
  });

  // Mounting pins (Gold/Silver mix, using gold here for consistency)
  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xe0c060,
    metalness: 0.7,
    roughness: 0.2,
    emissive: 0xe0c060,
    emissiveIntensity: 0.2,
  });

  // --- Dimensions ---
  const baseLength = 1.2;
  const baseWidth = 0.28;
  const baseHeight = 0.14;
  const barCount = 8;
  const barWidth = 0.065;
  const barThickness = 0.018;
  const minBarLength = 0.09;
  const maxBarLength = 0.16;
  const pinRadius = 0.008;
  const pinHeight = 0.025;

  // --- Base ---
  // Main wooden block
  const baseGeom = new THREE.BoxGeometry(baseLength, baseHeight, baseWidth);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Small feet/recessed bottom detail (optional but adds realism)
  const footGeom = new THREE.BoxGeometry(baseLength * 0.9, 0.02, baseWidth * 0.8);
  const foot = new THREE.Mesh(footGeom, woodMat);
  foot.position.y = 0.01;
  root.add(foot);

  // --- Bars & Pins ---
  // We place bars along the X axis, centered on the base.
  // The image shows bars increasing in length from left (front) to right (back).
  // Let's align them along the X axis for simplicity, or Z?
  // Image: Long axis of the instrument is diagonal. Let's align instrument along X axis.
  // Left side (negative X) = Short bars. Right side (positive X) = Long bars.
  
  const startX = -baseLength / 2 + 0.1; // Offset from edge
  const endX = baseLength / 2 - 0.1;
  const totalSpan = endX - startX;
  const stepX = totalSpan / (barCount - 1);

  for (let i = 0; i < barCount; i++) {
    // Calculate progress (0 to 1)
    const t = i / (barCount - 1);
    
    // Interpolate length
    const currentLength = minBarLength + (maxBarLength - minBarLength) * t;
    
    // Position X
    const posX = startX + t * totalSpan;
    
    // Position Y (sitting on top of base)
    const posY = baseHeight + barThickness / 2 + 0.002; // Slight offset above wood

    // Create Bar
    const barGeom = new THREE.BoxGeometry(currentLength, barThickness, barWidth);
    const bar = new THREE.Mesh(barGeom, barMat);
    bar.position.set(posX, posY, 0);
    // Add slight rounding simulation via scale or just keep boxy for low poly
    root.add(bar);

    // Create Pins (2 per bar)
    const pinOffset = currentLength / 2 - 0.015; // Inset from edge
    
    // Left Pin
    const pinL = new THREE.Mesh(new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 8), pinMat);
    pinL.position.set(posX - pinOffset, baseHeight + pinHeight / 2, 0);
    root.add(pinL);

    // Right Pin
    const pinR = new THREE.Mesh(new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 8), pinMat);
    pinR.position.set(posX + pinOffset, baseHeight + pinHeight / 2, 0);
    root.add(pinR);
  }

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