export default function generate(THREE) {
  // Silver material - brightened with emissive to compensate for lack of env map
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.4,
  });

  const root = new THREE.Group();

  // --- Chain Links ---
  // Use InstancedMesh for the repeating links to save draw calls and ensure consistency.
  // Geometry: Torus scaled on X to create an oval "paperclip" link shape.
  const linkRadius = 0.035;
  const linkTube = 0.007;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 12, 24);
  // Scale X to make it an oval (long axis along X locally)
  linkGeom.scale(2.0, 1.0, 1.0);

  const linkCount = 30;
  const chainMesh = new THREE.InstancedMesh(linkGeom, silverMat, linkCount);
  chainMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  // Define a draped curve for the necklace to follow
  // Symmetric U-shape with some depth
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.45, 0.45, -0.15),
    new THREE.Vector3(-0.35, 0.05, 0.10),
    new THREE.Vector3(-0.15, -0.45, 0.25),
    new THREE.Vector3(0.00, -0.50, 0.30),
    new THREE.Vector3(0.15, -0.45, 0.25),
    new THREE.Vector3(0.35, 0.05, 0.10),
    new THREE.Vector3(0.45, 0.45, -0.15),
  ]);

  const dummy = new THREE.Object3D();
  const _pos = new THREE.Vector3();
  const _tan = new THREE.Vector3();

  for (let i = 0; i < linkCount; i++) {
    // Distribute links along the curve
    const t = i / (linkCount - 1);
    curve.getPoint(t, _pos);
    curve.getTangent(t, _tan);

    dummy.position.copy(_pos);
    // Orient the link so its local X axis (the long axis of the oval) follows the tangent
    // Default Torus is in XY plane, hole along Z. Long axis is X (after scale).
    // We want X to align with Tangent.
    // lookAt aligns Z with target. So we lookAt tangent, then rotate Y -90 to bring X to tangent.
    dummy.lookAt(_pos.clone().add(_tan));
    dummy.rotateY(-Math.PI / 2);

    // Interlocking logic:
    // Alternate links rotate 90 degrees around the tangent (local X) to simulate weaving.
    if (i % 2 !== 0) {
      dummy.rotateX(Math.PI / 2);
    }

    dummy.updateMatrix();
    chainMesh.setMatrixAt(i, dummy.matrix);
  }

  root.add(chainMesh);

  // --- Clasp Assembly (at the end of the chain, t=1) ---
  const claspGroup = new THREE.Group();
  
  // Get end position and tangent
  const endT = 1.0;
  curve.getPoint(endT, _pos);
  curve.getTangent(endT, _tan);

  // 1. Jump Ring (small connecting ring)
  const ringGeom = new THREE.TorusGeometry(0.012, 0.006, 12, 24);
  const jumpRing = new THREE.Mesh(ringGeom, silverMat);
  jumpRing.position.copy(_pos);
  jumpRing.lookAt(_pos.clone().add(_tan));
  jumpRing.rotateY(-Math.PI / 2);
  // Rotate slightly to look attached to the last link
  jumpRing.rotateX(Math.PI / 4); 
  claspGroup.add(jumpRing);

  // 2. Lobster Hook Body (curved torus segment)
  // Arc of PI * 1.5 creates a hook shape
  const hookGeom = new THREE.TorusGeometry(0.014, 0.006, 12, 24, Math.PI * 1.5);
  const hook = new THREE.Mesh(hookGeom, silverMat);
  hook.position.copy(_pos);
  // Orient hook to extend from the chain end
  hook.lookAt(_pos.clone().add(_tan));
  hook.rotateY(-Math.PI / 2);
  // Flip and rotate to curve back towards the chain
  hook.rotateX(Math.PI); 
  hook.rotateZ(Math.PI / 4);
  claspGroup.add(hook);

  // 3. Clasp Lever (small cylinder indicating the spring mechanism)
  const leverGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.025, 8);
  const lever = new THREE.Mesh(leverGeom, silverMat);
  lever.position.copy(_pos);
  lever.lookAt(_pos.clone().add(_tan));
  lever.rotateY(-Math.PI / 2);
  // Position lever along the back of the hook
  lever.translateX(0.015); 
  lever.translateY(0.005);
  lever.rotateZ(-Math.PI / 6);
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