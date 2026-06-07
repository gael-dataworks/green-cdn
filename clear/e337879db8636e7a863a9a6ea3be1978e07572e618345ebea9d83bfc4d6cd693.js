export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark polished wood for the base
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2318,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Polished gold/brass for keys and screws
  // Metalness capped at 0.6 to prevent black rendering without env map
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Base ---
  // Main wooden block
  const baseWidth = 0.38;
  const baseHeight = 0.14;
  const baseLength = 1.1;
  const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // Feet (small blocks at corners underneath)
  const footSize = 0.08;
  const footHeight = 0.04;
  const footGeom = new THREE.BoxGeometry(footSize, footHeight, footSize);
  const footPositions = [
    [-baseWidth / 2 + 0.05, 0, -baseLength / 2 + 0.05],
    [baseWidth / 2 - 0.05, 0, -baseLength / 2 + 0.05],
    [-baseWidth / 2 + 0.05, 0, baseLength / 2 - 0.05],
    [baseWidth / 2 - 0.05, 0, baseLength / 2 - 0.05],
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, woodMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // --- Keys ---
  const keyCount = 8;
  const keyWidth = 0.06;
  const keyThickness = 0.012;
  const keyY = baseHeight + 0.015; // Slightly above base

  // Lengths interpolate from shortest (far end) to longest (near end)
  const minLength = 0.16;
  const maxLength = 0.29;
  
  // Spacing
  const totalSpan = 0.85;
  const startZ = -totalSpan / 2;
  const stepZ = totalSpan / (keyCount - 1);

  for (let i = 0; i < keyCount; i++) {
    // Calculate length for this key (linear interpolation)
    const t = i / (keyCount - 1);
    const keyLength = minLength + (maxLength - minLength) * t;
    
    // Position Z
    const keyZ = startZ + stepZ * i;

    // Key Mesh
    const keyGeom = new THREE.BoxGeometry(keyWidth, keyThickness, keyLength);
    const key = new THREE.Mesh(keyGeom, goldMat);
    key.position.set(0, keyY, keyZ);
    // Name for critic targeting
    key.name = `key_${i}`;
    root.add(key);

    // Screws (2 per key)
    const screwRadius = 0.008;
    const screwHeight = 0.006;
    const screwGeom = new THREE.CylinderGeometry(screwRadius, screwRadius, screwHeight, 12);
    const screwOffsetZ = (keyLength / 2) - 0.025; // Inset from ends

    for (const side of [-1, 1]) {
      const screw = new THREE.Mesh(screwGeom, goldMat);
      // Position at ends of the key
      screw.position.set(side * (keyWidth / 2 - 0.01), keyY + keyThickness / 2 + screwHeight / 2, keyZ + side * screwOffsetZ);
      screw.name = `screw_${i}_${side > 0 ? 'r' : 'l'}`;
      root.add(screw);
    }
  }

  // --- End Block (Left side visual detail) ---
  // The image shows a slightly raised or distinct block on the left end
  const endBlockWidth = 0.06;
  const endBlockHeight = 0.04;
  const endBlockDepth = baseWidth + 0.02;
  const endBlockGeom = new THREE.BoxGeometry(endBlockWidth, endBlockHeight, endBlockDepth);
  const endBlock = new THREE.Mesh(endBlockGeom, woodMat);
  endBlock.position.set(-baseLength / 2 - endBlockWidth / 2 + 0.01, baseHeight + endBlockHeight / 2, 0);
  root.add(endBlock);

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