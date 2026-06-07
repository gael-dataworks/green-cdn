export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Shiny yellow latex/rubber
  // Low roughness for the glossy highlight seen in the reference.
  const balloonMat = new THREE.MeshStandardMaterial({
    color: 0xFFEB3B,
    roughness: 0.2,
    metalness: 0.0,
  });

  // Body: Large sphere, slightly elongated vertically to mimic inflated shape
  const bodyGeom = new THREE.SphereGeometry(0.5, 48, 48);
  const body = new THREE.Mesh(bodyGeom, balloonMat);
  body.scale.set(1.0, 1.12, 1.0);
  root.add(body);

  // Knot Neck: Tapered cylinder extending from the bottom
  const knotNeckGeom = new THREE.CylinderGeometry(0.04, 0.07, 0.12, 24);
  const knotNeck = new THREE.Mesh(knotNeckGeom, balloonMat);
  
  // Calculate position based on scaled body bottom
  const bodyBottomY = -0.5 * 1.12;
  knotNeck.position.y = bodyBottomY - 0.06;
  root.add(knotNeck);

  // Knot Tip: Small sphere at the end of the neck
  const knotTipGeom = new THREE.SphereGeometry(0.045, 24, 24);
  const knotTip = new THREE.Mesh(knotTipGeom, balloonMat);
  knotTip.position.y = knotNeck.position.y - 0.06 - 0.045;
  root.add(knotTip);

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