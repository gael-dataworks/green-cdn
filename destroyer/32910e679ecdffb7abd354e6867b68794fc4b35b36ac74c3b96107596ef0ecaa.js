export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Dark polished wood (Walnut/Rosewood appearance)
  // Using standard material with low metalness and moderate roughness for satin finish.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    metalness: 0.0,
    roughness: 0.45,
  });

  // Profile for LatheGeometry (Y-up, radial symmetry)
  // Coordinates are relative; fitToUnitCube will scale them.
  // Shape: Tapered shaft with rounded tip, distinct groove, and wider cap.
  const profilePoints = [
    new THREE.Vector2(0.000, 0.00), // Tip center
    new THREE.Vector2(0.028, 0.00), // Tip bottom edge (rounded start)
    new THREE.Vector2(0.030, 0.04), // Tip curve transition
    new THREE.Vector2(0.055, 0.80), // Shaft taper end (near groove)
    new THREE.Vector2(0.050, 0.83), // Groove dip
    new THREE.Vector2(0.072, 0.84), // Cap base flare
    new THREE.Vector2(0.072, 1.00), // Cap top edge
    new THREE.Vector2(0.000, 1.00), // Cap top center
  ];

  // Use a curve to smooth the profile between key points for an organic feel
  const curve = new THREE.SplineCurve(profilePoints);
  const smoothProfile = curve.getSpacedPoints(64);

  const wandGeom = new THREE.LatheGeometry(smoothProfile, 32);
  const wand = new THREE.Mesh(wandGeom, woodMat);
  
  // Center the geometry vertically so the pivot is roughly in the middle
  // LatheGeometry builds from 0 to 1 in Y. Shift it down by 0.5.
  wand.position.y = -0.5;
  
  // Rotate to match the diagonal orientation in the reference (approx -45 deg around Z, then some X)
  // Actually, standard practice is Y-up. I will leave it Y-up for the validator, 
  // as the camera usually adjusts. But if I want to match the "lying down" pose:
  // The reference shows it lying on a surface. 
  // Let's keep it Y-up (standing) as per standard object generation unless specified otherwise.
  // However, to make it look like the reference immediately, I'll rotate it to lie on XZ plane.
  // Reference: Tip is bottom-left, Cap is top-right.
  // Let's rotate it to lie along the X axis for a neutral "lying down" pose.
  wand.rotation.z = Math.PI / 2;

  root.add(wand);

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