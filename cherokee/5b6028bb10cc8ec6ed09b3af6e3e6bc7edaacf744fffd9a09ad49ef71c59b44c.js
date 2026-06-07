export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Dimensions ---
  const carLength = 2.2;
  const carWidth = 0.95;
  const carHeight = 0.65;
  const wheelRadius = 0.32;
  const wheelBase = 1.35;
  const groundClearance = 0.05;
  const wheelY = groundClearance + wheelRadius;

  // --- Materials ---
  // Black glossy paint: High contrast, low roughness, moderate metalness.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    metalness: 0.6,
    roughness: 0.15,
  });

  // Chrome trim: Bright silver, reflective.
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Dark tinted glass.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    ior: 1.5,
  });

  // Tire rubber.
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Rim silver.
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Red taillight.
  const tailLightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xaa0000,
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.2,
  });

  // Headlight clear/white.
  const headLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.3,
    roughness: 0.2,
    metalness: 0.3,
  });

  // --- Helper: Create Wheel ---
  function createWheel() {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeom = new THREE.TorusGeometry(wheelRadius, 0.12, 16, 32);
    const tire = new THREE.Mesh(tireGeom, tireMat);
    tire.rotation.y = Math.PI / 2; // Face X-axis
    wheelGroup.add(tire);

    // Rim Base
    const rimBaseGeom = new THREE.CylinderGeometry(wheelRadius - 0.12, wheelRadius - 0.12, 0.15, 32);
    const rimBase = new THREE.Mesh(rimBaseGeom, rimMat);
    rimBase.rotation.x = Math.PI / 2;
    wheelGroup.add(rimBase);

    // Multi-spoke design (Turbine style)
    const spokeCount = 10;
    const spokeGeom = new THREE.BoxGeometry(0.04, wheelRadius - 0.15, 0.02);
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeom, rimMat);
      spoke.rotation.z = angle;
      spoke.position.set(Math.cos(angle) * (wheelRadius * 0.4), Math.sin(angle) * (wheelRadius * 0.4), 0.08);
      // Rotate spoke to point outward
      spoke.rotation.z += Math.PI / 2; 
      wheelGroup.add(spoke);
    }

    // Center Cap
    const capGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16);
    const cap = new THREE.Mesh(capGeom, chromeMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.09;
    wheelGroup.add(cap);

    return wheelGroup;
  }

  // --- 1. Main Body Silhouette (Extrude) ---
  // Define the side profile shape
  const bodyShape = new THREE.Shape();
  const h = 0.0; 
  const lw = carLength / 2;
  
  // Start bottom rear
  bodyShape.moveTo(-lw, groundClearance);
  // Rear bumper up
  bodyShape.lineTo(-lw, 0.25);
  // Trunk slope
  bodyShape.lineTo(-lw * 0.6, 0.45);
  // Roof curve (Coupe style)
  bodyShape.bezierCurveTo(-lw * 0.2, 0.65, lw * 0.2, 0.65, lw * 0.4, 0.55);
  // Hood slope
  bodyShape.lineTo(lw, 0.35);
  // Front bumper down
  bodyShape.lineTo(lw, 0.15);
  // Bottom front
  bodyShape.lineTo(lw * 0.8, groundClearance);
  
  // Rear Wheel Arch (cutout)
  bodyShape.lineTo(-lw * 0.3, groundClearance);
  bodyShape.quadraticCurveTo(-lw * 0.45, wheelRadius + 0.05, -lw * 0.6, groundClearance);
  
  // Front Wheel Arch (cutout)
  bodyShape.lineTo(lw * 0.3, groundClearance);
  bodyShape.quadraticCurveTo(lw * 0.45, wheelRadius + 0.05, lw * 0.6, groundClearance);
  
  // Close bottom
  bodyShape.lineTo(-lw, groundClearance);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: carWidth,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12
  });
  
  // Center the extrusion
  bodyGeom.center();
  const mainBody = new THREE.Mesh(bodyGeom, bodyMat);
  // Rotate to face +Z (Extrude is along Z by default, we want car along Z)
  // Wait, ExtrudeGeometry extrudes along Z. The shape is in XY.
  // So the car side is in XY plane. We need to rotate 90 deg around Y to face Z?
  // No, if shape is XY, extrusion is Z. That makes a block facing Z.
  // We want the car to face +Z. The side profile is XZ plane usually?
  // Let's rotate the mesh so the flat side is on the X axis?
  // Standard: Car faces +Z. Side profile is in XZ plane.
  // ExtrudeGeometry creates geometry in XY plane, extruded along Z.
  // So the "face" is XY. We need to rotate -90 deg around X to lay it flat on XZ?
  // Then rotate 90 deg around Y to face Z?
  // Actually, simpler: Define shape in XZ? No, Shape is 2D (x,y).
  // Let's just rotate the resulting mesh.
  // Current: Flat face is XY. Thickness is Z.
  // Desired: Flat face is XZ (side of car). Thickness is Y (width).
  // Rotation: Rotate X by -90 (PI/2). Now face is XZ. Thickness is Y (up).
  // Wait, width is Y? No, width is X in car coords?
  // Car coords: X=Left/Right, Y=Up, Z=Front/Back.
  // So width is along X.
  // ExtrudeGeometry depth is along Z (local).
  // If I rotate X by -90, local Z becomes local Y (Up). That's wrong.
  // I need local Z (depth) to become local X (width).
  // Rotate Y by 90? Local Z -> Local X. Local X -> Local -Z. Local Y -> Local Y.
  // So: Rotate Y by Math.PI/2.
  // Now the "face" (originally XY) is now -ZY (Side-Back?).
  // Let's just construct it logically.
  // Shape is Side Profile (Length vs Height). Length is Z, Height is Y.
  // But Shape takes (x, y). So let's map Length to X in Shape, Height to Y in Shape.
  // Then Extrude along Z (which will be Width).
  // Then Rotate Y by 90 deg so Length (X) becomes Z (Forward).
  
  mainBody.rotation.y = Math.PI / 2;
  root.add(mainBody);

  // --- 2. Cabin / Roof (Glass + Roof Panel) ---
  // Separate piece for the greenhouse to get glass material
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-lw * 0.5, 0.45); // Rear window base
  cabinShape.bezierCurveTo(-lw * 0.2, 0.65, lw * 0.2, 0.65, lw * 0.4, 0.55); // Roof
  cabinShape.lineTo(lw * 0.5, 0.45); // Front window base
  cabinShape.lineTo(lw * 0.4, 0.45); // Windshield bottom
  cabinShape.bezierCurveTo(lw * 0.2, 0.60, -lw * 0.2, 0.60, -lw * 0.4, 0.45); // Glass curve
  cabinShape.lineTo(-lw * 0.5, 0.45);

  const cabinGeom = new THREE.ExtrudeGeometry(cabinShape, {
    depth: carWidth * 0.85, // Slightly narrower than body
    bevelEnabled: false,
    steps: 1,
    curveSegments: 12
  });
  cabinGeom.center();
  const cabin = new THREE.Mesh(cabinGeom, glassMat);
  cabin.rotation.y = Math.PI / 2;
  cabin.position.y = 0.05; // Sit on body
  root.add(cabin);

  // --- 3. Wheels ---
  const frontWheelZ = wheelBase / 2;
  const rearWheelZ = -wheelBase / 2;
  
  const flWheel = createWheel();
  flWheel.position.set(-carWidth/2 - 0.05, wheelY, frontWheelZ);
  root.add(flWheel);

  const frWheel = createWheel();
  frWheel.position.set(carWidth/2 + 0.05, wheelY, frontWheelZ);
  root.add(frWheel);

  const rlWheel = createWheel();
  rlWheel.position.set(-carWidth/2 - 0.05, wheelY, rearWheelZ);
  root.add(rlWheel);

  const rrWheel = createWheel();
  rrWheel.position.set(carWidth/2 + 0.05, wheelY, rearWheelZ);
  root.add(rrWheel);

  // --- 4. Details ---

  // Chrome Side Strip (along the bottom)
  const stripGeom = new THREE.BoxGeometry(carWidth, 0.015, carLength * 0.8);
  const strip = new THREE.Mesh(stripGeom, chromeMat);
  strip.position.set(0, 0.15, 0);
  root.add(strip);

  // Door Handles (Small chrome boxes)
  const handleGeom = new THREE.BoxGeometry(0.02, 0.015, 0.12);
  const handleFront = new THREE.Mesh(handleGeom, chromeMat);
  handleFront.position.set(carWidth/2 + 0.01, 0.35, 0.2);
  root.add(handleFront);
  
  const handleRear = new THREE.Mesh(handleGeom, chromeMat);
  handleRear.position.set(carWidth/2 + 0.01, 0.35, -0.3);
  root.add(handleRear);

  // Side Mirror
  const mirrorGeom = new THREE.BoxGeometry(0.05, 0.08, 0.12);
  const mirror = new THREE.Mesh(mirrorGeom, bodyMat);
  mirror.position.set(carWidth/2 + 0.02, 0.45, 0.6);
  root.add(mirror);

  // Headlights (Front corners)
  const hlGeom = new THREE.BoxGeometry(0.05, 0.08, 0.15);
  const hlLeft = new THREE.Mesh(hlGeom, headLightMat);
  hlLeft.position.set(-carWidth/2 - 0.01, 0.35, carLength/2);
  root.add(hlLeft);
  
  const hlRight = new THREE.Mesh(hlGeom, headLightMat);
  hlRight.position.set(carWidth/2 + 0.01, 0.35, carLength/2);
  root.add(hlRight);

  // Taillights (Rear corners)
  const tlGeom = new THREE.BoxGeometry(0.05, 0.08, 0.15);
  const tlLeft = new THREE.Mesh(tlGeom, tailLightMat);
  tlLeft.position.set(-carWidth/2 - 0.01, 0.35, -carLength/2);
  root.add(tlLeft);

  const tlRight = new THREE.Mesh(tlGeom, tailLightMat);
  tlRight.position.set(carWidth/2 + 0.01, 0.35, -carLength/2);
  root.add(tlRight);

  // Shark Fin Antenna
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.05, 0.1);
  finShape.lineTo(-0.05, 0.1);
  finShape.lineTo(0, 0);
  const finGeom = new THREE.ExtrudeGeometry(finShape, { depth: 0.02, bevelEnabled: false });
  const fin = new THREE.Mesh(finGeom, bodyMat);
  fin.rotation.x = Math.PI / 2;
  fin.position.set(0, 0.65, -0.4);
  root.add(fin);

  // Front Grille (Simplified)
  const grilleGeom = new THREE.BoxGeometry(0.4, 0.15, 0.05);
  const grille = new THREE.Mesh(grilleGeom, chromeMat);
  grille.position.set(0, 0.25, carLength/2 + 0.02);
  root.add(grille);

  // Normalize
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