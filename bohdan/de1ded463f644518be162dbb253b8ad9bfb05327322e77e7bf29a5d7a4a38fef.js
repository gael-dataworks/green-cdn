export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel: light grey, moderate metalness, low-mid roughness
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Clear glass: high transmission, low roughness
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
  });

  // --- Bucket Body ---
  // Main cylindrical container
  const bucket_body_geom = new THREE.CylinderGeometry(0.24, 0.24, 0.50, 32);
  const bucket_body = new THREE.Mesh(bucket_body_geom, steelMat);
  root.add(bucket_body);

  // --- Bucket Rim ---
  // Rolled edge at the top
  const bucket_rim_geom = new THREE.TorusGeometry(0.245, 0.018, 16, 32);
  const bucket_rim = new THREE.Mesh(bucket_rim_geom, steelMat);
  bucket_rim.rotation.x = Math.PI / 2;
  bucket_rim.position.y = 0.25;
  root.add(bucket_rim);

  // --- Bucket Base ---
  // Rolled edge at the bottom
  const bucket_base_geom = new THREE.TorusGeometry(0.245, 0.018, 16, 32);
  const bucket_base = new THREE.Mesh(bucket_base_geom, steelMat);
  bucket_base.rotation.x = Math.PI / 2;
  bucket_base.position.y = -0.25;
  root.add(bucket_base);

  // --- Spout ---
  // Tapered cylinder acting as a pour spout on the left side
  const spout_geom = new THREE.CylinderGeometry(0.035, 0.055, 0.16, 16);
  const spout = new THREE.Mesh(spout_geom, steelMat);
  // Position near top left edge
  spout.position.set(-0.24, 0.21, 0);
  // Rotate to point up and out (-X direction). 
  // Default cylinder is Y-up. Rotate Z by 135 degrees (3PI/4) to point Left-Up.
  spout.rotation.z = Math.PI * 0.75;
  root.add(spout);

  // --- Handle ---
  // Curved handle on the right side. Using TubeGeometry scaled to be flat.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.24, 0.22, 0),   // Start near top rim
    new THREE.Vector3(0.36, 0.15, 0),   // Curve out
    new THREE.Vector3(0.36, -0.15, 0),  // Go down
    new THREE.Vector3(0.24, -0.20, 0)   // Connect near base
  ]);
  const handle_geom = new THREE.TubeGeometry(handlePath, 24, 0.025, 8, false);
  const handle = new THREE.Mesh(handle_geom, steelMat);
  // Scale Z to flatten the tube into a bar shape
  handle.scale.set(1, 1, 0.5);
  root.add(handle);

  // --- Hinge / Latch Detail ---
  // Small rectangular detail on the front-right side
  const hinge_geom = new THREE.BoxGeometry(0.02, 0.05, 0.04);
  const hinge = new THREE.Mesh(hinge_geom, steelMat);
  hinge.position.set(0.24, 0.0, 0.18);
  root.add(hinge);

  // --- Wine Bottle ---
  // Glass bottle sitting inside the bucket
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.14, 0.00), // Bottom edge
    new THREE.Vector2(0.14, 0.35), // Body up to shoulder
    new THREE.Vector2(0.12, 0.42), // Shoulder slope
    new THREE.Vector2(0.06, 0.48), // Neck start
    new THREE.Vector2(0.06, 0.72), // Neck up
    new THREE.Vector2(0.07, 0.76), // Lip flare
    new THREE.Vector2(0.00, 0.78)  // Top center
  ];
  const bottle_geom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottle_geom, glassMat);
  // Position bottle so it sits inside the bucket
  // Bucket bottom is at y = -0.25. Bottle bottom should be slightly above that.
  bottle.position.y = -0.22;
  root.add(bottle);

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