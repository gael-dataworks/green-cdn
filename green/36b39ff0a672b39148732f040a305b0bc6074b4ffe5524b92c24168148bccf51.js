export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Rusty metal: dark brown base, high roughness, low-medium metalness.
  // We will apply a procedural noise texture to simulate rust patches.
  const rustColor = new THREE.Color(0x5c3a21);
  const lightRustColor = new THREE.Color(0x8f5030);
  
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  
  // Deterministic pseudo-random noise for rust texture
  let seed = 12345;
  function nextRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = 0; i < texSize * texSize; i++) {
    const noise = nextRandom();
    // Mix base rust and light rust based on noise
    const r = rustColor.r + (lightRustColor.r - rustColor.r) * noise;
    const g = rustColor.g + (lightRustColor.g - rustColor.g) * noise;
    const b = rustColor.b + (lightRustColor.b - rustColor.b) * noise;
    
    data[i * 4 + 0] = Math.floor(r * 255);
    data[i * 4 + 1] = Math.floor(g * 255);
    data[i * 4 + 2] = Math.floor(b * 255);
    data[i * 4 + 3] = 255;
  }

  const rustTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  rustTexture.colorSpace = THREE.SRGBColorSpace;
  rustTexture.wrapS = THREE.RepeatWrapping;
  rustTexture.wrapT = THREE.RepeatWrapping;
  rustTexture.repeat.set(3, 1); // Stretch along the handle
  rustTexture.needsUpdate = true;

  const rustMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Tinted by texture
    map: rustTexture,
    metalness: 0.4,
    roughness: 0.85,
  });

  // --- Geometry & Meshes ---

  // 1. Handle
  // Tapered cylinder. Length 0.7, Radius 0.04 -> 0.035.
  // Aligned along X axis.
  const handleGeom = new THREE.CylinderGeometry(0.04, 0.035, 0.7, 16);
  const handle = new THREE.Mesh(handleGeom, rustMat);
  handle.rotation.z = Math.PI / 2; // Rotate to lie along X
  handle.position.x = -0.15; // Shift left so head can be at positive X
  root.add(handle);

  // Handle End Cap (Rounded Pommel)
  // Sphere at the left end of the handle.
  const pommelGeom = new THREE.SphereGeometry(0.035, 16, 16);
  const pommel = new THREE.Mesh(pommelGeom, rustMat);
  pommel.position.x = -0.5; // Approx end of handle (-0.15 - 0.35)
  // Scale slightly to blend with cylinder
  pommel.scale.set(1.1, 0.9, 0.9); 
  root.add(pommel);

  // 2. Head
  // Rectangular block with rounded edges. 
  // Dimensions: Depth (X) 0.14, Height (Y) 0.22, Width (Z) 0.18.
  // Positioned at the right end of the handle.
  const headGeom = new THREE.BoxGeometry(0.14, 0.22, 0.18);
  const head = new THREE.Mesh(headGeom, rustMat);
  head.position.x = 0.22; // Overlaps with handle end
  // Slight rotation to look natural/worn, not perfectly axis aligned
  head.rotation.z = 0.02; 
  head.rotation.y = -0.02;
  root.add(head);

  // 3. Head Details (Striking Faces)
  // The faces are slightly convex/worn. We can add thin discs to represent the worn faces.
  // Front Face (Positive X side of head)
  const faceGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.01, 16);
  const frontFace = new THREE.Mesh(faceGeom, rustMat);
  frontFace.rotation.y = Math.PI / 2; // Face normal along X
  frontFace.position.x = 0.22 + 0.07 + 0.005; // Head center + half depth + offset
  root.add(frontFace);

  // Back Face (Negative X side of head, near handle junction)
  const backFace = new THREE.Mesh(faceGeom, rustMat);
  backFace.rotation.y = Math.PI / 2;
  backFace.position.x = 0.22 - 0.07 - 0.005;
  root.add(backFace);

  // 4. Eye Reinforcement (Collars)
  // Small rings where the handle enters the head.
  const collarGeom = new THREE.TorusGeometry(0.045, 0.008, 8, 16);
  const collarFront = new THREE.Mesh(collarGeom, rustMat);
  collarFront.rotation.y = Math.PI / 2;
  collarFront.position.x = 0.22 + 0.07;
  root.add(collarFront);

  const collarBack = new THREE.Mesh(collarGeom, rustMat);
  collarBack.rotation.y = Math.PI / 2;
  collarBack.position.x = 0.22 - 0.07;
  root.add(collarBack);

  // Normalize to fit unit cube
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