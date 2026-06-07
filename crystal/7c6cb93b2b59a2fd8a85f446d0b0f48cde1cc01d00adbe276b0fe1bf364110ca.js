export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Olive green canvas/fabric
  const fabricMat = new THREE.MeshStandardMaterial({
    color: 0x556b2f,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Dark grey/black nylon webbing
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Black plastic buckles
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Main Body ---
  // Dimensions: Width 0.55, Height 0.75, Depth 0.22
  const bodyWidth = 0.55;
  const bodyHeight = 0.75;
  const bodyDepth = 0.22;
  
  const mainBodyGeom = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyDepth);
  const mainBody = new THREE.Mesh(mainBodyGeom, fabricMat);
  // Round the top slightly by scaling or just keep it boxy for stability. 
  // Let's keep it simple boxy but position it so bottom is at y=0.
  mainBody.position.y = bodyHeight / 2;
  root.add(mainBody);

  // --- Pockets ---
  // Common pocket depth
  const pocketDepth = 0.12;
  const flapThickness = 0.015;
  const flapOverhang = 0.025;

  // Helper to create a pocket with flap and buckle
  function createPocket(name, w, h, x, y, z, hasBuckle = true) {
    const pocketGroup = new THREE.Group();
    
    // Pocket body
    const pocketGeom = new THREE.BoxGeometry(w, h, pocketDepth);
    const pocketMesh = new THREE.Mesh(pocketGeom, fabricMat);
    pocketMesh.position.y = h / 2;
    pocketGroup.add(pocketMesh);

    // Flap
    const flapGeom = new THREE.BoxGeometry(w, flapThickness, pocketDepth + flapOverhang);
    const flapMesh = new THREE.Mesh(flapGeom, fabricMat);
    flapMesh.position.set(0, h + flapThickness / 2, 0);
    pocketGroup.add(flapMesh);

    // Buckle (small black rectangle on the flap)
    if (hasBuckle) {
      const buckleGeom = new THREE.BoxGeometry(w * 0.15, 0.04, 0.02);
      const buckleMesh = new THREE.Mesh(buckleGeom, buckleMat);
      buckleMesh.position.set(0, h + flapThickness / 2, pocketDepth / 2 + 0.01);
      pocketGroup.add(buckleMesh);
      
      // Strap loop under buckle
      const loopGeom = new THREE.BoxGeometry(w * 0.12, 0.06, 0.01);
      const loopMesh = new THREE.Mesh(loopGeom, strapMat);
      loopMesh.position.set(0, h + flapThickness / 2 - 0.02, pocketDepth / 2 + 0.015);
      pocketGroup.add(loopMesh);
    }

    pocketGroup.position.set(x, y, z + bodyDepth / 2 + pocketDepth / 2);
    root.add(pocketGroup);
    return pocketGroup;
  }

  // Lower Left Pocket
  // Positioned on the left side of the front face
  const llW = bodyWidth * 0.45;
  const llH = bodyHeight * 0.35;
  const llX = -bodyWidth * 0.15;
  const llY = bodyHeight * 0.15;
  createPocket("pocket_lower_left", llW, llH, llX, llY, 0);

  // Lower Right Pocket
  const lrW = bodyWidth * 0.45;
  const lrH = bodyHeight * 0.35;
  const lrX = bodyWidth * 0.15;
  const lrY = bodyHeight * 0.15;
  createPocket("pocket_lower_right", lrW, lrH, lrX, lrY, 0);

  // Upper Right Pocket (smaller)
  const urW = bodyWidth * 0.40;
  const urH = bodyHeight * 0.20;
  const urX = bodyWidth * 0.15;
  const urY = bodyHeight * 0.55;
  createPocket("pocket_upper_right", urW, urH, urX, urY, 0);

  // --- Shoulder Straps ---
  // Two loops at the top back
  const strapWidth = 0.06;
  const strapHeight = 0.15;
  const strapDepth = 0.08;
  const strapSpacing = 0.12;

  function createShoulderStrap(side) {
    const strapGroup = new THREE.Group();
    const x = side * strapSpacing;
    
    // Main strap loop (flattened torus or bent box)
    // Using a bent box approach with 3 segments for simplicity and stability
    const verticalSegH = 0.12;
    const topSegD = 0.08;
    
    // Vertical part attached to bag
    const vGeom = new THREE.BoxGeometry(strapWidth, verticalSegH, 0.02);
    const vMesh = new THREE.Mesh(vGeom, strapMat);
    vMesh.position.set(0, verticalSegH / 2, 0);
    strapGroup.add(vMesh);

    // Top curved part (approximated by a rotated box or torus segment)
    // Let's use a TorusGeometry segment for the curve
    const curveRadius = 0.04;
    const curveGeom = new THREE.TorusGeometry(curveRadius, strapWidth / 2, 8, 16, Math.PI);
    const curveMesh = new THREE.Mesh(curveGeom, strapMat);
    curveMesh.rotation.x = Math.PI / 2; // Flat in XZ
    curveMesh.rotation.z = side * Math.PI / 2; // Orient sideways
    curveMesh.position.set(0, verticalSegH, 0);
    strapGroup.add(curveMesh);

    // Back vertical part (hanging down)
    const vBackMesh = vMesh.clone();
    vBackMesh.position.set(0, verticalSegH / 2, -topSegD);
    strapGroup.add(vBackMesh);

    // Position the whole strap assembly at the top back of the bag
    strapGroup.position.set(x, bodyHeight - 0.05, -bodyDepth / 2);
    root.add(strapGroup);
  }

  createShoulderStrap(-1); // Left strap
  createShoulderStrap(1);  // Right strap

  // --- Side Strap / Handle ---
  // Visible on the left side in the image
  const sideStrapGeom = new THREE.BoxGeometry(0.05, 0.15, 0.02);
  const sideStrap = new THREE.Mesh(sideStrapGeom, strapMat);
  sideStrap.position.set(-bodyWidth / 2 - 0.01, bodyHeight * 0.4, 0);
  sideStrap.rotation.y = Math.PI / 2; // Facing outwards
  root.add(sideStrap);

  // --- Zipper pulls / Details (Optional but adds realism) ---
  // Small tabs on the main compartment zipper line (top edge)
  const zipperTabGeom = new THREE.BoxGeometry(0.02, 0.04, 0.01);
  const zipperTabMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  
  const tab1 = new THREE.Mesh(zipperTabGeom, zipperTabMat);
  tab1.position.set(-0.1, bodyHeight, bodyDepth / 2 + 0.01);
  root.add(tab1);

  const tab2 = new THREE.Mesh(zipperTabGeom, zipperTabMat);
  tab2.position.set(0.1, bodyHeight, bodyDepth / 2 + 0.01);
  root.add(tab2);

  // Normalize to fit unit cube
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