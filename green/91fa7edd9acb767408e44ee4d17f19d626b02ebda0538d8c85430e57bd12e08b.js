export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Rose Gold / Copper tone based on reference
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE0B080,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Pendant Body ---
  // The pendant is a curved bar, thicker at the top, tapering slightly.
  // We use a TubeGeometry following a curved path.
  const pathPoints = [
    new THREE.Vector3(-0.15, 0.35, 0),   // Top Left (Chain Attach)
    new THREE.Vector3(-0.10, 0.15, 0.05), // Curve start
    new THREE.Vector3(-0.05, -0.15, 0.10), // Mid curve
    new THREE.Vector3(0.05, -0.35, 0.05),  // Bottom curve
    new THREE.Vector3(0.15, -0.45, 0),     // Bottom Tip
  ];
  
  const curve = new THREE.CatmullRomCurve3(pathPoints);
  // Tubular segments high for smoothness, radial segments for roundness
  const pendantGeom = new THREE.TubeGeometry(curve, 64, 0.045, 16, false);
  const pendant = new THREE.Mesh(pendantGeom, goldMat);
  
  // The top needs to look flat/wider. We can scale the top part of the mesh 
  // or just accept the tube shape. To mimic the flat top cut:
  // We can't easily modify vertices of TubeGeometry without access to attributes.
  // Instead, we can add a flat cap or just rely on the tube.
  // Let's add a small flat box at the top to simulate the cut surface.
  const topCapGeom = new THREE.BoxGeometry(0.12, 0.02, 0.06);
  const topCap = new THREE.Mesh(topCapGeom, goldMat);
  topCap.position.set(-0.15, 0.35, 0);
  topCap.rotation.z = -Math.PI / 6; // Angle to match the path start
  topCap.rotation.y = Math.PI / 8;
  pendant.add(topCap);

  root.add(pendant);

  // --- Chain ---
  // Delicate link chain. We'll create two segments (left and right) going up.
  const linkRadius = 0.012;
  const linkTube = 0.004;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 8, 16);
  
  function createChainSegment(startPos, directionUp, count) {
    const chainGroup = new THREE.Group();
    let currentPos = startPos.clone();
    
    for (let i = 0; i < count; i++) {
      const link = new THREE.Mesh(linkGeom, goldMat);
      // Position link
      link.position.copy(currentPos);
      
      // Orient link: alternate rotation to form a chain
      // Even links: one orientation, Odd links: rotated 90 deg
      if (i % 2 === 0) {
        link.rotation.y = Math.PI / 2; 
        link.rotation.z = Math.PI / 2;
      } else {
        link.rotation.x = Math.PI / 2;
      }
      
      chainGroup.add(link);
      
      // Move position for next link
      // Chain goes generally UP (positive Y)
      currentPos.y += linkRadius * 1.6; 
      // Slight sway for natural look (deterministic)
      currentPos.x += Math.sin(i * 0.5) * 0.005;
    }
    return chainGroup;
  }

  // Left Chain Segment
  const leftChainStart = new THREE.Vector3(-0.15, 0.35, 0);
  const leftChain = createChainSegment(leftChainStart, new THREE.Vector3(0, 1, 0), 12);
  // Tilt the whole left chain slightly outwards
  leftChain.rotation.z = 0.3;
  leftChain.position.x -= 0.05; 
  root.add(leftChain);

  // Right Chain Segment
  // The right chain attaches near the top cap area, but visually in the reference
  // the chain seems to come from behind or the side. 
  // Let's attach it to the other side of the top cap.
  const rightChainStart = new THREE.Vector3(-0.10, 0.38, 0.05); 
  const rightChain = createChainSegment(rightChainStart, new THREE.Vector3(0, 1, 0), 12);
  rightChain.rotation.z = -0.3;
  rightChain.position.x += 0.15;
  rightChain.position.z += 0.05;
  root.add(rightChain);

  // Normalize to fit unit cube
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