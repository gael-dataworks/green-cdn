export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const CUBIE_SIZE = 0.42;
  const GAP = 0.04;
  const OFFSET = (CUBIE_SIZE + GAP) / 2;
  
  // --- Materials ---
  // Glossy plastic base
  const plasticBaseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.3,
  });

  // --- Texture Generation Helper ---
  // Generates a 128x128 DataTexture with abstract organic blobs
  function createPatternTexture(baseHex, blobHexes) {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    const baseColor = new THREE.Color(baseHex);
    
    // Parse blob colors
    const blobs = blobHexes.map(h => new THREE.Color(h));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Start with base color
        let r = baseColor.r * 255;
        let g = baseColor.g * 255;
        let b = baseColor.b * 255;

        // Add blobs (deterministic circles/ellipses)
        // We use simple distance checks to create 3-4 distinct shapes
        const cx = size / 2;
        const cy = size / 2;
        
        // Blob 1: Large central-ish
        const d1 = Math.sqrt((x - cx * 0.8) ** 2 + (y - cy * 1.2) ** 2);
        if (d1 < size * 0.35) {
          const c = blobs[0];
          r = c.r * 255; g = c.g * 255; b = c.b * 255;
        }

        // Blob 2: Top right
        const d2 = Math.sqrt((x - cx * 1.4) ** 2 + (y - cy * 0.6) ** 2);
        if (d2 < size * 0.25) {
          const c = blobs[1] || blobs[0];
          r = c.r * 255; g = c.g * 255; b = c.b * 255;
        }

        // Blob 3: Bottom left
        const d3 = Math.sqrt((x - cx * 0.5) ** 2 + (y - cy * 0.5) ** 2);
        if (d3 < size * 0.3) {
          const c = blobs[2] || blobs[0];
          r = c.r * 255; g = c.g * 255; b = c.b * 255;
        }
        
        // Blob 4: Corner accent
        const d4 = Math.sqrt((x - cx * 1.3) ** 2 + (y - cy * 1.3) ** 2);
        if (d4 < size * 0.2) {
           const c = blobs[3] || blobs[1];
           r = c.r * 255; g = c.g * 255; b = c.b * 255;
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

  // --- Face Styles (matching reference approx) ---
  // Format: [baseHex, [blob1, blob2, blob3]]
  const faceStyles = {
    front_top_left:   ['#4a90e2', ['#8e44ad', '#f1c40f', '#3498db']], // Blue base, Purple/Yellow blobs
    front_top_right:  ['#2ecc71', ['#e74c3c', '#f1c40f', '#27ae60']], // Green base, Red/Yellow blobs
    front_bot_left:   ['#27ae60', ['#3498db', '#f1c40f', '#c0392b']], // Green/Blue base, Yellow/Red
    front_bot_right:  ['#2ecc71', ['#f1c40f', '#e74c3c', '#2980b9']], // Green base, Yellow/Red/Blue
    
    side_top_left:    ['#8e44ad', ['#4a90e2', '#f1c40f', '#9b59b6']], // Purple base
    side_top_right:   ['#e74c3c', ['#f1c40f', '#2ecc71', '#c0392b']], // Red base
    side_bot_left:    ['#3498db', ['#2ecc71', '#f1c40f', '#2980b9']], // Blue base
    side_bot_right:   ['#f1c40f', ['#e74c3c', '#2ecc71', '#f39c12']], // Yellow base

    top_top_left:     ['#f1c40f', ['#e74c3c', '#3498db', '#f39c12']], // Yellow base
    top_top_right:    ['#e74c3c', ['#f1c40f', '#2ecc71', '#c0392b']], // Red base
    top_bot_left:     ['#3498db', ['#8e44ad', '#f1c40f', '#2980b9']], // Blue base
    top_bot_right:    ['#2ecc71', ['#f1c40f', '#3498db', '#27ae60']], // Green base
  };

  function getMaterial(styleKey) {
    const style = faceStyles[styleKey] || ['#ffffff', ['#cccccc']];
    const map = createPatternTexture(style[0], style[1]);
    return new THREE.MeshStandardMaterial({
      map: map,
      metalness: 0.0,
      roughness: 0.3,
    });
  }

  // --- Build Cubies ---
  // Coordinates: x (-1, 1), y (-1, 1), z (-1, 1) mapped to offsets
  const positions = [-1, 1];
  
  // We need to assign specific styles to specific cubies to match the reference view
  // Reference View: Front face visible, Top face visible, Right side visible.
  
  // Front Layer (z = 1)
  // Top-Left (x=-1, y=1, z=1)
  const ftl = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_top_left'),  // Right (hidden inside)
      getMaterial('side_top_left'),  // Left (visible side)
      getMaterial('top_top_left'),   // Top (visible top)
      getMaterial('front_top_left'), // Bottom (hidden)
      getMaterial('front_top_left'), // Front (visible front)
      getMaterial('front_top_left')  // Back (hidden)
    ]
  );
  ftl.position.set(-OFFSET, OFFSET, OFFSET);
  root.add(ftl);

  // Top-Right (x=1, y=1, z=1)
  const ftr = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_top_right'),  // Right (visible side)
      getMaterial('side_top_right'),  // Left (hidden)
      getMaterial('top_top_right'),   // Top (visible top)
      getMaterial('front_top_right'), // Bottom (hidden)
      getMaterial('front_top_right'), // Front (visible front)
      getMaterial('front_top_right')  // Back (hidden)
    ]
  );
  ftr.position.set(OFFSET, OFFSET, OFFSET);
  root.add(ftr);

  // Bottom-Left (x=-1, y=-1, z=1)
  const fbl = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_bot_left'),  // Right (hidden)
      getMaterial('side_bot_left'),  // Left (visible side)
      getMaterial('top_bot_left'),   // Top (hidden)
      getMaterial('front_bot_left'), // Bottom (hidden)
      getMaterial('front_bot_left'), // Front (visible front)
      getMaterial('front_bot_left')  // Back (hidden)
    ]
  );
  fbl.position.set(-OFFSET, -OFFSET, OFFSET);
  root.add(fbl);

  // Bottom-Right (x=1, y=-1, z=1)
  const fbr = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_bot_right'),  // Right (visible side)
      getMaterial('side_bot_right'),  // Left (hidden)
      getMaterial('top_bot_right'),   // Top (hidden)
      getMaterial('front_bot_right'), // Bottom (hidden)
      getMaterial('front_bot_right'), // Front (visible front)
      getMaterial('front_bot_right')  // Back (hidden)
    ]
  );
  fbr.position.set(OFFSET, -OFFSET, OFFSET);
  root.add(fbr);

  // Back Layer (z = -1) - Partially visible on top/side
  // Top-Left (x=-1, y=1, z=-1)
  const btl = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_top_left'),  // Right (hidden)
      getMaterial('side_top_left'),  // Left (visible side)
      getMaterial('top_top_left'),   // Top (visible top)
      getMaterial('front_top_left'), // Bottom (hidden)
      getMaterial('front_top_left'), // Front (hidden)
      getMaterial('front_top_left')  // Back (hidden)
    ]
  );
  btl.position.set(-OFFSET, OFFSET, -OFFSET);
  root.add(btl);

  // Top-Right (x=1, y=1, z=-1)
  const btr = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_top_right'),  // Right (visible side)
      getMaterial('side_top_right'),  // Left (hidden)
      getMaterial('top_top_right'),   // Top (visible top)
      getMaterial('front_top_right'), // Bottom (hidden)
      getMaterial('front_top_right'), // Front (hidden)
      getMaterial('front_top_right')  // Back (hidden)
    ]
  );
  btr.position.set(OFFSET, OFFSET, -OFFSET);
  root.add(btr);

  // Bottom-Left (x=-1, y=-1, z=-1)
  const bbl = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_bot_left'),  // Right (hidden)
      getMaterial('side_bot_left'),  // Left (visible side)
      getMaterial('top_bot_left'),   // Top (hidden)
      getMaterial('front_bot_left'), // Bottom (hidden)
      getMaterial('front_bot_left'), // Front (hidden)
      getMaterial('front_bot_left')  // Back (hidden)
    ]
  );
  bbl.position.set(-OFFSET, -OFFSET, -OFFSET);
  root.add(bbl);

  // Bottom-Right (x=1, y=-1, z=-1)
  const bbr = new THREE.Mesh(
    new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE),
    [
      getMaterial('side_bot_right'),  // Right (visible side)
      getMaterial('side_bot_right'),  // Left (hidden)
      getMaterial('top_bot_right'),   // Top (hidden)
      getMaterial('front_bot_right'), // Bottom (hidden)
      getMaterial('front_bot_right'), // Front (hidden)
      getMaterial('front_bot_right')  // Back (hidden)
    ]
  );
  bbr.position.set(OFFSET, -OFFSET, -OFFSET);
  root.add(bbr);

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