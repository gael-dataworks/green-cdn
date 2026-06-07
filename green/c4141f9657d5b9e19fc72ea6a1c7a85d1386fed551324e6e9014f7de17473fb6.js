export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Clear glass for the base
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Light blue liquid inside
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // Frosted cap
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaddff,
    metalness: 0.0,
    roughness: 0.6,
    transmission: 0.4,
    ior: 1.4,
    transparent: true,
    opacity: 0.9,
  });

  // Procedural Label Texture (Glitter + Text)
  const labelSize = 256;
  const labelData = new Uint8Array(labelSize * labelSize * 4);
  
  // Fill background with light blue
  for (let i = 0; i < labelData.length; i += 4) {
    labelData[i] = 100;     // R
    labelData[i + 1] = 180; // G
    labelData[i + 2] = 240; // B
    labelData[i + 3] = 255; // A
  }

  // Add glitter (random bright pixels)
  // Using a deterministic pseudo-random approach based on index to avoid Math.random
  for (let y = 0; y < labelSize; y++) {
    for (let x = 0; x < labelSize; x++) {
      const idx = (y * labelSize + x) * 4;
      // Simple hash for determinism
      const hash = ((x * 12345 + y * 67890) % 100) / 100;
      if (hash > 0.85) {
        // Glitter spark
        const brightness = 200 + Math.floor(hash * 55);
        labelData[idx] = brightness;
        labelData[idx + 1] = brightness;
        labelData[idx + 2] = 255;
      }
    }
  }

  // Draw Text "Deer Fresh" and "PARIS" roughly with white blocks
  // Helper to draw a filled rect
  function drawRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (x + dx >= 0 && x + dx < labelSize && y + dy >= 0 && y + dy < labelSize) {
          const idx = ((y + dy) * labelSize + (x + dx)) * 4;
          labelData[idx] = r;
          labelData[idx + 1] = g;
          labelData[idx + 2] = b;
          labelData[idx + 3] = 255;
        }
      }
    }
  }

  // "Deer" - approx 4 letters
  // "Fresh" - approx 5 letters
  // "PARIS" - 5 letters smaller at bottom
  
  // Top line "Deer"
  drawRect(60, 60, 136, 40, 255, 255, 255);
  // Middle line "Fresh"
  drawRect(50, 110, 156, 40, 255, 255, 255);
  // Bottom line "PARIS"
  drawRect(90, 170, 76, 20, 255, 255, 255);

  const labelTexture = new THREE.DataTexture(labelData, labelSize, labelSize, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;

  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Geometry & Meshes ---

  // 1. Glass Base (Outer shell)
  // Using Lathe for a slightly rounded bottom and thick glass look
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.35, 0),
    new THREE.Vector2(0.35, 0.05), // Thick base rim
    new THREE.Vector2(0.32, 0.05), // Inner wall start
    new THREE.Vector2(0.32, 1.0),  // Up to shoulder
    new THREE.Vector2(0.22, 1.0),  // Shoulder taper
    new THREE.Vector2(0.22, 1.15), // Neck
    new THREE.Vector2(0.18, 1.15), // Neck top
    new THREE.Vector2(0, 1.15),
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const bottleBase = new THREE.Mesh(baseGeom, glassMat);
  root.add(bottleBase);

  // 2. Liquid Body (Inner cylinder)
  // Fits inside the glass base
  const liquidGeom = new THREE.CylinderGeometry(0.30, 0.30, 0.95, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = 0.475; // Centered relative to height 0.95, sitting on base
  root.add(liquid);

  // 3. Neck Ring (Blue plastic part under cap)
  const neckGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 32);
  const neck = new THREE.Mesh(neckGeom, liquidMat); // Same color as liquid/cap base
  neck.position.y = 1.075;
  root.add(neck);

  // 4. Cap (Frosted cylinder)
  const capGeom = new THREE.CylinderGeometry(0.24, 0.26, 0.9, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = 1.60;
  root.add(cap);

  // 5. Label
  // Curved plane attached to the liquid body
  const labelGeom = new THREE.PlaneGeometry(0.45, 0.55);
  const label = new THREE.Mesh(labelGeom, labelMat);
  // Position on front of bottle (Z positive)
  label.position.set(0, 0.55, 0.325);
  // Rotate to face outward
  label.rotation.y = Math.PI; 
  root.add(label);

  // 6. Bottom Logo/Embossing on Glass (Optional detail)
  // Small circle on the very bottom
  const bottomLogoGeom = new THREE.CircleGeometry(0.15, 16);
  const bottomLogoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.5 });
  const bottomLogo = new THREE.Mesh(bottomLogoGeom, bottomLogoMat);
  bottomLogo.rotation.x = Math.PI / 2;
  bottomLogo.position.y = -0.01;
  root.add(bottomLogo);

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