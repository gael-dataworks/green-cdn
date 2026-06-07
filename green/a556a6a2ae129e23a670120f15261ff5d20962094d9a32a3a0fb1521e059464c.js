export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants & Dimensions ---
  const CUBIE_SIZE = 0.48;
  const GAP = 0.04;
  const OFFSET = (CUBIE_SIZE + GAP) / 2; // 0.26
  const TEX_SIZE = 128;

  // --- Color Palette (Vibrant, matching reference) ---
  const COLORS = {
    red: 0xff4d4d,
    yellow: 0xffd93d,
    green: 0x6bcb77,
    blue: 0x4d96ff,
    purple: 0x9b5de5,
    orange: 0xff9f4d,
    white: 0xffffff,
  };

  // --- Material Base ---
  // Glossy plastic: low roughness, zero metalness, slight transmission for depth
  const baseMatProps = {
    metalness: 0.0,
    roughness: 0.25,
  };

  // --- Texture Generation Helper ---
  // Creates a deterministic "blobby" pattern texture
  function createBlobTexture(seed, baseHex, accentHexs) {
    const W = TEX_SIZE;
    const H = TEX_SIZE;
    const data = new Uint8Array(W * H * 4);
    
    // Parse base color
    const baseCol = new THREE.Color(baseHex);
    const r0 = Math.floor(baseCol.r * 255);
    const g0 = Math.floor(baseCol.g * 255);
    const b0 = Math.floor(baseCol.b * 255);

    // Fill background
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r0;
      data[i + 1] = g0;
      data[i + 2] = b0;
      data[i + 3] = 255;
    }

    // Draw deterministic blobs
    const numBlobs = 5;
    const accentColors = accentHexs.map(h => new THREE.Color(h));

    for (let b = 0; b < numBlobs; b++) {
      // Deterministic pseudo-random positions and radius
      const bx = (Math.sin(seed * (b + 1) * 12.9898) * 0.4 + 0.5) * W;
      const by = (Math.cos(seed * (b + 1) * 78.233) * 0.4 + 0.5) * H;
      const br = (Math.sin(seed * (b + 1) * 53.53) * 0.3 + 0.5) * (W * 0.35);
      
      const aCol = accentColors[b % accentColors.length];
      const r1 = Math.floor(aCol.r * 255);
      const g1 = Math.floor(aCol.g * 255);
      const b1 = Math.floor(aCol.b * 255);

      const br2 = br * br;

      // Draw circle
      const minX = Math.max(0, Math.floor(bx - br));
      const maxX = Math.min(W, Math.ceil(bx + br));
      const minY = Math.max(0, Math.floor(by - br));
      const maxY = Math.min(H, Math.ceil(by + br));

      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const dx = x - bx;
          const dy = y - by;
          if (dx * dx + dy * dy < br2) {
            const idx = (y * W + x) * 4;
            // Simple alpha blend for soft edges could go here, but hard cut is fine for stylized
            data[idx] = r1;
            data[idx + 1] = g1;
            data[idx + 2] = b1;
            // Keep alpha 255
          }
        }
      }
    }

    const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter; // Smooth out the 128x128 pixels
    return tex;
  }

  // --- Texture Cache to save memory ---
  const textureCache = new Map();
  function getTexture(configKey, baseHex, accents) {
    if (textureCache.has(configKey)) return textureCache.get(configKey);
    const tex = createBlobTexture(configKey, baseHex, accents);
    textureCache.set(configKey, tex);
    return tex;
  }

  // --- Define Pattern Configs (Base, [Accents]) ---
  // We create ~8 distinct looks to distribute across the 48 faces
  const patterns = [
    { key: 1, base: COLORS.green, accents: [COLORS.yellow, COLORS.red] },
    { key: 2, base: COLORS.blue, accents: [COLORS.purple, COLORS.green] },
    { key: 3, base: COLORS.yellow, accents: [COLORS.red, COLORS.blue] },
    { key: 4, base: COLORS.red, accents: [COLORS.yellow, COLORS.purple] },
    { key: 5, base: COLORS.purple, accents: [COLORS.blue, COLORS.red] },
    { key: 6, base: COLORS.orange, accents: [COLORS.yellow, COLORS.red] },
    { key: 7, base: COLORS.green, accents: [COLORS.blue, COLORS.yellow] },
    { key: 8, base: COLORS.blue, accents: [COLORS.yellow, COLORS.red] },
  ];

  // --- Build 8 Cubies ---
  const geom = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 8, 8, 8);

  for (let xIdx = -1; xIdx <= 1; xIdx += 2) {
    for (let yIdx = -1; yIdx <= 1; yIdx += 2) {
      for (let zIdx = -1; zIdx <= 1; zIdx += 2) {
        
        // Determine position
        const px = xIdx * OFFSET;
        const py = yIdx * OFFSET;
        const pz = zIdx * OFFSET;

        // Assign materials to 6 faces: Right, Left, Top, Bottom, Front, Back
        // We pick patterns deterministically based on face index and cubie position
        // to ensure variety without manual mapping of 48 faces.
        const mats = [];
        const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];
        
        for (let f = 0; f < 6; f++) {
          // Create a unique seed for this specific face of this specific cubie
          // This ensures adjacent faces look different but coherent
          const uniqueSeed = Math.abs(xIdx * 100 + yIdx * 10 + zIdx * 1 + f * 1000);
          const pConfig = patterns[uniqueSeed % patterns.length];
          
          const tex = getTexture(uniqueSeed, pConfig.base, pConfig.accents);
          mats.push(new THREE.MeshStandardMaterial({
            ...baseMatProps,
            map: tex,
          }));
        }

        const cubie = new THREE.Mesh(geom, mats);
        cubie.position.set(px, py, pz);
        
        // Name for critic targeting
        cubie.name = `cubie_x${xIdx}_y${yIdx}_z${zIdx}`;
        
        root.add(cubie);
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