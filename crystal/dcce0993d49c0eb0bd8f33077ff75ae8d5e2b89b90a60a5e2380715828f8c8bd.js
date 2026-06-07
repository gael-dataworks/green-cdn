export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  const sauceMat = new THREE.MeshStandardMaterial({
    color: 0xcc0000,
    metalness: 0.0,
    roughness: 0.3,
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.4,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry: Bottle Profile ---
  // Points from bottom (y=0) to top
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.04, 0.00), // Bottom edge
    new THREE.Vector2(0.04, 0.01), // Slight bevel
    new THREE.Vector2(0.045, 0.02), // Start of body curve
    new THREE.Vector2(0.055, 0.08), // Widest part
    new THREE.Vector2(0.055, 0.14), // Body top
    new THREE.Vector2(0.045, 0.18), // Shoulder start
    new THREE.Vector2(0.030, 0.20), // Neck start
    new THREE.Vector2(0.030, 0.23), // Neck top
    new THREE.Vector2(0.032, 0.235), // Lip flare
    new THREE.Vector2(0.00, 0.24), // Top center
  ];

  const bottleGeom = new THREE.LatheGeometry(profilePoints, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  root.add(bottle);

  // --- Geometry: Sauce Inside ---
  // Slightly smaller profile to sit inside the glass
  const sauceProfile = [
    new THREE.Vector2(0.00, 0.005),
    new THREE.Vector2(0.038, 0.005),
    new THREE.Vector2(0.038, 0.015),
    new THREE.Vector2(0.050, 0.08),
    new THREE.Vector2(0.050, 0.14),
    new THREE.Vector2(0.042, 0.18),
    new THREE.Vector2(0.028, 0.20),
    new THREE.Vector2(0.028, 0.225), // Fill level below lip
    new THREE.Vector2(0.00, 0.225),
  ];
  const sauceGeom = new THREE.LatheGeometry(sauceProfile, 32);
  const sauce = new THREE.Mesh(sauceGeom, sauceMat);
  root.add(sauce);

  // --- Geometry: Cap ---
  const capGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.025, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 0.245; // Sit on top of lip
  root.add(cap);

  // Cap ridges (simple torus slices or cylinders)
  const ridgeGeom = new THREE.TorusGeometry(0.034, 0.002, 8, 32);
  for (let i = 0; i < 3; i++) {
    const ridge = new THREE.Mesh(ridgeGeom, capMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = 0.235 + i * 0.006;
    root.add(ridge);
  }

  // --- Procedural Label Texture ---
  // Create a DataTexture for the "CIARLA'LM" label
  const labelW = 512;
  const labelH = 256;
  const data = new Uint8Array(labelW * labelH * 4);
  
  // Helper to set pixel
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= labelW || y < 0 || y >= labelH) return;
    const idx = (y * labelW + x) * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // 1. Background: Yellow (#ffe032 approx)
  for (let y = 0; y < labelH; y++) {
    for (let x = 0; x < labelW; x++) {
      setPixel(x, y, 255, 224, 50);
    }
  }

  // 2. White Starburst/Jagged Shape in center
  const cx = labelW / 2;
  const cy = labelH / 2;
  const baseRadius = 80;
  const spikes = 12;
  
  for (let y = 0; y < labelH; y++) {
    for (let x = 0; x < labelW; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      // Create jagged edge
      const spikeOffset = Math.sin(angle * spikes) * 20 + Math.cos(angle * spikes * 2) * 10;
      const radius = baseRadius + spikeOffset;
      
      if (dist < radius) {
        // White background for the starburst
        setPixel(x, y, 255, 255, 255);
        
        // Draw Peppers (Procedural blobs)
        // Pepper 1 (Left, Orange/Red)
        const p1x = cx - 40;
        const p1y = cy + 10;
        const pd1 = Math.sqrt((x - p1x)**2 + (y - p1y)**2);
        if (pd1 < 25) {
           // Gradient for pepper
           const grad = 1 - pd1/25;
           setPixel(x, y, 200 + 55*grad, 50 + 50*grad, 0); 
        }
        
        // Pepper 2 (Right, Red)
        const p2x = cx + 30;
        const p2y = cy + 15;
        const pd2 = Math.sqrt((x - p2x)**2 + (y - p2y)**2);
        if (pd2 < 28) {
           const grad = 1 - pd2/28;
           setPixel(x, y, 180 + 75*grad, 0, 0);
        }

        // Leaves (Green ellipses)
        // Leaf 1
        const l1x = cx - 55;
        const l1y = cy - 10;
        const ld1 = Math.sqrt(((x - l1x)/15)**2 + ((y - l1y)/8)**2);
        if (ld1 < 1) setPixel(x, y, 50, 150, 50);

        // Leaf 2
        const l2x = cx + 45;
        const l2y = cy - 20;
        const ld2 = Math.sqrt(((x - l2x)/12)**2 + ((y - l2y)/6)**2);
        if (ld2 < 1) setPixel(x, y, 60, 160, 60);
      }
    }
  }

  // 3. Text "CIARLA'LM" (Black bars)
  // Top text area
  const textY = cy - 40;
  const textHeight = 12;
  const textWidths = [30, 20, 30, 20, 30, 20, 30, 20, 30]; // Approx widths for letters
  let currentX = cx - 100;
  
  for (let i = 0; i < textWidths.length; i++) {
    const w = textWidths[i];
    for (let ty = 0; ty < textHeight; ty++) {
      for (let tx = 0; tx < w; tx++) {
        // Simple blocky font
        setPixel(currentX + tx, textY + ty, 0, 0, 0);
      }
    }
    currentX += w + 8; // Spacing
  }

  // Bottom text "SHALEUREG ACRUCT" (smaller)
  const bottomTextY = cy + 50;
  const bottomH = 6;
  const bottomW = 120;
  const bottomStartX = cx - 60;
  for (let ty = 0; ty < bottomH; ty++) {
    for (let tx = 0; tx < bottomW; tx++) {
      // Dashed line effect for text
      if (tx % 8 < 5) {
        setPixel(bottomStartX + tx, bottomTextY + ty, 0, 0, 0);
      }
    }
  }

  const labelTexture = new THREE.DataTexture(data, labelW, labelH, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;
  labelMat.map = labelTexture;

  // --- Geometry: Label Wrapper ---
  // Cylinder slightly larger than bottle body
  const labelRadius = 0.058;
  const labelHeight = 0.12;
  const labelY = 0.08; // Center of label on bottle
  
  const labelGeom = new THREE.CylinderGeometry(labelRadius, labelRadius, labelHeight, 32, 1, true);
  const labelMesh = new THREE.Mesh(labelGeom, labelMat);
  labelMesh.position.y = labelY;
  // Rotate to align texture start if needed, default is fine
  root.add(labelMesh);

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