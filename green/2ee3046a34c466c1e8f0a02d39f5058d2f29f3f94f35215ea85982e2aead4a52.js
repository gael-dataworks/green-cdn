export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic material with a procedural texture for glaze variation and holes.
  // Base color is a warm stoneware tan.
  const ceramicColor = new THREE.Color(0xa68360);
  const holeColor = new THREE.Color(0x5e4b35);
  
  // Generate a procedural texture for the colander surface.
  // This texture will contain the pattern of holes (alpha transparency) 
  // and some noise for the glaze texture.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Helper to set pixel
  function setPixel(x, y, r, g, b, a) {
    const idx = (y * texSize + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // Fill background with base ceramic color + noise
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // Simple deterministic noise based on coordinates
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 10;
      const r = Math.min(255, Math.max(0, ceramicColor.r * 255 + noise));
      const g = Math.min(255, Math.max(0, ceramicColor.g * 255 + noise));
      const b = Math.min(255, Math.max(0, ceramicColor.b * 255 + noise));
      setPixel(x, y, r, g, b, 255);
    }
  }

  // Draw holes (rows of circles)
  // The LatheGeometry UVs map U to angle (0 to 1 around) and V to height (0 to 1 up).
  // We want rows of holes horizontally.
  const holeRows = 6;
  const holesPerRowBase = 12; // Approximate, will vary by row width in 3D but texture is 2D
  
  for (let r = 0; r < holeRows; r++) {
    const vy = 0.2 + (r * 0.55 / holeRows); // Distribute vertically from 20% to 75% height
    const y = Math.floor(vy * texSize);
    const radiusPx = texSize * 0.025; // Hole size in texture pixels
    
    // Number of holes varies slightly to look organic or just fixed grid
    const count = 14 + (r % 3); 
    
    for (let i = 0; i < count; i++) {
      const vx = (i / count); // Spread across width
      const x = Math.floor(vx * texSize);
      
      // Draw a circle
      for (let dy = -radiusPx; dy <= radiusPx; dy++) {
        for (let dx = -radiusPx; dx <= radiusPx; dx++) {
          if (dx*dx + dy*dy <= radiusPx*radiusPx) {
            const px = Math.floor(x + dx);
            const py = Math.floor(y + dy);
            if (px >= 0 && px < texSize && py >= 0 && py < texSize) {
              // Make hole dark and transparent
              setPixel(px, py, holeColor.r * 255, holeColor.g * 255, holeColor.b * 255, 0);
            }
          }
        }
      }
    }
  }

  const surfaceTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  surfaceTexture.colorSpace = THREE.SRGBColorSpace;
  surfaceTexture.wrapS = THREE.RepeatWrapping;
  surfaceTexture.wrapT = THREE.ClampToEdgeWrapping;
  surfaceTexture.needsUpdate = true;

  const ceramicMat = new THREE.MeshStandardMaterial({
    map: surfaceTexture,
    color: 0xffffff, // Multiply with texture
    metalness: 0.0,
    roughness: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.5 // Cut out the transparent holes
  });

  // --- Geometry Construction ---

  // 1. Main Bowl Body (Lathe)
  // Profile points (radius, height)
  // Start bottom center, go out to foot, up side, in to rim, down inside, close center.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.09, 0.00), // Foot bottom edge
    new THREE.Vector2(0.09, 0.04), // Foot top
    new THREE.Vector2(0.14, 0.05), // Bowl bottom outer curve start
    new THREE.Vector2(0.24, 0.30), // Bowl widest point
    new THREE.Vector2(0.27, 0.42), // Rim outer edge
    new THREE.Vector2(0.29, 0.44), // Rim lip
    new THREE.Vector2(0.26, 0.44), // Rim inner top
    new THREE.Vector2(0.12, 0.35), // Bowl inner bottom
    new THREE.Vector2(0.00, 0.35)  // Close top center (optional, creates solid top if not careful, but lathe closes it)
  ];
  
  // Actually, for a colander, we don't want a solid top cap, we want an open bowl.
  // The profile should define the thickness.
  // Let's redefine profile for a hollow bowl with thickness.
  // Outer profile: Bottom -> Side -> Rim
  // Inner profile: Rim Inner -> Side Inner -> Bottom Inner
  // LatheGeometry takes a single shape. If we define a closed shape (like a 'C' cross section), it makes a solid shell.
  
  const shellProfile = [
    new THREE.Vector2(0.09, 0.00), // Outer Foot Bottom
    new THREE.Vector2(0.09, 0.04), // Outer Foot Top
    new THREE.Vector2(0.14, 0.06), // Outer Bowl Bottom
    new THREE.Vector2(0.24, 0.32), // Outer Bowl Side
    new THREE.Vector2(0.27, 0.43), // Outer Rim
    new THREE.Vector2(0.29, 0.45), // Outer Lip
    new THREE.Vector2(0.26, 0.45), // Inner Rim Top
    new THREE.Vector2(0.25, 0.43), // Inner Rim
    new THREE.Vector2(0.22, 0.32), // Inner Bowl Side
    new THREE.Vector2(0.13, 0.06), // Inner Bowl Bottom
    new THREE.Vector2(0.10, 0.04), // Inner Foot Top
    new THREE.Vector2(0.10, 0.00)  // Inner Foot Bottom
  ];

  const bowlGeom = new THREE.LatheGeometry(shellProfile, 32);
  // Rotate geometry so it sits upright (Lathe builds around Y, profile is in XY plane)
  // The profile defined above assumes Y is up, X is radius. This is correct for Lathe.
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  // Center the bowl roughly
  bowl.position.y = 0.0; 
  root.add(bowl);

  // 2. Handle
  // A flattened box extending from the rim.
  const handleW = 0.06;
  const handleH = 0.015;
  const handleD = 0.12;
  const handleGeom = new THREE.BoxGeometry(handleW, handleH, handleD);
  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  // Position: Attached to the side of the rim.
  // Rim is at radius ~0.27, height ~0.44.
  handle.position.set(0.27 + handleW/2, 0.44, 0);
  // Rotate to align with radius if needed, but box is fine.
  // Add a slight slope upwards
  handle.rotation.x = -0.1;
  root.add(handle);
  
  // Handle Hole (the loop at the end of the handle)
  const loopGeom = new THREE.TorusGeometry(0.025, 0.008, 8, 16);
  const loop = new THREE.Mesh(loopGeom, ceramicMat);
  loop.position.set(0.27 + handleW + 0.025, 0.44, 0);
  loop.rotation.y = Math.PI / 2; // Stand up vertically
  root.add(loop);

  // 3. Foot Base (Separate mesh to ensure clean bottom if lathe is tricky)
  // The lathe profile already includes the foot, so this might be redundant, 
  // but let's add a slight distinct base if needed. 
  // Actually, the profile covers it. I'll skip a separate foot mesh to avoid z-fighting.

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