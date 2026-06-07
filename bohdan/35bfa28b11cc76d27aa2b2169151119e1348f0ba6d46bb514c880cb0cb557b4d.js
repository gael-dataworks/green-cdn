export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver: High metalness (capped at 0.6 for renderer), low roughness.
  // Emissive is used to simulate bright reflection in a dim environment.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4,
  });

  // Dark interior material for spout and lid underside
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.1,
    roughness: 0.8,
  });

  // --- Body ---
  // Bulbous shape with a foot ring.
  // Profile points (radius, height)
  const bodyProfile = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.16, 0.00), // Bottom edge
    new THREE.Vector2(0.16, 0.04), // Foot start
    new THREE.Vector2(0.23, 0.35), // Belly max
    new THREE.Vector2(0.19, 0.58), // Shoulder
    new THREE.Vector2(0.17, 0.62), // Rim
  ];
  const bodyGeom = new THREE.LatheGeometry(bodyProfile, 32);
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- Lid ---
  // Domed lid with a rim that overlaps the body slightly.
  const lidProfile = [
    new THREE.Vector2(0.17, 0.62), // Inner rim (sits on body)
    new THREE.Vector2(0.21, 0.63), // Outer rim overhang
    new THREE.Vector2(0.12, 0.78), // Dome curve
    new THREE.Vector2(0.05, 0.82), // Knob base
    new THREE.Vector2(0.00, 0.82), // Top center
  ];
  const lidGeom = new THREE.LatheGeometry(lidProfile, 32);
  const lid = new THREE.Mesh(lidGeom, silverMat);
  // Lid sits slightly above body rim to allow opening animation conceptually, 
  // but visually it rests on top.
  lid.position.y = 0.0; 
  root.add(lid);

  // --- Knob ---
  // Small sphere on top of lid.
  const knobGeom = new THREE.SphereGeometry(0.05, 16, 16);
  const knob = new THREE.Mesh(knobGeom, silverMat);
  knob.position.y = 0.82;
  root.add(knob);

  // --- Spout ---
  // Tapered tube. Constructed using LatheGeometry rotated 90 degrees.
  // Profile in local XY space (will be rotated to point along -Z).
  // Outer wall: Tip radius -> Base radius
  // Inner wall: Base inner radius -> Tip inner radius
  const spoutLength = 0.55;
  const tipRadius = 0.035;
  const baseRadius = 0.09;
  const wallThickness = 0.015;

  const spoutProfile = [
    // Outer wall from tip (x=0) to base (x=spoutLength)
    new THREE.Vector2(0.00, tipRadius), 
    new THREE.Vector2(spoutLength, baseRadius),
    // Inner wall from base to tip
    new THREE.Vector2(spoutLength, baseRadius - wallThickness),
    new THREE.Vector2(0.00, tipRadius - wallThickness),
    new THREE.Vector2(0.00, tipRadius), // Close loop
  ];

  const spoutGeom = new THREE.LatheGeometry(spoutProfile, 24);
  const spout = new THREE.Mesh(spoutGeom, silverMat);
  
  // Position spout: 
  // Lathe rotates around Y. We want the spout axis to be Z (pointing -Z).
  // So we rotate the mesh -90 deg around X.
  spout.rotation.x = -Math.PI / 2;
  
  // Position relative to body center.
  // Base of spout is at body shoulder height (~0.45) and radius (~0.20).
  // The spout geometry starts at x=0 (tip) and goes to x=length (base).
  // We need the base (local x=spoutLength) to be at the body surface.
  // Body surface is at z = -0.20 (approx).
  // So mesh position z = -0.20 - spoutLength.
  spout.position.set(0, 0.45, -0.20 - spoutLength);
  
  // Add dark interior to the spout tip for depth
  const spoutTipGeom = new THREE.CircleGeometry(tipRadius - wallThickness, 16);
  const spoutTip = new THREE.Mesh(spoutTipGeom, darkMat);
  spoutTip.rotation.y = Math.PI / 2; // Face outward (-Z)
  spoutTip.position.set(0, 0, -0.01); // Slightly in front of tip
  spout.add(spoutTip);

  root.add(spout);

  // --- Handle ---
  // C-shaped loop. Using TorusGeometry with an arc.
  // Torus lies in XY plane. We need it in YZ plane (vertical loop on side).
  // Rotate X by 90 deg.
  const handleRadius = 0.14;
  const handleTube = 0.025;
  const handleArc = Math.PI * 1.6; // ~288 degrees, leaves a gap
  
  const handleGeom = new THREE.TorusGeometry(handleRadius, handleTube, 16, 32, handleArc);
  const handle = new THREE.Mesh(handleGeom, silverMat);
  
  // Orientation:
  // Default Torus is in XY. Rotate X 90 -> YZ plane.
  handle.rotation.x = Math.PI / 2;
  
  // Position:
  // Center of the torus arc needs to be on the +Z side of the body.
  // Body radius at handle height (~0.4) is approx 0.22.
  // Handle center should be at z = 0.22 + handleRadius.
  handle.position.set(0, 0.40, 0.22 + handleRadius);
  
  // Rotate around Z to align the gap vertically (attachments top and bottom)
  // The Torus arc starts at angle 0. With rotation.x=90, angle 0 is at +Y.
  // We want the gap at the top and bottom? 
  // Actually, standard teapot handles attach at shoulder and hip.
  // Let's rotate the torus so the gap is at the "back" (away from body) or "front"?
  // The arc covers most of the circle. The gap is where the handle doesn't exist.
  // We want the handle loop to face the body.
  // If we rotate Y by 180, the opening faces -Z (towards body).
  handle.rotation.y = Math.PI; 

  root.add(handle);

  // --- Handle Attachments ---
  // Small brackets connecting handle to body.
  const attachGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16);
  
  // Top attachment
  const attachTop = new THREE.Mesh(attachGeom, silverMat);
  attachTop.rotation.x = Math.PI / 2; // Horizontal cylinder
  attachTop.position.set(0, 0.60, 0.22); // On body shoulder
  root.add(attachTop);

  // Bottom attachment
  const attachBottom = new THREE.Mesh(attachGeom, silverMat);
  attachBottom.rotation.x = Math.PI / 2;
  attachBottom.position.set(0, 0.20, 0.22); // On body hip
  root.add(attachBottom);

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