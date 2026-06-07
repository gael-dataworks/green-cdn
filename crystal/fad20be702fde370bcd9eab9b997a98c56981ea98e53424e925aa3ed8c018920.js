export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Rubber duck body is smooth plastic/rubber, not fully matte, not metal.
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Beak is similar material but orange.
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xFF8C00,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Eyes are glossy black plastic.
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.1,
  });

  // Eye highlight is pure white.
  const whiteMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.0,
    roughness: 0.1,
  });

  // --- Main Body ---
  // A large flattened sphere for the bulbous body.
  const bodyGeom = new THREE.SphereGeometry(1.0, 32, 32);
  const body = new THREE.Mesh(bodyGeom, yellowMat);
  body.scale.set(1.0, 0.85, 1.2);
  body.position.y = 0.2;
  root.add(body);

  // --- Head ---
  // A smaller sphere sitting on top and slightly forward.
  const headGeom = new THREE.SphereGeometry(0.65, 32, 32);
  const head = new THREE.Mesh(headGeom, yellowMat);
  head.position.set(0, 0.9, 0.4);
  head.scale.set(1.0, 1.0, 1.1); // Slightly elongated
  root.add(head);

  // --- Beak ---
  // Modeled as a scaled sphere segment to get the rounded flat look.
  const beakGeom = new THREE.SphereGeometry(0.35, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const beak = new THREE.Mesh(beakGeom, orangeMat);
  // Scale to flatten and widen
  beak.scale.set(1.3, 0.6, 1.8);
  // Position at front of head
  beak.position.set(0, 0.85, 0.95);
  // Rotate slightly down to match natural duck posture
  beak.rotation.x = -0.2;
  root.add(beak);

  // --- Base ---
  // Flat ring/disc at the bottom.
  const baseGeom = new THREE.CylinderGeometry(0.95, 0.95, 0.15, 32);
  const base = new THREE.Mesh(baseGeom, yellowMat);
  base.position.y = -0.65;
  root.add(base);

  // --- Wing ---
  // A flattened sphere patch on the side.
  const wingGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const wing = new THREE.Mesh(wingGeom, yellowMat);
  wing.scale.set(0.3, 0.1, 0.6);
  wing.position.set(0.85, 0.1, 0.2);
  wing.rotation.z = -0.3;
  wing.rotation.y = 0.2;
  root.add(wing);

  // --- Eyes ---
  // Black spheres
  const eyeGeom = new THREE.SphereGeometry(0.09, 16, 16);
  
  const leftEye = new THREE.Mesh(eyeGeom, blackMat);
  leftEye.position.set(0.25, 1.05, 0.95);
  root.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, blackMat);
  rightEye.position.set(-0.25, 1.05, 0.95);
  root.add(rightEye);

  // Eye Highlights (small white dots)
  const highlightGeom = new THREE.SphereGeometry(0.035, 8, 8);
  
  const leftHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  leftHighlight.position.set(0.28, 1.08, 1.02);
  root.add(leftHighlight);

  const rightHighlight = new THREE.Mesh(highlightGeom, whiteMat);
  rightHighlight.position.set(-0.22, 1.08, 1.02);
  root.add(rightHighlight);

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