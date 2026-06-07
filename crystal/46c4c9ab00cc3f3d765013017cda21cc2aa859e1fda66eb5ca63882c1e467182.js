export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Handle: Brushed/duller steel
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.5,
    roughness: 0.6,
  });

  // Blade: Sharper, lighter steel
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xbdbdbd,
    metalness: 0.6,
    roughness: 0.3,
  });

  // --- Handle ---
  // Profile for extrusion: Rectangle with one rounded end (left side)
  // Coordinates in XY plane, extruded along Z (depth)
  const handleShape = new THREE.Shape();
  const hw = 0.055; // half width
  const hl = 0.25;  // half length (total length 0.5)
  
  // Start at bottom-right (flat end where blade attaches)
  handleShape.moveTo(hl, -hw);
  // Line to bottom-left
  handleShape.lineTo(-hl, -hw);
  // Arc to top-left (rounded end)
  // Ellipse arc: xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, xRotation
  // We want a semi-circle at the left end (-hl, 0)
  handleShape.absarc(-hl, 0, hw, Math.PI * 1.5, Math.PI * 0.5, false);
  // Line to top-right
  handleShape.lineTo(hl, hw);
  // Close (back to start)
  handleShape.lineTo(hl, -hw);

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: 0.11,      // Thickness of the handle
    bevelEnabled: false,
    steps: 1,
  });
  
  // Center the geometry so pivot is at the center of the flat face? 
  // ExtrudeGeometry centers by default based on bounding box.
  // The shape goes from x=-0.25 to x=0.25. Center is x=0.
  // Depth goes from z=0 to z=0.11. Center is z=0.055.
  // We want the flat face (at x=0.25 in shape local coords) to be at the connection point.
  // Let's just position the mesh.
  
  const handle = new THREE.Mesh(handleGeom, handleMat);
  // Rotate so the handle lies along Z axis. 
  // Shape was drawn in XY. Extrusion is along Z.
  // We want the long axis to be Z.
  // Currently long axis is X.
  handle.rotation.y = Math.PI / 2; 
  // Now long axis is Z. Flat face is at -Z or +Z?
  // Shape x=0.25 (flat end) rotates to z=0.25? 
  // Rotation Y 90: x -> z, z -> -x.
  // Point (0.25, 0, 0) becomes (0, 0, -0.25).
  // Point (-0.25, 0, 0) becomes (0, 0, 0.25).
  // So flat end is at z = -0.25. Rounded end at z = 0.25.
  // We want blade at +Z. So we need flat end at +Z side of handle.
  // Let's rotate Y -90 instead.
  handle.rotation.y = -Math.PI / 2;
  // x=0.25 -> z=-0.25? No.
  // Rot Y -90: x -> -z.
  // (0.25, 0, 0) -> (0, 0, -0.25).
  // (-0.25, 0, 0) -> (0, 0, 0.25).
  // Still flat end at -Z.
  // Let's just flip the shape or rotate 180 around Y after the 90.
  // Or simply position it such that the flat end meets the blade.
  
  // Let's restart orientation logic for simplicity.
  // Draw shape along Z axis directly? No, Extrude is always local Z.
  // So draw shape in XY, extrude Z. Then rotate.
  // We want the tool to point +Z.
  // Handle is behind blade. So Handle is at negative Z, Blade at positive Z.
  // Connection is at Z=0.
  // Handle flat end should be at Z=0.
  // Handle rounded end should be at Z < 0.
  
  // Current Shape: Flat end at x=hl (0.25). Rounded at x=-hl (-0.25).
  // Extrude depth is along Z (0 to 0.11).
  // We want the flat end (x=0.25) to face +Z.
  // So we need to rotate the mesh so local +X points to +Z.
  // Rotation Y = -90 deg (or 270).
  // (1, 0, 0) rotates to (0, 0, -1). That's -Z.
  // Rotation Y = 90 deg.
  // (1, 0, 0) rotates to (0, 0, 1). That's +Z.
  // So `handle.rotation.y = Math.PI / 2` puts the flat end at +Z side of the handle's local space.
  // Perfect.
  
  handle.rotation.y = Math.PI / 2;
  // Now position the handle so its flat end is at Z=0.
  // The geometry center in X is 0. The flat end is at x=0.25.
  // After rotation, flat end is at z=0.25 (relative to mesh center).
  // We want flat end at world Z=0.
  // So mesh center should be at z = -0.25.
  handle.position.z = -0.25;
  
  // The extrusion depth is 0.11, centered at z=0.055 in local space.
  // After rotation Y 90: local z becomes -x.
  // So the thickness is along -X axis.
  // This means the handle is centered at x=0, thickness extends from x=-0.055 to x=0.055?
  // Local z range: 0 to 0.11. Center 0.055.
  // Rotated: x range: -0.055 to 0.055? No.
  // Point (0, 0, 0) -> (0, 0, 0).
  // Point (0, 0, 0.11) -> (0, 0, 0) in X? No.
  // Rot Y 90: (x, y, z) -> (z, y, -x).
  // (0, 0, 0) -> (0, 0, 0).
  // (0, 0, 0.11) -> (0.11, 0, 0).
  // So thickness is along +X axis, from 0 to 0.11.
  // This is fine, we can center it later or just accept it.
  // Let's center the geometry manually to make positioning easier.
  handleGeom.center(); 
  // Now the mesh pivot is at the geometric center.
  // Flat end is at local x = 0.25.
  // After rotation Y 90, flat end is at local z = 0.25.
  // We want flat end at world Z=0.
  // So handle.position.z = -0.25.
  
  root.add(handle);

  // --- Blade ---
  // ConeGeometry(radius, length, radialSegments)
  // Default: Tip at +Y, Base at Y=0 in XZ plane.
  // We want Tip at +Z, Base at Z=0 (meeting handle).
  // Rotate X 90 deg: Tip moves +Y -> +Z. Base moves XZ -> XY?
  // Rot X 90: (x, y, z) -> (x, -z, y).
  // Tip (0, len, 0) -> (0, 0, len). Correct (+Z).
  // Base points: (r, 0, 0) -> (r, 0, 0). (0, 0, r) -> (0, -r, 0).
  // So base lies in XY plane? No.
  // Original base is in XZ plane (y=0).
  // Rotated base is in XY plane (z=0)?
  // Point (0, 0, r) -> (0, -r, 0). y is -r.
  // Point (0, 0, -r) -> (0, r, 0). y is r.
  // So base is in XY plane.
  // This means the blade is flat vertically?
  // We want the blade to have a diamond cross section in the vertical plane (XZ? No, YZ?).
  // The tool lies horizontally. The blade tapers up/down and left/right.
  // So the cross section should be in the YZ plane? No, the blade points Z.
  // Cross section is in XY plane.
  // So Base in XY plane is correct.
  // Vertices at (r,0), (0,r), (-r,0), (0,-r).
  // This gives a diamond shape with points at Top(y=r), Bottom(y=-r), Left(x=-r), Right(x=r).
  // This matches the visual of a blade with a central horizontal ridge (if vertices are top/bottom)
  // Wait, if vertices are Top/Bottom, the faces are diagonal. The ridge is the vertex.
  // The image shows a highlight on the top face. This implies a flat top face or a sharp top edge.
  // A 4-segment cone has sharp edges at the vertices.
  // So vertices at Top/Bottom gives a sharp edge at the top. This matches the highlight.
  
  const bladeRadius = 0.055; // Match handle half-width
  const bladeLength = 0.35;
  const bladeGeom = new THREE.ConeGeometry(bladeRadius, bladeLength, 4);
  
  const blade = new THREE.Mesh(bladeGeom, bladeMat);
  blade.rotation.x = Math.PI / 2; // Point tip to +Z
  
  // Position blade so base is at Z=0.
  // Cone pivot is at center of base? No, ConeGeometry pivot is at center of base by default?
  // Three.js ConeGeometry: "The geometry is created with the tip at the top and the base at the bottom."
  // Actually, default ConeGeometry has pivot at the center of the base?
  // Let's check docs/standard behavior.
  // ConeGeometry(radius, height, ...). Vertices: Tip at (0, height, 0). Base at y=0.
  // So pivot is at center of base.
  // After rotation X 90: Pivot is at (0,0,0). Tip is at (0,0,bladeLength).
  // So base is at z=0.
  // We want base to meet handle flat end.
  // Handle flat end is at world Z=0 (because handle center is at -0.25, flat end offset is +0.25).
  // So blade position z = 0.
  blade.position.z = 0;
  
  root.add(blade);

  // Normalize
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