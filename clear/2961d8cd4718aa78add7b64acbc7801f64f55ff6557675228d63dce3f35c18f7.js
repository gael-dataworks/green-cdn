export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Speckled Granite/Stone ---
  // We generate a procedural DataTexture for the speckled surface.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Deterministic pseudo-random noise based on coordinates
      const n1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const noise1 = n1 - Math.floor(n1);
      
      const n2 = Math.sin(x * 45.5432 + y * 23.1234) * 65432.1234;
      const noise2 = n2 - Math.floor(n2);

      // Base stone color (light gray)
      let r = 180, g = 180, b = 180;

      // Add grain (subtle variation)
      const grain = noise1 * 20 - 10;
      r += grain; g += grain; b += grain;

      // Add dark speckles (black/charcoal) - sparse
      if (noise2 > 0.96) {
        r = 40; g = 40; b = 40;
      } 
      // Add light speckles (white quartz) - sparse
      else if (noise2 < 0.04) {
        r = 240; g = 240; b = 240;
      }
      // Add mid-tone speckles (darker gray)
      else if (noise1 > 0.85 && noise1 < 0.90) {
        r = 100; g = 100; b = 100;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const stoneTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.needsUpdate = true;
  // Wrap to avoid seams if we were tiling, but for a single stone clamp is fine or repeat.
  // Since it's a closed mesh, repeat is safer for UV mapping continuity if we map carefully,
  // but standard sphere mapping works well with clamp or repeat.
  stoneTexture.wrapS = THREE.RepeatWrapping;
  stoneTexture.wrapT = THREE.RepeatWrapping;

  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTexture,
    color: 0xffffff, // Keep white to let texture drive color
    metalness: 0.0,
    roughness: 0.85, // Matte stone
  });

  // --- Geometry: Organic Pebble ---
  // Start with a sphere, high segments for smoothness.
  const radius = 1;
  const widthSegments = 64;
  const heightSegments = 32;
  const geom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  // Modify vertices to create the elongated, irregular pebble shape
  const posAttr = geom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);

    // Deterministic noise for organic shape
    // We want it elongated along X, slightly flattened on Y, irregular on Z
    const nx = Math.sin(vertex.y * 3.1 + vertex.z * 1.5) * 0.05;
    const ny = Math.cos(vertex.x * 2.5 + vertex.z * 2.0) * 0.05;
    const nz = Math.sin(vertex.x * 1.8 + vertex.y * 1.2) * 0.05;

    // Base scaling for pill shape
    let scaleX = 1.8; // Elongated
    let scaleY = 0.75; // Flattened
    let scaleZ = 1.3; // Slightly wide

    // Apply organic noise to scale
    scaleX += nx;
    scaleY += ny;
    scaleZ += nz;

    // Ensure no negative scales or collapses
    scaleX = Math.max(0.5, scaleX);
    scaleY = Math.max(0.5, scaleY);
    scaleZ = Math.max(0.5, scaleZ);

    vertex.x *= scaleX;
    vertex.y *= scaleY;
    vertex.z *= scaleZ;

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geom.computeVertexNormals();

  const stone = new THREE.Mesh(geom, stoneMat);
  
  // Orient the stone to rest naturally (flat side down roughly)
  // The noise might make it wobbly, so we rotate it slightly to find a stable pose visually
  stone.rotation.x = 0.2;
  stone.rotation.z = -0.1;
  stone.rotation.y = 0.5;

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