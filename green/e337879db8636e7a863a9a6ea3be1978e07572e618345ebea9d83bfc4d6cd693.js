export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark wood base (Rosewood/Ebony style)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x2a1510,
    metalness: 0.0,
    roughness: 0.65,
  });

  // Polished Gold/Brass keys
  // Using emissive to ensure brightness in dim render as per metal handbook
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe8c84a,
    metalness: 0.3,
    roughness: 0.25,
    emissive: 0xe8c84a,
    emissiveIntensity: 0.35,
  });

  // --- Dimensions ---
  const baseLength = 1.0;
  const baseWidth = 0.28;
  const baseHeight = 0.14;
  const keyWidth = 0.075;
  const keyThickness = 0.018;
  const keyGap = 0.015;
  const totalKeys = 8;
  
  // Calculate key lengths (shortest to longest)
  const minKeyLen = 0.11;
  const maxKeyLen = 0.19;
  const lenStep = (maxKeyLen - minKeyLen) / (totalKeys - 1);

  // --- Base ---
  // Main wooden block
  const baseGeom = new THREE.BoxGeometry(baseWidth, baseHeight, baseLength);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = baseHeight / 2; // Sit on ground
  root.add(base);

  // Feet (small blocks at corners underneath)
  const footSize = 0.04;
  const footHeight = 0.02;
  const footGeom = new THREE.BoxGeometry(footSize, footHeight, footSize);
  const footPositions = [
    [-baseWidth/2 + 0.04, 0, -baseLength/2 + 0.04],
    [ baseWidth/2 - 0.04, 0, -baseLength/2 + 0.04],
    [-baseWidth/2 + 0.04, 0,  baseLength/2 - 0.04],
    [ baseWidth/2 - 0.04, 0,  baseLength/2 - 0.04],
  ];
  for (const [x, y, z] of footPositions) {
    const foot = new THREE.Mesh(footGeom, woodMat);
    foot.position.set(x, y, z);
    root.add(foot);
  }

  // --- Keys & Pins ---
  // Keys are arranged along the Z axis (length of the instrument)
  // We center the array of keys on the base
  const totalKeysLength = totalKeys * keyWidth + (totalKeys - 1) * keyGap;
  const startZ = -totalKeysLength / 2 + keyWidth / 2;

  for (let i = 0; i < totalKeys; i++) {
    // Key Index 0 is shortest (right), Index 7 is longest (left) in image perspective?
    // Actually image shows shortest on right (+Z side usually if facing front), longest on left.
    // Let's make i=0 the shortest key.
    const keyLen = minKeyLen + i * lenStep;
    const keyZ = startZ + i * (keyWidth + keyGap);
    
    // Key Geometry
    const keyGeom = new THREE.BoxGeometry(keyWidth, keyThickness, keyLen);
    const key = new THREE.Mesh(keyGeom, goldMat);
    // Position: On top of base, centered in X, at specific Z
    key.position.set(0, baseHeight + keyThickness / 2 + 0.005, keyZ);
    root.add(key);

    // Pins (2 per key)
    // Small cylinders acting as screws/pins holding the key
    const pinRadius = 0.006;
    const pinHeight = 0.01;
    const pinGeom = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 8);
    // Rotate cylinder to lie flat on key surface? 
    // In image, they look like small domes or flat heads. Let's use small cylinders standing up slightly or flat.
    // They look like small gold dots. Let's use small flattened cylinders.
    pinGeom.rotateX(Math.PI / 2); // Lay flat along Z? No, they are pins going through.
    // Actually they look like screw heads on top. Let's make them small cylinders facing up.
    // Reset rotation, default cylinder is Y-up.
    
    const pinOffsetZ = keyLen / 2 - 0.025; // Near the ends of the key
    
    for (const side of [-1, 1]) {
      const pin = new THREE.Mesh(pinGeom, goldMat);
      // Position on top of the key
      pin.position.set(0, baseHeight + keyThickness + 0.002, keyZ + side * pinOffsetZ);
      root.add(pin);
    }
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