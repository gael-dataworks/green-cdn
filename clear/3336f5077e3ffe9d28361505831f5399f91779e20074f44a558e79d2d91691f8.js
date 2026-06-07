export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Polished Silver ---
  // Rule: metalness <= 0.6 for metals without env map to avoid blackness.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xC0C0C0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry: Single Oval Link ---
  // Using TubeGeometry along an EllipseCurve for a clean oval shape.
  // Link dimensions: length ~0.05, width ~0.025, thickness ~0.004
  const linkLength = 0.05;
  const linkWidth = 0.025;
  const linkThickness = 0.0045;
  
  // Ellipse in XY plane, centered at 0,0
  const curve2D = new THREE.EllipseCurve(
    0, 0,            // ax, aY
    linkLength / 2,  // xRadius (half length)
    linkWidth / 2,   // yRadius (half width)
    0, 2 * Math.PI,  // aStartAngle, aEndAngle
    false,           // aClockwise
    0                // aRotation
  );
  
  const points2D = curve2D.getPoints(32);
  const points3D = points2D.map(p => new THREE.Vector3(p.x, p.y, 0));
  const path3D = new THREE.CatmullRomCurve3(points3D);
  const linkGeom = new THREE.TubeGeometry(path3D, 32, linkThickness, 8, false);

  // --- Chain Path (The Drape) ---
  // A U-shape with some depth variation to look natural.
  const chainPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.45, 0.15), // Top Left
    new THREE.Vector3(-0.25, 0.10, 0.10),
    new THREE.Vector3(-0.10, -0.25, 0.05),
    new THREE.Vector3( 0.00, -0.35, 0.00), // Bottom Center
    new THREE.Vector3( 0.10, -0.25, -0.05),
    new THREE.Vector3( 0.25, 0.10, -0.10),
    new THREE.Vector3( 0.35, 0.45, -0.15), // Top Right
  ]);

  const linkCount = 55;
  const chainGroup = new THREE.Group();
  
  // We use InstancedMesh for the links to satisfy the "repeated parts" rule
  // and keep draw calls low.
  const chainMesh = new THREE.InstancedMesh(linkGeom, silverMat, linkCount);
  const dummy = new THREE.Object3D();
  const _v1 = new THREE.Vector3();
  const _v2 = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _axis = new THREE.Vector3(0, 0, 1); // Local up for the link geometry

  for (let i = 0; i < linkCount; i++) {
    const t = i / (linkCount - 1);
    const pos = chainPath.getPoint(t);
    const tangent = chainPath.getTangent(t);
    
    // Position the link center
    dummy.position.copy(pos);
    
    // Orientation:
    // The link plane should be perpendicular to the chain direction (tangent).
    // So the link's local Z (normal to the flat ellipse) should align with the tangent.
    // However, our link geometry is in XY plane, so its normal is Z.
    // We want Z to align with Tangent.
    
    // Base rotation to align Z with Tangent
    dummy.lookAt(pos.clone().add(tangent));
    
    // Alternating Twist:
    // To interlock, every other link must be rotated 90 degrees around the tangent (local Z).
    if (i % 2 === 0) {
      dummy.rotateZ(Math.PI / 2);
    }
    // Odd links stay at 0 rotation relative to the lookAt alignment
    
    dummy.updateMatrix();
    chainMesh.setMatrixAt(i, dummy.matrix);
  }
  
  chainGroup.add(chainMesh);
  root.add(chainGroup);

  // --- Clasp (at the start of the chain, index 0) ---
  const claspGroup = new THREE.Group();
  
  // Get position and tangent of the first link to attach clasp
  const startT = 0 / (linkCount - 1);
  const startPos = chainPath.getPoint(startT);
  const startTangent = chainPath.getTangent(startT);
  
  claspGroup.position.copy(startPos);
  claspGroup.lookAt(startPos.clone().add(startTangent));
  // The first link is even (0), so it was rotated Z by 90 deg.
  // We need to match that orientation for the clasp to align.
  claspGroup.rotateZ(Math.PI / 2);

  // 1. Jump Ring (small torus connecting chain to clasp)
  const ringGeom = new THREE.TorusGeometry(0.008, 0.0015, 8, 16);
  const jumpRing = new THREE.Mesh(ringGeom, silverMat);
  jumpRing.rotation.y = Math.PI / 2; // Orient to connect
  jumpRing.position.set(0, -0.015, 0); // Offset slightly from chain start
  claspGroup.add(jumpRing);

  // 2. Lobster Hook Body (curved tube)
  // Define a hook shape: starts at ring, curves up and back
  const hookPoints = [
    new THREE.Vector3(0, -0.015, 0),
    new THREE.Vector3(0, 0.01, 0),
    new THREE.Vector3(0, 0.025, -0.01),
    new THREE.Vector3(0, 0.020, -0.025),
  ];
  const hookPath = new THREE.CatmullRomCurve3(hookPoints);
  const hookGeom = new THREE.TubeGeometry(hookPath, 16, 0.0025, 8, false);
  const hook = new THREE.Mesh(hookGeom, silverMat);
  claspGroup.add(hook);

  // 3. Trigger Lever (small box on the hook)
  const leverGeom = new THREE.BoxGeometry(0.002, 0.012, 0.004);
  const lever = new THREE.Mesh(leverGeom, silverMat);
  lever.position.set(0, 0.015, -0.015);
  lever.rotation.x = -0.5; // Angle it slightly
  claspGroup.add(lever);

  root.add(claspGroup);

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