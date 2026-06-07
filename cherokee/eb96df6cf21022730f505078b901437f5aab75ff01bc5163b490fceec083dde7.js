export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material - warm rose gold tone.
  // Metalness capped at 0.6 to prevent black rendering in no-env setup.
  // Emissive added to lift brightness as per metal handbook.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe0ac69,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xe0ac69,
    emissiveIntensity: 0.35,
  });

  // Ring dimensions
  const ringRadius = 0.35;      // Distance from center to ring core
  const braidRadius = 0.045;    // Distance from ring core to strand center
  const strandThickness = 0.045; // Radius of the tube strand itself
  const twists = 14;            // Number of full rotations of the braid
  const strandCount = 3;        // Number of interwoven strands
  const tubularSegments = 128;  // Smoothness along the ring
  const radialSegments = 12;    // Smoothness of the strand cross-section

  // Create multiple strands to form the braid
  for (let i = 0; i < strandCount; i++) {
    const phase = (i / strandCount) * Math.PI * 2;
    const points = [];

    // Generate points for a helical path around the torus core
    for (let t = 0; t <= 1; t += 1 / tubularSegments) {
      const angle = t * Math.PI * 2;             // Angle around the main ring
      const twistAngle = angle * twists + phase; // Angle of rotation around the ring's tube

      // Torus helix parametric equation
      const x = (ringRadius + braidRadius * Math.cos(twistAngle)) * Math.cos(angle);
      const y = braidRadius * Math.sin(twistAngle);
      const z = (ringRadius + braidRadius * Math.cos(twistAngle)) * Math.sin(angle);

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;

    const strandGeom = new THREE.TubeGeometry(
      curve,
      tubularSegments,
      strandThickness,
      radialSegments,
      true
    );

    const strand = new THREE.Mesh(strandGeom, goldMat);
    root.add(strand);
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