export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Peach skin material: matte, fuzzy, high roughness.
  const peachSkinMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base color overridden by map
    roughness: 0.85,
    metalness: 0.0,
  });

  // Stem material: woody, dark, rough.
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.9,
    metalness: 0.0,
  });

  // --- Procedural Texture for Peach Skin ---
  // Creates yellow base, pink blush, and lenticel speckles deterministically.
  function createPeachTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (x + y * size) * 4;
        
        // Normalized coordinates -1 to 1
        const u = (x / size) * 2 - 1;
        const v = (y / size) * 2 - 1;
        
        // Deterministic noise using sin/cos combinations
        const noise = Math.sin(u * 20.0) * Math.cos(v * 20.0) * 0.5 + 0.5;
        const noise2 = Math.sin(u * 50.0 + v * 30.0) * 0.5 + 0.5;
        
        // Base color: Pale yellow/cream
        let r = 255;
        let g = 245;
        let b = 200;
        
        // Blush: Pinkish red, concentrated on one side and top
        // Using a gradient based on 'u' and 'v' to simulate lighting/color variation
        const blushMask = Math.max(0, Math.sin(u * 3.0 + 1.5) * 0.6 + 0.4) * 
                          Math.max(0, Math.cos(v * 2.0) * 0.5 + 0.5);
        
        if (blushMask > 0.3) {
          const blend = blushMask * noise;
          r = r * (1 - blend) + 255 * blend;
          g = g * (1 - blend) + 150 * blend;
          b = b * (1 - blend) + 150 * blend;
        }
        
        // Speckles (Lenticels): Small dark dots
        if (noise2 > 0.92) {
          r = 180;
          g = 160;
          b = 100;
        }
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  peachSkinMat.map = createPeachTexture();

  // --- Geometry: Peach Body ---
  // Start with a sphere and modify vertices to create the characteristic cleft and shape.
  const peachBodyGeom = new THREE.SphereGeometry(1, 64, 64);
  const posAttr = peachBodyGeom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    // Spherical coordinates
    const r = vertex.length();
    const theta = Math.atan2(vertex.z, vertex.x); // Angle around Y
    const phi = Math.acos(vertex.y / r); // Angle from Y pole
    
    let newR = r;
    
    // 1. Flatten slightly (Peaches are oblate)
    // Scale Y slightly less than X/Z
    // We do this by modifying the vertex directly after normalization if needed, 
    // but easier to just scale the mesh later. Let's keep geometry unit sphere for now 
    // and shape it via radius modification.
    
    // 2. Create the Cleft (Suture)
    // The cleft is along one side (let's say +Z, theta ~ 0 or PI/2 depending on orientation)
    // Let's align cleft to +Z axis (theta = PI/2).
    // We reduce radius where theta is near PI/2.
    // Also, cleft is deeper at the top (stem end, y > 0) and fades at bottom.
    
    const angleToCleft = Math.abs(theta - Math.PI / 2);
    const cleftFactor = Math.max(0, 1.0 - angleToCleft * 4.0); // Narrow influence
    
    const verticalFade = Math.max(0, vertex.y); // 1 at top, 0 at bottom
    const cleftDepth = 0.15 * cleftFactor * verticalFade;
    
    newR -= cleftDepth;
    
    // 3. Stem Cavity (Indentation at top)
    if (vertex.y > 0.6) {
      const topFade = (vertex.y - 0.6) / 0.4; // 0 at 0.6, 1 at 1.0
      newR -= 0.1 * topFade;
    }
    
    // 4. Organic Noise (Subtle bumps)
    const noise = Math.sin(theta * 10.0) * Math.cos(phi * 10.0) * 0.02;
    newR += noise;
    
    // Apply new radius
    vertex.normalize().multiplyScalar(newR);
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  peachBodyGeom.computeVertexNormals();

  const peachBody = new THREE.Mesh(peachBodyGeom, peachSkinMat);
  // Rotate so cleft faces somewhat forward/side, and flatten slightly
  peachBody.scale.set(1.0, 0.9, 1.0); 
  root.add(peachBody);

  // --- Geometry: Stem ---
  // Small woody stub in the cavity
  const stemGeom = new THREE.CylinderGeometry(0.03, 0.05, 0.12, 8);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  // Position at top indentation
  stem.position.set(0, 0.95, 0);
  // Rotate to look natural (slightly angled)
  stem.rotation.z = Math.PI / 8;
  stem.rotation.x = Math.PI / 10;
  root.add(stem);

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