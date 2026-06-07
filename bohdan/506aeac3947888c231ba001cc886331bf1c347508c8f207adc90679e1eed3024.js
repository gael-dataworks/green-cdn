export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glass body: High transmission, low roughness, slight color tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Clock face: White, matte
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Hands: Dark metal
  const handMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Center cap: Shiny metal
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.7,
    roughness: 0.2,
  });

  // --- Procedural Number Texture ---
  // Draws numbers 1-12 on a white background using a tiny 5x7 bitmap font
  function createClockFaceTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    // Fill white background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }

    // 5x7 Bitmap font for digits 0-9 (1 = pixel on)
    const font = {
      0: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      1: [0,0,1,0,0, 0,1,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0],
      2: [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 1,1,1,1,1],
      3: [0,1,1,1,0, 1,0,0,0,1, 0,0,0,0,1, 0,0,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      4: [0,0,0,1,0, 0,0,1,1,0, 0,1,0,1,0, 1,0,0,1,0, 1,1,1,1,1, 0,0,0,1,0, 0,0,0,1,0],
      5: [1,1,1,1,1, 1,0,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 0,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      6: [0,0,1,1,0, 0,1,0,0,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      7: [1,1,1,1,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0, 0,1,0,0,0, 0,1,0,0,0],
      8: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0],
      9: [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,1, 0,0,0,0,1, 0,0,0,0,1, 0,1,1,1,0],
    };

    function drawDigit(d, cx, cy, scale, colorR, colorG, colorB) {
      const bits = font[d];
      if (!bits) return;
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 5; x++) {
          if (bits[y * 5 + x]) {
            for (let dy = 0; dy < scale; dy++) {
              for (let dx = 0; dx < scale; dx++) {
                const px = Math.floor(cx + (x - 2) * scale + dx);
                const py = Math.floor(cy + (y - 3) * scale + dy);
                if (px >= 0 && px < size && py >= 0 && py < size) {
                  const idx = (py * size + px) * 4;
                  data[idx] = colorR;
                  data[idx + 1] = colorG;
                  data[idx + 2] = colorB;
                  data[idx + 3] = 255;
                }
              }
            }
          }
        }
      }
    }

    function drawNumber(n, angle, radius, scale) {
      // angle in radians, 0 at 3 o'clock, CCW. Clock 12 is 90 deg.
      // We want 12 at top (90 deg), 3 at right (0 deg).
      // Standard clock: 12 is top.
      const rad = (90 - n * 30) * (Math.PI / 180);
      const x = size / 2 + Math.cos(rad) * radius;
      const y = size / 2 + Math.sin(rad) * radius;

      if (n === 10 || n === 11 || n === 12) {
        // Two digits
        const d1 = Math.floor(n / 10);
        const d2 = n % 10;
        const offset = scale * 3;
        drawDigit(d1, x - offset, y, scale, 100, 100, 100);
        drawDigit(d2, x + offset, y, scale, 100, 100, 100);
      } else {
        drawDigit(n, x, y, scale, 100, 100, 100);
      }
    }

    // Draw numbers 1-12
    for (let i = 1; i <= 12; i++) {
      drawNumber(i, 0, 90, 4);
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  faceMat.map = createClockFaceTexture();

  // --- Geometry Construction ---

  // 1. Glass Body (Extruded Square with Chamfered Corners)
  const bodyShape = new THREE.Shape();
  const s = 0.5; // half-size
  const c = 0.1; // chamfer size
  // Start bottom-left, go clockwise
  bodyShape.moveTo(-s + c, -s);
  bodyShape.lineTo(s - c, -s);
  bodyShape.lineTo(s, -s + c);
  bodyShape.lineTo(s, s - c);
  bodyShape.lineTo(s - c, s);
  bodyShape.lineTo(-s + c, s);
  bodyShape.lineTo(-s, s - c);
  bodyShape.lineTo(-s, -s + c);
  bodyShape.lineTo(-s + c, -s);

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
    steps: 1,
  });
  // Center the extrusion
  bodyGeom.translate(0, 0, -0.15);

  const glassBody = new THREE.Mesh(bodyGeom, glassMat);
  root.add(glassBody);

  // 2. Clock Face (White panel inside)
  const faceGeom = new THREE.PlaneGeometry(0.8, 0.8);
  const clockFace = new THREE.Mesh(faceGeom, faceMat);
  clockFace.position.z = -0.14; // Slightly inside the front glass
  root.add(clockFace);

  // 3. Hands
  // Helper to create a hand
  function createHand(width, length, x, y, z, rotZ) {
    const geom = new THREE.BoxGeometry(width, length, 0.01);
    // Pivot point adjustment: geometry is centered, we want pivot at bottom (or center for clock)
    // Clock hands pivot at center. BoxGeometry is centered.
    const mesh = new THREE.Mesh(geom, handMat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotZ;
    return mesh;
  }

  // Hour Hand (Short, thick) - Pointing to 10 (150 degrees from 3 o'clock CCW? No, clock is CW)
  // 12 is 90 deg. 10 is 150 deg.
  const hourHand = createHand(0.04, 0.25, 0, 0, -0.13, Math.PI * (150 / 180));
  root.add(hourHand);

  // Minute Hand (Long, medium) - Pointing to 2 (30 deg)
  const minuteHand = createHand(0.03, 0.35, 0, 0, -0.13, Math.PI * (30 / 180));
  root.add(minuteHand);

  // Second Hand (Very thin, long) - Pointing to 7 (240 deg)
  const secondHandGeom = new THREE.BoxGeometry(0.01, 0.38, 0.005);
  const secondHand = new THREE.Mesh(secondHandGeom, handMat);
  secondHand.position.set(0, 0, -0.12);
  secondHand.rotation.z = Math.PI * (240 / 180);
  root.add(secondHand);

  // 4. Center Cap
  const capGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.rotation.x = Math.PI / 2;
  cap.position.z = -0.11;
  root.add(cap);

  // Normalize
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