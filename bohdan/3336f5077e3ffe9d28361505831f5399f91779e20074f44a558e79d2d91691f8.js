export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Silver metal: bright, polished. Using emissive to lift brightness as per handbook.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd6dadf,
    metalness: 0.25,
    roughness: 0.32,
    emissive: 0xd6dadf,
    emissiveIntensity: 0.40,
  });

  // --- Geometry: Oval Link ---
  // A torus scaled to be an oval.
  // Torus lies in XY plane by default.
  const linkRadius = 0.018;
  const linkTube = 0.0035;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 12, 24);
  // Scale X to make it an oval (paperclip shape)
  linkGeom.scale(1.6, 1, 1);

  // --- Chain Path ---
  // A gentle U-shape drape.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.35, 0.25, 0.1),
    new THREE.Vector3(-0.15, -0.15, 0.2),
    new THREE.Vector3(0.0, -0.25, 0.2),
    new THREE.Vector3(0.15, -0.15, 0.2),
    new THREE.Vector3(0.35, 0.25, 0.1),
  ]);

  const linkCount = 32;
  const chainGroup = new THREE.Group();

  for (let i = 0; i < linkCount; i++) {
    const t = i / (linkCount - 1);
    const pos = curve.getPoint(t);
    const tangent = curve.getTangent(t);

    const link = new THREE.Mesh(linkGeom, silverMat);
    link.position.copy(pos);

    // Orientation logic:
    // 1. Align link normal perpendicular to the chain path.
    // 2. Alternate rotation around the tangent to interlock links.
    
    // Calculate a normal vector perpendicular to tangent and global Up (0,1,0)
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
    
    // If tangent is vertical, cross product is zero, fallback to X axis
    if (normal.lengthSq() < 0.001) {
      normal.set(1, 0, 0);
    }

    // Orient the mesh so its local Z (Torus normal) points along 'normal'
    // lookAt points +Z to the target.
    link.lookAt(pos.clone().add(normal));

    // Rotate around local Z (the normal we just aligned) by 90deg for alternating links
    // This simulates the interlocking nature (one flat, one on edge relative to the curve plane)
    if (i % 2 === 1) {
      link.rotateZ(Math.PI / 2);
    }

    chainGroup.add(link);
  }

  root.add(chainGroup);

  // --- Clasp (Lobster Clasp Approximation) ---
  // Placed at the start of the chain (t=0)
  const claspGroup = new THREE.Group();
  const startPos = curve.getPoint(0);
  const startTangent = curve.getTangent(0);
  
  claspGroup.position.copy(startPos);
  // Align clasp group with chain direction
  const claspUp = new THREE.Vector3(0, 1, 0);
  const claspNormal = new THREE.Vector3().crossVectors(startTangent, claspUp).normalize();
  if (claspNormal.lengthSq() < 0.001) claspNormal.set(1, 0, 0);
  
  // Create a dummy target to align the group
  const dummyTarget = startPos.clone().add(claspNormal);
  claspGroup.lookAt(dummyTarget);
  // Adjust so the clasp extends backwards from the first link
  claspGroup.rotateY(Math.PI); 

  // Clasp Body (Curved Hook)
  // A tube curving back towards the chain
  const hookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0.04),
    new THREE.Vector3(0.02, 0, 0.06),
    new THREE.Vector3(0.04, 0, 0.04),
    new THREE.Vector3(0.03, 0, 0.02),
  ]);
  const hookGeom = new THREE.TubeGeometry(hookPath, 16, 0.0035, 8, false);
  const hook = new THREE.Mesh(hookGeom, silverMat);
  claspGroup.add(hook);

  // Clasp Trigger/Lever (Small box on the hook)
  const leverGeom = new THREE.BoxGeometry(0.004, 0.012, 0.004);
  const lever = new THREE.Mesh(leverGeom, silverMat);
  lever.position.set(0.02, 0, 0.05);
  lever.rotation.z = -0.5;
  claspGroup.add(lever);

  // Clasp Ring (The small circle the hook attaches to)
  const ringGeom = new THREE.TorusGeometry(0.006, 0.0025, 8, 16);
  const ring = new THREE.Mesh(ringGeom, silverMat);
  ring.position.set(0, 0, -0.015);
  ring.rotation.y = Math.PI / 2;
  claspGroup.add(ring);

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