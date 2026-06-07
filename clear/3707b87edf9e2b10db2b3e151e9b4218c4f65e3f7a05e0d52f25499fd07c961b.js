export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed aluminum/steel for the body
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x99aabb,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Darker metal for the ridge/groove details
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x556677,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Glowing blue tip (simulating arc or LED)
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x0044ff,
    emissiveIntensity: 3.0,
    toneMapped: false,
  });

  // --- Geometries & Meshes ---

  // 1. Nozzle (Cup) - Conical frustum at the front
  // Tapers from base radius to tip radius
  const nozzleGeom = new THREE.CylinderGeometry(0.045, 0.09, 0.28, 32);
  const nozzle = new THREE.Mesh(nozzleGeom, metalMat);
  // Cylinder default is Y-up, we want Z-forward
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = 0.44; // Place at front
  root.add(nozzle);

  // 2. Collet Body (Main Cylinder)
  // Slightly wider than nozzle base, has a grip section
  const colletBodyGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.35, 32);
  const colletBody = new THREE.Mesh(colletBodyGeom, metalMat);
  colletBody.rotation.x = Math.PI / 2;
  colletBody.position.z = 0.125; // Behind nozzle
  root.add(colletBody);

  // 2b. Grip Ridge (Detail on collet body)
  // A thin torus or cylinder ring to separate sections
  const ridgeGeom = new THREE.TorusGeometry(0.092, 0.015, 16, 32);
  const ridge = new THREE.Mesh(ridgeGeom, darkMetalMat);
  ridge.rotation.y = Math.PI / 2; // Align with cylinder axis (Z)
  ridge.position.z = 0.05; // Near the back of the collet body
  root.add(ridge);

  // 3. Torch Head (The angled flat plate)
  // This is a machined block. We use ExtrudeGeometry for the profile.
  // Profile in XZ plane (since we extrude along Y for thickness)
  const headShape = new THREE.Shape();
  // Start at bottom rear
  headShape.moveTo(-0.15, -0.25); 
  // Bottom front (connects to cylinder base area)
  headShape.lineTo(0.15, -0.15);
  // Top front (upper edge of head)
  headShape.lineTo(0.15, 0.05);
  // Top rear (slopes down)
  headShape.lineTo(-0.25, 0.15);
  // Close
  headShape.lineTo(-0.15, -0.25);

  const headExtrudeSettings = {
    steps: 1,
    depth: 0.12, // Thickness of the plate
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 2
  };

  const headGeom = new THREE.ExtrudeGeometry(headShape, headExtrudeSettings);
  const torchHead = new THREE.Mesh(headGeom, metalMat);
  // Extrude is Z-up by default, we want Y-up thickness, and the shape lies in XZ
  // Actually, ExtrudeGeometry extrudes along Z. We want the shape in XY plane extruded to Z?
  // No, let's keep it simple. Shape in XY, extrude Z. Then rotate.
  // Let's redefine: Shape in XY plane.
  const headShape2 = new THREE.Shape();
  headShape2.moveTo(-0.15, -0.20); // Rear Bottom
  headShape2.lineTo(0.10, -0.10);  // Front Bottom
  headShape2.lineTo(0.10, 0.10);   // Front Top
  headShape2.lineTo(-0.25, 0.20);  // Rear Top
  headShape2.lineTo(-0.15, -0.20);

  const headGeom2 = new THREE.ExtrudeGeometry(headShape2, headExtrudeSettings);
  const torchHead2 = new THREE.Mesh(headGeom2, metalMat);
  // Now the mesh is flat in XY, thickness in Z.
  // We want it to wrap around the cylinder base.
  // The cylinder is along Z. The head should be centered on Z axis but angled.
  // Let's position it behind the collet body.
  torchHead2.position.z = -0.15;
  // The extrusion is along Z. We want the "face" to be visible from side?
  // The image shows the flat face.
  // Let's rotate so the extrusion direction (Z) becomes Y (thickness up/down relative to ground?)
  // No, thickness is vertical in the image? No, thickness is horizontal (left-right).
  // So Extrude Z -> Rotate X 90 -> Thickness is Y.
  // Let's try: Shape in XZ plane, Extrude Y.
  
  // Re-doing Head with simpler Box composition for stability if Extrude is tricky with orientation
  // Actually, let's use a Box and rotate it to match the angle.
  const headBoxGeom = new THREE.BoxGeometry(0.12, 0.35, 0.50); // Thickness, Height, Length
  const torchHeadBox = new THREE.Mesh(headBoxGeom, metalMat);
  // Rotate to match the downward angle of the torch handle head
  torchHeadBox.rotation.x = -0.3; // Tilt down
  torchHeadBox.position.z = -0.10; // Behind collet
  torchHeadBox.position.y = -0.05; // Slightly low
  root.add(torchHeadBox);

  // Add a "collar" where the head meets the cylinder
  const collarGeom = new THREE.CylinderGeometry(0.10, 0.10, 0.05, 32);
  const collar = new THREE.Mesh(collarGeom, metalMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.z = -0.05;
  root.add(collar);

  // 4. Glowing Tip
  // Small sphere at the very front of the nozzle
  const tipGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const tip = new THREE.Mesh(tipGeom, glowMat);
  tip.position.z = 0.58; // Tip of the nozzle
  root.add(tip);

  // 5. Inner Glow (Optional, to make the tip look like a hole with light)
  const innerGlowGeom = new THREE.CylinderGeometry(0.01, 0.02, 0.05, 16);
  const innerGlow = new THREE.Mesh(innerGlowGeom, glowMat);
  innerGlow.rotation.x = Math.PI / 2;
  innerGlow.position.z = 0.56;
  root.add(innerGlow);

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