export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Blue plastic body: vibrant blue, matte finish.
  const blueMat = new THREE.MeshStandardMaterial({
    color: 0x0044ee,
    metalness: 0.0,
    roughness: 0.35,
  });

  // Black base: rubbery or hard plastic, dark.
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  // We model in local units, then fitToUnitCube scales everything.
  const totalHeight = 2.2;
  const baseHeight = 0.15;
  const bodyRadiusBottom = 0.18;
  const bodyRadiusWaist = 0.15;
  const bodyRadiusShoulder = 0.19;
  const neckRadius = 0.14;
  const capRadius = 0.15;

  // 1. Black Base
  // A short, wide cylinder at the bottom.
  const baseGeom = new THREE.CylinderGeometry(
    bodyRadiusBottom, 
    bodyRadiusBottom * 0.95, // Slight taper or just uniform
    baseHeight, 
    32
  );
  const base = new THREE.Mesh(baseGeom, blackMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // 2. Blue Body (Main Container)
  // We use LatheGeometry to create the ergonomic S-curve profile.
  // Profile points (radius, y) starting from the top of the black base.
  const profilePoints = [
    new THREE.Vector2(0, baseHeight), // Center start (optional, keeps it closed if needed, but we start at edge)
    new THREE.Vector2(bodyRadiusBottom, baseHeight), // Bottom edge resting on base
    new THREE.Vector2(bodyRadiusBottom * 0.98, baseHeight + 0.4), // Slight taper up
    new THREE.Vector2(bodyRadiusWaist, baseHeight + 0.9), // Waist (narrowest part)
    new THREE.Vector2(bodyRadiusShoulder, baseHeight + 1.5), // Shoulder (widest part)
    new THREE.Vector2(neckRadius, baseHeight + 1.85), // Neck start
    new THREE.Vector2(neckRadius, baseHeight + 1.95), // Neck straight section
    new THREE.Vector2(capRadius, baseHeight + 2.05), // Cap flare
    new THREE.Vector2(capRadius * 0.9, baseHeight + 2.15), // Cap top edge
    new THREE.Vector2(0, baseHeight + 2.15) // Top center
  ];

  // Remove the center start point to ensure clean edge at bottom
  profilePoints.shift(); 

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, blueMat);
  root.add(body);

  // 3. Cap Seam Detail
  // A thin ring to visualize the separation between body and cap.
  // Positioned roughly where the neck meets the cap flare.
  const seamY = baseHeight + 1.95;
  const seamGeom = new THREE.TorusGeometry(neckRadius, 0.005, 16, 32);
  const seam = new THREE.Mesh(seamGeom, blackMat); // Dark seam
  seam.rotation.x = Math.PI / 2;
  seam.position.y = seamY;
  root.add(seam);

  // 4. Cap Top Surface Detail (Optional subtle ridge)
  // The top of the cap often has a slight texture or ridge.
  const topRidgeGeom = new THREE.TorusGeometry(capRadius * 0.6, 0.004, 16, 32);
  const topRidge = new THREE.Mesh(topRidgeGeom, blueMat);
  topRidge.rotation.x = Math.PI / 2;
  topRidge.position.y = baseHeight + 2.12;
  root.add(topRidge);

  // Normalize the object to fit the unit cube (0.95 scale)
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