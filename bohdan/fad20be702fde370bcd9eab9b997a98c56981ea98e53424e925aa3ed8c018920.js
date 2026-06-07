export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Yellow rubber/plastic body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Orange beak
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xff8c00,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Black glossy eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.2,
  });

  // White eye highlight
  const highlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
  });

  // --- Geometry Construction ---

  // 1. Body (Lathe for that specific molded silhouette)
  // Profile: radius (x), height (y)
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.42, 0.00), // Bottom edge
    new THREE.Vector2(0.48, 0.15), // Belly widest
    new THREE.Vector2(0.45, 0.35), // Body taper
    new THREE.Vector2(0.32, 0.50), // Neck start
    new THREE.Vector2(0.34, 0.65), // Head widest
    new THREE.Vector2(0.28, 0.78), // Head top curve
    new THREE.Vector2(0.00, 0.82), // Top center
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // 2. Base (Flat disc at bottom)
  const baseGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.04, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = -0.02; // Slightly below body bottom to merge
  root.add(base);

  // 3. Beak (Flattened cone/sphere hybrid)
  // Using a sphere scaled to look like a blunt beak
  const beakGeom = new THREE.SphereGeometry(0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const beak = new THREE.Mesh(beakGeom, beakMat);
  // Position: Front of head, slightly down
  beak.position.set(0.22, 0.55, 0.28);
  // Rotate to point forward and slightly down
  beak.rotation.x = -Math.PI / 6;
  beak.rotation.z = -Math.PI / 12;
  // Scale to flatten and elongate
  beak.scale.set(1.2, 0.6, 1.5);
  root.add(beak);

  // 4. Eyes
  const eyeGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const highlightGeom = new THREE.SphereGeometry(0.015, 8, 8);

  // Left Eye
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(0.22, 0.62, 0.28);
  leftEye.rotation.y = -Math.PI / 8; // Angle slightly inward
  root.add(leftEye);

  const leftHighlight = new THREE.Mesh(highlightGeom, highlightMat);
  leftHighlight.position.set(0.24, 0.64, 0.30);
  leftHighlight.rotation.y = -Math.PI / 8;
  root.add(leftHighlight);

  // Right Eye
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(-0.22, 0.62, 0.28);
  rightEye.rotation.y = Math.PI / 8;
  root.add(rightEye);

  const rightHighlight = new THREE.Mesh(highlightGeom, highlightMat);
  rightHighlight.position.set(-0.24, 0.64, 0.30);
  rightHighlight.rotation.y = Math.PI / 8;
  root.add(rightHighlight);

  // 5. Wings (Subtle raised ovals on sides)
  // Using a flattened sphere segment or scaled sphere
  const wingGeom = new THREE.SphereGeometry(0.18, 32, 16, 0, Math.PI, 0, Math.PI / 2);
  
  const leftWing = new THREE.Mesh(wingGeom, bodyMat);
  leftWing.position.set(0.38, 0.35, 0.0);
  leftWing.rotation.z = Math.PI / 2;
  leftWing.rotation.y = Math.PI / 2;
  leftWing.scale.set(1.4, 0.4, 0.8); // Flatten and elongate
  root.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, bodyMat);
  rightWing.position.set(-0.38, 0.35, 0.0);
  rightWing.rotation.z = -Math.PI / 2;
  rightWing.rotation.y = -Math.PI / 2;
  rightWing.scale.set(1.4, 0.4, 0.8);
  root.add(rightWing);

  // Normalize to fit unit cube
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