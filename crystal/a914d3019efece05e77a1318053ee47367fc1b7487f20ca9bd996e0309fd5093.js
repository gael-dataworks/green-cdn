export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Light wood for the main body slats
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xe3c08d,
    metalness: 0.0,
    roughness: 0.75,
  });

  // Slightly darker/yellower bamboo for the hoops and rim
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xdcb376,
    metalness: 0.0,
    roughness: 0.6,
  });

  // Material for the carved relief (same base, maybe slightly different shading)
  const carveMat = new THREE.MeshStandardMaterial({
    color: 0xd4b075,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Dimensions ---
  const bucketHeight = 0.55;
  const bucketRadius = 0.26;
  const slatCount = 16;
  const slatWidth = (Math.PI * 2 * bucketRadius) / slatCount;
  const slatThickness = 0.025;
  const bottomThickness = 0.03;

  // --- 1. Body Slats (Instanced) ---
  // Using InstancedMesh for the vertical staves to keep draw calls low
  const slatGeom = new THREE.BoxGeometry(slatWidth + 0.002, bucketHeight, slatThickness);
  const slatsMesh = new THREE.InstancedMesh(slatGeom, woodMat, slatCount);
  
  const dummy = new THREE.Object3D();
  for (let i = 0; i < slatCount; i++) {
    const angle = (i / slatCount) * Math.PI * 2;
    const x = Math.cos(angle) * bucketRadius;
    const z = Math.sin(angle) * bucketRadius;
    
    dummy.position.set(x, 0, z);
    dummy.rotation.y = -angle; // Face outward
    dummy.updateMatrix();
    slatsMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(slatsMesh);

  // --- 2. Bottom Cap ---
  // A solid cylinder to close the bottom
  const bottomGeom = new THREE.CylinderGeometry(bucketRadius - slatThickness, bucketRadius - slatThickness, bottomThickness, slatCount);
  const bottomCap = new THREE.Mesh(bottomGeom, woodMat);
  bottomCap.position.y = -bucketHeight / 2 + bottomThickness / 2;
  root.add(bottomCap);

  // --- 3. Top Rim ---
  // A torus-like shape or thick ring at the top
  // Using a TorusGeometry scaled to fit, or a Lathe. Let's use a Torus for the ring shape.
  // Torus lies in XY plane by default, need to rotate to XZ.
  const rimRadius = bucketRadius + slatThickness / 2;
  const rimTube = 0.025;
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimTube, 16, slatCount);
  const topRim = new THREE.Mesh(rimGeom, bambooMat);
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = bucketHeight / 2 - rimTube; // Sit on top
  root.add(topRim);

  // --- 4. Hoops (Bands) ---
  // Upper hoop and Lower hoop
  // Using TorusGeometry for the bands
  const hoopRadius = bucketRadius + slatThickness / 2 + 0.002; // Slightly outside slats
  const hoopTube = 0.008;
  const hoopGeom = new THREE.TorusGeometry(hoopRadius, hoopTube, 8, 32);
  
  // Upper hoop position (below rim)
  const upperHoop = new THREE.Mesh(hoopGeom, bambooMat);
  upperHoop.rotation.x = Math.PI / 2;
  upperHoop.position.y = bucketHeight / 2 - 0.08;
  root.add(upperHoop);

  // Lower hoop position (near bottom)
  const lowerHoop = new THREE.Mesh(hoopGeom, bambooMat);
  lowerHoop.rotation.x = Math.PI / 2;
  lowerHoop.position.y = -bucketHeight / 2 + 0.08;
  root.add(lowerHoop);

  // --- 5. Carved Relief Decorations ---
  // We simulate the carvings by adding shallow extruded geometry slightly offset from the surface.
  
  // Helper to create a point on the cylinder surface
  function getSurfacePoint(angle, y, offset = 0.005) {
    const r = bucketRadius + slatThickness / 2 + offset;
    return new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );
  }

  // Helper to get quaternion for facing outward normal
  function getSurfaceQuaternion(angle) {
    const normal = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }

  // --- Vertical Vine (Left Side) ---
  // A winding tube going up the side
  const vinePoints = [];
  const vineAngle = -2.4; // Approx left side
  const vineStartY = -bucketHeight / 2 + 0.1;
  const vineEndY = bucketHeight / 2 - 0.1;
  const segments = 20;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = vineStartY + (vineEndY - vineStartY) * t;
    // Add some sine wave wiggle in angle
    const wiggle = Math.sin(t * Math.PI * 4) * 0.05; 
    const currentAngle = vineAngle + wiggle;
    vinePoints.push(getSurfacePoint(currentAngle, y, 0.002));
  }
  
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineGeom = new THREE.TubeGeometry(vineCurve, 20, 0.006, 8, false);
  const vineMesh = new THREE.Mesh(vineGeom, carveMat);
  root.add(vineMesh);

  // Add some "leaves" along the vine
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.02, 0.02, 0.04, 0.0, 0.06, -0.02);
  leafShape.bezierCurveTo(0.04, -0.01, 0.02, -0.01, 0.0, 0);
  
  const leafExtrudeSettings = { depth: 0.003, bevelEnabled: false };
  const leafGeom = new THREE.ExtrudeGeometry(leafShape, leafExtrudeSettings);
  
  for (let i = 0; i < 5; i++) {
    const t = 0.2 + (i * 0.15);
    const y = vineStartY + (vineEndY - vineStartY) * t;
    const pos = getSurfacePoint(vineAngle, y, 0.008);
    const quat = getSurfaceQuaternion(vineAngle);
    
    const leaf = new THREE.Mesh(leafGeom, carveMat);
    leaf.position.copy(pos);
    leaf.quaternion.copy(quat);
    leaf.rotateZ(i % 2 === 0 ? Math.PI / 4 : -Math.PI / 4);
    leaf.scale.set(1.5, 1.5, 1);
    root.add(leaf);
  }

  // --- Horizontal Floral Band (Bottom) ---
  // A band of flowers and scrolls near the bottom hoop
  const bandAngleStart = -1.5;
  const bandAngleEnd = 1.5;
  const bandY = -bucketHeight / 2 + 0.04;
  const bandRadius = bucketRadius + slatThickness / 2 + 0.002;
  
  // Create a curved path for the band background
  const bandPoints = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const a = bandAngleStart + (bandAngleEnd - bandAngleStart) * t;
    bandPoints.push(getSurfacePoint(a, bandY, 0.001));
  }
  const bandCurve = new THREE.CatmullRomCurve3(bandPoints);
  const bandGeom = new THREE.TubeGeometry(bandCurve, 20, 0.005, 8, false);
  const bandMesh = new THREE.Mesh(bandGeom, carveMat);
  root.add(bandMesh);

  // Add flowers along the band
  const flowerShape = new THREE.Shape();
  const r = 0.015;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    flowerShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  flowerShape.closePath();
  
  const flowerGeom = new THREE.ExtrudeGeometry(flowerShape, { depth: 0.004, bevelEnabled: false });
  
  // Place 3 flowers along the band
  const flowerAngles = [-0.8, 0.0, 0.8];
  for (const fa of flowerAngles) {
    const pos = getSurfacePoint(fa, bandY, 0.006);
    const quat = getSurfaceQuaternion(fa);
    
    const flower = new THREE.Mesh(flowerGeom, carveMat);
    flower.position.copy(pos);
    flower.quaternion.copy(quat);
    flower.scale.set(1.2, 1.2, 1);
    root.add(flower);
  }

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