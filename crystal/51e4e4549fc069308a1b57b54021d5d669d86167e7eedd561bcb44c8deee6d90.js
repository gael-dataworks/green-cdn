export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Peach skin: Matte, fuzzy, high roughness.
  // We will use a DataTexture for the color variation (yellow base + pink blush).
  const peachMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Base white, texture provides color
    metalness: 0.0,
    roughness: 0.85, // Fuzzy skin
  });

  // Stem: Woody, dark, rough.
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Procedural Texture for Peach Skin ---
  // Generates a yellow base with pink blush and tiny speckles.
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      
      // Normalized coordinates -1 to 1
      const u = (x / texSize) * 2 - 1;
      const v = (y / texSize) * 2 - 1;
      
      // Base color: Soft Yellow (#ffe066 approx)
      let r = 255, g = 224, b = 102;
      
      // Deterministic "noise" for blush using sin/cos
      // Create a gradient/blush on one side (positive X in UV space)
      const noiseVal = Math.sin(u * 10.0) * Math.cos(v * 10.0) * 0.5 + 0.5;
      const blushIntensity = Math.max(0, u * 0.8 + noiseVal * 0.3);
      
      // Blend towards Pink/Red (#ff6b6b approx)
      const pr = 255, pg = 107, pb = 107;
      
      r = r * (1 - blushIntensity) + pr * blushIntensity;
      g = g * (1 - blushIntensity) + pg * blushIntensity;
      b = b * (1 - blushIntensity) + pb * blushIntensity;
      
      // Add tiny speckles (lenticels)
      const speckle = (Math.sin(x * 13.0) * Math.cos(y * 17.0) > 0.96) ? 0.6 : 1.0;
      
      data[i] = Math.min(255, r * speckle);
      data[i + 1] = Math.min(255, g * speckle);
      data[i + 2] = Math.min(255, b * speckle);
      data[i + 3] = 255;
    }
  }
  
  const peachTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  peachTexture.colorSpace = THREE.SRGBColorSpace;
  peachTexture.needsUpdate = true;
  peachTexture.wrapS = THREE.RepeatWrapping;
  peachTexture.wrapT = THREE.RepeatWrapping;
  peachMat.map = peachTexture;

  // --- Geometry: Peach Body ---
  // Start with a sphere, high segments for smooth deformation.
  const peachGeom = new THREE.SphereGeometry(0.5, 64, 64);
  const posAttr = peachGeom.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    // Calculate spherical coordinates
    const r = vertex.length();
    const theta = Math.atan2(vertex.x, vertex.z); // Angle around Y axis
    const phi = Math.acos(vertex.y / r); // Angle from Y pole
    
    // Create the suture (crease)
    // The crease runs vertically. We indent the geometry near theta = 0 (front) and theta = PI (back)
    // But mostly we want one main visible crease. Let's make a groove along the X-axis (theta = PI/2 and -PI/2)
    // Actually, looking at the image, the crease is on the side.
    // Let's create a groove where x is positive and z is near 0.
    
    // Simple groove function: indent based on angle proximity to 0 (Z-axis)
    // We want the groove to run from top to bottom.
    const angleFromSeam = Math.abs(Math.atan2(vertex.x, vertex.z));
    
    // Indent factor: strongest at the "seam" line, fading out
    // We create a seam along the positive X axis roughly
    let indent = 0;
    
    // Seam 1 (Front-Rightish)
    const seam1 = Math.abs(theta - 0.5); // Offset slightly
    if (seam1 < 0.8) {
      indent += 0.08 * Math.exp(-seam1 * 3.0);
    }
    
    // Seam 2 (Back-Leftish) - to close the loop
    const seam2 = Math.abs(Math.abs(theta) - Math.PI);
    if (seam2 < 0.8) {
      indent += 0.08 * Math.exp(-seam2 * 3.0);
    }
    
    // Flatten poles slightly (peaches are oblate)
    const poleIndent = Math.pow(Math.abs(vertex.y), 3) * 0.05;
    
    const newR = r - indent - poleIndent;
    vertex.normalize().multiplyScalar(newR);
    
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  peachGeom.computeVertexNormals();
  
  const peach = new THREE.Mesh(peachGeom, peachMat);
  // Rotate so the main crease is visible as in the reference
  peach.rotation.y = -0.5; 
  root.add(peach);

  // --- Geometry: Stem / Calyx ---
  // Small dark cylinder/cone at the top depression
  const stemGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.06, 8);
  const stem = new THREE.Mesh(stemGeom, stemMat);
  // Position at top, slightly offset into the depression
  stem.position.set(0.15, 0.45, 0.1); 
  stem.rotation.z = -0.5; // Angle it slightly
  stem.rotation.y = -1.0;
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