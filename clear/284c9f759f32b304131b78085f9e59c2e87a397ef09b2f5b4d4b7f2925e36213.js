export default function generate(THREE) {
  // --- Materials ---
  // Galvanized/brushed steel appearance.
  // Metalness capped at 0.5 to avoid blackness without env map.
  // Roughness 0.4 for a satin/metallic sheen.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.5,
    roughness: 0.4,
  });

  const root = new THREE.Group();

  // --- Dimensions & Profile ---
  // Define the side profile of the dome cap (radius, height)
  // Starting from bottom edge, curving up to top neck.
  const profilePoints = [
    new THREE.Vector2(0.50, 0.00), // Bottom outer edge
    new THREE.Vector2(0.51, 0.04), // Slight outward flare at base
    new THREE.Vector2(0.49, 0.12), // Curving inward
    new THREE.Vector2(0.45, 0.20), // Mid-section curve
    new THREE.Vector2(0.38, 0.30), // Upper curve
    new THREE.Vector2(0.35, 0.36), // Top neck start
    new THREE.Vector2(0.35, 0.38), // Top flat surface
  ];

  // --- 1. Main Dome Body ---
  // Use LatheGeometry for the rotationally symmetric main shell.
  // 64 segments ensures a smooth circular appearance.
  const domeGeom = new THREE.LatheGeometry(profilePoints, 64);
  const domeBody = new THREE.Mesh(domeGeom, steelMat);
  root.add(domeBody);

  // --- 2. Top Cap / Flange ---
  // Flat disk on top of the neck.
  const topCapGeom = new THREE.CylinderGeometry(0.37, 0.37, 0.02, 64);
  const topCap = new THREE.Mesh(topCapGeom, steelMat);
  topCap.position.y = 0.38;
  root.add(topCap);

  // --- 3. Bottom Rim / Flange ---
  // A thin torus ring at the base to match the flared bottom edge.
  const bottomRimGeom = new THREE.TorusGeometry(0.505, 0.012, 16, 64);
  const bottomRim = new THREE.Mesh(bottomRimGeom, steelMat);
  bottomRim.rotation.x = Math.PI / 2;
  bottomRim.position.y = 0.012;
  root.add(bottomRim);

  // --- 4. Vertical Ribs (Seams) ---
  // Create a 3D curve matching the profile to extrude ribs along.
  const ribPathPoints = profilePoints.map(p => new THREE.Vector3(p.x, p.y, 0));
  const ribCurve = new THREE.CatmullRomCurve3(ribPathPoints);
  
  // TubeGeometry for the rib cross-section (small radius)
  const ribGeom = new THREE.TubeGeometry(ribCurve, 32, 0.006, 8, false);
  
  // Place 12 ribs radially around the Y axis
  const ribCount = 12;
  for (let i = 0; i < ribCount; i++) {
    const rib = new THREE.Mesh(ribGeom, steelMat);
    rib.rotation.y = (i / ribCount) * Math.PI * 2;
    root.add(rib);
  }

  // --- 5. Horizontal Reinforcement Bands ---
  // Two rings wrapping around the dome.
  
  // Lower Band
  const band1Radius = 0.46;
  const band1Y = 0.11;
  const band1Geom = new THREE.TorusGeometry(band1Radius, 0.010, 16, 64);
  const band1 = new THREE.Mesh(band1Geom, steelMat);
  band1.rotation.x = Math.PI / 2;
  band1.position.y = band1Y;
  root.add(band1);

  // Upper Band
  const band2Radius = 0.41;
  const band2Y = 0.23;
  const band2Geom = new THREE.TorusGeometry(band2Radius, 0.010, 16, 64);
  const band2 = new THREE.Mesh(band2Geom, steelMat);
  band2.rotation.x = Math.PI / 2;
  band2.position.y = band2Y;
  root.add(band2);

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