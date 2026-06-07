export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ceramic material: glazed, slightly rough, warm brown/tan base.
  // We will use a DataTexture for the color, speckles, and holes.
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White base, texture provides color
    metalness: 0.0,
    roughness: 0.4, // Glazed ceramic
    side: THREE.DoubleSide,
    transparent: true,
  });

  // --- Procedural Texture Generation ---
  // Creates the ceramic color, glaze variation, speckles, and perforation holes.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Base colors
  const baseR = 181, baseG = 144, baseB = 117; // Tan
  const speckleDarkR = 100, speckleDarkG = 80, speckleDarkB = 60;
  const speckleLightR = 160, speckleLightG = 180, speckleLightB = 140; // Greenish glaze hint

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Deterministic pseudo-random noise for speckles
      const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      const noise2 = Math.sin(x * 0.05 + y * 0.05) * 0.5 + 0.5;
      
      let r = baseR;
      let g = baseG;
      let b = baseB;

      // Add speckles
      if (noise > 0.85) {
        r = speckleDarkR; g = speckleDarkG; b = speckleDarkB;
      } else if (noise2 > 0.8) {
        r = speckleLightR; g = speckleLightG; b = speckleLightB;
      }

      // Draw Holes
      // We want rows of holes. 
      // Map y to "height on bowl" (0 to 1). 
      // Holes start appearing after the foot (y > 0.1 in texture space)
      const v = y / texSize;
      const u = x / texSize;

      let isHole = false;

      if (v > 0.15 && v < 0.95) {
        // Calculate row index. More rows near top? Let's keep it simple grid first.
        const rowCount = 12;
        const rowH = 1.0 / rowCount;
        const row = Math.floor((v - 0.15) / (0.8 / rowCount));
        const rowY = 0.15 + (row + 0.5) * (0.8 / rowCount);
        
        // Distance from center of row
        const distY = Math.abs(v - rowY);
        
        if (distY < 0.025) {
          // Determine columns based on row width (simulating circumference)
          // Lower rows have fewer holes, upper rows have more.
          // Circumference ~ radius. Radius grows then shrinks slightly.
          // Approximate with linear growth for texture simplicity.
          const cols = 8 + Math.floor(row * 1.5); 
          const colW = 1.0 / cols;
          
          // Stagger every other row
          const offset = (row % 2 === 0) ? 0 : colW * 0.5;
          
          for (let c = 0; c < cols; c++) {
            const colX = (c * colW + offset) % 1.0;
            const distX = Math.abs(u - colX);
            // Wrap around check for u near 0/1
            const distXWrap = Math.min(distX, 1.0 - distX);

            if (distXWrap < 0.035) {
              isHole = true;
              break;
            }
          }
        }
      }

      if (isHole) {
        // Hole is transparent
        data[i] = 0;
        data[i+1] = 0;
        data[i+2] = 0;
        data[i+3] = 0; // Alpha 0
      } else {
        // Ceramic surface
        data[i] = r;
        data[i+1] = g;
        data[i+2] = b;
        data[i+3] = 255;
      }
    }
  }

  const ceramicTex = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  ceramicTex.colorSpace = THREE.SRGBColorSpace;
  ceramicTex.needsUpdate = true;
  ceramicTex.wrapS = THREE.RepeatWrapping;
  ceramicTex.wrapT = THREE.ClampToEdgeWrapping;
  
  ceramicMat.map = ceramicTex;

  // --- Geometry: Bowl (Lathe) ---
  // Profile defines the cross-section of the wall.
  // Starts inner bottom, goes up inner wall, over rim, down outer wall, in to foot, down to bottom center.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.02), // Inner bottom
    new THREE.Vector2(0.00, 0.16), // Inner top
    new THREE.Vector2(0.03, 0.17), // Inner lip
    new THREE.Vector2(0.05, 0.18), // Top rim edge
    new THREE.Vector2(0.36, 0.15), // Outer max width (belly)
    new THREE.Vector2(0.11, 0.02), // Outer foot top
    new THREE.Vector2(0.11, 0.00), // Outer foot bottom
    new THREE.Vector2(0.00, 0.00), // Center bottom
  ];

  const bowlGeom = new THREE.LatheGeometry(profilePoints, 64);
  // Fix UVs for Lathe to map texture correctly (0,0 at bottom, 1,1 at top)
  // Default Lathe UVs are usually fine, but we might need to adjust if texture stretches.
  // We'll rely on default for now.
  
  const bowl = new THREE.Mesh(bowlGeom, ceramicMat);
  root.add(bowl);

  // --- Geometry: Handle ---
  // Flat handle extending from the side.
  const handleW = 0.12;
  const handleH = 0.04;
  const handleD = 0.015;
  const handleGeom = new THREE.BoxGeometry(handleW, handleH, handleD);
  
  // Move pivot to one end so we can attach it to the rim easily
  // Actually, let's just position it.
  const handle = new THREE.Mesh(handleGeom, ceramicMat);
  // Position at the rim edge
  handle.position.set(0.36 + handleW / 2, 0.17, 0);
  // Tilt slightly up
  handle.rotation.z = -0.2; 
  root.add(handle);

  // Handle Hole (visual only, using a small black cylinder or torus to simulate the hole)
  // Since the handle is thin, a simple black cylinder works.
  const handleHoleGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const handleHoleMat = new THREE.MeshBasicMaterial({ color: 0x333333 }); // Dark inside
  const handleHole = new THREE.Mesh(handleHoleGeom, handleHoleMat);
  handleHole.rotation.x = Math.PI / 2;
  handleHole.position.set(0.36 + handleW - 0.03, 0.17, 0); // Near the end of handle
  // Align with handle rotation
  handleHole.rotation.z = -0.2;
  root.add(handleHole);

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