export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material - polished, bright
  // Using emissive to ensure brightness in dim render environment as per handbook
  const goldColor = 0xE8C84A;
  const goldMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    metalness: 0.6,
    roughness: 0.25,
    emissive: goldColor,
    emissiveIntensity: 0.4,
  });

  // Ring parameters
  const R_RING = 0.35;       // Radius of the ring centerline
  const R_BUNDLE = 0.045;    // Radius of the circle the strands orbit (thickness of braid)
  const R_STRAND = 0.028;    // Radius of individual strand
  const TWISTS = 3;          // Number of times the braid wraps around the ring
  const TUBULAR_SEGMENTS = 100; // Smoothness along the ring
  const RADIAL_SEGMENTS = 12;   // Smoothness of strand cross-section
  const numStrands = 3;

  // Create 3 strands for a standard braid
  for (let k = 0; k < numStrands; k++) {
    const points = [];
    const phase = (k / numStrands) * Math.PI * 2;

    for (let i = 0; i <= TUBULAR_SEGMENTS; i++) {
      const t = (i / TUBULAR_SEGMENTS) * Math.PI * 2;
      
      // Angle around the tube cross-section
      // v_param determines position on the bundle circle
      const v_param = TWISTS * t + phase;

      // Parametric Torus formula with variable v
      // x = (R + r * cos(v)) * cos(u)
      // y = r * sin(v)
      // z = (R + r * cos(v)) * sin(u)
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      const cosV = Math.cos(v_param);
      const sinV = Math.sin(v_param);

      const x = (R_RING + R_BUNDLE * cosV) * cosT;
      const y = R_BUNDLE * sinV;
      const z = (R_RING + R_BUNDLE * cosV) * sinT;

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;

    const geometry = new THREE.TubeGeometry(curve, TUBULAR_SEGMENTS, R_STRAND, RADIAL_SEGMENTS, true);
    const mesh = new THREE.Mesh(geometry, goldMat);
    root.add(mesh);
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