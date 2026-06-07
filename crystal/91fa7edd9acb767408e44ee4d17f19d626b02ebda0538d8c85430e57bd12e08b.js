export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold material: capped metalness for renderer compatibility, emissive for brightness.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE6C288,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xE6C288,
    emissiveIntensity: 0.35,
  });

  // --- Pendant Geometry ---
  // Define the curve for the pendant (stylized horn/tusk shape)
  const pendantCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.00, 0.45, 0.00), // Top attachment point
    new THREE.Vector3(-0.15, 0.20, 0.00), // Curve start
    new THREE.Vector3(-0.25, -0.10, 0.00), // Mid curve
    new THREE.Vector3(-0.15, -0.35, 0.05), // Bottom sweep
    new THREE.Vector3(0.10, -0.45, 0.00), // Bottom tip
  ]);

  // Create tube geometry
  const tubularSegments = 64;
  const radialSegments = 24;
  const baseRadius = 0.055;
  const pendantGeom = new THREE.TubeGeometry(pendantCurve, tubularSegments, baseRadius, radialSegments, false);

  // Taper the tube vertices manually to match the reference (thick top, thin bottom)
  const positions = pendantGeom.attributes.position.array;
  const tempVec = new THREE.Vector3();
  
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    // Taper factor: 1.0 at top (t=0) -> 0.5 at bottom (t=1)
    const scale = 1.0 - t * 0.5; 
    
    // Get the center point of the tube at this segment
    pendantCurve.getPointAt(t, tempVec);

    // Iterate over radial segments for this tubular segment
    for (let j = 0; j < radialSegments; j++) {
      const index = (i * radialSegments + j) * 3;
      
      // Load vertex
      tempVec.set(positions[index], positions[index + 1], positions[index + 2]);
      
      // Vector from center to vertex
      const offset = new THREE.Vector3().subVectors(tempVec, pendantCurve.getPointAt(t, new THREE.Vector3()));
      
      // Scale offset
      offset.multiplyScalar(scale);
      
      // Apply back
      tempVec.copy(pendantCurve.getPointAt(t, new THREE.Vector3())).add(offset);
      
      positions[index] = tempVec.x;
      positions[index + 1] = tempVec.y;
      positions[index + 2] = tempVec.z;
    }
  }
  pendantGeom.attributes.position.needsUpdate = true;
  pendantGeom.computeVertexNormals();

  const pendant = new THREE.Mesh(pendantGeom, goldMat);
  root.add(pendant);

  // --- Chain Geometry ---
  // Create a single link geometry to reuse
  const linkRadius = 0.018;
  const linkTube = 0.006;
  const linkGeom = new THREE.TorusGeometry(linkRadius, linkTube, 12, 24);
  
  // Chain configuration
  const chainLength = 0.6;
  const linksPerSide = 12;
  const linkSpacing = chainLength / linksPerSide;

  // Helper to add a chain link
  function addChainLink(x, y, z, rotX, rotY, rotZ) {
    const link = new THREE.Mesh(linkGeom, goldMat);
    link.position.set(x, y, z);
    link.rotation.set(rotX, rotY, rotZ);
    root.add(link);
  }

  // Generate left chain strand
  const leftStart = new THREE.Vector3(-0.02, 0.45, 0);
  const leftEnd = new THREE.Vector3(-0.35, 0.85, 0.2); // Angled back slightly
  for (let i = 0; i < linksPerSide; i++) {
    const t = i / linksPerSide;
    const pos = new THREE.Vector3().lerpVectors(leftStart, leftEnd, t);
    // Alternate orientation for cable chain effect
    const rotX = (i % 2 === 0) ? 0 : Math.PI / 2;
    const rotY = 0;
    const rotZ = (i % 2 === 0) ? Math.PI / 2 : 0;
    // Add some curve to the chain rotation to follow the path roughly
    const pathAngle = Math.atan2(leftEnd.x - leftStart.x, leftEnd.y - leftStart.y);
    addChainLink(pos.x, pos.y, pos.z, rotX, rotY, rotZ + pathAngle * 0.5);
  }

  // Generate right chain strand
  const rightStart = new THREE.Vector3(0.02, 0.45, 0);
  const rightEnd = new THREE.Vector3(0.35, 0.85, 0.2);
  for (let i = 0; i < linksPerSide; i++) {
    const t = i / linksPerSide;
    const pos = new THREE.Vector3().lerpVectors(rightStart, rightEnd, t);
    const rotX = (i % 2 === 0) ? 0 : Math.PI / 2;
    const rotY = 0;
    const rotZ = (i % 2 === 0) ? Math.PI / 2 : 0;
    const pathAngle = Math.atan2(rightEnd.x - rightStart.x, rightEnd.y - rightStart.y);
    addChainLink(pos.x, pos.y, pos.z, rotX, rotY, rotZ + pathAngle * 0.5);
  }

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