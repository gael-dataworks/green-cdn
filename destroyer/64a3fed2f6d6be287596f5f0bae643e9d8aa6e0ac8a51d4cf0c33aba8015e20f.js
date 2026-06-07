export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material - brightened with emissive for environment-less render
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE8C84A,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xE8C84A,
    emissiveIntensity: 0.4,
  });

  // --- Geometries ---

  // Long Link: Rounded rectangle tube in XZ plane
  // Using CatmullRomCurve3 with 4 symmetric points creates a smooth rounded rectangle loop
  const longLinkPoints = [
    new THREE.Vector3(-0.14, 0, -0.05),
    new THREE.Vector3(0.14, 0, -0.05),
    new THREE.Vector3(0.14, 0, 0.05),
    new THREE.Vector3(-0.14, 0, 0.05),
  ];
  const longLinkCurve = new THREE.CatmullRomCurve3(longLinkPoints, true, 'centripetal', 0.5);
  const longLinkGeom = new THREE.TubeGeometry(longLinkCurve, 64, 0.028, 16, true);

  // Small Link: Circular torus
  // Slightly smaller radius, same tube thickness
  const smallLinkGeom = new THREE.TorusGeometry(0.055, 0.028, 16, 32);

  // --- Assembly ---

  const linkCount = 10;
  const braceletRadius = 0.38;
  const stepAngle = (Math.PI * 2) / linkCount;

  for (let i = 0; i < linkCount; i++) {
    const theta = i * stepAngle;
    const thetaSmall = (i + 0.5) * stepAngle;

    // 1. Long Link (Flat, Tangent to circle)
    const longLink = new THREE.Mesh(longLinkGeom, goldMat);
    const lx = braceletRadius * Math.cos(theta);
    const lz = braceletRadius * Math.sin(theta);
    longLink.position.set(lx, 0, lz);
    longLink.rotation.y = theta; // Align local Z to tangent
    // RotX = 0 keeps it flat in XZ plane
    root.add(longLink);

    // 2. Small Link (Vertical, Radial-Up plane)
    // Connects the end of Long Link i to start of Long Link i+1
    const smallLink = new THREE.Mesh(smallLinkGeom, goldMat);
    const sx = braceletRadius * Math.cos(thetaSmall);
    const sz = braceletRadius * Math.sin(thetaSmall);
    smallLink.position.set(sx, 0, sz);
    // Orient small link so its hole is Tangent (to interlock with Radial end of Long Link)
    // Start Torus is in XY plane (Normal Z).
    // RotY(thetaSmall) aligns Normal Z to Tangent direction.
    // RotX = 0 keeps it Vertical.
    smallLink.rotation.y = thetaSmall;
    root.add(smallLink);
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