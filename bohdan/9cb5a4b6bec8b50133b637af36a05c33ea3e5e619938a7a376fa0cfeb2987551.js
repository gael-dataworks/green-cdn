export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const R = 0.5; // Base radius before normalization
  const SEAM_OFFSET = 0.005; // Slightly raised seam
  const SEAM_RADIUS = 0.015; // Thickness of the white line

  // --- Materials ---

  // Felt material: Orange, high roughness, with procedural noise texture
  const feltColor = new THREE.Color(0xff5500);
  const textureSize = 128;
  const data = new Uint8Array(textureSize * textureSize * 3);
  
  // Deterministic noise for felt texture
  for (let y = 0; y < textureSize; y++) {
    for (let x = 0; x < textureSize; x++) {
      const i = (y * textureSize + x) * 3;
      // Pseudo-random noise using sine/cosine based on coordinates
      const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 + 0.5;
      const grain = Math.sin(x * 15.0 + y * 7.0) * 0.1; 
      
      // Vary the orange slightly to simulate nap/fuzz
      const r = Math.min(255, Math.max(0, (feltColor.r * 255) + (noise * 10) + (grain * 20)));
      const g = Math.min(255, Math.max(0, (feltColor.g * 255) + (noise * 10) + (grain * 20)));
      const b = Math.min(255, Math.max(0, (feltColor.b * 255) + (noise * 10) + (grain * 20)));
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  const feltTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBFormat);
  feltTexture.colorSpace = THREE.SRGBColorSpace;
  feltTexture.wrapS = THREE.RepeatWrapping;
  feltTexture.wrapT = THREE.RepeatWrapping;
  feltTexture.needsUpdate = true;

  const ballMat = new THREE.MeshStandardMaterial({
    map: feltTexture,
    color: 0xffffff, // Modulate texture
    metalness: 0.0,
    roughness: 0.95, // Very matte like felt
  });

  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.6, // Slightly smoother rubber/paint
  });

  // --- Geometry ---

  // 1. Ball Body
  const ballGeom = new THREE.SphereGeometry(R, 48, 48);
  const ball = new THREE.Mesh(ballGeom, ballMat);
  root.add(ball);

  // 2. Seam (White curved line)
  // A tennis ball seam is roughly a circle tilted on the sphere surface.
  // We generate points on a circle, project to sphere, then rotate to match the seam orientation.
  const seamPoints = [];
  const segments = 128;
  
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    
    // Base circle in XY plane
    let x = Math.cos(t);
    let y = Math.sin(t);
    let z = 0;
    
    const vec = new THREE.Vector3(x, y, z);
    
    // Project to sphere surface (radius + offset)
    vec.normalize().multiplyScalar(R + SEAM_OFFSET);
    
    // Rotate to simulate tennis ball seam orientation
    // Tilt around X axis
    vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3.5);
    // Tilt around Z axis
    vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 3.5);
    
    seamPoints.push(vec);
  }

  const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
  // Closed curve to make a continuous loop
  seamCurve.closed = true;
  
  const seamGeom = new THREE.TubeGeometry(seamCurve, 64, SEAM_RADIUS, 8, true);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  root.add(seam);

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