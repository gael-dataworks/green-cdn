export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass material: Gold-ish color, moderate metalness (capped at 0.6 for no-env rendering),
  // low roughness for polish, and emissive to ensure it reads as bright metal.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0xaa8822,
    emissiveIntensity: 0.25,
  });

  // Dark engraved lines material (for the face texture logic, though we bake it into a map)
  // We will use a DataTexture for the face markings.

  // --- Helper: Procedural Face Texture ---
  function createFaceTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const baseColor = [212, 175, 55, 255]; // Brass color
    
    // Fill base
    for (let i = 0; i < data.length; i += 4) {
      data[i] = baseColor[0];
      data[i + 1] = baseColor[1];
      data[i + 2] = baseColor[2];
      data[i + 3] = 255;
    }

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 10;

    // Helper to draw a pixel
    function setPixel(x, y, r, g, b) {
      if (x < 0 || x >= size || y < 0 || y >= size) return;
      const idx = (Math.floor(y) * size + Math.floor(x)) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }

    // Draw concentric circles
    const radii = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15];
    for (const rFrac of radii) {
      const r = rFrac * maxR;
      for (let a = 0; a < Math.PI * 2; a += 0.01) {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        setPixel(x, y, 20, 20, 20); // Dark engraving
        // Thicken line slightly
        setPixel(x+1, y, 20, 20, 20);
        setPixel(x, y+1, 20, 20, 20);
      }
    }

    // Draw radial lines (Cardinal directions + diagonals)
    const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
    for (const a of angles) {
      for (let r = 0.2 * maxR; r < maxR; r += 1) {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        setPixel(x, y, 20, 20, 20);
        setPixel(x+1, y, 20, 20, 20);
        setPixel(x, y+1, 20, 20, 20);
      }
    }

    // Draw outer tick marks
    for (let i = 0; i < 360; i++) {
      const a = (i * Math.PI) / 180;
      const rInner = (i % 5 === 0) ? maxR - 15 : maxR - 8;
      const rOuter = maxR;
      
      for (let r = rInner; r < rOuter; r++) {
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        setPixel(x, y, 20, 20, 20);
      }
    }

    // Draw some "text" blocks (rectangles) to simulate the numbers/zodiac signs
    // Just simple dark rectangles at specific angles
    function drawTextBlock(angle, radius) {
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      // Draw a small 10x5 rect
      for(let dx=-5; dx<5; dx++) {
        for(let dy=-2; dy<2; dy++) {
           // Rotate the rect slightly to follow tangent? No, keep simple for now
           setPixel(x+dx, y+dy, 20, 20, 20);
        }
      }
    }
    
    // Place some blocks around the rim
    for(let i=0; i<12; i++) {
        const a = (i * Math.PI * 2) / 12;
        drawTextBlock(a, maxR - 25);
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const faceMap = createFaceTexture();
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceMap,
    color: 0xffffff, // White to let texture show true color
    metalness: 0.6,
    roughness: 0.35,
    emissive: 0xaa8822,
    emissiveIntensity: 0.25,
    side: THREE.FrontSide
  });

  // --- Base Plate ---
  // Thick cylinder
  const baseRadius = 0.45;
  const baseHeight = 0.04;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 64);
  const basePlate = new THREE.Mesh(baseGeom, brassMat);
  basePlate.position.y = -baseHeight / 2; // Sit on ground
  root.add(basePlate);

  // Face Plate (Top surface with texture)
  // Slightly smaller radius to sit on top, or same radius. Let's make it a thin disc on top.
  const faceGeom = new THREE.CylinderGeometry(baseRadius * 0.98, baseRadius * 0.98, 0.005, 64);
  const facePlate = new THREE.Mesh(faceGeom, faceMat);
  facePlate.position.y = 0.0025; // Just above base center
  root.add(facePlate);

  // --- Central Hub ---
  const hubRadius = 0.04;
  const hubHeight = 0.025;
  const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius * 0.9, hubHeight, 32);
  const hub = new THREE.Mesh(hubGeom, brassMat);
  hub.position.y = hubHeight / 2 + 0.005;
  root.add(hub);

  // Central Cap/Nut
  const capRadius = 0.015;
  const capHeight = 0.01;
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 16);
  const cap = new THREE.Mesh(capGeom, brassMat);
  cap.position.y = hubHeight + 0.005 + capHeight/2;
  root.add(cap);

  // --- Arms (Alidades) ---
  // We need 3 arms visible in the reference.
  // Arm 1: ~45 degrees (1:30 position), has a sight.
  // Arm 2: 0 degrees (3 o'clock), rounded tip.
  // Arm 3: ~210 degrees (7 o'clock), rounded tip.

  const armLength = baseRadius * 0.85;
  const armWidth = 0.012;
  const armThickness = 0.008;

  function createArm(angleDeg, hasSight) {
    const armGroup = new THREE.Group();
    
    // Main rod
    const rodGeom = new THREE.BoxGeometry(armWidth, armThickness, armLength);
    // Shift geometry so pivot is at one end (center of hub)
    rodGeom.translate(0, 0, armLength / 2);
    
    const rod = new THREE.Mesh(rodGeom, brassMat);
    armGroup.add(rod);

    // Tip decoration
    if (hasSight) {
      // Sight vane at the end
      const vaneGeom = new THREE.BoxGeometry(armWidth * 1.5, armThickness * 3, 0.005);
      const vane = new THREE.Mesh(vaneGeom, brassMat);
      vane.position.set(0, armThickness * 1.5, armLength);
      armGroup.add(vane);
      
      // Small knob on vane
      const knobGeom = new THREE.SphereGeometry(armWidth * 0.8, 8, 8);
      const knob = new THREE.Mesh(knobGeom, brassMat);
      knob.position.set(0, armThickness * 2.5, armLength);
      armGroup.add(knob);
    } else {
      // Rounded tip (Sphere)
      const tipGeom = new THREE.SphereGeometry(armWidth * 0.8, 8, 8);
      const tip = new THREE.Mesh(tipGeom, brassMat);
      tip.position.set(0, 0, armLength);
      armGroup.add(tip);
    }

    // Rotate to angle
    // In Three.js, 0 rotation is +X? No, default box is centered.
    // We translated rod to +Z. So rotation around Y axis.
    // 0 deg = +Z. 
    // Reference: 3 o'clock is +X? 
    // Let's align: 0 deg = +X (3 o'clock).
    // So we need to rotate -90 deg (or 270) to point +Z initially if we want 0 to be 3 o'clock.
    // Actually, let's just use standard polar coords.
    // Angle 0 = +X. Angle 90 = +Z? No, usually Angle 0 = +X, Angle 90 = +Y (in 2D).
    // In XZ plane: x = cos(a), z = sin(a).
    // If a=0, x=1, z=0 (+X).
    // If a=90 (PI/2), x=0, z=1 (+Z).
    // So rotation.y = -angle (since Three.js Y rotation is clockwise from top? No, counter-clockwise).
    // Let's just set rotation.y directly.
    
    const rad = (angleDeg * Math.PI) / 180;
    // To point at angle 'rad' in XZ plane (0 is +X):
    // We need the object (which points +Z by default after translation) to rotate.
    // If object points +Z, and we want it to point +X (0 deg), we rotate -90 deg (-PI/2).
    // If we want it to point +Z (90 deg), we rotate 0.
    // So rotation.y = PI/2 - rad.
    
    armGroup.rotation.y = (Math.PI / 2) - rad;
    
    // Lift slightly above face
    armGroup.position.y = 0.015;
    
    return armGroup;
  }

  // Arm 1: ~45 degrees (NE) - Has Sight
  const arm1 = createArm(45, true);
  root.add(arm1);

  // Arm 2: 0 degrees (E) - Rounded
  const arm2 = createArm(0, false);
  root.add(arm2);

  // Arm 3: ~210 degrees (SW) - Rounded
  const arm3 = createArm(210, false);
  root.add(arm3);

  // --- Shadow/Detail under arms (Optional but adds depth) ---
  // A thin dark disc under the hub to simulate the pivot shadow/gap
  const shadowGeom = new THREE.CircleGeometry(hubRadius * 1.2, 32);
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x332200, roughness: 1.0 });
  const shadow = new THREE.Mesh(shadowGeom, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.014;
  root.add(shadow);

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