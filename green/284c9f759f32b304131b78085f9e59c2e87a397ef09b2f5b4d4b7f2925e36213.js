export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Galvanized / Brushed Steel
  // Metalness capped at 0.6 to avoid black reflection without envMap.
  // Roughness 0.6 for industrial/weathered look.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xa8a8a8,
    metalness: 0.6,
    roughness: 0.6,
  });

  // --- 1. Main Body (Lathe) ---
  // Profile defines the silhouette from bottom to top.
  // Coordinates are (radius, y).
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom (closed)
    new THREE.Vector2(0.51, 0.00), // Bottom outer edge
    new THREE.Vector2(0.51, 0.025), // Bottom flange thickness
    new THREE.Vector2(0.47, 0.04), // Skirt start (slight inward taper)
    new THREE.Vector2(0.45, 0.26), // Skirt end / Ring bottom
    new THREE.Vector2(0.48, 0.28), // Ring bulge (max radius)
    new THREE.Vector2(0.45, 0.30), // Ring top
    new THREE.Vector2(0.38, 0.45), // Dome curve
    new THREE.Vector2(0.26, 0.56), // Dome top / Neck
    new THREE.Vector2(0.29, 0.58), // Top flange outer
    new THREE.Vector2(0.29, 0.59), // Top flange thickness
    new THREE.Vector2(0.26, 0.59), // Top opening inner
    new THREE.Vector2(0.00, 0.59), // Close top
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Compute vertex normals for smooth shading on the dome
  bodyGeom.computeVertexNormals();
  
  const body = new THREE.Mesh(bodyGeom, steelMat);
  root.add(body);

  // --- 2. Vertical Ribs ---
  // Create a curve that follows the body profile but slightly offset outward.
  // We reuse the profile logic but shift X slightly.
  const ribPathPoints = [
    new THREE.Vector3(0.515, 0.01, 0),
    new THREE.Vector3(0.475, 0.04, 0),
    new THREE.Vector3(0.455, 0.26, 0),
    new THREE.Vector3(0.485, 0.28, 0),
    new THREE.Vector3(0.455, 0.30, 0),
    new THREE.Vector3(0.385, 0.45, 0),
    new THREE.Vector3(0.265, 0.56, 0),
  ];
  
  const ribCurve = new THREE.CatmullRomCurve3(ribPathPoints);
  const ribGeom = new THREE.TubeGeometry(ribCurve, 20, 0.006, 8, false);
  
  const ribCount = 12;
  const ribs = new THREE.InstancedMesh(ribGeom, steelMat, ribCount);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, angle, 0);
    dummy.updateMatrix();
    ribs.setMatrixAt(i, dummy.matrix);
  }
  root.add(ribs);

  // --- 3. Middle Reinforcing Ring ---
  // A torus to represent the band around the waist.
  const ringRadius = 0.46;
  const ringTube = 0.012;
  const middleRingGeom = new THREE.TorusGeometry(ringRadius, ringTube, 16, 32);
  const middleRing = new THREE.Mesh(middleRingGeom, steelMat);
  middleRing.rotation.x = Math.PI / 2;
  middleRing.position.y = 0.28;
  root.add(middleRing);

  // --- 4. Top Rim ---
  // Distinct lip at the top opening.
  const topRimRadius = 0.29;
  const topRimTube = 0.005;
  const topRimGeom = new THREE.TorusGeometry(topRimRadius, topRimTube, 16, 32);
  const topRim = new THREE.Mesh(topRimGeom, steelMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.585;
  root.add(topRim);

  // --- 5. Bottom Rim ---
  // Distinct lip at the base.
  const bottomRimRadius = 0.51;
  const bottomRimTube = 0.005;
  const bottomRimGeom = new THREE.TorusGeometry(bottomRimRadius, bottomRimTube, 16, 32);
  const bottomRim = new THREE.Mesh(bottomRimGeom, steelMat);
  bottomRim.rotation.x = Math.PI / 2;
  bottomRim.position.y = 0.01;
  root.add(bottomRim);

  // Normalize to fit unit cube
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