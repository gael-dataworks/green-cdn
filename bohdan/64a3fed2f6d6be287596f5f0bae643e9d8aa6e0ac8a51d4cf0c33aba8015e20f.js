export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold Material
  // Capped metalness at 0.6 to prevent blackness without environment map.
  // Emissive added to simulate brightness/reflections.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE5C068,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xE5C068,
    emissiveIntensity: 0.35,
  });

  // Link Geometry: Stadium shape (rounded rectangle)
  // Defined in XZ plane so long axis is X, flat on ground initially.
  const linkLength = 0.85;
  const linkWidth = 0.24;
  const tubeRadius = 0.055;
  
  const halfL = linkLength / 2;
  const halfW = linkWidth / 2;

  // Control points for a rounded rectangle in XZ plane
  const points = [
    new THREE.Vector3(-halfL, 0, -halfW),
    new THREE.Vector3(halfL, 0, -halfW),
    new THREE.Vector3(halfL, 0, halfW),
    new THREE.Vector3(-halfL, 0, halfW),
  ];

  // Centripetal tension prevents loops at sharp corners, creating smooth rounded ends
  const linkCurve = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5);
  
  // TubeGeometry for the link
  // 48 segments along length, 12 radial for smoothness
  const linkGeom = new THREE.TubeGeometry(linkCurve, 48, tubeRadius, 12, true);

  // Bracelet Configuration
  const numLinks = 12;
  const braceletRadius = 1.4;

  // Use InstancedMesh for repeated links (Rule 9)
  const instancedMesh = new THREE.InstancedMesh(linkGeom, goldMat, numLinks);
  
  const _position = new THREE.Vector3();
  const _quaternion = new THREE.Quaternion();
  const _scale = new THREE.Vector3(1, 1, 1);
  const _matrix = new THREE.Matrix4();
  
  // Precompute quaternions for rotation logic
  const _qY = new THREE.Quaternion();
  const _qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

  for (let i = 0; i < numLinks; i++) {
    const angle = (i / numLinks) * Math.PI * 2;
    
    // Position on the circle (XZ plane)
    _position.set(
      Math.sin(angle) * braceletRadius,
      0,
      Math.cos(angle) * braceletRadius
    );
    
    // Base rotation to align long axis with tangent (around Y)
    // At angle=0 (Z+), tangent is +X. Rotation Y = 0.
    // At angle=90 (X+), tangent is -Z. Rotation Y = -90.
    _qY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle);
    
    // Copy base rotation
    _quaternion.copy(_qY);
    
    // Alternate orientation for interlocking paperclip style
    // Even links: Flat (XZ plane) - Default
    // Odd links: Vertical (XY plane) - Rotate 90 deg around Local X (Tangent)
    if (i % 2 !== 0) {
      _quaternion.multiply(_qX);
    }
    
    _matrix.compose(_position, _quaternion, _scale);
    instancedMesh.setMatrixAt(i, _matrix);
  }

  root.add(instancedMesh);

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