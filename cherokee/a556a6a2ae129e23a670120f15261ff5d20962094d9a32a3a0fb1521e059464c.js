export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Configuration ---
  const subCubeSize = 0.46;
  const gap = 0.02;
  const offset = (subCubeSize + gap) / 2;
  
  // Palette from reference
  const colors = [
    0xE63946, // Red
    0x457B9D, // Blue
    0x2A9D8F, // Green
    0xF4D03F, // Yellow
    0x9B59B6, // Purple
    0xE67E22  // Orange
  ];

  // --- Helper: Deterministic Pseudo-Random ---
  function hash(x, y, seed) {
    let n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  // --- Helper: Generate Wavy Pattern Texture ---
  function createPatternTexture(seed) {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
    // Create a base noise field
    const noiseField = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Combine multiple sine waves for organic "lava lamp" feel
        const v1 = Math.sin(x * 0.05 + seed) * Math.cos(y * 0.05 + seed);
        const v2 = Math.sin(x * 0.02 - y * 0.03 + seed * 2);
        const v3 = hash(x, y, seed);
        const val = (v1 + v2 + v3) / 3.0; // Normalize roughly -1 to 1
        noiseField.push(val);
      }
    }

    // Map noise to colors
    for (let i = 0; i < size * size; i++) {
      const val = noiseField[i];
      // Quantize into 6 color bands
      const band = Math.floor((val + 1.5) / 3.0 * 6) % 6; 
      const color = colors[Math.abs(band)];
      
      const r = (color >> 16) & 255;
      const g = (color >> 8) & 255;
      const b = color & 255;
      
      const idx = i * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Important for mapping quadrants later
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  // --- Create 6 Face Textures (one for each side of the big cube) ---
  // Seeds ensure each face has a unique pattern
  const texRight  = createPatternTexture(1);
  const texLeft   = createPatternTexture(2);
  const texTop    = createPatternTexture(3);
  const texBottom = createPatternTexture(4);
  const texFront  = createPatternTexture(5);
  const texBack   = createPatternTexture(6);

  // --- Create Materials ---
  const plasticMatProps = {
    roughness: 0.3,
    metalness: 0.1,
  };

  const matRight  = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texRight });
  const matLeft   = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texLeft });
  const matTop    = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texTop });
  const matBottom = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texBottom });
  const matFront  = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texFront });
  const matBack   = new THREE.MeshStandardMaterial({ ...plasticMatProps, map: texBack });

  // Base geometry for sub-cubes (slightly rounded via segments)
  const baseGeom = new THREE.BoxGeometry(subCubeSize, subCubeSize, subCubeSize, 4, 4, 4);

  // --- Build 2x2x2 Grid ---
  // Coordinates: -1 (left/bottom/back) to 1 (right/top/front)
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        
        // Clone geometry to modify UVs independently per sub-cube
        const geom = baseGeom.clone();
        const uvAttribute = geom.attributes.uv;
        
        // We need to adjust UVs for each face of this sub-cube so it samples
        // the correct quadrant of the global face texture.
        // BoxGeometry face order: 0:+x, 1:-x, 2:+y, 3:-y, 4:+z, 5:-z
        // Each face has 4 vertices (2 triangles = 6 vertices in index, but 4 unique UVs usually)
        // BoxGeometry in Three.js usually has 24 vertices (4 per face).
        
        // Helper to scale/offset UVs for a specific face range
        // verticesPerFace = 4 (for BoxGeometry with default indexing per face)
        // Actually BoxGeometry has 54 vertices (6 faces * 9 verts for 4 segments? No.)
        // Let's iterate by groups.
        
        const groups = geom.groups; // Should be 6 groups
        for (let g = 0; g < groups.length; g++) {
          const start = groups[g].start;
          const count = groups[g].count;
          
          // Determine which global texture quadrant this face corresponds to
          let uOffset = 0, vOffset = 0;
          let uScale = 0.5, vScale = 0.5;
          
          // Face 0: +X (Right). Visible if x === 1. Maps Z(u), Y(v).
          if (g === 0) { 
            if (x === 1) { // Visible
               uOffset = (z === 1) ? 0.5 : 0.0; // Z maps to U
               vOffset = (y === 1) ? 0.5 : 0.0; // Y maps to V
            }
          }
          // Face 1: -X (Left). Visible if x === -1. Maps Z(u), Y(v).
          else if (g === 1) {
            if (x === -1) {
               uOffset = (z === 1) ? 0.5 : 0.0;
               vOffset = (y === 1) ? 0.5 : 0.0;
            }
          }
          // Face 2: +Y (Top). Visible if y === 1. Maps X(u), Z(v).
          else if (g === 2) {
            if (y === 1) {
               uOffset = (x === 1) ? 0.5 : 0.0; // X maps to U
               vOffset = (z === 1) ? 0.5 : 0.0; // Z maps to V (inverted in UV usually? BoxGeom +Y is XZ)
               // Three.js BoxGeometry +Y UVs: X is U, -Z is V? Let's assume standard 0..1 mapping
               // Standard BoxGeometry +Y: u=X, v=Z (or -Z). Let's stick to 0..1 logic.
               // If z=1 (front), we want bottom half or top half?
               // Let's assume standard mapping: u=x, v=z.
               // If z=1 (front), v should be 0.5..1?
               vOffset = (z === 1) ? 0.5 : 0.0; 
            }
          }
          // Face 3: -Y (Bottom). Visible if y === -1. Maps X(u), Z(v).
          else if (g === 3) {
            if (y === -1) {
               uOffset = (x === 1) ? 0.5 : 0.0;
               vOffset = (z === 1) ? 0.5 : 0.0;
            }
          }
          // Face 4: +Z (Front). Visible if z === 1. Maps X(u), Y(v).
          else if (g === 4) {
            if (z === 1) {
               uOffset = (x === 1) ? 0.5 : 0.0;
               vOffset = (y === 1) ? 0.5 : 0.0;
            }
          }
          // Face 5: -Z (Back). Visible if z === -1. Maps X(u), Y(v).
          else if (g === 5) {
            if (z === -1) {
               uOffset = (x === 1) ? 0.5 : 0.0;
               vOffset = (y === 1) ? 0.5 : 0.0;
            }
          }

          // Apply UV transform to this group's vertices
          for (let i = 0; i < count; i++) {
            const idx = start + i;
            const u = uvAttribute.getX(idx);
            const v = uvAttribute.getY(idx);
            
            // Only transform if this face is "active" (visible side of the big cube)
            // Actually, we can transform all, but internal faces don't matter.
            // To be safe and ensure pattern continuity, we transform based on position.
            
            // Note: BoxGeometry UVs are 0..1. We want to map 0..1 -> 0.5..1 or 0..0.5
            uvAttribute.setXY(idx, u * uScale + uOffset, v * vScale + vOffset);
          }
        }
        
        uvAttribute.needsUpdate = true;

        // Assign materials: [Right, Left, Top, Bottom, Front, Back]
        const materials = [matRight, matLeft, matTop, matBottom, matFront, matBack];
        
        const subCube = new THREE.Mesh(geom, materials);
        subCube.position.set(x * offset, y * offset, z * offset);
        root.add(subCube);
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