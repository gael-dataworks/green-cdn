export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed Stainless Steel
  // Per rules: metalness <= 0.6, use emissive for brightness in dim env.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd0d0d0,
    emissiveIntensity: 0.3,
  });

  // --- Dimensions ---
  const trayW = 0.50;
  const trayL = 1.00;
  const trayH = 0.08;
  const wallThick = 0.02;
  const bottomThick = 0.02;
  const dividerThick = 0.015;
  
  const tubeR = 0.015;
  const frameH = 0.15; // Height of frame above tray rim
  const postH = frameH;

  // --- Tray Base ---
  // Bottom plate
  const trayBottomGeom = new THREE.BoxGeometry(trayW - wallThick * 2, bottomThick, trayL - wallThick * 2);
  const tray_bottom = new THREE.Mesh(trayBottomGeom, steelMat);
  tray_bottom.position.y = bottomThick / 2;
  root.add(tray_bottom);

  // Front Wall
  const trayWallFrontGeom = new THREE.BoxGeometry(trayW, trayH, wallThick);
  const tray_wall_front = new THREE.Mesh(trayWallFrontGeom, steelMat);
  tray_wall_front.position.set(0, trayH / 2, trayL / 2 - wallThick / 2);
  root.add(tray_wall_front);

  // Back Wall
  const tray_wall_back = new THREE.Mesh(trayWallFrontGeom, steelMat);
  tray_wall_back.position.set(0, trayH / 2, -trayL / 2 + wallThick / 2);
  root.add(tray_wall_back);

  // Left Wall (fits between front/back walls internally or externally? 
  // Visual check: Corners look welded/continuous. Let's place them to fill the gap.)
  // Outer dims: W=0.5, L=1.0. 
  // Front/Back take full width 0.5. Left/Right take inner length 1.0 - 0.02 - 0.02 = 0.96.
  const trayWallSideGeom = new THREE.BoxGeometry(wallThick, trayH, trayL - wallThick * 2);
  const tray_wall_left = new THREE.Mesh(trayWallSideGeom, steelMat);
  tray_wall_left.position.set(-trayW / 2 + wallThick / 2, trayH / 2, 0);
  root.add(tray_wall_left);

  const tray_wall_right = new THREE.Mesh(trayWallSideGeom, steelMat);
  tray_wall_right.position.set(trayW / 2 - wallThick / 2, trayH / 2, 0);
  root.add(tray_wall_right);

  // --- Internal Divider ---
  // Runs front-to-back, centered. Height slightly less than walls.
  const dividerH = trayH * 0.8;
  const dividerGeom = new THREE.BoxGeometry(dividerThick, dividerH, trayL - wallThick * 2);
  const divider = new THREE.Mesh(dividerGeom, steelMat);
  divider.position.set(0, bottomThick + dividerH / 2, 0);
  root.add(divider);

  // --- Top Frame ---
  // Vertical Posts at 4 corners of the tray outer rim
  const postGeom = new THREE.CylinderGeometry(tubeR, tubeR, postH, 16);
  
  // Corner positions (outer edges of tray walls)
  const cornerX = trayW / 2 - wallThick / 2; // Center of side wall
  const cornerZ = trayL / 2 - wallThick / 2; // Center of front/back wall
  const postBaseY = trayH;

  const postPositions = [
    [-cornerX, postBaseY + postH / 2, -cornerZ], // Back Left
    [ cornerX, postBaseY + postH / 2, -cornerZ], // Back Right
    [-cornerX, postBaseY + postH / 2,  cornerZ], // Front Left
    [ cornerX, postBaseY + postH / 2,  cornerZ], // Front Right
  ];

  const frame_posts = [];
  for (const [x, y, z] of postPositions) {
    const post = new THREE.Mesh(postGeom, steelMat);
    post.position.set(x, y, z);
    root.add(post);
    frame_posts.push(post);
  }

  // Side Rails (Left & Right) connecting posts front-to-back
  const sideRailLen = trayL - wallThick; // Distance between post centers approx
  const sideRailGeom = new THREE.CylinderGeometry(tubeR, tubeR, sideRailLen, 16);
  
  const rail_left = new THREE.Mesh(sideRailGeom, steelMat);
  rail_left.rotation.z = Math.PI / 2; // Align with Z axis? No, Cylinder is Y-up.
  // To align with Z axis: rotate X by 90 deg.
  rail_left.rotation.x = Math.PI / 2;
  rail_left.position.set(-cornerX, postBaseY + postH, 0);
  root.add(rail_left);

  const rail_right = new THREE.Mesh(sideRailGeom, steelMat);
  rail_right.rotation.x = Math.PI / 2;
  rail_right.position.set(cornerX, postBaseY + postH, 0);
  root.add(rail_right);

  // Front & Back Rails connecting side rails
  const frontBackRailLen = trayW - wallThick;
  const fbRailGeom = new THREE.CylinderGeometry(tubeR, tubeR, frontBackRailLen, 16);
  // Cylinder is Y-up. To align with X axis: rotate Z by 90 deg.
  
  const rail_front = new THREE.Mesh(fbRailGeom, steelMat);
  rail_front.rotation.z = Math.PI / 2;
  rail_front.position.set(0, postBaseY + postH, cornerZ);
  root.add(rail_front);

  const rail_back = new THREE.Mesh(fbRailGeom, steelMat);
  rail_back.rotation.z = Math.PI / 2;
  rail_back.position.set(0, postBaseY + postH, -cornerZ);
  root.add(rail_back);

  // --- Handle Loop Detail (Back Right) ---
  // Visual reference shows a curled end on the right side back corner.
  const loopR = 0.04;
  const loopGeom = new THREE.TorusGeometry(loopR, tubeR, 12, 24, Math.PI); // Half torus
  const handle_loop = new THREE.Mesh(loopGeom, steelMat);
  // Position at back right corner top
  handle_loop.position.set(cornerX, postBaseY + postH, -cornerZ);
  // Orient to curl backwards/upwards from the side rail
  // Side rail runs along Z. Loop should extend from the end.
  // Torus is in XY plane by default. 
  // We want it in YZ plane to curl back. Rotate X 90.
  handle_loop.rotation.x = Math.PI / 2;
  // Rotate Z to align the cut ends with the rail
  handle_loop.rotation.z = Math.PI / 2; 
  root.add(handle_loop);

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