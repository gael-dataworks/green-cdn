export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass body: High transmission, low roughness, slight thickness for refraction
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  // Hands: Dark metallic gray
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Center cap: Polished silver
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry: Chamfered Block Body ---
  // Create a 2D shape for the square face with cut corners
  const shape = new THREE.Shape();
  const s = 0.22; // half-size of the square face
  const c = 0.04; // chamfer size at corners

  // Trace counter-clockwise starting from bottom-left chamfer
  shape.moveTo(-s, -s + c);
  shape.lineTo(-s, s - c);
  shape.lineTo(-s + c, s);
  shape.lineTo(s - c, s);
  shape.lineTo(s, s - c);
  shape.lineTo(s, -s + c);
  shape.lineTo(s - c, -s);
  shape.lineTo(-s + c, -s);
  shape.lineTo(-s, -s + c);

  const extrudeSettings = {
    steps: 1,
    depth: 0.12, // Thickness of the clock
    bevelEnabled: false,
  };

  const bodyGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry: ExtrudeGeometry starts at z=0 and goes to z=depth.
  // We want it centered at z=0, so shift by -depth/2.
  bodyGeom.translate(0, 0, -extrudeSettings.depth / 2);

  const body = new THREE.Mesh(bodyGeom, glassMat);
  root.add(body);

  // --- Texture: Clock Face ---
  // Procedurally generate the numbers 1-12 on a white background
  const faceTexture = createClockFaceTexture(THREE);
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTexture,
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Face Plane: Slightly smaller than the inner bounds of the glass to avoid clipping
  // Placed just inside the front face of the glass (z = depth/2 - epsilon)
  const faceGeom = new THREE.PlaneGeometry(s * 1.6, s * 1.6);
  const face = new THREE.Mesh(faceGeom, faceMat);
  face.position.z = extrudeSettings.depth / 2 - 0.005;
  root.add(face);

  // --- Hands ---
  // Pivot group at center of face
  const handsGroup = new THREE.Group();
  handsGroup.position.set(0, 0, extrudeSettings.depth / 2 + 0.005);
  root.add(handsGroup);

  // Hour Hand (Short, thick)
  const hourHandGeom = new THREE.BoxGeometry(0.015, 0.09, 0.005);
  // Shift geometry so pivot is at one end (bottom of hand)
  hourHandGeom.translate(0, 0.045, 0); 
  const hourHand = new THREE.Mesh(hourHandGeom, handMat);
  // Rotate to 10 o'clock position (approx -150 degrees from 12 o'clock)
  // 12 o'clock is -PI/2. 10 is -PI/2 - (2/12)*2PI = -5PI/6
  hourHand.rotation.z = -5 * Math.PI / 6;
  handsGroup.add(hourHand);

  // Minute Hand (Long, thick)
  const minuteHandGeom = new THREE.BoxGeometry(0.012, 0.13, 0.005);
  minuteHandGeom.translate(0, 0.065, 0);
  const minuteHand = new THREE.Mesh(minuteHandGeom, handMat);
  // Rotate to 2 o'clock position (approx +60 degrees from 12 o'clock)
  // 2 is -PI/2 + (2/12)*2PI = -PI/6
  minuteHand.rotation.z = -Math.PI / 6;
  handsGroup.add(minuteHand);

  // Second Hand (Very thin, long)
  const secondHandGeom = new THREE.BoxGeometry(0.004, 0.14, 0.002);
  secondHandGeom.translate(0, 0.07, 0);
  const secondHand = new THREE.Mesh(secondHandGeom, handMat);
  // Rotate to 7 o'clock position (approx 210 degrees from 12)
  // 7 is -PI/2 + (7/12)*2PI = 7PI/6 - PI/2 = 4PI/6 = 2PI/3 ... wait.
  // 12 is -90deg. 6 is 90deg. 7 is 90 + 30 = 120deg (2PI/3).
  secondHand.rotation.z = 2 * Math.PI / 3;
  handsGroup.add(secondHand);

  // Center Cap
  const capGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.rotation.x = Math.PI / 2; // Align with Z axis
  cap.position.z = 0.005; // On top of hands
  handsGroup.add(cap);

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

function createClockFaceTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const bgColor = [255, 255, 255]; // White background
  const numColor = [100, 100, 100]; // Gray numbers

  // Fill background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = bgColor[0];
    data[i + 1] = bgColor[1];
    data[i + 2] = bgColor[2];
    data[i + 3] = 255;
  }

  // Helper to draw a filled rectangle (for digit segments)
  function drawRect(cx, cy, w, h, color) {
    const x0 = Math.floor(cx - w / 2);
    const y0 = Math.floor(cy - h / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x0 + x;
        const py = y0 + y;
        if (px >= 0 && px < size && py >= 0 && py < size) {
          const idx = (py * size + px) * 4;
          data[idx] = color[0];
          data[idx + 1] = color[1];
          data[idx + 2] = color[2];
          data[idx + 3] = 255;
        }
      }
    }
  }

  // Simple 5x7 bitmap font definitions (1 = pixel on)
  const digits = {
    '1': [0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0],
    '2': [1,1,1, 0,0,1, 0,0,1, 1,1,1, 1,0,0, 1,0,0, 1,1,1],
    '3': [1,1,1, 0,0,1, 0,0,1, 1,1,1, 0,0,1, 0,0,1, 1,1,1],
    '4': [1,0,1, 1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1, 0,0,1],
    '5': [1,1,1, 1,0,0, 1,0,0, 1,1,1, 0,0,1, 0,0,1, 1,1,1],
    '6': [1,1,1, 1,0,0, 1,0,0, 1,1,1, 1,0,1, 1,0,1, 1,1,1],
    '7': [1,1,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1],
    '8': [1,1,1, 1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1, 1,1,1],
    '9': [1,1,1, 1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1, 1,1,1],
    '10': [1,0,1, 1,0,1, 1,1,1, 1,0,1, 1,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1], // Special handling for 10, 11, 12
    '11': [], 
    '12': []
  };

  // Draw digits 1-12 in a circle
  const radius = 90; // Pixels from center
  const centerX = size / 2;
  const centerY = size / 2;

  for (let i = 1; i <= 12; i++) {
    // Angle: 12 is at -PI/2 (top). Step is 30 degrees (PI/6).
    // i=12 -> -PI/2. i=1 -> -PI/2 + PI/6.
    const angle = -Math.PI / 2 + (i / 12) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const label = i.toString();
    
    // Draw each character of the label
    let charOffset = 0;
    for (let c = 0; c < label.length; c++) {
      const char = label[c];
      // Simplified bitmap drawing for '1' and others
      // We will just draw blocks for simplicity to avoid huge data structures
      // '1' is narrow, others are 5 wide.
      const isOne = (char === '1');
      const w = isOne ? 4 : 10;
      const h = 14;
      
      // Draw a simple block representation for the number
      // To keep code small, we draw a rounded rect approximation using multiple small rects
      // or just a solid block for the digit shape? 
      // Let's use a simpler approach: Draw the digit shape using the 'digits' map above is too verbose.
      // Instead, draw a thick line or box for each number position to represent the number.
      // Actually, let's just draw the number 'i' as a small filled circle or square if font is too hard.
      // NO, the prompt requires labels. I will draw a simple 5x7 grid manually for 0-9.
      
      // Re-using a compact font drawing logic
      const fontMap = [
        [0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0], // 0
        [0,0,0,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0], // 1
        [0,0,0,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0, 0,0,0,0,0, 0,0,1,0,0], // 2 (placeholder)
      ]; 
      // ^ That's too much data. I will draw simple geometric shapes for numbers.
      // 1: Vertical line. 2: Z shape. 3: E shape reversed... 
      // Actually, I'll just draw the number as a small filled circle with the index inside? No.
      // I will draw a simple "tick" mark for the number position if text is too complex, 
      // BUT the prompt says "labels... REQUIRED".
      // Okay, I will draw the numbers using a very compact 3x5 grid logic inline.
      
      const digitVal = parseInt(char);
      const dw = 10; 
      const dh = 14;
      const dx = x + charOffset - dw/2;
      const dy = y - dh/2;
      
      // Draw digit based on value (simplified block logic)
      // 1: right col
      // 2: top, top-right, mid, bot-left, bot
      // ... this is getting long. 
      // Alternative: Use the '1' logic for all, just offset positions? No.
      // I will draw the numbers as simple thick lines forming the shape.
      
      // To ensure validator safety and size limits, I will draw the numbers as 
      // small distinct colored squares/circles if I can't fit a font.
      // WAIT. I can just draw the text using the logic from the "Worked Examples" 
      // if I had a font. I don't.
      // I will draw the numbers as simple "Segments".
      
      // Let's just draw the number 'i' as a small circle with radius 3? 
      // No, that's not a number.
      // I will implement a tiny 5x7 font for 0-9 in the loop.
      
      const f = getDigitBitmap(digitVal);
      for(let fy=0; fy<7; fy++) {
        for(let fx=0; fx<5; fx++) {
          if(f[fy*5+fx]) {
             drawRect(dx + fx*2, dy + fy*2, 2, 2, numColor);
          }
        }
      }
      
      charOffset += 12; // spacing
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function getDigitBitmap(n) {
  // 5x7 bitmaps for 0-9
  const maps = {
    0: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    1: [0,0,1,0,0, 0,1,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
    2: [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 1,1,1,1,1],
    3: [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    4: [0,0,0,1,0, 0,0,1,1,0, 0,1,0,1,0, 1,0,0,1,0, 1,1,1,1,1, 0,0,0,1,0, 0,0,0,1,0],
    5: [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    6: [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    7: [1,1,1,1,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 0,1,0,0,0, 0,1,0,0,0],
    8: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    9: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,1, 0,0,0,0,1, 0,0,0,0,1, 0,1,1,1,0]
  };
  return maps[n] || maps[0];
}