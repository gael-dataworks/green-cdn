export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Frosted cap material (translucent plastic/glass)
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0xb8d4f5,
    metalness: 0.1,
    roughness: 0.4,
    transmission: 0.6,
    transparent: true,
    opacity: 0.9,
    ior: 1.5,
  });

  // Blue liquid paint material (glossy but opaque)
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.3,
  });

  // Clear glass base material
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    transparent: true,
    opacity: 1.0,
    ior: 1.5,
  });

  // Label material with procedural glitter texture
  const labelTexture = createGlitterLabelTexture(THREE);
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTexture,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // --- Dimensions ---
  const bodyRadius = 0.24;
  const bodyHeight = 0.60;
  const baseHeight = 0.14;
  const neckHeight = 0.06;
  const neckRadius = 0.14;
  const capRadius = 0.27;
  const capHeight = 0.38;

  // --- Geometry & Meshes ---

  // 1. Cap (Frosted cylinder)
  const capGeom = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32);
  const cap = new THREE.Mesh(capGeom, capMat);
  cap.position.y = bodyHeight / 2 + neckHeight + capHeight / 2;
  root.add(cap);

  // 2. Neck (Small connector)
  const neckGeom = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
  const neck = new THREE.Mesh(neckGeom, liquidMat);
  neck.position.y = bodyHeight / 2 + neckHeight / 2;
  root.add(neck);

  // 3. Body Liquid (Main blue cylinder)
  // Slightly smaller radius than glass to simulate liquid inside glass
  const liquidGeom = new THREE.CylinderGeometry(bodyRadius - 0.01, bodyRadius - 0.01, bodyHeight - baseHeight, 32);
  const liquid = new THREE.Mesh(liquidGeom, liquidMat);
  liquid.position.y = (bodyHeight - baseHeight) / 2 + baseHeight;
  root.add(liquid);

  // 4. Glass Base (Thick clear bottom)
  // Represents the thick glass bottom of the bottle
  const baseGeom = new THREE.CylinderGeometry(bodyRadius, bodyRadius, baseHeight, 32);
  const glassBase = new THREE.Mesh(baseGeom, glassMat);
  glassBase.position.y = baseHeight / 2;
  root.add(glassBase);

  // 5. Label (Rectangular decal on front)
  // Positioned on the front of the liquid body
  const labelWidth = 0.28;
  const labelHeight = 0.32;
  const labelGeom = new THREE.PlaneGeometry(labelWidth, labelHeight);
  const label = new THREE.Mesh(labelGeom, labelMat);
  
  // Position on the surface of the cylinder
  const labelZ = bodyRadius + 0.002; // Slightly offset to prevent z-fighting
  const labelY = (bodyHeight - baseHeight) / 2 + baseHeight; // Centered on the liquid part
  
  label.position.set(0, labelY, labelZ);
  
  // Curve the label slightly to match cylinder? 
  // For simplicity in low-poly, a flat plane tangent to surface is acceptable, 
  // but bending vertices is better. Let's just keep it flat tangent for robustness 
  // unless we use a custom shape. A flat plane is standard for this scale.
  root.add(label);

  // 6. Bottom Logo/Text on Glass (Optional detail seen in reference)
  // Small white text area on the clear base
  const bottomLabelGeom = new THREE.PlaneGeometry(0.15, 0.04);
  const bottomLabelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  const bottomLabel = new THREE.Mesh(bottomLabelGeom, bottomLabelMat);
  bottomLabel.position.set(0, baseHeight / 2, bodyRadius + 0.002);
  root.add(bottomLabel);

  fitToUnitCube(THREE, root);
  return root;
}

function createGlitterLabelTexture(THREE) {
  const width = 256;
  const height = 256;
  const data = new Uint8Array(width * height * 4);

  // Base colors
  const baseR = 100, baseG = 180, baseB = 240; // Light blue
  const glitterR = 255, glitterG = 255, glitterB = 255; // White sparkles
  const textR = 255, textG = 255, textB = 255; // White text

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // Deterministic pseudo-random for glitter
      // Using a simple hash of coordinates
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const rand = hash - Math.floor(hash);

      // Background: Blue with noise
      let r = baseR;
      let g = baseG;
      let b = baseB;
      let a = 255;

      // Glitter: Random bright pixels
      if (rand > 0.92) {
        r = glitterR;
        g = glitterG;
        b = glitterB;
        // Vary brightness slightly
        const brightness = 0.5 + rand * 0.5;
        r *= brightness;
        g *= brightness;
        b *= brightness;
      } else if (rand > 0.85) {
        // Subtler sparkles
        r = baseR + 50;
        g = baseG + 50;
        b = baseB + 50;
      }

      // Text Area Definition (Centered rectangle)
      // Top line "Deer": y in [180, 210], x in [60, 196]
      // Mid line "Fresh": y in [130, 170], x in [50, 206]
      // Bottom "PARIS": y in [90, 110], x in [100, 156]
      
      let isText = false;

      // Line 1 (Deer)
      if (y > 170 && y < 210 && x > 50 && x < 200) {
         // Simplified blocky text simulation
         if ((y > 175 && y < 185) || (y > 195 && y < 205) || (x > 110 && x < 120)) {
             isText = true;
         }
      }
      
      // Line 2 (Fresh)
      if (y > 120 && y < 160 && x > 40 && x < 210) {
          if ((y > 125 && y < 135) || (y > 145 && y < 155) || (x > 115 && x < 125)) {
              isText = true;
          }
      }

      // Line 3 (PARIS)
      if (y > 80 && y < 100 && x > 90 && x < 160) {
          if (y > 85 && y < 95) {
              isText = true;
          }
      }

      if (isText) {
        r = textR;
        g = textG;
        b = textB;
        a = 255;
        // Add some glitter to text too
        if (rand > 0.8) {
             r = 200; g = 230; b = 255;
        }
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
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