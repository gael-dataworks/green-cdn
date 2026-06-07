export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const matPurple = new THREE.MeshStandardMaterial({ color: 0xdcd0ff, roughness: 0.8, metalness: 0.0 });
  const matMint = new THREE.MeshStandardMaterial({ color: 0xc4f0d6, roughness: 0.8, metalness: 0.0 });
  const matPeach = new THREE.MeshStandardMaterial({ color: 0xffe4c4, roughness: 0.8, metalness: 0.0 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0xe89b9b, roughness: 0.6, metalness: 0.1 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0 });
  const matDoor = new THREE.MeshStandardMaterial({ color: 0xa8d8ea, roughness: 0.7, metalness: 0.0 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.2, metalness: 0.1 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.9, metalness: 0.0 });
  const matGutter = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.3 });

  // --- Dimensions ---
  const houseW = 1.2;
  const houseD = 0.9;
  const wallH = 0.6;
  const roofH = 0.35;
  const wallThick = 0.04;
  
  // Segment widths (Front face)
  const segLeftW = 0.35;
  const segCenterW = 0.35;
  const segRightW = 0.35; // Includes corner wrap effectively
  
  // --- Base ---
  const baseGeom = new THREE.BoxGeometry(houseW + 0.04, 0.05, houseD + 0.04);
  const base = new THREE.Mesh(baseGeom, matBase);
  base.position.y = -0.025;
  root.add(base);

  // --- Walls ---
  // We construct the walls as separate boxes to handle color segmentation cleanly.
  
  // Left Wall (Purple) - Front
  const wallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(segLeftW, wallH, wallThick),
    matPurple
  );
  wallLeft.position.set(-houseW/2 + segLeftW/2, wallH/2, houseD/2);
  root.add(wallLeft);

  // Center Wall (Mint) - Front
  const wallCenter = new THREE.Mesh(
    new THREE.BoxGeometry(segCenterW, wallH, wallThick),
    matMint
  );
  wallCenter.position.set(-segRightW/2 + segCenterW/2, wallH/2, houseD/2); // Centered roughly
  // Recalculate X: Left ends at -0.25. Center starts -0.25, ends 0.10.
  wallCenter.position.set(-0.075, wallH/2, houseD/2);
  root.add(wallCenter);

  // Right Wall Block (Peach) - This wraps the corner
  // Front part
  const wallRightFront = new THREE.Mesh(
    new THREE.BoxGeometry(segRightW, wallH, wallThick),
    matPeach
  );
  wallRightFront.position.set(houseW/2 - segRightW/2, wallH/2, houseD/2);
  root.add(wallRightFront);

  // Side part (Right side of house)
  const wallRightSide = new THREE.Mesh(
    new THREE.BoxGeometry(wallThick, wallH, houseD),
    matPeach
  );
  wallRightSide.position.set(houseW/2, wallH/2, 0);
  root.add(wallRightSide);

  // Back Wall (Peach) - Closing the volume
  const wallBack = new THREE.Mesh(
    new THREE.BoxGeometry(houseW, wallH, wallThick),
    matPeach
  );
  wallBack.position.set(0, wallH/2, -houseD/2);
  root.add(wallBack);

  // --- Gables (Triangles) ---
  // Using CylinderGeometry with 3 radial segments to make a prism, rotated to lie flat
  const gableGeom = new THREE.CylinderGeometry(houseW/2 + 0.1, houseW/2 + 0.1, roofH, 3, 1);
  // Rotate so flat face is front/back. Default cylinder is Y-up. 
  // We want the triangle to face Z. So rotate X by 90 deg.
  // But Cylinder 3-seg orientation depends on rotation. 
  // Easier: Extrude a triangle shape.
  
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-houseW/2 - 0.1, 0);
  gableShape.lineTo(houseW/2 + 0.1, 0);
  gableShape.lineTo(0, roofH);
  gableShape.lineTo(-houseW/2 - 0.1, 0);
  
  const gableExtrudeSettings = { depth: wallThick, bevelEnabled: false };
  const gableGeomFront = new THREE.ExtrudeGeometry(gableShape, gableExtrudeSettings);
  const gableFront = new THREE.Mesh(gableGeomFront, matPeach);
  gableFront.position.set(0, wallH, houseD/2);
  root.add(gableFront);

  const gableBack = new THREE.Mesh(gableGeomFront, matPeach);
  gableBack.position.set(0, wallH, -houseD/2);
  gableBack.rotation.y = Math.PI;
  root.add(gableBack);

  // --- Roof Planks ---
  // Create ridges on the roof
  const plankW = 0.06;
  const plankThick = 0.015;
  const roofSlopeLen = Math.sqrt(Math.pow(houseW/2 + 0.1, 2) + Math.pow(roofH, 2));
  const plankCount = 14;
  
  const plankGeom = new THREE.BoxGeometry(houseD + 0.2, plankThick, plankW);
  
  for (let i = 0; i < plankCount; i++) {
    // Distribute planks along the slope
    // We need to place them on both sides of the ridge
    const t = (i / (plankCount - 1)) * 2 - 1; // -1 to 1
    const xPos = t * (houseW/2 + 0.1);
    const yPos = wallH + roofH * (1 - Math.abs(t)); // Linear interpolation for height
    
    // Actually, let's just stack them up the slope properly
    // Slope angle
    const slopeAngle = Math.atan2(roofH, houseW/2 + 0.1);
    const distFromRidge = (i - plankCount/2) * plankW;
    
    const x = distFromRidge * Math.cos(slopeAngle);
    const y = wallH + roofH - Math.abs(distFromRidge) * Math.sin(slopeAngle);
    
    // Wait, simpler: Just place boxes rotated to match slope
    // Left side planks
    if (i < plankCount/2) {
       const plank = new THREE.Mesh(plankGeom, matRoof);
       const offset = (i + 0.5) * plankW;
       plank.position.set(-offset/2, wallH + offset * Math.tan(slopeAngle), 0);
       plank.rotation.z = -slopeAngle;
       plank.rotation.y = Math.PI/2; // Align with roof ridge (X axis) -> No, ridge is X, planks run Z?
       // Reference: Planks run Front-to-Back (Z axis). Ridge is X axis.
       // So plank long axis is Z.
       plank.rotation.z = -slopeAngle; 
       plank.position.set(- (houseW/2 + 0.1)/2 + offset * Math.cos(slopeAngle), wallH + offset * Math.sin(slopeAngle), 0);
       // This is getting complicated. Let's just make two big planes with a texture or simple geometry.
       // Simpler: Two large boxes for the roof planes.
    }
  }
  
  // Simpler Roof: Two large rotated boxes
  const roofPlaneGeom = new THREE.BoxGeometry(houseD + 0.2, 0.02, houseW/2 + 0.15);
  const roofLeft = new THREE.Mesh(roofPlaneGeom, matRoof);
  roofLeft.position.set(-(houseW/2 + 0.1)/2, wallH + roofH/2, 0);
  roofLeft.rotation.z = Math.atan2(roofH, houseW/2 + 0.1);
  root.add(roofLeft);

  const roofRight = new THREE.Mesh(roofPlaneGeom, matRoof);
  roofRight.position.set((houseW/2 + 0.1)/2, wallH + roofH/2, 0);
  roofRight.rotation.z = -Math.atan2(roofH, houseW/2 + 0.1);
  root.add(roofRight);

  // Add ridges to roof (thin boxes on top)
  const ridgeGeom = new THREE.BoxGeometry(houseD + 0.2, 0.01, 0.04);
  for(let i=0; i<10; i++) {
     const ridge = new THREE.Mesh(ridgeGeom, matRoof);
     // Place on left slope
     const zPos = -houseD/2 + i * (houseD/8);
     ridge.position.set(-(houseW/2 + 0.1)/2, wallH + roofH, zPos);
     ridge.rotation.z = Math.atan2(roofH, houseW/2 + 0.1);
     root.add(ridge);
     
     // Place on right slope
     const ridgeR = new THREE.Mesh(ridgeGeom, matRoof);
     ridgeR.position.set((houseW/2 + 0.1)/2, wallH + roofH, zPos);
     ridgeR.rotation.z = -Math.atan2(roofH, houseW/2 + 0.1);
     root.add(ridgeR);
  }
  
  // Roof Trim (White fascia)
  const fasciaGeom = new THREE.BoxGeometry(houseD + 0.2, 0.03, 0.05);
  const fasciaLeft = new THREE.Mesh(fasciaGeom, matWhite);
  fasciaLeft.position.set(-(houseW/2 + 0.1), wallH + 0.05, 0);
  root.add(fasciaLeft);
  const fasciaRight = new THREE.Mesh(fasciaGeom, matWhite);
  fasciaRight.position.set((houseW/2 + 0.1), wallH + 0.05, 0);
  root.add(fasciaRight);

  // --- Windows ---
  function createWindow(w, h, matFrame, matGlass) {
    const group = new THREE.Group();
    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), matFrame);
    group.add(frame);
    // Glass
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.8, h * 0.8), matGlass);
    glass.position.z = 0.011;
    group.add(glass);
    // Muntins (Cross)
    const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.02), matFrame);
    group.add(muntinV);
    const muntinH = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.02), matFrame);
    group.add(muntinH);
    return group;
  }

  // Window 1 (Purple Wall)
  const win1 = createWindow(0.15, 0.2, matWhite, matGlass);
  win1.position.set(-houseW/2 + segLeftW/2, wallH/2 + 0.1, houseD/2 + 0.02);
  root.add(win1);

  // Window 2 (Mint Wall)
  const win2 = createWindow(0.15, 0.2, matWhite, matGlass);
  win2.position.set(-0.075, wallH/2 + 0.1, houseD/2 + 0.02);
  root.add(win2);

  // Window 3 & 4 (Peach Side Wall)
  const win3 = createWindow(0.15, 0.2, matWhite, matGlass);
  win3.position.set(houseW/2 + 0.02, wallH/2 + 0.1, -0.2);
  win3.rotation.y = -Math.PI/2;
  root.add(win3);

  const win4 = createWindow(0.15, 0.2, matWhite, matGlass);
  win4.position.set(houseW/2 + 0.02, wallH/2 + 0.1, 0.2);
  win4.rotation.y = -Math.PI/2;
  root.add(win4);

  // --- Door ---
  const doorW = 0.18;
  const doorH = 0.35;
  const door = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.02), matDoor);
  door.position.set(-0.075, doorH/2, houseD/2 + 0.02);
  root.add(door);
  
  // Door Knob
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), matWhite);
  knob.position.set(-0.075 + doorW/2 - 0.03, doorH/2, houseD/2 + 0.03);
  root.add(knob);

  // Door Frame
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.04, doorH + 0.04, 0.03), matWhite);
  doorFrame.position.set(-0.075, doorH/2, houseD/2 + 0.01);
  root.add(doorFrame);

  // Step
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.15), matBase);
  step.position.set(-0.075, -0.025, houseD/2 + 0.1);
  root.add(step);

  // --- Vent ---
  const vent = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), matWhite);
  vent.position.set(0, wallH + roofH/2, houseD/2 + 0.01);
  root.add(vent);
  // Vent slats
  for(let i=0; i<4; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.01), matGlass);
    slat.position.set(0, wallH + roofH/2 - 0.03 + i*0.02, houseD/2 + 0.015);
    root.add(slat);
  }

  // --- Gutter ---
  const gutterGeom = new THREE.CylinderGeometry(0.02, 0.02, houseD, 8, 1, true, 0, Math.PI);
  const gutter = new THREE.Mesh(gutterGeom, matGutter);
  gutter.rotation.z = Math.PI/2;
  gutter.rotation.y = Math.PI/2;
  gutter.position.set(houseW/2 + 0.05, wallH, 0);
  root.add(gutter);
  
  // Downspout
  const downspout = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, wallH, 8), matGutter);
  downspout.position.set(houseW/2 + 0.05, wallH/2, -houseD/2);
  root.add(downspout);

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