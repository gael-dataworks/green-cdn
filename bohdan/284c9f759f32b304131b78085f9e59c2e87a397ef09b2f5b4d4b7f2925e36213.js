export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed galvanized metal look
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xa8a8a8,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Slightly darker metal for seams/ribs to create contrast
  const ribMat = new THREE.MeshStandardMaterial({
    color: 0x909090,
    metalness: 0.6,
    roughness: 0.5,
  });

  // --- Dimensions ---
  const bottomR = 0.45;
  const middleR = 0.42;
  const middleY = 0.14;
  const topR = 0.26;
  const topY = 0.34;
  const ribCount = 8;

  // --- 1. Main Body (Lathe) ---
  // Profile defines the silhouette of the panels between ribs
  const profilePoints = [
    new THREE.Vector2(bottomR, 0.0),
    new THREE.Vector2(middleR + 0.005, middleY), // Slight bulge at band
    new THREE.Vector2(topR, topY),
    new THREE.Vector2(topR - 0.02, topY + 0.01), // Lip
  ];
  
  // We need a closed shape for lathe if we want a solid, but this is a cap.
  // Let's make it a thin shell or solid. Solid is easier for rendering.
  // Add center points to close the top if needed, but there is a hole.
  // So profile goes from outer bottom to outer top.
  
  const bodyProfile = [
    new THREE.Vector2(bottomR, 0.0),
    new THREE.Vector2(middleR, middleY),
    new THREE.Vector2(topR, topY),
    new THREE.Vector2(topR, topY + 0.015), // Top lip thickness
    new THREE.Vector2(topR - 0.03, topY + 0.015), // Top inner
    new THREE.Vector2(topR - 0.03, topY), // Drop down inside
    new THREE.Vector2(middleR - 0.03, middleY), // Inside wall
    new THREE.Vector2(bottomR - 0.03, 0.0), // Bottom inner
    new THREE.Vector2(bottomR, 0.0), // Close loop at bottom rim
  ];

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 64);
  const body = new THREE.Mesh(bodyGeom, metalMat);
  root.add(body);

  // --- 2. Vertical Ribs ---
  // Create a curve that follows the surface
  const ribCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(bottomR + 0.002, 0.0, 0),
    new THREE.Vector3(middleR + 0.002, middleY, 0),
    new THREE.Vector3(topR + 0.002, topY, 0),
  ]);

  const ribGeom = new THREE.TubeGeometry(ribCurve, 20, 0.008, 8, false);
  
  for (let i = 0; i < ribCount; i++) {
    const angle = (i / ribCount) * Math.PI * 2;
    const rib = new THREE.Mesh(ribGeom, ribMat);
    rib.rotation.y = angle;
    root.add(rib);
  }

  // --- 3. Horizontal Middle Band ---
  // A torus that sits on top of the ribs/body at the waist
  const bandRadius = middleR + 0.01; // Slightly outside the body
  const bandGeom = new THREE.TorusGeometry(bandRadius, 0.012, 16, 64);
  const band = new THREE.Mesh(bandGeom, ribMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = middleY;
  root.add(band);

  // --- 4. Top Rim ---
  // Flat disk capping the top
  const topRimGeom = new THREE.CylinderGeometry(topR + 0.04, topR + 0.04, 0.015, 64);
  const topRim = new THREE.Mesh(topRimGeom, metalMat);
  topRim.position.y = topY + 0.015;
  root.add(topRim);

  // --- 5. Bottom Rim ---
  // Flat ring at the base
  const bottomRimGeom = new THREE.RingGeometry(bottomR, bottomR + 0.04, 64);
  const bottomRim = new THREE.Mesh(bottomRimGeom, metalMat);
  bottomRim.rotation.x = Math.PI / 2;
  bottomRim.position.y = 0.0;
  root.add(bottomRim);

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