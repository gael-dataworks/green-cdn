export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark gunmetal / blackened steel for the blade and guard
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.5,
    roughness: 0.6,
  });

  // Slightly darker/rougher for the grip core
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.8,
  });

  // Even darker for the grip rings (leather/wire wrap simulation)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.2,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const bladeLength = 1.4;
  const bladeWidthBase = 0.24;
  const bladeThickness = 0.04;
  const guardWidth = 0.45;
  const guardHeight = 0.06;
  const guardDepth = 0.08;
  const gripLength = 0.55;
  const gripRadius = 0.06;
  const pommelRadius = 0.09;

  // --- 1. Blade ---
  // Create the 2D shape for the blade profile (in XY plane, extruded along Z)
  const bladeShape = new THREE.Shape();
  // Start at tip
  bladeShape.moveTo(0, 0);
  // Edge to base
  bladeShape.lineTo(bladeWidthBase / 2, bladeLength);
  // Base flat part (tang area hidden by guard)
  bladeShape.lineTo(bladeWidthBase / 2, bladeLength + 0.05);
  // Inner tang
  bladeShape.lineTo(0.04, bladeLength + 0.05);
  bladeShape.lineTo(0.04, bladeLength);
  // Symmetric return
  bladeShape.lineTo(0, 0);
  bladeShape.lineTo(-0.04, bladeLength);
  bladeShape.lineTo(-0.04, bladeLength + 0.05);
  bladeShape.lineTo(-bladeWidthBase / 2, bladeLength + 0.05);
  bladeShape.lineTo(-bladeWidthBase / 2, bladeLength);
  bladeShape.lineTo(0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: bladeThickness,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 4,
  });
  // Center the geometry so pivot is at the guard
  bladeGeom.translate(0, -bladeLength / 2, -bladeThickness / 2);
  
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  // Position blade so its base is at origin (where guard will be)
  blade.position.z = bladeLength / 2; 
  root.add(blade);

  // --- 1b. Blade Fuller (Central Groove) ---
  // A thin strip running down the center to simulate the groove
  const fullerGeom = new THREE.BoxGeometry(0.04, bladeLength * 0.7, 0.005);
  const fuller = new THREE.Mesh(fullerGeom, bladeMat);
  fuller.position.set(0, bladeLength / 2 - 0.1, bladeThickness / 2 + 0.002);
  root.add(fuller);

  // --- 1c. Blade Decorations (Etchings near guard) ---
  // Simple geometric lines on the blade surface
  const decorMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.8 });
  const decorGroup = new THREE.Group();
  
  // Diamond pattern near base
  const diamondW = 0.06;
  const diamondH = 0.08;
  const diamondY = bladeLength - 0.35;
  
  const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.005, diamondH, 0.005), decorMat);
  d1.position.set(-diamondW/2, diamondY, bladeThickness/2 + 0.002);
  d1.rotation.z = Math.PI / 4;
  decorGroup.add(d1);

  const d2 = new THREE.Mesh(new THREE.BoxGeometry(0.005, diamondH, 0.005), decorMat);
  d2.position.set(diamondW/2, diamondY, bladeThickness/2 + 0.002);
  d2.rotation.z = -Math.PI / 4;
  decorGroup.add(d2);

  const d3 = new THREE.Mesh(new THREE.BoxGeometry(diamondW, 0.005, 0.005), decorMat);
  d3.position.set(0, diamondY - diamondH/2 - 0.02, bladeThickness/2 + 0.002);
  decorGroup.add(d3);

  root.add(decorGroup);

  // --- 2. Guard (Crossguard) ---
  // Angled rectangular bar
  const guardShape = new THREE.Shape();
  const gw = guardWidth / 2;
  const gh = guardHeight / 2;
  // Angled ends
  guardShape.moveTo(-gw, -gh);
  guardShape.lineTo(-gw + 0.05, gh); // Angled up left
  guardShape.lineTo(gw - 0.05, gh);  // Angled up right
  guardShape.lineTo(gw, -gh);
  guardShape.lineTo(-gw, -gh);
  
  // Hole for tang
  const holePath = new THREE.Path();
  holePath.moveTo(-0.05, -0.04);
  holePath.lineTo(0.05, -0.04);
  holePath.lineTo(0.05, 0.04);
  holePath.lineTo(-0.05, 0.04);
  guardShape.holes.push(holePath);

  const guardGeom = new THREE.ExtrudeGeometry(guardShape, {
    depth: guardDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  // Center guard
  guardGeom.translate(0, 0, -guardDepth / 2);

  const guard = new THREE.Mesh(guardGeom, bladeMat);
  // Position guard at origin (base of blade)
  // The blade base is at z=0 relative to blade mesh, but we moved blade mesh.
  // Let's align everything to root origin at the center of the guard.
  guard.position.set(0, 0, 0);
  root.add(guard);

  // Guard Decorations (Diamonds on the face)
  const gDec1 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 0.004), decorMat);
  gDec1.position.set(-0.1, 0, -guardDepth/2 - 0.002);
  gDec1.rotation.z = Math.PI / 4;
  root.add(gDec1);

  const gDec2 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.03, 0.004), decorMat);
  gDec2.position.set(0.1, 0, -guardDepth/2 - 0.002);
  gDec2.rotation.z = -Math.PI / 4;
  root.add(gDec2);

  // --- 3. Grip (Handle) ---
  // Core cylinder
  const gripGeom = new THREE.CylinderGeometry(gripRadius, gripRadius * 0.9, gripLength, 12);
  const grip = new THREE.Mesh(gripGeom, gripMat);
  // Position grip behind the guard
  grip.position.set(0, 0, -gripLength / 2 - guardDepth / 2);
  root.add(grip);

  // Grip Rings (Segments)
  const ringCount = 5;
  const ringSpacing = gripLength / (ringCount + 1);
  const ringGeom = new THREE.TorusGeometry(gripRadius + 0.002, 0.008, 8, 16);
  
  for (let i = 0; i < ringCount; i++) {
    const ring = new THREE.Mesh(ringGeom, ringMat);
    // Torus is in XY plane, we need it around Z axis (grip axis)
    // Actually grip is along Z. Torus default is XY. Rotate X 90 deg to be YZ (around X)?
    // We want rings around the Z cylinder. So the ring plane should be perpendicular to Z.
    // Default Torus is in XY (normal Z). Perfect.
    ring.position.set(0, 0, -gripLength / 2 - guardDepth / 2 + (i + 1) * ringSpacing);
    root.add(ring);
  }

  // --- 4. Pommel ---
  // Bulbous end cap
  // Using a sphere slightly squashed
  const pommelGeom = new THREE.SphereGeometry(pommelRadius, 16, 16);
  const pommel = new THREE.Mesh(pommelGeom, bladeMat);
  pommel.position.set(0, 0, -gripLength - guardDepth / 2);
  // Scale to make it slightly oblate
  pommel.scale.set(1, 1, 0.8);
  root.add(pommel);

  // Pommel Symbol (Simple raised star/cross shape on the end cap)
  // Since the pommel is scaled, we need to be careful with positioning.
  // The pommel face is at z = -gripLength - guardDepth/2 - pommelRadius*0.8
  const symbolZ = -gripLength - guardDepth / 2 - pommelRadius * 0.8 - 0.005;
  
  const symGeom = new THREE.TorusKnotGeometry(0.035, 0.008, 64, 8, 2, 3);
  const symbol = new THREE.Mesh(symGeom, bladeMat);
  symbol.position.set(0, 0, symbolZ);
  symbol.rotation.y = Math.PI / 2; // Face forward along Z
  root.add(symbol);

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