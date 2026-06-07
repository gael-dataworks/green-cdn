export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Gold Body - Adhering to "Metal Brightness via Emissive" rule
  // Metalness capped at 0.25 to avoid blackness without env map, 
  // emissive used to lift brightness to match reference.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4b24a,
    metalness: 0.25,
    roughness: 0.32,
    emissive: 0xd4b24a,
    emissiveIntensity: 0.40,
  });

  // Wick - Charcoal black, matte
  const wickMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.9,
  });

  // Flame - Bright emissive yellow/white
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    metalness: 0.0,
    roughness: 0.4,
    emissive: 0xffdd44,
    emissiveIntensity: 1.8,
  });

  // 1. Body (Cone)
  // Proportions: Taller than wide, elegant taper
  const bodyRadius = 0.14;
  const bodyHeight = 0.42;
  const bodyGeom = new THREE.ConeGeometry(bodyRadius, bodyHeight, 32);
  const body = new THREE.Mesh(bodyGeom, goldMat);
  // ConeGeometry base is at -height/2. Move up so base sits at y=0.
  body.position.y = bodyHeight / 2;
  root.add(body);

  // 2. Wick
  // Small cylinder at the apex of the cone
  const wickRadius = 0.012;
  const wickHeight = 0.025;
  const wickGeom = new THREE.CylinderGeometry(wickRadius, wickRadius, wickHeight, 8);
  const wick = new THREE.Mesh(wickGeom, wickMat);
  wick.position.y = bodyHeight + wickHeight / 2;
  root.add(wick);

  // 3. Flame
  // Teardrop shape using LatheGeometry for smooth profile
  const flamePoints = [
    new THREE.Vector2(0, 0),          // Base center
    new THREE.Vector2(0.025, 0.06),   // Lower curve out
    new THREE.Vector2(0.045, 0.16),   // Widest point
    new THREE.Vector2(0.025, 0.26),   // Tapering in
    new THREE.Vector2(0, 0.32)        // Tip
  ];
  const flameGeom = new THREE.LatheGeometry(flamePoints, 24);
  const flame = new THREE.Mesh(flameGeom, flameMat);
  // Position flame base at top of wick
  flame.position.y = bodyHeight + wickHeight;
  root.add(flame);

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