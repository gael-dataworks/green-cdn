export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Canvas/Fabric: Matte, high roughness, olive green
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x556B2F,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Darker canvas for flaps/shadows to add depth
  const canvasDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3F4F22,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Nylon Straps: Slightly smoother than canvas, dark gray/black
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x1A1A1A,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Plastic Buckles: Slightly shiny
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const bodyW = 0.38;
  const bodyH = 0.50;
  const bodyD = 0.18;
  
  // --- Main Body ---
  // Use segments to allow soft rounding at the top
  const mainBodyGeom = new THREE.BoxGeometry(bodyW, bodyH, bodyD, 4, 4, 2);
  const positions = mainBodyGeom.attributes.position;
  
  // Soften the top corners by pulling vertices up and slightly forward/back
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    const z = positions.getZ(i);
    // Top vertices (y > 0)
    if (y > 0.15) {
      const factor = (y - 0.15) / (bodyH / 2 - 0.15);
      // Round the top edge
      positions.setY(i, y * 0.9 + 0.05); 
      // Slight puff forward
      if (z > 0) positions.setZ(i, z * 1.1);
    }
  }
  mainBodyGeom.computeVertexNormals();
  
  const main_body = new THREE.Mesh(mainBodyGeom, canvasMat);
  main_body.position.y = 0;
  root.add(main_body);

  // --- Top Flap ---
  // Curved flap covering the top opening
  const flapW = bodyW + 0.04;
  const flapH = 0.18;
  const flapD = bodyD + 0.04;
  const flapGeom = new THREE.BoxGeometry(flapW, flapH, flapD, 4, 2, 2);
  
  // Curve the flap downwards at the front
  const flapPos = flapGeom.attributes.position;
  for (let i = 0; i < flapPos.count; i++) {
    const y = flapPos.getY(i);
    const z = flapPos.getZ(i);
    if (z > 0 && y < 0) {
      // Bend front bottom edge down
      flapPos.setZ(i, z * 0.8);
      flapPos.setY(i, y * 0.8 - 0.02);
    }
  }
  flapGeom.computeVertexNormals();

  const top_flap = new THREE.Mesh(flapGeom, canvasMat);
  top_flap.position.set(0, bodyH / 2 - 0.05, 0);
  root.add(top_flap);

  // --- Lower Pocket ---
  const lowerPocketW = bodyW - 0.04;
  const lowerPocketH = 0.22;
  const lowerPocketD = 0.06;
  const lower_pocket = new THREE.Mesh(
    new THREE.BoxGeometry(lowerPocketW, lowerPocketH, lowerPocketD, 3, 3, 1),
    canvasMat
  );
  lower_pocket.position.set(0, -bodyH / 2 + lowerPocketH / 2 + 0.02, bodyD / 2 + lowerPocketD / 2);
  root.add(lower_pocket);

  // Lower Pocket Flap
  const lpFlapW = lowerPocketW + 0.02;
  const lpFlapH = 0.08;
  const lpFlapD = 0.02;
  const lower_pocket_flap = new THREE.Mesh(
    new THREE.BoxGeometry(lpFlapW, lpFlapH, lpFlapD),
    canvasDarkMat
  );
  lower_pocket_flap.position.set(0, -bodyH / 2 + lowerPocketH + 0.02, bodyD / 2 + lowerPocketD / 2 + 0.01);
  // Slight tilt down
  lower_pocket_flap.rotation.x = -0.15;
  root.add(lower_pocket_flap);

  // Lower Pocket Strap
  const lower_strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.12, 0.005),
    strapMat
  );
  lower_strap.position.set(0.08, -bodyH / 2 + lowerPocketH - 0.06, bodyD / 2 + lowerPocketD + 0.015);
  root.add(lower_strap);
  
  // Lower Pocket Buckle
  const lower_buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.04, 0.01),
    buckleMat
  );
  lower_buckle.position.set(0.08, -bodyH / 2 + lowerPocketH - 0.11, bodyD / 2 + lowerPocketD + 0.015);
  root.add(lower_buckle);

  // --- Upper Pocket ---
  const upperPocketW = bodyW * 0.55;
  const upperPocketH = 0.14;
  const upperPocketD = 0.05;
  const upper_pocket = new THREE.Mesh(
    new THREE.BoxGeometry(upperPocketW, upperPocketH, upperPocketD, 2, 2, 1),
    canvasMat
  );
  upper_pocket.position.set(0.06, 0.08, bodyD / 2 + upperPocketD / 2);
  root.add(upper_pocket);

  // Upper Pocket Flap
  const upFlapW = upperPocketW + 0.02;
  const upFlapH = 0.06;
  const upFlapD = 0.02;
  const upper_pocket_flap = new THREE.Mesh(
    new THREE.BoxGeometry(upFlapW, upFlapH, upFlapD),
    canvasDarkMat
  );
  upper_pocket_flap.position.set(0.06, 0.08 + upperPocketH / 2, bodyD / 2 + upperPocketD / 2 + 0.01);
  upper_pocket_flap.rotation.x = -0.15;
  root.add(upper_pocket_flap);

  // Upper Pocket Strap
  const upper_strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.08, 0.005),
    strapMat
  );
  upper_strap.position.set(0.18, 0.08 + 0.02, bodyD / 2 + upperPocketD + 0.015);
  root.add(upper_strap);

  // --- Top Handle ---
  // Two loops of webbing
  const handleW = 0.08;
  const handleH = 0.06;
  const handleThick = 0.015;
  
  // Left loop
  const handle_left_geom = new THREE.TorusGeometry(handleW / 2, handleThick / 2, 8, 16, Math.PI);
  const top_handle_left = new THREE.Mesh(handle_left_geom, strapMat);
  top_handle_left.position.set(-0.06, bodyH / 2 + handleH / 2, 0);
  top_handle_left.rotation.z = Math.PI / 2;
  top_handle_left.rotation.y = Math.PI / 2; // Face forward/slightly back
  root.add(top_handle_left);

  // Right loop
  const top_handle_right = new THREE.Mesh(handle_left_geom, strapMat);
  top_handle_right.position.set(0.06, bodyH / 2 + handleH / 2, 0);
  top_handle_right.rotation.z = Math.PI / 2;
  top_handle_right.rotation.y = Math.PI / 2;
  root.add(top_handle_right);

  // Handle Base (where they attach)
  const handle_base = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.02, 0.04),
    canvasMat
  );
  handle_base.position.set(0, bodyH / 2 + 0.01, -0.05);
  root.add(handle_base);

  // --- Side Strap Attachment ---
  // Visible on the left side in the reference
  const side_strap = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.15, 0.02),
    strapMat
  );
  side_strap.position.set(-bodyW / 2 - 0.01, 0.1, -0.05);
  side_strap.rotation.y = -0.2;
  root.add(side_strap);

  // --- Stitching / Seams (Subtle details) ---
  // Add thin lines to define pocket edges
  const seamMat = new THREE.LineBasicMaterial({ color: 0x3F4F22 });
  
  // Lower pocket top seam
  const lpSeamPts = [
    new THREE.Vector3(-lowerPocketW/2, -bodyH/2 + lowerPocketH + 0.02, bodyD/2 + lowerPocketD/2 + 0.03),
    new THREE.Vector3(lowerPocketW/2, -bodyH/2 + lowerPocketH + 0.02, bodyD/2 + lowerPocketD/2 + 0.03)
  ];
  const lpSeamGeom = new THREE.BufferGeometry().setFromPoints(lpSeamPts);
  const lpSeam = new THREE.Line(lpSeamGeom, seamMat);
  root.add(lpSeam);

  // Upper pocket bottom seam
  const upSeamPts = [
    new THREE.Vector3(0.06 - upperPocketW/2, 0.08 - upperPocketH/2, bodyD/2 + upperPocketD/2 + 0.03),
    new THREE.Vector3(0.06 + upperPocketW/2, 0.08 - upperPocketH/2, bodyD/2 + upperPocketD/2 + 0.03)
  ];
  const upSeamGeom = new THREE.BufferGeometry().setFromPoints(upSeamPts);
  const upSeam = new THREE.Line(upSeamGeom, seamMat);
  root.add(upSeam);

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