export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0xE0D4F0, roughness: 0.7, metalness: 0.0 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0xD4F0E0, roughness: 0.7, metalness: 0.0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xF0E8D4, roughness: 0.7, metalness: 0.0 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xE8A0A0, roughness: 0.6, metalness: 0.0 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.5, metalness: 0.0 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xA0E0F0, roughness: 0.6, metalness: 0.0 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x405060, roughness: 0.2, metalness: 0.1 });
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xCCCCCC, roughness: 0.8, metalness: 0.0 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0xD0B090, roughness: 0.8, metalness: 0.0 });
  const gutterMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.3 });
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.3, metalness: 0.5 });

  // --- Dimensions ---
  const houseW = 1.0;
  const houseD = 0.7;
  const wallH = 0.5;
  const roofH = 0.3;
  const wallThick = 0.04;
  const roofOverhang = 0.08;

  // --- Base / Foundation ---
  const baseGeom = new THREE.BoxGeometry(houseW + 0.02, 0.03, houseD + 0.02);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -wallH / 2 - 0.015;
  root.add(base);

  // --- Walls ---
  // We construct walls as thick boxes that overlap slightly to avoid gaps.
  
  // Side Wall (Yellow) - Right side
  const wallSideGeom = new THREE.BoxGeometry(wallThick, wallH, houseD);
  const wallSide = new THREE.Mesh(wallSideGeom, yellowMat);
  wallSide.position.set(houseW / 2, 0, 0);
  root.add(wallSide);

  // Back Wall (Yellow)
  const wallBackGeom = new THREE.BoxGeometry(houseW, wallH, wallThick);
  const wallBack = new THREE.Mesh(wallBackGeom, yellowMat);
  wallBack.position.set(0, 0, -houseD / 2);
  root.add(wallBack);

  // Front Left Wall (Purple)
  const wallFrontLeftGeom = new THREE.BoxGeometry(houseW / 2, wallH, wallThick);
  const wallFrontLeft = new THREE.Mesh(wallFrontLeftGeom, purpleMat);
  wallFrontLeft.position.set(-houseW / 4, 0, houseD / 2);
  root.add(wallFrontLeft);

  // Front Right Wall (Green)
  const wallFrontRightGeom = new THREE.BoxGeometry(houseW / 2, wallH, wallThick);
  const wallFrontRight = new THREE.Mesh(wallFrontRightGeom, greenMat);
  wallFrontRight.position.set(houseW / 4, 0, houseD / 2);
  root.add(wallFrontRight);

  // --- Roof ---
  // Triangular prism using CylinderGeometry with 3 radial segments
  const roofRadius = (houseW / 2 + roofOverhang) / Math.cos(Math.atan2(roofH, houseW / 2));
  const roofLength = houseD + roofOverhang * 2;
  const roofGeom = new THREE.CylinderGeometry(0, roofRadius, roofLength, 3, 1);
  // Rotate to align triangle base with XZ plane, apex up Y
  roofGeom.rotateZ(-Math.PI / 2); 
  // The cylinder creates a prism pointing along Z. We need it along X? 
  // Default Cylinder is Y-up. 3 segments = triangle in XZ plane if rotated?
  // Let's use Extrude for precise control or rotate Cylinder carefully.
  // Cylinder(3 segments) creates a triangle in the XY plane (if looking from top).
  // We want the triangle in the YZ plane (gable face) or XY plane?
  // Gable is on the front/back (XY plane). So the prism runs along Z.
  // Default Cylinder: Axis Y. 3 segments -> Triangle in XZ plane.
  // We want Triangle in XY plane (facing Z). So rotate X by 90 deg.
  roofGeom.rotateX(Math.PI / 2);
  
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, wallH / 2 + roofH / 2, 0);
  // Scale to fit width
  // The radius determines the distance from center to vertex.
  // We need the base width to be houseW + 2*overhang.
  // For an equilateral triangle, height = width * sqrt(3)/2.
  // Our triangle is isosceles.
  // Let's just scale the mesh.
  const roofScaleX = (houseW + roofOverhang * 2) / (roofRadius * Math.sqrt(3)); // Approx
  // Actually simpler: Create a custom shape or just scale the cylinder.
  // Let's rely on scaling the geometry.
  roof.scale.set((houseW + roofOverhang * 2) / (roofRadius * 1.732), 1, roofLength / roofRadius);
  // Re-evaluating Roof Geometry for precision:
  // Use a Box for the core and two slanted boxes for the slopes? No, Cylinder is standard.
  // Let's use a simpler approach: Two slanted boxes.
  root.remove(roof);

  const slopeW = Math.sqrt(Math.pow(houseW / 2 + roofOverhang, 2) + Math.pow(roofH, 2));
  const slopeGeom = new THREE.BoxGeometry(slopeW, wallThick, roofLength);
  const roofLeft = new THREE.Mesh(slopeGeom, roofMat);
  roofLeft.position.set(-houseW / 4, wallH + roofH / 2, 0);
  roofLeft.rotation.z = -Math.atan2(roofH, houseW / 2 + roofOverhang);
  root.add(roofLeft);

  const roofRight = new THREE.Mesh(slopeGeom, roofMat);
  roofRight.position.set(houseW / 4, wallH + roofH / 2, 0);
  roofRight.rotation.z = Math.atan2(roofH, houseW / 2 + roofOverhang);
  root.add(roofRight);

  // Roof Ridges (Corrugation)
  const ridgeGeom = new THREE.BoxGeometry(slopeW, 0.005, 0.02);
  const ridgeCount = 12;
  for (let i = 0; i < ridgeCount; i++) {
    const z = -roofLength / 2 + (roofLength / ridgeCount) * (i + 0.5);
    const ridgeL = new THREE.Mesh(ridgeGeom, roofMat);
    ridgeL.position.copy(roofLeft.position);
    ridgeL.position.z = z;
    ridgeL.rotation.z = roofLeft.rotation.z;
    root.add(ridgeL);

    const ridgeR = new THREE.Mesh(ridgeGeom, roofMat);
    ridgeR.position.copy(roofRight.position);
    ridgeR.position.z = z;
    ridgeR.rotation.z = roofRight.rotation.z;
    root.add(ridgeR);
  }

  // Roof Trim (Fascia)
  const trimGeom = new THREE.BoxGeometry(houseW + roofOverhang * 2, 0.02, 0.02);
  const trimFront = new THREE.Mesh(trimGeom, whiteMat);
  trimFront.position.set(0, wallH, houseD / 2 + roofOverhang / 2);
  root.add(trimFront);
  
  const trimBack = new THREE.Mesh(trimGeom, whiteMat);
  trimBack.position.set(0, wallH, -houseD / 2 - roofOverhang / 2);
  root.add(trimBack);

  // --- Windows Helper ---
  function createWindow() {
    const group = new THREE.Group();
    const frameGeom = new THREE.BoxGeometry(0.12, 0.14, 0.02);
    const frame = new THREE.Mesh(frameGeom, whiteMat);
    group.add(frame);

    const glassGeom = new THREE.BoxGeometry(0.08, 0.10, 0.01);
    const glass = new THREE.Mesh(glassGeom, glassMat);
    glass.position.z = 0.005;
    group.add(glass);

    // Muntins (Cross bars)
    const barVGeom = new THREE.BoxGeometry(0.01, 0.10, 0.015);
    const barV = new THREE.Mesh(barVGeom, whiteMat);
    barV.position.z = 0.006;
    group.add(barV);

    const barHGeom = new THREE.BoxGeometry(0.08, 0.01, 0.015);
    const barH = new THREE.Mesh(barHGeom, whiteMat);
    barH.position.z = 0.006;
    group.add(barH);

    return group;
  }

  // Place Windows
  // Front Left (Purple)
  const winFL = createWindow();
  winFL.position.set(-houseW / 4, 0.05, houseD / 2 + 0.02);
  root.add(winFL);

  // Front Right (Green)
  const winFR = createWindow();
  winFR.position.set(houseW / 4, 0.05, houseD / 2 + 0.02);
  root.add(winFR);

  // Side (Yellow) - Two windows
  const winS1 = createWindow();
  winS1.rotation.y = -Math.PI / 2;
  winS1.position.set(houseW / 2 + 0.02, 0.05, -houseD / 4);
  root.add(winS1);

  const winS2 = createWindow();
  winS2.rotation.y = -Math.PI / 2;
  winS2.position.set(houseW / 2 + 0.02, 0.05, houseD / 4);
  root.add(winS2);

  // Gable Vent (Small square in the triangle)
  const ventGroup = new THREE.Group();
  const ventFrameGeom = new THREE.BoxGeometry(0.06, 0.06, 0.02);
  const ventFrame = new THREE.Mesh(ventFrameGeom, whiteMat);
  ventGroup.add(ventFrame);
  const ventGlassGeom = new THREE.BoxGeometry(0.04, 0.04, 0.01);
  const ventGlass = new THREE.Mesh(ventGlassGeom, glassMat);
  ventGlass.position.z = 0.005;
  ventGroup.add(ventGlass);
  // Slats
  for(let i=0; i<3; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.015), whiteMat);
    slat.position.set(0, -0.01 + i*0.01, 0.006);
    ventGroup.add(slat);
  }
  ventGroup.position.set(-houseW / 4, wallH + 0.15, houseD / 2 + 0.02);
  root.add(ventGroup);

  // --- Door ---
  const doorGeom = new THREE.BoxGeometry(0.14, 0.22, 0.02);
  const door = new THREE.Mesh(doorGeom, doorMat);
  door.position.set(houseW / 4, -0.14, houseD / 2 + 0.02);
  root.add(door);

  const doorFrameGeom = new THREE.BoxGeometry(0.16, 0.24, 0.02);
  const doorFrame = new THREE.Mesh(doorFrameGeom, whiteMat);
  doorFrame.position.set(houseW / 4, -0.14, houseD / 2 + 0.01);
  root.add(doorFrame);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), knobMat);
  knob.position.set(houseW / 4 + 0.05, -0.14, houseD / 2 + 0.03);
  root.add(knob);

  // Step
  const stepGeom = new THREE.BoxGeometry(0.20, 0.04, 0.12);
  const step = new THREE.Mesh(stepGeom, stepMat);
  step.position.set(houseW / 4, -wallH / 2 - 0.02, houseD / 2 + 0.10);
  root.add(step);

  // --- Gutter & Downspout ---
  // Along the right roof edge
  const gutterPipeGeom = new THREE.CylinderGeometry(0.01, 0.01, roofLength, 8);
  gutterPipeGeom.rotateX(Math.PI / 2);
  const gutterPipe = new THREE.Mesh(gutterPipeGeom, gutterMat);
  gutterPipe.position.set(houseW / 2 + roofOverhang / 2, wallH + roofH / 2, 0);
  // Rotate to match roof slope
  gutterPipe.rotation.z = Math.atan2(roofH, houseW / 2 + roofOverhang);
  root.add(gutterPipe);

  // Downspout at back corner
  const downspoutGeom = new THREE.CylinderGeometry(0.01, 0.01, wallH + roofH, 8);
  const downspout = new THREE.Mesh(downspoutGeom, gutterMat);
  downspout.position.set(houseW / 2 + roofOverhang / 2, 0, -houseD / 2 - roofOverhang / 2);
  root.add(downspout);

  // Elbow
  const elbowGeom = new THREE.TorusGeometry(0.01, 0.005, 8, 16, Math.PI / 2);
  const elbow = new THREE.Mesh(elbowGeom, gutterMat);
  elbow.rotation.y = Math.PI / 2;
  elbow.rotation.z = Math.PI / 2;
  elbow.position.set(houseW / 2 + roofOverhang / 2, wallH + roofH, -houseD / 2 - roofOverhang / 2);
  root.add(elbow);

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