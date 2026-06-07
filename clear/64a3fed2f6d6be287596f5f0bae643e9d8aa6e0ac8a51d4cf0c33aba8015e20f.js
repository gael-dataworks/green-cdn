export default function generate(THREE) {
  const chainGroup = new THREE.Group();

  // Material: Gold.
  // Per instructions: Metalness capped at 0.6 for metals to avoid black rendering without env map.
  // Color carries the gold shade.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Geometry: Single link.
  // Using TorusGeometry scaled on X to create an oval "paperclip" shape.
  // Default Torus is in XY plane.
  const linkMajorRadius = 0.045;
  const linkTubeRadius = 0.013;
  const linkGeom = new THREE.TorusGeometry(linkMajorRadius, linkTubeRadius, 16, 32);
  
  // Scale X to make it an elongated oval (paperclip style).
  // We apply scale to the geometry or mesh. Scaling mesh is cheaper for instances, 
  // but we need to alternate rotation, so individual meshes are fine.
  // Actually, let's scale the geometry once to bake the oval shape, 
  // then we only rotate/position meshes.
  linkGeom.scale(2.6, 1, 1); 

  const LINK_COUNT = 14;
  const BRACELET_RADIUS = 0.36;

  for (let i = 0; i < LINK_COUNT; i++) {
    const link = new THREE.Mesh(linkGeom, goldMat);
    
    // Angle around the bracelet circle
    const theta = (i / LINK_COUNT) * Math.PI * 2;
    
    // Position on the circle (XZ plane)
    const x = Math.cos(theta) * BRACELET_RADIUS;
    const z = Math.sin(theta) * BRACELET_RADIUS;
    link.position.set(x, 0, z);

    // Orientation
    // We want the long axis of the oval to be tangent to the circle.
    // Tangent angle is theta + 90 degrees (-PI/2).
    // Default Torus is in XY plane, so its "face" normal is Z. 
    // To lie flat in XZ plane, we rotate -90 deg around X.
    // Then rotate around Y to align with tangent.
    
    const tangentAngle = -theta - Math.PI / 2;
    
    if (i % 2 === 0) {
      // Even links: Flat (lying in XZ plane)
      link.rotation.set(-Math.PI / 2, tangentAngle, 0);
    } else {
      // Odd links: Vertical (standing in XY plane, perpendicular to flat links)
      // Start flat, then rotate 90 deg around local Z (which is now tangent) to stand up?
      // Easier: Start with default Torus (XY plane). 
      // Rotate Y to align tangent. 
      // Rotate X 90 deg to stand up (now in YZ plane relative to link, but we want it to interlock).
      // Let's derive from the flat state.
      // Flat state: rotated X -90, Y tangent.
      // Vertical state: Rotate additional 90 deg around the local Long Axis (which is X in local space after scaling).
      // So add Math.PI/2 to X rotation.
      link.rotation.set(-Math.PI / 2 + Math.PI / 2, tangentAngle, 0);
      // Wait, -PI/2 + PI/2 = 0. So Vertical link is just rotation Y = tangent.
      // Default Torus is XY plane. If rotation is (0, tangent, 0), it stands vertically at the tangent angle.
      // This creates the alternating interlock.
    }

    chainGroup.add(link);
  }

  fitToUnitCube(THREE, chainGroup);
  return chainGroup;
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