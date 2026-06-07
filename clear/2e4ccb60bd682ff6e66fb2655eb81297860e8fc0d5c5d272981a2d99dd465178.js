export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glossy sphere material (glass/ceramic look)
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.0, // Opaque surface with print
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Polished metal base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Procedural Texture Generation (Tropical Pattern) ---
  // We generate a 512x512 texture with deterministic "painted" leaves and flowers.
  const texWidth = 512;
  const texHeight = 512;
  const data = new Uint8Array(texWidth * texHeight * 4);

  // Helper to set pixel color
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= texWidth || y < 0 || y >= texHeight) return;
    const idx = (y * texWidth + x) * 4;
    // Simple alpha blending with white background
    const bg = 245; // Off-white background
    const alpha = a / 255;
    data[idx] = r * alpha + bg * (1 - alpha);
    data[idx + 1] = g * alpha + bg * (1 - alpha);
    data[idx + 2] = b * alpha + bg * (1 - alpha);
    data[idx + 3] = 255;
  }

  // Fill background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 245;
    data[i + 1] = 248;
    data[i + 2] = 250;
    data[i + 3] = 255;
  }

  // Deterministic pseudo-random generator for placement
  function pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  // Draw filled ellipse
  function drawEllipse(cx, cy, rx, ry, angle, r, g, b) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const minX = Math.max(0, Math.floor(cx - rx - 1));
    const maxX = Math.min(texWidth, Math.ceil(cx + rx + 1));
    const minY = Math.max(0, Math.floor(cy - ry - 1));
    const maxY = Math.min(texHeight, Math.ceil(cy + ry + 1));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        // Rotate point back
        const rxp = dx * cosA + dy * sinA;
        const ryp = -dx * sinA + dy * cosA;
        if ((rxp * rxp) / (rx * rx) + (ryp * ryp) / (ry * ry) <= 1.0) {
          setPixel(x, y, r, g, b);
        }
      }
    }
  }

  // Draw a simple flower cluster
  function drawFlower(cx, cy, scale, colorR, colorG, colorB, seed) {
    const petals = 5;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2 + seed;
      const px = cx + Math.cos(angle) * scale * 15;
      const py = cy + Math.sin(angle) * scale * 15;
      drawEllipse(px, py, scale * 12, scale * 6, angle + Math.PI / 2, colorR, colorG, colorB);
    }
    // Center
    drawEllipse(cx, cy, scale * 8, scale * 8, 0, 255, 255, 100);
  }

  // Draw a leaf
  function drawLeaf(cx, cy, scale, angle, seed) {
    const length = scale * (30 + pseudoRandom(seed) * 20);
    const width = scale * (10 + pseudoRandom(seed + 1) * 5);
    // Main leaf body
    drawEllipse(cx, cy, length, width, angle, 34, 139, 34); // Forest Green
    // Vein (darker)
    drawEllipse(cx, cy, length * 0.8, width * 0.2, angle, 0, 100, 0);
  }

  // Populate texture deterministically
  let seed = 0;
  for (let i = 0; i < 40; i++) {
    seed += 1;
    const x = pseudoRandom(seed) * texWidth;
    const y = pseudoRandom(seed + 0.5) * texHeight;
    const type = pseudoRandom(seed + 1) > 0.6 ? 'flower' : 'leaf';
    const scale = 0.8 + pseudoRandom(seed + 2) * 0.5;
    const angle = pseudoRandom(seed + 3) * Math.PI * 2;

    if (type === 'leaf') {
      // Vary leaf colors slightly
      const gVal = 100 + Math.floor(pseudoRandom(seed + 4) * 100);
      drawLeaf(x, y, scale, angle, seed);
    } else {
      // Flower colors: Orange, Pink, Yellow
      const fType = Math.floor(pseudoRandom(seed + 4) * 3);
      if (fType === 0) drawFlower(x, y, scale, 255, 140, 0, seed); // Orange
      else if (fType === 1) drawFlower(x, y, scale, 255, 105, 180, seed); // Pink
      else drawFlower(x, y, scale, 255, 215, 0, seed); // Yellow
    }
  }

  const patternTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  patternTexture.colorSpace = THREE.SRGBColorSpace;
  patternTexture.needsUpdate = true;
  patternTexture.wrapS = THREE.RepeatWrapping;
  patternTexture.wrapT = THREE.RepeatWrapping;
  // Adjust mapping to fit sphere nicely
  patternTexture.repeat.set(1, 1);

  sphereMat.map = patternTexture;

  // --- Geometry Construction ---

  // 1. The Sphere Body
  const sphereRadius = 1.0;
  const sphereGeom = new THREE.SphereGeometry(sphereRadius, 48, 48);
  const sphereBody = new THREE.Mesh(sphereGeom, sphereMat);
  root.add(sphereBody);

  // 2. The Metal Base
  // Flared cylinder: top radius smaller than bottom radius
  const baseTopRadius = 0.45;
  const baseBottomRadius = 0.65;
  const baseHeight = 0.15;
  const baseGeom = new THREE.CylinderGeometry(baseTopRadius, baseBottomRadius, baseHeight, 48);
  const metalBase = new THREE.Mesh(baseGeom, baseMat);
  // Position base so top is flush with sphere bottom
  metalBase.position.y = -sphereRadius - baseHeight / 2;
  root.add(metalBase);

  // Optional: A thin ring at the junction for detail
  const ringGeom = new THREE.TorusGeometry(baseTopRadius, 0.02, 16, 48);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, roughness: 0.3 });
  const junctionRing = new THREE.Mesh(ringGeom, ringMat);
  junctionRing.rotation.x = Math.PI / 2;
  junctionRing.position.y = -sphereRadius;
  root.add(junctionRing);

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