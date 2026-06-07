export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Brushed galvanized steel / aluminum
  // Metalness capped at 0.6 to prevent black reflections without env map.
  // Roughness 0.5 for a weathered/industrial look.
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.6,
    roughness: 0.5,
  });

  // --- 1. Main Dome Body (Lathe) ---
  // Profile defines the "valley" surface between the ribs.
  // Points: [radius, y]
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Center bottom (closed)
    new THREE.Vector2(0.45, 0.00), // Bottom outer edge
    new THREE.Vector2(0.44, 0.15), // Mid section (slight taper)
    new THREE.Vector2(0.26, 0.35), // Top dome curve
    new THREE.Vector2(0.28, 0.36), // Top lip flare
    new THREE.Vector2(0.00, 0.36), // Top center (closed)
  ];
  const domeGeom = new THREE.LatheGeometry(profilePoints, 32);
  const dome = new THREE.Mesh(domeGeom, steelMat);
  root.add(dome);

  // --- 2. Vertical Ribs ---
  // 12 ribs evenly spaced. They follow the curve of the dome.
  // We use a TubeGeometry with a CatmullRomCurve3 path matching the profile.
  const ribPathPoints = [
    new THREE.Vector3(0.45, 0.00, 0),
    new THREE.Vector3(0.44, 0.15, 0),
    new THREE.Vector3(0.26, 0.35, 0),
  ];
  const ribCurve = new THREE.CatmullRomCurve3(ribPathPoints);
  const ribGeom = new THREE.TubeGeometry(ribCurve, 20, 0.012, 8, false);
  
  const ribCount = 12;
  for (let i = 0; i < ribCount; i++) {
    const rib = new THREE.Mesh(ribGeom, steelMat);
    const angle = (i / ribCount) * Math.PI * 2;
    rib.rotation.y = angle;
    root.add(rib);
  }

  // --- 3. Horizontal Reinforcing Band ---
  // Sits on top of the ribs at y=0.15. Radius slightly larger than rib path at that height.
  const bandRadius = 0.455;
  const bandTubeRadius = 0.015;
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTubeRadius, 16, 48);
  const band = new THREE.Mesh(bandGeom, steelMat);
  band.rotation.x = Math.PI / 2; // Torus is vertical by default, rotate to horizontal XZ
  band.position.y = 0.15;
  root.add(band);

  // --- 4. Top Rim ---
  // Flat ring at the very top opening.
  const topRimRadius = 0.28;
  const topRimTube = 0.01;
  const topRimGeom = new THREE.TorusGeometry(topRimRadius, topRimTube, 16, 32);
  const topRim = new THREE.Mesh(topRimGeom, steelMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 0.36;
  root.add(topRim);

  // --- 5. Bottom Flange ---
  // Slightly wider ring at the base.
  const bottomRimRadius = 0.46;
  const bottomRimTube = 0.01;
  const bottomRimGeom = new THREE.TorusGeometry(bottomRimRadius, bottomRimTube, 16, 32);
  const bottomRim = new THREE.Mesh(bottomRimGeom, steelMat);
  bottomRim.rotation.x = Math.PI / 2;
  bottomRim.position.y = 0.01;
  root.add(bottomRim);

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