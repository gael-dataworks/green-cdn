export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Polished Stainless Steel
  // Per quick-reference: polished metal -> metalness 0.6, roughness 0.2, color #d4d4d4
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Dimensions (relative units, will be normalized)
  const trayLength = 1.0;
  const trayWidth = 0.35;
  const trayHeight = 0.08;
  const wallThickness = 0.015;
  const wireRadius = 0.012;
  const frameHeight = 0.14; // Height of the wire frame above tray
  const handleRadius = 0.035;
  const handleTubeRadius = 0.012;

  // --- 1. Base Tray ---
  // Bottom plate
  const bottomGeom = new THREE.BoxGeometry(trayWidth, wallThickness, trayLength);
  const baseBottom = new THREE.Mesh(bottomGeom, steelMat);
  baseBottom.position.y = wallThickness / 2;
  root.add(baseBottom);

  // Walls (4 boxes)
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, trayHeight, wallThickness), steelMat);
  wallFront.position.set(0, trayHeight / 2 + wallThickness, trayLength / 2 - wallThickness / 2);
  root.add(wallFront);

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(trayWidth, trayHeight, wallThickness), steelMat);
  wallBack.position.set(0, trayHeight / 2 + wallThickness, -trayLength / 2 + wallThickness / 2);
  root.add(wallBack);

  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, trayHeight, trayLength - 2 * wallThickness), steelMat);
  wallLeft.position.set(-trayWidth / 2 + wallThickness / 2, trayHeight / 2 + wallThickness, 0);
  root.add(wallLeft);

  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, trayHeight, trayLength - 2 * wallThickness), steelMat);
  wallRight.position.set(trayWidth / 2 - wallThickness / 2, trayHeight / 2 + wallThickness, 0);
  root.add(wallRight);

  // --- 2. End Frames (Left & Right) ---
  // Each end frame is an inverted U-shape with a handle loop.
  // We use TubeGeometry for the U-shape to get smooth rounded corners.
  
  function createEndFrame(zPos) {
    const frameGroup = new THREE.Group();
    
    // Path for the inverted U-shape
    // Starts at bottom-left (inner), goes up, across, down to bottom-right (inner)
    const halfW = trayWidth / 2 - 0.02; // Slightly inside the walls
    const h = frameHeight;
    
    const points = [
      new THREE.Vector3(-halfW, 0, zPos), // Bottom Left
      new THREE.Vector3(-halfW, h, zPos), // Top Left
      new THREE.Vector3(halfW, h, zPos),  // Top Right
      new THREE.Vector3(halfW, 0, zPos),  // Bottom Right
    ];
    
    const curve = new THREE.CatmullRomCurve3(points);
    // Adjust tension to make corners rounded but not too loose
    curve.tension = 0.5; 
    
    const frameGeom = new THREE.TubeGeometry(curve, 20, wireRadius, 8, false);
    const frameMesh = new THREE.Mesh(frameGeom, steelMat);
    frameGroup.add(frameMesh);

    // Handle Loop (Torus)
    // Attached to the top corner. Let's attach to the left side for symmetry or both?
    // Image shows handles on both ends, sticking out from the short sides.
    // The handle is a loop in the YZ plane (vertical loop) or XY plane?
    // Image: Handle is a loop sticking out along the Z axis (longitudinal).
    // Wait, handles are on the short ends (X-axis faces). So they stick out along X.
    // So the loop is in the YZ plane.
    
    const handleGeom = new THREE.TorusGeometry(handleRadius, handleTubeRadius, 8, 16);
    const handleLeft = new THREE.Mesh(handleGeom, steelMat);
    // Position at top-left corner
    handleLeft.position.set(-halfW, h, zPos);
    // Rotate to face outward (along -X)
    handleLeft.rotation.y = Math.PI / 2; 
    frameGroup.add(handleLeft);

    // Actually, looking at the image, the handle is on the OUTSIDE of the frame.
    // And there's a handle on BOTH sides of the end frame?
    // No, just one handle per end frame, centered on the short side.
    // Let's place a single handle loop centered on the short side, attached to the top bar.
    // But the image shows the handle is part of the wire structure.
    // Let's approximate with a Torus centered on the top bar, facing out.
    
    // Re-evaluating handle: It looks like a "D" ring attached to the corner.
    // I'll place two small rings, one at each top corner, or one big one in the middle.
    // The image shows a loop at the corner.
    // Let's add a second handle on the other corner for symmetry, or just one centered.
    // The image shows a loop on the right end, sticking out to the right.
    // It seems attached to the top-right corner of that end frame.
    // And presumably a matching one on the left end frame.
    // I will place a handle loop at the center of the top bar, facing out.
    
    const centerHandle = new THREE.Mesh(handleGeom, steelMat);
    centerHandle.position.set(0, h, zPos);
    centerHandle.rotation.y = Math.PI / 2; // Face along X
    frameGroup.add(centerHandle);
    
    return frameGroup;
  }

  const endFrameLeft = createEndFrame(trayLength / 2 - 0.05);
  root.add(endFrameLeft);

  const endFrameRight = createEndFrame(-trayLength / 2 + 0.05);
  root.add(endFrameRight);

  // --- 3. Long Rails ---
  // Connecting the two end frames.
  // Image shows rails running parallel to the length, inside the frame.
  // Let's add 2 rails on each side (4 total) to match the "grid" look.
  // Or maybe just 2 rails total (one per side).
  // The image shows a distinct inner rail.
  // Let's add 2 rails per side: Outer (near wall) and Inner (mid-tray).
  
  const railStartZ = trayLength / 2 - 0.05;
  const railEndZ = -trayLength / 2 + 0.05;
  const railLength = railStartZ - railEndZ;
  const railY = trayHeight * 0.5; // Slightly above bottom

  function addLongRail(xPos) {
    const railGeom = new THREE.CylinderGeometry(wireRadius, wireRadius, railLength, 8);
    const rail = new THREE.Mesh(railGeom, steelMat);
    rail.rotation.x = Math.PI / 2; // Align with Z
    rail.position.set(xPos, railY, 0);
    root.add(rail);
  }

  // Left side rails
  addLongRail(-trayWidth / 2 + 0.05); // Outer
  addLongRail(-trayWidth / 4);        // Inner

  // Right side rails
  addLongRail(trayWidth / 4);         // Inner
  addLongRail(trayWidth / 2 - 0.05);  // Outer

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