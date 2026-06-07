export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy ceramic standard
  const createCeramicMat = (colorHex) => new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0.0,
    roughness: 0.35,
  });

  const purpleMat = createCeramicMat(0x7b3f9e);
  const blueMat = createCeramicMat(0x2eb3e6);
  const greenMat = createCeramicMat(0x4caf50);
  const redMat = createCeramicMat(0xe53935);
  const yellowMat = createCeramicMat(0xfdd835);
  const interiorMat = createCeramicMat(0x1a237e); // Dark navy

  // --- Dimensions ---
  const totalHeight = 1.0;
  const topRadius = 0.36;
  const bottomRadius = 0.31;
  const wallThickness = 0.04;
  
  // Helper to get radius at a specific height (linear interpolation for taper)
  function getRadiusAtY(y) {
    // y is 0 at bottom, totalHeight at top
    const t = y / totalHeight;
    return bottomRadius + (topRadius - bottomRadius) * t;
  }

  // --- Body Bands (Stacked Cylinders) ---
  // We stack cylinders to achieve the distinct colored bands.
  // Order: Bottom to Top
  
  const bands = [
    { name: 'purple_base', h: 0.20, y: 0.10, mat: purpleMat },
    { name: 'yellow_stripe_1', h: 0.03, y: 0.215, mat: yellowMat },
    { name: 'blue_band', h: 0.20, y: 0.33, mat: blueMat },
    { name: 'yellow_stripe_2', h: 0.03, y: 0.445, mat: yellowMat },
    { name: 'green_band', h: 0.20, y: 0.56, mat: greenMat },
    { name: 'yellow_stripe_3', h: 0.03, y: 0.675, mat: yellowMat },
    { name: 'red_top', h: 0.26, y: 0.81, mat: redMat },
  ];

  bands.forEach((band, index) => {
    const yBottom = band.y - band.h / 2;
    const yTop = band.y + band.h / 2;
    
    const rBottom = getRadiusAtY(yBottom);
    const rTop = getRadiusAtY(yTop);
    
    const geom = new THREE.CylinderGeometry(rBottom, rTop, band.h, 32);
    const mesh = new THREE.Mesh(geom, band.mat);
    mesh.position.y = band.y;
    mesh.name = band.name;
    root.add(mesh);
  });

  // --- Interior Surface ---
  // A dark cylinder inside the top to simulate the liquid-filled look or deep interior
  const interiorH = 0.75;
  const interiorY = totalHeight - 0.15 - (interiorH / 2); // Sit below rim
  const interiorR = topRadius - wallThickness;
  
  const interiorGeom = new THREE.CylinderGeometry(interiorR, interiorR * 0.95, interiorH, 32);
  const interiorMesh = new THREE.Mesh(interiorGeom, interiorMat);
  interiorMesh.position.y = interiorY;
  interiorMesh.name = 'interior_surface';
  root.add(interiorMesh);

  // --- Rim Lip (Optional refinement) ---
  // The red top band covers most, but let's ensure the very top edge is defined
  const rimGeom = new THREE.TorusGeometry(topRadius, 0.015, 16, 32);
  const rimMesh = new THREE.Mesh(rimGeom, redMat);
  rimMesh.rotation.x = Math.PI / 2;
  rimMesh.position.y = totalHeight - 0.02;
  rimMesh.name = 'rim_lip';
  root.add(rimMesh);

  // --- Handles ---
  // Using TubeGeometry with a curve for a natural D-shape arch
  // Left Handle (Purple)
  const handleDepth = 0.18;
  const handleWidth = 0.14; // Vertical span
  const handleThickness = 0.025;
  
  function createHandle(side, colorMat, name) {
    const direction = side; // -1 for left, 1 for right
    const attachYBottom = 0.25;
    const attachYTop = 0.75;
    const baseX = direction * (topRadius * 0.9); // Attach slightly below top radius
    
    // Curve points for the handle arch
    const p1 = new THREE.Vector3(baseX, attachYBottom, 0);
    const p2 = new THREE.Vector3(baseX + (direction * handleDepth), (attachYBottom + attachYTop) / 2, 0);
    const p3 = new THREE.Vector3(baseX, attachYTop, 0);
    
    const curve = new THREE.QuadraticBezierCurve3(p1, p2, p3);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, handleThickness, 12, false);
    const handleMesh = new THREE.Mesh(tubeGeom, colorMat);
    handleMesh.name = name;
    return handleMesh;
  }

  const leftHandle = createHandle(-1, purpleMat, 'left_handle');
  root.add(leftHandle);

  const rightHandle = createHandle(1, redMat, 'right_handle');
  root.add(rightHandle);

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