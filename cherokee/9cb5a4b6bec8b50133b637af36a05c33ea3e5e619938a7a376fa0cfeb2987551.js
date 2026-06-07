export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const BALL_RADIUS = 0.5;
  const SEAM_THICKNESS = 0.025;
  const ORANGE_COLOR = 0xff6600;
  const WHITE_COLOR = 0xffffff;

  // --- Materials ---
  // Felt material: high roughness, matte, with a procedural texture for grain
  const feltTexture = createFeltTexture(THREE);
  const feltMat = new THREE.MeshStandardMaterial({
    color: ORANGE_COLOR,
    map: feltTexture,
    metalness: 0.0,
    roughness: 0.95,
  });

  // Seam material: white, slightly smoother than felt (rubber/paint)
  const seamMat = new THREE.MeshStandardMaterial({
    color: WHITE_COLOR,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Geometry: Ball ---
  const ballGeom = new THREE.SphereGeometry(BALL_RADIUS, 48, 48);
  const ball = new THREE.Mesh(ballGeom, feltMat);
  root.add(ball);

  // --- Geometry: Seam ---
  // A tennis ball seam is a continuous curve dividing the sphere into two "peanut" halves.
  // We approximate this with a CatmullRomCurve3 passing through specific points on the sphere surface.
  const seamPoints = [
    new THREE.Vector3(0, 1, 0),          // Top pole
    new THREE.Vector3(0.75, 0.5, 0.45),  // Upper front-right
    new THREE.Vector3(1, 0, 0),          // Equator right
    new THREE.Vector3(0.75, -0.5, -0.45),// Lower back-right
    new THREE.Vector3(0, -1, 0),         // Bottom pole
    new THREE.Vector3(-0.75, -0.5, 0.45),// Lower front-left
    new THREE.Vector3(-1, 0, 0),         // Equator left
    new THREE.Vector3(-0.75, 0.5, -0.45),// Upper back-left
    new THREE.Vector3(0, 1, 0),          // Close loop
  ];

  const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
  seamCurve.closed = true;
  seamCurve.tension = 0.5;

  const seamGeom = new THREE.TubeGeometry(seamCurve, 128, SEAM_THICKNESS, 12, true);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  
  // Slightly scale the seam up so it sits just on top of the surface, not clipping in
  seam.scale.setScalar(1.01); 
  root.add(seam);

  fitToUnitCube(THREE, root);
  return root;
}

// Helper: Procedural felt texture with deterministic noise
function createFeltTexture(THREE) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const baseR = 255;
  const baseG = 102;
  const baseB = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Deterministic pseudo-noise using sin/cos
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.3) + Math.sin(x * 0.1 + y * 0.2);
      const variation = Math.floor(noise * 15); // +/- 15 color variation

      data[i] = Math.max(0, Math.min(255, baseR + variation));
      data[i + 1] = Math.max(0, Math.min(255, baseG + variation));
      data[i + 2] = Math.max(0, Math.min(255, baseB + variation));
      data[i + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
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