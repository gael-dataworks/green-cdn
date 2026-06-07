export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Speckled Grey Stone ---
  // Generate a procedural texture for the stone grain/speckles
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (x + y * texSize) * 4;
      
      // Deterministic pseudo-noise using sine waves
      const nx = x / texSize;
      const ny = y / texSize;
      
      // Base noise layer
      const noise = Math.sin(nx * 40) * Math.cos(ny * 40) + 
                    Math.sin(nx * 100 + ny * 30) * 0.5;
      
      let r, g, b;
      
      // Base stone color (light grey)
      const base = 160; 
      const variation = Math.floor(noise * 20);
      
      r = base + variation;
      g = base + variation;
      b = base + variation;
      
      // Dark speckles (granite-like)
      if (noise < -0.8) {
        const dark = 60 + Math.floor(Math.sin(nx * 200) * 20);
        r = dark; g = dark; b = dark;
      } 
      // Light speckles (quartz-like)
      else if (noise > 0.7) {
        const light = 220 + Math.floor(Math.cos(ny * 200) * 20);
        r = light; g = light; b = light;
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255; // Alpha
    }
  }

  const stoneTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.needsUpdate = true;
  // Wrap texture to avoid seams if we were tiling, but for a stone we map once
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff, // Multiply with texture
    metalness: 0.0,
    roughness: 0.75, // Smooth but not glossy
    bumpMap: stoneTexture, // Use same texture for slight surface relief
    bumpScale: 0.002,
  });

  // --- Geometry: Elongated Organic Stone ---
  // Start with a high-segment sphere for smoothness
  const baseGeom = new THREE.SphereGeometry(1, 64, 64);
  const posAttr = baseGeom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    // 1. Scale to oblong shape (pill-like)
    // Stretch X significantly, Z moderately, flatten Y slightly
    vertex.x *= 1.9;
    vertex.z *= 1.3;
    vertex.y *= 0.85;
    
    // 2. Add organic irregularity (deterministic noise)
    // Use sine waves based on original position to create bumps
    const noise = Math.sin(vertex.x * 2.5) * Math.cos(vertex.y * 2.5) * Math.sin(vertex.z * 2.5);
    const irregularity = 1 + (noise * 0.06); // +/- 6% variation
    
    vertex.multiplyScalar(irregularity);
    
    // 3. Flatten the bottom slightly so it rests on the ground
    // If y is negative (bottom), push it up slightly to create a flat contact area
    if (vertex.y < 0) {
      const flattenFactor = 1 - (Math.abs(vertex.y) * 0.15); // More flatten at bottom
      vertex.y *= flattenFactor;
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  baseGeom.computeVertexNormals();

  const stone = new THREE.Mesh(baseGeom, stoneMat);
  
  // Rotate slightly to look natural, not perfectly axis-aligned
  stone.rotation.y = -Math.PI / 6; // 30 degrees
  stone.rotation.z = Math.PI / 12; // Slight tilt
  stone.rotation.x = Math.PI / 10; 

  root.add(stone);

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