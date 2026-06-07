export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Matte black plastic for body, base, rim
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.6,
  });

  // Blue button
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x3366ff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Darker plastic for sensor dots
  const sensorMat = new THREE.MeshStandardMaterial({
    color: 0x000000,
    metalness: 0.2,
    roughness: 0.3,
  });

  // --- Dimensions ---
  const totalHeight = 1.0;
  const baseHeight = 0.08;
  const bodyHeight = 0.85;
  const rimHeight = 0.10;
  const baseRadius = 0.14;
  const bodyTopRadius = 0.11;
  const bodyBottomRadius = 0.09;
  const waistRadius = 0.085;

  // --- Base ---
  // Flared disc at bottom
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, bodyMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- Main Body (Lathe) ---
  // Profile from bottom of body (on top of base) to top of body (below rim)
  const bodyProfile = [
    new THREE.Vector2(bodyBottomRadius, 0),          // Bottom of body
    new THREE.Vector2(waistRadius, bodyHeight * 0.5), // Waist
    new THREE.Vector2(bodyTopRadius, bodyHeight),     // Top of body taper
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = baseHeight + bodyHeight / 2;
  root.add(body);

  // --- Top Rim / Lid ---
  // Slightly wider cylinder at top
  const rimGeom = new THREE.CylinderGeometry(bodyTopRadius + 0.01, bodyTopRadius + 0.01, rimHeight, 32);
  const rim = new THREE.Mesh(rimGeom, bodyMat);
  rim.position.y = baseHeight + bodyHeight + rimHeight / 2;
  root.add(rim);

  // --- Blue Button ---
  const buttonRadius = 0.035;
  const buttonGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, 0.015, 32);
  const button = new THREE.Mesh(buttonGeom, buttonMat);
  // Position on front of body, upper section
  const buttonY = baseHeight + bodyHeight * 0.75;
  const buttonZ = bodyTopRadius * 0.85; // Approx radius at that height
  button.position.set(0, buttonY, buttonZ + 0.005); // Slightly offset from surface
  root.add(button);

  // --- Grille & Text Texture (DataTexture) ---
  // Create a texture for the speaker grille and "MAX CO2" text
  const texWidth = 256;
  const texHeight = 512; // Tall rectangle for vertical grille
  const data = new Uint8Array(texWidth * texHeight * 4);
  
  for (let i = 0; i < texWidth * texHeight; i++) {
    // Default black background
    data[i * 4] = 10;     // R
    data[i * 4 + 1] = 10; // G
    data[i * 4 + 2] = 10; // B
    data[i * 4 + 3] = 255; // A
  }

  // Draw Grille Holes (white/light grey dots)
  const holeRadius = 3;
  const holeSpacing = 10;
  const grilleStartY = 50;
  const grilleEndY = 350;
  const grilleCenterX = texWidth / 2;
  
  for (let y = grilleStartY; y < grilleEndY; y += holeSpacing) {
    for (let x = grilleCenterX - 20; x <= grilleCenterX + 20; x += holeSpacing) {
      // Stagger rows
      const xOffset = ((y / holeSpacing) % 2 === 0) ? 0 : holeSpacing / 2;
      const px = Math.floor(x + xOffset);
      const py = Math.floor(y);
      
      // Simple circle rasterization
      for (let dy = -holeRadius; dy <= holeRadius; dy++) {
        for (let dx = -holeRadius; dx <= holeRadius; dx++) {
          if (dx*dx + dy*dy <= holeRadius*holeRadius) {
            const idx = ((py + dy) * texWidth + (px + dx)) * 4;
            if (idx >= 0 && idx < data.length) {
              data[idx] = 150;
              data[idx+1] = 150;
              data[idx+2] = 150;
            }
          }
        }
      }
    }
  }

  // Draw Text "MAX CO2" roughly at bottom
  // Simple blocky representation
  const textY = 20;
  const textHeight = 15;
  // Just drawing a few white bars to represent text presence without complex font rasterization
  // Bar 1
  for (let y = textY; y < textY + textHeight; y++) {
    for (let x = 80; x < 110; x++) {
       const idx = (y * texWidth + x) * 4;
       data[idx] = 200; data[idx+1] = 200; data[idx+2] = 200;
    }
  }
  // Bar 2
  for (let y = textY; y < textY + textHeight; y++) {
    for (let x = 120; x < 150; x++) {
       const idx = (y * texWidth + x) * 4;
       data[idx] = 200; data[idx+1] = 200; data[idx+2] = 200;
    }
  }
   // Bar 3
   for (let y = textY; y < textY + textHeight; y++) {
    for (let x = 160; x < 180; x++) {
       const idx = (y * texWidth + x) * 4;
       data[idx] = 200; data[idx+1] = 200; data[idx+2] = 200;
    }
  }

  const grilleTexture = new THREE.DataTexture(data, texWidth, texHeight, THREE.RGBAFormat);
  grilleTexture.colorSpace = THREE.SRGBColorSpace;
  grilleTexture.needsUpdate = true;
  // Wrap not needed for this specific placement, but good practice
  grilleTexture.wrapS = THREE.ClampToEdgeWrapping;
  grilleTexture.wrapT = THREE.ClampToEdgeWrapping;

  const grilleMat = new THREE.MeshBasicMaterial({ 
    map: grilleTexture, 
    transparent: true, 
    opacity: 0.8,
    side: THREE.DoubleSide
  });

  // Grille Plane
  const grilleWidth = 0.08;
  const grilleHeight = 0.25;
  const grilleGeom = new THREE.PlaneGeometry(grilleWidth, grilleHeight);
  const grilleMesh = new THREE.Mesh(grilleGeom, grilleMat);
  
  // Position on front of body, below button
  const grilleY = baseHeight + bodyHeight * 0.45;
  const grilleZ = waistRadius + 0.006; // Slightly offset from surface
  grilleMesh.position.set(0, grilleY, grilleZ);
  root.add(grilleMesh);

  // --- Sensor Dots ---
  const sensorGeom = new THREE.SphereGeometry(0.008, 16, 16);
  const sensor1 = new THREE.Mesh(sensorGeom, sensorMat);
  const sensor2 = new THREE.Mesh(sensorGeom, sensorMat);
  
  // Positioned near top rim, slightly to the side
  const sensorY = baseHeight + bodyHeight + rimHeight * 0.5;
  const sensorZ = (bodyTopRadius + 0.01) * 0.95;
  const sensorXOffset = 0.04;

  sensor1.position.set(sensorXOffset, sensorY, sensorZ);
  sensor2.position.set(-sensorXOffset, sensorY, sensorZ);
  
  root.add(sensor1);
  root.add(sensor2);

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