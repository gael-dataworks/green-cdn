export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Steel blade: polished metal, capped metalness per rules.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Gold/Brass bolster and cap.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Handle: black, matte/satin finish.
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Procedural Texture for Blade Logo ---
  // Create a simple DataTexture with "miyabi" text approximation.
  const texWidth = 256;
  const texHeight = 64;
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  // Fill white background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 240;     // R
    data[i + 1] = 240; // G
    data[i + 2] = 240; // B
    data[i + 3] = 255; // A
  }

  // Helper to draw a black pixel
  function setPixel(x, y) {
    if (x >= 0 && x < texWidth && y >= 0 && y < texHeight) {
      const idx = (y * texWidth + x) * 4;
      data[idx] = 20;
      data[idx + 1] = 20;
      data[idx + 2] = 20;
    }
  }

  // Simple 5x7 bitmap font glyphs for "miyabi"
  // m, i, y, a, b, i
  const glyphs = {
    'm': [
      "11111",
      "10101",
      "10101",
      "10101",
      "10101",
      "10101",
      "10101"
    ],
    'i': [
      "010",
      "010",
      "010",
      "010",
      "010",
      "010",
      "010"
    ],
    'y': [
      "10001",
      "10001",
      "10001",
      "01010",
      "00100",
      "00100",
      "00100"
    ],
    'a': [
      "01110",
      "10001",
      "10001",
      "11111",
      "10001",
      "10001",
      "10001"
    ],
    'b': [
      "11110",
      "10001",
      "11110",
      "10001",
      "10001",
      "10001",
      "11110"
    ]
  };

  const word = "miyabi";
  let cursorX = 20;
  const cursorY = 20;
  const charGap = 4;
  const scale = 2; // Scale up the 5x7 glyphs

  for (let c = 0; c < word.length; c++) {
    const char = word[c];
    const glyph = glyphs[char] || glyphs['i'];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '1') {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPixel(cursorX + col * scale + sx, cursorY + row * scale + sy);
            }
          }
        }
      }
    }
    cursorX += (glyph[0].length * scale) + charGap;
  }

  // Add some Japanese-style blocks/lines near the text
  for(let i=0; i<3; i++) {
      for(let j=0; j<4; j++) {
          setPixel(cursorX + i*3, cursorY + 10 + j*3);
      }
  }

  const logoTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  logoTexture.colorSpace = THREE.SRGBColorSpace;
  logoTexture.needsUpdate = true;
  // Flip Y because textures are often bottom-up, but DataTexture is top-down? 
  // Three.js DataTexture is top-down (row 0 is top). Our drawing loop row 0 is top. So no flip needed.
  // However, UVs on ExtrudeGeometry might be inverted. We'll check and adjust if needed.
  logoTexture.flipY = false; 

  // --- Blade Geometry ---
  // Shape in XY plane (Top View), extruded along Z (Thickness).
  // Then rotated -90 deg around X to lie in XZ plane.
  const bladeShape = new THREE.Shape();
  // Start at handle junction (top spine)
  bladeShape.moveTo(0, 0);
  // Spine (straight)
  bladeShape.lineTo(0.48, 0);
  // Tip (rounded curve)
  bladeShape.quadraticCurveTo(0.52, 0.02, 0.50, 0.08);
  // Edge (curved belly)
  bladeShape.quadraticCurveTo(0.40, 0.14, 0.0, 0.13);
  // Heel (straight back to start)
  bladeShape.lineTo(0, 0);

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.004,       // Blade thickness
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.002,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 12,
  });

  // Center the geometry so pivot is at handle junction
  bladeGeom.computeBoundingBox();
  const bladeCenter = new THREE.Vector3();
  bladeGeom.boundingBox.getCenter(bladeCenter);
  bladeGeom.translate(-bladeCenter.x, -bladeCenter.y, -bladeCenter.z);
  // Now (0,0,0) is roughly the handle junction center.

  const blade = new THREE.Mesh(bladeGeom, steelMat);
  // Rotate to lie flat in XZ plane. 
  // Original: Face XY, Thickness Z.
  // Rotate X -90: Face XZ, Thickness Y.
  blade.rotation.x = -Math.PI / 2;
  
  // Apply logo texture
  // The front face (normal +Z before rotation) becomes +Y (up) after rotation.
  // We want the logo on the "up" face of the knife.
  // ExtrudeGeometry UVs: 
  // We need to map the texture to the main face.
  // Default UVs might be stretched. Let's create a custom UV attribute if needed, 
  // but for simplicity, we rely on default mapping and adjust texture repeat/offset.
  // The shape is roughly 0.5 x 0.13.
  // We want the logo (drawn at x=20..100 in 256 width) to appear near the handle (x=0..0.15 in 0.5 length).
  blade.material.map = logoTexture;
  blade.material.map.repeat.set(1, 1);
  blade.material.map.offset.set(0, 0);
  // Note: ExtrudeGeometry UVs for the side faces are generated differently. 
  // For the main face, it maps the shape bounding box to 0-1.
  // So x=0 is UV 0, x=0.5 is UV 1.
  // Our logo is at UV x=0.08 to 0.4 (approx). This places it near the handle. Good.

  root.add(blade);

  // --- Bolster (Gold Collar) ---
  // Cylinder between handle and blade.
  const bolsterGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 24);
  const bolster = new THREE.Mesh(bolsterGeom, brassMat);
  // Position at handle junction. Blade is along +X (after rotation).
  // Blade junction is at local 0.
  // Bolster should be slightly behind blade (negative X).
  bolster.position.set(-0.0075, 0, 0); 
  // Rotate to align with X axis (Cylinder is Y-up by default)
  bolster.rotation.z = Math.PI / 2;
  root.add(bolster);

  // --- Handle (Black Ergonomic) ---
  // LatheGeometry around X axis? No, Lathe is always Y axis.
  // So we define profile in XY, then rotate the mesh Z -90 to align with X.
  const handleProfile = [
    new THREE.Vector2(0.035, 0),    // Junction with bolster
    new THREE.Vector2(0.042, 0.03), // Slight flare
    new THREE.Vector2(0.048, 0.06), // Grip swell
    new THREE.Vector2(0.045, 0.10), // Taper
    new THREE.Vector2(0.038, 0.14), // End before cap
  ];
  
  const handleGeom = new THREE.LatheGeometry(handleProfile, 24);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Position: Starts at bolster end (-0.015 from center of bolster).
  // Bolster center is at -0.0075. Bolster half-width is 0.0075. So end is at -0.015.
  // Handle local origin (0,0) is at the first profile point (junction).
  handle.position.set(-0.015, 0, 0);
  // Rotate to align Lathe Y with Knife X.
  handle.rotation.z = Math.PI / 2;
  root.add(handle);

  // --- Butt Cap (Gold End) ---
  const capGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.01, 24);
  const cap = new THREE.Mesh(capGeom, brassMat);
  // Position at end of handle. Handle length is 0.14.
  cap.position.set(-0.015 - 0.14 - 0.005, 0, 0);
  cap.rotation.z = Math.PI / 2;
  root.add(cap);

  // --- Final Orientation ---
  // Currently the knife points along +X.
  // Convention: Object should face +Z.
  root.rotation.y = -Math.PI / 2;

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