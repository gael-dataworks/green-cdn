export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Felt: High roughness, no metalness, vibrant orange.
  const feltMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Seam: Off-white, slightly less rough than felt but not shiny plastic.
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.6,
  });

  // 1. The Ball Body
  // Radius 0.5 to fit nicely in unit cube after normalization.
  const ballGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const ball = new THREE.Mesh(ballGeom, feltMat);
  root.add(ball);

  // 2. The Seam
  // The tennis ball seam is a continuous curve wrapping around the sphere.
  // We approximate it with a wave function around the equator, then rotate.
  const seamPoints = [];
  const segments = 64;
  const radius = 0.51; // Slightly larger than ball radius so seam sits on top
  const amplitude = 0.22; // Height of the lobes

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    // Parametric curve: circle in XZ with Y oscillation
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    // Two lobes per revolution (sin(2t))
    const y = Math.sin(2 * t) * amplitude;
    seamPoints.push(new THREE.Vector3(x, y, z));
  }

  const seamCurve = new THREE.CatmullRomCurve3(seamPoints, true);
  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  const seamGeom = new THREE.TubeGeometry(seamCurve, 64, 0.025, 8, true);
  const seam = new THREE.Mesh(seamGeom, seamMat);

  // Rotate the seam to match the reference orientation
  // Base curve has lobes at Front-Right (Up) and Front-Left (Down).
  // Reference has lobes at Top-Left (Up) and Bottom-Right (Down).
  // Rotation Z by 90 degrees maps Front-Right-Up to Top-Left-Front.
  seam.rotation.z = Math.PI / 2;

  root.add(seam);

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