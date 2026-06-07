export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy ceramic: low roughness, zero metalness.
  function createCeramicMat(colorHex) {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.0,
      roughness: 0.25,
    });
  }

  const matPurple = createCeramicMat(0x6a1b9a);
  const matBlue = createCeramicMat(0x0288d1);
  const matGreen = createCeramicMat(0x388e3c);
  const matRed = createCeramicMat(0xd32f2f);
  const matYellow = createCeramicMat(0xfdd835);
  const matInterior = createCeramicMat(0x0d1b2a); // Dark navy

  // --- Dimensions ---
  const baseRadius = 0.32;
  const rimRadius = 0.34;
  const totalHeight = 0.9;
  
  // Segment heights (approximate based on visual ratio)
  // Bottom Purple (tallest) + Blue + Green + Top Red
  // Yellow stripes are thin
  const hPurple = 0.22;
  const hYellow = 0.04;
  const hBlue = 0.18;
  const hGreen = 0.18;
  const hRed = 0.24; // Includes rim area

  let currentY = -totalHeight / 2;

  // --- Body Segments (Stacked Cylinders) ---
  
  // 1. Bottom Purple
  const bodyPurpleGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, hPurple, 32);
  const bodyPurple = new THREE.Mesh(bodyPurpleGeom, matPurple);
  bodyPurple.position.y = currentY + hPurple / 2;
  root.add(bodyPurple);
  currentY += hPurple;

  // 2. Yellow Stripe 1
  const stripe1Geom = new THREE.CylinderGeometry(baseRadius, baseRadius, hYellow, 32);
  const stripe1 = new THREE.Mesh(stripe1Geom, matYellow);
  stripe1.position.y = currentY + hYellow / 2;
  root.add(stripe1);
  currentY += hYellow;

  // 3. Blue Section
  const bodyBlueGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, hBlue, 32);
  const bodyBlue = new THREE.Mesh(bodyBlueGeom, matBlue);
  bodyBlue.position.y = currentY + hBlue / 2;
  root.add(bodyBlue);
  currentY += hBlue;

  // 4. Yellow Stripe 2
  const stripe2Geom = new THREE.CylinderGeometry(baseRadius, baseRadius, hYellow, 32);
  const stripe2 = new THREE.Mesh(stripe2Geom, matYellow);
  stripe2.position.y = currentY + hYellow / 2;
  root.add(stripe2);
  currentY += hYellow;

  // 5. Green Section
  const bodyGreenGeom = new THREE.CylinderGeometry(baseRadius, baseRadius, hGreen, 32);
  const bodyGreen = new THREE.Mesh(bodyGreenGeom, matGreen);
  bodyGreen.position.y = currentY + hGreen / 2;
  root.add(bodyGreen);
  currentY += hGreen;

  // 6. Yellow Stripe 3
  const stripe3Geom = new THREE.CylinderGeometry(baseRadius, baseRadius, hYellow, 32);
  const stripe3 = new THREE.Mesh(stripe3Geom, matYellow);
  stripe3.position.y = currentY + hYellow / 2;
  root.add(stripe3);
  currentY += hYellow;

  // 7. Top Red Section (Tapered slightly for rim)
  const bodyRedGeom = new THREE.CylinderGeometry(baseRadius, rimRadius, hRed, 32);
  const bodyRed = new THREE.Mesh(bodyRedGeom, matRed);
  bodyRed.position.y = currentY + hRed / 2;
  root.add(bodyRed);
  currentY += hRed; // Should be approx totalHeight / 2

  // --- Interior (Dark Blue) ---
  // Slightly smaller radius, pushed down to simulate depth
  const interiorHeight = hRed * 0.85;
  const interiorRadius = baseRadius * 0.92;
  const interiorGeom = new THREE.CylinderGeometry(interiorRadius, interiorRadius * 0.95, interiorHeight, 32);
  const interior = new THREE.Mesh(interiorGeom, matInterior);
  // Position near the top rim
  interior.position.y = (totalHeight / 2) - (interiorHeight / 2) - 0.02;
  root.add(interior);

  // --- Handles ---
  // Left Handle (Purple) - Attached to the purple/blue zone
  // Right Handle (Red) - Attached to the red/green zone
  
  function createHandle(side, colorMat, attachY) {
    const handleWidth = 0.22;
    const handleHeight = 0.35;
    const tubeRadius = 0.035;
    
    // Define curve points for a "D" shape handle
    // Local coordinates relative to attachment point on mug surface
    const startX = side * baseRadius;
    const points = [
      new THREE.Vector3(startX, attachY + handleHeight * 0.1, 0), // Top attach
      new THREE.Vector3(startX + side * handleWidth, attachY + handleHeight * 0.5, 0), // Outer curve
      new THREE.Vector3(startX, attachY - handleHeight * 0.1, 0)  // Bottom attach
    ];
    
    const curve = new THREE.CatmullRomCurve3(points);
    const handleGeom = new THREE.TubeGeometry(curve, 16, tubeRadius, 12, false);
    const handle = new THREE.Mesh(handleGeom, colorMat);
    
    // Merge logic is handled by grouping, but we need to ensure the handle 
    // intersects the body slightly to avoid gaps.
    return handle;
  }

  // Left Handle (Purple)
  // Attach roughly between purple and blue sections
  const leftHandleY = -totalHeight / 2 + hPurple + hYellow + hBlue * 0.5;
  const handleLeft = createHandle(-1, matPurple, leftHandleY);
  root.add(handleLeft);

  // Right Handle (Red)
  // Attach roughly between red and green sections
  const rightHandleY = totalHeight / 2 - hRed * 0.5;
  const handleRight = createHandle(1, matRed, rightHandleY);
  root.add(handleRight);

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