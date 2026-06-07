export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const length = 2.2;
  const width = 0.9;
  const height = 0.75;
  const wheelRadius = 0.32;
  const wheelBase = 1.35;
  const groundClearance = 0.05;
  
  // --- Materials ---
  // Black glossy paint - high metalness but capped at 0.6 to avoid black-out
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Chrome trim
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Dark tinted glass
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
    ior: 1.5,
  });

  // Tire rubber
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x151515,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Silver rim
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Red brake caliper
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    metalness: 0.4,
    roughness: 0.5,
  });

  // Headlight/Taillight glass
  const lightGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.8,
    transparent: true,
  });
  
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    emissive: 0x550000,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.2
  });

  // --- Helpers ---
  function addMesh(geom, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    if (rx !== undefined) mesh.rotation.x = rx;
    if (ry !== undefined) mesh.rotation.y = ry;
    if (rz !== undefined) mesh.rotation.z = rz;
    if (sx !== undefined) mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    return mesh;
  }

  // --- Body Shape (Extruded Side Profile) ---
  // Profile in YZ plane (Y up, Z forward)
  const bodyShape = new THREE.Shape();
  const zFront = length / 2;
  const zRear = -length / 2;
  const yGround = groundClearance;
  const yBelt = 0.55;
  const yRoof = 0.95;

  // Start bottom rear
  bodyShape.moveTo(zRear, yGround);
  // Rear bumper up
  bodyShape.lineTo(zRear + 0.1, yGround);
  bodyShape.quadraticCurveTo(zRear + 0.2, yGround + 0.15, zRear + 0.25, yBelt - 0.1);
  // Rear quarter window slope
  bodyShape.lineTo(zRear + 0.4, yRoof - 0.1);
  // Roof line (slight arch)
  bodyShape.quadraticCurveTo(0, yRoof + 0.05, -0.6, yRoof - 0.05);
  // Windshield
  bodyShape.lineTo(zFront - 0.6, yBelt);
  // Hood
  bodyShape.quadraticCurveTo(zFront - 0.2, yBelt - 0.1, zFront - 0.1, yGround + 0.15);
  // Front bumper down
  bodyShape.lineTo(zFront, yGround);
  // Bottom line back to start
  bodyShape.lineTo(zRear, yGround);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: width,
    bevelEnabled: false,
  });
  // Center the extrusion
  bodyGeom.translate(0, 0, -width / 2);
  // Rotate to face +Z (Shape was drawn in YZ, extruded along X? No, Extrude goes along Z by default)
  // Wait, Shape is in XY plane by default for ExtrudeGeometry.
  // I need the profile in XY, extruded along Z? No, car faces +Z.
  // So profile should be in YZ plane? ExtrudeGeometry extrudes along local Z.
  // So I need the profile in XY plane, then rotate the mesh 90 deg around X?
  // Let's draw profile in XY (X is width, Y is height)? No.
  // Standard: Shape in XY. Extrude along Z.
  // I want the car to face +Z. So the "depth" of extrusion is the Width (X axis).
  // So I need to draw the side profile in YZ plane? No, Shape is always XY.
  // Strategy: Draw side profile in XY (X=longitudinal, Y=vertical). Extrude along Z (width).
  // Then rotate the whole mesh 90 deg around Y so X becomes Z?
  // Easier: Draw profile in XY where X is Z-world (length) and Y is Y-world (height).
  // Extrude along Z (which becomes X-world width).
  // Then rotate mesh -90 deg around Y?
  // Let's just draw the profile in the XY plane where X represents the car's Length (Z-world) and Y is Height.
  // Then ExtrudeGeometry creates depth along Z. We want that depth to be the car's Width (X-world).
  // So: Rotate the resulting mesh -90 degrees around Y axis.
  
  // Redefine shape coordinates: X is longitudinal (Z-world), Y is vertical.
  const profileShape = new THREE.Shape();
  const f = length / 2;
  const r = -length / 2;
  
  profileShape.moveTo(r, yGround); // Rear bottom
  profileShape.lineTo(r + 0.15, yGround);
  profileShape.quadraticCurveTo(r + 0.3, yGround + 0.2, r + 0.4, yBelt); // Rear up
  profileShape.lineTo(r + 0.9, yRoof - 0.1); // C-pillar
  profileShape.quadraticCurveTo(0, yRoof + 0.02, -0.7, yRoof - 0.05); // Roof
  profileShape.lineTo(f - 0.7, yBelt); // Windshield
  profileShape.quadraticCurveTo(f - 0.2, yBelt - 0.1, f - 0.15, yGround + 0.2); // Hood
  profileShape.lineTo(f, yGround); // Front down
  profileShape.lineTo(r, yGround); // Bottom

  const carBodyGeom = new THREE.ExtrudeGeometry(profileShape, {
    depth: width,
    bevelEnabled: false
  });
  
  // The extrusion goes along local Z. We want width along X.
  // Rotate -90 deg around Y maps Local Z to Local X.
  // But wait, standard ExtrudeGeometry: Shape in XY, extrudes along Z.
  // If I rotate -90 Y: Local X -> Local Z (Length), Local Z -> Local -X (Width).
  // This works.
  const carBody = new THREE.Mesh(carBodyGeom, bodyMat);
  carBody.rotation.y = -Math.PI / 2;
  // Center it
  carBody.position.x = 0; 
  carBody.position.y = 0;
  carBody.position.z = 0;
  root.add(carBody);

  // --- Windows (Glass) ---
  // We need to cut holes or overlay glass. Overlay is easier procedurally.
  // Side windows are flat planes on the side of the body.
  const windowZOffset = width / 2 + 0.005;
  
  // Front Side Window
  const frontWinShape = new THREE.Shape();
  frontWinShape.moveTo(-0.65, yBelt + 0.02);
  frontWinShape.lineTo(-0.1, yBelt + 0.02);
  frontWinShape.lineTo(-0.25, yRoof - 0.05);
  frontWinShape.quadraticCurveTo(-0.5, yRoof, -0.7, yRoof - 0.1);
  frontWinShape.lineTo(-0.65, yBelt + 0.02);
  
  const frontWinGeom = new THREE.ShapeGeometry(frontWinShape);
  const frontWinL = new THREE.Mesh(frontWinGeom, glassMat);
  frontWinL.position.set(-width/2 - 0.002, 0, -0.2); // Left side (X negative)
  frontWinL.rotation.y = Math.PI / 2;
  root.add(frontWinL);
  
  const frontWinR = frontWinL.clone();
  frontWinR.position.set(width/2 + 0.002, 0, -0.2);
  frontWinR.rotation.y = -Math.PI / 2; // Flip for right side
  root.add(frontWinR);

  // Rear Side Window
  const rearWinShape = new THREE.Shape();
  rearWinShape.moveTo(-0.1, yBelt + 0.02);
  rearWinShape.lineTo(0.8, yBelt + 0.02);
  rearWinShape.lineTo(0.6, yRoof - 0.15);
  rearWinShape.lineTo(-0.25, yRoof - 0.05);
  rearWinShape.lineTo(-0.1, yBelt + 0.02);

  const rearWinGeom = new THREE.ShapeGeometry(rearWinShape);
  const rearWinL = new THREE.Mesh(rearWinGeom, glassMat);
  rearWinL.position.set(-width/2 - 0.002, 0, 0.1);
  rearWinL.rotation.y = Math.PI / 2;
  root.add(rearWinL);

  const rearWinR = rearWinL.clone();
  rearWinR.position.set(width/2 + 0.002, 0, 0.1);
  rearWinR.rotation.y = -Math.PI / 2;
  root.add(rearWinR);

  // --- Chrome Trim ---
  // Window line trim
  const trimCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width/2 - 0.005, yBelt, -0.7),
    new THREE.Vector3(-width/2 - 0.005, yBelt + 0.05, -0.2),
    new THREE.Vector3(-width/2 - 0.005, yRoof - 0.1, 0.6),
    new THREE.Vector3(-width/2 - 0.005, yBelt, 0.9)
  ]);
  // Simplified: Just boxes along the beltline
  const beltTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 1.6), chromeMat);
  beltTrimL.position.set(-width/2 - 0.005, yBelt + 0.01, 0.1);
  root.add(beltTrimL);
  const beltTrimR = beltTrimL.clone();
  beltTrimR.position.set(width/2 + 0.005, yBelt + 0.01, 0.1);
  root.add(beltTrimR);

  // Lower side skirt trim
  const skirtTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.015, 1.4), chromeMat);
  skirtTrimL.position.set(-width/2 - 0.005, groundClearance + 0.15, 0);
  root.add(skirtTrimL);
  const skirtTrimR = skirtTrimL.clone();
  skirtTrimR.position.set(width/2 + 0.005, groundClearance + 0.15, 0);
  root.add(skirtTrimR);

  // --- Wheels ---
  function createWheel(x, z) {
    const wheelGroup = new THREE.Group();
    
    // Tire
    const tireGeom = new THREE.TorusGeometry(wheelRadius, 0.12, 16, 32);
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.y = Math.PI / 2; // Face X axis
    wheelGroup.add(tire);

    // Rim (Multi-spoke simulation)
    const rimGroup = new THREE.Group();
    const rimBase = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.85, wheelRadius * 0.85, 0.1, 32), rimMat);
    rimBase.rotation.x = Math.PI / 2;
    rimGroup.add(rimBase);

    // Spokes
    const spokeGeom = new THREE.BoxGeometry(0.04, wheelRadius * 0.8, 0.05);
    const numSpokes = 10;
    for (let i = 0; i < numSpokes; i++) {
      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      spoke.rotation.z = (i / numSpokes) * Math.PI * 2;
      rimGroup.add(spoke);
    }
    
    // Center cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16), chromeMat);
    cap.rotation.x = Math.PI / 2;
    rimGroup.add(cap);

    // Brake caliper (visible through spokes)
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.1), brakeMat);
    caliper.position.set(0, wheelRadius * 0.4, 0.06);
    caliper.rotation.z = Math.PI / 2; // Align with spoke roughly
    rimGroup.add(caliper);

    wheelGroup.add(rimGroup);

    wheelGroup.position.set(x, groundClearance + wheelRadius, z);
    root.add(wheelGroup);
  }

  createWheel(-width/2 - 0.1, wheelBase / 2); // Front Left
  createWheel(width/2 + 0.1, wheelBase / 2);  // Front Right
  createWheel(-width/2 - 0.1, -wheelBase / 2); // Rear Left
  createWheel(width/2 + 0.1, -wheelBase / 2);  // Rear Right

  // --- Lights ---
  // Headlights (Front)
  const headLightGeom = new THREE.BoxGeometry(0.05, 0.12, 0.25);
  const headLightL = new THREE.Mesh(headLightGeom, lightGlassMat);
  headLightL.position.set(-width/2 - 0.01, groundClearance + 0.3, length/2 - 0.1);
  headLightL.rotation.y = Math.PI / 2; // Face forward
  root.add(headLightL);
  
  const headLightR = headLightL.clone();
  headLightR.position.set(width/2 + 0.01, groundClearance + 0.3, length/2 - 0.1);
  headLightR.rotation.y = -Math.PI / 2;
  root.add(headLightR);

  // Taillights (Rear)
  const tailLightGeom = new THREE.BoxGeometry(0.05, 0.15, 0.3);
  const tailLightL = new THREE.Mesh(tailLightGeom, tailLightMat);
  tailLightL.position.set(-width/2 - 0.01, groundClearance + 0.35, -length/2 + 0.15);
  tailLightL.rotation.y = Math.PI / 2;
  root.add(tailLightL);

  const tailLightR = tailLightL.clone();
  tailLightR.position.set(width/2 + 0.01, groundClearance + 0.35, -length/2 + 0.15);
  tailLightR.rotation.y = -Math.PI / 2;
  root.add(tailLightR);

  // --- Details ---
  // Side Mirrors
  const mirrorGeom = new THREE.CapsuleGeometry(0.06, 0.15, 4, 8);
  const mirrorL = new THREE.Mesh(mirrorGeom, bodyMat);
  mirrorL.position.set(-width/2 - 0.1, yBelt + 0.1, -0.3);
  mirrorL.rotation.z = Math.PI / 2;
  root.add(mirrorL);
  
  const mirrorR = mirrorL.clone();
  mirrorR.position.set(width/2 + 0.1, yBelt + 0.1, -0.3);
  root.add(mirrorR);

  // Door Handles
  const handleGeom = new THREE.CapsuleGeometry(0.015, 0.12, 4, 8);
  const handleFL = new THREE.Mesh(handleGeom, chromeMat);
  handleFL.rotation.z = Math.PI / 2;
  handleFL.position.set(-width/2 - 0.005, yBelt - 0.1, -0.1);
  root.add(handleFL);
  
  const handleRL = handleFL.clone();
  handleRL.position.set(-width/2 - 0.005, yBelt - 0.1, 0.5);
  root.add(handleRL);

  const handleFR = handleFL.clone();
  handleFR.position.set(width/2 + 0.005, yBelt - 0.1, -0.1);
  root.add(handleFR);

  const handleRR = handleFL.clone();
  handleRR.position.set(width/2 + 0.005, yBelt - 0.1, 0.5);
  root.add(handleRR);

  // Shark Fin Antenna
  const antennaShape = new THREE.Shape();
  antennaShape.moveTo(0, 0);
  antennaShape.lineTo(0.05, 0.1);
  antennaShape.lineTo(0.15, 0.1);
  antennaShape.lineTo(0.1, 0);
  antennaShape.lineTo(0, 0);
  const antennaGeom = new THREE.ExtrudeGeometry(antennaShape, { depth: 0.04, bevelEnabled: false });
  const antenna = new THREE.Mesh(antennaGeom, bodyMat);
  antenna.position.set(0, yRoof + 0.02, -0.4);
  antenna.rotation.x = Math.PI / 2; // Lay flat on roof
  root.add(antenna);

  // Grille (Front)
  const grilleGeom = new THREE.PlaneGeometry(0.4, 0.25);
  const grille = new THREE.Mesh(grilleGeom, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }));
  grille.position.set(0, groundClearance + 0.25, length/2 + 0.01);
  // Slat details
  const slatGeom = new THREE.BoxGeometry(0.35, 0.02, 0.01);
  for(let i=0; i<4; i++) {
    const slat = new THREE.Mesh(slatGeom, chromeMat);
    slat.position.set(0, groundClearance + 0.15 + i*0.06, length/2 + 0.01);
    root.add(slat);
  }
  // Mercedes Star (simplified as a circle for now)
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.06, 32), chromeMat);
  star.position.set(0, groundClearance + 0.35, length/2 + 0.01);
  root.add(star);

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