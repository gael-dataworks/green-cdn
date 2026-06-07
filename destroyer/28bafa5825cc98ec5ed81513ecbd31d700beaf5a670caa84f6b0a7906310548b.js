export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Metal: Silver/Chrome. Cap metalness at 0.6 to avoid blackness without env map.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Wood: Light beech/maple. Matte/Satin.
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    metalness: 0.0,
    roughness: 0.6,
  });

  // --- Dimensions ---
  const rimRadius = 0.25;
  const rimTubeRadius = 0.018;
  const handleLength = 0.35;
  const handleWidthStart = 0.05;
  const handleWidthEnd = 0.035;
  const handleThickness = 0.025;

  // --- 1. Rim (Torus) ---
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie in XZ plane.
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTubeRadius, 16, 64);
  const rim = new THREE.Mesh(rimGeom, metalMat);
  rim.rotation.x = Math.PI / 2;
  root.add(rim);

  // --- 2. Mesh Bowl (Hemisphere Wireframe) ---
  // SphereGeometry creates a sphere centered at 0,0,0.
  // We want a bowl hanging down from the rim (which is at y=0).
  // Create a hemisphere (top half of sphere) and flip it.
  // phiStart=0, phiLength=PI*2 (full rotation around Y)
  // thetaStart=0, thetaLength=PI/2 (from North Pole to Equator)
  const meshGeom = new THREE.SphereGeometry(rimRadius - rimTubeRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const meshBowl = new THREE.Mesh(meshGeom, new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.5,
    roughness: 0.4,
    wireframe: true,
    transparent: true,
    opacity: 0.9
  }));
  // Rotate 180 around X to make it hang down (-Y)
  meshBowl.rotation.x = Math.PI;
  // Position slightly down so the equator aligns with the inner edge of the rim
  meshBowl.position.y = -rimTubeRadius * 0.5; 
  root.add(meshBowl);

  // --- 3. Handle Connector (Metal ferrule) ---
  // A small curved piece wrapping the rim to hold the wood.
  const connectorGeom = new THREE.BoxGeometry(0.06, 0.04, 0.05);
  const connector = new THREE.Mesh(connectorGeom, metalMat);
  connector.position.set(0, 0, rimRadius);
  // Align with rim tangent
  connector.rotation.x = Math.PI / 2; 
  root.add(connector);

  // --- 4. Handle (Wood) ---
  // Create a tapered shape with a rounded end and a hole.
  const handleShape = new THREE.Shape();
  const w1 = handleWidthStart / 2;
  const w2 = handleWidthEnd / 2;
  const len = handleLength;
  const endR = w2;

  // Start at connector (x=0, y=0 in shape space)
  handleShape.moveTo(0, -w1);
  handleShape.lineTo(len - endR, -w2);
  // Rounded end
  handleShape.quadraticCurveTo(len, -w2, len, 0);
  handleShape.quadraticCurveTo(len, w2, len - endR, w2);
  handleShape.lineTo(0, w1);
  handleShape.lineTo(0, -w1);

  // Hole at the end
  const holePath = new THREE.Path();
  holePath.absarc(len - endR * 0.5, 0, endR * 0.6, 0, Math.PI * 2, true);
  handleShape.holes.push(holePath);

  const handleGeom = new THREE.ExtrudeGeometry(handleShape, {
    depth: handleThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1
  });

  const handle = new THREE.Mesh(handleGeom, woodMat);
  // Center the geometry locally so pivot is at start
  // ExtrudeGeometry centers based on shape. We need to shift it so (0,0,0) is the start.
  // The shape was drawn from x=0 to x=len. The geometry center is roughly len/2.
  // We want the start (x=0) to be at the connector.
  // Actually, let's just position it.
  // The extrusion happens in Z. We want the handle to extend in Z.
  // So we rotate the extruded mesh.
  handle.rotation.x = Math.PI / 2; // Lay flat in XZ
  handle.rotation.y = Math.PI; // Face +Z (Extrude goes +Z, we want it to go +Z from connector)
  // Wait, ExtrudeGeometry builds along +Z.
  // If we rotate X 90, it builds along -Y.
  // We want it to extend along +Z axis from the rim.
  // So: Keep default orientation (builds +Z), but the shape is in XY.
  // We need the shape to be in XZ plane, extruding along Y? No.
  // Easiest: Shape in XY. Extrude along Z.
  // Rotate Mesh: X=90 (so XY becomes XZ). Now it lies flat.
  // But it extends in Z (which was original Z).
  // We want it to extend from the rim (at Z=rimRadius) further in +Z.
  // So:
  handle.rotation.x = Math.PI / 2; // Shape XY -> XZ.
  // Now the shape is in XZ plane. Extrusion is along Y (up).
  // We want the handle to be flat. So we need to rotate again?
  // Let's restart handle orientation logic.
  // Default Extrude: Shape in XY, Depth in Z.
  // We want Handle in XZ plane (flat), extending +Z.
  // So we need Shape to be in XY, but mapped to XZ.
  // Rotate around X by 90 deg: XY -> XZ (Y becomes -Z). Depth (Z) becomes Y.
  // This makes the handle vertical.
  // Correct transform:
  // 1. Shape in XY.
  // 2. Rotate Mesh around X by -90 deg (or 270). XY -> XZ (Y becomes +Z). Depth (Z) becomes -Y (down).
  // 3. We want Depth to be thickness (Y in world).
  // Let's just use a BoxGeometry and scale it? No, need the hole and round end.
  // Okay: Shape in XY. Extrude Z (thickness).
  // Rotate Mesh: X = 90 deg. Now Shape is in XZ plane (local Y is -Z). Extrusion is along local Y (world Z? No).
  // Three.js rotations are applied in order.
  // Let's try: handle.rotation.set(Math.PI/2, 0, 0).
  // Original: Face +Z. Top +Y.
  // After X=90: Face +Y. Top -Z.
  // This is confusing. Let's use a Group for the handle to orient it easily.
  
  const handleGroup = new THREE.Group();
  handleGroup.position.set(0, 0, rimRadius); // Start at rim edge
  // The geometry draws from x=0 to x=len.
  // We want x=0 to be at the group pivot.
  // ExtrudeGeometry centers the shape. We need to translate the geometry so the start is at 0.
  // Or just offset the position.
  // The shape center is roughly at x = len/2.
  // So position.x = -len/2.
  // But we also need to orient it.
  // Let's just create the mesh and transform it.
  
  handle.geometry.translate(len / 2, 0, 0); // Shift so start is at -len/2, end at +len/2? 
  // No, shape was 0 to len. Center is len/2.
  // If we translate by -len/2, the range becomes -len/2 to +len/2.
  // We want the start (0) to be at the pivot. So translate by -len/2?
  // If range is 0..len, center is len/2. To move 0 to origin, translate by -len/2.
  // Then range is -len/2 .. +len/2.
  // We want 0 to be at origin. So we need to shift so 0 is at 0.
  // Current center is len/2. We want center to be len/2 (so that 0 is at -len/2).
  // Wait. If I want the "start" of the handle (x=0 in shape) to be at the mesh position (0,0,0).
  // The geometry is centered at (len/2, 0, depth/2).
  // I need to translate geometry by (-len/2, 0, -depth/2).
  // Then the "start" corner is at (0,0,0).
  
  handleGeom.translate(-len / 2, 0, -handleThickness / 2);
  
  // Now orient.
  // Default: Face +Z, Up +Y.
  // We want: Face +Y (up), Extend +Z.
  // So we need the "Face" (original Z) to point +Z. (Already true).
  // We need the "Up" (original Y) to point +Y. (Already true).
  // Wait, the shape is in XY plane. So it stands vertically like a sign.
  // We want it flat like a table.
  // So rotate around X by 90 deg.
  // Now Shape is in XZ plane. "Up" (original Y) is now +Z.
  // "Face" (original Z) is now -Y.
  // This makes the handle vertical (standing on edge) and pointing up.
  // We want it flat.
  // So we need the Shape to be in XZ plane, and Thickness to be in Y.
  // Original: Shape XY, Thickness Z.
  // Rotate X 90: Shape XZ (Y->-Z), Thickness Y (Z->Y).
  // So: handle.rotation.x = Math.PI / 2.
  // Now the handle lies in XZ plane? No.
  // Original Y is Up. After X=90, Original Y becomes -Z (Forward/Back).
  // Original Z is Forward. After X=90, Original Z becomes +Y (Up).
  // So the flat face is now Vertical (XZ plane? No, XY became X(-Z)).
  // This is getting messy.
  
  // Simple approach:
  // Define shape in XZ plane directly? No, Shape is 2D (x,y).
  // Define shape in XY.
  // Rotate Z 90? No.
  // Rotate X 90.
  // Let's visualize:
  // Paper on table (XZ). Pen points Up (Y).
  // ThreeJS Default: Paper is Vertical (XY). Pen points Forward (Z).
  // We want Paper on Table (XZ). Pen points Up (Y).
  // Transform: Rotate around X by -90 (or 270).
  // Y (Up) -> Z (Forward).
  // Z (Forward) -> -Y (Down).
  // This puts the paper in XZ plane? No.
  // Original XY plane. Rotate X -90.
  // X stays X.
  // Y becomes Z.
  // So the plane is now XZ. Correct.
  // The Normal (Z) becomes -Y. So the "face" points Down.
  // We want the thickness to be in Y.
  // Original Thickness is Z.
  // After Rotate X -90: Z becomes -Y.
  // So the thickness is along Y. Correct.
  // So: handle.rotation.x = -Math.PI / 2.
  // And we want it to extend in +Z.
  // Original Shape extends in +X (0 to len).
  // After Rotate X -90: X stays X.
  // So it extends in +X.
  // We want it to extend in +Z.
  // So we need to rotate around Y by -90 (so X becomes Z).
  // Total Rotation: X = -90, Y = -90.
  
  handle.rotation.set(-Math.PI / 2, -Math.PI / 2, 0);
  handle.position.set(0, 0, rimRadius);
  root.add(handle);

  // --- 5. Rest Hooks (Two small metal hooks) ---
  // Located opposite the handle (at -Z side of rim).
  // One at -X, one at +X.
  // Curve: Start at rim outer edge -> go out -> curve down -> hook in.
  
  function createHook(side) {
    // side is -1 or 1
    const startX = side * rimRadius;
    const startZ = 0; // Approx opposite handle, slightly spread
    // Actually, looking at image, hooks are at roughly 10 and 8 o'clock if handle is 2.
    // Let's put them at -Z side, spread in X.
    const zOffset = -rimRadius * 0.8;
    const xStart = side * rimRadius * 0.8;
    
    const points = [];
    // Start on rim
    points.push(new THREE.Vector3(xStart, 0, zOffset));
    // Extend out and down
    points.push(new THREE.Vector3(xStart * 1.2, -0.05, zOffset * 1.1));
    // Curve down
    points.push(new THREE.Vector3(xStart * 1.1, -0.15, zOffset * 1.0));
    // Hook tip in
    points.push(new THREE.Vector3(xStart * 0.9, -0.18, zOffset * 0.9));
    
    const curve = new THREE.CatmullRomCurve3(points);
    const hookGeom = new THREE.TubeGeometry(curve, 16, 0.008, 8, false);
    const hook = new THREE.Mesh(hookGeom, metalMat);
    return hook;
  }

  const hookLeft = createHook(-1);
  const hookRight = createHook(1);
  root.add(hookLeft);
  root.add(hookRight);

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