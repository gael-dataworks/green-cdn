export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Blue glossy plastic housing
  const bluePlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0044cc,
    metalness: 0.0,
    roughness: 0.3,
  });

  // Black matte plastic/rubber base and pipe
  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Brass fittings (capped metalness per rules)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Blue Housing (Lathe) ---
  // Profile points [radius, y] from bottom to top
  const housingProfile = [
    new THREE.Vector2(0.00, 0.00),  // Bottom center (meets black base)
    new THREE.Vector2(0.11, 0.00),  // Bottom edge
    new THREE.Vector2(0.11, 0.55),  // Main body cylinder
    new THREE.Vector2(0.12, 0.65),  // Slight belly
    new THREE.Vector2(0.10, 0.85),  // Shoulder taper
    new THREE.Vector2(0.055, 0.95), // Neck
    new THREE.Vector2(0.055, 1.05), // Neck top
    new THREE.Vector2(0.00, 1.05),  // Top center
  ];
  const housingGeom = new THREE.LatheGeometry(housingProfile, 32);
  const blueHousing = new THREE.Mesh(housingGeom, bluePlasticMat);
  root.add(blueHousing);

  // --- Top Brass Nipple ---
  const topNippleGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
  const topNipple = new THREE.Mesh(topNippleGeom, brassMat);
  topNipple.position.set(0, 1.09, 0);
  root.add(topNipple);

  // --- Black Base Assembly ---
  // Collar under the blue housing
  const baseCollarGeom = new THREE.CylinderGeometry(0.12, 0.13, 0.15, 32);
  const baseCollar = new THREE.Mesh(baseCollarGeom, blackPlasticMat);
  baseCollar.position.set(0, -0.075, 0);
  root.add(baseCollar);

  // Mounting Flange (wider disc)
  const baseFlangeGeom = new THREE.CylinderGeometry(0.18, 0.17, 0.04, 32);
  const baseFlange = new THREE.Mesh(baseFlangeGeom, blackPlasticMat);
  baseFlange.position.set(0, -0.17, 0);
  root.add(baseFlange);

  // --- Fuel Pickup Pipe (Tube) ---
  // Path starts under the flange, goes down, curves back, then hooks forward
  const pipePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.20, 0),   // Start under flange
    new THREE.Vector3(0, -0.55, 0),   // Straight down
    new THREE.Vector3(-0.15, -0.75, 0), // Curve back
    new THREE.Vector3(-0.25, -0.85, 0), // Continue back
    new THREE.Vector3(-0.30, -0.90, 0.05), // Hook start
    new THREE.Vector3(-0.32, -0.95, 0.08), // Hook tip
  ]);

  const pipeGeom = new THREE.TubeGeometry(pipePath, 20, 0.018, 12, false);
  const fuelPipe = new THREE.Mesh(pipeGeom, blackPlasticMat);
  root.add(fuelPipe);

  // --- Bottom Brass Fitting ---
  // Small cylinder at the end of the pipe
  const bottomNippleGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.06, 16);
  const bottomNipple = new THREE.Mesh(bottomNippleGeom, brassMat);
  // Position at the end of the path
  const endPoint = pipePath.getPoint(1);
  const tangent = pipePath.getTangent(1);
  bottomNipple.position.copy(endPoint);
  // Align with pipe direction
  bottomNipple.lookAt(endPoint.clone().add(tangent));
  bottomNipple.rotateX(Math.PI / 2); // Cylinder is Y-up by default, lookAt makes it Z-forward, need to correct
  // Simpler approach for small fitting: just place and rotate manually based on visual
  bottomNipple.position.set(-0.32, -0.95, 0.08);
  bottomNipple.rotation.set(Math.PI / 2, 0, -0.2); // Approximate angle to match pipe end
  root.add(bottomNipple);

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