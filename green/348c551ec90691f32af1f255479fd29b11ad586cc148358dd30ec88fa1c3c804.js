export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Bronze/Brass material. Capped metalness at 0.6 per rules (no env map).
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Darker material for hinges/details if needed, but keeping it uniform bronze for now.
  // If the reference showed distinct iron hinges, I'd add one, but it looks uniform.

  // --- Dimensions ---
  const baseHeight = 0.22;
  const cageHeight = 0.45;
  const topHeight = 0.20;
  const totalHeight = baseHeight + cageHeight + topHeight;
  const radius = 0.16; // Hexagon radius (corner to center)
  const hexSide = radius; // Approx side length for hexagon

  // --- 1. Base (Lathe) ---
  // Profile: Bottom center -> Bottom edge -> Flare -> Taper to cage width
  const baseProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.22, 0.04),
    new THREE.Vector2(0.18, 0.08),
    new THREE.Vector2(radius + 0.02, baseHeight), // Slight flare at top of base
  ];
  const baseGeom = new THREE.LatheGeometry(baseProfile, 32);
  const base = new THREE.Mesh(baseGeom, bronzeMat);
  base.position.y = baseHeight / 2;
  root.add(base);

  // --- 2. Top Lid (Lathe) ---
  // Profile: Cage top -> Dome -> Finial base -> Finial tip
  const topProfile = [
    new THREE.Vector2(radius + 0.02, 0), // Matches base top
    new THREE.Vector2(radius + 0.02, 0.05), // Short vertical wall
    new THREE.Vector2(0.12, 0.12), // Dome curve
    new THREE.Vector2(0.06, 0.16), // Neck
    new THREE.Vector2(0.08, 0.18), // Finial bulb
    new THREE.Vector2(0.04, 0.20), // Finial tip
    new THREE.Vector2(0, 0.20),
  ];
  const topGeom = new THREE.LatheGeometry(topProfile, 32);
  const topLid = new THREE.Mesh(topGeom, bronzeMat);
  topLid.position.y = baseHeight + cageHeight;
  root.add(topLid);

  // --- 3. Cage Frame ---
  // We need 6 vertical posts and 2 hexagonal rings (top and bottom of cage).
  // Using InstancedMesh for posts and ring segments for efficiency and clean code.

  const postGeom = new THREE.BoxGeometry(0.025, cageHeight, 0.025);
  const postMesh = new THREE.InstancedMesh(postGeom, bronzeMat, 6);
  
  const ringSegmentGeom = new THREE.BoxGeometry(0.025, 0.025, hexSide);
  const ringMesh = new THREE.InstancedMesh(ringSegmentGeom, bronzeMat, 12); // 6 top + 6 bottom

  const dummy = new THREE.Object3D();
  const invDummy = new THREE.Object3D();

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Vertical Post
    dummy.position.set(x, baseHeight + cageHeight / 2, z);
    dummy.rotation.y = -angle; // Face outward
    dummy.updateMatrix();
    postMesh.setMatrixAt(i, dummy.matrix);

    // Top Ring Segment (connects post i to post i+1)
    // Position is midpoint between corners
    const nextAngle = ((i + 1) / 6) * Math.PI * 2;
    const x2 = Math.cos(nextAngle) * radius;
    const z2 = Math.sin(nextAngle) * radius;
    const midX = (x + x2) / 2;
    const midZ = (z + z2) / 2;
    
    // Top segment
    dummy.position.set(midX, baseHeight + cageHeight - 0.0125, midZ);
    dummy.rotation.y = -angle - Math.PI / 6; // Perpendicular to radius
    dummy.updateMatrix();
    ringMesh.setMatrixAt(i, dummy.matrix);

    // Bottom segment
    dummy.position.set(midX, baseHeight + 0.0125, midZ);
    dummy.rotation.y = -angle - Math.PI / 6;
    dummy.updateMatrix();
    ringMesh.setMatrixAt(i + 6, dummy.matrix);
  }
  root.add(postMesh);
  root.add(ringMesh);

  // --- 4. Lattice (Diamond Grid) ---
  // Create a thin bar geometry. We will instance many of these.
  // Each face has a grid of crossed bars.
  // Bar dimensions: length ~0.35 (diagonal of face), width 0.008, thickness 0.004
  const barLength = Math.sqrt(cageHeight * cageHeight + hexSide * hexSide) * 0.8; 
  // Actually, let's just make them long enough to cover the face diagonal
  const faceHeight = cageHeight - 0.025; // Minus rings
  const faceWidth = hexSide; 
  const diagLen = Math.sqrt(faceHeight*faceHeight + faceWidth*faceWidth);
  
  const latticeBarGeom = new THREE.BoxGeometry(0.006, diagLen, 0.004);
  // Estimate bars per face: ~8 in one direction, ~8 in other = 16 per face.
  // 6 faces * 16 = 96 bars.
  const totalBars = 6 * 16;
  const latticeMesh = new THREE.InstancedMesh(latticeBarGeom, bronzeMat, totalBars);

  let barIndex = 0;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    
    // Face center
    const nextAngle = ((i + 1) / 6) * Math.PI * 2;
    const x1 = Math.cos(angle) * radius;
    const z1 = Math.sin(angle) * radius;
    const x2 = Math.cos(nextAngle) * radius;
    const z2 = Math.sin(nextAngle) * radius;
    const faceCX = (x1 + x2) / 2;
    const faceCZ = (z1 + z2) / 2;
    const faceCY = baseHeight + cageHeight / 2;

    // We need to place bars on this face plane.
    // The face plane is rotated by `angle + PI/6` around Y.
    const faceRotY = angle + Math.PI / 6;

    // Create two sets of parallel bars: +45 deg and -45 deg relative to face vertical
    // Spacing
    const spacing = faceHeight / 7;
    const barsPerDir = 8;

    for (let b = 0; b < barsPerDir; b++) {
      // Offset from center
      const offset = (b - barsPerDir / 2) * spacing;
      
      // Bar Set 1 (Positive slope on face)
      dummy.position.set(faceCX, faceCY + offset, faceCZ);
      dummy.rotation.set(0, faceRotY, 0); // Align to face
      dummy.rotateZ(Math.PI / 4); // 45 deg
      dummy.rotateY(Math.PI / 2); // Box is tall in Y, we want it flat on face? 
      // Wait, BoxGeometry is (w, h, d). h is length.
      // If I rotate Z by 45, it's diagonal in the face plane (YZ local).
      // But the face is in world XZ roughly.
      // Let's rely on the dummy's local axes.
      // Default Box: Y is long.
      // Rotate Y by faceRotY -> Long axis is vertical, facing correct direction.
      // Rotate X by 90 -> Long axis is now horizontal (Z local).
      // Rotate Z by 45 -> Diagonal.
      
      // Simpler:
      // 1. Position at face center.
      // 2. Rotate Y to face normal.
      // 3. The face lies in a plane. Let's say local Z is normal, local Y is up.
      //    We want bars in the Y-Z plane (if we rotated X by 90).
      
      // Let's restart the transform logic for the bar.
      // We want a bar of length `diagLen`.
      // Center it at `faceCX, faceCY + offset, faceCZ`.
      // Orientation: The face is vertical. The bar is diagonal.
      // Angle of bar in the face plane: 45 degrees from vertical.
      
      // World position
      dummy.position.set(faceCX, faceCY + offset, faceCZ);
      
      // World rotation
      // 1. Face Y rotation
      dummy.rotation.set(0, faceRotY, 0);
      // 2. Tilt 90 deg around X to lie flat against the "front" (local Z)
      dummy.rotation.x = Math.PI / 2;
      // 3. Rotate 45 deg around Z (which is now the face normal)
      dummy.rotation.z = Math.PI / 4;
      
      dummy.updateMatrix();
      if (barIndex < totalBars) latticeMesh.setMatrixAt(barIndex++, dummy.matrix);

      // Bar Set 2 (Negative slope)
      dummy.rotation.z = -Math.PI / 4;
      dummy.updateMatrix();
      if (barIndex < totalBars) latticeMesh.setMatrixAt(barIndex++, dummy.matrix);
    }
  }
  root.add(latticeMesh);

  // --- 5. Handle ---
  // Arching tube from one side of lid to the other.
  // Attach points are on the "equator" of the lid/cage junction roughly.
  const handleY = baseHeight + cageHeight + topHeight * 0.5;
  const handleRadius = 0.12;
  
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-radius - 0.02, handleY - 0.05, 0),
    new THREE.Vector3(-radius - 0.05, handleY + 0.15, 0),
    new THREE.Vector3(0, handleY + 0.22, 0), // Top of arch
    new THREE.Vector3(radius + 0.05, handleY + 0.15, 0),
    new THREE.Vector3(radius + 0.02, handleY - 0.05, 0),
  ]);
  
  const handleGeom = new THREE.TubeGeometry(curve, 20, 0.012, 8, false);
  const handle = new THREE.Mesh(handleGeom, bronzeMat);
  // The curve is in X-Y plane (Z=0). The lantern is oriented such that faces are at angles.
  // The handle should align with two opposite corners or face centers.
  // Let's align with corners (0 deg and 180 deg).
  // My curve is along X axis. This aligns with corners at 0 and 180.
  root.add(handle);

  // Handle Mounts (small spheres/caps at attachment points)
  const mountGeom = new THREE.SphereGeometry(0.018, 16, 16);
  const mountL = new THREE.Mesh(mountGeom, bronzeMat);
  mountL.position.set(-radius - 0.02, handleY - 0.05, 0);
  root.add(mountL);
  
  const mountR = new THREE.Mesh(mountGeom, bronzeMat);
  mountR.position.set(radius + 0.02, handleY - 0.05, 0);
  root.add(mountR);

  // --- 6. Hinges/Clasp Details ---
  // Small boxes on the vertical posts to simulate hinges or door frame
  const hingeGeom = new THREE.BoxGeometry(0.015, 0.04, 0.015);
  const hingeMesh = new THREE.InstancedMesh(hingeGeom, bronzeMat, 12); // 2 per post
  
  let hIndex = 0;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * (radius + 0.012); // Slightly outside post
    const z = Math.sin(angle) * (radius + 0.012);
    
    // Top hinge
    dummy.position.set(x, baseHeight + cageHeight - 0.08, z);
    dummy.rotation.y = -angle;
    dummy.updateMatrix();
    if (hIndex < 12) hingeMesh.setMatrixAt(hIndex++, dummy.matrix);

    // Bottom hinge
    dummy.position.set(x, baseHeight + 0.08, z);
    dummy.rotation.y = -angle;
    dummy.updateMatrix();
    if (hIndex < 12) hingeMesh.setMatrixAt(hIndex++, dummy.matrix);
  }
  root.add(hingeMesh);

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