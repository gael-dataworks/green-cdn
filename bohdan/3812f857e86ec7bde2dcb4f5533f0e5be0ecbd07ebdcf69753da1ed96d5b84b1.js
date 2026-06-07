export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Iridescent/Glass Orb Material
  // Using MeshPhysicalMaterial for transmission/glass effect.
  // True iridescence requires environment maps or shaders, so we approximate
  // with high transmission, low roughness, and a slight tint.
  const orbMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    thickness: 0.5,
  });

  // Silver Metal Material (Cap and Loop)
  // Capped metalness at 0.6 per system rules to avoid black rendering without env map.
  // Emissive added slightly to brighten the silver.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.15,
  });

  // --- Geometry & Meshes ---

  // 1. The Orb (Sphere)
  const orbGeom = new THREE.SphereGeometry(0.4, 48, 48);
  const orb = new THREE.Mesh(orbGeom, orbMat);
  root.add(orb);

  // 2. The Cap
  // Modeled as a tapered cylinder with a stepped profile using LatheGeometry
  // to get the specific "collar" shape seen in the reference.
  // We use a low segment count for the lathe to give it a slightly faceted look,
  // or rely on the material. Let's use Cylinder for the main shape to allow
  // distinct faceting if needed, but Lathe is better for the profile.
  // Profile points (radius, y) from bottom to top.
  const capProfile = [
    new THREE.Vector2(0.0, 0.0),    // Center bottom
    new THREE.Vector2(0.13, 0.0),   // Bottom rim outer
    new THREE.Vector2(0.13, 0.04),  // Bottom rim top
    new THREE.Vector2(0.11, 0.06),  // Taper start
    new THREE.Vector2(0.10, 0.10),  // Mid taper
    new THREE.Vector2(0.08, 0.12),  // Top shoulder
    new THREE.Vector2(0.0, 0.12),   // Top center
  ];
  // Use 16 segments for the lathe to keep it smooth but low-poly enough
  const capGeom = new THREE.LatheGeometry(capProfile, 16);
  const cap = new THREE.Mesh(capGeom, silverMat);
  cap.position.y = 0.4; // Sit on top of the sphere (radius 0.4)
  root.add(cap);

  // 3. The Loop (Wire)
  // A torus arc standing vertically.
  // Radius 0.06, Tube 0.004 (thin wire).
  const loopGeom = new THREE.TorusGeometry(0.06, 0.004, 8, 32, Math.PI * 1.6);
  const loop = new THREE.Mesh(loopGeom, silverMat);
  // Position at top of cap
  loop.position.y = 0.4 + 0.12 + 0.02; 
  // Rotate to stand up (default torus is in XY plane, we want it in YZ or XZ)
  // Default Torus is in XY. We want it vertical. Rotate X by 90 deg.
  loop.rotation.x = Math.PI / 2;
  // The arc of the torus starts at 0. We want the gap at the bottom or top?
  // Usually the loop is continuous or has a gap at the bottom. 
  // The reference shows a continuous wire loop attached to a pin.
  // Let's make it a full circle or near full.
  // Actually, let's use a TubeGeometry with a Curve for more control over the shape (teardrop).
  const curve = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    0.05, 0.07,      // xRadius, yRadius
    0, Math.PI * 2,  // aStartAngle, aEndAngle
    false,           // aClockwise
    0                // aRotation
  );
  const points = curve.getPoints(50);
  // Map 2D points to 3D (x, y, 0) -> (x, y, 0) then rotate
  const pathPoints = points.map(p => new THREE.Vector3(p.x, p.y, 0));
  const path = new THREE.CatmullRomCurve3(pathPoints);
  const loopTubeGeom = new THREE.TubeGeometry(path, 64, 0.004, 8, false);
  const loopMesh = new THREE.Mesh(loopTubeGeom, silverMat);
  loopMesh.position.y = 0.4 + 0.12 + 0.05;
  // Rotate to face forward/sideways. EllipseCurve is in XY. We want it in YZ plane (vertical).
  // Rotate around Z by 90 deg? No, XY plane -> YZ plane requires rotation around X by 90?
  // XY plane normal is Z. YZ plane normal is X. Rotate around X by 90 deg (PI/2).
  loopMesh.rotation.x = Math.PI / 2;
  // Wait, EllipseCurve creates points in XY. 
  // If I rotate X by 90, X becomes X, Y becomes Z. So it lies in XZ plane (flat).
  // I want it in YZ plane (vertical).
  // So I need Y to stay Y, X to become Z. Rotate around Y by 90 deg.
  loopMesh.rotation.y = Math.PI / 2;
  root.add(loopMesh);

  // 4. Small Pin/Connector (optional detail to connect loop to cap)
  const pinGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.03, 8);
  const pin = new THREE.Mesh(pinGeom, silverMat);
  pin.position.y = 0.4 + 0.12 + 0.015;
  root.add(pin);

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