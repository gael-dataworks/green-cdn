export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver: Capped metalness at 0.6 to avoid black rendering, moderate roughness for antique look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Stone material base (shiny, low roughness)
  const stoneMatBase = {
    metalness: 0.1,
    roughness: 0.1,
  };

  const stoneColors = [
    0xffffff, // Clear/White
    0xaec6cf, // Light Blue
    0xffb7c5, // Pink
    0x77dd77, // Light Green
    0xfdfd96, // Pale Yellow
    0xd3a3a3, // Mauve
  ];

  // --- Dimensions ---
  const boxW = 0.60;
  const boxD = 0.40;
  const boxH = 0.22;
  const wallThick = 0.025;
  const cornerR = 0.04;
  const lidH = 0.18; // Height of the curved part above the hinge line
  const archR = boxW / 2; // Radius of the lid arch

  // --- Base Construction ---
  const baseGroup = new THREE.Group();
  root.add(baseGroup);

  // 1. Base Floor
  const floorGeom = new THREE.BoxGeometry(boxW - wallThick * 2, 0.02, boxD - wallThick * 2);
  const floor = new THREE.Mesh(floorGeom, silverMat);
  floor.position.y = 0.01;
  baseGroup.add(floor);

  // 2. Base Walls (Front, Back, Left, Right)
  // Front Wall
  const frontWallGeom = new THREE.BoxGeometry(boxW - cornerR * 2, boxH, wallThick);
  const frontWall = new THREE.Mesh(frontWallGeom, silverMat);
  frontWall.position.set(0, boxH / 2, (boxD - wallThick) / 2);
  baseGroup.add(frontWall);

  // Back Wall
  const backWall = new THREE.Mesh(frontWallGeom, silverMat);
  backWall.position.set(0, boxH / 2, -(boxD - wallThick) / 2);
  baseGroup.add(backWall);

  // Left Wall
  const sideWallGeom = new THREE.BoxGeometry(wallThick, boxH, boxD - cornerR * 2);
  const leftWall = new THREE.Mesh(sideWallGeom, silverMat);
  leftWall.position.set(-(boxW - wallThick) / 2, boxH / 2, 0);
  baseGroup.add(leftWall);

  // Right Wall
  const rightWall = new THREE.Mesh(sideWallGeom, silverMat);
  rightWall.position.set((boxW - wallThick) / 2, boxH / 2, 0);
  baseGroup.add(rightWall);

  // 3. Rounded Corners (4 Cylinders)
  const cornerGeom = new THREE.CylinderGeometry(cornerR, cornerR, boxH, 16, 1, false, 0, Math.PI / 2);
  // Front Left
  const cFL = new THREE.Mesh(cornerGeom, silverMat);
  cFL.position.set(-(boxW - cornerR) / 2, boxH / 2, (boxD - cornerR) / 2);
  cFL.rotation.y = Math.PI / 4; // Orient flat sides to walls
  baseGroup.add(cFL);
  // Front Right
  const cFR = new THREE.Mesh(cornerGeom, silverMat);
  cFR.position.set((boxW - cornerR) / 2, boxH / 2, (boxD - cornerR) / 2);
  cFR.rotation.y = -Math.PI / 4;
  baseGroup.add(cFR);
  // Back Left
  const cBL = new THREE.Mesh(cornerGeom, silverMat);
  cBL.position.set(-(boxW - cornerR) / 2, boxH / 2, -(boxD - cornerR) / 2);
  cBL.rotation.y = -Math.PI / 4;
  baseGroup.add(cBL);
  // Back Right
  const cBR = new THREE.Mesh(cornerGeom, silverMat);
  cBR.position.set((boxW - cornerR) / 2, boxH / 2, -(boxD - cornerR) / 2);
  cBR.rotation.y = Math.PI / 4;
  baseGroup.add(cBR);

  // 4. Front Clasp Loop
  const claspGeom = new THREE.TorusGeometry(0.025, 0.006, 8, 16);
  const clasp = new THREE.Mesh(claspGeom, silverMat);
  clasp.rotation.x = Math.PI / 2;
  clasp.position.set(0, boxH * 0.6, (boxD + wallThick) / 2 + 0.01);
  baseGroup.add(clasp);

  // 5. Hinge Knuckles on Base (Back)
  const hingeKnuckleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.06, 12);
  hingeKnuckleGeom.rotateZ(Math.PI / 2);
  const hingeZ = -(boxD - wallThick) / 2 - 0.01;
  const hingeY = boxH - 0.04;
  
  const h1 = new THREE.Mesh(hingeKnuckleGeom, silverMat);
  h1.position.set(-0.15, hingeY, hingeZ);
  baseGroup.add(h1);
  
  const h2 = new THREE.Mesh(hingeKnuckleGeom, silverMat);
  h2.position.set(0.15, hingeY, hingeZ);
  baseGroup.add(h2);

  // --- Lid Construction ---
  const lidGroup = new THREE.Group();
  // Position lid group at the hinge point (back top of base)
  lidGroup.position.set(0, boxH, -(boxD - wallThick) / 2);
  root.add(lidGroup);

  // Lid Shape Profile (Extrude)
  // Starts bottom-left, goes up, arcs over, goes down, closes.
  const lidShape = new THREE.Shape();
  const halfW = boxW / 2;
  const sideH = 0.04; // Vertical straight part before curve
  const curveH = lidH - sideH;
  
  lidShape.moveTo(-halfW, 0);
  lidShape.lineTo(-halfW, sideH);
  // Arc to top right. Control points for quadratic bezier to make a semi-circle-ish arch
  // Using ellipse curve for precision
  const arc = new THREE.EllipseCurve(
    0, sideH, // ax, aY (center)
    halfW, curveH, // xRadius, yRadius
    Math.PI, 0, // startAngle, endAngle
    false, // clockwise
    0 // rotation
  );
  const points = arc.getPoints(20);
  for (let i = 0; i < points.length; i++) {
    lidShape.lineTo(points[i].x, points[i].y);
  }
  
  lidShape.lineTo(halfW, 0);
  lidShape.closePath();

  const lidExtrudeSettings = {
    steps: 1,
    depth: boxD - wallThick * 2 - 0.02, // Slightly narrower than base to fit inside
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  };

  const lidGeom = new THREE.ExtrudeGeometry(lidShape, lidExtrudeSettings);
  // Center the geometry so pivot is at hinge
  lidGeom.translate(0, 0, -(boxD - wallThick * 2 - 0.02) / 2);
  
  const lidMesh = new THREE.Mesh(lidGeom, silverMat);
  lidGroup.add(lidMesh);

  // Lid Hinge Knuckles (interleaved with base)
  const h3 = new THREE.Mesh(hingeKnuckleGeom, silverMat);
  h3.position.set(0, hingeY - boxH, 0.02); // Relative to lid group pivot
  lidGroup.add(h3);

  // Open the lid
  lidGroup.rotation.x = -Math.PI / 3.5; // ~50 degrees open

  // --- Stones Decoration ---
  // Helper to create a stone
  function createStone(colorHex, scale = 1.0) {
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      ...stoneMatBase
    });
    // Use a flattened sphere or cylinder for the stone
    const geom = new THREE.CylinderGeometry(0.022 * scale, 0.02 * scale, 0.015 * scale, 16);
    const mesh = new THREE.Mesh(geom, mat);
    // Rotate to face outwards if needed, but default cylinder is Y-up.
    // We will rotate instances to match surface normal.
    return mesh;
  }

  // 1. Stones on Lid Top (Curved Surface)
  // We iterate a grid in X and Z (depth of lid)
  // Calculate Y based on the arch profile
  const stoneRows = 4;
  const stoneCols = 6;
  
  for (let r = 0; r < stoneRows; r++) {
    for (let c = 0; c < stoneCols; c++) {
      // Normalize coordinates -0.5 to 0.5
      const u = (c + 0.5) / stoneCols; // 0 to 1
      const v = (r + 0.5) / stoneRows; // 0 to 1
      
      const x = (u - 0.5) * (boxW - 0.1); // Spread across width
      const z = (v - 0.5) * (boxD - 0.1); // Spread across depth
      
      // Calculate Y on the arch
      // The arch is defined by the EllipseCurve in the shape
      // Center (0, sideH), RadiusX = halfW, RadiusY = curveH
      // We need y for a given x.
      // Equation: (x^2 / rx^2) + ((y - cy)^2 / ry^2) = 1
      // (y - cy)^2 = ry^2 * (1 - x^2/rx^2)
      // y = cy + ry * sqrt(1 - x^2/rx^2)
      
      let y = 0;
      const absX = Math.abs(x);
      if (absX < halfW - 0.02) {
        // On the curve
        const term = 1 - (absX * absX) / (halfW * halfW);
        y = sideH + curveH * Math.sqrt(Math.max(0, term));
      } else {
        // On the vertical sides (shouldn't happen with this spread, but safety)
        y = sideH; 
      }

      const stone = createStone(stoneColors[(r + c) % stoneColors.length], 0.8 + (r%2)*0.2);
      
      // Position in Lid Local Space
      stone.position.set(x, y, z);
      
      // Orient stone normal to surface
      // Normal of ellipse at x: gradient of F(x,y) = x^2/a^2 + y^2/b^2
      // Normal vector (2x/a^2, 2y/b^2). 
      // Simplified: Point from center of ellipse (0, sideH) to surface point (x, y)
      const centerX = 0;
      const centerY = sideH;
      // Scale Y diff by aspect ratio to get correct normal for ellipse
      const nx = x - centerX;
      const ny = (y - centerY) * (halfW / curveH); 
      
      const normal = new THREE.Vector3(nx, ny, 0).normalize();
      stone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      
      // Lift slightly above surface
      stone.position.add(normal.clone().multiplyScalar(0.01));
      
      lidGroup.add(stone);
    }
  }

  // 2. Stones on Base Front Face
  const frontStoneRows = 2;
  const frontStoneCols = 4;
  const frontZ = (boxD - wallThick) / 2 + 0.01;
  
  for (let r = 0; r < frontStoneRows; r++) {
    for (let c = 0; c < frontStoneCols; c++) {
      const u = (c + 0.5) / frontStoneCols;
      const v = (r + 0.5) / frontStoneRows;
      
      const x = (u - 0.5) * (boxW - 0.15);
      const y = 0.05 + v * (boxH - 0.1);
      
      const stone = createStone(stoneColors[(r + c + 2) % stoneColors.length], 0.9);
      stone.position.set(x, y, frontZ);
      stone.rotation.x = 0; // Face forward (+Z)
      // Cylinder is Y-up, we want it to face +Z. Rotate X by -PI/2.
      stone.rotation.x = -Math.PI / 2;
      
      baseGroup.add(stone);
    }
  }
  
  // 3. Stones on Base Side Faces (Optional, for detail)
  // Just one per side
  const sideStoneL = createStone(0xaec6cf, 0.8);
  sideStoneL.position.set(-(boxW - wallThick)/2 - 0.01, boxH * 0.5, 0);
  sideStoneL.rotation.z = Math.PI / 2;
  baseGroup.add(sideStoneL);

  const sideStoneR = createStone(0xffb7c5, 0.8);
  sideStoneR.position.set((boxW - wallThick)/2 + 0.01, boxH * 0.5, 0);
  sideStoneR.rotation.z = -Math.PI / 2;
  baseGroup.add(sideStoneR);

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