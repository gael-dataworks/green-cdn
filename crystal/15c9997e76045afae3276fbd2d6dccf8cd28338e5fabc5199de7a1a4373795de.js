export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Wall: Light beige/cream, matte finish
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe8e6e1,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Roof: Dark slate grey, slightly smoother than wall but not shiny
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x5a5d63,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const wallW = 0.60;
  const wallH = 0.50;
  const wallD = 0.45;

  const roofBaseW = 0.72; // Wider than wall for overhang
  const roofHeight = 0.38;
  const roofDepth = 0.58; // Deeper than wall for overhang

  // --- Wall ---
  // Simple box for the main body
  const wallGeom = new THREE.BoxGeometry(wallW, wallH, wallD);
  const wall = new THREE.Mesh(wallGeom, wallMat);
  // Position so bottom is at y=0 (optional, but good for centering later)
  wall.position.y = wallH / 2;
  root.add(wall);

  // --- Roof ---
  // Use ExtrudeGeometry for precise triangular prism shape with overhangs
  const roofShape = new THREE.Shape();
  // Start at bottom left of triangle profile (in XY plane)
  roofShape.moveTo(-roofBaseW / 2, 0);
  // Peak
  roofShape.lineTo(0, roofHeight);
  // Bottom right
  roofShape.lineTo(roofBaseW / 2, 0);
  // Close shape
  roofShape.lineTo(-roofBaseW / 2, 0);

  const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
    depth: roofDepth,
    bevelEnabled: false,
  });

  const roof = new THREE.Mesh(roofGeom, roofMat);
  
  // The extrusion happens along +Z by default. 
  // We want the roof centered on the wall.
  // The triangle profile is in XY. The extrusion is Z.
  // Center the mesh:
  // X: 0 (already centered by shape symmetry)
  // Y: Top of wall (wallH) + half of nothing? The shape starts at y=0.
  //    So we need to lift it by wallH.
  // Z: The extrusion goes from 0 to depth. Center is depth/2.
  //    We want it centered on wall (which is at z=0).
  //    So shift by -roofDepth / 2.
  
  roof.position.set(0, wallH, -roofDepth / 2);
  
  // The default winding of the shape might face -Z or +Z depending on UVs, 
  // but geometrically it's fine. However, standard ExtrudeGeometry faces +Z for the front face.
  // We want the "front" of the house to be +Z.
  // The shape is drawn in XY. Extrusion is along Z.
  // So the triangle face is at Z=0 (start) and Z=depth (end).
  // By shifting position.z to -depth/2, the front face is at z=0 and back at z=-depth.
  // Wait, if I shift by -depth/2, the range is [-depth/2, +depth/2].
  // The shape starts at local z=0. So after shift, it is at -depth/2.
  // The extrusion goes to +depth. So after shift, it is at +depth/2.
  // So the "front" face (the original shape) is at the BACK (-depth/2).
  // The "back" face (the cap) is at the FRONT (+depth/2).
  // To have the clean triangle face at the front (+Z side of object, but object is centered),
  // we actually want the geometry to be centered.
  // Let's just rotate 180 around Y if needed, or adjust position.
  // Actually, simpler: Just center the geometry in its own local space or adjust position.
  // If I want the face I drew to be at the "front" (positive Z relative to center),
  // I should shift the mesh so the extrusion goes backwards?
  // Or just accept that one cap is front, one is back. They look the same.
  // But UVs might differ. Let's ensure the "front" visible face is the one we expect.
  // Let's rotate 180 deg around Y so the extrusion direction flips? 
  // No, let's just position it so it sits nicely.
  // Current: Shape at z=0, Extrudes to z=depth.
  // Pos: z = -depth/2.
  // Result: Shape at -depth/2, Cap at +depth/2.
  // So the Cap is at the front (+Z). The Shape is at the back (-Z).
  // This is fine, both are flat triangles.
  
  root.add(roof);

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