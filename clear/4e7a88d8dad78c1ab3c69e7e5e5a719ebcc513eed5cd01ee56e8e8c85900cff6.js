export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Leather: Dark brown, high roughness, no metalness.
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x4a3021,
    metalness: 0.0,
    roughness: 0.85,
  });

  // Page edges: Off-white/beige, rough.
  const pageMat = new THREE.MeshStandardMaterial({
    color: 0xdcc8b0,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Frayed fiber: Lighter brown/tan.
  const fiberMat = new THREE.MeshStandardMaterial({
    color: 0x8b6f47,
    metalness: 0.0,
    roughness: 0.95,
  });

  // --- Procedural Leather Texture ---
  // Generates grain, scratches, and color variation deterministically.
  function createLeatherTexture() {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    const baseColor = { r: 74, g: 48, b: 33 }; // #4a3021
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        
        // Base noise
        const noise = (Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05 + y * 0.05)) * 10;
        
        // Scratches/Veins (deterministic lines)
        let scratch = 0;
        // Vertical veins
        if (Math.abs(Math.sin(x * 0.03 + y * 0.01)) > 0.98) scratch = -20;
        // Horizontal wear
        if (Math.abs(Math.cos(x * 0.02 + y * 0.04)) > 0.99) scratch = -15;
        // Random speckles (using sin/cos as pseudo-random)
        const speck = (Math.sin(x * 13.5 + y * 27.3) > 0.95) ? -30 : 0;

        let r = baseColor.r + noise + scratch + speck;
        let g = baseColor.g + noise + scratch + speck;
        let b = baseColor.b + noise + scratch + speck;

        // Clamp
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
        data[i + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  const leatherMap = createLeatherTexture();
  leatherMat.map = leatherMap;
  leatherMat.bumpMap = leatherMap;
  leatherMat.bumpScale = 0.002;

  // --- Dimensions ---
  const bookW = 1.1;  // Width (X)
  const bookH = 1.5;  // Height (Y)
  const bookD = 0.35; // Thickness (Z)
  const coverThick = 0.02;

  // --- Core Book Block (Pages) ---
  // Slightly smaller than the cover to allow for the leather wrap
  const coreGeom = new THREE.BoxGeometry(bookW - 0.04, bookH - 0.04, bookD - 0.04);
  const core = new THREE.Mesh(coreGeom, pageMat);
  root.add(core);

  // --- Leather Cover ---
  // We construct the cover from plates to allow for separate spine logic if needed,
  // but a wrapped box approach is cleaner for the main body.
  // Front Cover
  const frontCoverGeom = new THREE.BoxGeometry(bookW, bookH, coverThick);
  const frontCover = new THREE.Mesh(frontCoverGeom, leatherMat);
  frontCover.position.z = bookD / 2 + coverThick / 2;
  root.add(frontCover);

  // Back Cover
  const backCover = new THREE.Mesh(frontCoverGeom, leatherMat);
  backCover.position.z = -(bookD / 2 + coverThick / 2);
  root.add(backCover);

  // Spine (Curved)
  // A cylinder segment or a box with rounded edge. Let's use a cylinder for the spine curve.
  const spineRadius = bookD / 2 + coverThick;
  const spineGeom = new THREE.CylinderGeometry(spineRadius, spineRadius, bookH, 16, 1, false, 0, Math.PI);
  const spine = new THREE.Mesh(spineGeom, leatherMat);
  spine.rotation.y = Math.PI / 2;
  spine.position.set(-bookW / 2 - spineRadius / 2, 0, 0);
  root.add(spine);

  // Spine Bands (Raised hubs)
  const bandCount = 5;
  const bandGeom = new THREE.TorusGeometry(spineRadius + 0.015, 0.008, 8, 16, Math.PI);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0x3a251a, roughness: 0.9, metalness: 0.0 });
  
  for (let i = 0; i < bandCount; i++) {
    const t = (i + 1) / (bandCount + 1);
    const y = (t - 0.5) * (bookH * 0.8);
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.rotation.y = Math.PI / 2;
    band.position.set(-bookW / 2 - spineRadius / 2, y, 0);
    root.add(band);
  }

  // --- Frayed Edges & Corners ---
  // Simulate peeling leather at the corners and edges
  const frayGeom = new THREE.BoxGeometry(0.08, 0.02, 0.04);
  const frayPositions = [
    // Front corners
    { x: bookW/2 - 0.1, y: bookH/2 - 0.1, z: bookD/2, rx: 0, ry: 0, rz: 0.2 },
    { x: bookW/2 - 0.1, y: -bookH/2 + 0.1, z: bookD/2, rx: 0, ry: 0, rz: -0.2 },
    { x: -bookW/2 + 0.1, y: bookH/2 - 0.1, z: bookD/2, rx: 0, ry: 0, rz: 0.1 },
    { x: -bookW/2 + 0.1, y: -bookH/2 + 0.1, z: bookD/2, rx: 0, ry: 0, rz: -0.1 },
    // Back corners (visible due to thickness)
    { x: bookW/2 - 0.1, y: bookH/2 - 0.1, z: -bookD/2, rx: 0, ry: 0, rz: -0.2 },
    { x: bookW/2 - 0.1, y: -bookH/2 + 0.1, z: -bookD/2, rx: 0, ry: 0, rz: 0.2 },
  ];

  frayPositions.forEach((pos, idx) => {
    const fray = new THREE.Mesh(frayGeom, fiberMat);
    fray.position.set(pos.x, pos.y, pos.z);
    fray.rotation.set(pos.rx, pos.ry, pos.rz + (idx % 2) * 0.3);
    root.add(fray);
    
    // Add a "peeling strip"
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.01), fiberMat);
    strip.position.set(pos.x + 0.02, pos.y, pos.z + 0.02);
    strip.rotation.z = pos.rz + 0.5;
    root.add(strip);
  });

  // --- Surface Veins/Scratches (Relief) ---
  // Add a few raised vein lines on the front cover
  const veinCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.2, 0.3, bookD/2 + 0.005),
    new THREE.Vector3(-0.1, 0.1, bookD/2 + 0.005),
    new THREE.Vector3(0.1, -0.2, bookD/2 + 0.005),
    new THREE.Vector3(0.3, -0.4, bookD/2 + 0.005),
  ]);
  const veinGeom = new THREE.TubeGeometry(veinCurve, 20, 0.005, 8, false);
  const vein = new THREE.Mesh(veinGeom, leatherMat);
  root.add(vein);

  const vein2Curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0.4, bookD/2 + 0.005),
    new THREE.Vector3(0.2, 0.2, bookD/2 + 0.005),
    new THREE.Vector3(0.4, 0.0, bookD/2 + 0.005),
  ]);
  const vein2Geom = new THREE.TubeGeometry(vein2Curve, 15, 0.004, 8, false);
  const vein2 = new THREE.Mesh(vein2Geom, leatherMat);
  root.add(vein2);

  // --- Clasp/Latch remnant on spine edge ---
  // Small leather strap stub
  const strapGeom = new THREE.BoxGeometry(0.05, 0.15, 0.02);
  const strap = new THREE.Mesh(strapGeom, leatherMat);
  strap.position.set(-bookW/2 - 0.01, 0, bookD/2 + 0.01);
  strap.rotation.y = Math.PI / 2;
  root.add(strap);

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