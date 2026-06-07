export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xE6D5B8,
    metalness: 0.0,
    roughness: 0.6,
  });

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Seat ---
  // Rounded rectangle shape for the seat
  const seatShape = new THREE.Shape();
  const seatW = 0.52;
  const seatD = 0.48;
  const seatRadius = 0.08;
  // Draw rounded rect
  seatShape.moveTo(-seatW / 2 + seatRadius, -seatD / 2);
  seatShape.lineTo(seatW / 2 - seatRadius, -seatD / 2);
  seatShape.quadraticCurveTo(seatW / 2, -seatD / 2, seatW / 2, -seatD / 2 + seatRadius);
  seatShape.lineTo(seatW / 2, seatD / 2 - seatRadius);
  seatShape.quadraticCurveTo(seatW / 2, seatD / 2, seatW / 2 - seatRadius, seatD / 2);
  seatShape.lineTo(-seatW / 2 + seatRadius, seatD / 2);
  seatShape.quadraticCurveTo(-seatW / 2, seatD / 2, -seatW / 2, seatD / 2 - seatRadius);
  seatShape.lineTo(-seatW / 2, -seatD / 2 + seatRadius);
  seatShape.quadraticCurveTo(-seatW / 2, -seatD / 2, -seatW / 2 + seatRadius, -seatD / 2);

  const seatGeom = new THREE.ExtrudeGeometry(seatShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
    steps: 1,
  });
  // Center the geometry vertically so pivot is at bottom or center?
  // Extrude goes from 0 to depth. Let's move it so y=0 is the bottom of the seat.
  seatGeom.translate(0, 0, 0); 
  // Actually, let's keep it simple. Pivot at center of box.
  seatGeom.center();

  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.y = 0.46; // Seat height
  root.add(seat);

  // --- Front Legs ---
  const frontLegHeight = 0.46;
  const frontLegTopR = 0.035;
  const frontLegBotR = 0.028;
  const frontLegGeom = new THREE.CylinderGeometry(frontLegBotR, frontLegTopR, frontLegHeight, 16);
  // Pivot at bottom
  frontLegGeom.translate(0, frontLegHeight / 2, 0);

  const frontLegPositions = [
    { x: -0.18, z: 0.18, rotZ: 0.05, rotX: -0.05 }, // Front Left
    { x: 0.18, z: 0.18, rotZ: -0.05, rotX: -0.05 }, // Front Right
  ];

  frontLegPositions.forEach((pos, i) => {
    const leg = new THREE.Mesh(frontLegGeom, woodMat);
    leg.position.set(pos.x, 0, pos.z);
    leg.rotation.x = pos.rotX;
    leg.rotation.z = pos.rotZ;
    root.add(leg);

    // Foot
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.01, 12), footMat);
    foot.position.copy(leg.position);
    foot.rotation.x = pos.rotX;
    foot.rotation.z = pos.rotZ;
    // Adjust foot to be at the bottom of the leg
    // Since leg pivot is at bottom (0,0,0) relative to leg mesh, and we rotated leg around pivot...
    // Actually, simpler: place foot at leg position (which is floor level).
    root.add(foot);
  });

  // --- Rear Legs (Curved) ---
  // Curve from floor to top of backrest
  // Points: Floor (splayed out), Under Seat (inward), Top (outward again for backrest width)
  const rearLegCurvePoints = [
    new THREE.Vector3(0.24, 0, -0.22),      // Floor contact
    new THREE.Vector3(0.16, 0.25, -0.18),   // Under seat knee
    new THREE.Vector3(0.14, 0.46, -0.16),   // Seat junction
    new THREE.Vector3(0.18, 0.65, -0.14),   // Rising
    new THREE.Vector3(0.26, 0.88, -0.12),   // Top (backrest connection)
  ];
  
  const rearLegCurve = new THREE.CatmullRomCurve3(rearLegCurvePoints);
  const rearLegGeom = new THREE.TubeGeometry(rearLegCurve, 20, 0.032, 12, false);
  
  // Create left and right rear legs by scaling X
  const rearLegLeft = new THREE.Mesh(rearLegGeom, woodMat);
  rearLegLeft.scale.x = -1; // Mirror for left side
  root.add(rearLegLeft);

  const rearLegRight = new THREE.Mesh(rearLegGeom, woodMat);
  root.add(rearLegRight);

  // --- Backrest ---
  // Curved plank connecting the tops of the rear legs
  // Path: Arc from left top to right top
  const backrestWidth = 0.54;
  const backrestHeight = 0.12;
  const backrestThickness = 0.035;
  
  // Quadratic bezier for the gentle backward curve of the backrest
  const p0 = new THREE.Vector3(-backrestWidth / 2, 0.82, -0.12);
  const p1 = new THREE.Vector3(0, 0.82, -0.18); // Control point pulling it back
  const p2 = new THREE.Vector3(backrestWidth / 2, 0.82, -0.12);
  
  const backrestPath = new THREE.QuadraticBezierCurve3(p0, p1, p2);
  
  // Shape: Rectangle for the cross-section of the backrest plank
  const backrestShape = new THREE.Shape();
  backrestShape.moveTo(-backrestThickness / 2, 0);
  backrestShape.lineTo(backrestThickness / 2, 0);
  backrestShape.lineTo(backrestThickness / 2, backrestHeight);
  backrestShape.lineTo(-backrestThickness / 2, backrestHeight);
  backrestShape.closePath();
  
  const backrestGeom = new THREE.ExtrudeGeometry(backrestShape, {
    extrudePath: backrestPath,
    steps: 20,
    bevelEnabled: false,
  });
  
  // The extrusion follows the path, but the shape orientation might need adjustment.
  // By default ExtrudeGeometry aligns shape XY to path tangent.
  // We want the "height" of the backrest to be Up (Y), and thickness to be along the curve depth.
  // The shape defined above is in XY plane. Extrude pushes it along Z (path).
  // We need to rotate the geometry so the shape's Y aligns with World Y.
  // Actually, ExtrudeGeometry with extrudePath creates a tube-like structure.
  // The shape is extruded along the path. The shape's local Y becomes the "up" of the extrusion relative to the path banking.
  // Since our path is mostly horizontal (XZ), the extrusion will go sideways.
  // We want the plank to stand vertically.
  // Let's redefine the shape to be vertical in the extrusion context?
  // Or just rotate the resulting mesh.
  // If path is in XZ plane, the extrusion grows in XZ. The shape dimensions are in local XY of the extrusion frame.
  // So Shape Y is "Up" relative to the path. This is correct.
  
  const backrest = new THREE.Mesh(backrestGeom, woodMat);
  // Center the backrest geometry roughly
  backrestGeom.center();
  root.add(backrest);

  // --- Center Leg ---
  // Vertical support under the rear center of the seat
  const centerLegHeight = 0.46;
  const centerLegGeom = new THREE.CylinderGeometry(0.03, 0.035, centerLegHeight, 12);
  centerLegGeom.translate(0, centerLegHeight / 2, 0);
  
  const centerLeg = new THREE.Mesh(centerLegGeom, woodMat);
  centerLeg.position.set(0, 0, -0.10); // Slightly back
  centerLeg.rotation.x = -0.1; // Slight backward tilt to match rear legs
  root.add(centerLeg);
  
  const centerFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.01, 12), footMat);
  centerFoot.position.copy(centerLeg.position);
  centerFoot.rotation.x = -0.1;
  root.add(centerFoot);

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