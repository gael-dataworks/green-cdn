export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Yellow rubber/plastic body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Orange beak
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xFF8C00,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Black eyes
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.2,
  });

  // White eye highlight
  const highlightMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF,
  });

  // --- Dimensions ---
  const bodyScale = { x: 0.45, y: 0.32, z: 0.55 };
  const headRadius = 0.19;
  const baseRadius = 0.46;
  const baseHeight = 0.06;

  // --- Body ---
  // Main body is a flattened sphere (ellipsoid)
  const bodyGeom = new THREE.SphereGeometry(1, 32, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.scale.set(bodyScale.x, bodyScale.y, bodyScale.z);
  body.position.y = bodyScale.y * 0.6; // Sit on base
  root.add(body);

  // --- Head ---
  // Head is a sphere on top, shifted forward
  const headGeom = new THREE.SphereGeometry(1, 32, 32);
  const head = new THREE.Mesh(headGeom, bodyMat);
  head.scale.setScalar(headRadius);
  // Position: Top of body, slightly forward (+Z)
  head.position.set(0, bodyScale.y + headRadius * 0.8, headRadius * 0.6);
  root.add(head);

  // --- Beak ---
  // Flat cone-like shape. Cylinder with different radii, rotated to point +Z
  const beakGeom = new THREE.CylinderGeometry(0.04, 0.09, 0.14, 16, 1, false, 0, Math.PI * 2);
  const beak = new THREE.Mesh(beakGeom, beakMat);
  // Flatten it (Y scale small)
  beak.scale.set(1.4, 0.6, 1.0);
  // Rotate to point forward (+Z). Cylinder is Y-up, so rotate X -90
  beak.rotation.x = -Math.PI / 2;
  // Position at front of head
  beak.position.set(0, head.position.y - 0.02, head.position.z + headRadius * 0.8);
  root.add(beak);

  // --- Tail ---
  // Small bump at the back
  const tailGeom = new THREE.SphereGeometry(1, 32, 32);
  const tail = new THREE.Mesh(tailGeom, bodyMat);
  tail.scale.set(0.25, 0.15, 0.25);
  tail.position.set(0, bodyScale.y * 0.4, -bodyScale.z * 0.85);
  root.add(tail);

  // --- Wings ---
  // Subtle raised ovals on sides. Flattened spheres.
  const wingGeom = new THREE.SphereGeometry(1, 32, 32);
  const wingLeft = new THREE.Mesh(wingGeom, bodyMat);
  wingLeft.scale.set(0.12, 0.06, 0.22);
  wingLeft.position.set(-bodyScale.x * 0.85, bodyScale.y * 0.5, 0.05);
  // Tilt slightly to follow body curve
  wingLeft.rotation.z = Math.PI / 8;
  wingLeft.rotation.y = -Math.PI / 10;
  root.add(wingLeft);

  const wingRight = new THREE.Mesh(wingGeom, bodyMat);
  wingRight.scale.set(0.12, 0.06, 0.22);
  wingRight.position.set(bodyScale.x * 0.85, bodyScale.y * 0.5, 0.05);
  wingRight.rotation.z = -Math.PI / 8;
  wingRight.rotation.y = Math.PI / 10;
  root.add(wingRight);

  // --- Base ---
  // Flat disk at the bottom
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- Eyes ---
  // Black spheres on the head
  const eyeGeom = new THREE.SphereGeometry(0.028, 16, 16);
  
  // Left Eye
  const eyeLeft = new THREE.Mesh(eyeGeom, eyeMat);
  // Position on head surface
  eyeLeft.position.set(-0.06, head.position.y + 0.04, head.position.z + headRadius * 0.85);
  root.add(eyeLeft);

  // Right Eye
  const eyeRight = new THREE.Mesh(eyeGeom, eyeMat);
  eyeRight.position.set(0.06, head.position.y + 0.04, head.position.z + headRadius * 0.85);
  root.add(eyeRight);

  // --- Eye Highlights ---
  // Tiny white dots
  const highlightGeom = new THREE.SphereGeometry(0.01, 8, 8);
  
  const highlightLeft = new THREE.Mesh(highlightGeom, highlightMat);
  highlightLeft.position.set(-0.05, head.position.y + 0.055, head.position.z + headRadius * 0.92);
  root.add(highlightLeft);

  const highlightRight = new THREE.Mesh(highlightGeom, highlightMat);
  highlightRight.position.set(0.07, head.position.y + 0.055, head.position.z + headRadius * 0.92);
  root.add(highlightRight);

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