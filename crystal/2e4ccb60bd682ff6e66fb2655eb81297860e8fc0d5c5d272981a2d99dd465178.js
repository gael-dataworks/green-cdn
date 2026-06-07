export default function generate(THREE) {
  const root = new THREE.Group();

  // --- 1. Procedural Tropical Texture Generation ---
  // We must use DataTexture because CanvasTexture requires DOM (forbidden).
  // We will draw a dense pattern of leaves and flowers onto a pixel buffer.
  const TEX_SIZE = 512;
  const data = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
  
  // Helper: Deterministic pseudo-random (LCG)
  function lcg(seed) {
    let s = seed;
    return function() {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xFFFFFFFF;
    };
  }

  // Helper: Draw a filled circle/ellipse on the buffer
  function drawShape(cx, cy, rx, ry, angle, color, type) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const r2 = Math.max(rx, ry) + 2; // Bounding box padding
    const minX = Math.max(0, Math.floor(cx - r2));
    const maxX = Math.min(TEX_SIZE, Math.ceil(cx + r2));
    const minY = Math.max(0, Math.floor(cy - r2));
    const maxY = Math.min(TEX_SIZE, Math.ceil(cy + r2));

    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        // Rotate point back to align with axis
        const dx = x - cx;
        const dy = y - cy;
        const rxp = dx * cos + dy * sin;
        const ryp = -dx * sin + dy * cos;
        
        let inside = false;
        if (type === 'circle') {
            inside = (rxp * rxp) / (rx * rx) + (ryp * ryp) / (ry * ry) <= 1.0;
        } else if (type === 'leaf') {
            // Almond shape: wider in middle, pointy ends
            const t = (rxp + rx) / (2 * rx); // 0 to 1
            if (t >= 0 && t <= 1) {
                const widthAtT = ry * Math.sin(t * Math.PI);
                inside = Math.abs(ryp) <= widthAtT;
            }
        } else if (type === 'palm') {
            // Fan shape
            const dist = Math.sqrt(rxp*rxp + ryp*ryp);
            const ang = Math.atan2(ryp, rxp);
            // Cone check
            if (dist < rx && Math.abs(ang) < Math.PI / 4) {
                inside = true;
            }
        }

        if (inside) {
          const idx = (y * TEX_SIZE + x) * 4;
          // Simple alpha blending for soft edges could go here, but direct set is faster
          data[idx] = color.r;
          data[idx + 1] = color.g;
          data[idx + 2] = color.b;
          data[idx + 3] = 255; // Opaque
        }
      }
    }
  }

  // Fill background (white/very light gray inside the glass)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 245;
    data[i + 1] = 245;
    data[i + 2] = 245;
    data[i + 3] = 255;
  }

  // Draw Pattern
  const gridSize = 14;
  const cellSize = TEX_SIZE / gridSize;
  
  // Palettes
  const greens = [
    {r: 34, g: 139, b: 34},   // Forest
    {r: 0, g: 100, b: 0},     // Dark Green
    {r: 60, g: 179, b: 113},  // Medium Sea
    {r: 144, g: 238, b: 144}  // Light
  ];
  const flowers = [
    {r: 255, g: 69, b: 0},    // Orange Red
    {r: 255, g: 215, b: 0},   // Gold
    {r: 255, g: 105, b: 180}, // Hot Pink
    {r: 220, g: 20, b: 60}    // Crimson
  ];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const rand = lcg(gy * 100 + gx);
      const cx = (gx + 0.5) * cellSize + (rand() - 0.5) * cellSize * 0.5;
      const cy = (gy + 0.5) * cellSize + (rand() - 0.5) * cellSize * 0.5;
      const angle = rand() * Math.PI * 2;
      const typeRoll = rand();

      if (typeRoll < 0.6) {
        // Leaf
        const gCol = greens[Math.floor(rand() * greens.length)];
        const w = cellSize * (0.6 + rand() * 0.4);
        const h = cellSize * (0.3 + rand() * 0.3);
        const shape = rand() > 0.5 ? 'leaf' : 'circle'; // Monstera vs generic
        drawShape(cx, cy, w, h, angle, gCol, shape);
        
        // Add veins/details for monstera-ish look (simplified as smaller circles)
        if (shape === 'circle' && rand() > 0.5) {
             drawShape(cx, cy, w*0.3, h*0.3, angle, {r:0,g:50,b:0}, 'circle');
        }
      } else if (typeRoll < 0.9) {
        // Flower
        const fCol = flowers[Math.floor(rand() * flowers.length)];
        const r = cellSize * (0.3 + rand() * 0.2);
        // Draw petals
        for (let p = 0; p < 5; p++) {
            const pa = angle + (p / 5) * Math.PI * 2;
            const px = cx + Math.cos(pa) * r * 0.6;
            const py = cy + Math.sin(pa) * r * 0.6;
            drawShape(px, py, r * 0.5, r * 0.3, pa, fCol, 'circle');
        }
        // Center
        drawShape(cx, cy, r * 0.3, r * 0.3, 0, {r:255, g:255, b:0}, 'circle');
      } else {
        // Palm frond
        const gCol = greens[Math.floor(rand() * greens.length)];
        drawShape(cx, cy, cellSize * 0.8, cellSize * 0.2, angle, gCol, 'palm');
      }
    }
  }

  const texture = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  // Wrap so the pattern flows continuously if possible, though grid makes seams visible. 
  // For a sphere, ClampToEdge or Repeat is fine. Let's use Repeat to cover the whole sphere uniformly.
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // --- 2. Materials ---

  // Glass Sphere Material
  // High transmission, low roughness, with the tropical map
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    map: texture,
    side: THREE.DoubleSide
  });

  // Metallic Base Material
  // Brushed aluminum/steel look
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3
  });

  // --- 3. Geometry & Meshes ---

  // Sphere
  const sphereGeom = new THREE.SphereGeometry(1, 64, 64);
  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  root.add(sphere);

  // Base
  // Tapered cylinder (frustum)
  const baseGeom = new THREE.CylinderGeometry(0.6, 0.8, 0.15, 32);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -1.0; // Sit just below the sphere
  root.add(base);
  
  // Add a small rim detail to the base for realism
  const rimGeom = new THREE.TorusGeometry(0.6, 0.03, 16, 64);
  const rim = new THREE.Mesh(rimGeom, baseMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = -1.0 + 0.075; // Mid-height of base
  root.add(rim);

  // --- 4. Normalization ---
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