export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Glossy ceramic standard: metalness 0, roughness ~0.2-0.3
  const redMat = new THREE.MeshStandardMaterial({ color: 0xE61919, metalness: 0.0, roughness: 0.25 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.0, roughness: 0.25 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x009E47, metalness: 0.0, roughness: 0.25 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0077C8, metalness: 0.0, roughness: 0.25 });
  const purpleMat = new THREE.MeshStandardMaterial({ color: 0x6A1B9A, metalness: 0.0, roughness: 0.25 });
  const navyMat = new THREE.MeshStandardMaterial({ color: 0x000055, metalness: 0.0, roughness: 0.25 });

  // --- Dimensions ---
  const mugRadius = 0.35;
  const mugHeight = 0.95;
  const wallThickness = 0.04;
  const bottomThickness = 0.05;

  // --- Body Segments (Stacked Cylinders) ---
  // Order from bottom to top based on visual proportions
  // Total height normalized to ~1.0 for calculation, then fitToUnitCube scales it.
  
  const segments = [
    { name: 'body_purple', h: 0.20, mat: purpleMat, y: -0.375 }, // Bottom 20%
    { name: 'body_yellow_bottom', h: 0.05, mat: yellowMat, y: -0.275 }, // Thin stripe
    { name: 'body_blue', h: 0.20, mat: blueMat, y: -0.175 }, // 20%
    { name: 'body_green', h: 0.20, mat: greenMat, y: -0.075 }, // 20%
    { name: 'body_yellow_top', h: 0.05, mat: yellowMat, y: 0.025 }, // Thin stripe
    { name: 'body_red', h: 0.30, mat: redMat, y: 0.175 }    // Top 30%
  ];

  // To ensure no gaps, we make them slightly overlap or touch exactly. 
  // Using exact heights summing to mugHeight.
  // Center Y calculation: previous_y + prev_h/2 + curr_h/2
  
  let currentY = -mugHeight / 2;
  
  segments.forEach(seg => {
    const geom = new THREE.CylinderGeometry(mugRadius, mugRadius, seg.h, 32);
    const mesh = new THREE.Mesh(geom, seg.mat);
    // Position is center of segment
    mesh.position.y = currentY + seg.h / 2;
    mesh.name = seg.name;
    root.add(mesh);
    currentY += seg.h;
  });

  // --- Interior ---
  // Dark blue cylinder inside. Radius = mugRadius - wallThickness.
  // Height = mugHeight - bottomThickness (sitting on bottom).
  const interiorRadius = mugRadius - wallThickness;
  const interiorHeight = mugHeight - bottomThickness;
  const interiorGeom = new THREE.CylinderGeometry(interiorRadius, interiorRadius, interiorHeight, 32);
  const interior = new THREE.Mesh(interiorGeom, navyMat);
  interior.name = 'interior';
  // Shift up so it sits on the bottom inner surface
  interior.position.y = (-mugHeight / 2) + (interiorHeight / 2) + bottomThickness;
  root.add(interior);

  // --- Rim ---
  // The top face of the mug should show the interior color (navy).
  // The top red cylinder shows red on top. We need a navy ring on top.
  const rimGeom = new THREE.RingGeometry(interiorRadius, mugRadius, 32);
  const rim = new THREE.Mesh(rimGeom, navyMat);
  rim.name = 'rim';
  rim.rotation.x = -Math.PI / 2; // Face up
  rim.position.y = mugHeight / 2;
  root.add(rim);

  // --- Handles ---
  // TorusGeometry lies in XY plane by default. 
  // We want handle in YZ plane (vertical loop on side). Rotate X by 90 deg.
  const handleTorusRadius = 0.16;
  const handleTubeRadius = 0.035;
  const handleGeom = new THREE.TorusGeometry(handleTorusRadius, handleTubeRadius, 16, 32);
  
  // Right Handle (Red)
  const handle_right = new THREE.Mesh(handleGeom, redMat);
  handle_right.name = 'handle_right';
  handle_right.rotation.x = Math.PI / 2;
  // Position X: mugRadius + small offset to attach cleanly
  handle_right.position.set(mugRadius + handleTubeRadius * 0.5, 0, 0);
  root.add(handle_right);

  // Left Handle (Purple)
  const handle_left = new THREE.Mesh(handleGeom, purpleMat);
  handle_left.name = 'handle_left';
  handle_left.rotation.x = Math.PI / 2;
  handle_left.position.set(-(mugRadius + handleTubeRadius * 0.5), 0, 0);
  root.add(handle_left);

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