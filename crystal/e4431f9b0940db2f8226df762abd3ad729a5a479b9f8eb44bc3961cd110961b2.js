export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished Silver/Chrome (Blade, Guard, Pommel)
  // Rule: metalness <= 0.7 for no-env maps. Use light gray color for shine.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Faceted Blue Crystal/Glass (Grip)
  // Rule: transmission for glass, low roughness for polish.
  const blueGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x2244cc,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    transparent: true,
    ior: 1.5,
    side: THREE.DoubleSide,
  });

  // --- Blade ---
  // Shape for the blade profile (side view)
  const bladeShape = new THREE.Shape();
  const bladeLength = 1.2;
  const bladeBaseWidth = 0.18;
  const bladeTipWidth = 0.0;
  
  // Draw blade outline (centered on X, extending along Z)
  // We will extrude this along Y to give it thickness, then rotate.
  // Actually, easier: Draw in XY, extrude along Z (depth).
  bladeShape.moveTo(0, -bladeBaseWidth / 2);
  bladeShape.lineTo(bladeLength, 0); // Tip
  bladeShape.lineTo(0, bladeBaseWidth / 2);
  bladeShape.lineTo(-0.1, bladeBaseWidth / 2); // Ricasso shoulder
  bladeShape.lineTo(-0.1, -bladeBaseWidth / 2);
  bladeShape.closePath();

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.04, // Thickness of the blade
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2,
    steps: 1,
  });

  // Center the geometry so the handle attaches at the back
  bladeGeom.translate(-0.1, 0, -0.02); 

  const blade = new THREE.Mesh(bladeGeom, silverMat);
  // Rotate to lie flat in XZ plane (extrusion was along Z, we want blade along Z)
  // Actually, the shape was drawn in XY. Extrude pushes to Z.
  // We want the flat faces to be Top/Bottom (Y axis).
  // So we rotate X by 90 deg.
  blade.rotation.x = Math.PI / 2;
  root.add(blade);

  // --- Guard (Crossguard) ---
  // Oval ring shape. TorusGeometry works well.
  // Radius ~0.12, Tube ~0.025
  const guardGeom = new THREE.TorusGeometry(0.13, 0.025, 16, 32);
  const guard = new THREE.Mesh(guardGeom, silverMat);
  // Position at the base of the blade (Z=0 roughly)
  guard.position.set(0, 0, 0);
  // Torus is in XY plane. We need it perpendicular to blade (which is in XZ).
  // So rotate Torus 90 deg around X? 
  // Blade is flat in XZ. Guard should wrap around the grip (Y axis cylinder).
  // So Guard should be in XZ plane? No, guard is usually perpendicular to blade flat.
  // If blade flat is XZ (facing Y), guard is a ring in XZ plane? 
  // Wait, standard sword: Blade flat is vertical (XY) or horizontal (XZ)?
  // Let's assume Blade lies in XZ plane (flat like a table).
  // Then Guard stands up in XY plane? Or lies flat in XZ?
  // Usually guard is perpendicular to the blade's cutting edge.
  // If blade is flat XZ, guard is a ring in XY plane (vertical).
  // Let's align: Blade is in XZ. Guard is Torus (default XY). 
  // Rotate Guard Z by 90 -> XZ plane? No.
  // Default Torus: Ring in XY.
  // We want Ring in XZ (horizontal) to match blade flat? 
  // Looking at reference: The guard is an oval ring perpendicular to the handle axis.
  // Handle axis is Z (roughly). So Guard is in XY plane.
  // Blade is also roughly in XY plane? No, blade is flat.
  // Let's orient the whole sword along Z axis.
  // Handle is cylinder along Z.
  // Guard is a ring in XY plane (perpendicular to Z).
  // Blade is a flat shape in XZ plane (or YZ). Let's say XZ.
  // So Blade needs rotation.
  
  // Reset mental model:
  // 1. Handle: Cylinder along Z axis.
  // 2. Guard: Torus in XY plane (default). Perfect.
  // 3. Blade: Flat plate in XZ plane.
  
  // Adjust Blade rotation:
  // ExtrudeGeometry creates mesh facing +Z.
  // We want it in XZ plane. So rotate X by 90.
  // blade.rotation.x = Math.PI / 2; (Done above).
  // This puts the flat face facing +Y.
  // The guard (Torus default XY) stands vertically in Y.
  // This matches the reference (guard is vertical relative to flat blade).
  root.add(guard);

  // --- Grip (Handle) ---
  // Faceted cylinder.
  const gripLength = 0.35;
  const gripRadius = 0.05;
  // CylinderGeometry is along Y by default. Rotate to Z.
  const gripGeom = new THREE.CylinderGeometry(gripRadius, gripRadius * 0.9, gripLength, 8);
  const grip = new THREE.Mesh(gripGeom, blueGlassMat);
  grip.rotation.x = Math.PI / 2;
  // Position: Starts behind guard (negative Z)
  grip.position.set(0, 0, -gripLength / 2);
  root.add(grip);

  // --- Pommel ---
  // Rounded knob at the end of the grip.
  const pommelGeom = new THREE.SphereGeometry(0.07, 32, 16);
  const pommel = new THREE.Mesh(pommelGeom, silverMat);
  // Scale to be slightly oblate
  pommel.scale.set(1, 1.2, 1);
  pommel.position.set(0, 0, -gripLength - 0.02);
  root.add(pommel);

  // --- Blade Detail (Fuller/Groove) ---
  // Simulate the central groove with a thin, slightly darker/recessed box
  const fullerGeom = new THREE.BoxGeometry(bladeLength * 0.7, 0.015, 0.06);
  const fuller = new THREE.Mesh(fullerGeom, silverMat);
  // Position on top of blade surface
  // Blade is at Y=0 (after rotation). Thickness is 0.04. Top is Y=0.02.
  fuller.position.set(bladeLength * 0.35, 0.025, 0);
  root.add(fuller);

  // --- Maker's Mark (Small detail near guard) ---
  // Tiny engraved-looking box
  const markGeom = new THREE.BoxGeometry(0.04, 0.01, 0.04);
  const markMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  const mark = new THREE.Mesh(markGeom, markMat);
  mark.position.set(0.15, 0.025, 0);
  root.add(mark);

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