export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Translucent glossy blue plastic
  // Using MeshPhysicalMaterial for the jelly-like transmission effect seen in the reference.
  const bluePlasticMat = new THREE.MeshPhysicalMaterial({
    color: 0x0099ff,
    metalness: 0.0,
    roughness: 0.15,
    transmission: 0.4,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // Slightly darker blue for seams/details to make them visible
  const seamMat = new THREE.MeshStandardMaterial({
    color: 0x0066aa,
    metalness: 0.0,
    roughness: 0.4,
  });

  const radius = 0.5;

  // 1. Main Sphere Body
  const sphereGeom = new THREE.SphereGeometry(radius, 32, 32);
  const sphere = new THREE.Mesh(sphereGeom, bluePlasticMat);
  root.add(sphere);

  // 2. Equator Seam (The horizontal line dividing the two halves)
  // Torus lies in XY plane by default, rotate X by 90 deg to lie in XZ (equator)
  const equatorGeom = new THREE.TorusGeometry(radius + 0.002, 0.004, 8, 64);
  const equator = new THREE.Mesh(equatorGeom, seamMat);
  equator.rotation.x = Math.PI / 2;
  root.add(equator);

  // 3. Vertical Seams (Segmentation lines like a beach ball)
  // We create 3 vertical arcs 120 degrees apart.
  const verticalSeamRadius = radius + 0.002;
  const verticalSeamThickness = 0.003;
  
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    
    // Create a curve for the vertical seam (half circle from bottom to top)
    const curve = new THREE.EllipseCurve(
      0, 0,            // ax, aY (center)
      verticalSeamRadius, verticalSeamRadius, // xRadius, yRadius
      0, Math.PI,      // startAngle, endAngle (half circle)
      false,           // clockwise
      0                // rotation
    );

    // Get points from the curve (in XY plane)
    const points = curve.getPoints(32);
    // Convert to Vector3 (z=0 initially)
    const pathPoints = points.map(p => new THREE.Vector3(p.x, p.y, 0));
    
    // Create the tube
    const path = new THREE.CatmullRomCurve3(pathPoints);
    const seamGeom = new THREE.TubeGeometry(path, 32, verticalSeamThickness, 8, false);
    const seam = new THREE.Mesh(seamGeom, seamMat);
    
    // Rotate the seam around Y axis to position it
    seam.rotation.y = angle;
    root.add(seam);
  }

  // 4. Top Cap / Hole Detail
  // A small flat cylinder at the north pole to represent the mold injection point or hanging hole
  const topCapGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.015, 16);
  const topCap = new THREE.Mesh(topCapGeom, seamMat);
  topCap.position.y = radius + 0.005; // Sit slightly on top
  root.add(topCap);

  // Small hole in the center of the cap
  const holeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.02, 16);
  const hole = new THREE.Mesh(holeGeom, seamMat);
  hole.position.y = radius + 0.005;
  root.add(hole);

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