export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Ivory/Cream band: matte/satin finish, non-metallic.
  const bandMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e6,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Silver setting: polished metal.
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.2,
  });

  // Purple gem: glassy, translucent.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x6a5acd,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Geometry & Meshes ---

  // 1. Band
  // Torus lies in XY plane by default. We want it standing in XZ plane (Y up).
  // Radius ~0.35, Tube ~0.08 (thick band).
  const bandGeom = new THREE.TorusGeometry(0.35, 0.08, 32, 64);
  const band = new THREE.Mesh(bandGeom, bandMat);
  band.rotation.x = Math.PI / 2; // Stand it up
  root.add(band);

  // 2. Bezel (Setting)
  // Positioned at the top of the band (+Y).
  // Box slightly larger than the gem to act as a holder.
  const bezelSize = 0.14;
  const bezelDepth = 0.05;
  const bezelGeom = new THREE.BoxGeometry(bezelSize, bezelSize, bezelDepth);
  const bezel = new THREE.Mesh(bezelGeom, bezelMat);
  // Position at top of band: center Y + radius + tube_radius - half_bezel_depth
  // Band center is 0,0,0. Top surface is at Y = 0.35 + 0.08 = 0.43.
  // Bezel sits on surface.
  bezel.position.set(0, 0.35 + 0.08 + bezelDepth * 0.2, 0);
  // Align bezel face to be tangent to the ring curve roughly, 
  // but for a small setting on a large ring, facing +Y is acceptable 
  // or slightly tilted. Let's keep it simple facing +Y/Z mix?
  // Actually, on a ring, the setting usually faces outward/upward.
  // Since the band is rotated X=90, the top point normal is +Y.
  // So the bezel box (default facing Z) needs rotation.
  // Default Box faces Z. We want it to face somewhat radially or just sit flat.
  // Let's rotate it to face somewhat outward/up.
  bezel.rotation.x = Math.PI / 2; // Face up
  root.add(bezel);

  // 3. Gem
  // Slightly smaller than bezel, sits inside/on top.
  const gemSize = 0.11;
  const gemDepth = 0.06;
  const gemGeom = new THREE.BoxGeometry(gemSize, gemSize, gemDepth);
  const gem = new THREE.Mesh(gemGeom, gemMat);
  // Position slightly in front of bezel
  gem.position.set(0, 0.35 + 0.08 + bezelDepth + gemDepth * 0.2, 0);
  gem.rotation.x = Math.PI / 2; // Match bezel orientation
  root.add(gem);

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