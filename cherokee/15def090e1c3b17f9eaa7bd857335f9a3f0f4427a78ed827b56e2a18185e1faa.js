export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Main fabric: Taupe/Beige canvas. High roughness, no metalness.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xB2ADA5,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Zipper/Accents: Neon Lime. Plastic/Nylon texture.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xCCFF33,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const width = 0.7;
  const height = 0.9;
  const depth = 0.25;
  const pocketHeight = 0.35;
  const pocketWidth = 0.5;

  // --- Main Body ---
  // Shape: Rounded rectangle, taller than wide, flat bottom, rounded top.
  const mainShape = new THREE.Shape();
  const w2 = width / 2;
  const h2 = height / 2;
  const topCurve = 0.15; // How much of the top is curved

  mainShape.moveTo(-w2, -h2);
  mainShape.lineTo(-w2, h2 - topCurve);
  // Quadratic curve for the top arch
  mainShape.quadraticCurveTo(0, h2 + 0.05, w2, h2 - topCurve);
  mainShape.lineTo(w2, -h2);
  mainShape.lineTo(-w2, -h2);

  const mainGeom = new THREE.ExtrudeGeometry(mainShape, {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 4,
    steps: 1,
    curveSegments: 12,
  });

  // Center the geometry so pivot is at geometric center
  mainGeom.center();
  const main_body = new THREE.Mesh(mainGeom, bodyMat);
  root.add(main_body);

  // --- Front Pocket ---
  // Shape: Rectangle with rounded bottom corners, attached to lower front.
  const pocketShape = new THREE.Shape();
  const pw2 = pocketWidth / 2;
  const ph2 = pocketHeight / 2;
  const pocketDepth = 0.06;

  pocketShape.moveTo(-pw2, -ph2);
  pocketShape.lineTo(-pw2, ph2);
  pocketShape.lineTo(pw2, ph2);
  pocketShape.lineTo(pw2, -ph2);
  // Simple rounded bottom via curve or just straight for low poly look
  // Let's do a slight curve at bottom corners
  pocketShape.quadraticCurveTo(0, -ph2 - 0.02, -pw2, -ph2);
  pocketShape.lineTo(-pw2, -ph2); // Close

  const pocketGeom = new THREE.ExtrudeGeometry(pocketShape, {
    depth: pocketDepth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  pocketGeom.center();

  const front_pocket = new THREE.Mesh(pocketGeom, bodyMat);
  // Position on front face. Main body depth is `depth`. Front face is at z = depth/2 + bevel.
  // Pocket pivot is centered, so we offset by half main depth + half pocket depth + small gap
  front_pocket.position.set(0, -0.15, (depth / 2) + (pocketDepth / 2) + 0.01);
  root.add(front_pocket);

  // --- Zipper Track ---
  // Follows the top arch and comes down the front right side.
  // We need points in local space of the main body.
  // Main body is centered. Top is at y = height/2. Front is z = depth/2.
  const zipperPoints = [];
  const zDepth = depth / 2 + 0.015; // Slightly in front of surface

  // Start left side (hidden behind curve)
  zipperPoints.push(new THREE.Vector3(-w2 * 0.8, h2 * 0.6, zDepth));
  // Top arch
  zipperPoints.push(new THREE.Vector3(-w2 * 0.4, h2 * 0.95, zDepth));
  zipperPoints.push(new THREE.Vector3(0, h2 * 1.05, zDepth)); // Peak
  zipperPoints.push(new THREE.Vector3(w2 * 0.4, h2 * 0.95, zDepth));
  // Down the front
  zipperPoints.push(new THREE.Vector3(w2 * 0.6, h2 * 0.5, zDepth));
  zipperPoints.push(new THREE.Vector3(w2 * 0.7, h2 * 0.1, zDepth)); // End point near pull tab

  const zipperCurve = new THREE.CatmullRomCurve3(zipperPoints);
  const zipperGeom = new THREE.TubeGeometry(zipperCurve, 20, 0.015, 8, false);
  const zipper_track = new THREE.Mesh(zipperGeom, accentMat);
  root.add(zipper_track);

  // --- Zipper Pull ---
  // Small tab hanging from the end of the zipper track.
  const pullGeom = new THREE.BoxGeometry(0.04, 0.08, 0.02);
  const zipper_pull = new THREE.Mesh(pullGeom, accentMat);
  // Position at the last point of the curve
  const lastPoint = zipperPoints[zipperPoints.length - 1];
  zipper_pull.position.copy(lastPoint);
  zipper_pull.position.y -= 0.05; // Hang down
  root.add(zipper_pull);

  // --- Top Handle ---
  // Loop at the very top.
  const handleRadius = 0.08;
  const handleTube = 0.025;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 12, 24, Math.PI);
  const top_handle = new THREE.Mesh(handleGeom, bodyMat);
  top_handle.position.set(0, h2 + 0.05, 0);
  top_handle.rotation.x = Math.PI / 2; // Lay flat on top
  // Rotate so the open part faces back? Or just center it.
  // The image shows a loop standing up.
  top_handle.rotation.x = 0;
  top_handle.rotation.z = Math.PI / 2; // Stand up vertically along Y
  // Actually, a torus is in XY plane. Rotation Z=90 makes it YZ plane (vertical loop).
  // We want it centered on top.
  top_handle.position.set(0, h2 + handleRadius, 0);
  root.add(top_handle);

  // --- Side Loop ---
  // Visible on the left side (viewer's left, object's -X).
  const sideLoopRadius = 0.05;
  const sideLoopTube = 0.015;
  const sideLoopGeom = new THREE.TorusGeometry(sideLoopRadius, sideLoopTube, 8, 16, Math.PI * 1.8);
  const side_loop = new THREE.Mesh(sideLoopGeom, accentMat);
  // Position on left side, midway up
  side_loop.position.set(-w2 - 0.01, 0, 0);
  side_loop.rotation.y = Math.PI / 2; // Face outward
  root.add(side_loop);

  // --- Back Straps (Simplified) ---
  // Two attachment points at top back.
  const strapAttachGeom = new THREE.BoxGeometry(0.08, 0.12, 0.02);
  const left_strap_attach = new THREE.Mesh(strapAttachGeom, bodyMat);
  left_strap_attach.position.set(-w2 * 0.4, h2 * 0.8, -depth / 2 - 0.01);
  root.add(left_strap_attach);

  const right_strap_attach = new THREE.Mesh(strapAttachGeom, bodyMat);
  right_strap_attach.position.set(w2 * 0.4, h2 * 0.8, -depth / 2 - 0.01);
  root.add(right_strap_attach);

  // --- Bottom Base (Reinforcement) ---
  // Slightly darker or just structural. Let's add a thin base plate.
  const baseGeom = new THREE.BoxGeometry(width * 0.9, 0.02, depth * 0.9);
  const bottom_base = new THREE.Mesh(baseGeom, bodyMat);
  bottom_base.position.set(0, -h2 - 0.01, 0);
  root.add(bottom_base);

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