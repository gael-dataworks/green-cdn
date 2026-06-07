export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark bronze/wood material for frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.5,
    roughness: 0.6,
  });

  // Slightly lighter metal for highlights/rim details
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Glass material - needs to look like it contains light
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });

  // --- Procedural Mural Texture ---
  // Simulates the colorful fantasy animal painting on the glass
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      
      // Base warm gradient (lantern glow)
      const ny = y / H;
      const nx = x / W;
      
      // Center is bright yellow/white, edges are pink/blue
      const distFromCenter = Math.sqrt((nx - 0.5)**2 + (ny - 0.5)**2);
      const brightness = 1.0 - distFromCenter * 0.8;
      
      let r = 255 * brightness;
      let g = 200 * brightness;
      let b = 150 * brightness;

      // Add "painting" noise and color patches
      const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 20;
      
      // Abstract shapes to suggest animals (blobs of color)
      // Fox/Cat orange patch
      if (Math.abs(x - 180) < 40 && Math.abs(y - 180) < 40) {
        r = 220 + noise; g = 100 + noise; b = 50 + noise;
      }
      // Flying creature blue/purple patch
      if (Math.abs(x - 100) < 50 && Math.abs(y - 80) < 30) {
        r = 150 + noise; g = 100 + noise; b = 220 + noise;
      }
      // Green grass at bottom
      if (y > 200) {
        r = 50 + noise; g = 150 + noise; b = 50 + noise;
      }
      // Sky blue at top
      if (y < 50) {
        r = 150 + noise; g = 200 + noise; b = 255 + noise;
      }

      data[idx] = Math.max(0, Math.min(255, r));
      data[idx + 1] = Math.max(0, Math.min(255, g));
      data[idx + 2] = Math.max(0, Math.min(255, b));
      data[idx + 3] = 255;
    }
  }
  
  const muralTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  muralTexture.colorSpace = THREE.SRGBColorSpace;
  muralTexture.wrapS = THREE.RepeatWrapping;
  muralTexture.wrapT = THREE.ClampToEdgeWrapping;
  muralTexture.needsUpdate = true;

  // Apply texture to a material that emits light slightly to simulate the lantern effect
  const glassPaintedMat = glassMat.clone();
  glassPaintedMat.map = muralTexture;
  glassPaintedMat.emissive = new THREE.Color(0xffaa00);
  glassPaintedMat.emissiveIntensity = 0.4;
  glassPaintedMat.emissiveMap = muralTexture;

  // --- Geometry Construction ---

  // 1. Base (Turned Wood/Metal)
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.35, 0),
    new THREE.Vector2(0.38, 0.05),
    new THREE.Vector2(0.32, 0.08),
    new THREE.Vector2(0.30, 0.12),
    new THREE.Vector2(0.28, 0.15), // Top of base, meets glass
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, frameMat);
  root.add(base);

  // 2. Glass Body
  const glassHeight = 0.9;
  const glassRadius = 0.28;
  const glassGeom = new THREE.CylinderGeometry(glassRadius, glassRadius, glassHeight, 32, 1, true);
  // Position glass on top of base
  const glass = new THREE.Mesh(glassGeom, glassPaintedMat);
  glass.position.y = 0.15 + glassHeight / 2;
  root.add(glass);

  // Inner light source (optional, adds to the glow)
  const bulbGeom = new THREE.SphereGeometry(glassRadius * 0.8, 16, 16);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffddaa });
  const bulb = new THREE.Mesh(bulbGeom, bulbMat);
  bulb.position.y = 0.15 + glassHeight / 2;
  root.add(bulb);

  // 3. Rim (Top of glass)
  const rimGeom = new THREE.TorusGeometry(glassRadius + 0.02, 0.015, 16, 32);
  const rim = new THREE.Mesh(rimGeom, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.15 + glassHeight;
  root.add(rim);

  // Decorative band below rim
  const bandGeom = new THREE.CylinderGeometry(glassRadius + 0.02, glassRadius + 0.02, 0.04, 32);
  const band = new THREE.Mesh(bandGeom, frameMat);
  band.position.y = 0.15 + glassHeight - 0.02;
  root.add(band);

  // 4. Lid (Domed)
  const lidProfile = [
    new THREE.Vector2(0.28, 0), // Bottom edge matches rim
    new THREE.Vector2(0.30, 0.02),
    new THREE.Vector2(0.25, 0.15),
    new THREE.Vector2(0.15, 0.25),
    new THREE.Vector2(0.0, 0.28), // Top center
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, frameMat);
  lid.position.y = 0.15 + glassHeight + 0.02;
  root.add(lid);

  // 5. Lid Knob
  const knobGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const knob = new THREE.Mesh(knobGeom, frameMat);
  knob.position.y = 0.15 + glassHeight + 0.28 + 0.04;
  root.add(knob);

  // 6. Handle (Curved Arch)
  // Create a curve for the handle
  const handlePoints = [];
  const handleRadius = 0.35;
  const handleHeight = 0.6;
  const segments = 20;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = Math.PI * t; // 0 to PI
    // Arch shape: semi-circle-ish
    const hx = Math.cos(angle) * handleRadius;
    const hy = Math.sin(angle) * handleHeight;
    handlePoints.push(new THREE.Vector3(hx, hy, 0));
  }
  
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.025, 8, false);
  const handle = new THREE.Mesh(handleGeom, frameMat);
  // Position handle on top of lid knob
  handle.position.y = 0.15 + glassHeight + 0.28 + 0.04;
  root.add(handle);

  // Handle Attachments (loops on the side of the lid/rim)
  const loopGeom = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
  const loopLeft = new THREE.Mesh(loopGeom, frameMat);
  loopLeft.rotation.y = Math.PI / 2;
  loopLeft.position.set(-handleRadius, 0.15 + glassHeight + 0.1, 0);
  root.add(loopLeft);

  const loopRight = new THREE.Mesh(loopGeom, frameMat);
  loopRight.rotation.y = Math.PI / 2;
  loopRight.position.set(handleRadius, 0.15 + glassHeight + 0.1, 0);
  root.add(loopRight);

  // Normalize
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