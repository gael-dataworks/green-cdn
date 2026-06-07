export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver body: polished but slightly tarnished/antique
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Interior: darker, rougher metal
  const interiorMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.5,
    roughness: 0.8,
  });

  // Gem materials (shared properties, different colors)
  function createGemMat(colorHex) {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.1,
      roughness: 0.1,
    });
  }

  const gemColors = [
    0xffffff, // clear
    0x66aaff, // blue
    0xff88aa, // pink
    0x88cc88, // green
    0xffee88, // yellow
    0xaa88ff, // purple
  ];

  // --- Dimensions ---
  const chestW = 0.64;
  const chestD = 0.45;
  const chestH = 0.32;
  const wallThick = 0.035;
  const lidThick = 0.03;
  const gemSize = 0.025;

  // --- Base Construction ---
  const baseGroup = new THREE.Group();
  
  // Floor
  const floorGeom = new THREE.BoxGeometry(chestW - wallThick * 2, wallThick, chestD - wallThick * 2);
  const floor = new THREE.Mesh(floorGeom, interiorMat);
  floor.position.y = -chestH / 2 + wallThick / 2;
  baseGroup.add(floor);

  // Front Wall
  const frontWallGeom = new THREE.BoxGeometry(chestW, chestH - wallThick, wallThick);
  const frontWall = new THREE.Mesh(frontWallGeom, silverMat);
  frontWall.position.set(0, 0, chestD / 2 - wallThick / 2);
  baseGroup.add(frontWall);

  // Back Wall
  const backWallGeom = new THREE.BoxGeometry(chestW, chestH - wallThick, wallThick);
  const backWall = new THREE.Mesh(backWallGeom, silverMat);
  backWall.position.set(0, 0, -chestD / 2 + wallThick / 2);
  baseGroup.add(backWall);

  // Left Wall
  const leftWallGeom = new THREE.BoxGeometry(wallThick, chestH - wallThick, chestD - wallThick * 2);
  const leftWall = new THREE.Mesh(leftWallGeom, silverMat);
  leftWall.position.set(-chestW / 2 + wallThick / 2, 0, 0);
  baseGroup.add(leftWall);

  // Right Wall
  const rightWallGeom = new THREE.BoxGeometry(wallThick, chestH - wallThick, chestD - wallThick * 2);
  const rightWall = new THREE.Mesh(rightWallGeom, silverMat);
  rightWall.position.set(chestW / 2 - wallThick / 2, 0, 0);
  baseGroup.add(rightWall);

  // Add decorative rim on top edges of base
  const rimGeom = new THREE.BoxGeometry(chestW, 0.02, chestD);
  const rim = new THREE.Mesh(rimGeom, silverMat);
  rim.position.y = chestH / 2 - 0.01;
  baseGroup.add(rim);

  root.add(baseGroup);

  // --- Lid Construction ---
  // Profile in XY plane, extruded along Z (then rotated to align with X)
  const lidShape = new THREE.Shape();
  const lidRadius = 0.28;
  const lidSpan = 0.50; // chord length approx
  
  // Outer arc
  lidShape.moveTo(0, 0); // Hinge point
  lidShape.quadraticCurveTo(lidSpan * 0.5, lidRadius + 0.05, lidSpan, 0); // Arch over
  
  // Thickness
  lidShape.lineTo(lidSpan, -lidThick);
  lidShape.quadraticCurveTo(lidSpan * 0.5, lidRadius + 0.05 - lidThick, 0, -lidThick);
  lidShape.closePath();

  const lidExtrudeSettings = {
    steps: 1,
    depth: chestW + 0.02, // Slightly wider than base
    bevelEnabled: false,
  };

  const lidGeom = new THREE.ExtrudeGeometry(lidShape, lidExtrudeSettings);
  // Center the geometry locally so pivot is at (0,0,0) of the group
  lidGeom.center(); 
  
  const lidMesh = new THREE.Mesh(lidGeom, silverMat);
  
  // The extrusion is along Z. We want the lid width along X.
  // Rotate 90 deg around Y.
  lidMesh.rotation.y = Math.PI / 2;
  
  // The profile was drawn from (0,0) to (lidSpan, 0). 
  // After centering, the hinge point is shifted.
  // We need to create a pivot group to handle the hinge rotation correctly.
  
  const lidPivot = new THREE.Group();
  // Position pivot at the back-top corner of the base
  lidPivot.position.set(0, chestH / 2, -chestD / 2 + wallThick / 2);
  
  // Adjust lidMesh position relative to pivot so the hinge aligns
  // The hinge of the lid shape was at local X=0 (before center). 
  // After center(), it's at -depth/2.
  // We want the hinge to be at the pivot's origin.
  // The lid width is chestW + 0.02. Center puts it at 0.
  // The hinge line is along the width (now X axis after rot).
  // Wait, the extrusion depth is the width. So the hinge is the entire edge.
  // The profile curve starts at (0,0) in shape space.
  // After extrude and center:
  // The shape is centered in Z (extrusion axis).
  // The shape XY is centered in XY.
  // This is getting complicated to align perfectly via center().
  // Let's manually offset.
  
  // Re-calculate without center() for precise pivot control
  // Shape bounds: X [0, lidSpan], Y [-lidThick, lidRadius]
  // Extrusion Z: [0, chestW + 0.02]
  // After Rot Y 90: Extrusion becomes X [-width/2, width/2] if centered? No.
  
  // Let's restart Lid Geometry positioning logic for clarity.
  // 1. Create Shape in XY. Hinge at (0,0). Front at (lidSpan, 0).
  // 2. Extrude along Z with depth = chestW + 0.04 (overhang).
  // 3. Rotate Y 90 deg. Now Extrusion is along X. Shape is in YZ.
  //    Hinge edge is at Z=0 (local). Front edge is at Z=lidSpan (local).
  //    Width extends from X = -width/2 to width/2.
  // 4. We want the Hinge Edge to be at the Pivot (0,0,0 of lidPivot).
  //    Currently, ExtrudeGeometry creates geometry centered at 0,0,0? 
  //    No, ExtrudeGeometry creates geometry such that the shape is at Z=0 to Z=depth.
  //    So X (after rot) is -depth/2 to depth/2.
  //    Y is shape Y.
  //    Z (after rot) is shape X.
  //    So Hinge (Shape X=0) is at Local Z=0.
  //    Front (Shape X=lidSpan) is at Local Z=lidSpan.
  //    This works perfectly! The hinge line is at Z=0.
  //    We just need to shift X so the lid is centered on the pivot.
  //    The geometry X range is [-width/2, width/2]. Pivot is at 0. So it is centered.
  
  const lidGeomFinal = new THREE.ExtrudeGeometry(lidShape, {
    steps: 1,
    depth: chestW + 0.04,
    bevelEnabled: false,
  });
  
  const lidMeshFinal = new THREE.Mesh(lidGeomFinal, silverMat);
  lidMeshFinal.rotation.y = Math.PI / 2;
  // Shift X to center the width on the pivot
  lidMeshFinal.position.x = 0; 
  // The hinge is at Z=0. The pivot is at (0, chestH/2, -chestD/2).
  // So lidMeshFinal local Z=0 aligns with pivot Z=0.
  // We need to lift the lid slightly so it sits ON TOP of the back wall.
  // The back wall top is at Y = chestH/2.
  // The lid shape starts at Y=0 (hinge).
  // So lidMeshFinal Y=0 aligns with pivot Y=0 (which is chestH/2).
  // This is correct.
  
  lidPivot.add(lidMeshFinal);
  
  // Open the lid
  lidPivot.rotation.x = -Math.PI / 3.5; // Tilted back
  
  root.add(lidPivot);

  // --- Hinge ---
  // Two small cylinders at the back
  const hingeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 12);
  hingeGeom.rotateX(Math.PI / 2); // Align along Z (depth)
  const hingeLeft = new THREE.Mesh(hingeGeom, silverMat);
  hingeLeft.position.set(-chestW / 2 + 0.08, chestH / 2, -chestD / 2);
  root.add(hingeLeft);
  
  const hingeRight = new THREE.Mesh(hingeGeom, silverMat);
  hingeRight.position.set(chestW / 2 - 0.08, chestH / 2, -chestD / 2);
  root.add(hingeRight);
  
  // Hinge Pin
  const pinGeom = new THREE.CylinderGeometry(0.01, 0.01, chestW * 0.4, 8);
  pinGeom.rotateX(Math.PI / 2);
  const pin = new THREE.Mesh(pinGeom, silverMat);
  pin.position.set(0, chestH / 2 + 0.02, -chestD / 2 + 0.02);
  root.add(pin);

  // --- Clasp / Latch ---
  // Loop on front
  const loopGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16);
  const loop = new THREE.Mesh(loopGeom, silverMat);
  loop.rotation.x = Math.PI / 2;
  loop.position.set(0, chestH / 2 - 0.05, chestD / 2 + 0.01);
  root.add(loop);
  
  // Hook on lid (catch)
  const hookGeom = new THREE.TorusGeometry(0.02, 0.006, 8, 16);
  const hook = new THREE.Mesh(hookGeom, silverMat);
  hook.rotation.x = Math.PI / 2;
  // Position relative to lidPivot
  // Lid front is at local Z = lidSpan (~0.5).
  hook.position.set(0, -lidThick - 0.02, lidSpan - 0.05);
  lidPivot.add(hook);

  // --- Gems ---
  const gemGeom = new THREE.SphereGeometry(gemSize, 12, 12);
  gemGeom.scale(1, 1, 0.6); // Flattened sphere (cabochon)

  function addGem(x, y, z, colorIdx, parent) {
    const mat = createGemMat(gemColors[colorIdx % gemColors.length]);
    const gem = new THREE.Mesh(gemGeom, mat);
    gem.position.set(x, y, z);
    // Orient gem normal to surface? For simplicity on flat/curved approx, up is fine
    // But for lid, we should rotate to match curve approx.
    parent.add(gem);
  }

  // Gems on Lid
  // 3 rows along the curve, 5 columns across width
  const rows = 3;
  const cols = 5;
  const rowSpacing = lidSpan / (rows + 1);
  const colSpacing = (chestW + 0.04) / (cols + 1);
  
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      // Lid local coords: X across width, Z along curve (0 to lidSpan)
      // Y is height on curve. Approximate Y for row r:
      // Simple arc approx: y = sin(z/lidSpan * PI) * height
      const zLocal = r * rowSpacing;
      const yLocal = Math.sin((zLocal / lidSpan) * Math.PI) * (lidRadius + 0.05);
      const xLocal = -chestW / 2 - 0.02 + c * colSpacing;
      
      // Random-ish color selection based on indices
      const colorIdx = (r * 10 + c) % gemColors.length;
      
      // Add to lidPivot
      // We need to orient the gem. 
      // For now, just place them. The curvature is gentle enough that Y-up is okay-ish,
      // but let's try to tilt them slightly for the middle row.
      const gem = new THREE.Mesh(gemGeom, createGemMat(gemColors[colorIdx]));
      gem.position.set(xLocal, yLocal - lidThick/2, zLocal); // -lidThick/2 to sit on surface
      
      // Simple rotation approximation for the curve
      if (r === 1) gem.rotation.x = -0.3;
      if (r === 3) gem.rotation.x = 0.3;
      
      lidPivot.add(gem);
    }
  }

  // Gems on Base Front
  const frontGemZ = chestD / 2 + 0.005;
  const frontGemY = 0;
  for (let i = 0; i < 5; i++) {
    const x = -chestW / 2 + wallThick + (chestW - wallThick * 2) * (i + 1) / 6;
    addGem(x, frontGemY, frontGemZ, i + 2, root);
  }
  
  // Gems on Base Sides
  for (let s = -1; s <= 1; s += 2) {
    const sideX = s * (chestW / 2 + 0.005);
    // 2 gems per side
    for (let i = 0; i < 2; i++) {
      const z = -chestD / 2 + wallThick + (chestD - wallThick * 2) * (i + 1) / 3;
      addGem(sideX, 0, z, i + 4, root);
    }
  }

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