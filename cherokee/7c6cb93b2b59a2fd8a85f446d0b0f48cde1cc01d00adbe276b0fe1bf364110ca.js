export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive canvas: matte, high roughness, no metalness.
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x6B7A55,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Nylon webbing: dark gray, slightly smoother than canvas.
  const webbingMat = new THREE.MeshStandardMaterial({
    color: 0x2A2A2A,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Plastic buckles: black, slight sheen.
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const bagWidth = 0.70;
  const bagHeight = 0.85;
  const bagDepth = 0.28;
  const pocketFrontDepth = 0.16;
  const pocketSideDepth = 0.16;

  // --- Main Body ---
  // Softened box for the main compartment.
  const mainBodyGeom = new THREE.BoxGeometry(bagWidth, bagHeight, bagDepth, 1, 1, 1);
  const main_body = new THREE.Mesh(mainBodyGeom, canvasMat);
  main_body.position.y = bagHeight / 2;
  root.add(main_body);

  // --- Top Flap ---
  // Profile in XY plane (X=depth, Y=height), extruded along Z (width).
  const topFlapShape = new THREE.Shape();
  const tfBackZ = -0.10;
  const tfFrontZ = 0.12;
  const tfTopY = 0.48;
  const tfBottomY = 0.25;
  
  topFlapShape.moveTo(tfBackZ, tfBottomY);
  topFlapShape.lineTo(tfBackZ, tfTopY);
  topFlapShape.lineTo(0.0, tfTopY);
  // Rounded front top corner
  topFlapShape.quadraticCurveTo(tfFrontZ, tfTopY + 0.04, tfFrontZ, tfTopY - 0.05);
  topFlapShape.lineTo(tfFrontZ, tfBottomY);
  topFlapShape.lineTo(tfBackZ, tfBottomY);

  const topFlapGeom = new THREE.ExtrudeGeometry(topFlapShape, {
    depth: bagWidth + 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
  });
  const top_flap = new THREE.Mesh(topFlapGeom, canvasMat);
  // Rotate so extrusion (Z) aligns with bag width (X)
  top_flap.rotation.y = -Math.PI / 2;
  top_flap.position.set(0, bagHeight * 0.55, 0);
  root.add(top_flap);

  // --- Front Pocket ---
  const frontPocketGeom = new THREE.BoxGeometry(bagWidth * 0.8, 0.35, pocketFrontDepth);
  const front_pocket = new THREE.Mesh(frontPocketGeom, canvasMat);
  front_pocket.position.set(0, 0.25, bagDepth / 2 + pocketFrontDepth / 2);
  root.add(front_pocket);

  // --- Front Pocket Flap ---
  const fpFlapShape = new THREE.Shape();
  const fpfBackZ = -0.06;
  const fpfFrontZ = 0.08;
  const fpfTopY = 0.12;
  const fpfBottomY = 0.02;

  fpFlapShape.moveTo(fpfBackZ, fpfBottomY);
  fpFlapShape.lineTo(fpfBackZ, fpfTopY);
  fpFlapShape.lineTo(0.0, fpfTopY);
  fpFlapShape.quadraticCurveTo(fpfFrontZ, fpfTopY + 0.03, fpfFrontZ, fpfTopY - 0.04);
  fpFlapShape.lineTo(fpfFrontZ, fpfBottomY);
  fpFlapShape.lineTo(fpfBackZ, fpfBottomY);

  const fpFlapGeom = new THREE.ExtrudeGeometry(fpFlapShape, {
    depth: bagWidth * 0.8 + 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  const front_pocket_flap = new THREE.Mesh(fpFlapGeom, canvasMat);
  front_pocket_flap.rotation.y = -Math.PI / 2;
  front_pocket_flap.position.set(0, 0.38, bagDepth / 2 + pocketFrontDepth / 2);
  root.add(front_pocket_flap);

  // --- Side Pocket (Left) ---
  const sidePocketGeom = new THREE.BoxGeometry(pocketSideDepth, 0.30, bagDepth * 0.6);
  const side_pocket = new THREE.Mesh(sidePocketGeom, canvasMat);
  // Position on left side (-X)
  side_pocket.position.set(-bagWidth / 2 - pocketSideDepth / 2, 0.25, 0);
  root.add(side_pocket);

  // --- Side Pocket Flap (Left) ---
  const spFlapShape = new THREE.Shape();
  const spfBackY = 0.02;
  const spfFrontY = 0.08; // Protrudes in X (which is Y in shape local)
  const spfTopZ = 0.12;
  const spfBottomZ = 0.02;
  
  // Shape in YZ plane (Y=protrusion, Z=height) -> Extrude along X (width of flap)
  // Wait, Extrude is always Z. So Shape is XY.
  // Let's map: Shape X = protrusion (from bag surface), Shape Y = height.
  // Extrude Depth = flap width (Z dimension of bag side).
  
  const spFlapShape2 = new THREE.Shape();
  spFlapShape2.moveTo(0.0, spfBottomZ);
  spFlapShape2.lineTo(0.0, spfTopZ);
  spFlapShape2.lineTo(spfFrontY, spfTopZ);
  spFlapShape2.quadraticCurveTo(spfFrontY + 0.03, spfTopZ, spfFrontY, spfTopZ - 0.04);
  spFlapShape2.lineTo(spfFrontY, spfBottomZ);
  spFlapShape2.lineTo(0.0, spfBottomZ);

  const spFlapGeom = new THREE.ExtrudeGeometry(spFlapShape2, {
    depth: bagDepth * 0.6 + 0.02,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });
  const side_pocket_flap = new THREE.Mesh(spFlapGeom, canvasMat);
  // Rotate: Extrusion (Z) aligns with bag depth (Z). Shape X aligns with -X (outward).
  // Default Shape X is right. We want it left. Rotate Y 180?
  // If I rotate Y 180, Z becomes -Z.
  // Let's just rotate Y 90 or -90 to align extrusion with Z?
  // Extrusion is Z. I want it along Z. So no rotation needed for extrusion axis.
  // But Shape X is protrusion. I want protrusion along -X.
  // So Rotate Y 180 degrees? No, that flips Z.
  // Rotate Z 90? No.
  // Let's rotate Y 180 and accept Z flip, then fix Z?
  // Easier: Rotate Y Math.PI. Now Shape X points -X (correct). Extrusion Z points -Z.
  // So flip Z scale or position.
  side_pocket_flap.rotation.y = Math.PI;
  side_pocket_flap.position.set(-bagWidth / 2, 0.38, 0);
  root.add(side_pocket_flap);

  // --- Top Handle ---
  const handleTorus = new THREE.TorusGeometry(0.06, 0.018, 8, 16);
  const top_handle = new THREE.Mesh(handleTorus, webbingMat);
  top_handle.rotation.x = Math.PI / 2;
  top_handle.position.set(0, bagHeight + 0.05, -0.05);
  root.add(top_handle);

  // --- Shoulder Straps (Top visible parts) ---
  const strapGeom = new THREE.BoxGeometry(0.06, 0.15, 0.02);
  
  const shoulder_strap_left = new THREE.Mesh(strapGeom, webbingMat);
  shoulder_strap_left.position.set(-0.15, bagHeight * 0.9, -bagDepth / 2 - 0.02);
  shoulder_strap_left.rotation.x = 0.3;
  root.add(shoulder_strap_left);

  const shoulder_strap_right = new THREE.Mesh(strapGeom, webbingMat);
  shoulder_strap_right.position.set(0.15, bagHeight * 0.9, -bagDepth / 2 - 0.02);
  shoulder_strap_right.rotation.x = 0.3;
  root.add(shoulder_strap_right);

  // --- Buckles & Webbing Details ---
  
  // Front Buckle
  const frontBuckleGeom = new THREE.BoxGeometry(0.06, 0.04, 0.03);
  const buckle_front = new THREE.Mesh(frontBuckleGeom, buckleMat);
  buckle_front.position.set(0, 0.30, bagDepth / 2 + pocketFrontDepth + 0.01);
  root.add(buckle_front);

  // Front Webbing (vertical strip through buckle)
  const frontWebbingGeom = new THREE.BoxGeometry(0.04, 0.12, 0.015);
  const strap_webbing_front = new THREE.Mesh(frontWebbingGeom, webbingMat);
  strap_webbing_front.position.set(0, 0.30, bagDepth / 2 + pocketFrontDepth + 0.015);
  root.add(strap_webbing_front);

  // Side Buckle
  const sideBuckleGeom = new THREE.BoxGeometry(0.03, 0.04, 0.06);
  const buckle_side = new THREE.Mesh(sideBuckleGeom, buckleMat);
  buckle_side.position.set(-bagWidth / 2 - pocketSideDepth - 0.01, 0.30, 0);
  root.add(buckle_side);

  // Side Webbing
  const sideWebbingGeom = new THREE.BoxGeometry(0.015, 0.12, 0.04);
  const strap_webbing_side = new THREE.Mesh(sideWebbingGeom, webbingMat);
  strap_webbing_side.position.set(-bagWidth / 2 - pocketSideDepth - 0.015, 0.30, 0);
  root.add(strap_webbing_side);

  // --- Stitching / Seams (Subtle dark lines) ---
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x4a553a, roughness: 0.9 });
  const seamGeom = new THREE.BoxGeometry(0.005, 0.005, 0.005); // Reused, scaled later

  // Vertical seam on front pocket
  const seamFrontVert = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.35, 0.005), seamMat);
  seamFrontVert.position.set(0, 0.25, bagDepth / 2 + pocketFrontDepth + 0.005);
  root.add(seamFrontVert);

  // Horizontal seam on front pocket flap
  const seamFrontHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.005, 0.005), seamMat);
  seamFrontHoriz.position.set(0, 0.38, bagDepth / 2 + pocketFrontDepth + 0.005);
  root.add(seamFrontHoriz);

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