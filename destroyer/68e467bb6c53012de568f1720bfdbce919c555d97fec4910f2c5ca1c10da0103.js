export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Velvet: High roughness, zero metalness, deep purple color.
  const velvetMat = new THREE.MeshStandardMaterial({
    color: 0x7036a6,
    metalness: 0.0,
    roughness: 0.92,
  });

  // --- Dimensions ---
  const width = 0.90;
  const height = 0.55;
  const depth = 0.14;
  const flapHeight = 0.28;
  const cornerRadius = 0.04;

  // --- Helper: Rounded Rectangle Shape ---
  function createRoundedRectShape(w, h, r) {
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    // Start bottom-left
    shape.moveTo(x + r, y);
    // Bottom edge
    shape.lineTo(x + w - r, y);
    // Bottom-right corner
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    // Right edge
    shape.lineTo(x + w, y + h - r);
    // Top-right corner
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    // Top edge
    shape.lineTo(x + r, y + h);
    // Top-left corner
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    // Left edge
    shape.lineTo(x, y + r);
    // Bottom-left corner
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  // --- Body Base ---
  // The main compartment. Extruded rounded rectangle.
  const bodyShape = createRoundedRectShape(width, height, cornerRadius);
  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });
  // Center the extrusion (ExtrudeGeometry goes +Z by default)
  bodyGeom.translate(0, 0, -depth / 2);
  const body = new THREE.Mesh(bodyGeom, velvetMat);
  root.add(body);

  // --- Flap ---
  // The top cover. Slightly narrower to sit nicely on the front.
  const flapWidth = width * 0.96;
  const flapShape = createRoundedRectShape(flapWidth, flapHeight, cornerRadius);
  const flapGeom = new THREE.ExtrudeGeometry(flapShape, {
    depth: 0.04, // Thin flap
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });
  // Center flap geometry
  flapGeom.translate(0, 0, -0.02);
  const flap = new THREE.Mesh(flapGeom, velvetMat);
  // Position flap at the top of the body, hinged at the back
  // Body height is 'height'. Flap pivot is at top-back.
  // We position the flap mesh center such that its top-back aligns with body top-back.
  // Flap local Y is 0 at center. Top is flapHeight/2.
  // We want flap top to be at body top (height/2).
  // We want flap to fold over the front.
  flap.position.set(0, height / 2 - flapHeight / 2, depth / 2 + 0.02);
  // Rotate slightly forward to drape
  flap.rotation.x = -0.15;
  root.add(flap);

  // --- Bow ---
  const bowGroup = new THREE.Group();
  
  // Bow Loops
  const loopRadius = 0.13;
  const tubeRadius = 0.055;
  const loopGeom = new THREE.TorusGeometry(loopRadius, tubeRadius, 16, 32, Math.PI * 1.8); // Slightly open torus for softness
  
  // Left Loop
  const bow_left_loop = new THREE.Mesh(loopGeom, velvetMat);
  bow_left_loop.position.set(-0.14, 0, 0.05);
  // Orient: Torus is XY. Rotate Z to stand up, Rotate Y to angle out.
  bow_left_loop.rotation.z = Math.PI / 2;
  bow_left_loop.rotation.y = -Math.PI / 6;
  bowGroup.add(bow_left_loop);

  // Right Loop
  const bow_right_loop = new THREE.Mesh(loopGeom, velvetMat);
  bow_right_loop.position.set(0.14, 0, 0.05);
  bow_right_loop.rotation.z = Math.PI / 2;
  bow_right_loop.rotation.y = Math.PI / 6;
  bowGroup.add(bow_right_loop);

  // Bow Knot (Center)
  const knotGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 24);
  const bow_knot = new THREE.Mesh(knotGeom, velvetMat);
  bow_knot.rotation.x = Math.PI / 2; // Lay horizontal
  bow_knot.position.set(0, 0, 0.08); // Slightly in front of loops
  bowGroup.add(bow_knot);

  // Bow Tails (Small hanging bits)
  const tailGeom = new THREE.CapsuleGeometry(0.04, 0.12, 8, 8);
  const bow_tail_left = new THREE.Mesh(tailGeom, velvetMat);
  bow_tail_left.position.set(-0.06, -0.12, 0.05);
  bow_tail_left.rotation.z = 0.3;
  bowGroup.add(bow_tail_left);

  const bow_tail_right = new THREE.Mesh(tailGeom, velvetMat);
  bow_tail_right.position.set(0.06, -0.12, 0.05);
  bow_tail_right.rotation.z = -0.3;
  bowGroup.add(bow_tail_right);

  // Position the entire bow group on the flap
  // Flap center is at (0, height/2 - flapHeight/2).
  // We want bow centered on the flap vertically and horizontally.
  bowGroup.position.set(0, height / 2 - flapHeight / 2, 0);
  // Match flap rotation
  bowGroup.rotation.copy(flap.rotation);
  // Adjust Z to sit on surface of flap
  bowGroup.position.z += depth / 2 + 0.04;
  
  root.add(bowGroup);

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