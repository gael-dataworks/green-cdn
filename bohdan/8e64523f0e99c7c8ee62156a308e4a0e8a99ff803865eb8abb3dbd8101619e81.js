export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Amethyst: Deep purple, glossy, slightly transmitting for gem quality.
  const amethystMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a2c91,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.3,
    ior: 1.55,
    transparent: true,
    opacity: 0.95,
  });

  // Silver: Polished metal for bail and chain.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Fossil/Inclusion: Off-white rim, brownish center.
  const fossilRimMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0e0,
    metalness: 0.0,
    roughness: 0.6,
  });
  const fossilCenterMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Stone Body (Teardrop) ---
  // Lathe profile: [radius, y]
  const profilePoints = [
    new THREE.Vector2(0.00, -0.50), // Bottom tip
    new THREE.Vector2(0.18, -0.30),
    new THREE.Vector2(0.28, -0.05), // Max width
    new THREE.Vector2(0.26, 0.15),
    new THREE.Vector2(0.20, 0.30),  // Shoulder
    new THREE.Vector2(0.14, 0.38),  // Neck start
    new THREE.Vector2(0.00, 0.42),  // Top center
  ];
  
  // Use a curve for smoother profile
  const curve = new THREE.SplineCurve(profilePoints);
  const points = curve.getSpacedPoints(32);
  
  const stoneGeom = new THREE.LatheGeometry(points, 32);
  const stone = new THREE.Mesh(stoneGeom, amethystMat);
  root.add(stone);

  // --- Inclusions (Fossils) ---
  // Helper to place a fossil on the stone surface
  function addFossil(angle, y, scale, rotZ) {
    // Approximate radius at height y based on profile logic
    // Simple interpolation for placement accuracy
    let r = 0.1;
    if (y < -0.3) r = 0.15 + (y + 0.3) * 0.65;
    else if (y < 0.15) r = 0.28 - (y + 0.05) * 0.16;
    else if (y < 0.38) r = 0.20 - (y - 0.15) * 0.4;
    else r = 0.14 - (y - 0.38) * 1.0;
    
    // Ensure r is positive and adds a small offset for surface placement
    r = Math.max(0.05, r);
    const offset = 0.005; 
    const finalR = r + offset;

    const x = Math.cos(angle) * finalR;
    const z = Math.sin(angle) * finalR;

    const fossilGroup = new THREE.Group();
    fossilGroup.position.set(x, y, z);
    
    // Orient to face outward
    const normal = new THREE.Vector3(x, 0, z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    fossilGroup.quaternion.copy(quaternion);
    
    // Randomize rotation around normal slightly for organic look
    fossilGroup.rotateZ(rotZ);
    fossilGroup.scale.setScalar(scale);

    // Rim (Ring)
    const rimGeom = new THREE.RingGeometry(0.03, 0.05, 16);
    const rim = new THREE.Mesh(rimGeom, fossilRimMat);
    rim.rotation.x = Math.PI; // Face outward from group center
    fossilGroup.add(rim);

    // Center (Circle)
    const centerGeom = new THREE.CircleGeometry(0.028, 16);
    const center = new THREE.Mesh(centerGeom, fossilCenterMat);
    center.position.z = 0.002; // Slightly recessed or flush
    center.rotation.x = Math.PI;
    fossilGroup.add(center);

    root.add(fossilGroup);
  }

  // Place several fossils at different positions
  // Front visible ones
  addFossil(0, -0.25, 1.2, 0.5);
  addFossil(0.5, 0.1, 0.9, -0.2);
  addFossil(-0.4, -0.1, 1.0, 1.2);
  // Side ones slightly visible
  addFossil(1.8, -0.3, 0.8, 0.0);
  addFossil(-1.5, 0.2, 0.7, -1.0);

  // --- Bail (Metal Cap) ---
  const bailGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 24);
  const bail = new THREE.Mesh(bailGeom, silverMat);
  bail.position.y = 0.38; // Sit on top of stone neck
  root.add(bail);

  // Bail Loop (for chain)
  const loopGeom = new THREE.TorusGeometry(0.04, 0.015, 12, 24);
  const bailLoop = new THREE.Mesh(loopGeom, silverMat);
  bailLoop.position.y = 0.44;
  bailLoop.rotation.x = Math.PI / 2;
  root.add(bailLoop);

  // --- Chain ---
  // Create a few links extending upwards
  const linkGeom = new THREE.TorusGeometry(0.035, 0.012, 12, 24);
  
  function addChainLink(y, z, rotX, rotY) {
    const link = new THREE.Mesh(linkGeom, silverMat);
    link.position.set(0, y, z);
    link.rotation.x = rotX;
    link.rotation.y = rotY;
    root.add(link);
  }

  // Link 1 (attached to bail loop)
  addChainLink(0.48, 0.05, 0, 0);
  // Link 2
  addChainLink(0.56, 0.05, Math.PI / 2, 0);
  // Link 3
  addChainLink(0.64, 0.05, 0, 0);
  // Link 4
  addChainLink(0.72, 0.05, Math.PI / 2, 0);
  // Link 5 (fading out)
  addChainLink(0.80, 0.05, 0, 0);

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