export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive green canvas fabric
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x556b2f,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark grey/black plastic buckles and hardware
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Slightly darker fabric for shadowed areas/undersides if needed, 
  // but we'll stick to one main fabric for coherence.

  // --- Dimensions ---
  const bodyW = 0.34;
  const bodyH = 0.46;
  const bodyD = 0.14;
  
  const pocketLowerH = 0.16;
  const pocketLowerD = 0.07;
  
  const pocketUpperH = 0.09;
  const pocketUpperD = 0.05;

  const strapWidth = 0.035;
  const strapThickness = 0.004;

  // --- Main Body ---
  // A rounded box effect can be approximated with a standard box and enough segments,
  // or just a clean box. We'll use a box with slight scaling to look soft.
  const mainBodyGeom = new THREE.BoxGeometry(bodyW, bodyH, bodyD, 4, 4, 4);
  const mainBody = new THREE.Mesh(mainBodyGeom, fabricMat);
  mainBody.position.y = bodyH / 2;
  root.add(mainBody);

  // --- Front Lower Pocket ---
  const pocketLowerW = bodyW * 0.9;
  const pocketLowerGeom = new THREE.BoxGeometry(pocketLowerW, pocketLowerH, pocketLowerD, 4, 4, 4);
  const frontLowerPocket = new THREE.Mesh(pocketLowerGeom, fabricMat);
  frontLowerPocket.position.set(0, pocketLowerH / 2 + 0.02, bodyD / 2 + pocketLowerD / 2);
  root.add(frontLowerPocket);

  // Lower Pocket Flap
  const flapLowerH = 0.05;
  const flapLowerGeom = new THREE.BoxGeometry(pocketLowerW, flapLowerH, 0.02, 4, 1, 1);
  const flapLower = new THREE.Mesh(flapLowerGeom, fabricMat);
  // Position at top of lower pocket, rotate slightly forward
  flapLower.position.set(0, pocketLowerH - flapLowerH / 2 + 0.02, bodyD / 2 + pocketLowerD / 2);
  flapLower.rotation.x = -Math.PI / 8; // Tilt forward
  root.add(flapLower);

  // --- Front Upper Pocket ---
  const pocketUpperW = bodyW * 0.55;
  const pocketUpperGeom = new THREE.BoxGeometry(pocketUpperW, pocketUpperH, pocketUpperD, 4, 4, 4);
  const frontUpperPocket = new THREE.Mesh(pocketUpperGeom, fabricMat);
  // Positioned above the lower pocket
  const upperPocketY = pocketLowerH + 0.04 + pocketUpperH / 2;
  frontUpperPocket.position.set(0, upperPocketY, bodyD / 2 + pocketUpperD / 2);
  root.add(frontUpperPocket);

  // Upper Pocket Flap
  const flapUpperH = 0.04;
  const flapUpperGeom = new THREE.BoxGeometry(pocketUpperW, flapUpperH, 0.02, 4, 1, 1);
  const flapUpper = new THREE.Mesh(flapUpperGeom, fabricMat);
  flapUpper.position.set(0, upperPocketY + pocketUpperH / 2 - flapUpperH / 2, bodyD / 2 + pocketUpperD / 2);
  flapUpper.rotation.x = -Math.PI / 8;
  root.add(flapUpper);

  // --- Top Handle ---
  // A torus segment or a bent tube. Let's use a TorusGeometry for the loop.
  const handleRadius = 0.06;
  const handleTube = 0.015;
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 8, 16, Math.PI);
  const topHandle = new THREE.Mesh(handleGeom, fabricMat);
  // Position at top center, rotated to stand up
  topHandle.position.set(0, bodyH + handleRadius, 0);
  topHandle.rotation.z = Math.PI / 2; // Stand vertical
  topHandle.rotation.y = Math.PI / 2; // Face forward/back
  root.add(topHandle);

  // --- Shoulder Straps ---
  // Curve from top back corners down the back
  function createShoulderStrap(side) {
    const startX = side * (bodyW / 2 - 0.04);
    const startY = bodyH - 0.05;
    const startZ = -bodyD / 2;

    const midX = side * (bodyW / 2 + 0.08);
    const midY = bodyH * 0.6;
    const midZ = -bodyD / 2 - 0.05;

    const endX = side * (bodyW / 2 + 0.1);
    const endY = bodyH * 0.2;
    const endZ = -bodyD / 2 - 0.05;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(endX, endY, endZ),
    ]);

    const strapGeom = new THREE.TubeGeometry(curve, 20, strapWidth / 2, 8, false);
    const strap = new THREE.Mesh(strapGeom, fabricMat);
    root.add(strap);
    
    // Add a plastic adjuster buckle on the strap
    const buckleY = bodyH * 0.4;
    const buckleZ = -bodyD / 2 - 0.06;
    const buckleX = side * (bodyW / 2 + 0.09);
    
    const buckleGeom = new THREE.BoxGeometry(0.04, 0.015, 0.025);
    const buckle = new THREE.Mesh(buckleGeom, plasticMat);
    buckle.position.set(buckleX, buckleY, buckleZ);
    // Align buckle with strap roughly
    buckle.rotation.x = Math.PI / 2; 
    root.add(buckle);
  }

  createShoulderStrap(1);  // Right strap
  createShoulderStrap(-1); // Left strap

  // --- Side Straps / Compression Straps ---
  // Visible on the side, connecting front pocket area to back
  function createSideStrap(side) {
    const startX = side * (bodyW / 2 + 0.02);
    const startY = pocketLowerH * 0.6;
    const startZ = bodyD / 2 + pocketLowerD;

    const endX = side * (bodyW / 2 + 0.02);
    const endY = pocketLowerH * 0.6;
    const endZ = -bodyD / 2;

    const curve = new THREE.LineCurve3(
      new THREE.Vector3(startX, startY, startZ),
      new THREE.Vector3(endX, endY, endZ)
    );
    
    // Use a thin box for the strap instead of tube for flat webbing look
    const length = startX - endX; // Actually distance in Z mostly
    const dist = new THREE.Vector3(startX, startY, startZ).distanceTo(new THREE.Vector3(endX, endY, endZ));
    
    const webbingGeom = new THREE.BoxGeometry(0.025, 0.004, dist);
    const webbing = new THREE.Mesh(webbingGeom, fabricMat);
    
    // Position midpoint
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const midZ = (startZ + endZ) / 2;
    
    webbing.position.set(midX, midY, midZ);
    // Rotate to align with curve
    webbing.lookAt(new THREE.Vector3(endX, endY, endZ));
    // Correction because lookAt aligns Z, but our box is long in Z
    webbing.rotateX(Math.PI / 2); 
    
    root.add(webbing);

    // Plastic buckle on side strap
    const buckleGeom = new THREE.BoxGeometry(0.03, 0.015, 0.04);
    const buckle = new THREE.Mesh(buckleGeom, plasticMat);
    buckle.position.set(side * (bodyW / 2 + 0.03), startY, bodyD / 2 + pocketLowerD + 0.02);
    root.add(buckle);
  }

  createSideStrap(1);
  createSideStrap(-1);

  // --- Zipper Pulls (Small details) ---
  // Small tabs on the flaps
  function addZipperPull(x, y, z) {
    const pullGeom = new THREE.BoxGeometry(0.015, 0.025, 0.005);
    const pull = new THREE.Mesh(pullGeom, plasticMat);
    pull.position.set(x, y, z);
    root.add(pull);
  }
  
  // On lower flap center
  addZipperPull(0, pocketLowerH - 0.015, bodyD / 2 + pocketLowerD + 0.01);
  // On upper flap center
  addZipperPull(0, upperPocketY + pocketUpperH / 2 - 0.015, bodyD / 2 + pocketUpperD + 0.01);


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