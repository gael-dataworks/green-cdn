export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold metal for the holder
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Dark brown for the rachis (shaft)
  const rachisMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.1,
    roughness: 0.5,
  });

  // White/cream for the feather vane
  const vaneMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  // Slightly darker/transparent for the downy fibers
  const downMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    metalness: 0.0,
    roughness: 0.9,
    transparent: true,
    opacity: 0.6,
  });

  // --- Dimensions ---
  const totalHeight = 1.2;
  const holderHeight = 0.35;
  const vaneLength = 0.7;
  const vaneWidth = 0.25;

  // --- 1. Metal Holder (Ferrule) ---
  const holderGroup = new THREE.Group();

  // Main tapered body of the holder
  const holderBodyGeom = new THREE.CylinderGeometry(0.015, 0.035, holderHeight * 0.7, 16);
  const holderBody = new THREE.Mesh(holderBodyGeom, metalMat);
  holderBody.position.y = holderHeight * 0.35; // Shift up so bottom is at 0
  holderGroup.add(holderBody);

  // Decorative ring near the top of the holder
  const ringGeom = new THREE.TorusGeometry(0.036, 0.004, 8, 24);
  const ring = new THREE.Mesh(ringGeom, metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = holderHeight * 0.7;
  holderGroup.add(ring);

  // Upper collar (where feather inserts)
  const collarGeom = new THREE.CylinderGeometry(0.025, 0.035, 0.05, 16);
  const collar = new THREE.Mesh(collarGeom, metalMat);
  collar.position.y = holderHeight * 0.7 + 0.025;
  holderGroup.add(collar);

  // Fine metal tip at the bottom
  const tipGeom = new THREE.CylinderGeometry(0.002, 0.015, 0.15, 8);
  const tip = new THREE.Mesh(tipGeom, metalMat);
  tip.position.y = -0.075;
  holderGroup.add(tip);

  // Position the whole holder group
  holderGroup.position.y = -totalHeight / 2 + 0.1;
  root.add(holderGroup);

  // --- 2. Rachis (Feather Shaft) ---
  // Extends from the holder up through the vane
  const rachisHeight = holderHeight + vaneLength + 0.1;
  const rachisGeom = new THREE.CylinderGeometry(0.004, 0.012, rachisHeight, 8);
  const rachis = new THREE.Mesh(rachisGeom, rachisMat);
  // Position so it sits inside the holder and goes up
  rachis.position.y = holderGroup.position.y + holderHeight * 0.7 + rachisHeight / 2 - 0.05;
  root.add(rachis);

  // --- 3. Feather Vane ---
  // Create a custom shape for the leaf
  const vaneShape = new THREE.Shape();
  const segments = 20;
  // Draw the vane profile relative to the rachis (x=0)
  // We draw the right side, then the left side to close it
  // Natural feather: wider on one side, but let's make it roughly symmetric for simplicity or slightly offset
  // Let's make it slightly asymmetric to look natural.
  
  // Start at bottom of vane (near holder)
  vaneShape.moveTo(0.01, 0); 
  
  // Right side curve out and up
  vaneShape.quadraticCurveTo(vaneWidth, vaneLength * 0.3, vaneWidth * 0.8, vaneLength);
  // Tip
  vaneShape.quadraticCurveTo(vaneWidth * 0.4, vaneLength + 0.05, 0.02, vaneLength + 0.02);
  
  // Left side (shorter/narrower usually, but let's keep it balanced for the quill look)
  vaneShape.quadraticCurveTo(-vaneWidth * 0.6, vaneLength + 0.05, -vaneWidth * 0.7, vaneLength * 0.4);
  // Back to bottom
  vaneShape.quadraticCurveTo(-0.02, 0.1, -0.01, 0);

  const vaneGeom = new THREE.ExtrudeGeometry(vaneShape, {
    depth: 0.002,
    bevelEnabled: false,
  });
  // Center the geometry
  vaneGeom.center();

  const vane = new THREE.Mesh(vaneGeom, vaneMat);
  // Position vane along the rachis
  // The rachis goes through the middle.
  vane.position.copy(rachis.position);
  vane.position.y += vaneLength * 0.4; // Shift up so bottom of vane is near holder
  
  // Rotate vane slightly to look natural (not perfectly flat)
  vane.rotation.z = -0.1; 
  vane.rotation.x = 0.1;
  root.add(vane);

  // Add a visible central line (rachis visible through vane)
  // Actually the rachis mesh is already there, but let's ensure it pierces the vane visually
  // The rachis mesh we created earlier is behind the vane. That works.

  // --- 4. Downy Fibers (Base of feather) ---
  // Soft fibers at the base of the vane, above the metal holder
  const downBaseY = holderGroup.position.y + holderHeight * 0.7;
  const fiberCount = 12;
  const fiberLength = 0.08;

  for (let i = 0; i < fiberCount; i++) {
    const angle = (i / fiberCount) * Math.PI * 2;
    // Only on the sides/back, not interfering with the main vane too much
    // Actually down is usually all around the base shaft
    const x = Math.cos(angle) * 0.02;
    const z = Math.sin(angle) * 0.02;
    
    const fiberGeom = new THREE.CylinderGeometry(0.001, 0.003, fiberLength, 4);
    const fiber = new THREE.Mesh(fiberGeom, downMat);
    
    // Position at base
    fiber.position.set(x, downBaseY + fiberLength / 2, z);
    
    // Angle outwards and upwards
    fiber.rotation.z = Math.cos(angle) * 0.5;
    fiber.rotation.x = Math.sin(angle) * 0.5;
    fiber.rotation.y = angle; // Face outward
    
    // Tilt up
    fiber.rotateX(-0.5);

    root.add(fiber);
  }

  // --- 5. Final Orientation ---
  // The reference image shows the pen diagonal. 
  // Let's rotate the whole group to match that elegant diagonal pose.
  // Tilt back slightly and rotate around Y.
  root.rotation.z = -0.3;
  root.rotation.x = 0.2;

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