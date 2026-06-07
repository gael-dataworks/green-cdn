export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass for bottle body and base
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Light blue liquid inside
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // Frosted cap
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    metalness: 0.1,
    roughness: 0.4,
    transparent: true,
    opacity: 0.9,
  });

  // Label material with procedural texture
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    map: createLabelTexture(THREE),
    transparent: true,
  });

  // --- Geometries & Meshes ---

  // 1. Bottle Body (Glass)
  // Profile: bottom center -> bottom edge -> side -> shoulder -> neck -> rim
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00),
    new THREE.Vector2(0.28, 0.00),
    new THREE.Vector2(0.28, 0.65),
    new THREE.Vector2(0.26, 0.70), // slight shoulder
    new THREE.Vector2(0.18, 0.75), // neck start
    new THREE.Vector2(0.18, 0.85), // neck top
    new THREE.Vector2(0.20, 0.88), // rim lip
    new THREE.Vector2(0.00, 0.88),
  ];
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // 2. Liquid (Inside)
  // Slightly smaller than bottle to simulate glass thickness
  const liquidProfile = [
    new THREE.Vector2(0.00, 0.02),
    new THREE.Vector2(0.26, 0.02),
    new THREE.Vector2(0.26, 0.63),
    new THREE.Vector2(0.24, 0.68),
    new THREE.Vector2(0.16, 0.73),
    new THREE.Vector2(0.16, 0.82),
    new THREE.Vector2(0.00, 0.82),
  ];
  const liquidGeom = new THREE.LatheGeometry(liquidProfile, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  root.add(liquid);

  // 3. Cap
  // Tall cylinder, slightly tapered
  const capGeom = new THREE.CylinderGeometry(0.22, 0.24, 0.55, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.15; // Sit on top of neck
  root.add(cap);

  // Cap inner ring (the part that screws on, visible under the main cap)
  const capRingGeom = new THREE.CylinderGeometry(0.19, 0.19, 0.12, 32);
  const capRing = new THREE.Mesh(capRingGeom, capMat);
  capRing.position.y = 0.92;
  root.add(capRing);

  // 4. Label
  // Curved plane or thin box wrapped around the bottle
  // Dimensions: width ~0.35 (arc), height ~0.35, depth ~0.01
  const labelWidth = 0.38;
  const labelHeight = 0.35;
  const labelDepth = 0.015;
  const labelGeom = new THREE.BoxGeometry(labelWidth, labelHeight, labelDepth);
  const label = new THREE.Mesh(labelGeom, labelMat);
  
  // Position on front of bottle
  const labelRadius = 0.28 + 0.01; // bottle radius + tiny offset
  label.position.set(0, 0.45, labelRadius);
  
  // Curve the label slightly to match bottle curvature
  // We can approximate this by scaling Z or just keeping it flat if small enough.
  // For better fit, we rotate it to face outward, but BoxGeometry is flat.
  // A better approach for a curved label is a Cylinder segment or just a flat box 
  // positioned tangent to the surface. Given the small size, a flat box is acceptable.
  // To make it look wrapped, we can use a very shallow cylinder segment, but Box is simpler.
  // Let's stick to Box but ensure it's close to surface.
  
  root.add(label);

  // 5. Base Thickening (Optional visual cue for heavy glass base)
  // The lathe profile already handles the shape, but we can add a subtle inner base
  const baseGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.05, 32);
  const base = new THREE.Mesh(baseGeom, glassMat);
  base.position.y = 0.025;
  root.add(base);

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

function createLabelTexture(THREE) {
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  // Helper to set pixel
  function setPixel(x, y, r, g, b, a) {
    const idx = (y * W + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // 1. Background: Light blue gradient
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = y / H;
      // Gradient from slightly darker blue to lighter
      const r = Math.floor(160 + 40 * t);
      const g = Math.floor(220 + 20 * t);
      const b = Math.floor(255);
      setPixel(x, y, r, g, b, 255);
    }
  }

  // 2. Glitter: Random bright specks
  // Deterministic pseudo-random using simple math
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Noise function based on coordinates
      const noise = Math.sin(x * 13.5) * Math.cos(y * 7.3) * Math.sin((x+y)*0.1);
      if (noise > 0.85) {
        // Bright white/silver speck
        const brightness = Math.floor(200 + 55 * noise);
        setPixel(x, y, brightness, brightness, brightness, 255);
      } else if (noise > 0.75) {
        // Slightly colored speck
        setPixel(x, y, 200, 240, 255, 255);
      }
    }
  }

  // 3. Text: "Deux" and "PARIS"
  // Simple 5x7 bitmap font drawing
  const font = {
    'D': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
    'e': [0,0,0,0,0, 0,0,0,0,0, 0,1,1,1,0, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,0, 0,1,1,1,0],
    'u': [0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,1,1, 0,1,1,0,1],
    'x': [0,0,0,0,0, 0,0,0,0,0, 1,0,0,0,1, 0,1,0,1,0, 0,0,1,0,0, 0,1,0,1,0, 1,0,0,0,1],
    'P': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 1,0,0,0,0],
    'A': [0,0,1,0,0, 0,1,0,1,0, 1,0,0,0,1, 1,1,1,1,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1],
    'R': [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 1,0,1,0,0, 1,0,0,1,0, 1,0,0,0,1],
    'I': [0,1,1,1,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
    'S': [0,1,1,1,0, 1,0,0,0,0, 1,0,0,0,0, 0,1,1,1,0, 0,0,0,0,1, 0,0,0,0,1, 0,1,1,1,0],
    ' ': [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0]
  };

  function drawText(text, startX, startY, scale, colorR, colorG, colorB) {
    let cx = startX;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const bits = font[char] || font[' '];
      for (let py = 0; py < 7; py++) {
        for (let px = 0; px < 5; px++) {
          const bit = bits[py * 5 + px];
          if (bit === 1) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                const tx = cx + px * scale + sx;
                const ty = startY + py * scale + sy;
                if (tx >= 0 && tx < W && ty >= 0 && ty < H) {
                  setPixel(tx, ty, colorR, colorG, colorB, 255);
                }
              }
            }
          }
        }
      }
      cx += 6 * scale; // char width + spacing
    }
  }

  // Draw "Deux" centered
  // Approximate centering
  const deuxW = 4 * 6 * 4; // 4 chars * 6 steps * scale 4
  const deuxX = (W - deuxW) / 2;
  const deuxY = 80;
  drawText("Deux", deuxX, deuxY, 4, 255, 255, 255);

  // Draw "PARIS" centered below
  const parisW = 5 * 6 * 3;
  const parisX = (W - parisW) / 2;
  const parisY = 160;
  drawText("PARIS", parisX, parisY, 3, 255, 255, 255);

  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}