export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const redWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd63030,
    metalness: 0.0,
    roughness: 0.65,
  });

  const natWoodMat = new THREE.MeshStandardMaterial({
    color: 0xdcb386,
    metalness: 0.0,
    roughness: 0.75,
  });

  // --- Dowels (Rails) ---
  // Two wooden rods running along the X-axis, supporting the keys.
  const dowelRadius = 0.018;
  const dowelLength = 0.72;
  const dowelGeom = new THREE.CylinderGeometry(dowelRadius, dowelRadius, dowelLength, 16);
  dowelGeom.rotateZ(Math.PI / 2); // Align cylinder (default Y-up) to X-axis

  const dowelOffsetZ = 0.055; // Distance from center line

  const topDowel = new THREE.Mesh(dowelGeom, natWoodMat);
  topDowel.position.set(0, 0, dowelOffsetZ);
  root.add(topDowel);

  const bottomDowel = new THREE.Mesh(dowelGeom, natWoodMat);
  bottomDowel.position.set(0, 0, -dowelOffsetZ);
  root.add(bottomDowel);

  // --- Keys (Slats) ---
  // 10 red wooden slats, increasing in length from left to right.
  // The first two are narrower than the rest.
  
  const keyThickness = 0.028;
  const keyGap = 0.015;
  const baseWidth = 0.045;
  const narrowWidth = 0.032;
  
  const minLength = 0.13;
  const maxLength = 0.23;

  // Calculate total width to center the assembly
  // 2 narrow + 8 wide + 9 gaps
  const totalWidth = (2 * narrowWidth) + (8 * baseWidth) + (9 * keyGap);
  const startX = -totalWidth / 2;

  let currentX = startX;

  for (let i = 0; i < 10; i++) {
    // Determine dimensions for this key
    const isNarrow = i < 2;
    const width = isNarrow ? narrowWidth : baseWidth;
    
    // Interpolate length
    const t = i / 9; // 0.0 to 1.0
    const length = minLength + (maxLength - minLength) * t;

    const keyGeom = new THREE.BoxGeometry(width, keyThickness, length);
    const key = new THREE.Mesh(keyGeom, redWoodMat);

    // Position
    // Y is 0 (centered on dowels)
    // X is current position
    // Z is 0 (centered on dowels)
    key.position.set(currentX + width / 2, 0, 0);

    // Add a small black cylinder to simulate the hole through the key
    // This prevents the "clipping" look where the dowel disappears inside the red wood
    const holeRadius = dowelRadius + 0.002; // Slightly larger than dowel
    const holeGeom = new THREE.CylinderGeometry(holeRadius, holeRadius, width + 0.004, 12);
    holeGeom.rotateZ(Math.PI / 2);
    
    // We need two holes per key, aligned with the dowels
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x3a1a1a, roughness: 0.9 });
    
    const hole1 = new THREE.Mesh(holeGeom, holeMat);
    hole1.position.set(0, 0, dowelOffsetZ);
    key.add(hole1);

    const hole2 = new THREE.Mesh(holeGeom, holeMat);
    hole2.position.set(0, 0, -dowelOffsetZ);
    key.add(hole2);

    root.add(key);

    // Advance X for next key
    currentX += width + keyGap;
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