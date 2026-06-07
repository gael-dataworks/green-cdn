export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Orange plastic body
  const orangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6600,
    metalness: 0.1,
    roughness: 0.4,
  });

  // Black plastic (head, grip accents, switch)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.5,
  });

  // Metal blade
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x444444,
    emissiveIntensity: 0.2,
  });

  // Label material (uses generated texture)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  // --- Procedural Label Texture ---
  // Generates a Black & Decker style label with text blocks
  function createLabelTexture() {
    const w = 256, h = 128;
    const data = new Uint8Array(w * h * 4);
    // Background black
    for (let i = 0; i < w * h * 4; i += 4) {
      data[i] = 20; data[i+1] = 20; data[i+2] = 20; data[i+3] = 255;
    }
    // Helper to draw rect
    function drawRect(x, y, w, h, r, g, b) {
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          const idx = ((y + dy) * 256 + (x + dx)) * 4;
          if (idx < data.length) {
            data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
          }
        }
      }
    }
    // White "BLACK+DECKER" bar
    drawRect(20, 30, 200, 40, 255, 255, 255);
    // Yellow accent line
    drawRect(20, 75, 200, 8, 255, 200, 0);
    // "20V MAX" block
    drawRect(40, 90, 100, 25, 255, 255, 255);
    
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }
  labelMat.map = createLabelTexture();

  // --- Geometry Construction ---

  // 1. Main Body (Orange)
  // We define the side profile in XY plane, extrude along Z (width), then rotate.
  const bodyShape = new THREE.Shape();
  // Start bottom-back (battery end)
  bodyShape.moveTo(0, -0.12);
  // Back vertical
  bodyShape.lineTo(0, 0.28);
  // Top ridge (slight curve down)
  bodyShape.bezierCurveTo(0.1, 0.28, 0.4, 0.26, 0.6, 0.24);
  // Neck taper
  bodyShape.lineTo(0.85, 0.18);
  // Front nose
  bodyShape.lineTo(0.95, 0.15);
  // Front bottom
  bodyShape.lineTo(0.95, 0.0);
  // Bottom grip curve (ergonomic dip)
  bodyShape.bezierCurveTo(0.8, 0.0, 0.4, -0.05, 0.2, -0.1);
  // Back to start
  bodyShape.lineTo(0, -0.12);

  const bodyExtrudeSettings = {
    depth: 0.18, // Width of the tool
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  };
  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
  // Center the geometry roughly
  bodyGeom.center();
  
  const body = new THREE.Mesh(bodyGeom, orangeMat);
  // Rotate so length aligns with Z, width with X
  // Currently: Length=X, Height=Y, Width=Z.
  // Target: Length=Z, Height=Y, Width=X.
  // Rotate -90 deg around Y.
  body.rotation.y = -Math.PI / 2;
  root.add(body);

  // 2. Head Housing (Black)
  // Attached to front (+Z end of body)
  // The body is now rotated. The front is at +Z.
  // We need to position the head relative to the body.
  // Let's create a group for the tool to manage local coords easier, 
  // but since we added body to root, let's just calculate positions.
  // Body is centered. Length ~1.0. Front is at ~0.5 Z.
  
  const headGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.25, 12);
  // Cylinder is Y-up. Rotate X 90 to face Z.
  const head = new THREE.Mesh(headGeom, blackMat);
  head.rotation.x = Math.PI / 2;
  head.position.z = 0.55; // Extend from body front
  root.add(head);

  // 3. Blade Clamp (Black)
  const clampGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
  const clamp = new THREE.Mesh(clampGeom, blackMat);
  clamp.rotation.x = Math.PI / 2;
  clamp.position.z = 0.70; // End of head
  root.add(clamp);

  // 4. Blade (Metal)
  // Flat plate extending from clamp
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.35, -0.05); // Taper out
  bladeShape.lineTo(0.35, 0.05);
  bladeShape.lineTo(0.45, 0.0); // Pointed tip
  bladeShape.lineTo(0.35, -0.05);
  // Actually let's make a simple sanding pad shape (triangle/trapezoid)
  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, { depth: 0.015, bevelEnabled: false });
  // Center and orient
  bladeGeom.center();
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  // Blade lies flat in XZ plane? No, usually oscillating tools have the blade parallel to the handle axis or perpendicular.
  // In the image, the blade is flat, extending forward.
  // Extrude is Z-depth. We want flat in XY? 
  // Let's just use a Box for simplicity and robustness.
  const bladeBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.5), metalMat);
  bladeBox.position.z = 0.95; // Extend from clamp
  bladeBox.position.y = -0.05; // Slight offset
  root.add(bladeBox);

  // 5. Switch (Black)
  // Slider on the side/top of the orange body
  const switchGeom = new THREE.BoxGeometry(0.04, 0.02, 0.08);
  const switchBtn = new THREE.Mesh(switchGeom, blackMat);
  // Position on the side of the body (X axis)
  // Body width is 0.18. Side is at X ~ 0.1.
  switchBtn.position.set(0.11, 0.15, -0.1); // Mid-body, top side
  root.add(switchBtn);

  // 6. Vents (Black)
  // Slots on the side of the orange body near the back
  const ventGeom = new THREE.BoxGeometry(0.01, 0.04, 0.06);
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(ventGeom, blackMat);
    // Position on side (X), spaced along Z (back area)
    // Back is negative Z (since front is +Z).
    // Body center is 0. Back is ~ -0.4.
    vent.position.set(0.11, 0.05, -0.2 - (i * 0.05));
    root.add(vent);
  }
  // Vents on other side
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(ventGeom, blackMat);
    vent.position.set(-0.11, 0.05, -0.2 - (i * 0.05));
    root.add(vent);
  }

  // 7. Labels (Decals)
  // Thin planes attached to the side of the orange body
  const labelGeom = new THREE.PlaneGeometry(0.25, 0.08);
  const labelLeft = new THREE.Mesh(labelGeom, labelMat);
  labelLeft.position.set(0.111, 0.1, -0.05); // Slightly offset from surface
  labelLeft.rotation.y = Math.PI / 2; // Face outward
  root.add(labelLeft);

  const labelRight = new THREE.Mesh(labelGeom, labelMat);
  labelRight.position.set(-0.111, 0.1, -0.05);
  labelRight.rotation.y = -Math.PI / 2;
  root.add(labelRight);

  // 8. Front Grille/Details (Black)
  // Small holes on the black head
  const holeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
  for (let i = 0; i < 3; i++) {
    const hole = new THREE.Mesh(holeGeom, blackMat); // Actually should be empty, but black mesh on black body works as detail
    // Or use a slightly darker black
    hole.rotation.x = Math.PI / 2;
    hole.position.set(0, 0.1 * Math.sin(i), 0.55 + 0.1 * Math.cos(i));
    // Let's just put them on the side of the head
    hole.position.set(0.12, 0, 0.55);
    hole.rotation.z = Math.PI / 2;
    root.add(hole);
    
    const hole2 = hole.clone();
    hole2.position.set(-0.12, 0, 0.55);
    root.add(hole2);
  }

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