export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver/White Gold: High reflectivity but capped metalness to avoid blackness without env map.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Diamond/Gemstone: Physical material for transmission and refraction.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 2.4,
    transparent: true,
    thickness: 0.5,
  });

  // --- Constants ---
  const bandRadius = 0.32;
  const bandTube = 0.035;
  const stoneScale = 0.16;
  const stoneHeight = 0.09;

  // --- Band ---
  // Torus lies in XY plane by default. Rotate X by 90 deg to lie in XZ plane (hole along Y).
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 24, 48);
  const band = new THREE.Mesh(bandGeom, metalMat);
  band.rotation.x = Math.PI / 2;
  root.add(band);

  // --- Heart Shape Definition ---
  // Define the 2D heart contour for the stone and bezel.
  // Coordinates are normalized, will be scaled later.
  const heartShape = new THREE.Shape();
  const h = 0.5; // height factor
  const w = 0.45; // width factor
  
  // Start at top center dip
  heartShape.moveTo(0, 0.2 * h);
  // Right lobe
  heartShape.bezierCurveTo(w * 0.5, 0.5 * h, w, 0.2 * h, 0, -0.6 * h);
  // Left lobe
  heartShape.bezierCurveTo(-w, 0.2 * h, -w * 0.5, 0.5 * h, 0, 0.2 * h);

  // --- Gemstone ---
  // Extrude the heart shape. Bevels create the "facets" illusion.
  const extrudeSettings = {
    depth: stoneHeight,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    steps: 2,
  };
  
  const stoneGeom = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  // Center the geometry
  stoneGeom.center();
  
  const stone = new THREE.Mesh(stoneGeom, gemMat);
  // Position stone on top of the band
  // Band top is at Y = bandTube. Stone sits on that.
  stone.position.y = bandTube + stoneHeight / 2;
  // Rotate stone to face outward/upward appropriately. 
  // Extrude is along Z. We want it facing up/out.
  // Let's keep it facing +Y (up) relative to the ring standing on a finger.
  // But Extrude is Z-axis. So rotate X by 90.
  stone.rotation.x = Math.PI / 2;
  stone.scale.set(stoneScale, stoneScale, stoneScale);
  
  root.add(stone);

  // --- Bezel Setting ---
  // A thin tube following the heart shape to hold the stone.
  // Create points from the heart shape to make a 3D curve.
  const points = heartShape.getPoints(50);
  const curvePoints = points.map(p => new THREE.Vector3(p.x, p.y, 0));
  // Close the loop
  curvePoints.push(curvePoints[0].clone());
  
  const heartCurve = new THREE.CatmullRomCurve3(curvePoints);
  // Scale the curve to match stone size + slight offset for bezel thickness
  const bezelScale = stoneScale * 1.05; 
  heartCurve.points.forEach(p => p.multiplyScalar(bezelScale));
  
  const bezelGeom = new THREE.TubeGeometry(heartCurve, 64, 0.008, 8, true);
  const bezel = new THREE.Mesh(bezelGeom, metalMat);
  // Align bezel with stone
  bezel.position.copy(stone.position);
  bezel.rotation.copy(stone.rotation);
  
  root.add(bezel);

  // --- Prongs (Optional detail for realism) ---
  // Add 4 small prongs at cardinal points of the heart to secure it visually
  const prongGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8);
  const prongMat = metalMat;
  
  // Prong positions relative to heart center (before rotation)
  // Top dip, Bottom tip, Left peak, Right peak
  const prongOffsets = [
    new THREE.Vector3(0, 0.2 * h * bezelScale, 0), // Top
    new THREE.Vector3(0, -0.6 * h * bezelScale, 0), // Bottom
    new THREE.Vector3(w * bezelScale, 0.2 * h * bezelScale, 0), // Right
    new THREE.Vector3(-w * bezelScale, 0.2 * h * bezelScale, 0), // Left
  ];

  prongOffsets.forEach(offset => {
    const prong = new THREE.Mesh(prongGeom, prongMat);
    // Position relative to stone center
    prong.position.copy(offset);
    // Rotate to face inward/down slightly? 
    // Simple vertical prongs sticking up from the bezel rim
    prong.rotation.x = Math.PI / 2; // Align with stone face
    prong.position.y += 0.02; // Lift slightly above bezel
    prong.position.z += 0.01; // Push forward slightly
    
    // Apply stone's transform to prong
    // Since prong is added to root, we need to compute world position or add to a sub-group.
    // Easier: Add to a 'setting' group that matches stone transform.
  });

  // Let's regroup setting for easier transform management
  const settingGroup = new THREE.Group();
  settingGroup.position.copy(stone.position);
  settingGroup.rotation.copy(stone.rotation);
  
  // Re-add stone and bezel to settingGroup? No, they are already in root.
  // Let's just create prongs in local space of settingGroup and add group to root.
  // Remove stone/bezel from root and add to settingGroup.
  root.remove(stone);
  root.remove(bezel);
  settingGroup.add(stone);
  settingGroup.add(bezel);
  stone.position.set(0,0,0); // Reset local pos
  stone.rotation.set(0,0,0); // Reset local rot (it was rotated for global)
  // Wait, stone was rotated X 90. So in group, it needs that rotation if group is upright.
  // Let's keep it simple: Stone and Bezel stay in root, Prongs calculated manually.
  
  root.remove(settingGroup); // Discard helper

  // Manual Prong Placement
  // We need to transform the local prong offsets by the stone's matrix
  const stoneMatrix = new THREE.Matrix4();
  stone.updateMatrix();
  stoneMatrix.copy(stone.matrix);
  
  const prongLocalPos = new THREE.Vector3();
  const prongWorldPos = new THREE.Vector3();
  const upVec = new THREE.Vector3(0, 1, 0); // Local up for prong cylinder
  const worldUp = new THREE.Vector3();

  prongOffsets.forEach(offset => {
    const prong = new THREE.Mesh(prongGeom, prongMat);
    // Local position on the heart face (Z is up for extruded shape originally, but we rotated X 90)
    // Original Extrude is along Z. We rotated X 90, so Z is now Y (up).
    // So prong should stick out along local Z (which is world Y).
    prong.position.copy(offset);
    prong.position.z = 0.01; // Slightly above the heart surface
    
    // Apply stone's world transform to place prong
    prong.applyMatrix4(stoneMatrix);
    
    // Orient prong to point towards center of stone slightly? 
    // Or just point up (world Y).
    // Cylinder is Y-up. We want it to point World Y.
    // Stone rotation is X=90. So local Z is World Y.
    // So prong (cylinder Y-up) needs to be rotated to align with World Y.
    // Actually, if we just place it, it inherits no rotation.
    // We want it to look like it's holding the stone.
    // Let's just make them small bumps on the bezel.
    
    root.add(prong);
  });

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