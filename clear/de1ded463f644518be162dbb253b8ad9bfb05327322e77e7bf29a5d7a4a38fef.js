export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Stainless Steel: Bright, polished, capped metalness, with emissive for brightness
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4,
  });

  // Clear Glass: High transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // --- Bucket Body (Lathe) ---
  // Profile: [radius, height]
  const bucketProfile = [
    new THREE.Vector2(0.0, 0.0),       // Center bottom
    new THREE.Vector2(0.32, 0.0),      // Outer base edge
    new THREE.Vector2(0.32, 0.03),     // Base rim thickness
    new THREE.Vector2(0.30, 0.03),     // Slight step in
    new THREE.Vector2(0.30, 0.85),     // Main body up
    new THREE.Vector2(0.33, 0.85),     // Top rim flare out
    new THREE.Vector2(0.33, 0.90),     // Top rim thickness
    new THREE.Vector2(0.31, 0.90),     // Inner top edge
    new THREE.Vector2(0.31, 0.05),     // Inner wall down (hollow)
    new THREE.Vector2(0.30, 0.05),     // Inner floor step
    new THREE.Vector2(0.30, 0.03),     // Inner floor
    new THREE.Vector2(0.0, 0.03),      // Center inner floor
  ];
  // Note: LatheGeometry creates a solid if profile doesn't close, 
  // but for a hollow bucket we need a specific profile or just a solid cylinder with a hole.
  // Simpler approach for robust rendering: Solid cylinder for body, separate rim/base rings.
  
  // Let's switch to composition for better control over the hollow look and thickness.
  
  // 1. Main Cylinder Body
  const bodyGeom = new THREE.CylinderGeometry(0.30, 0.30, 0.85, 32);
  const bucketBody = new THREE.Mesh(bodyGeom, steelMat);
  bucketBody.position.y = 0.425; // Half height
  root.add(bucketBody);

  // 2. Base Ring (Thicker bottom)
  const baseGeom = new THREE.TorusGeometry(0.30, 0.025, 16, 32);
  const bucketBase = new THREE.Mesh(baseGeom, steelMat);
  bucketBase.rotation.x = Math.PI / 2;
  bucketBase.position.y = 0.025;
  root.add(bucketBase);
  
  // Base Floor (Inner bottom)
  const baseFloorGeom = new THREE.CircleGeometry(0.275, 32);
  const bucketBaseFloor = new THREE.Mesh(baseFloorGeom, steelMat);
  bucketBaseFloor.rotation.x = Math.PI / 2;
  bucketBaseFloor.position.y = 0.03;
  root.add(bucketBaseFloor);

  // 3. Top Rim
  const rimGeom = new THREE.TorusGeometry(0.315, 0.025, 16, 32);
  const bucketRim = new THREE.Mesh(rimGeom, steelMat);
  bucketRim.rotation.x = Math.PI / 2;
  bucketRim.position.y = 0.85;
  root.add(bucketRim);

  // 4. Spout
  // Tapered cylinder, rotated up and out
  const spoutGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.12, 16);
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  spout.position.set(0.30, 0.82, 0.0); // Attached to rim
  spout.rotation.z = -Math.PI / 4; // Angle up 45 deg
  spout.rotation.y = Math.PI; // Point outward (-Z relative to local, but we want +Z or -Z? Ref shows left side spout)
  // Reference: Spout is on the left, Handle on the right.
  // If camera is at +Z, Spout is at -X, Handle at +X.
  spout.position.set(-0.30, 0.82, 0.0);
  spout.rotation.set(0, 0, Math.PI / 4); // Tilt up and left
  // Actually, let's orient properly. 
  // Spout points away from center. 
  spout.rotation.set(0, -Math.PI/2, Math.PI/4); // Pointing -X, tilted up
  root.add(spout);

  // 5. Handle
  // Curved tube. Path from top rim to mid-body on the right side (+X)
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.32, 0.85, 0.0), // Top attach
    new THREE.Vector3(0.45, 0.85, 0.0), // Top curve out
    new THREE.Vector3(0.45, 0.50, 0.0), // Mid vertical
    new THREE.Vector3(0.45, 0.30, 0.0), // Bottom curve in
    new THREE.Vector3(0.32, 0.30, 0.0), // Bottom attach
  ]);
  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.035, 8, false);
  const bucketHandle = new THREE.Mesh(handleGeom, steelMat);
  root.add(bucketHandle);

  // 6. Hinge/Latch Detail (Opposite side, -X)
  const hingeGeom = new THREE.BoxGeometry(0.02, 0.04, 0.06);
  const hinge = new THREE.Mesh(hingeGeom, steelMat);
  hinge.position.set(-0.32, 0.50, 0.0);
  root.add(hinge);

  // --- Glass Bottle (Inside) ---
  // Lathe profile for bottle
  const bottleProfile = [
    new THREE.Vector2(0.0, 0.0),       // Bottom center
    new THREE.Vector2(0.11, 0.0),      // Bottom edge
    new THREE.Vector2(0.11, 0.15),     // Base cylinder
    new THREE.Vector2(0.13, 0.20),     // Belly start
    new THREE.Vector2(0.14, 0.35),     // Belly max
    new THREE.Vector2(0.12, 0.55),     // Shoulder start
    new THREE.Vector2(0.05, 0.70),     // Neck base
    new THREE.Vector2(0.05, 0.95),     // Neck top
    new THREE.Vector2(0.06, 1.00),     // Lip flare
    new THREE.Vector2(0.00, 1.00),     // Top center
  ];
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  // Position bottle inside bucket. Bucket floor is at y=0.03.
  // Bottle height is 1.0. Bucket height is 0.90.
  // Bottle sits on bucket floor.
  bottle.position.y = 0.03;
  root.add(bottle);

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