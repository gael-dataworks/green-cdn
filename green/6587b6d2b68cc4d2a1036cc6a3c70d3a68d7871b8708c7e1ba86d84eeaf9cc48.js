export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed galvanized steel
  // Cap metalness at 0.6 to prevent black rendering without env map.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.6,
    roughness: 0.5,
  });

  // --- 1. Base Flange Plate ---
  // Use ExtrudeGeometry with holes for the mounting holes and side slot.
  const plateShape = new THREE.Shape();
  const plateW = 0.55;
  const plateH = 0.55;
  const cornerR = 0.12;

  // Draw outer rounded rectangle contour
  plateShape.moveTo(-plateW / 2 + cornerR, -plateH / 2);
  plateShape.lineTo(plateW / 2 - cornerR, -plateH / 2);
  plateShape.quadraticCurveTo(plateW / 2, -plateH / 2, plateW / 2, -plateH / 2 + cornerR);
  plateShape.lineTo(plateW / 2, plateH / 2 - cornerR);
  plateShape.quadraticCurveTo(plateW / 2, plateH / 2, plateW / 2 - cornerR, plateH / 2);
  plateShape.lineTo(-plateW / 2 + cornerR, plateH / 2);
  plateShape.quadraticCurveTo(-plateW / 2, plateH / 2, -plateW / 2, plateH / 2 - cornerR);
  plateShape.lineTo(-plateW / 2, -plateH / 2 + cornerR);
  plateShape.quadraticCurveTo(-plateW / 2, -plateH / 2, -plateW / 2 + cornerR, -plateH / 2);

  // Add holes (THREE.Path)
  const holeRadius = 0.045;
  const holeOffset = 0.38;
  
  // Top-Right Hole
  const trHole = new THREE.Path();
  trHole.absarc(holeOffset, holeOffset, holeRadius, 0, Math.PI * 2, true);
  plateShape.holes.push(trHole);

  // Bottom-Right Hole
  const brHole = new THREE.Path();
  brHole.absarc(holeOffset, -holeOffset, holeRadius, 0, Math.PI * 2, true);
  plateShape.holes.push(brHole);

  // Bottom-Left Hole
  const blHole = new THREE.Path();
  blHole.absarc(-holeOffset, -holeOffset, holeRadius, 0, Math.PI * 2, true);
  plateShape.holes.push(blHole);

  // Top-Left Hole
  const tlHole = new THREE.Path();
  tlHole.absarc(-holeOffset, holeOffset, holeRadius, 0, Math.PI * 2, true);
  plateShape.holes.push(tlHole);

  // Side Slot (Left side elongated cutout)
  const slotPath = new THREE.Path();
  const slotX = -0.35;
  const slotY = 0;
  const slotW = 0.06;
  const slotH = 0.18;
  // Draw rounded rectangle for slot
  slotPath.moveTo(slotX - slotW / 2, slotY - slotH / 2 + slotW / 2);
  slotPath.lineTo(slotX - slotW / 2, slotY + slotH / 2 - slotW / 2);
  slotPath.quadraticCurveTo(slotX - slotW / 2, slotY + slotH / 2, slotX - slotW / 2 + slotW / 2, slotY + slotH / 2);
  slotPath.lineTo(slotX + slotW / 2 - slotW / 2, slotY + slotH / 2);
  slotPath.quadraticCurveTo(slotX + slotW / 2, slotY + slotH / 2, slotX + slotW / 2, slotY + slotH / 2 - slotW / 2);
  slotPath.lineTo(slotX + slotW / 2, slotY - slotH / 2 + slotW / 2);
  slotPath.quadraticCurveTo(slotX + slotW / 2, slotY - slotH / 2, slotX + slotW / 2 - slotW / 2, slotY - slotH / 2);
  slotPath.lineTo(slotX - slotW / 2 + slotW / 2, slotY - slotH / 2);
  slotPath.quadraticCurveTo(slotX - slotW / 2, slotY - slotH / 2, slotX - slotW / 2, slotY - slotH / 2 + slotW / 2);
  plateShape.holes.push(slotPath);

  // Center Hole (Large)
  const centerHoleRadius = 0.145;
  const centerHolePath = new THREE.Path();
  centerHolePath.absarc(0, 0, centerHoleRadius, 0, Math.PI * 2, true);
  plateShape.holes.push(centerHolePath);

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
  });
  const basePlate = new THREE.Mesh(plateGeom, metalMat);
  // Center the extrusion (ExtrudeGeometry goes +Z by default)
  basePlate.position.z = -0.015 / 2; 
  // Rotate to lie flat in XY plane (facing +Z is default for extrude, but we want it flat in XY? 
  // Wait, standard Three.js: Y is up. Extrude goes along Z. 
  // If I want a flat plate on the "floor" (XZ plane), I need to rotate X by -90.
  // BUT the reference shows the object facing the camera. Let's keep it facing camera (XY plane).
  // So ExtrudeGeometry default (facing +Z) is perfect.
  root.add(basePlate);

  // --- 2. Central Hub (Stamped Ridges) ---
  // Use LatheGeometry to create the concentric ridges smoothly.
  // Profile points (radius, height). Height 0 is the plate surface.
  const hubProfile = [
    new THREE.Vector2(0.145, 0.0),      // Inner edge base
    new THREE.Vector2(0.145, 0.055),    // Inner wall top
    new THREE.Vector2(0.165, 0.045),    // Ridge 1 top
    new THREE.Vector2(0.185, 0.030),    // Valley 1
    new THREE.Vector2(0.215, 0.020),    // Ridge 2 top
    new THREE.Vector2(0.250, 0.005),    // Slope down
    new THREE.Vector2(0.280, 0.0),      // Outer edge base
    new THREE.Vector2(0.280, -0.005),   // Slight under-lip to merge with plate visually
  ];

  const hubGeom = new THREE.LatheGeometry(hubProfile, 32);
  const hub = new THREE.Mesh(hubGeom, metalMat);
  // Lathe spins around Y. The profile is in XY. 
  // We want the hub to sit on the plate (which is in XY plane facing Z).
  // So the hub needs to be rotated 90 deg around X to lie flat?
  // No, Lathe creates a shape around Y axis. 
  // If plate is in XY plane (facing Z), the "up" direction for the hub (relative to plate surface) is Z.
  // So we need to rotate the Lathe result so its Y axis aligns with Plate's Z axis.
  // Rotate X by 90 degrees (PI/2).
  hub.rotation.x = Math.PI / 2;
  root.add(hub);

  // --- 3. Embossed Stamp Detail (Right Side) ---
  // Small raised rectangle simulating the "M6" or logo stamp area.
  const stampGeom = new THREE.BoxGeometry(0.06, 0.025, 0.003);
  const stamp = new THREE.Mesh(stampGeom, metalMat);
  stamp.position.set(0.32, -0.15, 0.005); // On the flange, slightly raised
  root.add(stamp);

  // --- 4. Inner Rim Reinforcement (Optional visual thickener) ---
  // Just to make the hole look machined/stamped cleanly
  const rimGeom = new THREE.TorusGeometry(0.145, 0.008, 8, 32);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2; // Face Z
  rim.position.z = 0.002; // Slightly in front of plate
  root.add(rim);

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