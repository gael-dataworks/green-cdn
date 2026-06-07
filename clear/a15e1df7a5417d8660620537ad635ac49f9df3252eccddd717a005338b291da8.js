export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue plastic body/cap: glossy, vibrant blue
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1e40d6,
    metalness: 0.1,
    roughness: 0.25,
  });

  // Black base: matte, rubbery
  const blackBaseMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Base ---
  // Flat black disc at the bottom
  const baseGeom = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 32);
  const base = new THREE.Mesh(baseGeom, blackBaseMat);
  base.position.y = 0.02;
  root.add(base);

  // --- Body ---
  // Ergonomic curvy profile
  // Points are [radius, y] relative to the body's local origin (which will be placed on top of base)
  const bodyProfile = [
    new THREE.Vector2(0.0, 0.0),      // Center bottom
    new THREE.Vector2(0.17, 0.0),     // Bottom edge (matches base)
    new THREE.Vector2(0.185, 0.15),   // Slight bulge
    new THREE.Vector2(0.205, 0.35),   // Max bulge (grip area)
    new THREE.Vector2(0.18, 0.55),    // Tapering up
    new THREE.Vector2(0.155, 0.65),   // Neck start
    new THREE.Vector2(0.15, 0.70),    // Shoulder
  ];
  
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, bluePlasticMat);
  // Position body on top of base
  body.position.y = 0.04;
  root.add(body);

  // --- Cap ---
  // Angled flip-top cap
  const capProfile = [
    new THREE.Vector2(0.0, 0.0),      // Top center (we build upside down then flip or just define normally)
    new THREE.Vector2(0.13, 0.0),     // Top edge
    new THREE.Vector2(0.15, 0.05),    // Slight flare
    new THREE.Vector2(0.16, 0.15),    // Hinge area (widest)
    new THREE.Vector2(0.15, 0.22),    // Bottom of cap
  ];
  
  // We define the profile from top (y=0) to bottom (y=0.22) to match the visual taper
  // But Lathe rotates around Y. Let's define it standard: bottom to top.
  const capProfileStd = [
    new THREE.Vector2(0.0, 0.0),      // Bottom center (interface with body)
    new THREE.Vector2(0.15, 0.0),     // Bottom edge
    new THREE.Vector2(0.16, 0.10),    // Hinge bulge
    new THREE.Vector2(0.14, 0.20),    // Taper
    new THREE.Vector2(0.12, 0.24),    // Top edge
    new THREE.Vector2(0.0, 0.24),     // Top center
  ];

  const capGeom = new THREE.LatheGeometry(capProfileStd, 32);
  const cap = new THREE.Mesh(capGeom, bluePlasticMat);
  
  // Position cap on top of body
  // Body height is 0.70. Body y-pos is 0.04. So body top is at 0.74.
  cap.position.y = 0.74;
  
  // Apply ergonomic tilt (forward lean)
  cap.rotation.x = -0.15; // Tilt forward slightly
  
  root.add(cap);

  // --- Seam Detail ---
  // A thin ring to emphasize the separation between body and cap
  const seamGeom = new THREE.TorusGeometry(0.155, 0.005, 8, 32);
  const seam = new THREE.Mesh(seamGeom, bluePlasticMat);
  seam.position.y = 0.74;
  seam.rotation.x = Math.PI / 2; // Face up
  root.add(seam);

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