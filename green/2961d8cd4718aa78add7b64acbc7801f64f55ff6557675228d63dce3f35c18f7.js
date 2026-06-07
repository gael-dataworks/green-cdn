export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Procedural Granite Texture ---
  // Using a deterministic LCG for pixel noise to avoid Math.random
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  let seed = 12345;
  
  // Base colors
  const baseR = 184, baseG = 184, baseB = 184; // Light grey #b8b8b8
  const darkR = 50, darkG = 50, darkB = 50;   // Dark speckle
  const lightR = 230, lightG = 230, lightB = 230; // White speckle
  const midR = 130, midG = 130, midB = 130;   // Mid-grey speckle

  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      // LCG Random
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280;
      
      let r = baseR, g = baseG, b = baseB;
      
      if (rnd > 0.98) {
        // White speckle
        r = lightR; g = lightG; b = lightB;
      } else if (rnd > 0.94) {
        // Black/Dark speckle
        r = darkR; g = darkG; b = darkB;
      } else if (rnd > 0.88) {
        // Mid-grey variation
        r = midR; g = midG; b = midB;
      } else {
        // Slight base variation for natural look
        const variation = (rnd - 0.5) * 20;
        r += variation; g += variation; b += variation;
      }
      
      const idx = (x + y * texSize) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  
  const stoneTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.needsUpdate = true;
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.65,
  });

  // --- Geometry: Smooth Rounded Stone ---
  // High segment sphere to ensure smooth silhouette
  const stoneGeom = new THREE.SphereGeometry(1, 64, 32);
  
  // Add subtle organic imperfection to vertices
  const positions = stoneGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);
    
    // Deterministic noise based on vertex position
    const noise = Math.sin(vertex.x * 8.0) * Math.cos(vertex.y * 7.0) * Math.sin(vertex.z * 9.0);
    
    // Very subtle displacement (2% of radius) to break perfect CG smoothness
    const displacement = noise * 0.02;
    
    vertex.normalize().multiplyScalar(1.0 + displacement);
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  stoneGeom.computeVertexNormals();

  const stone = new THREE.Mesh(stoneGeom, stoneMat);
  
  // Shape Scaling: Elongated pill shape, slightly flattened
  // Reference is roughly 2:1:1.5 ratio
  stone.scale.set(2.1, 1.2, 1.5);
  
  // Orientation: Angled slightly to show volume
  stone.rotation.y = -Math.PI / 8;
  stone.rotation.z = Math.PI / 12;
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