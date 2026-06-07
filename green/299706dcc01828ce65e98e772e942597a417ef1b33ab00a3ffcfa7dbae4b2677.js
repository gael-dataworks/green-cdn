export default function generate(THREE) {
  // Materials
  // Gold: Capped metalness at 0.6 per rules. Warm gold color.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Gemstone: Physical material for transmission/refraction. Deep emerald green.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x108050,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.9,
    ior: 1.6,
    transparent: true,
  });

  const root = new THREE.Group();

  // Dimensions
  const bandRadius = 0.22;
  const bandTube = 0.035;
  const stoneWidth = 0.16; // Half-width for geometry scaling
  const stoneHeight = 0.13;
  
  // 1. Band (Shank)
  // Torus lies in XY plane by default. This orientation faces +Z.
  const bandGeom = new THREE.TorusGeometry(bandRadius, bandTube, 16, 48);
  const band = new THREE.Mesh(bandGeom, goldMat);
  // Center the band at origin. Top of band is at Y = bandRadius.
  band.position.set(0, 0, 0);
  root.add(band);

  // 2. Bezel Setting
  // Oval torus to match the stone shape.
  const bezelRadius = stoneWidth * 0.9; 
  const bezelTube = 0.025;
  const bezelGeom = new THREE.TorusGeometry(bezelRadius, bezelTube, 16, 48);
  const bezel = new THREE.Mesh(bezelGeom, goldMat);
  // Scale X to make it oval.
  bezel.scale.set(1.5, 1.0, 1.0);
  // Position at top of band.
  bezel.position.set(0, bandRadius, 0);
  root.add(bezel);

  // 3. Gemstone
  // Icosahedron gives good faceting. Scaled to be oval and flat.
  const gemRadius = stoneWidth * 0.85;
  const gemGeom = new THREE.IcosahedronGeometry(gemRadius, 1);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  // Scale to oval shape and flatten Z (depth).
  gem.scale.set(1.5, 1.2, 0.6);
  // Position inside the bezel, slightly raised.
  gem.position.set(0, bandRadius, 0);
  root.add(gem);

  // 4. Gem Pavilion (Bottom part of stone)
  // To make the stone look solid and not just a shell, we can add a slightly smaller
  // inverted cone or pyramid inside, but for a faceted gem, the Icosahedron volume is enough.
  // However, to ensure the bottom looks like a gem and not a sphere, we rely on the faceting.
  // The Icosahedron is convex. A real gem has a pavilion. 
  // Let's add a small inverted cone at the bottom to simulate the pavilion tip.
  const pavilionGeom = new THREE.ConeGeometry(gemRadius * 0.6, gemRadius * 0.8, 8);
  const pavilion = new THREE.Mesh(pavilionGeom, gemMat);
  pavilion.position.set(0, bandRadius - gemRadius * 0.4, 0);
  pavilion.rotation.x = Math.PI; // Point down
  pavilion.scale.set(1.2, 1.0, 1.0); // Match oval slightly
  root.add(pavilion);

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