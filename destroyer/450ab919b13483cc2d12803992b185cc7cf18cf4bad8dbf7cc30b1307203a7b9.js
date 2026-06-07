export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal for face and markers. Metalness capped at 0.6 per rules.
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Darker metal for hands and center cap
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.6,
    roughness: 0.3,
  });

  // 1. Clock Face
  // Rectangular plate. Proportions approx 4:3.
  const faceWidth = 1.0;
  const faceHeight = 0.75;
  const faceDepth = 0.04;
  const faceGeom = new THREE.BoxGeometry(faceWidth, faceHeight, faceDepth);
  const face = new THREE.Mesh(faceGeom, faceMat);
  root.add(face);

  // 2. Hour Markers
  // 12 small rectangular bars arranged in a circle.
  const markerGeom = new THREE.BoxGeometry(0.025, 0.07, 0.015);
  const markerRadius = 0.32;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const marker = new THREE.Mesh(markerGeom, faceMat);
    
    // Position on circle (X is sin, Y is cos for clock face orientation)
    marker.position.x = Math.sin(angle) * markerRadius;
    marker.position.y = Math.cos(angle) * markerRadius;
    marker.position.z = faceDepth / 2 + 0.005; // Slightly raised

    // Rotate to point towards center
    marker.rotation.z = -angle;
    
    root.add(marker);
  }

  // 3. Hands
  // Helper to create a hand
  function createHand(width, length, material) {
    const geom = new THREE.BoxGeometry(width, length, 0.01);
    const mesh = new THREE.Mesh(geom, material);
    // Pivot adjustment: geometry is centered, so move up by half length
    mesh.position.y = length / 2;
    return mesh;
  }

  // Hour Hand (Shorter, thicker)
  // Time: ~10:10 -> Hour hand is near 10 (-60 degrees from 12 is 10 o'clock? No. 12 is 0. 10 is -60 deg? 360/12 = 30 deg per hour. 10 is 2 hours back = -60 deg.)
  // Actually 10 o'clock is 300 degrees or -60 degrees.
  const hourHand = createHand(0.035, 0.22, handMat);
  hourHand.rotation.z = -Math.PI / 3; // -60 degrees
  hourHand.position.z = faceDepth / 2 + 0.02;
  root.add(hourHand);

  // Minute Hand (Longer, thinner)
  // Time: 10 minutes -> 2 o'clock position (+60 degrees)
  const minuteHand = createHand(0.025, 0.32, handMat);
  minuteHand.rotation.z = Math.PI / 3; // 60 degrees
  minuteHand.position.z = faceDepth / 2 + 0.025;
  root.add(minuteHand);

  // Second Hand (Very thin, long)
  // Near 12 o'clock
  const secondHand = createHand(0.008, 0.36, handMat);
  secondHand.rotation.z = -0.1; // Slightly before 12
  secondHand.position.z = faceDepth / 2 + 0.03;
  root.add(secondHand);

  // 4. Center Cap
  const capGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
  const cap = new THREE.Mesh(capGeom, handMat);
  cap.rotation.x = Math.PI / 2; // Cylinder is Y-up, we want Z-facing
  cap.position.z = faceDepth / 2 + 0.035;
  root.add(cap);

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