export default function generate(THREE) {
  const root = new THREE.Group();

  // --- 1. Procedural Tropical Texture ---
  // Generates a dense floral/leaf pattern deterministically.
  function createTropicalTexture(THREE) {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    
    // Helper to set pixel color
    function setPixel(x, y, r, g, b) {
      const idx = (y * size + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }

    // Helper to draw a filled ellipse (for leaves)
    function drawEllipse(cx, cy, rx, ry, angle, rCol, gCol, bCol) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const minX = Math.floor(cx - rx - ry);
      const maxX = Math.ceil(cx + rx + ry);
      const minY = Math.floor(cy - rx - ry);
      const maxY = Math.ceil(cy + rx + ry);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const dx = x - cx;
          const dy = y - cy;
          // Rotate point back
          const xr = dx * cosA + dy * sinA;
          const yr = -dx * sinA + dy * cosA;
          if ((xr * xr) / (rx * rx) + (yr * yr) / (ry * ry) <= 1.0) {
            setPixel(x, y, rCol, gCol, bCol);
          }
        }
      }
    }

    // Helper to draw a circle (for flowers)
    function drawCircle(cx, cy, r, rCol, gCol, bCol) {
      const r2 = r * r;
      const minX = Math.floor(cx - r);
      const maxX = Math.ceil(cx + r);
      const minY = Math.floor(cy - r);
      const maxY = Math.ceil(cy + r);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (x < 0 || x >= size || y < 0 || y >= size) continue;
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2) {
            setPixel(x, y, rCol, gCol, bCol);
          }
        }
      }
    }

    // Fill background with dark teal/green
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 10;   // R
      data[i + 1] = 60; // G
      data[i + 2] = 50; // B
      data[i + 3] = 255;
    }

    // Deterministic placement of shapes using sine waves to avoid Math.random
    // We create a grid of "slots" and fill them based on index math
    const colors = [
      { r: 40, g: 100, b: 40 },   // Dark Leaf
      { r: 60, g: 140, b: 60 },   // Light Leaf
      { r: 200, g: 60, b: 40 },   // Orange Flower
      { r: 220, g: 60, b: 120 },  // Pink Flower
      { r: 240, g: 200, b: 60 },  // Yellow Flower
      { r: 80, g: 80, b: 180 }    // Blue accent
    ];

    // Generate ~40 shapes
    for (let i = 0; i < 40; i++) {
      // Deterministic pseudo-random positions based on index
      const angleOffset = i * 137.5 * (Math.PI / 180); // Golden angle
      const radiusNorm = 0.3 + 0.6 * ((i % 7) / 7); 
      
      // Map to texture coordinates (0 to size)
      // We distribute them somewhat radially but with noise
      const cx = (size / 2) + Math.cos(angleOffset * 2.5) * (size * 0.4);
      const cy = (size / 2) + Math.sin(angleOffset * 2.5) * (size * 0.4);
      
      const shapeType = i % 3; // 0: Leaf, 1: Leaf, 2: Flower
      const colorIdx = i % colors.length;
      const col = colors[colorIdx];

      if (shapeType === 2) {
        // Flower
        const r = 20 + (i % 5) * 5;
        drawCircle(cx, cy, r, col.r, col.g, col.b);
        // Add center
        drawCircle(cx, cy, r * 0.3, 255, 255, 200);
      } else {
        // Leaf
        const rx = 30 + (i % 8) * 10;
        const ry = 10 + (i % 4) * 5;
        const rot = angleOffset + (i % 3);
        drawEllipse(cx, cy, rx, ry, rot, col.r, col.g, col.b);
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const tropicalMap = createTropicalTexture(THREE);

  // --- 2. Materials ---
  
  // Glass sphere material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    map: tropicalMap,
    side: THREE.DoubleSide
  });

  // Chrome base material
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2
  });

  // --- 3. Geometry & Meshes ---

  // The Sphere
  const sphereGeom = new THREE.SphereGeometry(1, 64, 64);
  const sphere = new THREE.Mesh(sphereGeom, glassMat);
  sphere.name = "glass_sphere";
  root.add(sphere);

  // The Base (Truncated Cone)
  // RadiusTop: 0.6, RadiusBottom: 0.8, Height: 0.15
  const baseGeom = new THREE.CylinderGeometry(0.6, 0.8, 0.15, 32);
  const base = new THREE.Mesh(baseGeom, chromeMat);
  base.name = "chrome_base";
  base.position.y = -1.075; // Sit just below the sphere (radius 1 + half base height)
  root.add(base);

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