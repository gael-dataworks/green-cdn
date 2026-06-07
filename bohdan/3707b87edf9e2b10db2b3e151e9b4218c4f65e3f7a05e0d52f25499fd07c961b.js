export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed/Polished Metal (Silver/Aluminum)
  // Using emissive to lift brightness in the dim renderer as per instructions.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd6dadf,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd6dadf,
    emissiveIntensity: 0.25,
  });

  // Glowing Blue Tip (LED / Fiber Optic)
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x00aaff,
    metalness: 0.0,
    roughness: 0.2,
    emissive: 0x00aaff,
    emissiveIntensity: 1.5,
  });

  // Dark Gap / Seam Material
  const gapMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Geometry & Meshes ---

  // 1. Shank (Main Cylinder)
  // Aligned along Y axis.
  const shankRadius = 0.14;
  const shankHeight = 0.7;
  const shankGeom = new THREE.CylinderGeometry(shankRadius, shankRadius, shankHeight, 32);
  const shank = new THREE.Mesh(shankGeom, metalMat);
  // Position center so bottom is at y=0 for easier attachment logic if needed, 
  // but default cylinder is centered. Let's keep it centered at 0,0,0 for now.
  root.add(shank);

  // 2. Tip (Blue Light Emitter)
  // Sits on top of the shank.
  const tipHeight = 0.15;
  const tipGeom = new THREE.CylinderGeometry(shankRadius, shankRadius * 0.9, tipHeight, 32);
  const tip = new THREE.Mesh(tipGeom, lightMat);
  tip.position.y = shankHeight / 2 + tipHeight / 2;
  root.add(tip);

  // 3. Blade (The flat wing)
  // Profile in XY plane, extruded along Z (thickness).
  const bladeShape = new THREE.Shape();
  // Start at top-inner (connection to shank)
  bladeShape.moveTo(shankRadius, 0.12);
  // Top edge (horizontal)
  bladeShape.lineTo(0.55, 0.12);
  // Front edge (vertical down)
  bladeShape.lineTo(0.55, -0.18);
  // Bottom edge (angled up towards shank)
  bladeShape.lineTo(shankRadius, -0.08);
  // Close
  bladeShape.closePath();

  const bladeExtrudeSettings = {
    depth: 0.07, // Thickness of the blade
    bevelEnabled: false,
  };
  const bladeGeom = new THREE.ExtrudeGeometry(bladeShape, bladeExtrudeSettings);
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  
  // Position the blade:
  // The extrusion is centered on Z=0 by default (from -depth/2 to +depth/2).
  // We want it attached to the side of the shank.
  // The shape starts at x=shankRadius.
  // We need to shift it so it sits on the shank surface.
  // Actually, the shape starts at x=shankRadius relative to the mesh origin.
  // So if we place the mesh at x=0, the blade starts at the center.
  // We want it to start at the surface (x=shankRadius).
  // So shift mesh by -shankRadius? No, the shape coordinates are local.
  // Let's just position the mesh so the shape aligns.
  // Shape x range: [0.14, 0.55].
  // We want the blade to extend from the shank surface.
  // If shank is at x=0, surface is at x=0.14.
  // So the mesh position x=0 works perfectly if the shape starts at 0.14.
  // But we need to center the thickness.
  blade.position.set(0, -0.15, 0); // Shift down slightly to match image (blade is lower on shank)
  root.add(blade);

  // 4. Collar / Seam Ring
  // Hides the intersection between blade and shank.
  const collarGeom = new THREE.TorusGeometry(shankRadius + 0.005, 0.015, 16, 32);
  const collar = new THREE.Mesh(collarGeom, gapMat);
  collar.rotation.x = Math.PI / 2; // Lie flat in XZ plane
  collar.position.y = -0.15; // Match blade vertical position
  root.add(collar);

  // 5. Bottom Cap (Optional, to close the shank bottom cleanly)
  const bottomCapGeom = new THREE.CylinderGeometry(shankRadius, shankRadius, 0.02, 32);
  const bottomCap = new THREE.Mesh(bottomCapGeom, metalMat);
  bottomCap.position.y = -shankHeight / 2 - 0.01;
  root.add(bottomCap);

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