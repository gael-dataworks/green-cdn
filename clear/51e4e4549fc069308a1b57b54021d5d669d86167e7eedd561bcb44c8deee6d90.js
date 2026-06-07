export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Peach skin: Matte, fuzzy, high roughness. Color handled by texture.
  const peachSkinMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Stem: Dark, woody, rough.
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Texture Generation (Procedural) ---
  // Creates a fuzzy yellow/pink skin with speckles and a blush gradient.
  function createPeachTexture(THREE) {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    
    // Base colors
    const baseYellow = { r: 255, g: 230, b: 180 }; // Light creamy yellow
    const blushPink = { r: 255, g: 150, b: 150 };   // Soft pink
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        // Normalize coordinates for spherical mapping logic
        const u = x / width; // 0 to 1
        const v = y / height; // 0 to 1
        
        // Map to angle around the sphere (0 to 2PI)
        // The crease will be at angle 0 (and 2PI)
        const angle = u * Math.PI * 2;
        
        // 1. Base Color Interpolation
        // We want the pink blush on one side (e.g., around PI) and yellow on the other
        // But peaches often have a gradient. Let's make the "back" (PI) pinker.
        // Using cosine to create a smooth gradient across the sphere.
        // cos(angle) is 1 at 0, -1 at PI.
        // We want pink at PI, so we use (1 - cos(angle)) / 2 -> 0 at 0, 1 at PI.
        const blushFactor = Math.max(0, (1 - Math.cos(angle)) * 0.8);
        
        let r = baseYellow.r + (blushPink.r - baseYellow.r) * blushFactor;
        let g = baseYellow.g + (blushPink.g - baseYellow.g) * blushFactor;
        let b = baseYellow.b + (blushPink.b - baseYellow.b) * blushFactor;
        
        // 2. Speckles / Pores (Deterministic Noise)
        // Use a combination of sin/cos to simulate pseudo-random noise without Math.random
        const noiseVal = Math.sin(x * 13.5 + y * 27.3) * Math.cos(x * 5.1 - y * 19.2);
        
        // Add small dark speckles
        if (noiseVal > 0.85) {
          r *= 0.7;
          g *= 0.7;
          b *= 0.6;
        }
        
        // Add subtle variation/noise to the base color to break up flatness
        const variation = Math.sin(x * 31.4 + y * 11.7) * 0.05;
        r = r * (1 + variation);
        g = g * (1 + variation);
        b = b * (1 + variation);
        
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
        data[i + 3] = 255; // Alpha
      }
    }
    
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Wrap horizontally so the seam at 0/2PI matches (it should, as both are yellow/crease area)
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  peachSkinMat.map = createPeachTexture(THREE);

  // --- Geometry: Peach Body ---
  // Start with a sphere and deform vertices to create the characteristic crease (suture).
  const radius = 1.0;
  const widthSegments = 64;
  const heightSegments = 64;
  const peachGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  
  const positionAttribute = peachGeom.attributes.position;
  const vertex = new THREE.Vector3();
  
  for (let i = 0; i < positionAttribute.count; i++) {
    vertex.fromBufferAttribute(positionAttribute, i);
    
    // Calculate spherical coordinates
    // We want to indent the sphere along the +X axis (angle 0)
    const angle = Math.atan2(vertex.z, vertex.x); // Angle in XZ plane
    const distFromCenter = vertex.length();
    
    // The crease is a groove along the X axis.
    // We use a Gaussian-like function to pull vertices inward near angle 0.
    // Normalize angle to -PI to PI.
    let normalizedAngle = angle;
    if (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
    if (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;
    
    // Absolute distance from the crease line (angle 0)
    const absAngle = Math.abs(normalizedAngle);
    
    // Displacement factor: strong near 0, fades out by ~1 radian
    // Using exp(-x^2) shape for smooth groove
    const grooveDepth = 0.18; // How deep the crease is
    const grooveWidth = 2.5;  // How wide the influence is
    const displacement = grooveDepth * Math.exp(-Math.pow(absAngle * grooveWidth, 2));
    
    // Also flatten the sphere slightly overall (peaches are often oblate)
    // And lift the "bottom" slightly
    const overallScale = 1.0 - 0.05 * Math.abs(Math.sin(vertex.y * Math.PI)); 
    
    // Apply displacement along the normal (which is normalized vertex for a sphere)
    const newRadius = (distFromCenter - displacement) * overallScale;
    
    vertex.normalize().multiplyScalar(newRadius);
    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  peachGeom.computeVertexNormals();
  
  const peachMesh = new THREE.Mesh(peachGeom, peachSkinMat);
  // Rotate so the crease faces somewhat forward/side for good visibility
  peachMesh.rotation.y = -Math.PI / 4; 
  root.add(peachMesh);

  // --- Geometry: Stem ---
  // A small rough cylinder/capsule sitting in the crease depression
  const stemGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.15, 8);
  const stemMesh = new THREE.Mesh(stemGeom, stemMat);
  
  // Position stem in the crease (which we aligned to +X before rotation)
  // The crease is at local +X. The depression is deepest there.
  // We need to place the stem slightly inside the surface.
  stemMesh.position.set(0.95, 0.05, 0);
  
  // Rotate stem to point slightly outward and up
  stemMesh.rotation.z = -Math.PI / 3;
  stemMesh.rotation.y = Math.PI / 2; // Align cylinder axis
  
  root.add(stemMesh);

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