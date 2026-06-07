export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const L = 1.0;
  const W = 0.46;
  const H = 0.36;
  const wheelR = 0.125;
  const wheelBase = 0.58;
  const bodyBottom = -0.10;
  const beltHeight = 0.12;
  const roofHeight = 0.28;

  // --- Materials ---
  // Black glossy paint: High gloss, moderate metalness for depth
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.5,
    roughness: 0.15,
  });

  // Glass: Tinted, physical transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x223344,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
  });

  // Chrome trim: Bright silver
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Tires: Dark rubber
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Rims: Polished metal
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Brake calipers: Red
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    metalness: 0.3,
    roughness: 0.5,
  });

  // Taillights: Red emissive
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0x880000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Headlights: White/Yellow emissive
  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 1.0,
    metalness: 0.0,
    roughness: 0.2,
  });

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  function addCylinder(rTop, rBot, h, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 32), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  function addTorus(r, tube, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 32), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    root.add(mesh);
    return mesh;
  }

  // --- Main Body Construction ---

  // Lower Body Tub (The main chassis volume)
  // Tapered slightly at front and rear
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(W, H * 0.55, L),
    bodyMat
  );
  // Deform vertices slightly for coupe shape (simplified via scaling blocks)
  // We will stack blocks to approximate the curve instead of custom geometry for robustness
  lowerBody.position.set(0, bodyBottom + H * 0.275, 0);
  // Scale front and rear down slightly to mimic hood/trunk slope
  lowerBody.scale.set(1, 1, 1); 
  root.add(lowerBody);

  // Front Hood Section (Raised)
  addBox(W * 0.9, 0.04, L * 0.35, bodyMat, 0, bodyBottom + H * 0.55, L * 0.25);

  // Rear Deck (Sloping Coupe Roof)
  // Main cabin block
  const cabinW = W * 0.85;
  const cabinH = roofHeight - beltHeight;
  const cabinL = L * 0.55;
  const cabinZ = -L * 0.1; // Shifted back for coupe profile
  
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW, cabinH, cabinL),
    bodyMat
  );
  cabin.position.set(0, beltHeight + cabinH * 0.5, cabinZ);
  root.add(cabin);

  // Roof Slope (Rear Window area) - Wedge shape
  const rearSlope = new THREE.Mesh(
    new THREE.BoxGeometry(cabinW * 0.95, cabinH * 0.8, L * 0.25),
    bodyMat
  );
  rearSlope.position.set(0, beltHeight + cabinH * 0.4, cabinZ - cabinL * 0.5 - L * 0.1);
  rearSlope.rotation.x = -0.4; // Slope down
  root.add(rearSlope);

  // Trunk Lid (Flat rear)
  addBox(W * 0.85, 0.05, L * 0.2, bodyMat, 0, beltHeight + 0.02, -L * 0.4);

  // --- Windows ---
  // Side Windows (Tinted planes slightly inset)
  const windowH = cabinH * 0.85;
  const windowY = beltHeight + windowH * 0.5;
  
  // Front Side Window
  addBox(0.01, windowH, L * 0.25, glassMat, W * 0.5 + 0.005, windowY, cabinZ + L * 0.15);
  addBox(0.01, windowH, L * 0.25, glassMat, -W * 0.5 - 0.005, windowY, cabinZ + L * 0.15);
  
  // Rear Side Window (Quarter glass)
  const rearWinH = windowH * 0.7;
  addBox(0.01, rearWinH, L * 0.2, glassMat, W * 0.5 + 0.005, windowY - 0.02, cabinZ - L * 0.15);
  addBox(0.01, rearWinH, L * 0.2, glassMat, -W * 0.5 - 0.005, windowY - 0.02, cabinZ - L * 0.15);

  // Windshield (Front)
  const wsH = cabinH * 0.9;
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.9, wsH), glassMat);
  ws.position.set(0, beltHeight + wsH * 0.5, cabinZ + cabinL * 0.5 + 0.01);
  ws.rotation.x = -0.5; // Raked windshield
  root.add(ws);

  // Rear Window
  const rwH = cabinH * 0.8;
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.85, rwH), glassMat);
  rw.position.set(0, beltHeight + rwH * 0.4, cabinZ - cabinL * 0.5 - 0.05);
  rw.rotation.x = 0.6; // Sloped rear
  root.add(rw);

  // --- Chrome Trim ---
  // Beltline trim (Window sill)
  addBox(W * 0.92, 0.015, cabinL + 0.1, chromeMat, 0, beltHeight, cabinZ);
  addBox(W * 0.92, 0.015, cabinL + 0.1, chromeMat, 0, beltHeight + cabinH, cabinZ); // Roof line

  // Lower Rocker Trim
  addBox(W * 0.95, 0.02, L * 0.8, chromeMat, 0, bodyBottom + 0.05, 0);

  // Side Vent (Front Fender)
  const ventW = 0.08;
  const ventH = 0.03;
  addBox(ventW, ventH, 0.01, chromeMat, W * 0.5 + 0.005, bodyBottom + H * 0.4, L * 0.35);

  // Door Handles
  const handleY = beltHeight - 0.04;
  addBox(0.08, 0.015, 0.02, chromeMat, W * 0.5 + 0.005, handleY, cabinZ + 0.1); // Front
  addBox(0.08, 0.015, 0.02, chromeMat, W * 0.5 + 0.005, handleY, cabinZ - 0.15); // Rear

  // --- Wheels ---
  const wheelPositions = [
    { x: W * 0.5, z: wheelBase },   // Front Right
    { x: -W * 0.5, z: wheelBase },  // Front Left
    { x: W * 0.5, z: -wheelBase },  // Rear Right
    { x: -W * 0.5, z: -wheelBase }  // Rear Left
  ];

  for (const pos of wheelPositions) {
    const wy = bodyBottom + wheelR;
    
    // Tire
    const tire = new THREE.Mesh(new THREE.TorusGeometry(wheelR - 0.02, 0.035, 16, 32), tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.position.set(pos.x, wy, pos.z);
    root.add(tire);

    // Rim Base
    const rimBase = new THREE.Mesh(new THREE.CylinderGeometry(wheelR - 0.04, wheelR - 0.04, 0.02, 32), rimMat);
    rimBase.rotation.x = Math.PI / 2;
    rimBase.position.set(pos.x, wy, pos.z);
    root.add(rimBase);

    // Spokes (Simple cross pattern + ring)
    const spokeGroup = new THREE.Group();
    spokeGroup.position.set(pos.x, wy, pos.z);
    
    // Center cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 16), rimMat);
    cap.rotation.x = Math.PI / 2;
    spokeGroup.add(cap);

    // Radial spokes
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, wheelR - 0.05), rimMat);
      spoke.position.set(Math.cos(angle) * (wheelR * 0.5), Math.sin(angle) * (wheelR * 0.5), 0);
      spoke.rotation.z = -angle;
      spokeGroup.add(spoke);
    }
    // Rotate spoke group to face outward (Y-axis rotation for side wheels)
    // Since wheel is rotated Y=PI/2, the local Z is now X, local X is now -Z.
    // We want spokes in the XY plane of the wheel.
    // Actually, simpler: The wheel mesh is rotated Y=PI/2. So its local XY plane is the world YZ plane? 
    // No. Torus default is XY. Rotate Y=PI/2 -> XZ plane (vertical). Correct.
    // So spokes should be in local XY of the group.
    spokeGroup.rotation.y = Math.PI / 2; 
    root.add(spokeGroup);

    // Brake Caliper (Visible behind spokes)
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.04, 0.03), brakeMat);
    caliper.position.set(pos.x > 0 ? pos.x - 0.01 : pos.x + 0.01, wy, pos.z);
    // Offset slightly in Z to be behind rim face
    caliper.position.z += (pos.z > 0 ? 0.01 : -0.01); 
    root.add(caliper);
  }

  // --- Lights ---
  // Headlights (Front corners)
  const hlW = 0.08;
  const hlH = 0.04;
  const hlZ = L * 0.48;
  const hlY = bodyBottom + H * 0.45;
  
  // Left Headlight
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.04, hlH, hlW), headLightMat);
  hlL.position.set(-W * 0.45, hlY, hlZ);
  hlL.rotation.y = 0.2; // Angle in
  root.add(hlL);
  
  // Right Headlight
  const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.04, hlH, hlW), headLightMat);
  hlR.position.set(W * 0.45, hlY, hlZ);
  hlR.rotation.y = -0.2; // Angle in
  root.add(hlR);

  // Taillights (Rear strip)
  const tlW = 0.15;
  const tlH = 0.04;
  const tlZ = -L * 0.48;
  const tlY = bodyBottom + H * 0.4;
  
  const tl = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, tlH, 0.02), tailLightMat);
  tl.position.set(0, tlY, tlZ);
  root.add(tl);

  // --- Mirrors ---
  const mirrorY = beltHeight + 0.05;
  const mirrorZ = cabinZ + cabinL * 0.4;
  
  const mirrorL = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.06, 4, 8), bodyMat);
  mirrorL.rotation.z = Math.PI / 2;
  mirrorL.position.set(-W * 0.5 - 0.03, mirrorY, mirrorZ);
  root.add(mirrorL);

  const mirrorR = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.06, 4, 8), bodyMat);
  mirrorR.rotation.z = Math.PI / 2;
  mirrorR.position.set(W * 0.5 + 0.03, mirrorY, mirrorZ);
  root.add(mirrorR);

  // --- Antenna ---
  const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.01, 0.04, 8), bodyMat);
  antenna.position.set(0, roofHeight + 0.02, -L * 0.3);
  root.add(antenna);

  // --- Front Grille (Vertical slats implied) ---
  const grilleW = W * 0.4;
  const grilleH = H * 0.3;
  const grilleZ = L * 0.49;
  const grilleY = bodyBottom + H * 0.35;
  
  const grille = new THREE.Mesh(new THREE.BoxGeometry(grilleW, grilleH, 0.02), chromeMat);
  grille.position.set(0, grilleY, grilleZ);
  root.add(grille);
  
  // Grille slats (dark gaps)
  for(let i=-2; i<=2; i++) {
     const slat = new THREE.Mesh(new THREE.BoxGeometry(0.01, grilleH * 0.8, 0.01), new THREE.MeshStandardMaterial({color:0x000000}));
     slat.position.set(i * 0.04, grilleY, grilleZ + 0.01);
     root.add(slat);
  }

  // --- Exhaust Tips ---
  const exY = bodyBottom + 0.05;
  const exZ = -L * 0.48;
  const exL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16), chromeMat);
  exL.rotation.x = Math.PI / 2;
  exL.position.set(-W * 0.3, exY, exZ - 0.02);
  root.add(exL);
  
  const exR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16), chromeMat);
  exR.rotation.x = Math.PI / 2;
  exR.position.set(W * 0.3, exY, exZ - 0.02);
  root.add(exR);

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