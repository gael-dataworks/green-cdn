export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Yellow rubber/plastic body
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Orange beak
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xFF8C00,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Black eyes
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.5,
    roughness: 0.2,
  });

  // White eye highlights
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.5,
  });

  // --- Main Body (Head + Torso) ---
  // Use LatheGeometry for the smooth, molded plastic silhouette.
  // Profile points (radius, height) defining the side outline.
  const profilePoints = [
    new THREE.Vector2(0, 0),        // Bottom center
    new THREE.Vector2(0.48, 0),     // Base edge
    new THREE.Vector2(0.48, 0.05),  // Base rim
    new THREE.Vector2(0.58, 0.35),  // Belly widest
    new THREE.Vector2(0.55, 0.65),  // Mid body
    new THREE.Vector2(0.45, 0.85),  // Neck
    new THREE.Vector2(0.48, 1.05),  // Head top
    new THREE.Vector2(0.42, 1.00),  // Forehead
    new THREE.Vector2(0.35, 0.85),  // Beak root area
    new THREE.Vector2(0.25, 0.65),  // Chest
    new THREE.Vector2(0.15, 0.35),  // Lower chest
    new THREE.Vector2(0, 0),        // Close at axis (creates solid volume)
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Smooth the geometry normals for a plastic look
  bodyGeom.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeom, yellowMat);
  root.add(body);

  // --- Beak ---
  // Modeled as a scaled sphere for that rounded rubber look
  const beakGeom = new THREE.SphereGeometry(0.14, 32, 32);
  const beak = new THREE.Mesh(beakGeom, orangeMat);
  beak.scale.set(1.4, 0.7, 1.0); // Flatten vertically, elongate forward
  beak.position.set(0, 0.85, 0.45); // Position at front of face
  root.add(beak);

  // --- Wings ---
  // Flattened spheres on the sides
  const wingGeom = new THREE.SphereGeometry(0.16, 32, 32);
  const wingMat = yellowMat; // Same material as body
  
  const leftWing = new THREE.Mesh(wingGeom, wingMat);
  leftWing.scale.set(0.2, 0.6, 1.0); // Very thin, tall oval
  leftWing.position.set(0.56, 0.40, 0);
  leftWing.rotation.z = -0.2; // Tilt slightly back
  root.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, wingMat);
  rightWing.scale.set(0.2, 0.6, 1.0);
  rightWing.position.set(-0.56, 0.40, 0);
  rightWing.rotation.z = 0.2;
  root.add(rightWing);

  // --- Eyes ---
  const eyeGeom = new THREE.SphereGeometry(0.045, 16, 16);
  const highlightGeom = new THREE.SphereGeometry(0.015, 8, 8);

  // Left Eye
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(0.28, 0.95, 0.42);
  root.add(leftEye);
  
  const leftHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  leftHighlight.position.set(0.30, 0.97, 0.44);
  root.add(leftHighlight);

  // Right Eye
  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(-0.28, 0.95, 0.42);
  root.add(rightEye);

  const rightHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  rightHighlight.position.set(-0.26, 0.97, 0.44);
  root.add(rightHighlight);

  // --- Base ---
  // Flat ring/disc at the bottom
  const baseGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.04, 32);
  const base = new THREE.Mesh(baseGeom, yellowMat);
  base.position.y = 0.02;
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