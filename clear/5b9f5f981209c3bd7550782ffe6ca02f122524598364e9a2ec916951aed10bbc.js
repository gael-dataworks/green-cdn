export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials
  const redFabricMat = new THREE.MeshStandardMaterial({
    color: 0xe63946,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const blueFabricMat = new THREE.MeshStandardMaterial({
    color: 0x1d3557,
    metalness: 0.0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    metalness: 0.0,
    roughness: 0.6,
  });

  const blackBindingMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.5,
  });

  const whiteLineMat = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    metalness: 0.0,
    roughness: 0.4,
  });

  // Kite dimensions
  const kiteWidth = 1.2;
  const kiteHeight = 0.9;
  const sparRadius = 0.012;

  // === SAIL PANELS ===
  // The sail is made of triangular panels in red and blue
  // We'll create them as flat triangles positioned in the XY plane

  function createTriangle(p1, p2, p3, material) {
    const shape = new THREE.Shape();
    shape.moveTo(p1.x, p1.y);
    shape.lineTo(p2.x, p2.y);
    shape.lineTo(p3.x, p3.y);
    shape.closePath();
    const geom = new THREE.ShapeGeometry(shape);
    const mesh = new THREE.Mesh(geom, material);
    return mesh;
  }

  // Key points for the diamond kite
  const topPoint = new THREE.Vector2(0, kiteHeight / 2);
  const bottomPoint = new THREE.Vector2(0, -kiteHeight / 2);
  const leftPoint = new THREE.Vector2(-kiteWidth / 2, 0);
  const rightPoint = new THREE.Vector2(kiteWidth / 2, 0);
  const centerPoint = new THREE.Vector2(0, 0);

  // Upper triangles (red center, blue corners)
  const upperLeftInner = new THREE.Vector2(-kiteWidth * 0.15, kiteHeight * 0.25);
  const upperRightInner = new THREE.Vector2(kiteWidth * 0.15, kiteHeight * 0.25);
  const upperLeftCorner = new THREE.Vector2(-kiteWidth * 0.35, kiteHeight * 0.15);
  const upperRightCorner = new THREE.Vector2(kiteWidth * 0.35, kiteHeight * 0.15);

  // Lower triangles (red center, blue side panels)
  const lowerLeftInner = new THREE.Vector2(-kiteWidth * 0.2, -kiteHeight * 0.15);
  const lowerRightInner = new THREE.Vector2(kiteWidth * 0.2, -kiteHeight * 0.15);
  const lowerLeftCorner = new THREE.Vector2(-kiteWidth * 0.4, -kiteHeight * 0.05);
  const lowerRightCorner = new THREE.Vector2(kiteWidth * 0.4, -kiteHeight * 0.05);

  // Center red diamond panel (top portion)
  const sail_center_top = createTriangle(
    topPoint,
    upperLeftInner,
    upperRightInner,
    redFabricMat
  );
  root.add(sail_center_top);

  // Center red diamond panel (bottom portion)
  const sail_center_bottom = createTriangle(
    bottomPoint,
    lowerLeftInner,
    lowerRightInner,
    redFabricMat
  );
  root.add(sail_center_bottom);

  // Upper left blue panel
  const sail_upper_left_blue = createTriangle(
    topPoint,
    leftPoint,
    upperLeftInner,
    blueFabricMat
  );
  root.add(sail_upper_left_blue);

  // Upper right blue panel
  const sail_upper_right_blue = createTriangle(
    topPoint,
    rightPoint,
    upperRightInner,
    blueFabricMat
  );
  root.add(sail_upper_right_blue);

  // Lower left blue panel
  const sail_lower_left_blue = createTriangle(
    leftPoint,
    bottomPoint,
    lowerLeftInner,
    blueFabricMat
  );
  root.add(sail_lower_left_blue);

  // Lower right blue panel
  const sail_lower_right_blue = createTriangle(
    rightPoint,
    bottomPoint,
    lowerRightInner,
    blueFabricMat
  );
  root.add(sail_lower_right_blue);

  // Side red panels (between blue sections)
  const sail_left_red = createTriangle(
    leftPoint,
    upperLeftInner,
    lowerLeftInner,
    redFabricMat
  );
  root.add(sail_left_red);

  const sail_right_red = createTriangle(
    rightPoint,
    upperRightInner,
    lowerRightInner,
    redFabricMat
  );
  root.add(sail_right_red);

  // === BAMBOO FRAME ===

  // Vertical spar (central pole)
  const vertical_spar = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius, sparRadius, kiteHeight * 1.05, 12),
    bambooMat
  );
  vertical_spar.rotation.z = Math.PI / 2;
  vertical_spar.position.y = 0;
  root.add(vertical_spar);

  // Horizontal spar (cross pole) - slightly curved/bowed
  const horizontal_spar = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius, sparRadius, kiteWidth * 1.02, 12),
    bambooMat
  );
  horizontal_spar.rotation.x = Math.PI / 2;
  horizontal_spar.position.x = 0;
  root.add(horizontal_spar);

  // Extend the spar tips beyond the sail
  const left_spar_tip = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 0.9, sparRadius * 0.9, kiteWidth * 0.08, 8),
    bambooMat
  );
  left_spar_tip.rotation.x = Math.PI / 2;
  left_spar_tip.position.set(-kiteWidth / 2 - kiteWidth * 0.03, 0, 0);
  root.add(left_spar_tip);

  const right_spar_tip = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 0.9, sparRadius * 0.9, kiteWidth * 0.08, 8),
    bambooMat
  );
  right_spar_tip.rotation.x = Math.PI / 2;
  right_spar_tip.position.set(kiteWidth / 2 + kiteWidth * 0.03, 0, 0);
  root.add(right_spar_tip);

  // Top spar tip
  const top_spar_tip = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 0.85, sparRadius * 0.85, kiteHeight * 0.06, 8),
    bambooMat
  );
  top_spar_tip.rotation.z = Math.PI / 2;
  top_spar_tip.position.set(0, kiteHeight / 2 + kiteHeight * 0.03, 0);
  root.add(top_spar_tip);

  // Bottom spar tip
  const bottom_spar_tip = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 0.85, sparRadius * 0.85, kiteHeight * 0.06, 8),
    bambooMat
  );
  bottom_spar_tip.rotation.z = Math.PI / 2;
  bottom_spar_tip.position.set(0, -kiteHeight / 2 - kiteHeight * 0.03, 0);
  root.add(bottom_spar_tip);

  // === JOINT BINDINGS ===

  // Center joint binding (where spars cross)
  const center_binding = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 1.3, sparRadius * 1.3, 0.025, 16),
    blackBindingMat
  );
  center_binding.rotation.x = Math.PI / 2;
  center_binding.position.set(0, 0, 0.002);
  root.add(center_binding);

  // Bindings at sail attachment points
  const bindingPositions = [
    [-kiteWidth * 0.35, kiteHeight * 0.15],
    [kiteWidth * 0.35, kiteHeight * 0.15],
    [-kiteWidth * 0.4, -kiteHeight * 0.05],
    [kiteWidth * 0.4, -kiteHeight * 0.05],
  ];

  for (const [bx, by] of bindingPositions) {
    const binding = new THREE.Mesh(
      new THREE.CylinderGeometry(sparRadius * 1.2, sparRadius * 1.2, 0.018, 12),
      blackBindingMat
    );
    binding.rotation.x = Math.PI / 2;
    binding.position.set(bx, by, 0.002);
    root.add(binding);
  }

  // === BRIDLE LINE ===

  // Main bridle line from center down
  const bridle_line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, kiteHeight * 0.8, 6),
    whiteLineMat
  );
  bridle_line.position.set(0, -kiteHeight * 0.35, 0);
  root.add(bridle_line);

  // Upper bridle attachment (small line going up to the spine)
  const bridle_upper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0025, 0.0025, kiteHeight * 0.25, 6),
    whiteLineMat
  );
  bridle_upper.position.set(0, -kiteHeight * 0.08, 0.005);
  bridle_upper.rotation.z = -0.15;
  root.add(bridle_upper);

  // === TAIL RIBBONS ===

  // Left tail (red ribbon from left wing tip)
  const left_tail_curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-kiteWidth / 2 - kiteWidth * 0.02, 0, 0),
    new THREE.Vector3(-kiteWidth / 2 - kiteWidth * 0.03, -kiteHeight * 0.15, 0.02),
    new THREE.Vector3(-kiteWidth / 2 - kiteWidth * 0.01, -kiteHeight * 0.35, -0.01),
    new THREE.Vector3(-kiteWidth / 2 - kiteWidth * 0.02, -kiteHeight * 0.55, 0.02),
  ]);

  const left_tail = new THREE.Mesh(
    new THREE.TubeGeometry(left_tail_curve, 20, 0.008, 6, false),
    redFabricMat
  );
  root.add(left_tail);

  // Right tail (blue ribbon from right wing tip)
  const right_tail_curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(kiteWidth / 2 + kiteWidth * 0.02, 0, 0),
    new THREE.Vector3(kiteWidth / 2 + kiteWidth * 0.03, -kiteHeight * 0.18, 0.02),
    new THREE.Vector3(kiteWidth / 2 + kiteWidth * 0.01, -kiteHeight * 0.38, -0.02),
    new THREE.Vector3(kiteWidth / 2 + kiteWidth * 0.02, -kiteHeight * 0.58, 0.01),
  ]);

  const right_tail = new THREE.Mesh(
    new THREE.TubeGeometry(right_tail_curve, 20, 0.008, 6, false),
    blueFabricMat
  );
  root.add(right_tail);

  // Center tail (red ribbon from bridle line bottom)
  const center_tail_curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -kiteHeight * 0.75, 0),
    new THREE.Vector3(-0.02, -kiteHeight * 0.88, 0.02),
    new THREE.Vector3(0.01, -kiteHeight * 1.02, -0.01),
    new THREE.Vector3(-0.01, -kiteHeight * 1.15, 0.02),
  ]);

  const center_tail = new THREE.Mesh(
    new THREE.TubeGeometry(center_tail_curve, 20, 0.007, 6, false),
    redFabricMat
  );
  root.add(center_tail);

  // Wing tip bindings (where tails attach)
  const left_wing_binding = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 1.1, sparRadius * 1.1, 0.02, 12),
    blackBindingMat
  );
  left_wing_binding.rotation.x = Math.PI / 2;
  left_wing_binding.position.set(-kiteWidth / 2 - kiteWidth * 0.02, 0, 0.002);
  root.add(left_wing_binding);

  const right_wing_binding = new THREE.Mesh(
    new THREE.CylinderGeometry(sparRadius * 1.1, sparRadius * 1.1, 0.02, 12),
    blackBindingMat
  );
  right_wing_binding.rotation.x = Math.PI / 2;
  right_wing_binding.position.set(kiteWidth / 2 + kiteWidth * 0.02, 0, 0.002);
  root.add(right_wing_binding);

  // Normalize to fit unit cube
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