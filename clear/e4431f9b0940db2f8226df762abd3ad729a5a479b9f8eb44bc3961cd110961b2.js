export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished Silver Metal (Blade, Guard, Pommel)
  // Using emissive to ensure brightness in the dim renderer as per handbook.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Darker metal for the fuller (groove) to create contrast
  const fullerMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0x888888,
    emissiveIntensity: 0.1,
  });

  // Faceted Blue Crystal/Glass (Grip)
  const gripMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a237e,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Blade ---
  // Shape for the blade profile (leaf/dagger shape)
  const bladeShape = new THREE.Shape();
  const bladeLength = 1.2;
  const bladeBaseWidth = 0.14;
  
  // Start at tip
  bladeShape.moveTo(0, bladeLength / 2);
  // Curve to base
  bladeShape.bezierCurveTo(
    bladeBaseWidth * 0.2, bladeLength * 0.1, 
    bladeBaseWidth * 0.8, -bladeLength * 0.4, 
    bladeBaseWidth / 2, -bladeLength / 2
  );
  // Base line (tang area)
  bladeShape.lineTo(-bladeBaseWidth / 2, -bladeLength / 2);
  // Curve back to tip
  bladeShape.bezierCurveTo(
    -bladeBaseWidth * 0.8, -bladeLength * 0.4, 
    -bladeBaseWidth * 0.2, bladeLength * 0.1, 
    0, bladeLength / 2
  );

  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 3,
    steps: 1,
  });
  
  // Center the geometry so the pivot is at the guard position
  bladeGeom.translate(0, 0, -bladeLength / 2 + 0.15); // Shift back so guard is near z=0
  
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  // Rotate to lie flat on XZ plane, pointing +Z
  blade.rotation.x = Math.PI / 2;
  root.add(blade);

  // --- Fuller (Groove) ---
  // A thin recessed box to simulate the groove
  const fullerLength = bladeLength * 0.75;
  const fullerWidth = 0.025;
  const fullerDepth = 0.002;
  const fullerGeom = new THREE.BoxGeometry(fullerWidth, fullerDepth, fullerLength);
  const fuller = new THREE.Mesh(fullerGeom, fullerMat);
  fuller.rotation.x = Math.PI / 2;
  fuller.position.z = -bladeLength / 2 + 0.15 + (bladeLength - fullerLength) / 2 + 0.05; // Position along blade
  fuller.position.y = 0.013; // Slightly raised from center to sit on surface
  root.add(fuller);

  // --- Guard (Crossguard) ---
  // Oval torus
  const guardRadiusX = 0.18;
  const guardRadiusY = 0.06;
  const tubeRadius = 0.025;
  // Create an oval by scaling a torus
  const guardGeom = new THREE.TorusGeometry(guardRadiusX, tubeRadius, 16, 32);
  const guard = new THREE.Mesh(guardGeom, metalMat);
  guard.scale.y = guardRadiusY / guardRadiusX; // Flatten to oval
  guard.rotation.x = Math.PI / 2; // Lie flat in XZ plane
  guard.position.z = 0.1; // Sit at the base of the blade
  root.add(guard);

  // --- Grip (Handle) ---
  // Faceted cylinder (low radial segments)
  const gripLength = 0.35;
  const gripRadius = 0.045;
  const gripGeom = new THREE.CylinderGeometry(gripRadius, gripRadius, gripLength, 8); // 8 segments = octagonal
  const grip = new THREE.Mesh(gripGeom, gripMat);
  grip.rotation.x = Math.PI / 2; // Align with Z axis
  grip.position.z = 0.1 + gripLength / 2 + 0.02; // Start after guard
  root.add(grip);

  // --- Pommel ---
  // Rounded cap at the end
  const pommelRadius = 0.07;
  const pommelGeom = new THREE.SphereGeometry(pommelRadius, 16, 16);
  const pommel = new THREE.Mesh(pommelGeom, metalMat);
  pommel.scale.z = 0.6; // Flatten slightly
  pommel.position.z = 0.1 + gripLength + 0.02; // End of grip
  root.add(pommel);

  // --- Etching (Small detail near guard) ---
  // A tiny decorative shape on the blade
  const etchShape = new THREE.Shape();
  etchShape.moveTo(0, 0.03);
  etchShape.lineTo(0.015, -0.015);
  etchShape.lineTo(-0.015, -0.015);
  etchShape.closePath();
  
  const etchGeom = new THREE.ExtrudeGeometry(etchShape, { depth: 0.001, bevelEnabled: false });
  const etch = new THREE.Mesh(etchGeom, fullerMat);
  etch.rotation.x = Math.PI / 2;
  etch.position.z = -bladeLength / 2 + 0.15 + 0.25; // Near the guard
  etch.position.y = 0.014;
  root.add(etch);

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