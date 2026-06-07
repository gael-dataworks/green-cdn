export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Galvanized/Brushed Metal
  // Metalness capped at 0.6 to avoid black surfaces in this render environment.
  // Slight emissive to ensure brightness.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xbcc1c6,
    metalness: 0.6,
    roughness: 0.45,
    emissive: 0xbcc1c6,
    emissiveIntensity: 0.15,
  });

  // --- 1. Main Dome Body (Lathe) ---
  // Profile points (radius, height). Starts at bottom, goes to top.
  // The shape is a wide frustum with a curved profile.
  const profilePoints = [
    new THREE.Vector2(0.50, 0.00), // Bottom outer edge
    new THREE.Vector2(0.46, 0.14), // Curve inward to band level
    new THREE.Vector2(0.38, 0.35), // Upper curve
    new THREE.Vector2(0.32, 0.45), // Top neck
    new THREE.Vector2(0.36, 0.46), // Top lip flare
  ];

  const domeGeom = new THREE.LatheGeometry(profilePoints, 64);
  const dome_body = new THREE.Mesh(domeGeom, metalMat);
  root.add(dome_body);

  // --- 2. Vertical Ribs (Tubes along the profile) ---
  // Create a 3D curve that matches the profile but is slightly offset outward
  // so the rib sits on top of the surface.
  const ribRadius = 0.008;
  const offset = ribRadius + 0.002;
  
  const ribCurvePoints = profilePoints.map(p => new THREE.Vector3(p.x + offset, p.y, 0));
  const ribCurve = new THREE.CatmullRomCurve3(ribCurvePoints);
  
  const ribGeom = new THREE.TubeGeometry(ribCurve, 20, ribRadius, 8, false);
  
  // Place 8 ribs radially
  const ribCount = 8;
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeom, metalMat);
    rib.rotation.y = angle;
    root.add(rib);
  }

  // --- 3. Horizontal Reinforcing Band ---
  // Positioned at the "waist" of the dome (around y=0.14)
  // Radius should match the body radius at that height + thickness
  const bandY = 0.14;
  const bandRadius = 0.46 + 0.015; // Slightly larger than body to sit on top
  const bandTubeRadius = 0.015;
  
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTubeRadius, 8, 32);
  const horizontal_band = new THREE.Mesh(bandGeom, metalMat);
  horizontal_band.rotation.x = Math.PI / 2; // Lay flat in XZ plane
  horizontal_band.position.y = bandY;
  root.add(horizontal_band);

  // --- 4. Top Rim ---
  // Flat annular ring at the top
  const topRimInner = 0.32;
  const topRimOuter = 0.38;
  const topRimGeom = new THREE.RingGeometry(topRimInner, topRimOuter, 32);
  const top_rim = new THREE.Mesh(topRimGeom, metalMat);
  top_rim.rotation.x = Math.PI / 2;
  top_rim.position.y = 0.46;
  root.add(top_rim);

  // --- 5. Bottom Rim ---
  // Flared edge at the bottom
  const botRimRadius = 0.51;
  const botRimTubeRadius = 0.012;
  const botRimGeom = new THREE.TorusGeometry(botRimRadius, botRimTubeRadius, 8, 32);
  const bottom_rim = new THREE.Mesh(botRimGeom, metalMat);
  bottom_rim.rotation.x = Math.PI / 2;
  bottom_rim.position.y = 0.00;
  root.add(bottom_rim);

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