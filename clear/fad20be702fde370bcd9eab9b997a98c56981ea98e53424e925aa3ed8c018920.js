export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Yellow rubber body: matte plastic look
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Orange beak: similar plastic finish
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xFF8C00,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Black eye: glossy
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.2,
  });

  // White highlight: emissive to pop against black
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.1,
    emissive: 0xFFFFFF,
    emissiveIntensity: 0.5,
  });

  // --- Body ---
  // Main body is a flattened sphere
  const bodyGeom = new THREE.SphereGeometry(0.32, 32, 32);
  const body = new THREE.Mesh(bodyGeom, yellowMat);
  body.scale.set(1.0, 0.75, 1.1);
  body.position.y = 0.15;
  root.add(body);

  // --- Head ---
  // Head is a smaller sphere on top, tilted slightly forward
  const headGeom = new THREE.SphereGeometry(0.18, 32, 32);
  const head = new THREE.Mesh(headGeom, yellowMat);
  head.position.set(0, 0.38, 0.12);
  head.scale.set(1.0, 1.0, 0.9);
  root.add(head);

  // --- Beak ---
  // Upper beak: tapered cylinder/cone shape
  const beakTopGeom = new THREE.CylinderGeometry(0.06, 0.10, 0.14, 16);
  const beakTop = new THREE.Mesh(beakTopGeom, orangeMat);
  beakTop.rotation.x = Math.PI / 2;
  beakTop.position.set(0, 0.36, 0.26);
  beakTop.scale.set(1.0, 0.6, 1.0); // Flatten slightly
  root.add(beakTop);

  // Lower beak: smaller tapered shape underneath
  const beakBottomGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.12, 16);
  const beakBottom = new THREE.Mesh(beakBottomGeom, orangeMat);
  beakBottom.rotation.x = Math.PI / 2;
  beakBottom.position.set(0, 0.32, 0.25);
  beakBottom.scale.set(1.0, 0.5, 1.0);
  root.add(beakBottom);

  // --- Wings ---
  // Subtle raised ovals on the sides. Use flattened spheres or extruded circles.
  // Using flattened spheres for smooth integration.
  const wingGeom = new THREE.SphereGeometry(0.14, 24, 24);
  
  const leftWing = new THREE.Mesh(wingGeom, yellowMat);
  leftWing.position.set(-0.28, 0.18, 0.05);
  leftWing.scale.set(0.4, 0.6, 1.2); // Thin, tall, long
  leftWing.rotation.z = Math.PI / 8;
  leftWing.rotation.y = -Math.PI / 12;
  root.add(leftWing);

  const rightWing = new THREE.Mesh(wingGeom, yellowMat);
  rightWing.position.set(0.28, 0.18, 0.05);
  rightWing.scale.set(0.4, 0.6, 1.2);
  rightWing.rotation.z = -Math.PI / 8;
  rightWing.rotation.y = Math.PI / 12;
  root.add(rightWing);

  // --- Base ---
  // Flat circular rim at the bottom
  const baseGeom = new THREE.CylinderGeometry(0.33, 0.33, 0.04, 32);
  const base = new THREE.Mesh(baseGeom, yellowMat);
  base.position.y = -0.08;
  root.add(base);

  // --- Eye ---
  // Black circle on the side of the head
  const eyeGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const eye = new THREE.Mesh(eyeGeom, blackMat);
  // Position on the side of the head
  eye.position.set(0.14, 0.42, 0.18);
  eye.scale.set(1.0, 1.0, 0.2); // Flatten to look like a painted eye or inset
  root.add(eye);

  // Eye highlight (white dot)
  const highlightGeom = new THREE.SphereGeometry(0.012, 8, 8);
  const highlight = new THREE.Mesh(highlightGeom, whiteMat);
  highlight.position.set(0.155, 0.435, 0.195); // Slightly offset on the eye
  root.add(highlight);

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