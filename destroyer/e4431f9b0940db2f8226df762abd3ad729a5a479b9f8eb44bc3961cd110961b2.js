export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver metal (Blade, Guard, Pommel)
  // Using emissive to compensate for lack of environment map reflections
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0xd4d4d4,
    emissiveIntensity: 0.35,
  });

  // Dark groove/emblem material
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.5,
    roughness: 0.4,
  });

  // Blue faceted grip (Glass/Enamel look)
  const gripMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a80,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Blade ---
  // Using a 4-sided cone (pyramid) flattened to create a diamond-cross-section blade
  // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)
  // radiusTop=0 makes it a cone. radialSegments=4 makes it a pyramid.
  const bladeGeom = new THREE.CylinderGeometry(0, 0.055, 0.65, 4);
  const blade = new THREE.Mesh(bladeGeom, metalMat);
  // Rotate to point along +Z. Default cylinder is Y-up.
  // Rotate X 90 deg -> points +Y. Rotate Z 90 deg -> points +Z.
  blade.rotation.x = Math.PI / 2;
  blade.rotation.z = Math.PI / 2;
  // Position so base is near Z=0 and tip is at Z=0.65
  // Cylinder center is at 0. Base is at -height/2.
  // We want base at Z=0. So shift by +height/2 = 0.325.
  blade.position.z = 0.325;
  // Flatten the blade (scale Y) to make it thin
  blade.scale.y = 0.15; 
  root.add(blade);

  // --- Fuller (Central Groove) ---
  // Thin dark box running down the center of the blade
  const fullerGeom = new THREE.BoxGeometry(0.025, 0.002, 0.45);
  const fuller = new THREE.Mesh(fullerGeom, darkMetalMat);
  // Position slightly above the blade surface to avoid z-fighting and simulate shadow
  // Blade half-thickness is roughly 0.055 * 0.15 / 2 ~ 0.004.
  // Place fuller at Y = 0.005
  fuller.position.set(0, 0.005, 0.35);
  // Align with blade rotation
  fuller.rotation.x = Math.PI / 2;
  fuller.rotation.z = Math.PI / 2;
  root.add(fuller);

  // --- Emblem (Ricasso detail) ---
  // Small etched mark near the guard
  const emblemGeom = new THREE.BoxGeometry(0.03, 0.002, 0.04);
  const emblem = new THREE.Mesh(emblemGeom, darkMetalMat);
  emblem.position.set(0, 0.005, 0.08);
  emblem.rotation.x = Math.PI / 2;
  emblem.rotation.z = Math.PI / 2;
  root.add(emblem);

  // --- Guard (Crossguard) ---
  // Oval torus ring
  const guardGeom = new THREE.TorusGeometry(0.11, 0.018, 16, 32);
  const guard = new THREE.Mesh(guardGeom, metalMat);
  // Torus lies in XY plane by default, which is correct for a guard on a Z-axis sword
  // Scale X to make it oval (wider than tall)
  guard.scale.x = 1.6;
  guard.position.z = 0.0;
  root.add(guard);

  // --- Grip (Handle) ---
  // Faceted cylinder
  const gripGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8);
  const grip = new THREE.Mesh(gripGeom, gripMat);
  // Rotate to align with Z axis
  grip.rotation.x = Math.PI / 2;
  // Position behind the guard
  // Guard is at Z=0. Grip should start around Z=-0.05 and end at Z=-0.21
  grip.position.z = -0.13;
  root.add(grip);

  // --- Pommel ---
  // Spherical end cap
  const pommelGeom = new THREE.SphereGeometry(0.045, 24, 24);
  const pommel = new THREE.Mesh(pommelGeom, metalMat);
  // Position at the end of the grip
  pommel.position.z = -0.22;
  root.add(pommel);

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