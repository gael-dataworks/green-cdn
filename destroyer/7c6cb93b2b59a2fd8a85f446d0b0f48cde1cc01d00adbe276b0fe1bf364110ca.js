export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive canvas fabric
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0x5a6e48,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Dark webbing/straps
  const webbingMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // Plastic buckles/clips
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Dimensions ---
  const bagW = 0.60;
  const bagH = 0.75;
  const bagD = 0.24;
  const pocketLowerH = 0.32;
  const pocketUpperH = 0.14;
  const pocketUpperY = 0.10;
  const pocketLowerY = -0.18;

  // --- Main Body ---
  // Using a box with slightly rounded top logic via scaling or just a clean box
  // The reference is soft, so a simple box is a good base.
  const mainBodyGeom = new THREE.BoxGeometry(bagW, bagH, bagD);
  const mainBody = new THREE.Mesh(mainBodyGeom, canvasMat);
  // Shift up so base is at y=0 roughly, but center is 0 for normalization later
  mainBody.position.y = 0; 
  root.add(mainBody);

  // --- Front Lower Pocket ---
  const pocketLowerW = bagW * 0.92;
  const pocketLowerD = 0.08; // Depth of pocket
  const pocketLowerGeom = new THREE.BoxGeometry(pocketLowerW, pocketLowerH, pocketLowerD);
  const pocketLower = new THREE.Mesh(pocketLowerGeom, canvasMat);
  pocketLower.position.set(0, pocketLowerY, bagD / 2 + pocketLowerD / 2);
  root.add(pocketLower);

  // Lower Pocket Flap
  const flapLowerH = 0.08;
  const flapLowerGeom = new THREE.BoxGeometry(pocketLowerW, flapLowerH, 0.04);
  const flapLower = new THREE.Mesh(flapLowerGeom, canvasMat);
  flapLower.position.set(0, pocketLowerY + pocketLowerH / 2 - 0.02, bagD / 2 + 0.02);
  flapLower.rotation.x = -0.2; // Slight angle down
  root.add(flapLower);

  // Lower Pocket Buckle Strap (Vertical center)
  const buckleStrapLowerGeom = new THREE.BoxGeometry(0.025, 0.12, 0.01);
  const buckleStrapLower = new THREE.Mesh(buckleStrapLowerGeom, webbingMat);
  buckleStrapLower.position.set(0, pocketLowerY + 0.08, bagD / 2 + 0.04);
  root.add(buckleStrapLower);
  
  // Lower Pocket Buckle Plastic
  const buckleLowerGeom = new THREE.BoxGeometry(0.035, 0.025, 0.015);
  const buckleLower = new THREE.Mesh(buckleLowerGeom, plasticMat);
  buckleLower.position.set(0, pocketLowerY + 0.04, bagD / 2 + 0.045);
  root.add(buckleLower);

  // --- Front Upper Pocket ---
  const pocketUpperW = bagW * 0.65;
  const pocketUpperD = 0.06;
  const pocketUpperGeom = new THREE.BoxGeometry(pocketUpperW, pocketUpperH, pocketUpperD);
  const pocketUpper = new THREE.Mesh(pocketUpperGeom, canvasMat);
  pocketUpper.position.set(0, pocketUpperY, bagD / 2 + pocketUpperD / 2);
  root.add(pocketUpper);

  // Upper Pocket Flap
  const flapUpperH = 0.06;
  const flapUpperGeom = new THREE.BoxGeometry(pocketUpperW, flapUpperH, 0.03);
  const flapUpper = new THREE.Mesh(flapUpperGeom, canvasMat);
  flapUpper.position.set(0, pocketUpperY + pocketUpperH / 2 - 0.01, bagD / 2 + 0.015);
  flapUpper.rotation.x = -0.15;
  root.add(flapUpper);

  // Upper Pocket Buckle Straps (Two)
  const buckleStrapUpperGeom = new THREE.BoxGeometry(0.02, 0.09, 0.01);
  const offset = pocketUpperW * 0.35;
  
  const strapUpperL = new THREE.Mesh(buckleStrapUpperGeom, webbingMat);
  strapUpperL.position.set(-offset, pocketUpperY + 0.05, bagD / 2 + 0.035);
  root.add(strapUpperL);

  const strapUpperR = new THREE.Mesh(buckleStrapUpperGeom, webbingMat);
  strapUpperR.position.set(offset, pocketUpperY + 0.05, bagD / 2 + 0.035);
  root.add(strapUpperR);

  // Upper Pocket Buckles
  const buckleUpperGeom = new THREE.BoxGeometry(0.025, 0.02, 0.012);
  const buckleUpperL = new THREE.Mesh(buckleUpperGeom, plasticMat);
  buckleUpperL.position.set(-offset, pocketUpperY + 0.01, bagD / 2 + 0.04);
  root.add(buckleUpperL);

  const buckleUpperR = new THREE.Mesh(buckleUpperGeom, plasticMat);
  buckleUpperR.position.set(offset, pocketUpperY + 0.01, bagD / 2 + 0.04);
  root.add(buckleUpperR);

  // --- Side Pocket (Left) ---
  // Visible on the left side of the image (negative X)
  const sidePocketW = 0.12; // Depth along Z
  const sidePocketH = 0.25;
  const sidePocketD = 0.08; // Protrusion from side
  const sidePocketGeom = new THREE.BoxGeometry(sidePocketD, sidePocketH, sidePocketW);
  const sidePocket = new THREE.Mesh(sidePocketGeom, canvasMat);
  // Position on left face
  sidePocket.position.set(-bagW / 2 - sidePocketD / 2, -0.15, 0);
  root.add(sidePocket);

  // Side Pocket Flap
  const sideFlapH = 0.07;
  const sideFlapGeom = new THREE.BoxGeometry(0.03, sideFlapH, sidePocketW * 0.9);
  const sideFlap = new THREE.Mesh(sideFlapGeom, canvasMat);
  sideFlap.position.set(-bagW / 2 - 0.015, -0.15 + sidePocketH / 2 - 0.02, 0);
  sideFlap.rotation.z = 0.2; // Rotate to hang over side
  root.add(sideFlap);
  
  // Side Pocket Buckle
  const sideBuckleGeom = new THREE.BoxGeometry(0.015, 0.025, 0.04);
  const sideBuckle = new THREE.Mesh(sideBuckleGeom, plasticMat);
  sideBuckle.position.set(-bagW / 2 - 0.015, -0.15 + 0.08, 0);
  root.add(sideBuckle);

  // --- Top Handle ---
  // Two loops of webbing
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, bagH / 2 + 0.02, 0),
    new THREE.Vector3(-0.08, bagH / 2 + 0.12, 0),
    new THREE.Vector3(0.08, bagH / 2 + 0.12, 0),
    new THREE.Vector3(0.08, bagH / 2 + 0.02, 0),
  ]);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 16, 0.015, 8, false);
  const handle = new THREE.Mesh(handleGeom, webbingMat);
  handle.position.set(0, 0, 0);
  root.add(handle);

  // --- Shoulder Straps ---
  // Visible at the top, curving back and down.
  // Left Strap
  const strapLCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.15, bagH / 2 - 0.05, -bagD / 2),
    new THREE.Vector3(-0.25, bagH / 2 + 0.05, -bagD / 2 - 0.05),
    new THREE.Vector3(-0.30, bagH / 2 - 0.15, -bagD / 2 - 0.05),
    new THREE.Vector3(-0.25, bagH / 2 - 0.35, -bagD / 2),
  ]);
  const strapLGeom = new THREE.TubeGeometry(strapLCurve, 20, 0.025, 8, false);
  const strapL = new THREE.Mesh(strapLGeom, webbingMat);
  root.add(strapL);

  // Right Strap
  const strapRCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.15, bagH / 2 - 0.05, -bagD / 2),
    new THREE.Vector3(0.25, bagH / 2 + 0.05, -bagD / 2 - 0.05),
    new THREE.Vector3(0.30, bagH / 2 - 0.15, -bagD / 2 - 0.05),
    new THREE.Vector3(0.25, bagH / 2 - 0.35, -bagD / 2),
  ]);
  const strapRGeom = new THREE.TubeGeometry(strapRCurve, 20, 0.025, 8, false);
  const strapR = new THREE.Mesh(strapRGeom, webbingMat);
  root.add(strapR);

  // --- Stitching / Seams (Subtle dark lines) ---
  // Add thin boxes to represent stitching lines on pockets
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x3a4a30, roughness: 0.8 });
  
  // Seam around lower pocket
  const seamLowerH = pocketLowerH + 0.02;
  const seamLowerW = pocketLowerW + 0.02;
  const seamLowerGeom = new THREE.BoxGeometry(seamLowerW, 0.01, 0.01);
  const seamLowerTop = new THREE.Mesh(seamLowerGeom, seamMat);
  seamLowerTop.position.set(0, pocketLowerY + pocketLowerH/2, bagD/2 + 0.04);
  root.add(seamLowerTop);
  
  const seamLowerSideGeom = new THREE.BoxGeometry(0.01, seamLowerH, 0.01);
  const seamLowerL = new THREE.Mesh(seamLowerSideGeom, seamMat);
  seamLowerL.position.set(-pocketLowerW/2, pocketLowerY, bagD/2 + 0.04);
  root.add(seamLowerL);
  const seamLowerR = new THREE.Mesh(seamLowerSideGeom, seamMat);
  seamLowerR.position.set(pocketLowerW/2, pocketLowerY, bagD/2 + 0.04);
  root.add(seamLowerR);

  // Seam around upper pocket
  const seamUpperH = pocketUpperH + 0.02;
  const seamUpperW = pocketUpperW + 0.02;
  const seamUpperTop = new THREE.Mesh(new THREE.BoxGeometry(seamUpperW, 0.01, 0.01), seamMat);
  seamUpperTop.position.set(0, pocketUpperY + pocketUpperH/2, bagD/2 + 0.03);
  root.add(seamUpperTop);
  
  const seamUpperSide = new THREE.Mesh(new THREE.BoxGeometry(0.01, seamUpperH, 0.01), seamMat);
  seamUpperSide.position.set(-pocketUpperW/2, pocketUpperY, bagD/2 + 0.03);
  root.add(seamUpperSide);
  const seamUpperSideR = new THREE.Mesh(new THREE.BoxGeometry(0.01, seamUpperH, 0.01), seamMat);
  seamUpperSideR.position.set(pocketUpperW/2, pocketUpperY, bagD/2 + 0.03);
  root.add(seamUpperSideR);

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