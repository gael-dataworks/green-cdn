export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Peach skin: Matte, fuzzy, high roughness.
  // We will generate a procedural texture for the mottled pink/yellow look.
  const textureSize = 256;
  const data = new Uint8Array(textureSize * textureSize * 4);
  
  // Deterministic pseudo-random helper for texture generation
  function pseudoRandom(x, y) {
    return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
  }

  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const i = (y * textureSize + x) * 4;
      
      // Base yellow-cream color
      let r = 245, g = 230, b = 166; 
      
      const noise = pseudoRandom(x, y);
      const noise2 = pseudoRandom(x + 50, y + 50);

      // Add pink blush patches (mottled effect)
      // Use low-frequency noise for large patches
      const patchNoise = pseudoRandom(Math.floor(x / 20), Math.floor(y / 20));
      if (patchNoise > 0.4) {
        // Blend towards pink/red
        r = 230 + noise * 25;
        g = 140 + noise * 20;
        b = 140 + noise * 20;
      } else {
        // Keep yellowish but vary slightly
        r += (noise - 0.5) * 20;
        g += (noise - 0.5) * 20;
        b += (noise - 0.5) * 10;
      }

      // Add tiny speckles (fuzz/pores)
      if (noise2 > 0.96) {
        r *= 0.7; g *= 0.7; b *= 0.7;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  const skinTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat);
  skinTexture.colorSpace = THREE.SRGBColorSpace;
  skinTexture.needsUpdate = true;
  // Wrap to avoid seams if we were tiling, but for a sphere clamp is usually fine. 
  // However, standard wrapping prevents hard edges at UV=1.
  skinTexture.wrapS = THREE.RepeatWrapping;
  skinTexture.wrapT = THREE.RepeatWrapping;

  const peachMat = new THREE.MeshStandardMaterial({
    map: skinTexture,
    color: 0xffffff, // Keep white to let texture drive color
    metalness: 0.0,
    roughness: 0.85, // High roughness for fuzzy skin feel
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033, // Dark brown
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Geometry: Peach Body ---
  // Start with a sphere, then modify vertices to create the characteristic cleft.
  const radius = 1.0;
  const widthSegments = 40;
  const heightSegments = 40;
  const bodyGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  const positionAttribute = bodyGeom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i);

    // The cleft is on one side. Let's say +X side, near the Z=0 plane.
    // We want to indent the sphere where x > 0 and z is close to 0.
    // The cleft runs vertically mostly, deeper near the top (stem).
    
    if (vertex.x > 0.1) {
      // Calculate how close we are to the "seam" plane (Z=0)
      const zFactor = Math.max(0, 1 - Math.abs(vertex.z) * 3.0); // Influence drops off as |z| increases
      
      // Calculate depth of cleft based on Y (deeper near top/stem)
      // Stem is at +Y. Cleft is prominent in upper half.
      const yFactor = Math.max(0, vertex.y); 
      
      const indentStrength = 0.25 * zFactor * (0.5 + 0.5 * yFactor);
      
      // Push vertex inward along X
      vertex.x -= indentStrength;
      
      // Slight bulge on the sides of the cleft to make it look like two lobes
      if (zFactor > 0.5) {
         vertex.x += 0.05 * zFactor; 
      }
    }

    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  bodyGeom.computeVertexNormals();

  const peachBody = new THREE.Mesh(bodyGeom, peachMat);
  root.add(peachBody);

  // --- Geometry: Stem ---
  // Small brown stub in the indentation at the top
  const stemGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.12, 8);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  // Position at the top indentation
  stem.position.set(0.15, 0.95, 0); 
  // Rotate to sit naturally in the cleft
  stem.rotation.z = -Math.PI / 8;
  stem.rotation.x = Math.PI / 8;
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