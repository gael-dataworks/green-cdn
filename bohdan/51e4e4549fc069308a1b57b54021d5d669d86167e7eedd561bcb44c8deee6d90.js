export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Peach skin: matte, high roughness, no metalness.
  const peachMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base color overridden by map, but kept white for texture dominance
    metalness: 0.0,
    roughness: 0.85,
  });

  // Stem: dark, woody, matte.
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3a2e1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Texture for Peach Skin ---
  // Generates a mottled pink/yellow pattern with small spots deterministically.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Deterministic pseudo-noise using sin
      const nx = x / texSize;
      const ny = y / texSize;
      
      // Base cream/yellow
      let r = 250, g = 230, b = 180;
      
      // Add pink blush patches (large scale noise)
      const blush = Math.sin(nx * 6.0) * Math.cos(ny * 4.0) + Math.sin(nx * 12.0 + ny * 5.0) * 0.5;
      if (blush > 0.5) {
        const intensity = (blush - 0.5) * 1.5;
        r = Math.min(255, r + intensity * 60);
        g = Math.min(255, g + intensity * 20);
        b = Math.min(255, b + intensity * 40);
      }
      
      // Add small brown spots (high frequency noise)
      const spotNoise = Math.sin(nx * 40.0) * Math.sin(ny * 40.0) * Math.cos(nx * 15.0);
      if (spotNoise > 0.85) {
        r = 150; g = 100; b = 80;
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  
  const peachTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  peachTexture.colorSpace = THREE.SRGBColorSpace;
  peachTexture.needsUpdate = true;
  peachMat.map = peachTexture;

  // --- Geometry: Peach Body ---
  // Start with a sphere and deform vertices to create the characteristic cleft and stem cavity.
  const radius = 0.5;
  const widthSeg = 64;
  const heightSeg = 64;
  const peachGeom = new THREE.SphereGeometry(radius, widthSeg, heightSeg);
  
  const posAttr = peachGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    // Convert to spherical-like coords for deformation logic
    // We treat Y as up. 
    const dist = vertex.length();
    const yNorm = vertex.y / radius; // -1 to 1
    const angleXZ = Math.atan2(vertex.z, vertex.x); // -PI to PI
    
    let deformation = 0;
    
    // 1. Stem Cavity (Top Pole)
    // Pull vertices inward as they approach y = radius
    if (yNorm > 0.6) {
      const cavityDepth = 0.15 * Math.pow((yNorm - 0.6) / 0.4, 2);
      deformation -= cavityDepth;
    }
    
    // 2. The Cleft (Vertical Seam)
    // The cleft is typically on one side. Let's align it with +X axis (angle 0)
    // We want a groove that runs vertically along the upper hemisphere mostly.
    // Normalize angle to 0..PI range for symmetry check around 0
    let angleDist = Math.abs(angleXZ);
    if (angleDist > Math.PI) angleDist = 2 * Math.PI - angleDist;
    
    // Only deform near the seam (angle ~ 0) and mostly on the upper half
    if (angleDist < 0.4 && yNorm > -0.2) {
      const seamFactor = 1.0 - (angleDist / 0.4); // 1 at center, 0 at edge
      const verticalFactor = yNorm > 0 ? 1.0 : (yNorm + 0.2) / 0.2; // Fade out at bottom
      
      const cleftDepth = 0.08 * seamFactor * verticalFactor;
      deformation -= cleftDepth;
    }
    
    // Apply deformation along the normal (which is normalized vertex pos for sphere)
    const normal = vertex.clone().normalize();
    vertex.add(normal.multiplyScalar(deformation));
    
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  peachGeom.computeVertexNormals();
  
  const peachBody = new THREE.Mesh(peachGeom, peachMat);
  // Rotate slightly so the cleft faces somewhat forward-right for a natural look
  peachBody.rotation.y = -Math.PI / 6; 
  root.add(peachBody);

  // --- Geometry: Stem ---
  // Small woody stub in the cavity
  const stemGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.06, 8);
  // Shift geometry so pivot is at bottom
  stemGeom.translate(0, 0.03, 0); 
  // Tilt it slightly to look natural
  const stem = new THREE.Mesh(stemGeom, stemMat);
  stem.position.set(0, 0.48, 0); // Place at top of peach (before rotation)
  stem.rotation.x = Math.PI / 6; // Tilt back slightly
  stem.rotation.z = -Math.PI / 8; // Tilt side
  
  // Parent stem to body so it rotates with the cleft orientation
  peachBody.add(stem);

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