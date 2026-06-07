export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Polished Silver
  // Using the "Metal Brightness via Emissive" rule to ensure it renders bright
  // and not black in the environment-less renderer.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd6dadf,
    metalness: 0.25,
    roughness: 0.32,
    emissive: 0xd6dadf,
    emissiveIntensity: 0.40,
  });

  // --- 1. Body (Lathe) ---
  // Profile points (radius, height) from bottom to top
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.12, 0.00), // Bottom edge
    new THREE.Vector2(0.12, 0.02), // Base foot vertical
    new THREE.Vector2(0.33, 0.18), // Widest part (belly)
    new THREE.Vector2(0.31, 0.45), // Shoulder start
    new THREE.Vector2(0.24, 0.58), // Neck
    new THREE.Vector2(0.25, 0.60), // Rim lip
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- 2. Base Ring ---
  // A small torus or flattened cylinder at the bottom to ground it
  const baseGeom = new THREE.TorusGeometry(0.12, 0.015, 16, 32);
  const baseRing = new THREE.Mesh(baseGeom, silverMat);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.015;
  root.add(baseRing);

  // --- 3. Lid (Lathe) ---
  // Sits on top of the body rim (approx y=0.60)
  const lidProfile = [
    new THREE.Vector2(0.24, 0.60), // Inner edge sitting on rim
    new THREE.Vector2(0.29, 0.61), // Overhang edge
    new THREE.Vector2(0.26, 0.68), // Dome curve
    new THREE.Vector2(0.06, 0.71), // Top flat for knob
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, silverMat);
  root.add(lid);

  // --- 4. Knob (Sphere) ---
  const knobGeom = new THREE.SphereGeometry(0.045, 24, 24);
  const knob = new THREE.Mesh(knobGeom, silverMat);
  knob.position.y = 0.73;
  root.add(knob);

  // --- 5. Spout (Tube) ---
  // Curves from the body side (+X) upwards and outwards
  const spoutPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.32, 0.35, 0.00), // Connection to body
    new THREE.Vector3(0.42, 0.40, 0.00), // Initial curve out
    new THREE.Vector3(0.50, 0.50, 0.00), // Mid curve
    new THREE.Vector3(0.55, 0.58, 0.00), // Tip
  ]);
  const spoutGeom = new THREE.TubeGeometry(spoutPath, 20, 0.045, 16, false);
  const spout = new THREE.Mesh(spoutGeom, silverMat);
  root.add(spout);

  // Spout connection patch (blends spout into body)
  const spoutPatchGeom = new THREE.SphereGeometry(0.055, 24, 24);
  const spoutPatch = new THREE.Mesh(spoutPatchGeom, silverMat);
  spoutPatch.position.set(0.32, 0.35, 0.00);
  spoutPatch.scale.set(1.2, 1.4, 1.0); // Flatten slightly to blend
  root.add(spoutPatch);

  // --- 6. Handle (Tube) ---
  // Large arch on the opposite side (-X)
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.26, 0.60, 0.00), // Top connection
    new THREE.Vector3(-0.45, 0.55, 0.00), // Top arch
    new THREE.Vector3(-0.50, 0.35, 0.00), // Mid arch
    new THREE.Vector3(-0.45, 0.15, 0.00), // Bottom arch
    new THREE.Vector3(-0.26, 0.12, 0.00), // Bottom connection
  ]);
  const handleGeom = new THREE.TubeGeometry(handlePath, 30, 0.025, 16, false);
  const handle = new THREE.Mesh(handleGeom, silverMat);
  root.add(handle);

  // --- 7. Handle Lugs (Mounting Brackets) ---
  // Small rectangular/cylindrical pieces where handle meets body
  const lugGeom = new THREE.BoxGeometry(0.04, 0.06, 0.03);
  
  const lugTop = new THREE.Mesh(lugGeom, silverMat);
  lugTop.position.set(-0.26, 0.60, 0.00);
  lugTop.rotation.z = Math.PI / 6; // Angle to match handle start
  root.add(lugTop);

  const lugBottom = new THREE.Mesh(lugGeom, silverMat);
  lugBottom.position.set(-0.26, 0.12, 0.00);
  lugBottom.rotation.z = -Math.PI / 8; // Angle to match handle end
  root.add(lugBottom);

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