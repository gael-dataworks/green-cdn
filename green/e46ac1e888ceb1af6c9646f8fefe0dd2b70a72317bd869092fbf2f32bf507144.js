export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Polished silver per quick-reference: metalness 0.6, roughness 0.25, color #d4d4d4
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d4,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Gem material: Glass-like, low roughness, some transmission
  const gemMatBase = new THREE.MeshPhysicalMaterial({
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // Specific gem colors
  const gemColors = [
    0xffb7c5, // Pink
    0xaaddff, // Light Blue
    0xccffcc, // Light Green
    0xffffcc, // Pale Yellow
    0xffccaa, // Peach
  ];

  // --- Geometry: Main Body (Lathe) ---
  // Profile points [radius, y] from bottom to top
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00),  // Center bottom
    new THREE.Vector2(0.16, 0.00),  // Base outer edge
    new THREE.Vector2(0.14, 0.05),  // Base step
    new THREE.Vector2(0.08, 0.12),  // Stem start
    new THREE.Vector2(0.06, 0.22),  // Stem narrow
    new THREE.Vector2(0.09, 0.28),  // Bowl connection
    new THREE.Vector2(0.19, 0.55),  // Bowl belly
    new THREE.Vector2(0.18, 0.85),  // Bowl upper
    new THREE.Vector2(0.20, 0.92),  // Rim flare
    new THREE.Vector2(0.19, 0.94),  // Rim top edge
    // Inner profile to make it hollow (optional, but adds realism)
    // We will just make a solid shell for simplicity and robustness, 
    // relying on the silver material to look solid.
  ];

  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  // Compute vertex normals for smooth shading
  bodyGeom.computeVertexNormals();
  
  const body = new THREE.Mesh(bodyGeom, silverMat);
  root.add(body);

  // --- Decoration: Relief Frieze (Simplified) ---
  // The image shows figures and columns. We approximate this with 
  // flattened cylinders and boxes arranged around the bowl.
  const friezeGroup = new THREE.Group();
  const friezeMat = silverMat; // Same material
  const friezeY = 0.55; // Height on the bowl belly
  const friezeR = 0.195; // Slightly larger than body radius at that height

  // Create a "panel" geometry for the relief
  const panelGeom = new THREE.BoxGeometry(0.04, 0.06, 0.01);
  const archGeom = new THREE.TorusGeometry(0.015, 0.004, 8, 16, Math.PI);
  
  const numPanels = 8;
  for (let i = 0; i < numPanels; i++) {
    const angle = (i / numPanels) * Math.PI * 2;
    const x = Math.cos(angle) * friezeR;
    const z = Math.sin(angle) * friezeR;

    // Panel background
    const panel = new THREE.Mesh(panelGeom, friezeMat);
    panel.position.set(x, friezeY, z);
    panel.lookAt(0, friezeY, 0); // Face inward
    panel.translateZ(0.005); // Offset from surface
    friezeGroup.add(panel);

    // Arch top
    const arch = new THREE.Mesh(archGeom, friezeMat);
    arch.position.set(x, friezeY + 0.025, z);
    arch.lookAt(0, friezeY + 0.025, 0);
    arch.rotateX(Math.PI); // Flip arch
    arch.translateZ(0.006);
    friezeGroup.add(arch);
    
    // Column sides (small cylinders)
    const colGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8);
    const colL = new THREE.Mesh(colGeom, friezeMat);
    colL.position.set(x - 0.015, friezeY, z);
    colL.lookAt(0, friezeY, 0);
    colL.translateZ(0.006);
    friezeGroup.add(colL);

    const colR = new THREE.Mesh(colGeom, friezeMat);
    colR.position.set(x + 0.015, friezeY, z);
    colR.lookAt(0, friezeY, 0);
    colR.translateZ(0.006);
    friezeGroup.add(colR);
  }
  root.add(friezeGroup);

  // --- Decoration: Gems ---
  // Upper band on bowl
  const gemR_Bowl = 0.198;
  const gemY_Bowl = 0.75;
  const numGems_Bowl = 12;
  
  for (let i = 0; i < numGems_Bowl; i++) {
    const angle = (i / numGems_Bowl) * Math.PI * 2;
    const x = Math.cos(angle) * gemR_Bowl;
    const z = Math.sin(angle) * gemR_Bowl;
    
    const color = gemColors[i % gemColors.length];
    const gemMat = gemMatBase.clone();
    gemMat.color.setHex(color);
    
    const gemGeom = new THREE.SphereGeometry(0.012, 16, 16);
    const gem = new THREE.Mesh(gemGeom, gemMat);
    gem.position.set(x, gemY_Bowl, z);
    // Orient gem normal to surface
    gem.lookAt(0, gemY_Bowl, 0);
    root.add(gem);
  }

  // Base gems (scattered on the foot)
  const baseGemsData = [
    { r: 0.14, y: 0.04, count: 6 },
    { r: 0.08, y: 0.12, count: 4 }, // On stem/base junction
  ];

  baseGemsData.forEach(set => {
    for (let i = 0; i < set.count; i++) {
      const angle = (i / set.count) * Math.PI * 2 + 0.5; // Offset slightly
      const x = Math.cos(angle) * set.r;
      const z = Math.sin(angle) * set.r;
      
      const color = gemColors[(i + 2) % gemColors.length];
      const gemMat = gemMatBase.clone();
      gemMat.color.setHex(color);
      
      const gemGeom = new THREE.SphereGeometry(0.008, 16, 16);
      const gem = new THREE.Mesh(gemGeom, gemMat);
      gem.position.set(x, set.y, z);
      gem.lookAt(0, set.y, 0);
      root.add(gem);
    }
  });

  // --- Rim Detail ---
  // A decorative band at the top rim
  const rimBandGeom = new THREE.TorusGeometry(0.195, 0.003, 8, 32);
  const rimBand = new THREE.Mesh(rimBandGeom, silverMat);
  rimBand.rotation.x = Math.PI / 2;
  rimBand.position.y = 0.91;
  root.add(rimBand);

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