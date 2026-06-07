export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Orange plastic body (safety orange)
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Black plastic (head, switches, vents)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Metal foot/blade (silver/grey)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Label material (uses generated texture)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Helper Functions ---

  function addMesh(geometry, material, x, y, z, rx, ry, rz, sx, sy, sz) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    if (rx !== undefined) mesh.rotation.x = rx;
    if (ry !== undefined) mesh.rotation.y = ry;
    if (rz !== undefined) mesh.rotation.z = rz;
    if (sx !== undefined) mesh.scale.set(sx, sy, sz);
    root.add(mesh);
    return mesh;
  }

  // Procedural texture for the "BLACK+DECKER" label
  function createLabelTexture() {
    const width = 256;
    const height = 64;
    const data = new Uint8Array(width * height * 4);
    
    // Fill black background
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 0;     // R
      data[i * 4 + 1] = 0; // G
      data[i * 4 + 2] = 0; // B
      data[i * 4 + 3] = 255; // A
    }

    // Helper to draw a filled rect
    function drawRect(x, y, w, h, r, g, b) {
      for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
          if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
            const idx = (iy * width + ix) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    // Draw "BLACK+DECKER" style logo simulation
    // White block
    drawRect(10, 10, 100, 20, 255, 255, 255);
    // Orange block (simulating the brand color)
    drawRect(10, 34, 100, 20, 255, 102, 0);
    
    // Simulate text lines (white bars on black)
    drawRect(120, 15, 80, 8, 255, 255, 255);
    drawRect(120, 28, 60, 8, 255, 255, 255);
    drawRect(120, 41, 90, 8, 255, 255, 255);

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const labelTexture = createLabelTexture();
  labelMat.map = labelTexture;

  // --- Geometry Construction ---

  // 1. Handle (Rear) - Orange
  // Using Lathe for ergonomic bulbous shape
  const handleProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.06, 0.0),
    new THREE.Vector2(0.07, 0.05),
    new THREE.Vector2(0.065, 0.15),
    new THREE.Vector2(0.06, 0.25),
    new THREE.Vector2(0.055, 0.35),
    new THREE.Vector2(0.0, 0.35),
  ];
  // Shift profile to align with Z axis later, but Lathe spins around Y.
  // Let's build it standing up (Y) then rotate, or build profile in XZ?
  // Standard Lathe spins around Y. So profile is (radius, height).
  // We want the tool along Z. So we will rotate the resulting mesh -90 deg on X.
  const handleGeom = new THREE.LatheGeometry(handleProfile, 24);
  const handle = new THREE.Mesh(handleGeom, orangeMat);
  handle.rotation.x = -Math.PI / 2;
  handle.position.z = -0.35; // Rear
  root.add(handle);

  // 2. Main Body (Middle) - Orange
  // Boxy with rounded edges. Using BoxGeometry for simplicity, scaled.
  const bodyW = 0.14;
  const bodyH = 0.16;
  const bodyL = 0.35;
  const bodyGeom = new THREE.BoxGeometry(bodyW, bodyH, bodyL, 1, 1, 1);
  // Taper slightly towards front
  const body = new THREE.Mesh(bodyGeom, orangeMat);
  body.position.set(0, 0.02, -0.05);
  // Slight rotation to match the angle of the handle connection
  body.rotation.x = -0.1; 
  root.add(body);

  // 3. Head Housing (Front) - Black
  const headW = 0.12;
  const headH = 0.14;
  const headL = 0.18;
  const headGeom = new THREE.BoxGeometry(headW, headH, headL);
  const headHousing = new THREE.Mesh(headGeom, blackMat);
  headHousing.position.set(0, 0.02, 0.25);
  headHousing.rotation.x = -0.1;
  root.add(headHousing);

  // 4. Oscillating Foot / Plate - Metal
  // Flat shape at the bottom of the head
  const footShape = new THREE.Shape();
  footShape.moveTo(0.06, 0.0);
  footShape.lineTo(0.06, -0.08);
  footShape.quadraticCurveTo(0.06, -0.12, 0.0, -0.12);
  footShape.quadraticCurveTo(-0.06, -0.12, -0.06, -0.08);
  footShape.lineTo(-0.06, 0.0);
  footShape.lineTo(0.0, 0.04);
  footShape.lineTo(0.06, 0.0);
  
  const footExtrudeSettings = { depth: 0.015, bevelEnabled: false };
  const footGeom = new THREE.ExtrudeGeometry(footShape, footExtrudeSettings);
  // Extrude is along Z. We want it flat on bottom (XY plane relative to head)
  // The head is rotated -0.1 on X. The foot should be attached to the bottom.
  const foot = new THREE.Mesh(footGeom, metalMat);
  foot.position.set(0, -0.07, 0.34); // Bottom of head
  foot.rotation.x = -Math.PI / 2; // Lay flat
  // Adjust for head angle
  foot.rotation.x += -0.1; 
  root.add(foot);

  // 5. Clamp Knob / Screw - Black
  const knobGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 16);
  const knob = new THREE.Mesh(knobGeom, blackMat);
  knob.rotation.z = Math.PI / 2;
  knob.position.set(0, 0.08, 0.30); // Top of head
  root.add(knob);

  // 6. Ventilation Slots - Black (Recessed look)
  // Create small black boxes on the side of the orange body
  const ventW = 0.01;
  const ventH = 0.04;
  const ventD = 0.01;
  const ventGeom = new THREE.BoxGeometry(ventW, ventH, ventD);
  
  // Right side vents (x > 0)
  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(ventGeom, blackMat);
    // Position along the body length
    const zPos = -0.2 + (i * 0.05);
    vent.position.set(bodyW / 2 + 0.001, 0.02, zPos);
    vent.rotation.y = Math.PI / 2; // Face outward
    // Match body tilt
    vent.rotation.x = -0.1;
    root.add(vent);
  }

  // 7. Side Switch - Black
  const switchGeom = new THREE.BoxGeometry(0.01, 0.03, 0.06);
  const switchMesh = new THREE.Mesh(switchGeom, blackMat);
  switchMesh.position.set(-bodyW / 2 - 0.001, 0.02, -0.15);
  switchMesh.rotation.y = Math.PI / 2;
  switchMesh.rotation.x = -0.1;
  root.add(switchMesh);

  // 8. Labels - Textured Planes
  // Main label on the side
  const labelGeom = new THREE.PlaneGeometry(0.12, 0.05);
  const labelMesh = new THREE.Mesh(labelGeom, labelMat);
  labelMesh.position.set(bodyW / 2 + 0.002, 0.02, -0.10);
  labelMesh.rotation.y = Math.PI / 2;
  labelMesh.rotation.x = -0.1;
  root.add(labelMesh);

  // Secondary small label near head
  const labelSmallGeom = new THREE.PlaneGeometry(0.08, 0.03);
  const labelSmallMesh = new THREE.Mesh(labelSmallGeom, labelMat);
  labelSmallMesh.position.set(bodyW / 2 + 0.002, 0.02, 0.10);
  labelSmallMesh.rotation.y = Math.PI / 2;
  labelSmallMesh.rotation.x = -0.1;
  root.add(labelSmallMesh);

  // 9. Front Mounting Screw/Hole detail
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12);
  const screw = new THREE.Mesh(screwGeom, blackMat);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(0, 0.02, 0.34); // Front face of head
  root.add(screw);

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