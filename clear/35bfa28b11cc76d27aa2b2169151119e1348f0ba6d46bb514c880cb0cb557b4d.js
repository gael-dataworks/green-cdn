export default function generate(THREE) {
  const root = new THREE.Group();

  // Silver material: polished metal look.
  // Per rules: metalness <= 0.6 to avoid blackness without env map.
  // Use emissive to brighten the metal surface.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4,
  });

  // --- BODY ---
  // Bulbous base tapering to a narrower neck.
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Center bottom
    new THREE.Vector2(0.28, 0.00), // Base edge
    new THREE.Vector2(0.38, 0.25), // Max belly
    new THREE.Vector2(0.34, 0.55), // Shoulder
    new THREE.Vector2(0.24, 0.68), // Rim
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- LID ---
  // Domed lid sitting on the rim.
  const lidProfile = [
    new THREE.Vector2(0.23, 0.69), // Inner rim (slightly above body rim)
    new THREE.Vector2(0.36, 0.72), // Outer edge
    new THREE.Vector2(0.15, 0.88), // Dome curve
    new THREE.Vector2(0.05, 0.92), // Knob base
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, silverMat);
  root.add(lid);

  // --- KNOB ---
  // Small sphere on top of the lid.
  const knobGeom = new THREE.SphereGeometry(0.055, 32, 32);
  const knob = new THREE.Mesh(knobGeom, silverMat);
  knob.position.y = 0.95;
  root.add(knob);

  // --- SPOUT ---
  // Hollow tubular spout using LatheGeometry with a wall-thickness profile.
  // Profile defines inner and outer walls to create a hollow pipe.
  // Points order: Inner Base -> Inner Tip -> Outer Tip -> Outer Base (closed loop)
  const spoutProfile = [
    new THREE.Vector2(0.075, 0.00), // Inner base
    new THREE.Vector2(0.055, 0.25), // Inner neck
    new THREE.Vector2(0.065, 0.42), // Inner tip
    new THREE.Vector2(0.085, 0.42), // Outer tip
    new THREE.Vector2(0.075, 0.25), // Outer neck
    new THREE.Vector2(0.095, 0.00), // Outer base
  ];
  const spoutGeom = new THREE.LatheGeometry(spoutProfile, 32);
  const spout = new THREE.Mesh(spoutGeom, silverMat);
  
  // Orient spout: Default Lathe is Y-up. We want it pointing along -X (left).
  // Rotate 90 deg around Z to lay it on X axis.
  spout.rotation.z = Math.PI / 2;
  // Position: Attach to left side of body at shoulder height.
  // Body radius at y=0.45 is approx 0.36. Overlap slightly to hide seam.
  spout.position.set(-0.32, 0.45, 0);
  root.add(spout);

  // --- HANDLE ---
  // C-shaped handle using TubeGeometry.
  const handlePoints = [
    new THREE.Vector3(0.34, 0.66, 0.00), // Top attachment (near rim)
    new THREE.Vector3(0.58, 0.60, 0.00), // Top curve out
    new THREE.Vector3(0.62, 0.35, 0.00), // Mid curve
    new THREE.Vector3(0.55, 0.15, 0.00), // Bottom curve in
    new THREE.Vector3(0.34, 0.15, 0.00), // Bottom attachment
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  // Radius 0.045 gives a substantial handle thickness.
  const handleGeom = new THREE.TubeGeometry(handleCurve, 24, 0.045, 12, false);
  const handle = new THREE.Mesh(handleGeom, silverMat);
  root.add(handle);

  // --- HANDLE LUGS ---
  // Small attachment pads where handle meets the body.
  const lugGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
  
  const topLug = new THREE.Mesh(lugGeom, silverMat);
  topLug.rotation.z = Math.PI / 2; // Face outward
  topLug.position.set(0.34, 0.66, 0);
  root.add(topLug);

  const botLug = new THREE.Mesh(lugGeom, silverMat);
  botLug.rotation.z = Math.PI / 2;
  botLug.position.set(0.34, 0.15, 0);
  root.add(botLug);

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