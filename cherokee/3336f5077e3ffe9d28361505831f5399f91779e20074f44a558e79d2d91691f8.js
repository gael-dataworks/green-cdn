export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver: high metalness (capped at 0.6), low roughness, silver color.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry: Chain Link ---
  // A torus scaled on one axis to create an oval link.
  // radius: distance from center to tube center.
  // tube: thickness of the wire.
  const linkRadius = 0.018;
  const linkTube = 0.0035;
  const linkGeomBase = new THREE.TorusGeometry(linkRadius, linkTube, 16, 32);
  
  // Scale to make it oval (elongated along X)
  linkGeomBase.scale(2.2, 1, 1); 

  // --- Chain Path Definition ---
  // Define a catenary-like curve for the draped necklace.
  // Y is up, Z is depth, X is width.
  const curvePoints = [
    new THREE.Vector3(-0.45, 0.35, -0.15), // Left high
    new THREE.Vector3(-0.25, -0.25, 0.15), // Left dip
    new THREE.Vector3(0.00, -0.35, 0.25),  // Center low
    new THREE.Vector3(0.25, -0.25, 0.15),  // Right dip
    new THREE.Vector3(0.45, 0.35, -0.15),  // Right high
  ];
  const chainCurve = new THREE.CatmullRomCurve3(curvePoints);
  const chainCurvePoints = chainCurve.getSpacedPoints(60);

  // --- Link Placement ---
  // We use two groups of meshes to handle the alternating 90-degree rotation
  // required for interlocking links, as InstancedMesh requires identical rotation per instance.
  // However, for simplicity and robustness with ~60 objects, standard Meshes in a loop are fine.
  
  const linkCount = 55;
  const step = 1 / (linkCount - 1);

  for (let i = 0; i < linkCount; i++) {
    const t = i * step;
    const position = chainCurve.getPoint(t);
    const tangent = chainCurve.getTangent(t);
    
    const link = new THREE.Mesh(linkGeomBase, silverMat);
    link.position.copy(position);

    // Align link to the curve
    // Default torus lies in XY plane (normal Z). We want the link plane to be perpendicular to the tangent.
    // So the normal of the link (local Z) should align with the tangent.
    
    // Create a lookAt target
    const target = position.clone().add(tangent);
    link.lookAt(target);
    
    // Interlocking logic:
    // Every second link needs to be rotated 90 degrees around the tangent (local Z after lookAt)
    // to interlock with the previous one.
    if (i % 2 !== 0) {
      link.rotateZ(Math.PI / 2);
    }

    root.add(link);
  }

  // --- Clasp (Lobster Clasp Approximation) ---
  // Placed at the start of the chain (left side in our curve definition)
  const claspGroup = new THREE.Group();
  const startPos = chainCurvePoints[0];
  const secondPos = chainCurvePoints[1];
  const startTangent = new THREE.Vector3().subVectors(secondPos, startPos).normalize();
  
  claspGroup.position.copy(startPos);
  claspGroup.lookAt(secondPos);
  
  // Clasp Body: A curved tube segment
  // We approximate the hook shape with a few primitives
  const claspMat = silverMat;
  
  // Main body of clasp (slightly thicker than chain)
  const claspBodyGeom = new THREE.CylinderGeometry(0.005, 0.006, 0.04, 16);
  claspBodyGeom.rotateX(Math.PI / 2); // Align cylinder along Z (forward)
  const claspBody = new THREE.Mesh(claspBodyGeom, claspMat);
  claspBody.position.z = 0.02;
  claspGroup.add(claspBody);

  // The Hook (curved part)
  // Use a torus segment
  const hookGeom = new THREE.TorusGeometry(0.008, 0.0035, 8, 16, Math.PI * 0.8);
  const hook = new THREE.Mesh(hookGeom, claspMat);
  hook.position.set(0, 0.008, 0.035);
  hook.rotation.x = Math.PI / 2; // Lay flat
  hook.rotation.y = Math.PI; // Face back
  claspGroup.add(hook);

  // The Lever (trigger)
  const leverGeom = new THREE.BoxGeometry(0.004, 0.015, 0.002);
  const lever = new THREE.Mesh(leverGeom, claspMat);
  lever.position.set(0, 0.012, 0.015);
  lever.rotation.x = 0.3;
  claspGroup.add(lever);

  // Spring cover / base
  const baseGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.015, 16);
  baseGeom.rotateX(Math.PI / 2);
  const base = new THREE.Mesh(baseGeom, claspMat);
  base.position.z = 0.005;
  claspGroup.add(base);

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