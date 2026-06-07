export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Canvas body: matte, high roughness, beige/tan color
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xB8B095,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Zipper/Accents: slightly smoother, bright lime green
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xCCFF00,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const bagHeight = 0.55;
  const bagWidth = 0.38;
  const bagDepth = 0.18;
  
  // --- 1. Main Body ---
  // Use ExtrudeGeometry to get the rounded-top dome shape
  const bodyShape = new THREE.Shape();
  const w = bagWidth / 2;
  const h = bagHeight;
  const d = bagDepth / 2;
  const cornerRadius = 0.04;

  // Draw profile in XY plane (extruded along Z)
  // Start bottom-left
  bodyShape.moveTo(-w + cornerRadius, -h / 2);
  // Bottom edge
  bodyShape.lineTo(w - cornerRadius, -h / 2);
  // Bottom-right corner
  bodyShape.quadraticCurveTo(w, -h / 2, w, -h / 2 + cornerRadius);
  // Right side up to curve start
  bodyShape.lineTo(w, h * 0.2); 
  // Top dome (semi-ellipse approximation)
  bodyShape.quadraticCurveTo(w, h / 2, 0, h / 2);
  bodyShape.quadraticCurveTo(-w, h / 2, -w, h * 0.2);
  // Left side down
  bodyShape.lineTo(-w, -h / 2 + cornerRadius);
  // Bottom-left corner
  bodyShape.quadraticCurveTo(-w, -h / 2, -w + cornerRadius, -h / 2);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bagDepth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12
  });
  
  // Center the geometry
  bodyGeom.center();
  
  const main_body = new THREE.Mesh(bodyGeom, canvasMat);
  root.add(main_body);

  // --- 2. Front Pocket ---
  // Boxy shape attached to the front (+Z)
  const pocketW = bagWidth * 0.75;
  const pocketH = bagHeight * 0.45;
  const pocketD = 0.05;
  
  const pocketShape = new THREE.Shape();
  const pw = pocketW / 2;
  const ph = pocketH / 2;
  const pr = 0.02;
  
  pocketShape.moveTo(-pw + pr, -ph);
  pocketShape.lineTo(pw - pr, -ph);
  pocketShape.quadraticCurveTo(pw, -ph, pw, -ph + pr);
  pocketShape.lineTo(pw, ph - pr);
  pocketShape.quadraticCurveTo(pw, ph, pw - pr, ph);
  pocketShape.lineTo(-pw + pr, ph);
  pocketShape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
  pocketShape.lineTo(-pw, -ph + pr);
  pocketShape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);
  pocketShape.closePath();

  const pocketGeom = new THREE.ExtrudeGeometry(pocketShape, {
    depth: pocketD,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 8
  });
  pocketGeom.center();

  const front_pocket = new THREE.Mesh(pocketGeom, canvasMat);
  // Position slightly forward of the main body center
  front_pocket.position.set(0, -bagHeight * 0.15, bagDepth / 2 + pocketD / 2 - 0.01);
  root.add(front_pocket);

  // Pocket seam detail (thin tube around edge)
  const seamCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-pw, -ph, 0.002),
    new THREE.Vector3(pw, -ph, 0.002),
    new THREE.Vector3(pw, ph, 0.002),
    new THREE.Vector3(-pw, ph, 0.002),
    new THREE.Vector3(-pw, -ph, 0.002)
  ]);
  // Adjust curve points to match rounded rect roughly
  const seamPoints = [];
  const segs = 20;
  for(let i=0; i<=segs; i++) {
    const t = i/segs;
    const angle = t * Math.PI * 2;
    // Elliptical approximation for seam
    const sx = Math.cos(angle) * pw * 0.95;
    const sy = Math.sin(angle) * ph * 0.95;
    seamPoints.push(new THREE.Vector3(sx, sy, 0.005));
  }
  // Actually, let's just use a simple box wireframe or thin tubes for the pocket border
  const borderMat = new THREE.MeshStandardMaterial({ color: 0x999988, roughness: 0.8 });
  const borderGeom = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-pw, -ph, 0.005),
      new THREE.Vector3(pw, -ph, 0.005),
      new THREE.Vector3(pw, ph, 0.005),
      new THREE.Vector3(-pw, ph, 0.005),
      new THREE.Vector3(-pw, -ph, 0.005)
    ]), 
    16, 0.003, 4, true
  );
  // Better border: Just offset the pocket mesh slightly or add a thin frame
  // Let's skip complex border for now to save draw calls, the extrusion bevel acts as border.

  // --- 3. Zipper ---
  // Follows the top curve of the main body
  // Curve needs to match the top dome of the bodyShape
  const zipHeight = h * 0.25; // Start of curve
  const zipTop = h / 2;
  const zipCurvePoints = [];
  const zipSteps = 30;
  
  for (let i = 0; i <= zipSteps; i++) {
    const t = i / zipSteps;
    const x = (t - 0.5) * 2 * w * 0.85; // Slightly narrower than full width
    // Parabolic arc for the zipper track
    // y = -a*x^2 + top
    // At x=0, y=top. At x=width/2, y=zipHeight
    const a = (zipTop - zipHeight) / ((w * 0.85) ** 2);
    const y = zipTop - a * (x ** 2);
    // Place on the front face of the bag (z = depth/2 + small offset)
    zipCurvePoints.push(new THREE.Vector3(x, y, bagDepth / 2 + 0.005));
  }

  const zipPath = new THREE.CatmullRomCurve3(zipCurvePoints);
  const zipper_tape = new THREE.Mesh(
    new THREE.TubeGeometry(zipPath, 30, 0.008, 8, false),
    accentMat
  );
  root.add(zipper_tape);

  // Zipper Pull Tab
  // Hanging from the middle-right of the zipper
  const pullPos = zipPath.getPoint(0.65); // 65% along the curve
  const zipper_pull = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.04, 0.01),
    accentMat
  );
  zipper_pull.position.copy(pullPos);
  zipper_pull.position.z += 0.015; // Hang slightly forward
  zipper_pull.position.y -= 0.025; // Hang down
  root.add(zipper_pull);

  // --- 4. Top Handle ---
  // A loop at the very top
  const handleGeom = new THREE.TorusGeometry(0.04, 0.012, 8, 16, Math.PI);
  const top_handle = new THREE.Mesh(handleGeom, canvasMat);
  top_handle.position.set(0, bagHeight / 2 + 0.02, 0);
  top_handle.rotation.x = Math.PI / 2; // Lie flat on top
  top_handle.rotation.y = Math.PI / 2; // Orient along depth
  root.add(top_handle);
  
  // Handle base attachments (small cylinders where handle meets bag)
  const handleBaseGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
  const handleLeft = new THREE.Mesh(handleBaseGeom, canvasMat);
  handleLeft.position.set(-0.05, bagHeight / 2, 0);
  root.add(handleLeft);
  const handleRight = new THREE.Mesh(handleBaseGeom, canvasMat);
  handleRight.position.set(0.05, bagHeight / 2, 0);
  root.add(handleRight);

  // --- 5. Side Pocket ---
  // Visible on the left side (-X)
  const sidePocketW = 0.08;
  const sidePocketH = 0.15;
  const sidePocketD = 0.04;
  
  const side_pocket = new THREE.Mesh(
    new THREE.BoxGeometry(sidePocketD, sidePocketH, sidePocketW),
    canvasMat
  );
  // Position on the left side (-X), mid-height
  side_pocket.position.set(-bagDepth / 2 - sidePocketD / 2, 0, 0);
  // Rotate to face outward
  side_pocket.rotation.y = Math.PI / 2;
  root.add(side_pocket);
  
  // Side pocket elastic/trim (lime green strip at top)
  const sideTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.005, 0.015, sidePocketW * 0.9),
    accentMat
  );
  sideTrim.position.set(-bagDepth / 2 - 0.002, sidePocketH / 2 - 0.01, 0);
  sideTrim.rotation.y = Math.PI / 2;
  root.add(sideTrim);

  // --- 6. Shoulder Straps (Partial visibility) ---
  // Just showing the attachment points and a bit of curve on the sides
  const strapW = 0.04;
  const strapGeom = new THREE.BoxGeometry(0.02, 0.15, strapW);
  
  const left_strap = new THREE.Mesh(strapGeom, accentMat);
  left_strap.position.set(-bagWidth / 2 - 0.01, bagHeight * 0.1, -bagDepth * 0.4);
  left_strap.rotation.z = 0.2;
  left_strap.rotation.y = -0.2;
  root.add(left_strap);

  const right_strap = new THREE.Mesh(strapGeom, accentMat);
  right_strap.position.set(bagWidth / 2 + 0.01, bagHeight * 0.1, -bagDepth * 0.4);
  right_strap.rotation.z = -0.2;
  right_strap.rotation.y = 0.2;
  root.add(right_strap);

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