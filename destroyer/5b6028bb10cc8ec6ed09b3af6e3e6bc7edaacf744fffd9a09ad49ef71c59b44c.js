export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const L = 2.2;       // Length
  const W = 0.92;      // Width
  const H = 0.65;      // Height
  const WB = 1.3;      // Wheelbase
  const WR = 0.33;     // Wheel Radius
  const WT = 0.12;     // Wheel Thickness
  const groundY = -0.15; // Ground level offset

  // --- Materials ---
  // Black glossy paint: High metalness for reflection, low roughness for gloss.
  // Cap metalness at 0.6 per rules.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.6,
    roughness: 0.15,
  });

  // Glass: Tinted, transparent.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.8,
    ior: 1.5,
  });

  // Chrome trim: Silver, shiny.
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.1,
  });

  // Tires: Matte black rubber.
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Rims: Polished silver.
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Headlights: Clear/White with emissive core.
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const headlightEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
  });

  // Taillights: Red.
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xaa0000,
    metalness: 0.3,
    roughness: 0.3,
    emissive: 0xaa0000,
    emissiveIntensity: 0.4,
  });

  // --- Helpers ---
  function addBox(w, h, d, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  function addCylinder(rTop, rBot, h, mat, x, y, z, rx, ry, rz) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 32), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    if (ry) mesh.rotation.y = ry;
    if (rz) mesh.rotation.z = rz;
    root.add(mesh);
    return mesh;
  }

  // --- Body Construction ---
  
  // 1. Main Lower Body (Tub)
  // A long box with rounded feel (approximated by segments or just clean box)
  const lowerH = 0.25;
  const lowerY = groundY + WR + lowerH / 2;
  const bodyLower = addBox(W + 0.05, lowerH, L, bodyMat, 0, lowerY, 0);

  // 2. Cabin / Upper Body
  // Tapered towards the rear for the coupe look
  const cabinH = 0.35;
  const cabinL = 1.1;
  const cabinW = W - 0.1;
  const cabinZ = 0.1; // Shifted slightly rearward relative to center
  const cabinY = lowerY + lowerH / 2 + cabinH / 2;
  
  // Use a box for the main cabin volume
  const bodyUpper = addBox(cabinW, cabinH, cabinL, bodyMat, 0, cabinY, cabinZ);

  // 3. Hood (Front Slope)
  const hoodL = 0.5;
  const hoodH = 0.05;
  const hoodZ = L/2 - hoodL/2;
  const hoodY = lowerY + lowerH/2 + 0.02;
  const hood = addBox(W - 0.1, hoodH, hoodL, bodyMat, 0, hoodY, hoodZ);
  // Slight slope
  hood.rotation.x = -0.05; 

  // 4. Trunk (Rear Slope)
  const trunkL = 0.4;
  const trunkH = 0.05;
  const trunkZ = -L/2 + trunkL/2 + 0.1;
  const trunkY = lowerY + lowerH/2 + 0.02;
  const trunk = addBox(W - 0.1, trunkH, trunkL, bodyMat, 0, trunkY, trunkZ);
  trunk.rotation.x = 0.05;

  // 5. Fenders (Wheel Arches)
  // Slight bulges over wheels
  const fenderW = 0.15;
  const fenderH = 0.1;
  const fenderR = WR + 0.05;
  const fenderY = groundY + fenderR;
  
  // Front Fenders
  addBox(fenderW, fenderH, 0.4, bodyMat, -W/2 - 0.02, fenderY, WB/2);
  addBox(fenderW, fenderH, 0.4, bodyMat, W/2 + 0.02, fenderY, WB/2);
  
  // Rear Fenders
  addBox(fenderW, fenderH, 0.4, bodyMat, -W/2 - 0.02, fenderY, -WB/2);
  addBox(fenderW, fenderH, 0.4, bodyMat, W/2 + 0.02, fenderY, -WB/2);

  // 6. Windows (Side Glass)
  // Simplified as planes on the side of the cabin
  const winH = cabinH * 0.7;
  const winY = cabinY;
  const winZ = cabinZ;
  const winL = cabinL * 0.9;
  
  // Left Window
  const winL_Mesh = addBox(0.02, winH, winL, glassMat, -cabinW/2 - 0.01, winY, winZ);
  // Right Window
  const winR_Mesh = addBox(0.02, winH, winL, glassMat, cabinW/2 + 0.01, winY, winZ);

  // 7. Window Trim (Chrome Surround)
  const trimThick = 0.01;
  const trimH = winH + 0.04;
  const trimL = winL + 0.04;
  addBox(trimThick, trimH, trimL, chromeMat, -cabinW/2 - 0.02, winY, winZ);
  addBox(trimThick, trimH, trimL, chromeMat, cabinW/2 + 0.02, winY, winZ);
  // Top trim connecting them
  addBox(W, trimThick, trimL, chromeMat, 0, winY + trimH/2, winZ);

  // 8. Chrome Side Strip (Bottom of doors)
  const stripL = 0.8;
  const stripH = 0.02;
  const stripY = lowerY + lowerH/2 - 0.05;
  addBox(0.02, stripH, stripL, chromeMat, -W/2 - 0.01, stripY, 0);
  addBox(0.02, stripH, stripL, chromeMat, W/2 + 0.01, stripY, 0);

  // 9. Door Handles
  const handleW = 0.02;
  const handleH = 0.03;
  const handleL = 0.1;
  const handleY = stripY + 0.06;
  const handleZ_F = 0.2;
  const handleZ_R = -0.2;
  
  addBox(handleW, handleH, handleL, chromeMat, -W/2 - 0.015, handleY, handleZ_F);
  addBox(handleW, handleH, handleL, chromeMat, W/2 + 0.015, handleY, handleZ_F);
  addBox(handleW, handleH, handleL, chromeMat, -W/2 - 0.015, handleY, handleZ_R);
  addBox(handleW, handleH, handleL, chromeMat, W/2 + 0.015, handleY, handleZ_R);

  // 10. Side Mirrors
  const mirrorW = 0.04;
  const mirrorH = 0.06;
  const mirrorL = 0.1;
  const mirrorY = winY;
  const mirrorZ = 0.3;
  const mirrorX_Off = W/2 + 0.1;
  
  // Left Mirror
  addBox(mirrorW, mirrorH, mirrorL, bodyMat, -mirrorX_Off, mirrorY, mirrorZ);
  // Right Mirror
  addBox(mirrorW, mirrorH, mirrorL, bodyMat, mirrorX_Off, mirrorY, mirrorZ);

  // 11. Shark Fin Antenna
  const antH = 0.05;
  const antL = 0.1;
  const antY = cabinY + cabinH/2;
  const antZ = -0.2;
  const antGeom = new THREE.ConeGeometry(0.02, antH, 4);
  const ant = new THREE.Mesh(antGeom, bodyMat);
  ant.position.set(0, antY, antZ);
  ant.rotation.x = Math.PI / 4; // Slope back
  root.add(ant);

  // 12. Lights
  // Headlights (Front)
  const hlW = 0.15;
  const hlH = 0.08;
  const hlD = 0.05;
  const hlY = lowerY + lowerH/2;
  const hlZ = L/2 - 0.05;
  
  addBox(hlW, hlH, hlD, headlightMat, -W/2 + 0.1, hlY, hlZ);
  addBox(hlW, hlH, hlD, headlightMat, W/2 - 0.1, hlY, hlZ);
  
  // Grille (Front)
  const grilleW = 0.4;
  const grilleH = 0.1;
  const grilleD = 0.02;
  const grilleY = lowerY;
  const grilleZ = L/2 + 0.01;
  addBox(grilleW, grilleH, grilleD, chromeMat, 0, grilleY, grilleZ);

  // Taillights (Rear)
  const tlW = 0.2;
  const tlH = 0.08;
  const tlD = 0.05;
  const tlY = lowerY + lowerH/2;
  const tlZ = -L/2 + 0.05;
  
  addBox(tlW, tlH, tlD, taillightMat, -W/2 + 0.1, tlY, tlZ);
  addBox(tlW, tlH, tlD, taillightMat, W/2 - 0.1, tlY, tlZ);

  // 13. Side Vents (Gills on front fender)
  const ventW = 0.08;
  const ventH = 0.03;
  const ventD = 0.01;
  const ventY = lowerY + lowerH/2;
  const ventZ = WB/2 + 0.2;
  addBox(ventW, ventH, ventD, chromeMat, -W/2 - 0.01, ventY, ventZ);
  addBox(ventW, ventH, ventD, chromeMat, W/2 + 0.01, ventY, ventZ);


  // --- Wheels ---
  function createWheel(x, z) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, groundY + WR, z);

    // Tire
    const tireGeom = new THREE.TorusGeometry(WR, WT, 16, 32);
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.y = Math.PI / 2; // Stand up
    wheelGroup.add(tire);

    // Rim (Hub)
    const hubR = WR * 0.6;
    const hubGeom = new THREE.CylinderGeometry(hubR, hubR, WT * 2 + 0.01, 32);
    const hub = new THREE.Mesh(hubGeom, rimMat);
    hub.rotation.x = Math.PI / 2; // Face out
    wheelGroup.add(hub);

    // Spokes (Procedural Multi-spoke)
    const spokeCount = 10;
    const spokeW = 0.02;
    const spokeL = hubR;
    const spokeH = 0.01;
    
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(spokeW, spokeL, spokeH), rimMat);
      spoke.position.set(Math.cos(angle) * (spokeL/2), Math.sin(angle) * (spokeL/2), 0);
      spoke.rotation.z = -angle;
      // Rotate the whole spoke assembly to face camera (X-axis for side wheels)
      // Actually, since the wheel group is at x,z and we want spokes on the face:
      // The hub is rotated X=PI/2. So the face is in YZ plane relative to wheelGroup?
      // No, Cylinder default is Y-up. Rotation X=PI/2 makes it face Z.
      // Wait, wheel faces X axis (side of car).
      // So hub needs rotation Z = PI/2.
      hub.rotation.z = Math.PI / 2;
      spoke.rotation.z = -angle; // Relative to hub face
      wheelGroup.add(spoke);
    }
    
    // Correct Hub Orientation for Side Wheels
    // Car faces +Z. Side is X. Wheels need to face X.
    // Default Cylinder is Y-up. To face X, rotate Z by PI/2.
    hub.rotation.set(0, 0, Math.PI / 2);
    // Spokes are children of wheelGroup. They need to align with the hub face.
    // If hub is rotated Z=PI/2, its face is in YZ plane.
    // Spokes defined in XY plane need to be rotated to match.
    // Let's simplify: Put spokes in a sub-group rotated to match hub.
    
    // Clear and redo rim logic for clarity
    wheelGroup.remove(hub);
    for(let i=wheelGroup.children.length-1; i>=0; i--) {
        if(wheelGroup.children[i] !== tire) wheelGroup.remove(wheelGroup.children[i]);
    }

    const rimGroup = new THREE.Group();
    rimGroup.rotation.z = Math.PI / 2; // Face X axis
    
    const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(hubR*0.3, hubR*0.3, 0.02, 16), chromeMat);
    centerCap.rotation.x = Math.PI / 2; // Flatten
    rimGroup.add(centerCap);

    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(spokeW, spokeL, spokeH), rimMat);
      spoke.position.set(0, spokeL/2, 0); // Extend from center
      spoke.rotation.z = -angle;
      rimGroup.add(spoke);
    }
    
    wheelGroup.add(rimGroup);

    root.add(wheelGroup);
  }

  // Positions
  const frontZ = WB / 2;
  const rearZ = -WB / 2;
  const leftX = -W / 2 - 0.05;
  const rightX = W / 2 + 0.05;

  createWheel(leftX, frontZ);
  createWheel(rightX, frontZ);
  createWheel(leftX, rearZ);
  createWheel(rightX, rearZ);

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