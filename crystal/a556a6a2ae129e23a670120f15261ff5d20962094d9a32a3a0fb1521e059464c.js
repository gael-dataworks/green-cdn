export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Palette ---
  const CUBE_SIZE = 0.48; // Slightly less than 0.5 to leave gaps
  const GAP = 0.02;
  const OFFSET = (CUBE_SIZE + GAP) / 2;
  
  // Vibrant palette matching the reference
  const COLORS = {
    red: 0xe63946,
    yellow: 0xffdd00,
    green: 0x2a9d8f,
    blue: 0x457b9d, // Actually a bit darker blue in ref, let's use brighter
    blueBright: 0x0077b6,
    purple: 0x7209b7,
    orange: 0xf77f00,
    white: 0xf1faee
  };

  const PALETTE = [
    COLORS.red, COLORS.yellow, COLORS.green, COLORS.blueBright, COLORS.purple, COLORS.orange
  ];

  // --- Texture Generation ---
  // Deterministic pseudo-random number generator
  function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  function createDripTexture(seed) {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    const rng = mulberry32(seed);

    // Pick background color
    const bgIdx = Math.floor(rng() * PALETTE.length);
    const bgColor = PALETTE[bgIdx];
    const bgR = (bgColor >> 16) & 0xff;
    const bgG = (bgColor >> 8) & 0xff;
    const bgB = bgColor & 0xff;

    // Fill background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = bgR;
      data[i + 1] = bgG;
      data[i + 2] = bgB;
      data[i + 3] = 255;
    }

    // Helper to draw a filled ellipse/blob
    function drawBlob(cx, cy, rx, ry, colorHex, angle) {
      const r = (colorHex >> 16) & 0xff;
      const g = (colorHex >> 8) & 0xff;
      const b = colorHex & 0xff;
      
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Transform point to ellipse local space
          const dx = x - cx;
          const dy = y - cy;
          const rx_ = dx * cosA - dy * sinA;
          const ry_ = dx * sinA + dy * cosA;
          
          const dist = (rx_ * rx_) / (rx * rx) + (ry_ * ry_) / (ry * ry);
          
          if (dist <= 1.0) {
            const idx = (y * width + x) * 4;
            // Simple alpha blend for soft edges if desired, but solid is fine for plastic
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    // Draw 2-4 blobs
    const numBlobs = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < numBlobs; i++) {
      const cx = rng() * width;
      const cy = rng() * height;
      // Elongated vertically for "drip" effect
      const rx = 30 + rng() * 60; 
      const ry = 40 + rng() * 80;
      const angle = (rng() - 0.5) * 1.5; // Slight tilt
      
      // Pick a color different from background
      let colorIdx = Math.floor(rng() * PALETTE.length);
      while (colorIdx === bgIdx) {
        colorIdx = Math.floor(rng() * PALETTE.length);
      }
      
      drawBlob(cx, cy, rx, ry, PALETTE[colorIdx], angle);
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Wrap to avoid seams if UVs go slightly out, though box UVs are usually 0-1
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  }

  // Generate 6 unique face textures (Front, Back, Left, Right, Top, Bottom)
  // To make it look like the reference where every sub-cube face is unique,
  // we actually need unique textures per sub-cube face.
  // However, to save memory/draw calls, we can reuse a set of patterns.
  // Let's create 12 distinct patterns and assign them pseudo-randomly.
  const textures = [];
  for (let i = 0; i < 12; i++) {
    textures.push(createDripTexture(i * 1337));
  }

  // Create materials array for the 6 faces of a cube
  // We will create 8 sets of materials, one for each sub-cube position
  const cubeMaterials = [];
  
  for (let c = 0; c < 8; c++) {
    const mats = [];
    // Order: Right, Left, Top, Bottom, Front, Back
    for (let f = 0; f < 6; f++) {
      const texIdx = (c * 6 + f) % 12;
      mats.push(new THREE.MeshStandardMaterial({
        map: textures[texIdx],
        roughness: 0.25,
        metalness: 0.1,
        color: 0xffffff
      }));
    }
    cubeMaterials.push(mats);
  }

  // --- Geometry ---
  // Single geometry reused for all cubes
  const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

  // --- Assembly ---
  // 8 cubes at corners of a 2x2x2 grid
  // Coordinates: -0.25, +0.25 (approx)
  const positions = [
    { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },  { x: 1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 },  { x: 1, y: -1, z: 1 },
    { x: -1, y: 1, z: 1 },   { x: 1, y: 1, z: 1 }
  ];

  // Map logical positions to actual 3D coordinates
  // The reference shows a specific orientation.
  // Let's just place them in a grid.
  let idx = 0;
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        const posX = (x - 0.5) * (CUBE_SIZE + GAP);
        const posY = (y - 0.5) * (CUBE_SIZE + GAP);
        const posZ = (z - 0.5) * (CUBE_SIZE + GAP);
        
        const mesh = new THREE.Mesh(geometry, cubeMaterials[idx]);
        mesh.position.set(posX, posY, posZ);
        root.add(mesh);
        idx++;
      }
    }
  }

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