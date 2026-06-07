export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Copper/Bronze body: Warm reddish-brown metal.
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xb85c38,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Reflector interior: Gold/Brass for warm light reflection.
  const reflectorMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Emitter: Glowing warm white LED.
  const emitterMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffaa00,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.5,
  });

  // Screw details: Darker, oxidized metal.
  const screwMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    metalness: 0.5,
    roughness: 0.6,
  });

  // --- Geometry & Meshes ---

  // 1. Main Body: Large sphere.
  const bodyGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  root.add(body);

  // 2. Front Face Assembly
  const frontGroup = new THREE.Group();
  root.add(frontGroup);

  // Position the whole front assembly slightly forward to sit on the sphere surface
  // Sphere radius is 0.5. We want the face at roughly z=0.45 to 0.5.
  const faceZ = 0.46;
  frontGroup.position.set(0, 0, faceZ);

  // 2a. Face Plate Ring: The copper ring surrounding the light.
  // Inner radius matches reflector back, outer radius defines the face size.
  const ringGeom = new THREE.RingGeometry(0.24, 0.36, 32);
  const facePlate = new THREE.Mesh(ringGeom, bodyMat);
  // RingGeometry is in XY plane, facing Z. Perfect.
  facePlate.position.z = 0.02; // Slightly forward of the group pivot
  frontGroup.add(facePlate);

  // 2b. Reflector: Tapered cylinder (cone frustum) pointing forward (+Z).
  // CylinderGeometry(radiusTop, radiusBottom, height, segments)
  // We want narrow at front (top), wide at back (bottom).
  // Default Cylinder is Y-up. Rotate X by -PI/2 to face Z.
  const reflectorGeom = new THREE.CylinderGeometry(0.08, 0.23, 0.14, 32);
  const reflector = new THREE.Mesh(reflectorGeom, reflectorMat);
  reflector.rotation.x = -Math.PI / 2;
  // Position it so the wide end is behind the ring, narrow end at the ring plane.
  reflector.position.z = -0.07; 
  frontGroup.add(reflector);

  // 2c. Emitter/LED: Glowing sphere at the narrow end of the reflector.
  const emitterGeom = new THREE.SphereGeometry(0.06, 16, 16);
  const emitter = new THREE.Mesh(emitterGeom, emitterMat);
  emitter.position.z = 0.02; // At the opening
  frontGroup.add(emitter);

  // 2d. Screws: Small cylinders at 12 and 6 o'clock on the face plate.
  const screwGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
  
  const screwTop = new THREE.Mesh(screwGeom, screwMat);
  screwTop.rotation.x = -Math.PI / 2; // Face Z
  screwTop.position.set(0, 0.30, 0.02);
  frontGroup.add(screwTop);

  const screwBottom = new THREE.Mesh(screwGeom, screwMat);
  screwBottom.rotation.x = -Math.PI / 2; // Face Z
  screwBottom.position.set(0, -0.30, 0.02);
  frontGroup.add(screwBottom);

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