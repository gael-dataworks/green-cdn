export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed metal for the body and neck
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Glowing blue tip (LED-like)
  const blueTipMat = new THREE.MeshStandardMaterial({
    color: 0x0044ff,
    metalness: 0.1,
    roughness: 0.2,
    emissive: 0x0044ff,
    emissiveIntensity: 1.5,
  });

  // Bright white core inside the tip
  const whiteLightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    emissive: 0xffffff,
    emissiveIntensity: 3.0,
  });

  // Dark groove ring
  const grooveMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.3,
    roughness: 0.6,
  });

  // --- Geometry & Meshes ---

  // 1. Main Body (Wedge/Fin)
  // Profile in X-Y plane, extruded along Z
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, 0);
  bodyShape.lineTo(1.2, 0);       // Bottom edge
  bodyShape.lineTo(0.8, 0.6);     // Angled front face
  bodyShape.lineTo(0.3, 0.6);     // Top flat surface
  bodyShape.lineTo(0.3, 0.2);     // Step down
  bodyShape.lineTo(0, 0.2);       // Back vertical
  bodyShape.lineTo(0, 0);         // Close

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  // Center the geometry locally so transformations are easier
  bodyGeom.center();
  const body = new THREE.Mesh(bodyGeom, metalMat);
  // Position so the top flat surface is at y=0 for stacking
  body.position.y = -0.6; 
  root.add(body);

  // 2. Neck (Cylinder)
  const neckRadius = 0.25;
  const neckHeight = 0.5;
  const neckGeom = new THREE.CylinderGeometry(neckRadius, neckRadius, neckHeight, 32);
  const neck = new THREE.Mesh(neckGeom, metalMat);
  neck.position.y = neckHeight / 2; // Sit on top of body (which is at -0.6 + 0.6 = 0)
  root.add(neck);

  // 3. Groove Ring (at base of neck)
  const grooveRadius = neckRadius + 0.02;
  const grooveTube = 0.025;
  const grooveGeom = new THREE.TorusGeometry(grooveRadius, grooveTube, 16, 32);
  const groove = new THREE.Mesh(grooveGeom, grooveMat);
  groove.rotation.x = Math.PI / 2;
  groove.position.y = 0.05; // Slightly above base
  root.add(groove);

  // 4. Blue Tip (Cone)
  const tipRadius = neckRadius;
  const tipHeight = 0.4;
  const tipGeom = new THREE.ConeGeometry(tipRadius, tipHeight, 32);
  const tip = new THREE.Mesh(tipGeom, blueTipMat);
  tip.position.y = neckHeight + tipHeight / 2;
  root.add(tip);

  // 5. White Light Core (Sphere inside tip)
  const coreRadius = 0.08;
  const coreGeom = new THREE.SphereGeometry(coreRadius, 16, 16);
  const core = new THREE.Mesh(coreGeom, whiteLightMat);
  core.position.y = neckHeight + tipHeight - 0.1; // Near the top of the cone
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