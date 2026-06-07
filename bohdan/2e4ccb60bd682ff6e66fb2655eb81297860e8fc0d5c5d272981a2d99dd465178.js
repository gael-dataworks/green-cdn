export default function generate(THREE) {
  // --- Materials ---

  // Glass shell: High transmission, low roughness, clear.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });

  // Inner pattern sphere: Standard material to hold the texture clearly.
  // Slightly darker to simulate being inside glass.
  const patternMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Metallic base: Polished chrome/steel.
  // Using emissive to brighten it up as per metal brightness rules.
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd6dadf,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd6dadf,
    emissiveIntensity: 0.3,
  });

  // --- Procedural Texture Generation ---
  // Creates a stylized tropical leaf and flower pattern.
  function createTropicalTexture(THREE) {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    
    // Base background (white/off-white)
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = 245;
      data[i * 4 + 1] = 248;
      data[i * 4 + 2] = 250;
      data[i * 4 + 3] = 255;
    }

    // Helper to draw a filled ellipse
    function drawEllipse(cx, cy, rx, ry, angle, r, g, b) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - cx;
          const dy = y - cy;
          // Rotate point back
          const rxp = dx * cosA + dy * sinA;
          const ryp = -dx * sinA + dy * cosA;
          
          if ((rxp * rxp) / (rx * rx) + (ryp * ryp) / (ry * ry) <= 1.0) {
            const idx = (y * size + x) * 4;
            // Simple alpha blend
            data[idx] = data[idx] * 0.3 + r * 0.7;
            data[idx + 1] = data[idx + 1] * 0.3 + g * 0.7;
            data[idx + 2] = data[idx + 2] * 0.3 + b * 0.7;
          }
        }
      }
    }

    // Helper to draw a line (vein)
    function drawLine(x1, y1, x2, y2, width, r, g, b) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;
      
      for (let i = 0; i < len; i++) {
        const cx = x1 + ux * i;
        const cy = y1 + uy * i;
        for (let w = -width; w <= width; w++) {
          const px = Math.floor(cx - uy * w);
          const py = Math.floor(cy + ux * w);
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (py * size + px) * 4;
            data[idx] = data[idx] * 0.5 + r * 0.5;
            data[idx + 1] = data[idx + 1] * 0.5 + g * 0.5;
            data[idx + 2] = data[idx + 2] * 0.5 + b * 0.5;
          }
        }
      }
    }

    // Deterministic pseudo-random generator based on index
    function seededVal(seed) {
      return Math.abs(Math.sin(seed) * 10000) % 1;
    }

    // Generate foliage
    let seed = 0;
    for (let i = 0; i < 40; i++) {
      seed += 1;
      const cx = seededVal(seed) * size;
      const cy = seededVal(seed + 1) * size;
      const angle = seededVal(seed + 2) * Math.PI * 2;
      const isFlower = seededVal(seed + 3) > 0.7;

      if (isFlower) {
        // Draw flower petals
        const petalCount = 5 + Math.floor(seededVal(seed + 4) * 3);
        const flowerR = 20 + seededVal(seed + 5) * 30;
        const colorChoice = Math.floor(seededVal(seed + 6) * 3);
        let fr, fg, fb;
        if (colorChoice === 0) { fr=255; fg=100; fb=50; } // Orange
        else if (colorChoice === 1) { fr=255; fg=50; fb=150; } // Pink
        else { fr=255; fg=200; fb=50; } // Yellow

        for (let p = 0; p < petalCount; p++) {
          const pa = angle + (p / petalCount) * Math.PI * 2;
          const px = cx + Math.cos(pa) * flowerR * 0.5;
          const py = cy + Math.sin(pa) * flowerR * 0.5;
          drawEllipse(px, py, flowerR * 0.3, flowerR * 0.1, pa, fr, fg, fb);
        }
        // Center
        drawEllipse(cx, cy, flowerR * 0.2, flowerR * 0.2, 0, 50, 50, 50);
      } else {
        // Draw leaves (Monstera/Palm style)
        const leafLen = 40 + seededVal(seed + 4) * 60;
        const leafWid = 15 + seededVal(seed + 5) * 20;
        const lr = 20 + seededVal(seed + 6) * 50;
        const lg = 100 + seededVal(seed + 7) * 100;
        const lb = 20 + seededVal(seed + 8) * 50;
        
        // Main leaf shape
        drawEllipse(cx, cy, leafLen, leafWid, angle, lr, lg, lb);
        
        // Veins
        drawLine(cx, cy, cx + Math.cos(angle) * leafLen, cy + Math.sin(angle) * leafLen, 2, lr-50, lg-50, lb-50);
        
        // Secondary veins
        for (let v = 1; v <= 3; v++) {
          const vOff = (v - 2) * 0.5;
          const vx = cx + Math.cos(angle) * leafLen * 0.5;
          const vy = cy + Math.sin(angle) * leafLen * 0.5;
          const vAngle = angle + vOff;
          drawLine(vx, vy, vx + Math.cos(vAngle) * leafLen * 0.4, vy + Math.sin(vAngle) * leafLen * 0.4, 1, lr-50, lg-50, lb-50);
        }
      }
    }

    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const tropicalTexture = createTropicalTexture(THREE);
  patternMat.map = tropicalTexture;

  // --- Geometry & Meshes ---

  const root = new THREE.Group();

  // 1. Inner Pattern Sphere
  // Slightly smaller than the glass shell to sit "inside"
  const patternRadius = 0.48;
  const patternSphereGeom = new THREE.SphereGeometry(patternRadius, 64, 32);
  const patternSphere = new THREE.Mesh(patternSphereGeom, patternMat);
  root.add(patternSphere);

  // 2. Outer Glass Shell
  // Encases the pattern sphere
  const glassRadius = 0.50;
  const glassSphereGeom = new THREE.SphereGeometry(glassRadius, 64, 32);
  const glassSphere = new THREE.Mesh(glassSphereGeom, glassMat);
  root.add(glassSphere);

  // 3. Metallic Base
  // A shallow cylinder acting as a stand
  const baseRadius = 0.25;
  const baseHeight = 0.08;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, baseHeight, 32);
  const metalBase = new THREE.Mesh(baseGeom, baseMat);
  // Position base so top is flush with bottom of sphere
  metalBase.position.y = -glassRadius - (baseHeight * 0.5);
  root.add(metalBase);

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