export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass shell: High transmission, low roughness, slight tint
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5, // Adds some volumetric feel
  });

  // Metallic base: Silver/Chrome look
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd0d0d0,
    metalness: 0.6, // Capped at 0.6 per instructions
    roughness: 0.2,
  });

  // Pattern material: Will receive the procedural texture
  const patternMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.4,
  });

  // --- Procedural Texture Generation ---
  // Creates a tropical floral pattern to map onto the inner sphere
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Helper to set pixel color
  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= texSize || y < 0 || y >= texSize) return;
    const idx = (y * texSize + x) * 4;
    // Simple alpha blending with existing background (initially white)
    // Since we fill background first, we can just overwrite or mix
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  // Fill background (light off-white)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 245;     // R
    data[i + 1] = 248; // G
    data[i + 2] = 250; // B
    data[i + 3] = 255; // A
  }

  // Deterministic pseudo-random generator for placing shapes
  // Using a simple LCG to avoid Math.random
  let seed = 12345;
  function nextRand() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Draw a filled ellipse/blob
  function drawBlob(cx, cy, rx, ry, angle, colorR, colorG, colorB) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const minX = Math.floor(cx - rx);
    const maxX = Math.ceil(cx + rx);
    const minY = Math.floor(cy - ry);
    const maxY = Math.ceil(cy + ry);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Rotate point back to align with axes
        const dx = x - cx;
        const dy = y - cy;
        const rxp = dx * cosA + dy * sinA;
        const ryp = -dx * sinA + dy * cosA;
        
        if ((rxp * rxp) / (rx * rx) + (ryp * ryp) / (ry * ry) <= 1.0) {
          setPixel(x, y, colorR, colorG, colorB);
        }
      }
    }
  }

  // Draw a simple leaf shape (two arcs)
  function drawLeaf(cx, cy, length, width, angle, colorR, colorG, colorB) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const minX = Math.floor(cx - length);
    const maxX = Math.ceil(cx + length);
    const minY = Math.floor(cy - width);
    const maxY = Math.ceil(cy + width);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        // Rotate to local leaf space
        const lx = dx * cosA + dy * sinA;
        const ly = -dx * sinA + dy * cosA;

        // Leaf equation: |ly| < width * (1 - (lx/length)^2)
        // Simplified ellipse check for speed
        if ((lx * lx) / (length * length) + (ly * ly) / (width * width) <= 1.0) {
           // Add a midrib
           if (Math.abs(ly) > width * 0.1) {
             setPixel(x, y, colorR, colorG, colorB);
           } else {
             // Darker midrib
             setPixel(x, y, colorR * 0.6, colorG * 0.6, colorB * 0.6);
           }
        }
      }
    }
  }

  // Generate pattern elements
  const numElements = 60;
  for (let i = 0; i < numElements; i++) {
    const x = nextRand() * texSize;
    const y = nextRand() * texSize;
    const type = Math.floor(nextRand() * 3); // 0: Leaf, 1: Flower Blob, 2: Long Leaf
    
    if (type === 0) {
      // Green Leaf
      const len = 20 + nextRand() * 40;
      const wid = 10 + nextRand() * 15;
      const ang = nextRand() * Math.PI * 2;
      const gVal = 100 + Math.floor(nextRand() * 100);
      drawLeaf(x, y, len, wid, ang, 20, gVal, 40);
    } else if (type === 1) {
      // Flower Blob (Orange/Pink/Yellow)
      const r = 15 + nextRand() * 25;
      const ang = nextRand() * Math.PI * 2;
      const colType = Math.floor(nextRand() * 3);
      let rC, gC, bC;
      if (colType === 0) { rC = 255; gC = 100; bC = 50; } // Orange
      else if (colType === 1) { rC = 255; gC = 200; bC = 100; } // Yellow
      else { rC = 255; gC = 100; bC = 150; } // Pink
      drawBlob(x, y, r, r * 0.6, ang, rC, gC, bC);
    } else {
      // Long Palm Leaf (Dark Green)
      const len = 40 + nextRand() * 60;
      const wid = 5 + nextRand() * 10;
      const ang = nextRand() * Math.PI * 2;
      drawLeaf(x, y, len, wid, ang, 30, 120, 50);
    }
  }

  const patternTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  patternTexture.colorSpace = THREE.SRGBColorSpace;
  patternTexture.needsUpdate = true;
  patternTexture.wrapS = THREE.RepeatWrapping;
  patternTexture.wrapT = THREE.RepeatWrapping;
  patternMat.map = patternTexture;

  // --- Geometry Construction ---

  // 1. Inner Patterned Sphere
  // Radius slightly smaller than outer glass to simulate thickness
  const innerRadius = 0.42;
  const innerSphereGeom = new THREE.SphereGeometry(innerRadius, 48, 48);
  const innerSphere = new THREE.Mesh(innerSphereGeom, patternMat);
  root.add(innerSphere);

  // 2. Outer Glass Shell
  const outerRadius = 0.45;
  const outerSphereGeom = new THREE.SphereGeometry(outerRadius, 48, 48);
  // BackSide ensures we see the inside surface if camera gets close, 
  // but for a solid object DoubleSide or FrontSide is usually fine. 
  // Given it's a "ball", FrontSide is standard.
  const glassSphere = new THREE.Mesh(outerSphereGeom, glassMat);
  root.add(glassSphere);

  // 3. Metallic Base
  // A flat cylinder with a slight bevel effect (using segments)
  const baseRadius = 0.22;
  const baseHeight = 0.06;
  const baseGeom = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.9, baseHeight, 32);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -outerRadius + (baseHeight * 0.5); // Sit just under the sphere
  root.add(base);

  // Add a subtle ring detail on the base
  const ringGeom = new THREE.TorusGeometry(baseRadius * 0.7, 0.01, 16, 32);
  const ring = new THREE.Mesh(ringGeom, baseMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -outerRadius + (baseHeight * 0.5) + 0.031; // On top of base
  root.add(ring);

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