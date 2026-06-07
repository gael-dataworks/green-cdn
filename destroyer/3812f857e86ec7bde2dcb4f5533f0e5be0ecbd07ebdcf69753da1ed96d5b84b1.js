export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---

  // Iridescent Sphere Material
  // We use a procedural texture to simulate the rainbow reflection since there is no env map.
  // Metalness capped at 0.6 to prevent black rendering.
  const rainbowTexture = createRainbowTexture(THREE);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: rainbowTexture,
    metalness: 0.6,
    roughness: 0.1,
    transmission: 0.1,
    ior: 1.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Silver Cap/Loop Material
  // Polished metal look.
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.2,
  });

  // --- Geometry & Meshes ---

  // 1. Main Sphere Body
  const sphereGeom = new THREE.SphereGeometry(0.5, 32, 32);
  const sphere_body = new THREE.Mesh(sphereGeom, sphereMat);
  root.add(sphere_body);

  // 2. Cap (Base)
  // Faceted cylinder to match the reference shape.
  const capBaseGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.08, 10);
  const cap_base = new THREE.Mesh(capBaseGeom, silverMat);
  cap_base.position.y = 0.54; // 0.5 (sphere radius) + 0.04 (half cap height)
  root.add(cap_base);

  // 3. Cap (Top Neck)
  // Slightly narrower cylinder on top of the base.
  const capTopGeom = new THREE.CylinderGeometry(0.10, 0.14, 0.06, 10);
  const cap_top = new THREE.Mesh(capTopGeom, silverMat);
  cap_top.position.y = 0.54 + 0.04 + 0.03; // base top + half top height
  root.add(cap_top);

  // 4. Hanging Loop
  // Thin torus arc.
  // Torus lies in XY plane by default. We rotate it to stand up in YZ plane.
  const loopGeom = new THREE.TorusGeometry(0.06, 0.006, 8, 16, Math.PI);
  const loop = new THREE.Mesh(loopGeom, silverMat);
  loop.rotation.z = Math.PI / 2; // Stand it up
  loop.position.y = 0.54 + 0.08 + 0.06; // base top + top height + loop radius
  root.add(loop);

  // --- Normalization ---
  fitToUnitCube(THREE, root);

  return root;
}

function createRainbowTexture(THREE) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      
      // Center coordinates
      const cx = u - 0.5;
      const cy = v - 0.5;
      
      // Polar coordinates for swirling effect
      const angle = Math.atan2(cy, cx);
      const dist = Math.sqrt(cx * cx + cy * cy);
      
      // Procedural rainbow noise using sin/cos (deterministic)
      // Combine angle and distance to create bands
      const t = angle * 3 + dist * 20;
      
      const r = Math.floor(128 + 127 * Math.sin(t));
      const g = Math.floor(128 + 127 * Math.sin(t + 2.0));
      const b = Math.floor(128 + 127 * Math.sin(t + 4.0));
      
      const i = (y * size + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255; // Alpha
    }
  }
  
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
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