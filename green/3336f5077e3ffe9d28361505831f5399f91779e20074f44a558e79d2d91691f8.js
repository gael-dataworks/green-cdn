export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver / white metal
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry ---
  // Base link geometry: A torus that we will scale to become an oval "paperclip" link.
  // Radius 0.018, Tube 0.004. We will scale X by ~2.2 to elongate it.
  const linkGeom = new THREE.TorusGeometry(0.018, 0.004, 12, 24);

  // --- Chain Configuration ---
  const linkCount = 42;
  const linkLengthScale = 2.4; // Stretch factor to make oval
  const linkGap = 0.001;       // Tiny gap between links

  // --- Path Definition (CatmullRomCurve3) ---
  // Defines the spine of the necklace. Y is up, Z is forward, X is width.
  // Shape: A loose loop on the right, tail extending to the left.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.25, -0.15), // Tail start (left, high)
    new THREE.Vector3(-0.15, 0.05, 0.05),  // Dropping down
    new THREE.Vector3(0.05, -0.10, 0.25),  // Bottom center
    new THREE.Vector3(0.30, 0.00, 0.20),   // Rising right
    new THREE.Vector3(0.40, 0.20, 0.05),   // Top right
    new THREE.Vector3(0.25, 0.30, -0.10),  // Loop back
    new THREE.Vector3(0.10, 0.28, -0.15),  // End of loop
  ]);

  // --- Instanced Chain Links ---
  // Using InstancedMesh for the repeated links to keep draw calls low.
  const chainMesh = new THREE.InstancedMesh(linkGeom, silverMat, linkCount);
  const dummy = new THREE.Object3D();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();

  for (let i = 0; i < linkCount; i++) {
    // Calculate position along the curve (0 to 1)
    const t = i / (linkCount - 1);
    const point = curve.getPoint(t);
    
    // Calculate orientation (tangent)
    const nextT = Math.min(1, t + 0.01);
    const nextPoint = curve.getPoint(nextT);
    tangent.subVectors(nextPoint, point).normalize();

    // Set position
    dummy.position.copy(point);

    // Set rotation to look along the curve
    dummy.lookAt(nextPoint);
    
    // Apply the "oval" scale. 
    // Torus is in XY plane by default. LookAt aligns Z to tangent.
    // We want the long axis of the oval to align with the tangent (Z in local space after lookAt).
    // So we scale Z.
    dummy.scale.set(1, 1, linkLengthScale);

    // CRITICAL: Interlocking Logic
    // Chain links alternate orientation by 90 degrees around the tangent axis.
    // Since lookAt aligns local Z to tangent, we rotate around Z.
    if (i % 2 === 0) {
      dummy.rotateZ(Math.PI / 2);
    }
    
    // Slight offset to ensure they touch but don't intersect too deeply
    // This is a simplification; perfect physical interlocking is complex.
    // We rely on the tube thickness and gap to look natural.
    
    dummy.updateMatrix();
    chainMesh.setMatrixAt(i, dummy.matrix);
  }

  root.add(chainMesh);

  // --- Clasp ---
  // A small hook/loop at the start of the chain (index 0).
  // Modeled as a small torus segment or bent tube.
  const claspGroup = new THREE.Group();
  
  // Clasp base ring
  const claspRingGeom = new THREE.TorusGeometry(0.008, 0.0035, 8, 16);
  const claspRing = new THREE.Mesh(claspRingGeom, silverMat);
  
  // Position at the start of the chain
  const startPos = curve.getPoint(0);
  const endPos = curve.getPoint(0.05);
  claspRing.position.copy(startPos);
  claspRing.lookAt(endPos);
  claspRing.scale.set(1, 1, 1.5); // Slightly elongated
  claspRing.rotateZ(Math.PI / 2); // Orient like the first link
  
  // Clasp hook (simple bent cylinder approximation)
  const hookGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.025, 8);
  const hook = new THREE.Mesh(hookGeom, silverMat);
  hook.position.copy(startPos);
  hook.lookAt(endPos);
  hook.translateZ(0.015); // Move to end of cylinder
  hook.rotateX(-Math.PI / 2); // Bend it
  hook.rotateZ(Math.PI / 4);  // Angle it like a hook

  claspGroup.add(claspRing);
  claspGroup.add(hook);
  root.add(claspGroup);

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