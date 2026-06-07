export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass: Polished metal. Cap metalness at 0.6. Use emissive to brighten.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.25,
  });

  // Darker brass/oxidized for the center hub
  const darkBrassMat = new THREE.MeshStandardMaterial({
    color: 0x8a6e2f,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0x8a6e2f,
    emissiveIntensity: 0.1,
  });

  // --- Procedural Texture for Dial Face ---
  // Generates the engraved lines and tick marks.
  function createDialTexture() {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    const centerX = size / 2;
    const centerY = size / 2;
    const maxR = size / 2 - 10;

    // Fill background with brass color
    const r = 212, g = 175, b = 55;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }

    // Helper to draw a black pixel
    function setPixel(x, y) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const idx = (y * size + x) * 4;
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }

    // Helper to draw a line (Bresenham-like simple approach for radial)
    function drawLine(x0, y0, x1, y1) {
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      while (true) {
        setPixel(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }

    // Draw Concentric Circles
    const radii = [0.2, 0.35, 0.5, 0.65, 0.8]; // relative to maxR
    for (const ratio of radii) {
      const rad = ratio * maxR;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
        const x = Math.floor(centerX + Math.cos(angle) * rad);
        const y = Math.floor(centerY + Math.sin(angle) * rad);
        setPixel(x, y);
      }
    }

    // Draw Radial Lines (Crosshairs + diagonals)
    const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
    for (const angle of angles) {
      const x1 = Math.floor(centerX + Math.cos(angle) * (maxR * 0.2));
      const y1 = Math.floor(centerY + Math.sin(angle) * (maxR * 0.2));
      const x2 = Math.floor(centerX + Math.cos(angle) * (maxR * 0.95));
      const y2 = Math.floor(centerY + Math.sin(angle) * (maxR * 0.95));
      drawLine(x1, y1, x2, y2);
    }

    // Draw Outer Tick Marks
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const innerR = maxR * 0.9;
      const outerR = maxR * 0.98;
      const x1 = Math.floor(centerX + Math.cos(angle) * innerR);
      const y1 = Math.floor(centerY + Math.sin(angle) * innerR);
      const x2 = Math.floor(centerX + Math.cos(angle) * outerR);
      const y2 = Math.floor(centerY + Math.sin(angle) * outerR);
      drawLine(x1, y1, x2, y2);
    }

    // Simulate Text/Numbers with small blocks near the outer edge
    // Just abstract blocks to represent the presence of markings without font engine
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const textR = maxR * 0.82;
      const tx = centerX + Math.cos(angle) * textR;
      const ty = centerY + Math.sin(angle) * textR;
      // Draw a small 4x4 block
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          setPixel(Math.floor(tx + dx), Math.floor(ty + dy));
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const dialTexture = createDialTexture();
  
  // Face Material with texture
  const faceMat = brassMat.clone();
  faceMat.map = dialTexture;
  faceMat.roughness = 0.4; // Slightly rougher to make engraving visible

  // --- Geometry Construction ---

  // 1. Base Plate (Main Body)
  const baseRadius = 0.45;
  const baseThickness = 0.04;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseThickness, 64);
  const basePlate = new THREE.Mesh(baseGeom, faceMat);
  basePlate.position.y = baseThickness / 2;
  root.add(basePlate);

  // 2. Outer Rim (Raised edge)
  const rimHeight = 0.06;
  const rimGeom = new THREE.TorusGeometry(baseRadius - 0.02, 0.02, 16, 64);
  const rim = new THREE.Mesh(rimGeom, brassMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = baseThickness + rimHeight / 2;
  root.add(rim);

  // 3. Center Hub
  const hubRadius = 0.04;
  const hubHeight = 0.03;
  const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius * 0.8, hubHeight, 32);
  const hub = new THREE.Mesh(hubGeom, darkBrassMat);
  hub.position.y = baseThickness + hubHeight / 2;
  root.add(hub);

  // Small sphere on top of hub
  const hubCapGeom = new THREE.SphereGeometry(hubRadius * 0.6, 16, 16);
  const hubCap = new THREE.Mesh(hubCapGeom, darkBrassMat);
  hubCap.position.y = baseThickness + hubHeight + hubRadius * 0.5;
  root.add(hubCap);

  // 4. Gnomons / Arms
  const armLength = 0.35;
  const armThickness = 0.012;
  const armGeom = new THREE.CylinderGeometry(armThickness, armThickness, armLength, 16);
  
  // Helper to create an arm
  function createArm(rotationY, x, z, hasTip = false) {
    const armGroup = new THREE.Group();
    
    const arm = new THREE.Mesh(armGeom, brassMat);
    // Cylinder is Y-up by default, we want it flat on XZ plane
    arm.rotation.z = Math.PI / 2; 
    // Offset so pivot is at center (0,0) and arm extends outward
    arm.position.x = armLength / 2; 
    armGroup.add(arm);

    if (hasTip) {
      // Perpendicular tip at the end
      const tipWidth = 0.04;
      const tipGeom = new THREE.BoxGeometry(tipWidth, armThickness * 2, armThickness * 4);
      const tip = new THREE.Mesh(tipGeom, brassMat);
      tip.position.x = armLength;
      armGroup.add(tip);
    }

    armGroup.rotation.y = rotationY;
    armGroup.position.set(x, baseThickness + armThickness, z);
    root.add(armGroup);
  }

  // Arm 1: Top Right (~1:30 position = 45 degrees + offset? Image shows ~60 deg from vertical)
  // Let's align to clock positions roughly. 
  // Image: One arm at ~1:30 (45 deg), One at 3:00 (0 deg), One at ~7:30 (225 deg).
  // Note: Three.js 0 rotation is +X axis (3 o'clock).
  
  // Arm at 3 o'clock (0 rad)
  createArm(0, 0, 0, false);

  // Arm at ~1:30 (approx 1.0 rad / 57 deg? No, 1:30 is 45 deg = PI/4)
  // Image shows it pointing somewhat between 1 and 2. Let's use PI/4 (45 deg)
  createArm(Math.PI / 4, 0, 0, true); // Has the perpendicular tip

  // Arm at ~7:30 (approx 225 deg = 5*PI/4)
  createArm(5 * Math.PI / 4, 0, 0, false);

  // 5. Shadow Caster / Gnomon Base details
  // There appears to be a small triangular or wedge shape near the center hub 
  // where the arms connect, acting as a shadow caster base.
  const wedgeGeom = new THREE.ConeGeometry(0.05, 0.02, 4);
  const wedge = new THREE.Mesh(wedgeGeom, darkBrassMat);
  wedge.rotation.x = Math.PI / 2; // Lay flat
  wedge.rotation.z = Math.PI / 4; // Align with one of the arms
  wedge.position.y = baseThickness + 0.01;
  root.add(wedge);

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