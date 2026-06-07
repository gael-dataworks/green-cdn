export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  
  // Copper/Reddish Metal Body
  // Following "Metal Brightness" guide: moderate metalness, slight emissive to lift brightness
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xc06040,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xc06040,
    emissiveIntensity: 0.25
  });

  // Silver Reflector (inside the lens)
  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2
  });

  // Dark details (screws/buttons)
  const detailMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.4,
    roughness: 0.6
  });

  // Glowing LED Bulb
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: 0xffaa00,
    emissiveIntensity: 2.5,
    toneMapped: false // Helps keep the glow bright
  });

  // Clear/Translucent Lens Cover (optional, adds realism)
  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    transparent: true,
    ior: 1.5
  });

  // --- Dimensions ---
  const sphereRadius = 0.5;
  const lensRadius = 0.22;
  const lensDepth = 0.12;
  const bulbRadius = 0.06;

  // --- 1. Main Body (Sphere) ---
  // We use a sphere. To simulate the recessed front, we will just place the 
  // lens assembly in front of it. The sphere remains whole.
  const bodyGeom = new THREE.SphereGeometry(sphereRadius, 48, 48);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // --- 2. Front Lens Assembly ---
  const lensGroup = new THREE.Group();
  // Position the group at the front of the sphere, slightly inset
  lensGroup.position.set(0, 0, sphereRadius - 0.02); 
  root.add(lensGroup);

  // 2a. Lens Housing Ring (The reddish rim around the light)
  // Using a Cylinder for the side wall and a Ring for the face to create a recessed look
  const housingOuterR = lensRadius + 0.04;
  const housingInnerR = lensRadius;
  const housingThickness = 0.03;
  
  // The rim face
  const rimGeom = new THREE.RingGeometry(housingInnerR, housingOuterR, 32);
  const rim = new THREE.Mesh(rimGeom, bodyMat);
  rim.rotation.x = Math.PI / 2; // Face forward (Z)
  rim.position.z = 0;
  lensGroup.add(rim);

  // The rim side wall (cylinder segment)
  const wallGeom = new THREE.CylinderGeometry(housingOuterR, housingOuterR, lensDepth, 32, 1, true);
  const wall = new THREE.Mesh(wallGeom, bodyMat);
  wall.rotation.x = Math.PI / 2;
  wall.position.z = -lensDepth / 2;
  lensGroup.add(wall);

  // 2b. Reflector (The shiny cone inside)
  // CylinderGeometry with different radii creates a cone/frustum
  const reflectorTopR = 0.02; // Small opening for the bulb
  const reflectorBottomR = housingInnerR - 0.01;
  const reflectorHeight = lensDepth - 0.01;
  
  const reflectorGeom = new THREE.CylinderGeometry(reflectorTopR, reflectorBottomR, reflectorHeight, 32);
  const reflector = new THREE.Mesh(reflectorGeom, reflectorMat);
  reflector.rotation.x = -Math.PI / 2; // Point forward
  // Position it inside the housing
  reflector.position.z = -reflectorHeight / 2 - 0.01; 
  lensGroup.add(reflector);

  // 2c. LED Bulb (The glowing center)
  const bulbGeom = new THREE.SphereGeometry(bulbRadius, 16, 16);
  const bulb = new THREE.Mesh(bulbGeom, bulbMat);
  // Place at the tip of the reflector
  bulb.position.z = -reflectorHeight + 0.01;
  lensGroup.add(bulb);

  // 2d. Lens Glass (Cover)
  const glassGeom = new THREE.CircleGeometry(housingInnerR - 0.005, 32);
  const glass = new THREE.Mesh(glassGeom, lensGlassMat);
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 0.005; // Slightly in front of the rim
  lensGroup.add(glass);

  // 2e. Screws/Details on the rim
  // Two small cylinders on the top and bottom of the ring
  const screwGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  
  const screwTop = new THREE.Mesh(screwGeom, detailMat);
  screwTop.rotation.x = Math.PI / 2;
  screwTop.position.set(0, housingOuterR - 0.015, 0);
  lensGroup.add(screwTop);

  const screwBottom = new THREE.Mesh(screwGeom, detailMat);
  screwBottom.rotation.x = Math.PI / 2;
  screwBottom.position.set(0, -(housingOuterR - 0.015), 0);
  lensGroup.add(screwBottom);

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