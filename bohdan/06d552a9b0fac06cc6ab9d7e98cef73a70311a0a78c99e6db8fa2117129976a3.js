export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Porcelain: White, glossy ceramic.
  const porcelainMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.25,
  });

  // Gold: Polished metal. Capped metalness at 0.6 for renderer compatibility.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Floral: Pink for roses.
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xffb7c5,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  // Floral: Darker pink for rose centers.
  const darkPinkMat = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });

  // Floral: Green for leaves and stems.
  const greenMat = new THREE.MeshStandardMaterial({
    color: 0x558b2f,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  // --- Cup Body (Lathe) ---
  // Profile defines the cross-section. Y is up, X is radius.
  // We trace outer wall up, then inner wall down to create a hollow shell.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.13, 0.00), // Outer bottom edge
    new THREE.Vector2(0.13, 0.04), // Foot start
    new THREE.Vector2(0.11, 0.08), // Curve in
    new THREE.Vector2(0.14, 0.25), // Belly
    new THREE.Vector2(0.19, 0.48), // Rim outer
    new THREE.Vector2(0.17, 0.48), // Rim inner
    new THREE.Vector2(0.14, 0.25), // Inner wall
    new THREE.Vector2(0.06, 0.05), // Inner bottom curve
    new THREE.Vector2(0.00, 0.05), // Inner bottom center
  ];

  const cupGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Rotate geometry so the flat bottom sits on Y=0 if needed, but Lathe centers by default.
  // The profile starts at Y=0, so it should be fine.
  const cupBody = new THREE.Mesh(cupGeom, porcelainMat);
  root.add(cupBody);

  // --- Gold Rim ---
  // Top edge decoration
  const rimRadius = 0.19;
  const rimY = 0.48;
  const rimGeom = new THREE.TorusGeometry(rimRadius, 0.008, 16, 32);
  const rim = new THREE.Mesh(rimGeom, goldMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = rimY;
  root.add(rim);

  // --- Gold Base ---
  // Foot decoration
  const baseRadius = 0.13;
  const baseY = 0.02;
  const baseGeom = new THREE.TorusGeometry(baseRadius, 0.008, 16, 32);
  const baseRing = new THREE.Mesh(baseGeom, goldMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = baseY;
  root.add(baseRing);

  // --- Handle (Tube) ---
  // Curved path attached to the side (+X)
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.19, 0.45, 0.05), // Attach near rim
    new THREE.Vector3(0.35, 0.40, 0.15), // Arch out and back
    new THREE.Vector3(0.38, 0.25, 0.10), // Mid curve
    new THREE.Vector3(0.30, 0.12, 0.05), // Lower curve
    new THREE.Vector3(0.20, 0.08, 0.02), // Attach near base
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.018, 12, false);
  const handle = new THREE.Mesh(handleGeom, goldMat);
  root.add(handle);

  // --- Floral Decoration (Procedural Geometry) ---
  // Helper to get radius of cup at a given height (approximate from profile)
  function getCupRadius(y) {
    if (y < 0.05) return 0.13;
    if (y < 0.15) return 0.11 + (y - 0.05) * 0.3;
    if (y < 0.35) return 0.14 + (y - 0.15) * 0.25;
    return 0.19;
  }

  // Helper to place a mesh on the cup surface
  function placeOnSurface(mesh, angle, y, offset = 0.005) {
    const r = getCupRadius(y) + offset;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    mesh.position.set(x, y, z);
    
    // Orient to face outward
    const normal = new THREE.Vector3(x, 0, z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1), // Default forward
      normal
    );
    mesh.quaternion.copy(quaternion);
    // Rotate around normal to align vertically if needed (flowers grow up)
    mesh.rotateZ(-angle); 
  }

  // Create a flower cluster
  function createFlowerCluster(angle, y, scale = 1.0) {
    const cluster = new THREE.Group();

    // Main Rose (Flattened Sphere)
    const roseGeom = new THREE.SphereGeometry(0.025 * scale, 16, 16);
    const rose = new THREE.Mesh(roseGeom, pinkMat);
    rose.scale.set(1, 1, 0.3); // Flatten
    placeOnSurface(rose, angle, y, 0.006);
    cluster.add(rose);

    // Rose Center
    const centerGeom = new THREE.SphereGeometry(0.01 * scale, 8, 8);
    const center = new THREE.Mesh(centerGeom, darkPinkMat);
    center.scale.set(1, 1, 0.3);
    placeOnSurface(center, angle, y, 0.007);
    cluster.add(center);

    // Leaves (Flattened Circles)
    const leafGeom = new THREE.CircleGeometry(0.02 * scale, 8);
    
    const leaf1 = new THREE.Mesh(leafGeom, greenMat);
    leaf1.scale.set(1, 0.5, 1);
    placeOnSurface(leaf1, angle - 0.3, y - 0.03, 0.006);
    leaf1.rotateZ(0.5);
    cluster.add(leaf1);

    const leaf2 = new THREE.Mesh(leafGeom, greenMat);
    leaf2.scale.set(1, 0.5, 1);
    placeOnSurface(leaf2, angle + 0.3, y - 0.03, 0.006);
    leaf2.rotateZ(-0.5);
    cluster.add(leaf2);

    // Vine (Tube) connecting elements slightly above surface
    const vinePoints = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const localAngle = angle - 0.4 + t * 0.8;
      const localY = y - 0.04 + t * 0.08;
      const r = getCupRadius(localY) + 0.005;
      vinePoints.push(new THREE.Vector3(
        Math.cos(localAngle) * r,
        localY,
        Math.sin(localAngle) * r
      ));
    }
    const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
    const vineGeom = new THREE.TubeGeometry(vineCurve, 10, 0.003 * scale, 6, false);
    const vine = new THREE.Mesh(vineGeom, greenMat);
    cluster.add(vine);

    root.add(cluster);
  }

  // Place 3 clusters around the cup
  createFlowerCluster(0, 0.25, 1.2);      // Front
  createFlowerCluster(Math.PI * 0.6, 0.30, 0.9); // Side Right
  createFlowerCluster(-Math.PI * 0.6, 0.20, 0.9); // Side Left

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