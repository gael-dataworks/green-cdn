export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const blueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x0055cc,
    metalness: 0.1,
    roughness: 0.25,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  const blackPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.0,
    roughness: 0.6,
  });

  // 1. Main Pump Body (Blue)
  // Using LatheGeometry for the rounded capsule-like shape with a neck
  const bodyProfile = [
    new THREE.Vector2(0.0, 0.0),       // Bottom center (where it meets base)
    new THREE.Vector2(0.11, 0.0),      // Bottom edge
    new THREE.Vector2(0.11, 0.45),     // Main cylinder wall
    new THREE.Vector2(0.10, 0.50),     // Slight neck
    new THREE.Vector2(0.11, 0.55),     // Shoulder before cap
    new THREE.Vector2(0.11, 0.65),     // Start of dome
    new THREE.Vector2(0.08, 0.72),     // Dome curve
    new THREE.Vector2(0.0, 0.75),      // Top center
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const pump_body = new THREE.Mesh(bodyGeom, blueBodyMat);
  // Shift up so base is at y=0
  pump_body.position.y = 0.15; 
  root.add(pump_body);

  // 2. Top Connector Pin (Brass)
  const pinGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 16);
  const top_connector = new THREE.Mesh(pinGeom, brassMat);
  top_connector.position.set(0, 0.15 + 0.75 + 0.04, 0);
  root.add(top_connector);

  // 3. Base Flange (Black)
  const baseGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 32);
  const base_flange = new THREE.Mesh(baseGeom, blackPlasticMat);
  base_flange.position.set(0, 0.15 - 0.04, 0);
  root.add(base_flange);

  // 4. Pickup Tube (Black Curved Tube)
  // Path: Down from base, then curve out
  const tubePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.15 - 0.08, 0),    // Start at bottom of base
    new THREE.Vector3(0, -0.35, 0),          // Straight down
    new THREE.Vector3(0.05, -0.55, 0),       // Curve start
    new THREE.Vector3(0.15, -0.65, 0),       // Curve out
    new THREE.Vector3(0.15, -0.75, 0),       // End of tube
  ]);
  
  const tubeGeom = new THREE.TubeGeometry(tubePath, 20, 0.028, 12, false);
  const pickup_tube = new THREE.Mesh(tubeGeom, blackPlasticMat);
  root.add(pickup_tube);

  // 5. Intake Fitting/Screen Housing (Brass tip)
  const tipGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 16);
  const intake_fitting = new THREE.Mesh(tipGeom, brassMat);
  // Position at end of tube path, rotated to align with tube end tangent
  // The path ends at (0.15, -0.75, 0) going roughly vertical/down
  intake_fitting.position.set(0.15, -0.75 - 0.03, 0);
  // Rotate to match the vertical orientation of the tube end
  intake_fitting.rotation.x = Math.PI / 2; 
  root.add(intake_fitting);

  // Helper: Fit to unit cube
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