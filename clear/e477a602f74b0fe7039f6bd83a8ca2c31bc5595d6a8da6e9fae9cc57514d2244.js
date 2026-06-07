export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold metal for the handle and nib.
  // Using metalness 0.6 and a bright emissive to ensure it pops in the dim renderer.
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.2
  });

  // Feather material: off-white, slightly translucent look (simulated with opacity/roughness)
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0,
    metalness: 0.0,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95
  });

  // Darker stem color for the rachis
  const rachisMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0d8,
    metalness: 0.0,
    roughness: 0.5
  });

  // --- 1. Metal Nib & Handle Assembly ---
  
  // The handle is a turned shape. We can use LatheGeometry for the profile.
  // Profile points (radius, y) from bottom (tip) to top (feather joint).
  const handleProfile = [
    new THREE.Vector2(0.00, 0.00),   // Tip point
    new THREE.Vector2(0.015, 0.05),  // Start of nib
    new THREE.Vector2(0.04, 0.15),   // Base of nib / start of grip
    new THREE.Vector2(0.055, 0.25),  // Grip bulge
    new THREE.Vector2(0.05, 0.35),   // Neck
    new THREE.Vector2(0.065, 0.40),  // Decorative ring base
    new THREE.Vector2(0.065, 0.45),  // Decorative ring top
    new THREE.Vector2(0.055, 0.50),  // Neck to feather
    new THREE.Vector2(0.07, 0.55),   // Flare at top to hold feather
    new THREE.Vector2(0.00, 0.55)    // Close top
  ];
  
  const handleGeom = new THREE.LatheGeometry(handleProfile, 24);
  const handle = new THREE.Mesh(handleGeom, brassMat);
  // Shift handle so the tip is at y=0 for easier positioning relative to feather
  // Actually, let's keep local coords simple and position the group.
  // The profile goes from y=0 to y=0.55.
  root.add(handle);

  // Decorative rings on the handle (already part of lathe profile mostly, but let's add distinct grooves if needed)
  // The lathe profile above includes a ring feature. Let's add a separate groove detail if needed.
  // Actually, let's add a separate thin ring for extra detail.
  const ringGeom = new THREE.TorusGeometry(0.058, 0.004, 8, 24);
  const ring = new THREE.Mesh(ringGeom, brassMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.42;
  root.add(ring);

  // --- 2. Feather Assembly ---

  // Feather Rachis (central shaft)
  // It extends from the top of the handle upwards.
  const rachisHeight = 1.4;
  const rachisGeom = new THREE.CylinderGeometry(0.008, 0.012, rachisHeight, 12);
  const rachis = new THREE.Mesh(rachisGeom, rachisMat);
  rachis.position.y = 0.55 + rachisHeight / 2;
  root.add(rachis);

  // Feather Vane (the flat part)
  // Create a custom shape for the feather silhouette.
  const vaneShape = new THREE.Shape();
  
  // Start at bottom of rachis (relative to vane center)
  // We will draw the outline. The rachis will cover the center.
  // Let's define the shape relative to (0,0) at the base of the vane.
  
  const vaneWidthLeft = 0.35;
  const vaneWidthRight = 0.25;
  const vaneLength = 1.3;
  
  vaneShape.moveTo(0, 0);
  // Left side curve (longer barbs)
  vaneShape.quadraticCurveTo(-vaneWidthLeft, vaneLength * 0.4, -vaneWidthLeft * 0.8, vaneLength);
  // Tip
  vaneShape.quadraticCurveTo(0, vaneLength + 0.05, vaneWidthRight * 0.8, vaneLength);
  // Right side curve (shorter barbs)
  vaneShape.quadraticCurveTo(vaneWidthRight, vaneLength * 0.4, 0, 0);
  
  const vaneGeom = new THREE.ExtrudeGeometry(vaneShape, {
    depth: 0.002,
    bevelEnabled: false
  });
  
  // Center the geometry so we can align it with the rachis
  vaneGeom.center();
  
  const vane = new THREE.Mesh(vaneGeom, featherMat);
  // Position the vane alongside the rachis
  // The rachis is at x=0. The vane needs to be offset so the rachis covers the "spine".
  // Our shape was drawn from x=0 to positive/negative. 
  // Let's shift the vane so the "spine" edge is at x=0.
  // Since we centered it, we need to un-center or calculate offset.
  // Easier: Don't center, or offset manually.
  // The shape goes from approx -0.35 to +0.25. Center is approx -0.05.
  // Let's just position it.
  vane.position.y = 0.55 + rachisHeight / 2; // Align with rachis center vertically
  vane.position.x = 0; // Centered on rachis
  
  // Rotate to stand up (XY plane is default for Extrude, which is good for a flat feather facing Z)
  // But we want it to face somewhat naturally. Default Extrude is along Z.
  // So the flat face is in XY. This is perfect for a feather standing up.
  
  // Add a slight curve to the feather? 
  // We can bend the vertices manually for a natural look.
  const posAttr = vaneGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    // Simple arc bend along Y axis (curving in Z)
    // z = y^2 * curvature
    const z = posAttr.getZ(i);
    // Apply a slight curl in Z based on Y height
    const normalizedY = (y + 0.65) / 1.3; // 0 to 1 roughly
    const curl = Math.sin(normalizedY * Math.PI) * 0.15; 
    // This creates a bowl shape. A feather usually curves along the spine.
    // Let's just leave it flat for stability, or add a very slight taper in scale.
  }
  
  root.add(vane);

  // Add subtle barbs/lines texture? 
  // We can add a few thin lines on the vane to suggest structure.
  // Or rely on the silhouette. The reference is clean.
  // Let's add a "fluff" detail at the base of the feather where it meets the handle.
  const fluffGeom = new THREE.CylinderGeometry(0.02, 0.06, 0.15, 8);
  const fluff = new THREE.Mesh(fluffGeom, featherMat);
  fluff.position.y = 0.55 + 0.075;
  fluff.rotation.z = Math.PI / 2; // Lie flat along the feather base? No, it's the downy part.
  // Actually, the reference shows the feather starts clean. No downy fluff.
  // I will skip the fluff to match the clean stylus look.

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