export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Main fabric: Taupe/Beige canvas. High roughness, no metalness.
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0xa8a696,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Zipper/Accents: Bright Lime Green. Plastic/Metal mix.
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xccff00,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Zipper Pull: Slightly darker or same lime, maybe a bit more metallic if plastic.
  const pullMat = new THREE.MeshStandardMaterial({
    color: 0xbbe300,
    metalness: 0.2,
    roughness: 0.3,
  });

  // Interior/Shadow: Dark grey for depth in pockets/zippers.
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bodyW = 0.32;
  const bodyH = 0.42;
  const bodyD = 0.14;
  const pocketH = 0.16;
  const pocketD = 0.05;

  // --- 1. Main Body ---
  // Use ExtrudeGeometry for the rounded-top profile
  const mainShape = new THREE.Shape();
  const r = 0.06; // Corner radius for top
  const hw = bodyW / 2;
  const hh = bodyH / 2;
  
  // Draw profile (counter-clockwise)
  mainShape.moveTo(-hw, -hh);
  mainShape.lineTo(hw, -hh);
  mainShape.lineTo(hw, hh - r);
  mainShape.quadraticCurveTo(hw, hh, hw - r, hh);
  mainShape.lineTo(-hw + r, hh);
  mainShape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  mainShape.lineTo(-hw, -hh);

  const mainGeom = new THREE.ExtrudeGeometry(mainShape, {
    depth: bodyD,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 12,
  });
  // Center the geometry
  mainGeom.center();
  
  const main_body = new THREE.Mesh(mainGeom, fabricMat);
  root.add(main_body);

  // --- 2. Front Pocket ---
  // Box geometry, slightly rounded via scaling or just box
  const pocketW = bodyW * 0.85;
  const pocketGeom = new THREE.BoxGeometry(pocketW, pocketH, pocketD);
  const front_pocket = new THREE.Mesh(pocketGeom, fabricMat);
  front_pocket.position.set(0, -bodyH / 2 + pocketH / 2 + 0.02, bodyD / 2 + pocketD / 2);
  root.add(front_pocket);

  // Pocket Divider/Seam (Vertical line)
  const seamGeom = new THREE.BoxGeometry(0.005, pocketH * 0.9, 0.002);
  const seam = new THREE.Mesh(seamGeom, darkMat);
  seam.position.set(0, -bodyH / 2 + pocketH / 2 + 0.02, bodyD / 2 + pocketD / 2 + 0.026);
  root.add(seam);

  // Pocket Top Rim
  const rimGeom = new THREE.BoxGeometry(pocketW, 0.015, 0.01);
  const pocket_rim = new THREE.Mesh(rimGeom, fabricMat);
  pocket_rim.position.set(0, -bodyH / 2 + pocketH + 0.015, bodyD / 2 + pocketD / 2);
  root.add(pocket_rim);

  // --- 3. Side Pocket (Visible on left) ---
  const sidePocketW = 0.06;
  const sidePocketH = 0.12;
  const sidePocketD = 0.04;
  const sidePocketGeom = new THREE.BoxGeometry(sidePocketW, sidePocketH, sidePocketD);
  const side_pocket = new THREE.Mesh(sidePocketGeom, fabricMat);
  // Position on the left side (-X)
  side_pocket.position.set(-bodyW / 2 - sidePocketW / 2, -bodyH / 2 + sidePocketH / 2 + 0.05, 0);
  root.add(side_pocket);

  // Side Pocket Rim (Lime accent visible in image)
  const sideRimGeom = new THREE.BoxGeometry(0.01, 0.015, sidePocketD + 0.01);
  const side_rim = new THREE.Mesh(sideRimGeom, accentMat);
  side_rim.position.set(-bodyW / 2 - 0.005, -bodyH / 2 + sidePocketH + 0.05, 0);
  root.add(side_rim);

  // --- 4. Top Handle ---
  // Torus for the loop
  const handleRadius = 0.04;
  const handleTube = 0.015;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 8, 16, Math.PI);
  const top_handle = new THREE.Mesh(handleGeom, fabricMat);
  // Rotate to stand up
  top_handle.rotation.x = Math.PI / 2;
  top_handle.rotation.y = Math.PI / 2; // Face forward/sideways
  top_handle.position.set(0, bodyH / 2 + handleRadius, 0);
  root.add(top_handle);

  // Handle Base Patches
  const patchGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.01, 16);
  const handlePatchL = new THREE.Mesh(patchGeom, fabricMat);
  handlePatchL.rotation.x = Math.PI / 2;
  handlePatchL.position.set(-handleRadius, bodyH / 2 + 0.005, 0);
  root.add(handlePatchL);

  const handlePatchR = new THREE.Mesh(patchGeom, fabricMat);
  handlePatchR.rotation.x = Math.PI / 2;
  handlePatchR.position.set(handleRadius, bodyH / 2 + 0.005, 0);
  root.add(handlePatchR);

  // --- 5. Zipper Track ---
  // Curve following the main compartment opening
  // Starts top center, goes down right side (viewer perspective)
  const zipPoints = [];
  const zipTopY = bodyH / 2 - 0.02;
  const zipSideX = bodyW / 2 - 0.02;
  const zipSideY = -bodyH / 2 + 0.08;
  
  // Quadratic curve for the top right corner
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, zipTopY, bodyD / 2 + 0.005),
    new THREE.Vector3(zipSideX, zipTopY, bodyD / 2 + 0.005),
    new THREE.Vector3(zipSideX, zipSideY, bodyD / 2 + 0.005)
  );
  
  const zipGeom = new THREE.TubeGeometry(curve, 20, 0.008, 8, false);
  const zipper_track = new THREE.Mesh(zipGeom, accentMat);
  root.add(zipper_track);

  // Zipper Pull Tab
  const pullGeom = new THREE.BoxGeometry(0.02, 0.035, 0.008);
  const zipper_pull = new THREE.Mesh(pullGeom, pullMat);
  // Position at the end of the zipper curve
  zipper_pull.position.set(zipSideX, zipSideY - 0.02, bodyD / 2 + 0.005);
  // Slight rotation to hang naturally
  zipper_pull.rotation.x = 0.2;
  root.add(zipper_pull);

  // Zipper Slider Head (at the bottom of the visible track)
  const sliderGeom = new THREE.BoxGeometry(0.015, 0.02, 0.012);
  const zipper_slider = new THREE.Mesh(sliderGeom, accentMat);
  zipper_slider.position.set(zipSideX, zipSideY, bodyD / 2 + 0.005);
  root.add(zipper_slider);

  // --- 6. Shoulder Straps (Visible parts) ---
  // Simple tubes emerging from top back
  const strapCurveL = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, bodyH / 2, -bodyD / 2),
    new THREE.Vector3(-0.12, bodyH / 2 - 0.1, -bodyD / 2 - 0.05),
    new THREE.Vector3(-0.10, bodyH / 2 - 0.2, -bodyD / 2 - 0.02)
  ]);
  const strapGeomL = new THREE.TubeGeometry(strapCurveL, 10, 0.035, 8, false);
  const strap_left = new THREE.Mesh(strapGeomL, fabricMat);
  root.add(strap_left);

  const strapCurveR = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, bodyH / 2, -bodyD / 2),
    new THREE.Vector3(0.12, bodyH / 2 - 0.1, -bodyD / 2 - 0.05),
    new THREE.Vector3(0.10, bodyH / 2 - 0.2, -bodyD / 2 - 0.02)
  ]);
  const strapGeomR = new THREE.TubeGeometry(strapCurveR, 10, 0.035, 8, false);
  const strap_right = new THREE.Mesh(strapGeomR, fabricMat);
  root.add(strap_right);

  // Strap Adjusters (Plastic clips)
  const adjusterGeom = new THREE.BoxGeometry(0.04, 0.015, 0.045);
  const adjusterL = new THREE.Mesh(adjusterGeom, darkMat);
  adjusterL.position.set(-0.11, bodyH / 2 - 0.08, -bodyD / 2 - 0.03);
  adjusterL.rotation.x = 0.3;
  root.add(adjusterL);

  const adjusterR = new THREE.Mesh(adjusterGeom, darkMat);
  adjusterR.position.set(0.11, bodyH / 2 - 0.08, -bodyD / 2 - 0.03);
  adjusterR.rotation.x = 0.3;
  root.add(adjusterR);

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