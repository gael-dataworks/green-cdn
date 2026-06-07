export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold material: High metalness, low roughness. 
  // Using emissive to ensure brightness in the lack of environment map.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xd4af37,
    emissiveIntensity: 0.4,
  });

  // --- Pendant ---
  // A smooth, tapered-looking curved bar. 
  // Modeled as a TubeGeometry following a CatmullRomCurve3.
  const pendantCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.14, 0.28, 0),   // Top Left attachment
    new THREE.Vector3(-0.10, 0.10, 0),   // Mid Left
    new THREE.Vector3(-0.05, -0.15, 0),  // Lower Left
    new THREE.Vector3(0.00, -0.38, 0),   // Bottom Tip
    new THREE.Vector3(0.05, -0.15, 0),   // Lower Right
    new THREE.Vector3(0.10, 0.10, 0),    // Mid Right
    new THREE.Vector3(0.14, 0.28, 0),    // Top Right attachment
  ]);

  // TubeGeometry(path, tubularSegments, radius, radialSegments, closed)
  // Radius 0.035 gives a substantial bar feel.
  const pendantGeom = new THREE.TubeGeometry(pendantCurve, 64, 0.035, 16, false);
  const pendant = new THREE.Mesh(pendantGeom, goldMat);
  root.add(pendant);

  // --- Chain ---
  // Delicate chain links extending upwards from the pendant tops.
  // We only model the visible segments near the pendant.
  const linkGeom = new THREE.TorusGeometry(0.022, 0.005, 8, 16);
  
  function addChainSegment(startX, startY, startZ, count, directionX, directionY) {
    let cx = startX;
    let cy = startY;
    let cz = startZ;
    
    for (let i = 0; i < count; i++) {
      const link = new THREE.Mesh(linkGeom, goldMat);
      
      // Alternate rotation for interlocking links
      // Even links: flat in XY plane (rotation.z = 0)
      // Odd links: flat in YZ plane (rotation.z = Math.PI/2) - wait, torus is XY by default.
      // To interlock in a vertical chain:
      // Link 1: XY plane (facing Z)
      // Link 2: YZ plane (facing X) -> rotate X by 90
      // Link 3: XY plane
      // Link 4: YZ plane
      
      if (i % 2 === 0) {
        link.rotation.x = 0; 
        link.rotation.y = 0;
        link.rotation.z = 0;
      } else {
        link.rotation.x = Math.PI / 2;
        link.rotation.y = 0;
        link.rotation.z = 0;
      }

      // Step position upwards and slightly outwards to simulate hanging
      cx += directionX * 0.035;
      cy += directionY * 0.035;
      
      link.position.set(cx, cy, cz);
      root.add(link);
    }
  }

  // Left chain segment (going up and left)
  addChainSegment(-0.14, 0.28, 0, 6, -0.03, 0.08);

  // Right chain segment (going up and right)
  addChainSegment(0.14, 0.28, 0, 6, 0.03, 0.08);

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