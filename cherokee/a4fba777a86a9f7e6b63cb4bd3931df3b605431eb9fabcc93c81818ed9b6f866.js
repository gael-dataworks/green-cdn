export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Dark reddish-brown wood for handle
  const woodHandleMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Lighter tan wood for the hand
  const woodHandMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Black material for grip and neck joint (leather/rubber/plastic)
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.1,
    roughness: 0.4,
  });

  // --- Handle ---
  // Long cylindrical shaft
  const handleGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.55, 16);
  const handle = new THREE.Mesh(handleGeom, woodHandleMat);
  handle.position.y = 0.0; // Centered vertically for now
  root.add(handle);

  // --- Grip ---
  // Ribbed black section at the bottom. Simulated by a slightly thicker cylinder.
  // To make it look ribbed without complex geometry, we can stack thin toruses or just use a textured cylinder.
  // Simple approach: A black cylinder slightly wider than the handle.
  const gripGeom = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 16);
  const grip = new THREE.Mesh(gripGeom, blackMat);
  grip.position.y = -0.55 / 2 - 0.12 / 2 + 0.02; // Bottom of handle
  root.add(grip);

  // Add subtle ridges to grip using thin black torus rings
  const ridgeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5 });
  const ridgeGeom = new THREE.TorusGeometry(0.029, 0.003, 8, 16);
  for (let i = 0; i < 5; i++) {
    const ridge = new THREE.Mesh(ridgeGeom, ridgeMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = grip.position.y - 0.05 + i * 0.025;
    root.add(ridge);
  }

  // --- Neck / Joint ---
  // Black connector between handle and hand
  const neckGeom = new THREE.CylinderGeometry(0.022, 0.024, 0.06, 16);
  const neck = new THREE.Mesh(neckGeom, blackMat);
  neck.position.y = 0.55 / 2 + 0.06 / 2 - 0.02; // Top of handle
  root.add(neck);

  // --- Hand Base (Palm) ---
  // Flat extruded shape representing the palm and curled fingers
  const palmShape = new THREE.Shape();
  // Start at wrist (bottom left relative to palm center)
  palmShape.moveTo(-0.035, -0.05);
  // Up pinky side
  palmShape.lineTo(-0.035, 0.06);
  // Across knuckles (curved)
  palmShape.quadraticCurveTo(0.0, 0.08, 0.035, 0.06);
  // Down thumb side
  palmShape.lineTo(0.035, -0.05);
  // Across wrist
  palmShape.lineTo(-0.035, -0.05);

  const palmExtrudeSettings = {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  };
  const palmGeom = new THREE.ExtrudeGeometry(palmShape, palmExtrudeSettings);
  const palm = new THREE.Mesh(palmGeom, woodHandMat);
  // Position at top of neck
  palm.position.set(0, 0.55 / 2 + 0.06 + 0.01, 0);
  // Rotate to face somewhat forward and up (scratching angle)
  palm.rotation.x = -0.4; // Tilt back
  palm.rotation.z = 0.1; // Slight tilt
  root.add(palm);

  // --- Index Finger ---
  // Curved tube extending from the palm
  // Path starts at the "index knuckle" area of the palm
  const fingerPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.025, 0.06, 0.0),   // Base at palm
    new THREE.Vector3(0.035, 0.12, 0.02),  // First curve
    new THREE.Vector3(0.040, 0.18, 0.03),  // Mid curve
    new THREE.Vector3(0.035, 0.24, 0.02),  // Tip curve
  ]);

  const fingerGeom = new THREE.TubeGeometry(fingerPath, 20, 0.012, 8, false);
  const indexFinger = new THREE.Mesh(fingerGeom, woodHandMat);
  // Align finger base with palm
  indexFinger.position.copy(palm.position);
  indexFinger.rotation.copy(palm.rotation);
  // The path is defined in local space relative to the finger mesh origin.
  // We need to position the mesh so the start of the path aligns with the palm's index knuckle.
  // The path starts at (0.025, 0.06, 0). The palm's index knuckle is roughly at local (0.035, 0.06, 0) relative to palm center.
  // Since we added the finger as a child of root (to avoid double transform issues with rotation), we calculate world position.
  // Actually, simpler: Add finger to root, calculate its position based on palm's world transform.
  
  // Let's re-attach finger to root and position it manually to match palm's orientation
  root.remove(indexFinger); // Remove from previous add if any (logic check)
  
  // Calculate world position of the finger base
  const palmWorldPos = new THREE.Vector3();
  palm.getWorldPosition(palmWorldPos);
  const palmWorldQuat = new THREE.Quaternion();
  palm.getWorldQuaternion(palmWorldQuat);
  
  // Local offset of finger base on the palm mesh
  const fingerBaseLocal = new THREE.Vector3(0.025, 0.06, 0.012); // Slightly forward on the palm face
  fingerBaseLocal.applyQuaternion(palmWorldQuat);
  fingerBaseLocal.add(palmWorldPos);
  
  // Re-create finger mesh to ensure clean transform
  const indexFingerMesh = new THREE.Mesh(fingerGeom, woodHandMat);
  // TubeGeometry is centered. We need to shift it so the start of the curve is at the origin of the mesh
  // Then we position the mesh at the fingerBaseLocal.
  // Actually, TubeGeometry bounds are based on the curve. 
  // Easier: Create a group for the finger, position the group at the knuckle, rotate the group to match palm, then add the mesh with an offset.
  
  const fingerGroup = new THREE.Group();
  fingerGroup.position.copy(fingerBaseLocal);
  fingerGroup.quaternion.copy(palmWorldQuat);
  
  // The curve starts at (0.025, 0.06, 0). We want this point to be at (0,0,0) of the group.
  // So we translate the geometry or the mesh.
  // Let's just position the mesh such that the curve start aligns.
  // Curve min Y is 0.06. Curve min X is 0.025.
  // We want the point (0.025, 0.06, 0) to be at group origin.
  indexFingerMesh.position.set(-0.025, -0.06, 0);
  
  fingerGroup.add(indexFingerMesh);
  root.add(fingerGroup);

  // --- Fingernail Detail ---
  // Small flattened sphere or box at the tip of the index finger
  const nailGeom = new THREE.SphereGeometry(0.008, 8, 8);
  const nailMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0 });
  const nail = new THREE.Mesh(nailGeom, nailMat);
  // Position at the end of the finger curve
  // End of curve is approx (0.035, 0.24, 0.02) relative to finger mesh origin
  // Finger mesh is offset by (-0.025, -0.06, 0)
  // So local pos on fingerGroup is (0.035-0.025, 0.24-0.06, 0.02) = (0.01, 0.18, 0.02)
  // Plus scale/rotation of group.
  // Let's just place it at the tip in world space roughly.
  nail.position.set(0.01, 0.18, 0.025); // Slightly on top
  nail.scale.set(1, 0.5, 1); // Flatten
  fingerGroup.add(nail);

  // --- Knuckle Lines on Palm ---
  // Shallow grooves to indicate curled fingers
  const grooveMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7 }); // Darker wood
  const grooveGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.04, 8);
  grooveGeom.rotateZ(Math.PI / 2);
  
  for (let i = 0; i < 3; i++) {
    const groove = new THREE.Mesh(grooveGeom, grooveMat);
    // Position on palm surface
    // Palm is rotated. We add grooves as children of palm to follow its rotation.
    // Local coords on palm: x from -0.02 to 0.02, y around 0.02
    groove.position.set(-0.015 + i * 0.015, 0.02, 0.013); // On front face
    groove.rotation.x = Math.PI / 2; // Align with palm face normal roughly
    palm.add(groove);
  }

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