export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Procedural rust texture for the head
  const texSize = 128;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let y = 0; y < texSize; y++) {
    for (let x = 0; x < texSize; x++) {
      const i = (y * texSize + x) * 4;
      // Deterministic pseudo-noise
      const nx = x / texSize;
      const ny = y / texSize;
      const noise = Math.sin(nx * 20 + ny * 15) * Math.cos(ny * 25 - nx * 10);
      const rustMask = (noise + 1) * 0.5; // 0 to 1

      // Base dark metal
      let r = 50, g = 50, b = 50;
      // Mix in rust (orange-brown)
      if (rustMask > 0.4) {
        const mix = (rustMask - 0.4) * 1.5;
        r = r * (1 - mix) + 160 * mix;
        g = g * (1 - mix) + 80 * mix;
        b = b * (1 - mix) + 40 * mix;
      }
      // Add some grime variation
      const grime = Math.sin(nx * 50) * 0.1;
      r += grime * 20; g += grime * 20; b += grime * 20;

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
      data[i + 3] = 255;
    }
  }
  const rustTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  rustTexture.colorSpace = THREE.SRGBColorSpace;
  rustTexture.needsUpdate = true;
  rustTexture.wrapS = THREE.RepeatWrapping;
  rustTexture.wrapT = THREE.RepeatWrapping;

  const headMat = new THREE.MeshStandardMaterial({
    map: rustTexture,
    metalness: 0.6,
    roughness: 0.8,
    color: 0xffffff,
  });

  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.1,
    roughness: 0.7,
  });

  // --- Geometry & Meshes ---

  // Handle: Tapered cylinder
  // Length ~0.7, radius ~0.025 to 0.03
  const handleGeom = new THREE.CylinderGeometry(0.025, 0.03, 0.7, 16);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Align cylinder (default Y-up) to X-axis
  handle.rotation.z = Math.PI / 2;
  // Position so the right end is near origin (where head will be)
  handle.position.x = -0.15; 
  root.add(handle);

  // Head: Rounded square prism (approximated by 8-segment cylinder)
  // Length ~0.22, radius ~0.065
  const headGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 8);
  const head = new THREE.Mesh(headGeom, headMat);
  // Align to X-axis
  head.rotation.z = Math.PI / 2;
  // Center at origin
  head.position.x = 0.15;
  root.add(head);

  // Striking Faces: Slightly distinct flat circles on the ends of the head
  // To make it look more like a hammer head with worn faces
  const faceGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
  
  const faceFront = new THREE.Mesh(faceGeom, headMat);
  faceFront.rotation.z = Math.PI / 2;
  faceFront.position.x = 0.15 + 0.11 + 0.01; // End of head + half thickness
  root.add(faceFront);

  const faceBack = new THREE.Mesh(faceGeom, headMat);
  faceBack.rotation.z = Math.PI / 2;
  faceBack.position.x = 0.15 - 0.11 - 0.01; // Start of head - half thickness
  root.add(faceBack);

  // --- Pose ---
  // Rotate the whole assembly to match the diagonal composition in the reference
  root.rotation.z = -Math.PI / 6; // Tilt down slightly
  root.rotation.y = Math.PI / 4;  // Rotate around vertical

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