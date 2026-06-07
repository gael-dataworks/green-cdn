export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Body: Dark grey matte plastic/painted metal. Low metalness to avoid blackness.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    metalness: 0.2,
    roughness: 0.6,
  });

  // Screen Bezel: Slightly darker/black
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Screen Display: Emissive for the glow
  const displayMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x4444aa,
    emissiveIntensity: 0.8,
  });

  // Buttons
  const btnRedMat = new THREE.MeshStandardMaterial({ color: 0xaa3333, metalness: 0.1, roughness: 0.4 });
  const btnGreenMat = new THREE.MeshStandardMaterial({ color: 0x33aa55, metalness: 0.1, roughness: 0.4 });
  const btnBlueMat = new THREE.MeshStandardMaterial({ color: 0x3366aa, metalness: 0.1, roughness: 0.4 });
  const btnGreyMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.1, roughness: 0.5 });
  const btnOrangeMat = new THREE.MeshStandardMaterial({ color: 0xaa6633, metalness: 0.1, roughness: 0.4 });

  // Side Ports/Vents: Deep black inset
  const insetMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.0, roughness: 0.9 });
  
  // Screws: Silver
  const screwMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.6, roughness: 0.3 });

  // --- Helpers ---

  // Create a rounded box using ExtrudeGeometry for smooth corners
  function createRoundedBox(width, height, depth, radius, segments) {
    const shape = new THREE.Shape();
    const eps = 0.00001;
    const r = radius - eps;
    const w = width / 2 - r;
    const h = height / 2 - r;
    
    // Draw rounded rect in XY plane
    shape.moveTo(-w, -h - r);
    shape.lineTo(-w, h);
    shape.quadraticCurveTo(-w, h + r, -w + r, h + r);
    shape.lineTo(w, h + r);
    shape.quadraticCurveTo(w + r, h + r, w + r, h);
    shape.lineTo(w + r, -h);
    shape.quadraticCurveTo(w + r, -h - r, w, -h - r);
    shape.lineTo(-w, -h - r);

    const extrudeSettings = {
      steps: 1,
      depth: depth,
      bevelEnabled: false,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center the geometry
    geom.center();
    return geom;
  }

  function addMesh(geom, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    return mesh;
  }

  // --- 1. Main Body Construction ---
  
  // The device has a base and an angled top. 
  // We can model this as two extruded shapes or boxes fused together.
  // Let's use a combined approach for the main shell.
  
  // Base Block
  const baseW = 1.0;
  const baseH = 0.35;
  const baseD = 0.7;
  const baseGeom = createRoundedBox(baseW, baseH, baseD, 0.05, 4);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = baseH / 2;
  root.add(base);

  // Top Angled Block
  // Profile: Trapezoid-ish shape that angles back
  const topShape = new THREE.Shape();
  const topW = 0.9;
  const topH = 0.5;
  const topD = 0.6;
  const angle = -Math.PI / 8; // Tilt back slightly

  // Draw side profile in XZ plane (since we extrude along Y? No, let's extrude along Z for width)
  // Actually, let's just use a Box and rotate it, then fill the gap.
  // Simpler: BoxGeometry for the top part, rotated.
  const topGeom = new THREE.BoxGeometry(topW, 0.15, topD);
  const topPart = new THREE.Mesh(topGeom, bodyMat);
  // Position it on top of the base, towards the back
  topPart.position.set(0, baseH + 0.15/2 + 0.05, -0.1);
  topPart.rotation.x = angle;
  root.add(topPart);

  // Filler wedge between base and angled top (the slope)
  const wedgeH = 0.25;
  const wedgeGeom = new THREE.BoxGeometry(topW, wedgeH, 0.35);
  const wedge = new THREE.Mesh(wedgeGeom, bodyMat);
  wedge.position.set(0, baseH + wedgeH/2, 0.1);
  // Tilt to match the top part angle roughly
  wedge.rotation.x = angle * 0.5; 
  root.add(wedge);

  // Back vertical support
  const backH = 0.6;
  const backGeom = new THREE.BoxGeometry(topW, backH, 0.15);
  const backPart = new THREE.Mesh(backGeom, bodyMat);
  backPart.position.set(0, baseH + backH/2, -0.25);
  root.add(backPart);


  // --- 2. Screen Assembly ---

  const screenW = 0.75;
  const screenH = 0.45;
  const screenD = 0.02;
  
  // Bezel
  const bezelGeom = new THREE.BoxGeometry(screenW + 0.04, screenH + 0.04, screenD);
  const bezel = new THREE.Mesh(bezelGeom, bezelMat);
  // Attach to the angled top part
  // We need to calculate position relative to world or parent. 
  // Let's attach to root and position manually to match the angle.
  bezel.position.copy(topPart.position);
  bezel.position.z += 0.01; // Slightly forward
  bezel.rotation.copy(topPart.rotation);
  root.add(bezel);

  // Screen Display Surface
  const displayGeom = new THREE.PlaneGeometry(screenW, screenH);
  
  // Generate Procedural Texture for Screen Content
  const texW = 256, texH = 256;
  const data = new Uint8Array(texW * texH * 4);
  // Background: Dark Blue/Purple gradient
  for (let y = 0; y < texH; y++) {
    for (let x = 0; x < texW; x++) {
      const i = (y * texW + x) * 4;
      const t = y / texH;
      // Gradient from dark purple to blue
      data[i] = 20 + t * 40;     // R
      data[i+1] = 20 + t * 60;   // G
      data[i+2] = 60 + t * 100;  // B
      data[i+3] = 255;           // A
    }
  }
  // Draw "Code" lines
  for (let i = 0; i < 15; i++) {
    const ly = 20 + i * 14;
    const lh = 8 + (i % 3) * 4;
    const lw = 50 + (i % 5) * 30;
    const lx = 10 + (i % 2) * 20;
    // Color variation: White, Cyan, Magenta
    const colorType = i % 3;
    for (let yy = 0; yy < lh; yy++) {
      for (let xx = 0; xx < lw; xx++) {
        const px = lx + xx;
        const py = ly + yy;
        if (px < texW && py < texH) {
          const idx = (py * texW + px) * 4;
          if (colorType === 0) { // White
            data[idx] = 255; data[idx+1] = 255; data[idx+2] = 255;
          } else if (colorType === 1) { // Cyan
            data[idx] = 100; data[idx+1] = 255; data[idx+2] = 255;
          } else { // Magenta
            data[idx] = 255; data[idx+1] = 100; data[idx+2] = 255;
          }
        }
      }
    }
  }
  // Top Status Bar
  for (let x = 0; x < texW; x++) {
    for (let y = 0; y < 20; y++) {
      const idx = (y * texW + x) * 4;
      data[idx] = 50; data[idx+1] = 50; data[idx+2] = 200; // Blue bar
    }
  }

  const screenTex = new THREE.DataTexture(data, texW, texH, THREE.RGBAFormat);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.needsUpdate = true;

  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  const screenMesh = new THREE.Mesh(displayGeom, screenMat);
  screenMesh.position.copy(bezel.position);
  screenMesh.position.z += 0.011; // Just in front of bezel
  screenMesh.rotation.copy(bezel.rotation);
  root.add(screenMesh);


  // --- 3. Keypad Buttons ---

  // Button geometry (flattened capsule/cylinder)
  const btnGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16);
  const btnLargeGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.015, 16);
  const btnRectGeom = new THREE.BoxGeometry(0.06, 0.015, 0.04);

  // Layout on the wedge slope
  // We need to transform positions to the wedge's local space or calculate world positions.
  // Let's calculate world positions on the slope surface.
  // Slope center approx: (0, baseH + wedgeH/2, 0.1)
  // Slope angle: angle * 0.5
  
  const slopeAngle = angle * 0.5;
  const slopeY = baseH + wedgeH/2;
  const slopeZ = 0.1;
  
  function placeButton(geom, mat, x, y, z, isLarge = false) {
    const btn = new THREE.Mesh(geom, mat);
    // Position relative to slope center
    // Rotate around X to match slope
    btn.position.set(x, slopeY + y, slopeZ + z);
    btn.rotation.x = slopeAngle;
    root.add(btn);
    
    // Add a small highlight rim
    const rimGeom = isLarge ? new THREE.CylinderGeometry(0.052, 0.052, 0.005, 16) : new THREE.CylinderGeometry(0.037, 0.037, 0.005, 16);
    const rim = new THREE.Mesh(rimGeom, new THREE.MeshStandardMaterial({color: 0x888888, metalness:0.5, roughness:0.4}));
    rim.position.copy(btn.position);
    rim.position.y += 0.008;
    rim.rotation.x = slopeAngle;
    root.add(rim);
  }

  // Button Grid Layout (Approximate based on image)
  // Rows from top to bottom on the slope (negative Z is up the slope visually, but let's use local Y on the slope)
  
  // Top Row: Red, Grey, Grey, Green
  placeButton(btnGeom, btnRedMat, -0.25, 0.08, -0.05);
  placeButton(btnGeom, btnGreyMat, -0.10, 0.08, -0.05);
  placeButton(btnGeom, btnGreyMat,  0.05, 0.08, -0.05);
  placeButton(btnGeom, btnGreenMat, 0.20, 0.08, -0.05);

  // Middle Grid (3 rows of 4)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const x = -0.25 + c * 0.15;
      const y = 0.08 - (r + 1) * 0.12;
      const mat = (r === 1 && c === 2) ? btnBlueMat : btnGreyMat; // One blue button
      placeButton(btnGeom, mat, x, y, -0.05);
    }
  }

  // Bottom Row: Red, Grey, Green(Large)
  placeButton(btnGeom, btnRedMat, -0.25, -0.35, -0.05);
  placeButton(btnGeom, btnGreyMat, -0.10, -0.35, -0.05);
  placeButton(btnLargeGeom, btnGreenMat, 0.15, -0.35, -0.05, true);

  // Small indicator LED
  const ledGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.005, 8);
  const led = new THREE.Mesh(ledGeom, new THREE.MeshStandardMaterial({color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2}));
  led.position.set(0, slopeY - 0.4, slopeZ - 0.05);
  led.rotation.x = slopeAngle;
  root.add(led);


  // --- 4. Side Details (Right Side) ---
  
  // Side Panel Surface (slightly inset or just part of the body)
  // Vents at top
  const sideX = baseW / 2 + 0.005;
  const ventY = baseH + 0.4;
  const ventZ = -0.2;
  
  for (let i = 0; i < 4; i++) {
    const ventGeom = new THREE.BoxGeometry(0.01, 0.015, 0.08);
    const vent = new THREE.Mesh(ventGeom, insetMat);
    vent.position.set(sideX, ventY - i * 0.04, ventZ);
    // Rotate to face outward? The box is already aligned if we consider sideX is the face.
    // Actually side is YZ plane. Box is XYZ. So we need to rotate 90 deg around Y.
    vent.rotation.y = Math.PI / 2;
    root.add(vent);
  }

  // Ports at bottom
  const portY = baseH * 0.4;
  const portZ = 0.0;
  for (let i = 0; i < 3; i++) {
    const portGeom = new THREE.BoxGeometry(0.02, 0.06, 0.04);
    const port = new THREE.Mesh(portGeom, insetMat);
    port.position.set(sideX, portY, portZ - i * 0.12);
    port.rotation.y = Math.PI / 2;
    root.add(port);
    
    // Port detail (inner rectangle)
    const innerGeom = new THREE.BoxGeometry(0.022, 0.04, 0.02);
    const inner = new THREE.Mesh(innerGeom, new THREE.MeshStandardMaterial({color: 0x000000}));
    inner.position.set(sideX + 0.011, portY, portZ - i * 0.12);
    inner.rotation.y = Math.PI / 2;
    root.add(inner);
  }

  // Screws on corners
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 6);
  const screwPositions = [
    [-0.45, 0.05, 0.3], [0.45, 0.05, 0.3],
    [-0.45, 0.05, -0.3], [0.45, 0.05, -0.3]
  ];
  for (const [x, y, z] of screwPositions) {
    const screw = new THREE.Mesh(screwGeom, screwMat);
    screw.position.set(x, y, z);
    screw.rotation.x = Math.PI / 2;
    root.add(screw);
  }

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