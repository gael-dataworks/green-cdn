export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Amethyst/Glass: Purple, translucent, glossy.
  // Using MeshPhysicalMaterial for transmission/glass effect.
  const amethystMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a2c91,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.85,
    ior: 1.55,
    transparent: true,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Silver: Bail and Chain.
  // Capped metalness at 0.6 per rules, bright color, low roughness.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Inclusion Rim: Creamy white, rougher stone texture.
  const inclusionRimMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6d2,
    metalness: 0.0,
    roughness: 0.8,
  });

  // Inclusion Center: Dark brown/grey rock.
  const inclusionCenterMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // --- Pendant Body (Teardrop) ---
  // Profile points for LatheGeometry (radius, y).
  // Starts at bottom tip, goes up to top neck.
  const profilePoints = [
    new THREE.Vector2(0.00, -0.65), // Bottom tip
    new THREE.Vector2(0.15, -0.55), // Lower curve
    new THREE.Vector2(0.35, -0.35), // Belly start
    new THREE.Vector2(0.48, -0.10), // Widest point
    new THREE.Vector2(0.45,  0.15), // Shoulder
    new THREE.Vector2(0.30,  0.35), // Neck start
    new THREE.Vector2(0.18,  0.50), // Neck top
    new THREE.Vector2(0.00,  0.55), // Top center (closed)
  ];

  const pendantGeom = new THREE.LatheGeometry(profilePoints, 32);
  const pendantBody = new THREE.Mesh(pendantGeom, amethystMat);
  root.add(pendantBody);

  // --- Inclusions (Geode Slices) ---
  // Helper to create a geode slice (rim + center)
  function createGeodeSlice(radius, segments) {
    const group = new THREE.Group();
    
    // Rim (slightly larger, thicker)
    const rimGeom = new THREE.CylinderGeometry(radius, radius, 0.015, segments);
    const rim = new THREE.Mesh(rimGeom, inclusionRimMat);
    rim.rotation.x = Math.PI / 2; // Face forward initially
    group.add(rim);

    // Center (slightly smaller, inset)
    const centerGeom = new THREE.CylinderGeometry(radius * 0.7, radius * 0.7, 0.012, segments);
    const center = new THREE.Mesh(centerGeom, inclusionCenterMat);
    center.rotation.x = Math.PI / 2;
    center.position.y = 0.002; // Slightly raised from rim base
    group.add(center);

    return group;
  }

  // Placement 1: Top Center (slightly tilted)
  const geo1 = createGeodeSlice(0.09, 12);
  geo1.position.set(0, 0.35, 0.46); // On the front face, upper neck area
  geo1.rotation.x = -0.4; // Tilt to match surface curvature
  root.add(geo1);

  // Placement 2: Bottom Left
  const geo2 = createGeodeSlice(0.11, 14);
  geo2.position.set(-0.25, -0.35, 0.40);
  geo2.rotation.x = 0.2;
  geo2.rotation.z = 0.3;
  root.add(geo2);

  // Placement 3: Mid Right
  const geo3 = createGeodeSlice(0.08, 10);
  geo3.position.set(0.30, 0.05, 0.42);
  geo3.rotation.x = -0.1;
  geo3.rotation.z = -0.2;
  root.add(geo3);
  
  // Placement 4: Small one near bottom right
  const geo4 = createGeodeSlice(0.06, 8);
  geo4.position.set(0.15, -0.50, 0.38);
  geo4.rotation.x = 0.3;
  geo4.rotation.z = -0.1;
  root.add(geo4);

  // --- Bail (Silver Cap) ---
  // A small cone/cylinder at the top to hold the chain
  const bailGeom = new THREE.CylinderGeometry(0.16, 0.19, 0.12, 24);
  const bail = new THREE.Mesh(bailGeom, silverMat);
  bail.position.set(0, 0.56, 0);
  root.add(bail);

  // Bail Loop (the ring the chain goes through)
  const loopGeom = new THREE.TorusGeometry(0.06, 0.015, 8, 24);
  const bailLoop = new THREE.Mesh(loopGeom, silverMat);
  bailLoop.position.set(0, 0.63, 0);
  bailLoop.rotation.x = Math.PI / 2; // Flat on top
  root.add(bailLoop);

  // --- Chain ---
  // Simple link chain extending upwards
  const linkRadius = 0.05;
  const linkTube = 0.012;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 8, 24);
  
  const chainGroup = new THREE.Group();
  chainGroup.position.set(0, 0.63, 0); // Start at bail loop

  // Create 6 links going up and slightly back/right
  for (let i = 0; i < 6; i++) {
    const link = new THREE.Mesh(linkGeom, silverMat);
    // Alternate orientation for chain effect
    if (i % 2 === 0) {
      link.rotation.y = Math.PI / 2;
    } else {
      link.rotation.x = Math.PI / 2;
    }
    
    // Position links in a curve
    const yOffset = i * (linkRadius * 1.6);
    const xOffset = i * 0.02;
    const zOffset = -i * 0.02;
    
    link.position.set(xOffset, yOffset, zOffset);
    chainGroup.add(link);
  }
  
  root.add(chainGroup);

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