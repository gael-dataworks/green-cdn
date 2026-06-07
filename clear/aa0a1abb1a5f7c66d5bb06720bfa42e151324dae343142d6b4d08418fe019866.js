export default function generate(THREE) {
  const root = new THREE.Group();
  
  // Materials - leather: metalness 0.0, roughness 0.7 per quick-reference
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.7,
  });
  
  const cordMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.0,
    roughness: 0.85,
  });
  
  const stitchMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.0,
    roughness: 0.6,
  });
  
  // Dimensions
  const topWidth = 0.28;
  const bottomWidth = 0.07;
  const bodyHeight = 0.52;
  const bodyDepth = 0.032;
  
  // Leather body - tapered triangular pouch shape
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-topWidth / 2, bodyHeight / 2);
  bodyShape.lineTo(topWidth / 2, bodyHeight / 2);
  bodyShape.lineTo(bottomWidth / 2, -bodyHeight / 2);
  bodyShape.lineTo(-bottomWidth / 2, -bodyHeight / 2);
  bodyShape.closePath();
  
  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: bodyDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.004,
    bevelSegments: 2,
    steps: 1,
  });
  
  const body = new THREE.Mesh(bodyGeom, leatherMat);
  root.add(body);
  
  // Stitching along edges - individual dash marks
  const stitchDashLength = 0.012;
  const stitchDashRadius = 0.002;
  const stitchDashGeom = new THREE.CylinderGeometry(stitchDashRadius, stitchDashRadius, stitchDashLength, 6);
  stitchDashGeom.rotateX(Math.PI / 2);
  
  // Left edge stitches
  const leftStart = new THREE.Vector3(-topWidth / 2 + 0.018, bodyHeight / 2 - 0.025, bodyDepth / 2 + 0.001);
  const leftEnd = new THREE.Vector3(-bottomWidth / 2 + 0.012, -bodyHeight / 2 + 0.025, bodyDepth / 2 + 0.001);
  const leftStitchCount = 8;
  
  for (let i = 0; i < leftStitchCount; i++) {
    const t = (i + 0.5) / leftStitchCount;
    const stitch = new THREE.Mesh(stitchDashGeom, stitchMat);
    stitch.position.lerpVectors(leftStart, leftEnd, t);
    const angle = Math.atan2(leftEnd.y - leftStart.y, leftEnd.x - leftStart.x);
    stitch.rotation.z = angle;
    root.add(stitch);
  }
  
  // Right edge stitches
  const rightStart = new THREE.Vector3(topWidth / 2 - 0.018, bodyHeight / 2 - 0.025, bodyDepth / 2 + 0.001);
  const rightEnd = new THREE.Vector3(bottomWidth / 2 - 0.012, -bodyHeight / 2 + 0.025, bodyDepth / 2 + 0.001);
  const rightStitchCount = 8;
  
  for (let i = 0; i < rightStitchCount; i++) {
    const t = (i + 0.5) / rightStitchCount;
    const stitch = new THREE.Mesh(stitchDashGeom, stitchMat);
    stitch.position.lerpVectors(rightStart, rightEnd, t);
    const angle = Math.atan2(rightEnd.y - rightStart.y, rightEnd.x - rightStart.x);
    stitch.rotation.z = angle;
    root.add(stitch);
  }
  
  // Bottom edge stitches
  const bottomStart = new THREE.Vector3(-bottomWidth / 2 + 0.015, -bodyHeight / 2 + 0.02, bodyDepth / 2 + 0.001);
  const bottomEnd = new THREE.Vector3(bottomWidth / 2 - 0.015, -bodyHeight / 2 + 0.02, bodyDepth / 2 + 0.001);
  const bottomStitchCount = 4;
  
  for (let i = 0; i < bottomStitchCount; i++) {
    const t = (i + 0.5) / bottomStitchCount;
    const stitch = new THREE.Mesh(stitchDashGeom, stitchMat);
    stitch.position.lerpVectors(bottomStart, bottomEnd, t);
    root.add(stitch);
  }
  
  // Cord loop - open curve forming a hanging loop
  const loopHeight = 0.20;
  const loopWidth = 0.10;
  const cordRadius = 0.010;
  const attachY = bodyHeight / 2 + 0.01;
  
  const loopPoints = [];
  const loopSegments = 24;
  
  // Start at attachment point, go up and around, end at attachment
  for (let i = 0; i <= loopSegments; i++) {
    const t = i / loopSegments;
    const angle = Math.PI * t;
    
    const x = Math.cos(angle) * loopWidth;
    const y = Math.sin(angle) * loopHeight + attachY;
    
    loopPoints.push(new THREE.Vector3(x, y, 0));
  }
  
  const loopCurve = new THREE.CatmullRomCurve3(loopPoints);
  const loopGeom = new THREE.TubeGeometry(loopCurve, 20, cordRadius, 10, false);
  const loop = new THREE.Mesh(loopGeom, cordMat);
  root.add(loop);
  
  // Knot at attachment point
  const knotGeom = new THREE.SphereGeometry(cordRadius * 1.8, 12, 12);
  const knot = new THREE.Mesh(knotGeom, cordMat);
  knot.position.set(0, attachY - 0.008, bodyDepth / 2);
  root.add(knot);
  
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