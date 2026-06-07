export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stainless Steel: Bright, reflective but capped metalness, emissive to simulate env map brightness
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.35
  });

  // Black Plastic (Handles, Knob, Panel)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6
  });

  // Dark Grey Base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.1,
    roughness: 0.5
  });

  // Emissive Green Display
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x00ff00,
    emissiveIntensity: 1.0
  });

  // Small icon colors (red/blue)
  const iconRedMat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0xff3333,
    emissiveIntensity: 0.8
  });

  const iconBlueMat = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0x3366ff,
    emissiveIntensity: 0.8
  });

  // --- Dimensions ---
  const bodyRadius = 0.35;
  const bodyHeight = 0.65;
  const baseHeight = 0.12;
  const lidHeight = 0.20;
  const totalHeight = baseHeight + bodyHeight + lidHeight;

  // --- 1. Main Body (Stainless Steel Cylinder) ---
  // We use a cylinder for the main straight part
  const bodyGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyHeight, 48);
  const body = new THREE.Mesh(bodyGeom, steelMat);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- 2. Base (Dark Rounded Bottom) ---
  // A sphere cut in half or a lathe for the bottom curve
  const baseGeom = new THREE.SphereGeometry(bodyRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = baseHeight / 2; // Sit it so the top matches the cylinder start
  base.scale.y = baseHeight / bodyRadius; // Flatten to match desired height
  root.add(base);

  // --- 3. Lid (Domed Top) ---
  // Lathe profile for the lid dome
  const lidProfile = [
    new THREE.Vector2(bodyRadius + 0.01, 0), // Outer rim slightly wider
    new THREE.Vector2(bodyRadius + 0.01, 0.05), // Rim height
    new THREE.Vector2(bodyRadius * 0.8, 0.10), // Curve in
    new THREE.Vector2(bodyRadius * 0.4, 0.15), // Steeper curve
    new THREE.Vector2(0.05, 0.19), // Top flat area
    new THREE.Vector2(0.05, 0.20), // Top center
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 48);
  const lid = new THREE.Mesh(lidGeom, steelMat);
  lid.position.y = baseHeight + bodyHeight;
  root.add(lid);

  // --- 4. Lid Knob (Black Handle) ---
  const knobBaseGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const knobBase = new THREE.Mesh(knobBaseGeom, blackMat);
  knobBase.position.y = baseHeight + bodyHeight + lidHeight + 0.015;
  root.add(knobBase);

  const knobTopGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
  const knobTop = new THREE.Mesh(knobTopGeom, blackMat);
  knobTop.position.y = baseHeight + bodyHeight + lidHeight + 0.045;
  root.add(knobTop);

  // --- 5. Side Handles (Black Plastic Loops) ---
  // Using Torus for the loop shape, rotated to face outward
  const handleGeom = new THREE.TorusGeometry(0.08, 0.025, 12, 24, Math.PI);
  
  const leftHandle = new THREE.Mesh(handleGeom, blackMat);
  leftHandle.rotation.z = Math.PI / 2; // Stand up
  leftHandle.rotation.y = Math.PI / 2; // Face X axis
  leftHandle.position.set(-bodyRadius - 0.02, baseHeight + bodyHeight * 0.6, 0);
  root.add(leftHandle);

  const rightHandle = new THREE.Mesh(handleGeom, blackMat);
  rightHandle.rotation.z = Math.PI / 2;
  rightHandle.rotation.y = Math.PI / 2;
  rightHandle.position.set(bodyRadius + 0.02, baseHeight + bodyHeight * 0.6, 0);
  root.add(rightHandle);

  // Mounting brackets for handles (small cylinders)
  const bracketGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12);
  const leftBracket = new THREE.Mesh(bracketGeom, blackMat);
  leftBracket.rotation.x = Math.PI / 2;
  leftBracket.position.set(-bodyRadius - 0.01, baseHeight + bodyHeight * 0.6, 0);
  root.add(leftBracket);

  const rightBracket = new THREE.Mesh(bracketGeom, blackMat);
  rightBracket.rotation.x = Math.PI / 2;
  rightBracket.position.set(bodyRadius + 0.01, baseHeight + bodyHeight * 0.6, 0);
  root.add(rightBracket);

  // --- 6. Control Panel (Black Oval on Lid Front) ---
  // Create an oval shape using CircleGeometry scaled
  const panelGeom = new THREE.CircleGeometry(0.08, 32);
  const panel = new THREE.Mesh(panelGeom, blackMat);
  panel.scale.set(2.2, 1, 1); // Make oval
  panel.position.set(0, baseHeight + bodyHeight + 0.12, bodyRadius + 0.015);
  panel.rotation.x = -Math.PI / 2; // Face forward/down slightly? No, lid is curved.
  // Actually, place it on the front face of the lid. 
  // Since the lid is domed, we place it at Z+ radius and rotate to match surface normal roughly.
  // Simplified: Just place on front vertical-ish part of lid rim.
  panel.position.set(0, baseHeight + bodyHeight + 0.08, bodyRadius + 0.02);
  panel.rotation.x = -0.2; // Tilt slightly up to match lid slope
  root.add(panel);

  // --- 7. Display & Icons ( Procedural DataTexture or Geometry ) ---
  // Using small geometry for digits "3:58" and icons
  
  // Digital Time "3:58"
  // We'll make a small group for the display content
  const displayGroup = new THREE.Group();
  displayGroup.position.set(0, 0, 0.01); // Offset from panel surface
  displayGroup.rotation.x = -0.2; // Match panel tilt
  
  // Helper to make a digit segment (simple box)
  function createDigitSegment(x, y, w, h) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.005), displayMat);
    seg.position.set(x, y, 0);
    return seg;
  }

  // Digit '3' (approx 5 segments: top, mid, bot, right-top, right-bot)
  const d3_x = -0.06;
  const d3_y = 0;
  const segW = 0.012; const segH = 0.004; const gap = 0.002;
  
  // Top
  displayGroup.add(createDigitSegment(d3_x, d3_y + 0.015, segW, segH));
  // Mid
  displayGroup.add(createDigitSegment(d3_x, d3_y, segW, segH));
  // Bot
  displayGroup.add(createDigitSegment(d3_x, d3_y - 0.015, segW, segH));
  // Right Top
  displayGroup.add(createDigitSegment(d3_x + 0.015, d3_y + 0.015, segH, segW));
  // Right Bot
  displayGroup.add(createDigitSegment(d3_x + 0.015, d3_y - 0.015, segH, segW));

  // Colon ':'
  displayGroup.add(createDigitSegment(0, 0.010, segH, segH));
  displayGroup.add(createDigitSegment(0, -0.010, segH, segH));

  // Digit '5' (top, left-top, mid, right-bot, bot)
  const d5_x = 0.06;
  // Top
  displayGroup.add(createDigitSegment(d5_x, d3_y + 0.015, segW, segH));
  // Left Top
  displayGroup.add(createDigitSegment(d5_x - 0.015, d3_y + 0.015, segH, segW));
  // Mid
  displayGroup.add(createDigitSegment(d5_x, d3_y, segW, segH));
  // Right Bot
  displayGroup.add(createDigitSegment(d5_x + 0.015, d3_y - 0.015, segH, segW));
  // Bot
  displayGroup.add(createDigitSegment(d5_x, d3_y - 0.015, segW, segH));

  panel.add(displayGroup);

  // Icons (Left: Red, Right: Blue)
  // Left Icon (Red circle)
  const iconLeft = new THREE.Mesh(new THREE.CircleGeometry(0.015, 16), iconRedMat);
  iconLeft.position.set(-0.12, 0, 0.01);
  iconLeft.rotation.x = -0.2;
  panel.add(iconLeft);

  // Right Icon (Blue circle)
  const iconRight = new THREE.Mesh(new THREE.CircleGeometry(0.015, 16), iconBlueMat);
  iconRight.position.set(0.12, 0, 0.01);
  iconRight.rotation.x = -0.2;
  panel.add(iconRight);

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