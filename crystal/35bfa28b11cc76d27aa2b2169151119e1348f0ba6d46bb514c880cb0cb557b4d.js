export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Polished Silver
  // Using metalness 0.6 (max safe limit) and low roughness for shine.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- 1. Body ---
  // Bulbous shape tapering to a neck.
  // Profile points (radius, height) from bottom center to top neck.
  const bodyProfile = new THREE.SplineCurve([
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.28, 0.00),   // Bottom edge (foot start)
    new THREE.Vector2(0.29, 0.04),   // Foot rim
    new THREE.Vector2(0.42, 0.35),   // Max width (belly)
    new THREE.Vector2(0.38, 0.55),   // Shoulder start
    new THREE.Vector2(0.26, 0.72),   // Neck top
    new THREE.Vector2(0.00, 0.72),   // Top center (closed for now, lid sits on rim)
  ]).getSpacedPoints(64);

  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- 2. Base Foot ---
  // Slight ring at the bottom.
  const baseGeom = new THREE.CylinderGeometry(0.29, 0.29, 0.04, 32);
  const base = new THREE.Mesh(baseGeom, silverMat);
  base.position.y = 0.02;
  root.add(base);

  // --- 3. Lid ---
  // Conical dome with a rim.
  const lidProfile = new THREE.SplineCurve([
    new THREE.Vector2(0.26, 0.00),   // Inner rim (sits on neck)
    new THREE.Vector2(0.30, 0.00),   // Outer rim edge
    new THREE.Vector2(0.30, 0.02),   // Rim thickness
    new THREE.Vector2(0.18, 0.18),   // Dome slope
    new THREE.Vector2(0.06, 0.22),   // Top flat part
    new THREE.Vector2(0.00, 0.22),   // Top center
  ]).getSpacedPoints(32);

  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, silverMat);
  lid.position.y = 0.72; // Sit on top of body neck
  root.add(lid);

  // --- 4. Knob ---
  // Small sphere on top of lid.
  const knobGeom = new THREE.SphereGeometry(0.06, 32, 16);
  const knob = new THREE.Mesh(knobGeom, silverMat);
  knob.position.y = 0.72 + 0.22;
  root.add(knob);

  // --- 5. Spout ---
  // Curved tube extending from the side.
  // Path starts at body side, curves up and out.
  const spoutPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.26, 0.55, 0.0),   // Attach point (neck height)
    new THREE.Vector3(0.35, 0.55, 0.0),   // Initial outward
    new THREE.Vector3(0.45, 0.60, 0.0),   // Curve up
    new THREE.Vector3(0.50, 0.65, 0.0),   // Mid curve
    new THREE.Vector3(0.52, 0.70, 0.0),   // Tip base
    new THREE.Vector3(0.54, 0.72, 0.0),   // Tip end
  ]);

  // Taper the spout radius slightly from base to tip
  const spoutGeom = new THREE.TubeGeometry(spoutPath, 20, 0.045, 16, false);
  const spout = new THREE.Mesh(spoutGeom, silverMat);
  // Rotate to face -X (left in image)
  spout.rotation.y = -Math.PI / 2;
  root.add(spout);

  // --- 6. Handle ---
  // Large C-shaped loop on the opposite side.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.28, 0.55, 0.0),  // Top attach
    new THREE.Vector3(0.45, 0.55, 0.0),  // Top curve out
    new THREE.Vector3(0.55, 0.40, 0.0),  // Mid curve
    new THREE.Vector3(0.55, 0.20, 0.0),  // Bottom curve
    new THREE.Vector3(0.45, 0.10, 0.0),  // Bottom attach out
    new THREE.Vector3(0.28, 0.10, 0.0),  // Bottom attach
  ]);

  const handleGeom = new THREE.TubeGeometry(handlePath, 24, 0.035, 16, false);
  const handle = new THREE.Mesh(handleGeom, silverMat);
  // Rotate to face +X (right in image)
  handle.rotation.y = Math.PI / 2;
  root.add(handle);

  // --- 7. Handle Brackets ---
  // Small blocks where handle meets body.
  const bracketGeom = new THREE.BoxGeometry(0.04, 0.06, 0.06);
  
  const topBracket = new THREE.Mesh(bracketGeom, silverMat);
  topBracket.position.set(0.28, 0.55, 0.0);
  topBracket.rotation.y = Math.PI / 2;
  root.add(topBracket);

  const botBracket = new THREE.Mesh(bracketGeom, silverMat);
  botBracket.position.set(0.28, 0.10, 0.0);
  botBracket.rotation.y = Math.PI / 2;
  root.add(botBracket);

  // Normalize to fit unit cube
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