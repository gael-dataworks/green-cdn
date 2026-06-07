export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive canvas: high roughness, no metalness.
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x5D6D42,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Darker canvas for pockets/flaps to create subtle contrast/depth
  const canvasDarkMat = new THREE.MeshStandardMaterial({
    color: 0x4F5C38,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Black nylon webbing for straps and buckles
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.8,
  });

  // Plastic buckles (slightly shinier than fabric)
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.2,
    roughness: 0.4,
  });

  // Stitching thread (dark brown/black)
  const stitchMat = new THREE.MeshBasicMaterial({
    color: 0x222222,
  });

  // --- Dimensions ---
  const bodyW = 0.32;
  const bodyH = 0.42;
  const bodyD = 0.14;

  // --- Main Body ---
  // Using a box for the main structure.
  const bodyGeom = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
  const body = new THREE.Mesh(bodyGeom, canvasMat);
  // Round the top slightly by scaling vertices? No, keep it simple BoxGeometry.
  // To make it look less like a crate, we rely on the pockets and flaps to break up the silhouette.
  root.add(body);

  // --- Top Flap ---
  // Covers the top and hangs down the front.
  const flapW = bodyW + 0.02;
  const flapH = 0.22; // Length of the flap
  const flapD = 0.02;
  const topFlapGeom = new THREE.BoxGeometry(flapW, flapH, flapD);
  const topFlap = new THREE.Mesh(topFlapGeom, canvasDarkMat);
  // Position at top back, rotate forward to drape
  topFlap.position.set(0, bodyH / 2 - 0.05, -bodyD / 2 + 0.02);
  topFlap.rotation.x = Math.PI / 6; // Angle forward
  root.add(topFlap);

  // Top Handle (Torus)
  const handleGeom = new THREE.TorusGeometry(0.04, 0.015, 8, 16, Math.PI);
  const handle = new THREE.Mesh(handleGeom, canvasDarkMat);
  handle.position.set(0, bodyH / 2 + 0.04, 0);
  handle.rotation.x = Math.PI / 2;
  handle.rotation.z = Math.PI; // Open side down
  root.add(handle);

  // --- Shoulder Straps (Top Loops) ---
  // Two loops at the top back
  const strapW = 0.04;
  const strapH = 0.06;
  const strapD = 0.01;
  const strapGeom = new THREE.BoxGeometry(strapW, strapH, strapD);
  
  const leftStrapLoop = new THREE.Mesh(strapGeom, strapMat);
  leftStrapLoop.position.set(-0.06, bodyH / 2 + 0.02, -bodyD / 2 - 0.02);
  leftStrapLoop.rotation.x = Math.PI / 4;
  root.add(leftStrapLoop);

  const rightStrapLoop = new THREE.Mesh(strapGeom, strapMat);
  rightStrapLoop.position.set(0.06, bodyH / 2 + 0.02, -bodyD / 2 - 0.02);
  rightStrapLoop.rotation.x = Math.PI / 4;
  root.add(rightStrapLoop);

  // Hanging strap parts (visible on sides/back)
  const hangStrapGeom = new THREE.BoxGeometry(0.045, 0.15, 0.01);
  const leftHangStrap = new THREE.Mesh(hangStrapGeom, strapMat);
  leftHangStrap.position.set(-0.08, bodyH / 2 - 0.1, -bodyD / 2 - 0.02);
  leftHangStrap.rotation.x = Math.PI / 6;
  root.add(leftHangStrap);

  // --- Upper Front Pocket ---
  const upPocketW = 0.18;
  const upPocketH = 0.10;
  const upPocketD = 0.05;
  const upPocketGeom = new THREE.BoxGeometry(upPocketW, upPocketH, upPocketD);
  const upperPocket = new THREE.Mesh(upPocketGeom, canvasDarkMat);
  upperPocket.position.set(0, 0.08, bodyD / 2 + upPocketD / 2);
  root.add(upperPocket);

  // Upper Pocket Flap
  const upFlapH = 0.05;
  const upFlapGeom = new THREE.BoxGeometry(upPocketW, upFlapH, 0.015);
  const upperFlap = new THREE.Mesh(upFlapGeom, canvasDarkMat);
  upperFlap.position.set(0, 0.08 + upPocketH / 2 - upFlapH / 2 + 0.01, bodyD / 2 + upPocketD / 2 + 0.01);
  upperFlap.rotation.x = Math.PI / 8;
  root.add(upperFlap);

  // Upper Pocket Buckle
  const upBuckleGeom = new THREE.BoxGeometry(0.03, 0.04, 0.015);
  const upperBuckle = new THREE.Mesh(upBuckleGeom, buckleMat);
  upperBuckle.position.set(0, 0.08 - upPocketH / 2 + 0.02, bodyD / 2 + upPocketD / 2 + 0.026);
  root.add(upperBuckle);

  // --- Lower Front Pocket ---
  const lowPocketW = 0.26;
  const lowPocketH = 0.14;
  const lowPocketD = 0.06;
  const lowPocketGeom = new THREE.BoxGeometry(lowPocketW, lowPocketH, lowPocketD);
  const lowerPocket = new THREE.Mesh(lowPocketGeom, canvasDarkMat);
  lowerPocket.position.set(0, -0.12, bodyD / 2 + lowPocketD / 2);
  root.add(lowerPocket);

  // Lower Pocket Flap
  const lowFlapH = 0.06;
  const lowFlapGeom = new THREE.BoxGeometry(lowPocketW, lowFlapH, 0.015);
  const lowerFlap = new THREE.Mesh(lowFlapGeom, canvasDarkMat);
  lowerFlap.position.set(0, -0.12 + lowPocketH / 2 - lowFlapH / 2 + 0.01, bodyD / 2 + lowPocketD / 2 + 0.01);
  lowerFlap.rotation.x = Math.PI / 10;
  root.add(lowerFlap);

  // Lower Pocket Buckle
  const lowBuckleGeom = new THREE.BoxGeometry(0.035, 0.05, 0.015);
  const lowerBuckle = new THREE.Mesh(lowBuckleGeom, buckleMat);
  lowerBuckle.position.set(0, -0.12 - lowPocketH / 2 + 0.025, bodyD / 2 + lowPocketD / 2 + 0.026);
  root.add(lowerBuckle);

  // --- Side Pocket (Left) ---
  const sidePocketW = 0.08;
  const sidePocketH = 0.14;
  const sidePocketD = 0.10;
  const sidePocketGeom = new THREE.BoxGeometry(sidePocketW, sidePocketH, sidePocketD);
  const sidePocket = new THREE.Mesh(sidePocketGeom, canvasDarkMat);
  sidePocket.position.set(-bodyW / 2 - sidePocketW / 2 + 0.01, -0.05, 0);
  root.add(sidePocket);

  // Side Pocket Flap (optional, image shows a rim)
  const sideRimGeom = new THREE.BoxGeometry(sidePocketW, 0.04, sidePocketD);
  const sideRim = new THREE.Mesh(sideRimGeom, canvasDarkMat);
  sideRim.position.set(-bodyW / 2 - sidePocketW / 2 + 0.01, -0.05 + sidePocketH / 2 - 0.02, 0);
  sideRim.rotation.x = Math.PI / 12;
  root.add(sideRim);

  // --- Stitching Details ---
  // Helper to add stitching lines
  function addStitching(x, y, z, w, h, d, axis) {
    const thickness = 0.002;
    let geom;
    if (axis === 'x') geom = new THREE.BoxGeometry(w, thickness, thickness);
    else if (axis === 'y') geom = new THREE.BoxGeometry(thickness, h, thickness);
    else geom = new THREE.BoxGeometry(thickness, thickness, d);
    
    const mesh = new THREE.Mesh(geom, stitchMat);
    mesh.position.set(x, y, z);
    root.add(mesh);
  }

  // Stitching around lower pocket
  const lpOffset = 0.005;
  addStitching(0, -0.12 + lowPocketH/2 - lpOffset, bodyD/2 + lowPocketD/2 + 0.001, lowPocketW - 0.02, 0, 0, 'x'); // Top
  addStitching(0, -0.12 - lowPocketH/2 + lpOffset, bodyD/2 + lowPocketD/2 + 0.001, lowPocketW - 0.02, 0, 0, 'x'); // Bottom
  addStitching(-lowPocketW/2 + lpOffset, -0.12, bodyD/2 + lowPocketD/2 + 0.001, 0, lowPocketH - 0.02, 0, 'y'); // Left
  addStitching(lowPocketW/2 - lpOffset, -0.12, bodyD/2 + lowPocketD/2 + 0.001, 0, lowPocketH - 0.02, 0, 'y'); // Right

  // Stitching around upper pocket
  const upOffset = 0.005;
  addStitching(0, 0.08 + upPocketH/2 - upOffset, bodyD/2 + upPocketD/2 + 0.001, upPocketW - 0.02, 0, 0, 'x');
  addStitching(0, 0.08 - upPocketH/2 + upOffset, bodyD/2 + upPocketD/2 + 0.001, upPocketW - 0.02, 0, 0, 'x');
  addStitching(-upPocketW/2 + upOffset, 0.08, bodyD/2 + upPocketD/2 + 0.001, 0, upPocketH - 0.02, 0, 'y');
  addStitching(upPocketW/2 - upOffset, 0.08, bodyD/2 + upPocketD/2 + 0.001, 0, upPocketH - 0.02, 0, 'y');

  // Stitching on flaps
  addStitching(0, -0.12 + lowPocketH/2 - lowFlapH/2 + 0.01, bodyD/2 + lowPocketD/2 + 0.01, lowPocketW - 0.04, 0, 0, 'x');
  addStitching(0, 0.08 + upPocketH/2 - upFlapH/2 + 0.01, bodyD/2 + upPocketD/2 + 0.01, upPocketW - 0.04, 0, 0, 'x');

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