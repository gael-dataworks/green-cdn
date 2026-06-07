export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass: Gold-ish color, moderate metalness (capped at 0.6 for no-env safety), low roughness.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Darker brass/oxidized metal for the engraved lines texture background if needed,
  // but we will bake the lines into the texture map on the brass material.
  // Actually, for the texture, we need a map.
  
  // --- Procedural Dial Texture ---
  // Generates the concentric circles, radial lines, and tick marks.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const cx = texSize / 2;
  const cy = texSize / 2;
  const maxR = texSize / 2 - 10;

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const idx = (y * texSize + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Base brass color (light gold)
      let r = 212, g = 175, b = 55; 

      // Draw concentric circles (engraved lines)
      // We draw dark lines at specific radii
      const radii = [maxR * 0.9, maxR * 0.75, maxR * 0.6, maxR * 0.45, maxR * 0.3];
      let isLine = false;
      for (const rad of radii) {
        if (Math.abs(dist - rad) < 2.0) isLine = true;
      }
      // Outer rim ticks area
      if (dist > maxR * 0.92 && dist < maxR) {
         // Draw radial ticks
         // Normalize angle to 0-2PI
         let a = angle;
         if (a < 0) a += Math.PI * 2;
         // 360 degrees / 10 degrees per major tick = 36 ticks
         // Check if close to a multiple of 10 degrees (in radians)
         const tickStep = (Math.PI * 2) / 36;
         const remainder = a % tickStep;
         if (remainder < 0.05 || remainder > tickStep - 0.05) {
             isLine = true;
         }
      }

      // Crosshairs
      if (Math.abs(dx) < 2.0 || Math.abs(dy) < 2.0) {
          if (dist < maxR * 0.9) isLine = true;
      }

      if (isLine) {
        r = 40; g = 30; b = 20; // Dark oxidized metal color for lines
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const dialTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  dialTexture.colorSpace = THREE.SRGBColorSpace;
  dialTexture.needsUpdate = true;
  dialTexture.wrapS = THREE.ClampToEdgeWrapping;
  dialTexture.wrapT = THREE.ClampToEdgeWrapping;

  // Apply texture to brass material
  brassMat.map = dialTexture;
  brassMat.roughness = 0.4; // Slightly higher roughness for the face to read better

  // --- Geometry Construction ---

  // 1. Main Base Disk
  const baseRadius = 0.45;
  const baseThickness = 0.04;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, baseThickness, 64);
  const base = new THREE.Mesh(baseGeom, brassMat);
  base.position.y = -baseThickness / 2;
  root.add(base);

  // 2. Raised Rim
  const rimHeight = 0.06;
  const rimGeom = new THREE.TorusGeometry(baseRadius - 0.015, 0.015, 16, 64);
  const rim = new THREE.Mesh(rimGeom, brassMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = baseThickness / 2 + rimHeight / 2;
  root.add(rim);

  // 3. Inner Face Plate (slightly inset)
  // This sits inside the rim.
  const faceRadius = baseRadius - 0.035;
  const faceGeom = new THREE.CylinderGeometry(faceRadius, faceRadius, 0.01, 64);
  const facePlate = new THREE.Mesh(faceGeom, brassMat);
  facePlate.position.y = baseThickness / 2 + 0.005;
  root.add(facePlate);

  // 4. Central Hub/Pivot
  const hubRadius = 0.03;
  const hubHeight = 0.025;
  const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius, hubHeight, 32);
  const hub = new THREE.Mesh(hubGeom, brassMat);
  hub.position.y = baseThickness / 2 + hubHeight / 2 + 0.005;
  root.add(hub);

  // 5. Pointers/Arms
  // We need a few different arm types based on the image.
  
  // Helper to create an arm
  function createArm(length, width, hasTab, angleDeg) {
    const armGroup = new THREE.Group();
    
    // Shaft
    const shaftGeom = new THREE.CylinderGeometry(width / 2, width / 2, length, 16);
    // Cylinder is Y-up, we want it to lie flat on XZ plane, pointing out from center
    // Actually, let's model it along X axis and rotate the group.
    shaftGeom.rotateZ(Math.PI / 2); 
    // Shift so one end is at origin
    shaftGeom.translate(length / 2, 0, 0);
    
    const shaft = new THREE.Mesh(shaftGeom, brassMat);
    armGroup.add(shaft);

    if (hasTab) {
      // Rectangular tab at the end
      const tabW = width * 1.5;
      const tabL = width * 2;
      const tabH = 0.01;
      const tabGeom = new THREE.BoxGeometry(tabL, tabH, tabW);
      const tab = new THREE.Mesh(tabGeom, brassMat);
      tab.position.set(length, 0, 0);
      armGroup.add(tab);
    } else {
      // Rounded tip
      const tipGeom = new THREE.SphereGeometry(width / 2, 16, 16);
      const tip = new THREE.Mesh(tipGeom, brassMat);
      tip.position.set(length, 0, 0);
      armGroup.add(tip);
    }

    armGroup.rotation.z = -angleDeg * (Math.PI / 180); // Rotate around Z to point in direction
    // Since we are in a group that is flat on XZ, rotation around Y is the compass direction.
    // Wait, my shaft is along X. Rotating around Y changes the compass direction.
    armGroup.rotation.y = angleDeg * (Math.PI / 180);
    
    // Lift slightly above face
    armGroup.position.y = baseThickness / 2 + 0.015;
    
    return armGroup;
  }

  // Arm 1: Long with tab (approx 1 o'clock = 60 degrees)
  // In standard math 0 is X+, 90 is Y+. In clock 12 is -Z (or +Y in 2D screen).
  // Let's just use visual angles.
  // 3 o'clock = 0 deg. 12 o'clock = 90 deg.
  // Image: Tab arm is at ~1 o'clock. That's roughly 60 degrees from 3 o'clock counter-clockwise.
  const arm1 = createArm(0.35, 0.012, true, 65);
  root.add(arm1);

  // Arm 2: Medium, no tab (approx 3 o'clock)
  const arm2 = createArm(0.30, 0.010, false, 0);
  root.add(arm2);

  // Arm 3: Short, no tab (approx 5 o'clock = -30 deg or 330 deg)
  const arm3 = createArm(0.20, 0.010, false, -35);
  root.add(arm3);

  // Arm 4: Short, no tab (approx 7 o'clock = -150 deg or 210 deg)
  const arm4 = createArm(0.20, 0.010, false, -145);
  root.add(arm4);

  // 6. Central decorative cap on the hub
  const capGeom = new THREE.SphereGeometry(0.015, 16, 16);
  const cap = new THREE.Mesh(capGeom, brassMat);
  cap.position.y = baseThickness / 2 + hubHeight + 0.005;
  root.add(cap);

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