export default function generate(THREE) {
  // --- Constants & Configuration ---
  const CUBIE_SIZE = 0.45;
  const GAP = 0.02;
  const GRID_SIZE = 2;
  const TOTAL_SIZE = CUBIE_SIZE * GRID_SIZE + GAP * (GRID_SIZE - 1);

  // --- Material & Texture Generation ---
  // We generate a seamless, psychedelic marble texture procedurally.
  const TEX_SIZE = 512;
  const data = new Uint8Array(TEX_SIZE * TEX_SIZE * 4);
  
  // Color Palette (RGB)
  const colors = [
    [1.0, 0.2, 0.2], // Red
    [1.0, 0.8, 0.2], // Yellow
    [0.2, 0.8, 0.2], // Green
    [0.2, 0.5, 1.0], // Blue
    [0.8, 0.2, 1.0], // Purple
  ];

  for (let y = 0; y < TEX_SIZE; y++) {
    for (let x = 0; x < TEX_SIZE; x++) {
      // Normalize coordinates to 0-1 space, scaled for noise frequency
      const u = x / TEX_SIZE;
      const v = y / TEX_SIZE;
      
      // Deterministic pseudo-noise using trigonometric functions
      // Multiple layers of sine/cosine create organic "blob" shapes
      const freq1 = 8.0;
      const freq2 = 15.0;
      const freq3 = 25.0;
      
      const n1 = Math.sin(u * freq1 + v * freq1);
      const n2 = Math.cos(u * freq2 - v * freq2);
      const n3 = Math.sin((u + v) * freq3);
      
      // Combine noise layers
      let val = (n1 * 0.5 + 0.5) * 0.6 + 
                (n2 * 0.5 + 0.5) * 0.3 + 
                (n3 * 0.5 + 0.5) * 0.1;
      
      // Quantize to palette indices (0 to 4)
      // Add small offsets to val to balance color distribution
      let colorIdx = Math.floor(val * 5.0);
      if (colorIdx < 0) colorIdx = 0;
      if (colorIdx > 4) colorIdx = 4;
      
      const c = colors[colorIdx];
      const idx = (y * TEX_SIZE + x) * 4;
      
      data[idx] = Math.floor(c[0] * 255);
      data[idx + 1] = Math.floor(c[1] * 255);
      data[idx + 2] = Math.floor(c[2] * 255);
      data[idx + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(data, TEX_SIZE, TEX_SIZE, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // We want the pattern to tile exactly once per 2x2 grid area effectively
  // But since we shift UVs per cubie, we set repeat to cover the whole 2x2 span
  texture.repeat.set(0.5, 0.5); 
  texture.needsUpdate = true;

  const plasticMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // --- Geometry Helper ---
  // Clones a box geometry and shifts UVs per face to ensure texture continuity
  // across the 2x2x2 grid boundaries.
  function createAlignedCubieGeometry(gx, gy, gz) {
    const geom = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
    const uv = geom.attributes.uv;
    const groups = geom.groups;
    
    // BoxGeometry groups order: Right, Left, Top, Bottom, Front, Back
    // We shift UVs based on grid position (gx, gy, gz) which are 0 or 1.
    // Shift amount is 0.5 * gridIndex.
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const start = group.start;
      const count = group.count;
      
      for (let j = 0; j < count; j++) {
        const idx = start + j;
        const u = uv.getX(idx);
        const v = uv.getY(idx);
        
        let shiftU = 0;
        let shiftV = 0;
        
        // Face mapping logic based on standard BoxGeometry UVs
        if (i === 0 || i === 1) { 
          // Right/Left: U maps to Z, V maps to Y
          shiftU = gz * 0.5;
          shiftV = gy * 0.5;
        } else if (i === 2 || i === 3) {
          // Top/Bottom: U maps to X, V maps to Z (inverted usually, but shift works same)
          shiftU = gx * 0.5;
          shiftV = gz * 0.5;
        } else if (i === 4 || i === 5) {
          // Front/Back: U maps to X, V maps to Y
          shiftU = gx * 0.5;
          shiftV = gy * 0.5;
        }
        
        uv.setXY(idx, u + shiftU, v + shiftV);
      }
    }
    
    uv.needsUpdate = true;
    return geom;
  }

  // --- Build Object ---
  const root = new THREE.Group();

  for (let gx = 0; gx < GRID_SIZE; gx++) {
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gz = 0; gz < GRID_SIZE; gz++) {
        // Create unique geometry for this cubie to handle UV shifts
        const cubieGeom = createAlignedCubieGeometry(gx, gy, gz);
        const cubie = new THREE.Mesh(cubieGeom, plasticMat);
        
        // Position in grid
        // Center the grid around 0,0,0
        const x = (gx - 0.5) * (CUBIE_SIZE + GAP);
        const y = (gy - 0.5) * (CUBIE_SIZE + GAP);
        const z = (gz - 0.5) * (CUBIE_SIZE + GAP);
        
        cubie.position.set(x, y, z);
        root.add(cubie);
      }
    }
  }

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