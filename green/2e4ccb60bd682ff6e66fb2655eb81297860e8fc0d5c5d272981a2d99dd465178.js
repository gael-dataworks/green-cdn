export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Glass sphere material with transmission for that "crystal ball" look
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Brushed metal base
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Procedural Texture Generation ---
  // We need a complex tropical print. We will draw this onto a DataTexture.
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Helper to set pixel color
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= texSize || y < 0 || y >= texSize) return;
    const idx = (y * texSize + x) * 4;
    // Simple alpha blending with existing background (initially white)
    const alpha = a / 255;
    const invAlpha = 1 - alpha;
    
    // Current background is roughly white/light grey, we just overwrite for simplicity 
    // or blend if we were doing complex layering. Here we draw opaque shapes on light bg.
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = a;
  }

  // Fill background (Light misty grey/white)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 235;     // R
    data[i + 1] = 238; // G
    data[i + 2] = 242; // B
    data[i + 3] = 255; // A
  }

  // Deterministic pseudo-random helper (LCG)
  let seed = 12345;
  function rand() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // Drawing helpers
  function drawCircle(cx, cy, r, colorR, colorG, colorB) {
    const rSq = r * r;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= rSq) {
          setPixel(x, y, colorR, colorG, colorB);
        }
      }
    }
  }

  function drawLeaf(cx, cy, angle, length, width, type) {
    // type 0: Palm frond (long, thin segments)
    // type 1: Monstera (broad with holes)
    // type 2: Fern (small leaflets)
    
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Draw main spine
    for (let t = -length / 2; t < length / 2; t += 1) {
      const px = cx + t * cosA;
      const py = cy + t * sinA;
      
      // Leaf width varies along length (tapered)
      const taper = 1 - Math.abs(t / (length / 2));
      const currentW = width * taper;

      // Draw cross-section
      for (let w = -currentW; w <= currentW; w += 1) {
        // Perpendicular offset
        const ox = -w * sinA;
        const oy = w * cosA;
        
        let lx = Math.floor(px + ox);
        let ly = Math.floor(py + oy);

        // Color variation for veins
        const isVein = Math.abs(w) < 2;
        const r = isVein ? 100 : 60;
        const g = isVein ? 160 : 120;
        const b = 60;

        setPixel(lx, ly, r, g, b);
      }
      
      // Add leaflets for palm/fern types
      if (type === 0 || type === 2) {
        const segmentGap = type === 0 ? 8 : 4;
        if (Math.abs(t) % segmentGap < 2) {
           const leafletLen = type === 0 ? currentW * 2 : currentW;
           for (let l = 0; l < leafletLen; l++) {
             const lox = -l * sinA;
             const loy = l * cosA;
             setPixel(Math.floor(px + lox), Math.floor(py + loy), 70, 140, 70);
             // Other side
             setPixel(Math.floor(px - lox), Math.floor(py - loy), 70, 140, 70);
           }
        }
      }
    }
    
    // Monstera holes (deterministic based on position)
    if (type === 1) {
       // Draw some lighter "holes" or just darker veins
       // Simplified: just draw the broad shape above, maybe add some cuts
       // For simplicity in pixel loop, we rely on the spine logic above for the shape
    }
  }

  function drawFlower(cx, cy, angle, size, petals, colorR, colorG, colorB) {
    for (let i = 0; i < petals; i++) {
      const pAngle = angle + (i / petals) * Math.PI * 2;
      const px = cx + Math.cos(pAngle) * size * 0.6;
      const py = cy + Math.sin(pAngle) * size * 0.6;
      
      // Draw petal (ellipse)
      const pLen = size * 0.8;
      const pWid = size * 0.3;
      
      for (let y = -pLen; y <= pLen; y++) {
        for (let x = -pWid; x <= pWid; x++) {
           if ((x*x)/(pWid*pWid) + (y*y)/(pLen*pLen) <= 1) {
             // Rotate point
             const rx = x * Math.cos(pAngle) - y * Math.sin(pAngle);
             const ry = x * Math.sin(pAngle) + y * Math.cos(pAngle);
             setPixel(Math.floor(px + rx), Math.floor(py + ry), colorR, colorG, colorB);
           }
        }
      }
    }
    // Center
    drawCircle(cx, cy, size * 0.3, 255, 255, 0);
  }

  // --- Compose the Texture ---
  
  // 1. Large Green Leaves (Background layer)
  // Palm frond 1
  drawLeaf(100, 300, -Math.PI / 4, 200, 25, 0); 
  // Palm frond 2
  drawLeaf(400, 150, Math.PI / 3, 180, 20, 0);
  // Monstera-ish broad leaf
  drawLeaf(250, 400, Math.PI / 6, 150, 60, 1);
  // Another fern
  drawLeaf(150, 100, Math.PI / 2, 120, 15, 2);

  // 2. Flowers (Foreground layer)
  // Orange lily (left)
  drawFlower(120, 250, 0, 60, 6, 255, 100, 50);
  // Yellow lily (center-right)
  drawFlower(350, 280, -Math.PI/6, 50, 6, 255, 200, 50);
  // Pink hibiscus (bottom right)
  drawFlower(400, 380, 0, 45, 5, 255, 150, 200);
  // Blue flower (top left)
  drawFlower(100, 120, Math.PI/4, 30, 5, 100, 100, 255);
  // Small orange cluster (bottom left)
  drawFlower(150, 420, -Math.PI/3, 25, 5, 255, 120, 50);

  // 3. Noise/Texture overlay to make it look less digital
  for (let i = 0; i < 5000; i++) {
    const x = Math.floor(rand() * texSize);
    const y = Math.floor(rand() * texSize);
    const noise = Math.floor(rand() * 20) - 10;
    // Very subtle noise
    // We won't implement complex blending here to save code space, 
    // just rely on the shapes.
  }

  const texture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping; // Clamp vertically, repeat horizontally if needed
  
  glassMat.map = texture;

  // --- Geometry & Meshes ---

  // 1. The Sphere
  const sphereGeom = new THREE.SphereGeometry(1, 64, 64);
  const sphere = new THREE.Mesh(sphereGeom, glassMat);
  sphere.name = "tropical_sphere";
  root.add(sphere);

  // 2. The Base
  // A short cylinder, slightly wider than sphere contact point
  const baseGeom = new THREE.CylinderGeometry(0.6, 0.7, 0.15, 32);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = -1.0 - 0.075; // Sit below the sphere (radius 1)
  base.name = "metal_base";
  root.add(base);
  
  // Add a small ring detail on top of base for realism
  const ringGeom = new THREE.TorusGeometry(0.5, 0.03, 16, 32);
  const ring = new THREE.Mesh(ringGeom, baseMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.0 + 0.01;
  ring.name = "base_ring";
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