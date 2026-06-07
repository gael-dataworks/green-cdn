export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Constants ---
  const LENGTH = 1.0;
  const WIDTH = 0.35;
  const TRAY_HEIGHT = 0.06;
  const RAIL_Y = 0.14; // Height of the horizontal bars
  const HANDLE_ARCH_H = 0.16; // Height of the handle arch above rails
  const HANDLE_DEPTH = 0.09; // How far the handle sticks out to the side
  const TUBE_RADIUS = 0.022;
  const WALL_THICK = 0.025;
  const BASE_THICK = 0.02;

  // --- Material ---
  // Brushed stainless steel: Silver color, moderate metalness, medium roughness
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- Helper ---
  function addBox(w, h, d, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steelMat);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }

  // --- Tray Base (5 plates for hollow look) ---
  // Bottom
  addBox(WIDTH, BASE_THICK, LENGTH, 0, BASE_THICK / 2, 0);
  // Front Wall
  addBox(WIDTH, TRAY_HEIGHT, WALL_THICK, 0, TRAY_HEIGHT / 2, LENGTH / 2 - WALL_THICK / 2);
  // Back Wall
  addBox(WIDTH, TRAY_HEIGHT, WALL_THICK, 0, TRAY_HEIGHT / 2, -LENGTH / 2 + WALL_THICK / 2);
  // Left Wall
  addBox(WALL_THICK, TRAY_HEIGHT, LENGTH - WALL_THICK * 2, -WIDTH / 2 + WALL_THICK / 2, TRAY_HEIGHT / 2, 0);
  // Right Wall
  addBox(WALL_THICK, TRAY_HEIGHT, LENGTH - WALL_THICK * 2, WIDTH / 2 - WALL_THICK / 2, TRAY_HEIGHT / 2, 0);

  // --- Horizontal Rails (Front & Back) ---
  // CylinderGeometry is Y-up by default. Rotate X by 90 deg to align with Z axis.
  const railGeom = new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, LENGTH, 16);
  railGeom.rotateX(Math.PI / 2);

  const frontRail = new THREE.Mesh(railGeom, steelMat);
  frontRail.position.set(0, RAIL_Y, LENGTH / 2);
  root.add(frontRail);

  const backRail = new THREE.Mesh(railGeom, steelMat);
  backRail.position.set(0, RAIL_Y, -LENGTH / 2);
  root.add(backRail);

  // --- Side Handles (U-shaped arches) ---
  // We use TubeGeometry with a CatmullRomCurve3 to create the smooth arch 
  // that connects the front and back rails on the sides.
  
  function createSideHandle(sideMultiplier) {
    const xBase = sideMultiplier * WIDTH / 2;
    const xOut = sideMultiplier * (WIDTH / 2 + HANDLE_DEPTH);
    const zFront = LENGTH / 2;
    const zBack = -LENGTH / 2;
    const yTop = RAIL_Y + HANDLE_ARCH_H;

    // Curve points: Start Front -> Out/Up -> Back/Up -> End Back
    const points = [
      new THREE.Vector3(xBase, RAIL_Y, zFront),
      new THREE.Vector3(xOut, yTop, zFront),
      new THREE.Vector3(xOut, yTop, zBack),
      new THREE.Vector3(xBase, RAIL_Y, zBack),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    // Adjust tension to make it smoother/rounder at corners
    curve.tension = 0.5; 

    const tubeGeom = new THREE.TubeGeometry(curve, 24, TUBE_RADIUS, 12, false);
    const handle = new THREE.Mesh(tubeGeom, steelMat);
    root.add(handle);
  }

  createSideHandle(-1); // Left
  createSideHandle(1);  // Right

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