export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Gold: Following "Metal Brightness" handbook. 
  // Metalness capped at 0.4, emissive used to lift brightness in dim render.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE8C84A,
    metalness: 0.4,
    roughness: 0.3,
    emissive: 0xE8C84A,
    emissiveIntensity: 0.35,
  });

  // Green Gems: Physical material for transmission/glass look.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x008040,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
    emissive: 0x004422,
    emissiveIntensity: 0.4,
  });

  // --- Constants ---
  const RAY_COUNT = 16;
  const RAY_LENGTH = 0.38;
  const RAY_BASE_RADIUS = 0.035;
  const RAY_TIP_RADIUS = 0.005;
  const BEZEL_RADIUS = 0.115;
  const SMALL_GEM_RADIUS = 0.022;
  const CENTER_GEM_RADIUS = 0.045;
  const SMALL_GEM_ORBIT = 0.065;

  // --- Backing Plate ---
  // A simple disk to close the back of the brooch.
  const backingGeom = new THREE.CylinderGeometry(BEZEL_RADIUS + 0.02, BEZEL_RADIUS + 0.02, 0.02, 32);
  const backing = new THREE.Mesh(backingGeom, goldMat);
  backing.rotation.x = Math.PI / 2;
  backing.position.z = -0.02;
  root.add(backing);

  // --- Sunburst Rays ---
  // 16 tapered rays radiating in the XY plane.
  const rayGeom = new THREE.CylinderGeometry(RAY_TIP_RADIUS, RAY_BASE_RADIUS, RAY_LENGTH, 9);
  // Flatten the cylinder to give it a rounded-bar profile (scale Y)
  // We will scale the mesh, not the geometry, to keep geometry reusable if needed.
  
  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    const ray = new THREE.Mesh(rayGeom, goldMat);
    
    // Position: Center of the ray is at half length from origin
    const dist = RAY_LENGTH / 2 + BEZEL_RADIUS; 
    // Actually, rays start from behind the bezel. 
    // Let's position the base of the ray at the bezel edge.
    // Cylinder center is at 0,0,0 locally. Height is RAY_LENGTH.
    // So we move it out by RAY_LENGTH/2 + overlap.
    
    const rayDist = RAY_LENGTH / 2 + 0.08; // Overlap slightly with center cluster
    
    ray.position.set(Math.cos(angle) * rayDist, Math.sin(angle) * rayDist, 0);
    ray.rotation.z = angle;
    ray.rotation.y = Math.PI / 2; // Tip the cylinder flat into XY plane? 
    // Cylinder default axis is Y. We want it lying in XY plane, pointing radially.
    // If we rotate Z by `angle`, the Y axis points radially. 
    // So we need the cylinder's Y axis to align with the radial vector.
    // Default Cylinder is vertical (Y). Rotating Z by `angle` makes it point at `angle`.
    // But we also need to flatten it. The "top" of the ray should face +Z (camera).
    // Default Cylinder top is +Y. After Z rotation, top is still "up" relative to the ray.
    // We need to rotate X by 90 deg to lay it flat? 
    // Let's visualize: Cylinder stands up. Rotate Z=45. It leans. 
    // We want it flat on the "floor" (XY plane). So Rotate X = 90 (PI/2).
    // Then Rotate Z = angle to spin it around.
    
    ray.rotation.x = Math.PI / 2; 
    ray.rotation.z = angle;
    
    // Flatten Y to make it a rounded bar, not a pipe.
    ray.scale.set(1, 0.35, 1);
    
    root.add(ray);
  }

  // --- Center Bezel ---
  // A gold ring holding the gems.
  const bezelGeom = new THREE.TorusGeometry(BEZEL_RADIUS, 0.018, 16, 32);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  bezel.rotation.x = Math.PI / 2; // Face camera
  root.add(bezel);

  // Inner bezel floor (small disk behind gems)
  const innerFloorGeom = new THREE.CylinderGeometry(BEZEL_RADIUS - 0.02, BEZEL_RADIUS - 0.02, 0.01, 32);
  const innerFloor = new THREE.Mesh(innerFloorGeom, goldMat);
  innerFloor.rotation.x = Math.PI / 2;
  innerFloor.position.z = 0.005;
  root.add(innerFloor);

  // --- Center Gem ---
  // Large central emerald-cut or round gem. Using Icosahedron for facets.
  const centerGemGeom = new THREE.IcosahedronGeometry(CENTER_GEM_RADIUS, 0);
  const centerGem = new THREE.Mesh(centerGemGeom, gemMat);
  centerGem.position.z = 0.04; // Sit on top of floor
  root.add(centerGem);

  // --- Surrounding Gems ---
  // 8 smaller gems in a circle.
  const smallGemGeom = new THREE.IcosahedronGeometry(SMALL_GEM_RADIUS, 0);
  const SMALL_GEM_COUNT = 8;

  for (let i = 0; i < SMALL_GEM_COUNT; i++) {
    const angle = (i / SMALL_GEM_COUNT) * Math.PI * 2 + (Math.PI / SMALL_GEM_COUNT); // Offset slightly
    const gem = new THREE.Mesh(smallGemGeom, gemMat);
    
    gem.position.set(
      Math.cos(angle) * SMALL_GEM_ORBIT,
      Math.sin(angle) * SMALL_GEM_ORBIT,
      0.04
    );
    
    // Orient gem to face camera roughly, or just leave spherical-ish
    gem.lookAt(0, 0, 1);
    
    root.add(gem);
  }

  // --- Pin Clasp (Hint) ---
  // A small loop on the back to suggest functionality, partially visible in reference.
  const claspGeom = new THREE.TorusGeometry(0.04, 0.008, 8, 16);
  const clasp = new THREE.Mesh(claspGeom, goldMat);
  clasp.position.set(0.15, 0, -0.03);
  clasp.rotation.y = Math.PI / 2;
  root.add(clasp);

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