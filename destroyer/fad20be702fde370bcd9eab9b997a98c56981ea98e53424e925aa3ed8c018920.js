export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Yellow rubber/plastic body
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Orange beak
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xFF8C00,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Black eyes
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.2,
  });

  // White eye highlight
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Geometry & Meshes ---

  // 1. Main Body
  // A large sphere flattened vertically and stretched depth-wise
  const bodyGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const body = new THREE.Mesh(bodyGeom, yellowMat);
  body.scale.set(1.0, 0.75, 1.3);
  body.position.set(0, 0.15, 0);
  root.add(body);

  // 2. Head
  // Smaller sphere on top, slightly forward
  const headGeom = new THREE.SphereGeometry(0.32, 32, 32);
  const head = new THREE.Mesh(headGeom, yellowMat);
  head.scale.set(0.9, 0.95, 0.9);
  head.position.set(0, 0.55, 0.25);
  root.add(head);

  // 3. Beak
  // Cone-like shape. Using Cylinder with different radii for top/bottom
  const beakGeom = new THREE.CylinderGeometry(0.08, 0.14, 0.22, 32);
  const beak = new THREE.Mesh(beakGeom, orangeMat);
  // Rotate to point forward and slightly up
  beak.rotation.x = Math.PI / 2; 
  beak.position.set(0, 0.52, 0.55);
  // Taper effect via scale if needed, but geometry radii handle it.
  // Flatten slightly
  beak.scale.set(1.0, 0.6, 1.0);
  root.add(beak);

  // 4. Wings (Left and Right)
  // Flattened spheres on the sides of the body
  const wingGeom = new THREE.SphereGeometry(0.18, 32, 32);
  
  const leftWing = new THREE.Mesh(wingGeom, yellowMat);
  leftWing.scale.set(0.6, 0.4, 0.15); // Flat oval
  leftWing.position.set(-0.45, 0.25, 0.1);
  leftWing.rotation.z = -0.2; // Tilt slightly
  root.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, yellowMat);
  rightWing.scale.set(0.6, 0.4, 0.15);
  rightWing.position.set(0.45, 0.25, 0.1);
  rightWing.rotation.z = 0.2;
  root.add(rightWing);

  // 5. Eyes (Left and Right)
  const eyeGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const highlightGeom = new THREE.SphereGeometry(0.015, 8, 8);

  // Left Eye
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(-0.22, 0.62, 0.52);
  root.add(leftEye);
  
  const leftHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  leftHighlight.position.set(-0.20, 0.63, 0.56);
  root.add(leftHighlight);

  // Right Eye
  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(0.22, 0.62, 0.52);
  root.add(rightEye);

  const rightHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  rightHighlight.position.set(0.20, 0.63, 0.56);
  root.add(rightHighlight);

  // 6. Base
  // Flat cylinder at the bottom
  const baseGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.06, 32);
  const base = new THREE.Mesh(baseGeom, yellowMat);
  base.position.set(0, -0.22, 0);
  root.add(base);

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