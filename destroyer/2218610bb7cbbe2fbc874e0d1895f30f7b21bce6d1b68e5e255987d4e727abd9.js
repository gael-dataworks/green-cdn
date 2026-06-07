export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper: Polished metal, needs emissive boost to avoid looking dark.
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xb87333,
    emissiveIntensity: 0.3,
  });

  // Silver: Polished metal, white/grey.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xc0c0c0,
    emissiveIntensity: 0.3,
  });

  // --- Cup Body (Lathe) ---
  // Profile defines the silhouette from bottom center, out to base, up stem,
  // out to bowl, up to rim, then IN to define thickness and hollow interior.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center Bottom
    new THREE.Vector2(0.19, 0.00), // Base Edge
    new THREE.Vector2(0.19, 0.03), // Base Top
    new THREE.Vector2(0.11, 0.05), // Stem Neck
    new THREE.Vector2(0.12, 0.09), // Stem Bulb
    new THREE.Vector2(0.11, 0.13), // Stem Top
    new THREE.Vector2(0.14, 0.15), // Bowl Base Transition
    new THREE.Vector2(0.16, 0.25), // Bowl Curve Start
    new THREE.Vector2(0.25, 0.48), // Bowl Max Width
    new THREE.Vector2(0.27, 0.55), // Rim Outer Top
    new THREE.Vector2(0.25, 0.55), // Rim Inner Top (Thickness)
    new THREE.Vector2(0.23, 0.48), // Inner Wall
    new THREE.Vector2(0.16, 0.16), // Inner Bowl Bottom
    new THREE.Vector2(0.12, 0.13), // Inner Stem Top
    new THREE.Vector2(0.00, 0.13), // Close Axis (Solid Stem/Base)
  ];

  const cupBodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Ensure inside is visible
  cupBodyGeom.computeVertexNormals();
  const cupBody = new THREE.Mesh(cupBodyGeom, copperMat);
  root.add(cupBody);

  // --- Handles (Tube) ---
  // Define a curve for the right handle.
  // Starts at rim, scrolls out/up, sweeps down, attaches at bowl base.
  const handlePathPoints = [
    new THREE.Vector3(0.27, 0.54, 0.00), // Top Attach (Rim)
    new THREE.Vector3(0.34, 0.56, 0.00), // Top Scroll Peak
    new THREE.Vector3(0.32, 0.45, 0.00), // Curve Down
    new THREE.Vector3(0.36, 0.35, 0.00), // Widest Point
    new THREE.Vector3(0.30, 0.25, 0.00), // Curve In
    new THREE.Vector3(0.24, 0.18, 0.00), // Bottom Attach (Bowl)
    new THREE.Vector3(0.20, 0.15, 0.00), // End Tip
  ];

  const handleCurve = new THREE.CatmullRomCurve3(handlePathPoints);
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.018, 8, false);
  
  // Flatten the handle slightly to look like a ribbon/strip rather than a wire
  // Scale Z to make it thin, keep X/Y for the curve shape.
  const rightHandle = new THREE.Mesh(handleGeom, silverMat);
  rightHandle.scale.set(1, 1, 0.5); 
  root.add(rightHandle);

  // Left Handle: Clone and rotate 180 degrees around Y
  const leftHandle = new THREE.Mesh(handleGeom, silverMat);
  leftHandle.scale.set(1, 1, 0.5);
  leftHandle.rotation.y = Math.PI;
  root.add(leftHandle);

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