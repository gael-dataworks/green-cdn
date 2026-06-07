export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brushed stainless steel: moderate metalness, moderate roughness.
  // Cap metalness at 0.6 to avoid black surfaces in this render environment.
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Clear glass for the sake bottle.
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    transparent: true,
    opacity: 1.0,
  });

  // --- Warmer / Chiller Body ---
  const warmerHeight = 0.55;
  const warmerRadius = 0.24;
  const wallThickness = 0.015;

  // Main cylindrical body (hollowed visually by the bottle inside, but modeled solid for simplicity or thin shell)
  // Using a thin cylinder for the shell.
  const warmerBodyGeom = new THREE.CylinderGeometry(
    warmerRadius,
    warmerRadius,
    warmerHeight,
    32
  );
  const warmerBody = new THREE.Mesh(warmerBodyGeom, metalMat);
  warmerBody.position.y = warmerHeight / 2;
  root.add(warmerBody);

  // Bottom Rim / Base
  const baseRimGeom = new THREE.TorusGeometry(warmerRadius + 0.01, 0.025, 16, 32);
  const baseRim = new THREE.Mesh(baseRimGeom, metalMat);
  baseRim.rotation.x = Math.PI / 2;
  baseRim.position.y = 0.025;
  root.add(baseRim);

  // Top Rim (collar)
  const topRimGeom = new THREE.TorusGeometry(warmerRadius + 0.01, 0.025, 16, 32);
  const topRim = new THREE.Mesh(topRimGeom, metalMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = warmerHeight - 0.025;
  root.add(topRim);

  // Inner lip visible at top
  const innerLipGeom = new THREE.TorusGeometry(warmerRadius - 0.02, 0.015, 16, 32);
  const innerLip = new THREE.Mesh(innerLipGeom, metalMat);
  innerLip.rotation.x = Math.PI / 2;
  innerLip.position.y = warmerHeight - 0.015;
  root.add(innerLip);

  // --- Handle ---
  // D-shaped handle on the side.
  const handlePath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(warmerRadius + 0.02, warmerHeight * 0.25, 0),
    new THREE.Vector3(warmerRadius + 0.02, warmerHeight * 0.75, 0),
    new THREE.Vector3(warmerRadius + 0.18, warmerHeight * 0.75, 0),
    new THREE.Vector3(warmerRadius + 0.18, warmerHeight * 0.25, 0),
  ]);
  // Close the loop for the handle shape
  handlePath.closed = false; 
  
  // Actually, let's make a proper loop for the handle
  const handlePoints = [
    new THREE.Vector3(warmerRadius + 0.02, warmerHeight * 0.30, 0),
    new THREE.Vector3(warmerRadius + 0.02, warmerHeight * 0.70, 0),
    new THREE.Vector3(warmerRadius + 0.16, warmerHeight * 0.70, 0),
    new THREE.Vector3(warmerRadius + 0.16, warmerHeight * 0.30, 0),
  ];
  const handleCurve = new THREE.CatmullRomCurve3(handlePoints);
  handleCurve.closed = true;

  const handleGeom = new THREE.TubeGeometry(handleCurve, 24, 0.025, 12, true);
  const handle = new THREE.Mesh(handleGeom, metalMat);
  // Rotate handle to align with Z axis if needed, but points are in Y-Z plane relative to X? 
  // Points are X (radius), Y (height), Z (0). This creates a loop in XY plane.
  // We want it on the side. The points above define a loop in the XY plane at Z=0.
  // The warmer is centered at 0,0,0. So this handle is at +X side.
  // We need to rotate it so the flat face is towards the center? No, tube is round.
  // The points define the centerline.
  root.add(handle);

  // Handle mounting brackets (small cylinders where handle meets body)
  const bracketGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16);
  const bracketTop = new THREE.Mesh(bracketGeom, metalMat);
  bracketTop.rotation.z = Math.PI / 2;
  bracketTop.position.set(warmerRadius + 0.01, warmerHeight * 0.70, 0);
  root.add(bracketTop);

  const bracketBot = new THREE.Mesh(bracketGeom, metalMat);
  bracketBot.rotation.z = Math.PI / 2;
  bracketBot.position.set(warmerRadius + 0.01, warmerHeight * 0.30, 0);
  root.add(bracketBot);

  // --- Spout ---
  // Angled tube on the opposite side (-X)
  const spoutLength = 0.12;
  const spoutStartY = warmerHeight * 0.85;
  const spoutAngle = Math.PI / 6; // 30 degrees up

  const spoutGeom = new THREE.CylinderGeometry(0.025, 0.035, spoutLength, 16);
  const spout = new THREE.Mesh(spoutGeom, metalMat);
  spout.position.set(-(warmerRadius + spoutLength / 2 * Math.cos(spoutAngle)), spoutStartY + spoutLength / 2 * Math.sin(spoutAngle), 0);
  spout.rotation.z = -spoutAngle; // Pointing out -X and up
  // Cylinder is Y-up by default. Rotating around Z tilts it in XY plane.
  // We want it pointing -X. Default cylinder points +Y.
  // Rotate -90 deg around Z -> points +X.
  // Then rotate up by spoutAngle.
  spout.rotation.z = -Math.PI / 2 + spoutAngle; 
  // Position adjustment: pivot is center of cylinder.
  // Base of spout should be at warmer surface.
  spout.position.set(-(warmerRadius + 0.02), spoutStartY, 0);
  // Apply rotation around the base point? Easier to just position center.
  // Let's re-calculate center position based on rotation.
  // Local pivot at center. 
  // Tip is at length/2 along local Y (after rotation).
  // Base is at -length/2 along local Y.
  // We want base at (-warmerRadius, spoutStartY, 0).
  // Center = Base + (0, length/2, 0) rotated.
  // Rotated vector (0, L/2, 0) by (-90+angle) around Z:
  // x = 0*cos - (L/2)*sin = -(L/2)*sin(-90+a) = -(L/2)*(-cos(a)) = (L/2)*cos(a)
  // y = 0*sin + (L/2)*cos = (L/2)*cos(-90+a) = (L/2)*(sin(a))
  // Wait, standard rotation matrix.
  // Let's just place it and tweak.
  spout.position.set(-(warmerRadius + 0.05), spoutStartY + 0.04, 0);
  spout.rotation.z = -Math.PI / 2 + 0.4; // Tilted up
  root.add(spout);
  
  // Spout base reinforcement
  const spoutBaseGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const spoutBase = new THREE.Mesh(spoutBaseGeom, metalMat);
  spoutBase.rotation.z = Math.PI / 2;
  spoutBase.position.set(-warmerRadius - 0.015, spoutStartY, 0);
  root.add(spoutBase);

  // --- Side Latch / Hinge Detail ---
  // Small rectangular detail on the side (perpendicular to handle/spout axis)
  const latchGeom = new THREE.BoxGeometry(0.02, 0.04, 0.015);
  const latch = new THREE.Mesh(latchGeom, metalMat);
  latch.position.set(0, warmerHeight * 0.5, warmerRadius + 0.01);
  root.add(latch);

  // --- Glass Bottle (Tokkuri) ---
  // Lathe profile
  const bottleProfile = [
    new THREE.Vector2(0.00, 0.00),   // Bottom center
    new THREE.Vector2(0.13, 0.00),   // Bottom edge
    new THREE.Vector2(0.13, 0.08),   // Start of shoulder
    new THREE.Vector2(0.15, 0.15),   // Widest part
    new THREE.Vector2(0.14, 0.35),   // Start of neck taper
    new THREE.Vector2(0.05, 0.55),   // Neck base
    new THREE.Vector2(0.05, 0.75),   // Neck top
    new THREE.Vector2(0.06, 0.78),   // Lip flare
    new THREE.Vector2(0.00, 0.80),   // Top center
  ];

  const bottleGeom = new THREE.LatheGeometry(bottleProfile, 32);
  const bottle = new THREE.Mesh(bottleGeom, glassMat);
  
  // Position bottle inside warmer
  // Warmer height 0.55. Bottle height 0.80.
  // Bottle should sit on bottom of warmer.
  // Warmer bottom is at y=0.
  bottle.position.y = 0.05; // Slight offset for glass thickness visual
  root.add(bottle);

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