export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Polished Rose Gold / Copper
  // Metalness capped at 0.6 per safety rules. Color carries the rose/copper shade.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xB87333,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Ring dimensions
  const RING_RADIUS = 0.35;
  const STRAND_THICKNESS = 0.038;
  const WEAVE_AMPLITUDE = 0.055;
  const NUM_STRANDS = 4;
  const TWISTS = 8; // Number of times the strands wind around the ring
  const TUBULAR_SEGMENTS = 200;
  const RADIAL_SEGMENTS = 16;

  // Create 4 interwoven strands
  for (let i = 0; i < NUM_STRANDS; i++) {
    const points = [];
    const phase = (i / NUM_STRANDS) * Math.PI * 2;

    for (let t = 0; t <= Math.PI * 2; t += (Math.PI * 2) / TUBULAR_SEGMENTS) {
      // Parametric equation for a strand winding around a torus
      // Angle around the main ring
      const u = t;
      // Angle around the tube cross-section (the weave)
      const v = TWISTS * t + phase;

      // Standard torus coordinates, but modulated by the weave
      // We want the strand to oscillate radially and vertically
      const r = RING_RADIUS + WEAVE_AMPLITUDE * Math.cos(v);
      
      const x = r * Math.cos(u);
      const y = r * Math.sin(u);
      const z = WEAVE_AMPLITUDE * Math.sin(v);

      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;

    const geometry = new THREE.TubeGeometry(
      curve,
      TUBULAR_SEGMENTS,
      STRAND_THICKNESS,
      RADIAL_SEGMENTS,
      true
    );

    const mesh = new THREE.Mesh(geometry, goldMat);
    
    // Flatten the tube slightly to mimic pressed metal links
    mesh.scale.set(1, 0.7, 1);
    
    root.add(mesh);
  }

  // Orient the ring to lie flat on the XZ plane (like a bracelet on a table)
  // The math above created it in the XY plane (like a wheel).
  root.rotation.x = Math.PI / 2;

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