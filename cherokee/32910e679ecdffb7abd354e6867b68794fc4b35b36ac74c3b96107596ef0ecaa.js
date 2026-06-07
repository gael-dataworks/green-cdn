export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Dark polished wood (Walnut/Rosewood style)
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4a3025,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Dark seam/groove material (simulated shadow or inserted ring)
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });

  // --- Main Body (Lathe) ---
  // Profile defines the silhouette from bottom (tip) to top (handle cap)
  // Y is the long axis of the tool in local space.
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Tip center
    new THREE.Vector2(0.035, 0.00), // Tip rounded start
    new THREE.Vector2(0.045, 0.15), // Shaft start taper
    new THREE.Vector2(0.055, 0.45), // Shaft middle
    new THREE.Vector2(0.060, 0.60), // Shaft end near handle
    new THREE.Vector2(0.068, 0.62), // Slight lip before groove
    new THREE.Vector2(0.052, 0.64), // The groove (seam)
    new THREE.Vector2(0.068, 0.66), // Handle base
    new THREE.Vector2(0.068, 0.85), // Handle top edge
    new THREE.Vector2(0.00, 0.85),  // Handle cap center
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const body = new THREE.Mesh(bodyGeom, woodMat);
  
  // The lathe creates the object along Y. We need it horizontal.
  // Rotate -90 deg around X to lie on XZ plane.
  body.rotation.x = -Math.PI / 2;
  // Rotate slightly around Y to match the diagonal perspective in the reference.
  body.rotation.y = Math.PI / 4;
  
  root.add(body);

  // --- Seam Detail ---
  // The groove is modeled in the lathe, but we can add a subtle dark ring
  // to emphasize the separation between handle and shaft if needed.
  // Given the profile has a groove, the geometry + lighting should suffice,
  // but a thin dark cylinder inside the groove adds definition.
  const seamGeom = new THREE.TorusGeometry(0.054, 0.004, 8, 24);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  
  // Position the seam to match the groove in the profile (y ~ 0.64 in local)
  // Since body is rotated, we need to place the seam in the body's local space
  // or attach it to the body. Attaching to body is easier.
  // In body's local Y-up space:
  seam.position.y = 0.64;
  seam.rotation.x = Math.PI / 2; // Torus lies in XY, we want it flat in XZ relative to body axis?
  // Wait, Torus is in XY plane by default. If body is Y-up, Torus in XY is perpendicular to Y axis.
  // So Torus.rotation.x = 0 is correct for a ring around Y axis.
  // But we rotated the body mesh. The seam is a child of root, not body.
  // Let's make seam a child of body so transforms are local.
  body.add(seam);
  // Reset seam rotation because it's now child of body.
  // Body is rotated, so seam follows.
  // Torus default is XY plane (normal Z). We want normal Y (around the tool axis).
  // So rotate Torus 90 deg around X.
  seam.rotation.x = Math.PI / 2;
  seam.position.set(0, 0.64, 0);


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