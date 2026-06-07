export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  // Brushed metal: silver color, moderate roughness, high metalness (capped at 0.6)
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Glowing tip: Blue emissive
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x0088ff,
    emissiveIntensity: 2.0,
    metalness: 0.0,
    roughness: 0.2,
  });

  // 1. Main Nozzle Body (Lathe)
  // Profile from bottom (y=0) to tip (y=0.5)
  const profilePoints = [
    new THREE.Vector2(0.00, 0.00), // Bottom center
    new THREE.Vector2(0.14, 0.00), // Bottom rim
    new THREE.Vector2(0.14, 0.25), // Cylinder section
    new THREE.Vector2(0.12, 0.30), // Slight step in
    new THREE.Vector2(0.12, 0.40), // Upper cylinder
    new THREE.Vector2(0.06, 0.48), // Taper start
    new THREE.Vector2(0.00, 0.52), // Tip
  ];
  const bodyGeom = new THREE.LatheGeometry(profilePoints, 32);
  const mainBody = new THREE.Mesh(bodyGeom, metalMat);
  mainBody.position.y = 0.26; // Center vertically so bottom is at 0
  root.add(mainBody);

  // 2. Base Plate / Drag Shield (Extrude)
  // Shape: A flat, angular plate extending from the base
  const plateShape = new THREE.Shape();
  // Start at back left
  plateShape.moveTo(-0.25, -0.15);
  // Back right
  plateShape.lineTo(0.25, -0.15);
  // Front right (angled forward)
  plateShape.lineTo(0.15, 0.35);
  // Front tip
  plateShape.lineTo(0.0, 0.45);
  // Front left
  plateShape.lineTo(-0.15, 0.35);
  // Close
  plateShape.lineTo(-0.25, -0.15);

  // Cutout in the middle for the nozzle (optional, but adds detail)
  const holePath = new THREE.Path();
  holePath.absarc(0, 0.1, 0.15, 0, Math.PI * 2, true);
  plateShape.holes.push(holePath);

  const plateGeom = new THREE.ExtrudeGeometry(plateShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
    steps: 1,
  });
  
  const basePlate = new THREE.Mesh(plateGeom, metalMat);
  // Position at the bottom of the body
  basePlate.position.set(0, 0.02, 0);
  // Rotate slightly to match the angled look in the reference if needed, 
  // but keeping it flat (XZ plane) is safer for a canonical model.
  // The reference shows it tilted, but we build canonical.
  // Let's tilt it slightly down at the front to match the "skid" look.
  basePlate.rotation.x = -Math.PI / 8; 
  root.add(basePlate);

  // 3. Glowing Tip
  const tipGeom = new THREE.SphereGeometry(0.03, 16, 16);
  const tipGlow = new THREE.Mesh(tipGeom, glowMat);
  tipGlow.position.set(0, 0.52, 0); // At the very top of the body
  root.add(tipGlow);

  // 4. Small detail ring near the base of the taper
  const ringGeom = new THREE.TorusGeometry(0.12, 0.015, 8, 24);
  const detailRing = new THREE.Mesh(ringGeom, metalMat);
  detailRing.position.set(0, 0.30, 0);
  detailRing.rotation.x = Math.PI / 2;
  root.add(detailRing);

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