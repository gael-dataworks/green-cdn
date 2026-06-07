export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel: capped metalness, moderate roughness
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Clear glass: physical material with transmission
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // --- Dimensions ---
  const bodyRadius = 0.22;
  const bodyHeight = 0.38;
  const rimThickness = 0.015;
  const rimWidth = 0.04;
  
  // --- 1. Main Metal Body ---
  // Slightly tapered cylinder for the main bucket
  const bodyGeom = new THREE.CylinderGeometry(
    bodyRadius, 
    bodyRadius, 
    bodyHeight, 
    32
  );
  const metalBody = new THREE.Mesh(bodyGeom, steelMat);
  metalBody.position.y = bodyHeight / 2;
  root.add(metalBody);

  // --- 2. Base Rim ---
  // A slightly wider ring at the bottom
  const baseRimGeom = new THREE.TorusGeometry(bodyRadius + 0.02, 0.025, 16, 32);
  const baseRim = new THREE.Mesh(baseRimGeom, steelMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = rimThickness / 2;
  root.add(baseRim);

  // --- 3. Top Rim / Collar ---
  // The ring where the bottle sits
  const topRimGeom = new THREE.TorusGeometry(bodyRadius, 0.03, 16, 32);
  const topRim = new THREE.Mesh(topRimGeom, steelMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = bodyHeight - rimThickness / 2;
  root.add(topRim);

  // Inner top ring to close the hole visually
  const innerTopRimGeom = new THREE.RingGeometry(bodyRadius - 0.03, bodyRadius, 32);
  const innerTopRim = new THREE.Mesh(innerTopRimGeom, steelMat);
  innerTopRim.rotation.x = Math.PI / 2;
  innerTopRim.position.y = bodyHeight;
  root.add(innerTopRim);

  // --- 4. Spout ---
  // Tapered cylinder, rotated to angle up and out
  const spoutLength = 0.14;
  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.045, spoutLength, 16);
  const spout = new THREE.Mesh(spoutGeom, steelMat);
  // Position at top edge of body
  spout.position.set(
    bodyRadius + spoutLength / 2 * Math.cos(Math.PI / 6), 
    bodyHeight - 0.05, 
    0
  );
  // Rotate to point up and out (approx 30 degrees from horizontal)
  spout.rotation.z = -Math.PI / 6; 
  root.add(spout);

  // Spout base reinforcement (small ring where it meets body)
  const spoutBaseGeom = new THREE.TorusGeometry(0.045, 0.015, 8, 16);
  const spoutBase = new THREE.Mesh(spoutBaseGeom, steelMat);
  spoutBase.rotation.y = Math.PI / 2;
  spoutBase.position.copy(spout.position);
  spoutBase.position.x -= spoutLength / 2 * Math.cos(Math.PI / 6);
  root.add(spoutBase);

  // --- 5. Handle ---
  // Curved tube handle on the opposite side
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-bodyRadius, bodyHeight * 0.3, 0),
    new THREE.Vector3(-bodyRadius - 0.12, bodyHeight * 0.3, 0),
    new THREE.Vector3(-bodyRadius - 0.12, bodyHeight * 0.7, 0),
    new THREE.Vector3(-bodyRadius, bodyHeight * 0.7, 0),
  ]);
  
  const handleGeom = new THREE.TubeGeometry(handleCurve, 20, 0.025, 8, false);
  const handle = new THREE.Mesh(handleGeom, steelMat);
  root.add(handle);

  // Handle attachment points (small pads on the body)
  const handlePadGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16);
  const handlePadTop = new THREE.Mesh(handlePadGeom, steelMat);
  handlePadTop.rotation.x = Math.PI / 2;
  handlePadTop.position.set(-bodyRadius, bodyHeight * 0.7, 0);
  root.add(handlePadTop);

  const handlePadBottom = new THREE.Mesh(handlePadGeom, steelMat);
  handlePadBottom.rotation.x = Math.PI / 2;
  handlePadBottom.position.set(-bodyRadius, bodyHeight * 0.3, 0);
  root.add(handlePadBottom);

  // Small hinge detail on bottom pad
  const hingeGeom = new THREE.BoxGeometry(0.02, 0.04, 0.015);
  const hinge = new THREE.Mesh(hingeGeom, steelMat);
  hinge.position.set(-bodyRadius, bodyHeight * 0.3, 0);
  root.add(hinge);

  // --- 6. Glass Bottle ---
  // Lathe profile for the bottle inside
  const bottleProfile = [
    new THREE.Vector2(0.0, 0.0),       // Bottom center
    new THREE.Vector2(0.18, 0.0),      // Bottom edge
    new THREE.Vector2(0.18, 0.15),     // Body side
    new THREE.Vector2(0.14, 0.25),     // Shoulder start
    new THREE.Vector2(0.04, 0.35),     // Neck start
    new THREE.Vector2(0.04, 0.55),     // Neck top
    new THREE.Vector2(0.05, 0.57),     // Lip flare
    new THREE.Vector2(0.0, 0.57),      // Top center
  ];
  
  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const glassBottle = new THREE.Mesh(bottleGeom, glassMat);
  // Position bottle so it sits inside the metal body
  // Body height is 0.38, bottle needs to sit slightly lower or flush
  glassBottle.position.y = 0.05; 
  root.add(glassBottle);

  // --- Normalization ---
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