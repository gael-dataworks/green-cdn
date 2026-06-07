export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Materials ---
  // Brass/Gold metal: capped metalness, added emissive for brightness
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.3,
    emissive: 0xd4af37,
    emissiveIntensity: 0.4,
  });

  // Feather vane: soft white, matte
  const featherMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.0,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  // Feather shaft: slightly darker/greyer white
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    metalness: 0.0,
    roughness: 0.8,
  });

  // --- Metal Nib / Holder ---
  const nibGroup = new THREE.Group();

  // 1. Tip: Long taper to a needle point
  // Bottom is sharp (radius 0.002), top connects to body (radius 0.015)
  const tipGeom = new THREE.CylinderGeometry(0.002, 0.015, 0.35, 16);
  const tip = new THREE.Mesh(tipGeom, brassMat);
  tip.position.y = -0.175; // Center the 0.35 height
  nibGroup.add(tip);

  // 2. Body: Main grip section
  // Tapers slightly from collar down to tip connection
  const bodyGeom = new THREE.CylinderGeometry(0.015, 0.022, 0.25, 16);
  const body = new THREE.Mesh(bodyGeom, brassMat);
  body.position.y = 0.125 + 0.35; // Sit on top of tip (tip top is at 0.175)
  // Correction: Tip is 0.35 high, centered at -0.175 -> top is at 0.
  // So body starts at 0.
  body.position.y = 0.125;
  nibGroup.add(body);

  // 3. Collar: Wider section holding the feather
  const collarGeom = new THREE.CylinderGeometry(0.028, 0.025, 0.08, 16);
  const collar = new THREE.Mesh(collarGeom, brassMat);
  collar.position.y = 0.25 + 0.04; // On top of body (body top is at 0.25)
  nibGroup.add(collar);

  // 4. Decorative Rings on Collar
  // Add 2-3 thin rings to simulate the engraved details
  const ringGeom = new THREE.TorusGeometry(0.029, 0.003, 8, 24);
  const ring1 = new THREE.Mesh(ringGeom, brassMat);
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = 0.29 + 0.02; // Mid-collar
  nibGroup.add(ring1);

  const ring2 = new THREE.Mesh(ringGeom, brassMat);
  ring2.rotation.x = Math.PI / 2;
  ring2.position.y = 0.29 - 0.02;
  nibGroup.add(ring2);

  root.add(nibGroup);

  // --- Feather ---
  const featherGroup = new THREE.Group();

  // 1. Shaft (Rachis)
  // A gentle curve. Starts at collar top, curves slightly back/up.
  // Path points: Start at collar top (0, 0.33, 0), curve slightly in -Z and +Y
  const shaftPoints = [
    new THREE.Vector3(0, 0.33, 0),
    new THREE.Vector3(0, 0.50, -0.02),
    new THREE.Vector3(0, 0.70, -0.05),
    new THREE.Vector3(0, 0.90, -0.08),
  ];
  const shaftCurve = new THREE.CatmullRomCurve3(shaftPoints);
  const shaftGeom = new THREE.TubeGeometry(shaftCurve, 20, 0.004, 8, false);
  const shaft = new THREE.Mesh(shaftGeom, shaftMat);
  featherGroup.add(shaft);

  // 2. Vane (The flat part)
  // Create a shape that mimics the feather outline.
  // Asymmetric: one side wider than the other.
  const vaneShape = new THREE.Shape();
  // Start at bottom of shaft (relative to feather local space)
  // We will build the vane in local space then align it to the shaft curve roughly
  // Or simpler: Build a flat vane mesh and bend it via vertices to match the shaft curve approximation
  
  // Let's define the outline in 2D (Y is up along shaft, X is width)
  // Shaft is at x=0.
  // Left side (narrower): x from 0 to -0.12
  // Right side (wider): x from 0 to 0.22
  
  vaneShape.moveTo(0, 0); // Bottom center
  // Right side outline (wider)
  vaneShape.bezierCurveTo(0.15, 0.2, 0.22, 0.5, 0.18, 0.8);
  vaneShape.bezierCurveTo(0.12, 0.95, 0.05, 1.0, 0, 1.0); // Tip
  // Left side outline (narrower)
  vaneShape.bezierCurveTo(-0.05, 1.0, -0.10, 0.90, -0.12, 0.6);
  vaneShape.bezierCurveTo(-0.14, 0.3, -0.10, 0.1, 0, 0); // Back to bottom
  
  const vaneGeom = new THREE.ExtrudeGeometry(vaneShape, {
    depth: 0.002,
    bevelEnabled: false,
  });
  
  // Center the geometry
  vaneGeom.center();
  
  const vane = new THREE.Mesh(vaneGeom, featherMat);
  
  // Position vane to align with shaft start
  // Shaft starts at y=0.33 in nib space.
  // Vane height is ~1.0. Center is ~0.5.
  // We want vane bottom to be near shaft start.
  vane.position.y = 0.33 + 0.5; 
  
  // The feather in the image is angled. The shaft curves.
  // Our vane is flat in XY. We need to curve it slightly to match the shaft's Z-curve.
  // Modify vertices of vane to give it a gentle backward curve (negative Z) as Y increases.
  const posAttr = vaneGeom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const y = posAttr.getY(i);
    // Map y (0 to 1 approx) to a z-offset curve
    // At y=0, z=0. At y=1, z=-0.08 (matching shaft tip)
    const t = y; // 0 to 1
    const zOffset = -0.08 * (t * t); // Quadratic curve
    posAttr.setZ(i, zOffset);
  }
  posAttr.needsUpdate = true;
  vaneGeom.computeVertexNormals();

  featherGroup.add(vane);

  // Add feather to root
  // The nib is vertical. The feather attaches to the top.
  // We constructed featherGroup coordinates relative to nib top.
  // So we just add it.
  root.add(featherGroup);

  // Tilt the whole object slightly to match the reference angle
  // Reference shows it leaning slightly to the left (-X) and back (-Z)
  root.rotation.z = 0.15; // Lean left
  root.rotation.x = -0.1; // Lean back slightly

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