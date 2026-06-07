export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished Copper (Body, Stem, Base)
  // Using emissive to ensure brightness in the dim renderer as per metal handbook.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xb87333,
    emissiveIntensity: 0.4,
  });

  // Polished Silver (Handles)
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.4,
  });

  // --- Cup Body (Lathe) ---
  // Profile points [radius, height] from bottom center up to top center.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.38, 0.00), // Base outer edge
    new THREE.Vector2(0.35, 0.08), // Base top curve
    new THREE.Vector2(0.14, 0.18), // Stem narrow
    new THREE.Vector2(0.19, 0.28), // Stem knop (bulb) max
    new THREE.Vector2(0.14, 0.38), // Stem narrow above knop
    new THREE.Vector2(0.24, 0.48), // Cup bottom transition
    new THREE.Vector2(0.28, 0.80), // Cup belly curve
    new THREE.Vector2(0.42, 1.25), // Cup rim outer
    new THREE.Vector2(0.45, 1.30), // Thickened lip outer
    new THREE.Vector2(0.40, 1.30), // Lip inner step
    new THREE.Vector2(0.00, 1.30), // Top center (close the volume)
  ];

  const cupGeometry = new THREE.LatheGeometry(profilePoints, 32);
  // Ensure normals are smooth
  cupGeometry.computeVertexNormals();
  
  const cupBody = new THREE.Mesh(cupGeometry, copperMat);
  root.add(cupBody);

  // --- Handles (Tube) ---
  // Define a curve for the left handle in the XY plane (Y is up, X is width).
  // The handle will be flattened on Z.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.44, 1.22, 0), // Attach point top (near rim)
    new THREE.Vector3(0.62, 1.25, 0), // Scroll out top
    new THREE.Vector3(0.68, 0.95, 0), // Outer arch
    new THREE.Vector3(0.58, 0.65, 0), // Scroll in bottom
    new THREE.Vector3(0.44, 0.55, 0), // Attach point bottom (mid-bowl)
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 20, 0.035, 8, false);
  const leftHandle = new THREE.Mesh(handleGeom, silverMat);
  // Flatten the tube to make it look like a ribbon/scroll plate
  leftHandle.scale.set(1, 1, 0.35);
  root.add(leftHandle);

  // Right handle (mirrored)
  const rightHandle = leftHandle.clone();
  rightHandle.scale.set(-1, 1, 0.35); // Mirror X
  root.add(rightHandle);

  // --- Handle Mounts (Decorative details) ---
  // Small spheres/bosses where handles attach to the copper body
  const mountGeom = new THREE.SphereGeometry(0.045, 16, 16);
  
  // Top mounts
  const topMountL = new THREE.Mesh(mountGeom, silverMat);
  topMountL.position.set(0.44, 1.22, 0);
  // Scale Z to match flattened handle thickness roughly
  topMountL.scale.set(1, 1, 0.4); 
  root.add(topMountL);

  const topMountR = topMountL.clone();
  topMountR.position.x *= -1;
  root.add(topMountR);

  // Bottom mounts
  const botMountL = new THREE.Mesh(mountGeom, silverMat);
  botMountL.position.set(0.44, 0.55, 0);
  botMountL.scale.set(1, 1, 0.4);
  root.add(botMountL);

  const botMountR = botMountL.clone();
  botMountR.position.x *= -1;
  root.add(botMountR);

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