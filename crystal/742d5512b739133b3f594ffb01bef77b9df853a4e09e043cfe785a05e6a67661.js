export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Black matte body
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.1,
    roughness: 0.8,
  });

  // Polished metal (spout, handle)
  // Cap metalness at 0.6 as per instructions for no-env-map renders
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Flame (emissive)
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xff4400,
    emissiveIntensity: 2.5,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Interior fuel/wick (dark)
  const fuelMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Dimensions ---
  const bodyTopR = 0.14;
  const bodyBotR = 0.22;
  const bodyH = 0.40;
  const spoutLen = 0.24;
  const handleTubeR = 0.022;

  // --- Body ---
  // Frustum shape: wider at bottom
  const bodyGeom = new THREE.CylinderGeometry(bodyBotR, bodyTopR, bodyH, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- Interior / Fuel Well ---
  // Small cylinder inside the top to represent the oil/wick holder
  const fuelGeom = new THREE.CylinderGeometry(bodyTopR * 0.85, bodyTopR * 0.85, 0.04, 32);
  const fuel = new THREE.Mesh(fuelGeom, fuelMat);
  fuel.position.y = bodyH / 2 - 0.02;
  root.add(fuel);

  // --- Spout ---
  // Tapered cylinder, attached to the side, angling up
  // Local geometry is Y-up cylinder. We need to rotate and position.
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.06, spoutLen, 16);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  // Position near top rim, on the -Z side (arbitrary choice, let's say -Z)
  // Rotate to point out and up.
  spout.position.set(0, bodyH / 2 - 0.05, -bodyTopR * 0.8);
  spout.rotation.x = Math.PI / 4; // 45 degrees up
  root.add(spout);

  // --- Handle ---
  // Curved tube on the +Z side
  // Define a curve from top attachment to bottom attachment
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, bodyH / 2 - 0.05, bodyTopR * 0.8),  // Top attach
    new THREE.Vector3(0, bodyH / 2 + 0.12, bodyTopR * 1.8),  // Top arc
    new THREE.Vector3(0, 0.0, bodyTopR * 2.2),               // Mid arc (furthest out)
    new THREE.Vector3(0, -bodyH / 2 + 0.1, bodyTopR * 1.8),  // Bottom arc
    new THREE.Vector3(0, -bodyH / 2 + 0.05, bodyBotR * 0.9), // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, handleTubeR, 12, false);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  root.add(handle);

  // --- Flame ---
  // Elongated cone/sphere shape
  // Using a cone for the main body, maybe a smaller sphere for the tip
  const flameGeom = new THREE.ConeGeometry(0.035, 0.18, 16);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  // Position above the fuel well
  flame.position.set(0, bodyH / 2 + 0.09, 0);
  // Slight taper scaling to make it look more like a flame (pointy top is default for cone)
  // Let's add a second smaller flame inside for color variation if needed, but one is fine.
  // Rotate 180 if we want base down (Cone apex is +Y by default, base at -height/2)
  // Default Cone: Apex at +Y, Base at -Y. This is perfect for a flame pointing up.
  root.add(flame);

  // Inner flame core (brighter)
  const coreGeom = new THREE.ConeGeometry(0.015, 0.12, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffffaa,
    emissive: 0xffaa00,
    emissiveIntensity: 3.0,
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.position.set(0, bodyH / 2 + 0.06, 0);
  root.add(core);

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