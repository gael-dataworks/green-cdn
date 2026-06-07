export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Terracotta: matte, rough, non-metallic.
  // We will apply a procedural noise texture to simulate clay speckling.
  const terracottaMat = new THREE.MeshStandardMaterial({
    color: 0xc06040,
    metalness: 0.0,
    roughness: 0.85,
  });

  // --- Procedural Texture (Clay Speckles) ---
  // Deterministic noise to avoid Math.random
  const texSize = 256;
  const data = new Uint8Array(texSize * texSize * 4);
  for (let i = 0; i < texSize * texSize; i++) {
    // Simple deterministic pseudo-noise using sin/cos
    const x = i % texSize;
    const y = Math.floor(i / texSize);
    const noise = (Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin(x * 0.03 + y * 0.03)) * 0.5 + 0.5;
    
    // Base terracotta color with slight variation
    const r = 192 + (noise - 0.5) * 20;
    const g = 96 + (noise - 0.5) * 10;
    const b = 64 + (noise - 0.5) * 10;
    
    // Add dark speckles deterministically
    const isSpeckle = (Math.sin(x * 13.5) * Math.cos(y * 7.3)) > 0.92;
    const speckleVal = isSpeckle ? 0.6 : 1.0;

    const idx = i * 4;
    data[idx] = Math.max(0, Math.min(255, r * speckleVal));
    data[idx + 1] = Math.max(0, Math.min(255, g * speckleVal));
    data[idx + 2] = Math.max(0, Math.min(255, b * speckleVal));
    data[idx + 3] = 255;
  }
  const clayTexture = new THREE.DataTexture(data, texSize, texSize, THREE.RGBAFormat);
  clayTexture.colorSpace = THREE.SRGBColorSpace;
  clayTexture.wrapS = THREE.RepeatWrapping;
  clayTexture.wrapT = THREE.RepeatWrapping;
  clayTexture.needsUpdate = true;
  terracottaMat.map = clayTexture;
  terracottaMat.bumpMap = clayTexture;
  terracottaMat.bumpScale = 0.002;

  // --- Body (Lathe) ---
  // Profile points [radius, height] from bottom center up to top center
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.35, 0.00), // Bottom edge
    new THREE.Vector2(0.36, 0.05), // Slight foot
    new THREE.Vector2(0.48, 0.45), // Max belly
    new THREE.Vector2(0.45, 0.75), // Shoulder
    new THREE.Vector2(0.40, 0.85), // Neck start
    new THREE.Vector2(0.44, 0.88), // Rim outer edge
    new THREE.Vector2(0.40, 0.92), // Rim top inner
    new THREE.Vector2(0.00, 0.92), // Top center (closed)
  ];
  
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Smooth shading
  bodyGeom.computeVertexNormals();
  
  const body = new THREE.Mesh(bodyGeom, terracottaMat);
  body.name = "body";
  root.add(body);

  // --- Handles ---
  // Using TubeGeometry with CatmullRomCurve3 for organic handle shape
  const handleRadius = 0.045;
  const tubularSegments = 24;
  const radialSegments = 12;

  // Define curve for the right handle (positive X)
  // Points: Top attachment -> Mid arch -> Bottom attachment
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.42, 0.86, 0.00), // Top attach (near rim)
    new THREE.Vector3(0.62, 0.65, 0.00), // Mid arch (furthest out)
    new THREE.Vector3(0.50, 0.45, 0.00), // Bottom attach (shoulder)
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, tubularSegments, handleRadius, radialSegments, false);
  
  // Right Handle
  const rightHandle = new THREE.Mesh(handleGeom, terracottaMat);
  rightHandle.name = "right_handle";
  root.add(rightHandle);

  // Left Handle (Mirror across YZ plane -> scale X by -1)
  const leftHandle = new THREE.Mesh(handleGeom, terracottaMat);
  leftHandle.name = "left_handle";
  leftHandle.scale.set(-1, 1, 1);
  root.add(leftHandle);

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