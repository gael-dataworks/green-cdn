export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material & Texture ---
  // Create a procedural speckled stone texture
  const texSize = 512;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 180, g: 180, b: 185 }; // Light cool gray
  
  // Deterministic pseudo-random hash
  function hash(x, y) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  }

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Start with base color
      let r = baseColor.r;
      let g = baseColor.g;
      let b = baseColor.b;

      const h = hash(x, y);
      
      // Add speckles (dark and light aggregates)
      if (h > 0.94) {
        // Dark speckle
        r = 60; g = 60; b = 65;
      } else if (h < 0.06) {
        // Light speckle (quartz-like)
        r = 230; g = 230; b = 235;
      } else if (h > 0.85 && h <= 0.94) {
        // Medium gray variation
        const noise = (h - 0.85) * 20;
        r -= noise; g -= noise; b -= noise;
      }

      // Add some fine grain noise to everything
      const grain = (hash(x + 100, y + 100) - 0.5) * 10;
      r += grain; g += grain; b += grain;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
      data[i + 3] = 255;
    }
  }

  const stoneTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.needsUpdate = true;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff, // Multiply with texture
    metalness: 0.0,
    roughness: 0.65, // Smooth but not glossy
  });

  // --- Geometry ---
  // Start with a high-segment sphere for smoothness
  const geometry = new THREE.SphereGeometry(1, 96, 96);
  const posAttr = geometry.attributes.position;
  const vertex = new THREE.Vector3();

  // Shape parameters
  const scaleX = 1.8; // Elongated
  const scaleY = 0.75; // Flattened
  const scaleZ = 1.3; // Slightly wide

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);

    // 1. Basic Ellipsoid Scaling
    vertex.x *= scaleX;
    vertex.y *= scaleY;
    vertex.z *= scaleZ;

    // 2. Organic Shape Distortion (Low frequency noise)
    // We use trig functions of the original direction to create smooth bumps
    // Normalize to get direction, then apply noise to radius
    const originalDir = vertex.clone().normalize();
    
    // Combine sine waves to create irregular "potato" shape
    const noise = 
      Math.sin(originalDir.x * 3.5 + originalDir.y * 2.1) * 0.08 +
      Math.cos(originalDir.z * 4.2 + originalDir.x * 1.5) * 0.06 +
      Math.sin(originalDir.y * 5.0 + originalDir.z * 3.0) * 0.04;
    
    // Apply noise along the normal
    vertex.add(originalDir.clone().multiplyScalar(noise));

    // 3. Flatten the bottom slightly so it rests naturally
    // If y is very low, push it up slightly to create a flat contact patch
    if (vertex.y < -0.6 * scaleY) {
      const flattenFactor = 0.5; // How much to flatten
      const threshold = -0.6 * scaleY;
      vertex.y = threshold + (vertex.y - threshold) * flattenFactor;
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();

  const stone = new THREE.Mesh(geometry, stoneMat);
  
  // Rotate slightly to match the dynamic angle in the reference
  stone.rotation.x = Math.PI / 10;
  stone.rotation.y = -Math.PI / 6;
  stone.rotation.z = Math.PI / 12;

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