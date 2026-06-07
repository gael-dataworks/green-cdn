export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Peach skin: matte, fuzzy, yellow/pink blend.
  // We generate a procedural texture to capture the mottled blush.
  const W = 256, H = 256;
  const data = new Uint8Array(W * H * 4);
  
  for (let i = 0; i < W * H; i++) {
    const x = i % W;
    const y = Math.floor(i / W);
    const u = x / W;
    const v = y / H;

    // Base yellow
    let r = 249, g = 227, b = 158;

    // Add pink blush using deterministic noise (sin/cos)
    // Create soft patches
    const noise = Math.sin(u * 12.0) * Math.cos(v * 10.0) + Math.sin(u * 25.0 + v * 15.0);
    const blushIntensity = Math.max(0, noise * 0.5 + 0.2); // 0 to ~0.7

    // Blend yellow with pink (#e88e8e -> r:232, g:142, b:142)
    r = r * (1 - blushIntensity) + 232 * blushIntensity;
    g = g * (1 - blushIntensity) + 142 * blushIntensity;
    b = b * (1 - blushIntensity) + 142 * blushIntensity;

    // Add subtle speckles (pores)
    if (Math.sin(u * 50.0) * Math.cos(v * 50.0) > 0.95) {
      r *= 0.9; g *= 0.9; b *= 0.8;
    }

    const idx = i * 4;
    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const peachSkinMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.85, // Fuzzy skin
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3a4a30, // Dark greenish-brown
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry: Peach Body ---

  // Start with a sphere
  const peachGeom = new THREE.SphereGeometry(1, 48, 48);
  const posAttr = peachGeom.attributes.position;
  const vertex = new THREE.Vector3();

  // Deform sphere to look like a peach:
  // 1. Slightly oblate (flatter top/bottom)
  // 2. Create the vertical cleft (suture) on the front
  // 3. Create the stem cavity at the top

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);

    // Normalize to get direction
    const dir = vertex.clone().normalize();
    
    // 1. Oblate shape: squash Y slightly
    // We apply this to the base radius conceptually, but here we modify position directly
    // Actually, let's just modify the radius based on angle.
    
    // 2. Cleft: Affects front (z > 0) near the center line (x ~ 0)
    if (vertex.z > 0.2) {
      // Calculate distance from center line (x=0)
      const distFromCenter = Math.abs(vertex.x);
      // Max influence width
      const width = 0.6; 
      
      if (distFromCenter < width) {
        // Smooth step function for the groove
        const factor = 1.0 - Math.pow(distFromCenter / width, 2); // 1 at center, 0 at edge
        const depth = 0.12 * factor; // Max depth of cleft
        
        // Push vertex inward along its normal, but primarily along X/Z plane to keep Y roundness
        // Actually, pushing along normal is safest for volume
        vertex.multiplyScalar(1.0 - depth * 0.15);
        
        // Specifically pull X towards 0 to sharpen the crease
        vertex.x *= (1.0 - depth * 0.8);
      }
    }

    // 3. Stem Cavity: Top pole (y > 0.8)
    if (vertex.y > 0.7) {
      const heightFactor = (vertex.y - 0.7) / 0.3; // 0 to 1
      const cavityDepth = 0.15 * Math.sin(heightFactor * Math.PI / 2);
      // Pull top vertices down and in
      vertex.y -= cavityDepth * 0.5;
      vertex.x *= (1.0 - cavityDepth * 0.3);
      vertex.z *= (1.0 - cavityDepth * 0.3);
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  peachGeom.computeVertexNormals();

  const peachBody = new THREE.Mesh(peachGeom, peachSkinMat);
  // Rotate slightly to show the cleft clearly in default view
  peachBody.rotation.y = -Math.PI / 6; 
  root.add(peachBody);

  // --- Geometry: Stem ---

  // Small stubby stem
  const stemGeom = new THREE.CylinderGeometry(0.04, 0.05, 0.12, 8);
  // Move pivot to bottom of stem so we can place it in the hole
  stemGeom.translate(0, -0.06, 0); 
  
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.set(0, 0.95, 0); // Sit in the cavity
  stem.rotation.x = Math.PI / 6; // Tilt slightly
  stem.rotation.z = -Math.PI / 8;
  root.add(stem);

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