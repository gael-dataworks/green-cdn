export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polish Body: Glossy light blue plastic/glass
  const polishMat = new THREE.MeshStandardMaterial({
    color: 0xaaddff,
    metalness: 0.1,
    roughness: 0.25,
  });

  // Base: Clear thick glass
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Cap: Frosted translucent blue
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xcceeff,
    metalness: 0.0,
    roughness: 0.4,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Label Material (will get texture assigned)
  const labelMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Procedural Glitter Label Texture ---
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Deterministic pseudo-random helper
  function pseudoRandom(i) {
    return Math.abs(Math.sin(i * 123.456) % 1);
  }

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Base color: Light blue gradient
      const grad = y / texSize;
      let r = 160 + grad * 40;
      let g = 220 + grad * 20;
      let b = 255;
      
      // Glitter effect: Random bright specks
      const noise = pseudoRandom(x * 5 + y * 7);
      if (noise > 0.92) {
        // Silver/White sparkle
        r = 255; g = 255; b = 255;
      } else if (noise > 0.88) {
        // Cyan sparkle
        r = 200; g = 255; b = 255;
      } else if (noise > 0.85) {
        // Pink/Purple sparkle
        r = 255; g = 200; b = 255;
      }

      // Text Area Masking (Simplified block text representation)
      // Central white box for text readability
      const cx = texSize / 2;
      const cy = texSize / 2;
      const boxW = texSize * 0.7;
      const boxH = texSize * 0.6;
      
      const inBox = (x > cx - boxW/2 && x < cx + boxW/2 && y > cy - boxH/2 && y < cy + boxH/2);
      
      if (inBox) {
        // Keep glitter but brighten background slightly for contrast
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 30);
        b = Math.min(255, b + 20);
        
        // Draw "Delect" (Top line) - Approximated with blocks
        const textY1 = cy - boxH * 0.25;
        const textH = texSize * 0.08;
        if (y > textY1 - textH/2 && y < textY1 + textH/2) {
           // White text color
           r = 255; g = 255; b = 255;
           // Add some "letter" gaps deterministically
           const localX = (x - (cx - boxW/2)) / boxW;
           if (localX > 0.1 && localX < 0.9) {
             // Keep white, maybe add serifs logic if needed, but blocks suffice for identity
           } else {
             // Fade edges
             r = 160; g = 220; b = 255;
           }
        }
        
        // Draw "French" (Middle line)
        const textY2 = cy;
        if (y > textY2 - textH/2 && y < textY2 + textH/2) {
           r = 255; g = 255; b = 255;
        }

        // Draw "Paris" (Bottom line)
        const textY3 = cy + boxH * 0.25;
        if (y > textY3 - textH/2 && y < textY3 + textH/2) {
           r = 255; g = 255; b = 255;
        }
      }

      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
      data[i+3] = 255;
    }
  }

  const labelTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  labelTexture.needsUpdate = true;
  labelMat.map = labelTexture;
  labelMat.emissive = new THREE.Color(0x222222);
  labelMat.emissiveMap = labelTexture;
  labelMat.emissiveIntensity = 0.2;

  // --- Geometry & Meshes ---

  // 1. Base (Thick clear glass bottom)
  const baseGeom = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 32);
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = -0.25 + 0.06; // Bottom of bottle
  root.add(baseMesh);

  // 2. Body (Main blue container)
  // Slightly rounded cylinder
  const bodyGeom = new THREE.CylinderGeometry(0.21, 0.21, 0.45, 32);
  const bodyMesh = new THREE.Mesh(bodyGeom, polishMat);
  bodyMesh.position.y = -0.25 + 0.12 + 0.225; // On top of base
  root.add(bodyMesh);

  // 3. Neck (Small connector)
  const neckGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16);
  const neckMesh = new THREE.Mesh(neckGeom, polishMat);
  neckMesh.position.y = -0.25 + 0.12 + 0.45 + 0.03;
  root.add(neckMesh);

  // 4. Cap (Frosted lid)
  // Slightly tapered
  const capGeom = new THREE.CylinderGeometry(0.20, 0.23, 0.45, 32);
  const capMesh = new THREE.Mesh(capGeom, capMat);
  capMesh.position.y = -0.25 + 0.12 + 0.45 + 0.06 + 0.225;
  root.add(capMesh);

  // 5. Label Decal
  // Curved plane or just a flat plane slightly offset
  // Using a slightly curved cylinder segment for better look
  const labelGeom = new THREE.CylinderGeometry(0.215, 0.215, 0.28, 32, 1, false, 0, 1.2);
  const labelMesh = new THREE.Mesh(labelGeom, labelMat);
  // Position in front of body
  labelMesh.position.set(0, -0.25 + 0.12 + 0.225, 0.18);
  // Rotate to face forward
  labelMesh.rotation.y = Math.PI; 
  root.add(labelMesh);

  // 6. Bottom Logo/Text on Base (Small detail)
  // Simple white ring or text hint on the glass base
  const bottomLogoGeom = new THREE.RingGeometry(0.10, 0.12, 32);
  const bottomLogoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.6, transparent: true, side: THREE.DoubleSide });
  const bottomLogo = new THREE.Mesh(bottomLogoGeom, bottomLogoMat);
  bottomLogo.rotation.x = Math.PI / 2;
  bottomLogo.position.y = -0.25 + 0.01;
  root.add(bottomLogo);

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