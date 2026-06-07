export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Porcelain: White, glossy ceramic.
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Gold: Metallic trim and handle. Capped metalness at 0.6 for renderer compatibility.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xffd700,
    emissiveIntensity: 0.3,
  });

  // --- Procedural Floral Texture ---
  // Generates a white texture with pink roses and green vines.
  function createFloralTexture() {
    const width = 512;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Fill white background
    for (let i = 0; i < width * height; i++) {
      data[i * 4 + 0] = 255; // R
      data[i * 4 + 1] = 255; // G
      data[i * 4 + 2] = 255; // B
      data[i * 4 + 3] = 255; // A
    }

    // Helper to draw a filled circle
    function drawCircle(cx, cy, r, color) {
      const r2 = r * r;
      const minX = Math.max(0, Math.floor(cx - r));
      const maxX = Math.min(width, Math.ceil(cx + r));
      const minY = Math.max(0, Math.floor(cy - r));
      const maxY = Math.min(height, Math.ceil(cy + r));
      
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2) {
            const idx = (y * width + x) * 4;
            data[idx + 0] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            // Simple alpha blend for softness
            const dist = Math.sqrt(dx*dx + dy*dy);
            const alpha = Math.max(0, 1 - (dist / r));
            data[idx + 3] = Math.min(255, data[idx + 3] * (1 - alpha * 0.8) + color[3] * alpha * 0.8);
          }
        }
      }
    }

    // Helper to draw a vine line
    function drawVine(points, color) {
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i+1];
        const dist = Math.sqrt((p1.x-p0.x)**2 + (p1.y-p0.y)**2);
        const steps = Math.ceil(dist);
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = p0.x + (p1.x - p0.x) * t;
          const y = p0.y + (p1.y - p0.y) * t;
          drawCircle(x, y, 2, color);
        }
      }
    }

    const pink = [230, 100, 120, 255];
    const darkPink = [180, 50, 80, 255];
    const green = [80, 140, 80, 255];
    const lightGreen = [150, 200, 150, 255];

    // Place 3 flower clusters across the texture width
    const clusters = [
      { x: 100, y: 140 },
      { x: 256, y: 120 },
      { x: 412, y: 140 }
    ];

    clusters.forEach(cluster => {
      // Draw vine
      const vinePoints = [
        { x: cluster.x - 40, y: cluster.y + 20 },
        { x: cluster.x - 20, y: cluster.y },
        { x: cluster.x, y: cluster.y - 10 },
        { x: cluster.x + 30, y: cluster.y - 20 },
        { x: cluster.x + 50, y: cluster.y - 10 }
      ];
      drawVine(vinePoints, green);

      // Draw main rose
      drawCircle(cluster.x, cluster.y, 18, pink);
      drawCircle(cluster.x, cluster.y, 10, darkPink);
      
      // Draw buds
      drawCircle(cluster.x + 25, cluster.y - 15, 8, pink);
      drawCircle(cluster.x - 30, cluster.y + 10, 6, pink);

      // Draw leaves
      drawCircle(cluster.x - 15, cluster.y + 10, 10, lightGreen);
      drawCircle(cluster.x + 10, cluster.y - 25, 8, lightGreen);
    });

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;
    return texture;
  }

  const floralTexture = createFloralTexture();
  porcelainMat.map = floralTexture;

  // --- Geometry ---

  // 1. Cup Body (Lathe)
  // Profile points (radius, height)
  const profilePoints = [
    new THREE.Vector2(0, 0),       // Center bottom
    new THREE.Vector2(0.14, 0),    // Foot outer edge
    new THREE.Vector2(0.14, 0.04), // Foot top edge
    new THREE.Vector2(0.11, 0.04), // Cup bottom outer transition
    new THREE.Vector2(0.12, 0.10), // Start of belly curve
    new THREE.Vector2(0.18, 0.25), // Widest part
    new THREE.Vector2(0.20, 0.35), // Rim outer
    new THREE.Vector2(0.21, 0.36), // Rim lip flare
    new THREE.Vector2(0.19, 0.36), // Rim inner edge
    new THREE.Vector2(0.05, 0.05), // Cup bottom inner
    new THREE.Vector2(0, 0.05)     // Center inner
  ];
  
  const cupGeom = new THREE.LatheGeometry(profilePoints, 64);
  // Fix normals for smooth shading
  cupGeom.computeVertexNormals();
  const cupBody = new THREE.Mesh(cupGeom, porcelainMat);
  root.add(cupBody);

  // 2. Handle (Tube)
  // Scrolled C-shape on the +X side
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.19, 0.24, 0),   // Top attachment
    new THREE.Vector3(0.28, 0.24, 0.05), // Curve out and back
    new THREE.Vector3(0.32, 0.18, 0.05), // Middle
    new THREE.Vector3(0.28, 0.12, 0.05), // Curve in
    new THREE.Vector3(0.19, 0.12, 0)    // Bottom attachment
  ]);
  
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.018, 12, false);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  root.add(handle);

  // 3. Rim Trim (Torus)
  // Thin gold ring at the top lip
  const rimGeom = new THREE.TorusGeometry(0.205, 0.006, 16, 64);
  const rimTrim = new THREE.Mesh(rimGeom, goldMat);
  rimTrim.rotation.x = Math.PI / 2;
  rimTrim.position.y = 0.36;
  root.add(rimTrim);

  // 4. Foot Trim (Torus)
  // Thin gold ring at the base of the foot
  const footGeom = new THREE.TorusGeometry(0.14, 0.006, 16, 64);
  const footTrim = new THREE.Mesh(footGeom, goldMat);
  footTrim.rotation.x = Math.PI / 2;
  footTrim.position.y = 0.006;
  root.add(footTrim);

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