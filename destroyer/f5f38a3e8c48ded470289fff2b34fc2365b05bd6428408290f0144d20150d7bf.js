export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Oxidized silver: duller, less reflective than chrome.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Darker interior metal
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.5,
    roughness: 0.7,
  });

  // Gem materials (using Standard with low roughness for shine)
  const gemClearMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.1 });
  const gemBlueMat = new THREE.MeshStandardMaterial({ color: 0x4488ff, metalness: 0.1, roughness: 0.1 });
  const gemPinkMat = new THREE.MeshStandardMaterial({ color: 0xff88aa, metalness: 0.1, roughness: 0.1 });
  const gemGreenMat = new THREE.MeshStandardMaterial({ color: 0x88ffaa, metalness: 0.1, roughness: 0.1 });
  const gemGoldMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, metalness: 0.3, roughness: 0.2 });

  // --- Dimensions ---
  const boxW = 0.6;   // Width (X)
  const boxH = 0.35;  // Height of base (Y)
  const boxD = 0.45;  // Depth (Z)
  const wallThick = 0.04;
  const lidH = 0.25;  // Height of lid dome

  // --- Base Construction (Hollow Box with Rounded Corners) ---
  // We create a shape with a hole to extrude a hollow shell.
  const outerShape = new THREE.Shape();
  const r = 0.06; // Corner radius
  const hw = boxW / 2;
  const hd = boxD / 2;
  
  // Outer contour
  outerShape.moveTo(-hw + r, -hd);
  outerShape.lineTo(hw - r, -hd);
  outerShape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  outerShape.lineTo(hw, hd - r);
  outerShape.quadraticCurveTo(hw, hd, hw - r, hd);
  outerShape.lineTo(-hw + r, hd);
  outerShape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  outerShape.lineTo(-hw, -hd + r);
  outerShape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  // Inner hole (slightly smaller)
  const hole = new THREE.Path();
  const hwInner = hw - wallThick;
  const hdInner = hd - wallThick;
  const rInner = r - 0.02;
  hole.moveTo(-hwInner + rInner, -hdInner);
  hole.lineTo(hwInner - rInner, -hdInner);
  hole.quadraticCurveTo(hwInner, -hdInner, hwInner, -hdInner + rInner);
  hole.lineTo(hwInner, hdInner - rInner);
  hole.quadraticCurveTo(hwInner, hdInner, hwInner - rInner, hdInner);
  hole.lineTo(-hwInner + rInner, hdInner);
  hole.quadraticCurveTo(-hwInner, hdInner, -hwInner, hdInner - rInner);
  hole.lineTo(-hwInner, -hdInner + rInner);
  hole.quadraticCurveTo(-hwInner, -hdInner, -hwInner + rInner, -hdInner);

  outerShape.holes.push(hole);

  const baseGeom = new THREE.ExtrudeGeometry(outerShape, {
    depth: boxH,
    bevelEnabled: false,
  });
  // Center the geometry vertically so pivot is at bottom
  baseGeom.translate(0, 0, 0); 
  // Extrude goes +Z by default in shape space, but we want height in Y.
  // Actually ExtrudeGeometry extrudes along Z. We need to rotate the mesh.
  const base = new THREE.Mesh(baseGeom, silverMat);
  base.rotation.x = -Math.PI / 2; // Lay flat on XZ plane, height becomes Y
  base.position.y = 0; // Sit on ground
  root.add(base);

  // Interior floor (to close the bottom inside)
  const floorGeom = new THREE.PlaneGeometry(boxW - wallThick * 2.1, boxD - wallThick * 2.1);
  const floor = new THREE.Mesh(floorGeom, interiorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.005; // Slightly above bottom
  root.add(floor);

  // --- Lid Construction ---
  // Profile for the vaulted lid
  const lidProfile = new THREE.Shape();
  const lw = boxW; 
  const lh = lidH;
  lidProfile.moveTo(-lw / 2, 0);
  lidProfile.lineTo(-lw / 2, lh * 0.4); // Vertical side
  // Curve for the top
  lidProfile.quadraticCurveTo(0, lh + 0.05, lw / 2, lh * 0.4);
  lidProfile.lineTo(lw / 2, 0);
  lidProfile.lineTo(-lw / 2, 0);

  const lidGeom = new THREE.ExtrudeGeometry(lidProfile, {
    depth: boxD - 0.02, // Slightly shorter than base depth
    bevelEnabled: false,
  });
  
  // The extrusion is along Z. We need to orient it.
  // The profile is in XY. Extrusion is Z.
  // We want the curve to be along X (width), and length along Z (depth).
  // So the mesh is already oriented correctly regarding the curve (X) and length (Z).
  // But we need to position it at the back of the box.
  
  const lid = new THREE.Mesh(lidGeom, silverMat);
  // Pivot for hinge is at the back bottom corner of the lid.
  // The geometry center is at (0, lh/2, 0) roughly.
  // We need to shift the geometry so the pivot is at the hinge point.
  // Hinge point: Back edge (Z = -boxD/2), Bottom (Y = boxH), Center X.
  
  // Let's adjust the lid mesh position and rotation.
  // Default lid center is at 0,0,0.
  // We want the back-bottom edge of the lid to be at (0, boxH, -boxD/2).
  // The lid geometry extends from Z = -depth/2 to +depth/2.
  // So we shift Z by -depth/2 to put the back face at 0.
  // Then we shift Y by 0 (bottom is at 0).
  // Then we rotate around X axis at that back-bottom corner.
  
  // Actually, simpler: Create a hinge group.
  const hingeGroup = new THREE.Group();
  hingeGroup.position.set(0, boxH, -boxD / 2);
  root.add(hingeGroup);

  // Add lid to hinge group
  // Lid geometry bounds: X: [-w/2, w/2], Y: [0, h], Z: [-d/2, d/2]
  // We want the lid to swing up from the back.
  // So the pivot is at X=0, Y=0, Z=+d/2 (relative to lid geom center if we align back to pivot).
  // Let's just position the lid mesh relative to the hingeGroup.
  // HingeGroup is at the back-bottom corner of the lid's intended position.
  // The lid extends Forward (+Z) from the hinge.
  // So lid position in hingeGroup: X=0, Y=0, Z = (boxD - 0.02) / 2.
  // Wait, the lid sits ON TOP of the base. So Y should be 0 relative to hingeGroup (which is at top of base).
  // And it extends Forward (+Z) into the box volume? No, the hinge is at the BACK.
  // In the image, the latch is at the FRONT. The hinge is at the BACK.
  // So the lid opens towards the front (+Z).
  // HingeGroup is at (0, boxH, -boxD/2).
  // Lid extends from Z=-boxD/2 to Z=+boxD/2.
  // So relative to hingeGroup, the lid center is at Z = + (boxD - 0.02)/2.
  
  lid.position.set(0, 0, (boxD - 0.02) / 2);
  // Open the lid: Rotate around X axis.
  lid.rotation.x = -Math.PI / 2.5; // Open approx 70 degrees
  hingeGroup.add(lid);

  // --- Hinge Details ---
  const hingeGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 16);
  hingeGeom.rotateZ(Math.PI / 2);
  const hinge = new THREE.Mesh(hingeGeom, silverMat);
  hinge.position.set(0, 0, 0); // At the hingeGroup origin
  hingeGroup.add(hinge);

  // --- Latch / Clasp ---
  // Small loop on the front face of the base
  const latchLoopGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16);
  const latchLoop = new THREE.Mesh(latchLoopGeom, silverMat);
  latchLoop.position.set(0, boxH * 0.6, boxD / 2 + 0.01);
  latchLoop.rotation.y = Math.PI / 2; // Face forward
  root.add(latchLoop);

  // Pin for latch
  const latchPinGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.06, 8);
  const latchPin = new THREE.Mesh(latchPinGeom, silverMat);
  latchPin.rotation.x = Math.PI / 2;
  latchPin.position.set(0, boxH * 0.6, boxD / 2 + 0.01);
  root.add(latchPin);

  // --- Gemstones ---
  // Helper to place gems
  function addGem(x, y, z, mat, scale = 1) {
    const gemGeom = new THREE.SphereGeometry(0.025 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(x, y, z);
    // Orient gem normal to surface if needed, but for flat faces/simple curves, up is fine or slight tilt
    root.add(gem);
    return gem;
  }

  function addLidGem(x, z, mat, scale = 1) {
    // Gems on the lid need to follow the curve roughly.
    // The lid is rotated. We can add them as children of the lid mesh to inherit transform.
    const gemGeom = new THREE.SphereGeometry(0.025 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const gem = new THREE.Mesh(gemGeom, mat);
    // Position on the lid surface (local to lid)
    // Lid local Y is up (dome height), Z is depth, X is width.
    // We want them on the top surface. Approx Y = lidH * 0.8 (below peak)
    gem.position.set(x, lidH * 0.6, z); 
    gem.rotation.x = -Math.PI / 2; // Face up relative to lid surface
    lid.add(gem);
  }

  // Gems on Lid (Scattered pattern)
  const gemMats = [gemClearMat, gemBlueMat, gemPinkMat, gemGreenMat, gemGoldMat];
  
  // Row 1 (Front of lid)
  addLidGem(-0.15, 0.15, gemMats[0], 0.9);
  addLidGem(0.0, 0.15, gemMats[1], 1.0);
  addLidGem(0.15, 0.15, gemMats[2], 0.9);

  // Row 2 (Middle)
  addLidGem(-0.20, 0.0, gemMats[3], 0.8);
  addLidGem(-0.05, 0.0, gemMats[0], 1.1);
  addLidGem(0.10, 0.0, gemMats[4], 0.9);
  addLidGem(0.22, 0.0, gemMats[1], 0.8);

  // Row 3 (Back)
  addLidGem(-0.15, -0.15, gemMats[2], 0.9);
  addLidGem(0.0, -0.15, gemMats[3], 1.0);
  addLidGem(0.15, -0.15, gemMats[0], 0.9);

  // Gems on Front Face of Base
  function addFrontGem(x, y, mat) {
    const gemGeom = new THREE.SphereGeometry(0.025, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(x, y, boxD / 2 + 0.01); // Slightly in front of face
    gem.rotation.y = Math.PI; // Face forward (sphere is symmetric, but good practice)
    root.add(gem);
  }

  addFrontGem(-0.15, 0.15, gemClearMat);
  addFrontGem(0.15, 0.15, gemBlueMat);
  addFrontGem(-0.15, 0.05, gemPinkMat);
  addFrontGem(0.15, 0.05, gemGreenMat);

  // --- Interior Detail (Small Ring) ---
  const ringGeom = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
  const interiorRing = new THREE.Mesh(ringGeom, silverMat);
  interiorRing.rotation.x = Math.PI / 2;
  interiorRing.position.set(0, 0.02, 0);
  root.add(interiorRing);

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