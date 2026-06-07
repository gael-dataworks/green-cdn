export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material: bright, reflective, but capped metalness to avoid blackness without env map.
  // Emissive boost ensures it reads as bright metal in the fixed lighting.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0x332200,
    emissiveIntensity: 0.35,
  });

  // Link Geometry: Tube following a stadium (rounded rectangle) path.
  // Points define the centerline of the wire.
  const linkLength = 0.14;
  const linkWidth = 0.045;
  const tubeRadius = 0.014;

  const linkPoints = [
    new THREE.Vector3(-linkLength / 2, 0, 0),
    new THREE.Vector3(-linkLength / 2, linkWidth / 2, 0),
    new THREE.Vector3(linkLength / 2, linkWidth / 2, 0),
    new THREE.Vector3(linkLength / 2, 0, 0),
    new THREE.Vector3(linkLength / 2, -linkWidth / 2, 0),
    new THREE.Vector3(-linkLength / 2, -linkWidth / 2, 0),
  ];

  const linkCurve = new THREE.CatmullRomCurve3(linkPoints, true, 'centripetal', 0.5);
  const linkGeom = new THREE.TubeGeometry(linkCurve, 32, tubeRadius, 12, true);

  // Flatten the tube slightly to match the "cable" look in the reference.
  // Scale Y to squash the circular cross-section into an oval.
  linkGeom.scale(1, 0.65, 1);

  // Bracelet parameters
  const linkCount = 14;
  // Calculate radius so links touch end-to-end approximately
  // Circumference ≈ linkCount * linkLength
  const circumference = linkCount * linkLength * 0.92; // 0.92 factor to tighten the loop so they interlock
  const braceletRadius = circumference / (2 * Math.PI);

  for (let i = 0; i < linkCount; i++) {
    const link = new THREE.Mesh(linkGeom, goldMat);

    // Position on the circle (XZ plane)
    const angle = (i / linkCount) * Math.PI * 2;
    const x = Math.sin(angle) * braceletRadius;
    const z = Math.cos(angle) * braceletRadius;

    link.position.set(x, 0, z);

    // Rotate to face tangent of the circle
    link.rotation.y = -angle;

    // Alternating orientation:
    // Even links: Flat (lie on XZ plane). Rotate 90 deg around local X (which is now tangent).
    // Odd links: Vertical (stand on XY plane relative to tangent).
    // Note: Since we rotated Y first, the local X axis is now tangent to the circle.
    // To make it flat, we rotate around this new tangent axis (local X) by 90 deg.
    if (i % 2 === 0) {
      link.rotateX(Math.PI / 2);
    }

    root.add(link);
  }

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