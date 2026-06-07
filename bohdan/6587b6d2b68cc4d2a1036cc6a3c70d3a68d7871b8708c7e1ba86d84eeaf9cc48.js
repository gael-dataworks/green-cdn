export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Galvanized/Brushed Steel
  // Per handbook: metalness <= 0.6 for metals without env map. 
  // Use light color and slight emissive to simulate brightness.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0c8,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0xb8c0c8,
    emissiveIntensity: 0.15
  });

  // --- Constants ---
  const plateThickness = 0.04;
  const hubBaseRadius = 0.22;
  const hubTotalHeight = 0.12;
  const innerRadius = 0.10;
  const plateSize = 0.90; // Approx half-width
  const holeRadius = 0.055;
  const cornerOffset = 0.32;

  // --- 1. Base Plate ---
  // Create a Shape for the main plate with holes
  const plateShape = new THREE.Shape();
  
  // Outer profile: Rounded Square
  const w = plateSize; 
  const h = plateSize;
  const radius = 0.12; // Corner radius
  
  // Start bottom-left
  plateShape.moveTo(-w + radius, -h);
  plateShape.lineTo(w - radius, -h);
  plateShape.absarc(w - radius, -h + radius, radius, Math.PI * 1.5, 0, false);
  plateShape.lineTo(w, h - radius);
  plateShape.absarc(w - radius, h - radius, radius, 0, Math.PI * 0.5, false);
  plateShape.lineTo(-w + radius, h);
  plateShape.absarc(-w + radius, h - radius, radius, Math.PI * 0.5, Math.PI, false);
  plateShape.lineTo(-w, -h + radius);
  plateShape.absarc(-w + radius, -h + radius, radius, Math.PI, Math.PI * 1.5, false);

  // Holes in the plate (Paths)
  // 4 Mounting holes
  const mountHolePositions = [
    [cornerOffset, cornerOffset],
    [-cornerOffset, cornerOffset],
    [-cornerOffset, -cornerOffset],
    [cornerOffset, -cornerOffset]
  ];

  mountHolePositions.forEach(([x, z]) => {
    const holePath = new THREE.Path();
    holePath.absarc(x, z, holeRadius, 0, Math.PI * 2, true);
    plateShape.holes.push(holePath);
  });

  // Side Slot (Left side in image, so -X)
  // Elongated in Z
  const slotPath = new THREE.Path();
  const slotX = -0.35;
  const slotW = 0.08;
  const slotH = 0.25;
  slotPath.moveTo(slotX - slotW, -slotH);
  slotPath.lineTo(slotX + slotW, -slotH);
  slotPath.absarc(slotX + slotW, -slotH + slotW, slotW, Math.PI * 1.5, 0, false);
  slotPath.lineTo(slotX + slotW, slotH);
  slotPath.absarc(slotX + slotW, slotH - slotW, slotW, 0, Math.PI * 0.5, false);
  slotPath.lineTo(slotX - slotW, slotH);
  slotPath.absarc(slotX - slotW, slotH - slotW, slotW, Math.PI * 0.5, Math.PI, false);
  slotPath.lineTo(slotX - slotW, -slotH + slotW);
  slotPath.absarc(slotX - slotW, -slotH + slotW, slotW, Math.PI, Math.PI * 1.5, false);
  plateShape.holes.push(slotPath);

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: plateThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1
  });
  // Center the extrusion so bottom is at y=0
  plateGeom.translate(0, 0, 0); 
  
  const basePlate = new THREE.Mesh(plateGeom, metalMat);
  // ExtrudeGeometry centers by default in X/Z but extends 0 to depth in Y.
  // We want it centered at y=0 roughly, or sitting on y=0.
  // Let's sit it on y=0.
  basePlate.position.y = 0;
  root.add(basePlate);

  // --- 2. Central Hub ---
  // Use LatheGeometry to create the hollow cylinder with rings
  const profilePoints = [];
  
  // Inner wall bottom
  profilePoints.push(new THREE.Vector2(innerRadius, 0));
  // Inner wall top
  profilePoints.push(new THREE.Vector2(innerRadius, hubTotalHeight));
  // Top lip outer edge
  profilePoints.push(new THREE.Vector2(innerRadius + 0.015, hubTotalHeight));
  // Top lip side
  profilePoints.push(new THREE.Vector2(innerRadius + 0.015, hubTotalHeight - 0.02));
  // Step out to first ring
  profilePoints.push(new THREE.Vector2(0.14, hubTotalHeight - 0.02));
  // Ring 1 side
  profilePoints.push(new THREE.Vector2(0.14, hubTotalHeight - 0.04));
  // Step out to second ring
  profilePoints.push(new THREE.Vector2(0.18, hubTotalHeight - 0.04));
  // Ring 2 side
  profilePoints.push(new THREE.Vector2(0.18, hubTotalHeight - 0.06));
  // Step out to base
  profilePoints.push(new THREE.Vector2(hubBaseRadius, hubTotalHeight - 0.06));
  // Base side
  profilePoints.push(new THREE.Vector2(hubBaseRadius, 0));
  // Close loop at bottom inner
  profilePoints.push(new THREE.Vector2(innerRadius, 0));

  const hubGeom = new THREE.LatheGeometry(profilePoints, 32);
  const centralHub = new THREE.Mesh(hubGeom, metalMat);
  centralHub.position.y = plateThickness; // Sit on top of plate
  root.add(centralHub);

  // --- 3. Embossed Logo / Markings ---
  // Small raised details on the right side
  const logoGroup = new THREE.Group();
  const logoMat = metalMat; // Same material
  
  // Simplified "INA" or generic block text using small boxes
  function addBox(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), logoMat);
    mesh.position.set(x, y, z);
    logoGroup.add(mesh);
  }

  const logoY = plateThickness + 0.005; // Just above plate
  const logoZ = 0.0;
  const logoX = 0.32;

  // Letter 1 (Vertical bar)
  addBox(0.015, 0.004, 0.03, logoX - 0.025, logoY, logoZ);
  // Letter 2 (Arch)
  addBox(0.015, 0.004, 0.03, logoX, logoY, logoZ - 0.01);
  addBox(0.015, 0.004, 0.03, logoX, logoY, logoZ + 0.01);
  addBox(0.015, 0.004, 0.01, logoX, logoY + 0.015, logoZ);
  // Letter 3 (Vertical bar)
  addBox(0.015, 0.004, 0.03, logoX + 0.025, logoY, logoZ);

  root.add(logoGroup);

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