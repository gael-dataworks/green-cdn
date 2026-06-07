export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Rough Terracotta Clay ---
  // Procedural texture for speckled clay surface
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  const baseColor = { r: 193, g: 110, b: 82 }; // #c16e52
  
  for (let i = 0; i < texSize * texSize; i++) {
    // Deterministic pseudo-noise based on index
    const noise = ((i * 12345) % 50) - 25; 
    const r = Math.max(0, Math.min(255, baseColor.r + noise));
    const g = Math.max(0, Math.min(255, baseColor.g + noise));
    const b = Math.max(0, Math.min(255, baseColor.b + noise));
    
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 255;
  }

  const clayTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  clayTexture.colorSpace = THREE.SRGBColorSpace;
  clayTexture.wrapS = THREE.RepeatWrapping;
  clayTexture.wrapT = THREE.RepeatWrapping;
  clayTexture.needsUpdate = true;

  const clayMat = new THREE.MeshStandardMaterial({
    map: clayTexture,
    color: 0xc16e52,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Body: Lathe Geometry ---
  // Profile defines the silhouette from bottom center, out to edge, up to top center
  const profilePoints = [
    new THREE.Vector2(0, 0),        // Bottom center
    new THREE.Vector2(0.38, 0),     // Base edge
    new THREE.Vector2(0.40, 0.05),  // Base corner radius
    new THREE.Vector2(0.53, 0.35),  // Max belly width
    new THREE.Vector2(0.48, 0.55),  // Shoulder
    new THREE.Vector2(0.40, 0.68),  // Neck start
    new THREE.Vector2(0.46, 0.75),  // Rim outer edge
    new THREE.Vector2(0.38, 0.75),  // Rim inner edge (thickness)
    new THREE.Vector2(0, 0.75)      // Top center
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const pot_body = new THREE.Mesh(bodyGeom, clayMat);
  root.add(pot_body);

  // --- Handles: Tube Geometry ---
  // Define a curve for the right handle, then clone/rotate for left
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.46, 0.72, 0), // Top attach (near rim)
    new THREE.Vector3(0.62, 0.65, 0), // Arch out
    new THREE.Vector3(0.64, 0.55, 0), // Mid arch
    new THREE.Vector3(0.50, 0.50, 0)  // Bottom attach (shoulder)
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 16, 0.045, 8, false);
  
  // Right Handle
  const right_handle = new THREE.Mesh(handleGeom, clayMat);
  root.add(right_handle);

  // Left Handle (Mirror across YZ plane -> scale X by -1)
  const left_handle = new THREE.Mesh(handleGeom, clayMat);
  left_handle.scale.set(-1, 1, 1);
  root.add(left_handle);

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