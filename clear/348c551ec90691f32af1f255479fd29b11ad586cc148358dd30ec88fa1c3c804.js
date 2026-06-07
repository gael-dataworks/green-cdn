export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bronze/Copper metal. Capped metalness at 0.6 per rules.
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.45,
  });

  // Darker metal for hinges/details if needed, but bronze is fine for all.
  // Using same material for coherence and draw call reduction.

  // --- Constants ---
  const HEX_RADIUS = 0.22;
  const HEX_APOTHEM = HEX_RADIUS * Math.cos(Math.PI / 6); // Distance from center to flat side
  const BODY_HEIGHT = 0.45;
  const BASE_HEIGHT = 0.18;
  const ROOF_HEIGHT = 0.20;
  const TOTAL_HEIGHT = BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT;

  // --- 1. Base (Flared Dome) ---
  // Profile: starts wide, curves in slightly, then up to meet body width
  const baseProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.28, 0.0),
    new THREE.Vector2(0.30, 0.05),
    new THREE.Vector2(0.26, 0.12),
    new THREE.Vector2(0.24, 0.18), // Top of base matches body width roughly
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, bronzeMat);
  base.position.y = BASE_HEIGHT / 2;
  root.add(base);

  // --- 2. Roof (Domed Top) ---
  // Profile: starts at body width, curves up to a point/knob base
  const roofProfile = [
    new THREE.Vector2(0.24, 0.0), // Matches base top
    new THREE.Vector2(0.24, 0.05),
    new THREE.Vector2(0.18, 0.12),
    new THREE.Vector2(0.08, 0.18),
    new THREE.Vector2(0.0, 0.20),
  ];
  const roofGeom = new THREE.LatheGeometry(roofProfile, 32);
  const roof = new THREE.Mesh(roofGeom, bronzeMat);
  roof.position.y = BASE_HEIGHT + BODY_HEIGHT;
  root.add(roof);

  // --- 3. Finial (Top Knob) ---
  const finialGeom = new THREE.SphereGeometry(0.025, 16, 16);
  const finial = new THREE.Mesh(finialGeom, bronzeMat);
  finial.position.y = BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT;
  root.add(finial);

  // --- 4. Body Frame (Corner Posts) ---
  // 6 vertical posts at hexagon corners
  const postGeom = new THREE.CylinderGeometry(0.015, 0.015, BODY_HEIGHT, 8);
  const postMesh = new THREE.InstancedMesh(postGeom, bronzeMat, 6);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * HEX_RADIUS;
    const z = Math.sin(angle) * HEX_RADIUS;
    dummy.position.set(x, BASE_HEIGHT + BODY_HEIGHT / 2, z);
    dummy.rotation.y = -angle; // Orient if needed, cylinder is symmetric
    dummy.updateMatrix();
    postMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(postMesh);

  // --- 5. Body Frame (Top and Bottom Rings/Segments) ---
  // Connecting the posts with horizontal segments
  const segmentGeom = new THREE.BoxGeometry(0.02, 0.02, HEX_RADIUS * 1.15); // Length approximates side
  // Actually, distance between corners is HEX_RADIUS. Side length = HEX_RADIUS.
  // Box length should be side length.
  const sideLength = HEX_RADIUS; 
  const frameSegmentGeom = new THREE.BoxGeometry(0.025, 0.025, sideLength);
  const frameMesh = new THREE.InstancedMesh(frameSegmentGeom, bronzeMat, 12); // 6 top + 6 bottom

  for (let i = 0; i < 12; i++) {
    const isTop = i >= 6;
    const j = isTop ? i - 6 : i;
    const angle = (j / 6) * Math.PI * 2 + Math.PI / 6; // Offset to align with flat sides
    const x = Math.cos(angle) * HEX_APOTHEM;
    const z = Math.sin(angle) * HEX_APOTHEM;
    const y = isTop ? BASE_HEIGHT + BODY_HEIGHT : BASE_HEIGHT;
    
    dummy.position.set(x, y, z);
    dummy.rotation.y = -angle;
    dummy.updateMatrix();
    frameMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(frameMesh);

  // --- 6. Lattice Panels (Diamond Grid) ---
  // We use InstancedMesh for all lattice strips to save draw calls.
  // Each panel has diagonal strips crossing each other.
  const stripWidth = 0.008;
  const stripThickness = 0.008;
  const panelHeight = BODY_HEIGHT - 0.05; // Leave gap for frames
  const panelWidth = sideLength - 0.03; // Leave gap for posts
  
  // Create a single strip geometry
  const stripGeom = new THREE.BoxGeometry(stripWidth, panelHeight * 1.5, stripThickness);
  // Estimate max strips: 6 panels * 10 strips each = 60
  const totalStrips = 72; 
  const latticeMesh = new THREE.InstancedMesh(stripGeom, bronzeMat, totalStrips);
  
  let stripIndex = 0;
  const stripsPerPanel = 12; // 6 one way, 6 other way

  for (let p = 0; p < 6; p++) {
    const angle = (p / 6) * Math.PI * 2;
    // Position of the panel center (on the apothem line)
    const panelDist = HEX_APOTHEM;
    const px = Math.cos(angle) * panelDist;
    const pz = Math.sin(angle) * panelDist;
    const py = BASE_HEIGHT + BODY_HEIGHT / 2;

    // We need to place strips on this panel plane.
    // The panel plane is tangent to the circle at `angle`.
    // Local panel coords: X is along the perimeter, Y is up, Z is normal.
    // But we are placing instances in world space.
    
    for (let s = 0; s < stripsPerPanel; s++) {
      if (stripIndex >= totalStrips) break;
      
      const isPositiveSlope = s < (stripsPerPanel / 2);
      const localIndex = isPositiveSlope ? s : s - (stripsPerPanel / 2);
      const count = stripsPerPanel / 2;
      
      // Distribute strips across the panel width
      // Offset from center
      const offset = (localIndex - (count - 1) / 2) * (panelWidth / count);
      
      // Angle of the strip in the panel plane (approx 45 degrees)
      const slopeAngle = isPositiveSlope ? Math.PI / 4 : -Math.PI / 4;
      
      // Construct transform
      // 1. Start at panel center
      dummy.position.set(px, py, pz);
      // 2. Rotate to face outward (Y axis rotation)
      dummy.rotation.set(0, -angle, 0);
      // 3. Move to strip position along local X (perimeter)
      dummy.translateX(offset);
      // 4. Rotate strip to diagonal
      dummy.rotateZ(slopeAngle);
      
      dummy.updateMatrix();
      latticeMesh.setMatrixAt(stripIndex, dummy.matrix);
      stripIndex++;
    }
  }
  root.add(latticeMesh);

  // --- 7. Hinges (Small details on corners) ---
  const hingeGeom = new THREE.BoxGeometry(0.015, 0.04, 0.02);
  const hingeMesh = new THREE.InstancedMesh(hingeGeom, bronzeMat, 12); // 2 per corner (top/bottom)
  let hingeIdx = 0;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * HEX_RADIUS;
    const z = Math.sin(angle) * HEX_RADIUS;
    
    // Top hinge
    dummy.position.set(x, BASE_HEIGHT + BODY_HEIGHT - 0.05, z);
    dummy.rotation.set(0, -angle, 0);
    dummy.translateX(0.015); // Push slightly out
    dummy.updateMatrix();
    hingeMesh.setMatrixAt(hingeIdx++, dummy.matrix);

    // Bottom hinge
    dummy.position.set(x, BASE_HEIGHT + 0.05, z);
    dummy.rotation.set(0, -angle, 0);
    dummy.translateX(0.015);
    dummy.updateMatrix();
    hingeMesh.setMatrixAt(hingeIdx++, dummy.matrix);
  }
  root.add(hingeMesh);

  // --- 8. Handle (Curved Wire) ---
  // Arch from one side of roof to the other
  const handleHeight = 0.25;
  const handleWidth = 0.25;
  const points = [];
  // Start point (left side of roof)
  points.push(new THREE.Vector3(-handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT * 0.5, 0));
  // Control points for curve
  points.push(new THREE.Vector3(-handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT + handleHeight, 0));
  points.push(new THREE.Vector3(handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT + handleHeight, 0));
  // End point (right side)
  points.push(new THREE.Vector3(handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT * 0.5, 0));
  
  const curve = new THREE.CatmullRomCurve3(points);
  const handleGeom = new THREE.TubeGeometry(curve, 20, 0.012, 8, false);
  const handle = new THREE.Mesh(handleGeom, bronzeMat);
  // Rotate handle to align with hexagon (front-to-back or side-to-side)
  // Image shows handle aligned with a flat face or corner? 
  // Let's align with X axis (side to side)
  root.add(handle);

  // Handle Attachment Points (Small spheres where handle meets roof)
  const attachGeom = new THREE.SphereGeometry(0.018, 8, 8);
  const attachLeft = new THREE.Mesh(attachGeom, bronzeMat);
  attachLeft.position.set(-handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT * 0.5, 0);
  root.add(attachLeft);
  
  const attachRight = new THREE.Mesh(attachGeom, bronzeMat);
  attachRight.position.set(handleWidth / 2, BASE_HEIGHT + BODY_HEIGHT + ROOF_HEIGHT * 0.5, 0);
  root.add(attachRight);

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