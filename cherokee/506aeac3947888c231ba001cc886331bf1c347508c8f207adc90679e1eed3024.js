export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const SIZE = 0.45;
  const DEPTH = 0.12;
  const BEVEL_SIZE = 0.045;
  const DIAL_RADIUS = SIZE * 0.35;

  // --- Materials ---
  // Crystal/Glass: High transmission, low roughness, slight grey tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    envMapIntensity: 1.0
  });

  // Metallic Silver for hands and numbers
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    metalness: 0.8,
    roughness: 0.2
  });

  // Darker metal for second hand (often distinct)
  const secondHandMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.8,
    roughness: 0.2
  });

  // --- 1. Procedural Clock Face Texture (DataTexture) ---
  // We draw numbers 1-12 onto a 256x256 buffer
  const TEX_SIZE = 256;
  const texData = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
  const centerX = TEX_SIZE / 2;
  const centerY = TEX_SIZE / 2;
  const textRadius = 100;

  // Simple 5x7 bitmap font for digits 0-9
  // 1 = pixel on, 0 = off
  const font = {
    '0': ["01110","10001","10001","10001","10001","10001","01110"],
    '1': ["00100","01100","00100","00100","00100","00100","01110"],
    '2': ["01110","10001","00001","00010","00100","01000","11111"],
    '3': ["01110","10001","00001","00110","00001","10001","01110"],
    '4': ["00010","00110","01010","10010","11111","00010","00010"],
    '5': ["11111","10000","11110","00001","00001","10001","01110"],
    '6': ["00110","01000","10000","11110","10001","10001","01110"],
    '7': ["11111","00001","00010","00100","01000","01000","01000"],
    '8': ["01110","10001","10001","01110","10001","10001","01110"],
    '9': ["01110","10001","10001","01111","00001","00010","01100"],
    ':': ["00000","00000","00100","00000","00100","00000","00000"]
  };

  function drawDigit(digitStr, dx, dy, color) {
    const rows = font[digitStr];
    if (!rows) return;
    const charW = 5;
    const charH = 7;
    const totalW = digitStr.length * (charW + 1);
    const startX = dx - totalW / 2;
    const startY = dy - charH / 2;

    for (let d = 0; d < digitStr.length; d++) {
      const digit = digitStr[d];
      const pattern = font[digit];
      const ox = startX + d * (charW + 1);
      for (let r = 0; r < charH; r++) {
        for (let c = 0; c < charW; c++) {
          if (pattern[r][c] === '1') {
            const px = Math.floor(ox + c);
            const py = Math.floor(startY + r);
            if (px >= 0 && px < TEX_SIZE && py >= 0 && py < TEX_SIZE) {
              const idx = (py * TEX_SIZE + px) * 4;
              texData[idx] = color.r;
              texData[idx + 1] = color.g;
              texData[idx + 2] = color.b;
              texData[idx + 3] = 255; // Alpha
            }
          }
        }
      }
    }
  }

  const numColor = { r: 140, g: 140, b: 140 }; // Silver-grey

  // Place numbers 1-12
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // Start at 12 (top)
    const x = centerX + Math.cos(angle) * textRadius;
    const y = centerY - Math.sin(angle) * textRadius; // Y is down in texture coords usually, but we flip later or just map
    // In Three.js texture coords, (0,0) is bottom-left.
    // So we want 12 at top (y=high), 6 at bottom (y=low).
    // My loop: angle 0 is right (3 o'clock). -PI/2 is top (12 o'clock).
    // Standard trig: x = cos, y = sin.
    // Let's map carefully:
    // 12 o'clock: angle = -PI/2. cos=0, sin=-1. y = centerY - (-1)*R = centerY + R (Top). Correct.
    const label = i.toString();
    drawDigit(label, x, y, numColor);
  }

  const dialTexture = new THREE.DataTexture(texData, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat);
  dialTexture.colorSpace = THREE.SRGBColorSpace;
  dialTexture.needsUpdate = true;
  // Flip Y because DataTexture origin is bottom-left, but our drawing logic assumed top-left for "12"
  // Actually, let's just rely on the math above.
  // Wait, standard image coords: 0,0 is top-left. Three.js Texture: 0,0 is bottom-left.
  // My drawDigit used `py` from 0 to 255. If 0 is top, then 12 (y=high) is near 255 (bottom in Three).
  // So 12 would be at the bottom. I need to invert Y in the draw logic or flip texture.
  // Let's flip the texture vertically in the draw loop to match Three.js UVs (0,0 = bottom-left).
  // Correction: I will invert `py` when writing to buffer.
  // Re-doing the write index:
  // Target Y in buffer (0=bottom) = TEX_SIZE - 1 - py_calculated_from_top.
  // Let's adjust the drawDigit call or the buffer write.
  // Easier: Just invert the Y coordinate passed to drawDigit or inside it.
  // I'll modify the buffer write index: `const idx = ((TEX_SIZE - 1 - py) * TEX_SIZE + px) * 4;`
  // But I already wrote the loop above. I'll fix it in the re-implementation below.

  // --- 2. Glass Body (Extruded Square with Bevel) ---
  const shape = new THREE.Shape();
  const half = SIZE / 2;
  shape.moveTo(-half, -half);
  shape.lineTo(half, -half);
  shape.lineTo(half, half);
  shape.lineTo(-half, half);
  shape.lineTo(-half, -half);

  const extrudeSettings = {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_SIZE,
    bevelSize: BEVEL_SIZE,
    bevelSegments: 2,
    steps: 1
  };

  const glassGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center the geometry. Extrude starts at 0,0,0 and goes +Z.
  // We want it centered at 0,0,0.
  glassGeom.translate(0, 0, -DEPTH / 2 - BEVEL_SIZE);

  const glassBody = new THREE.Mesh(glassGeom, glassMat);
  root.add(glassBody);

  // --- 3. Dial Plane (Inside the glass) ---
  // Positioned near the back of the front face, or embedded.
  // Let's put it slightly behind the front surface to look embedded.
  // Front surface is roughly at z = 0 (after centering).
  // Actually, after centering translation:
  // Original Extrude: 0 to DEPTH + bevel.
  // Translated: -(DEPTH/2 + bevel) to +(DEPTH/2).
  // So Front Face is at +DEPTH/2 (approx). Back Face at -DEPTH/2 - bevel.
  // Let's place dial at z = 0.02 (just behind front face).
  
  const dialGeom = new THREE.PlaneGeometry(SIZE * 0.9, SIZE * 0.9);
  const dialMat = new THREE.MeshStandardMaterial({
    map: dialTexture,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false // Prevent z-fighting with glass
  });
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.position.z = 0.02; 
  root.add(dial);

  // --- 4. Clock Hands ---
  // Pivot point at center (0,0, 0.03) - slightly in front of dial
  const handZ = 0.035;
  const pivotZ = 0.04;

  // Helper to create a hand
  function createHand(width, length, thickness, mat, rotationZ) {
    const geom = new THREE.BoxGeometry(width, length, thickness);
    // Pivot is at bottom of the hand geometry usually, but Box is centered.
    // We need to shift geometry so (0,0,0) is the pivot point.
    // Box center is (0,0,0). Length is Y.
    // We want pivot at (0, -length/2, 0) relative to box center?
    // No, easier: Create box, then translate it so its bottom is at 0,0,0.
    geom.translate(0, length / 2, 0);
    
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.z = rotationZ;
    mesh.position.z = handZ;
    return mesh;
  }

  // Time: ~10:10:35
  // Hour hand (10): 10/12 * 360 = 300 deg = -60 deg = -PI/3
  // Minute hand (10): 10/60 * 360 = 60 deg = PI/3
  // Second hand (35): 35/60 * 360 = 210 deg = -150 deg = -5PI/6

  const hourHand = createHand(0.018, 0.14, 0.005, metalMat, -Math.PI / 3);
  const minuteHand = createHand(0.014, 0.19, 0.005, metalMat, Math.PI / 3);
  const secondHand = createHand(0.004, 0.21, 0.002, secondHandMat, -5 * Math.PI / 6);

  root.add(hourHand);
  root.add(minuteHand);
  root.add(secondHand);

  // Central Pivot Cap
  const pivotGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
  pivotGeom.rotateX(Math.PI / 2); // Align with Z
  const pivot = new THREE.Mesh(pivotGeom, metalMat);
  pivot.position.z = pivotZ;
  root.add(pivot);

  // --- Fix Texture Orientation ---
  // DataTexture (0,0) is bottom-left. My drawing logic assumed 0,0 top-left for "12" at top.
  // So "12" was drawn at y=high (near 255). In Three.js, y=255 is Top.
  // Wait. In Image Data, row 0 is Top. In Three.js Texture, row 0 is Bottom.
  // So if I drew "12" at row 255 (bottom of image array), Three.js puts it at Top of mesh.
  // My logic: `y = centerY + R`. If R=100, y=228.
  // So "12" is at index 228 (near bottom of array).
  // Three.js reads index 228 as "near Top" of the texture?
  // No. Three.js: (0,0) = Bottom-Left. (0, 255) = Top-Left.
  // So index 228 is near the Top.
  // So "12" appears at the Top. This is correct!
  // Wait, let's verify.
  // Array index `i` corresponds to `v` coordinate `i / height`.
  // `v=0` is bottom. `v=1` is top.
  // So high index = Top.
  // My drawing: 12 is at `centerY + R` (High Y).
  // So 12 is at High Index.
  // So 12 is at Top.
  // This seems correct without flipping.

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