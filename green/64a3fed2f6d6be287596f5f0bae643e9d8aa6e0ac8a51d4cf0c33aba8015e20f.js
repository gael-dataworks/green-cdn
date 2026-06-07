export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Gold metal. Capped metalness at 0.6 per safety rules.
  // Color carries the gold shade.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Create a stadium-shaped link geometry using TubeGeometry and a custom CurvePath.
  // Dimensions: straight length 0.08, width 0.04, tube radius 0.012.
  function createLinkGeometry() {
    const straightLen = 0.08;
    const width = 0.04;
    const radius = width / 2;
    const tubeRadius = 0.012;
    const tubularSegments = 24;
    const radialSegments = 12;

    const points = [];
    const arcSegments = 8;

    // Bottom straight segment
    points.push(new THREE.Vector3(-straightLen / 2, -radius, 0));
    points.push(new THREE.Vector3(straightLen / 2, -radius, 0));

    // Right arc (180 degrees)
    for (let i = 1; i <= arcSegments; i++) {
      const angle = (i / arcSegments) * Math.PI;
      const x = straightLen / 2 + Math.cos(angle - Math.PI / 2) * radius; // Start at -PI/2 relative to center
      // Actually simpler: center of arc is (straightLen/2, 0)
      // Start angle -PI/2 (bottom), end angle PI/2 (top)
      const cx = straightLen / 2;
      const cy = 0;
      const ax = cx + Math.cos(-Math.PI / 2 + (i / arcSegments) * Math.PI) * radius;
      const ay = cy + Math.sin(-Math.PI / 2 + (i / arcSegments) * Math.PI) * radius;
      points.push(new THREE.Vector3(ax, ay, 0));
    }

    // Top straight segment
    points.push(new THREE.Vector3(-straightLen / 2, radius, 0));

    // Left arc (180 degrees)
    for (let i = 1; i <= arcSegments; i++) {
      const cx = -straightLen / 2;
      const cy = 0;
      // Start angle PI/2, end angle 3PI/2
      const ax = cx + Math.cos(Math.PI / 2 + (i / arcSegments) * Math.PI) * radius;
      const ay = cy + Math.sin(Math.PI / 2 + (i / arcSegments) * Math.PI) * radius;
      points.push(new THREE.Vector3(ax, ay, 0));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    curve.closed = true;
    return new THREE.TubeGeometry(curve, tubularSegments * 2, tubeRadius, radialSegments, true);
  }

  const linkGeom = createLinkGeometry();
  const linkCount = 14;
  const braceletRadius = 0.16;

  // Pre-calculate quaternion helpers to avoid garbage in loop
  const qBase = new THREE.Quaternion();
  const qAlt = new THREE.Quaternion();
  const axisY = new THREE.Vector3(0, 1, 0);
  const axisX = new THREE.Vector3(1, 0, 0);
  qAlt.setFromAxisAngle(axisX, Math.PI / 2);

  for (let i = 0; i < linkCount; i++) {
    const link = new THREE.Mesh(linkGeom, goldMat);
    
    // Position on circle
    const angle = (i / linkCount) * Math.PI * 2;
    const x = Math.cos(angle) * braceletRadius;
    const z = Math.sin(angle) * braceletRadius;
    link.position.set(x, 0, z);

    // Base orientation: Face tangent to the circle
    // Tangent at angle is perpendicular to radius.
    // Radius vector is (cos, 0, sin). Tangent is (-sin, 0, cos).
    // Default link long axis is X. We want X to align with Tangent.
    // Rotation Y = -angle aligns X with Tangent.
    qBase.setFromAxisAngle(axisY, -angle);
    link.quaternion.copy(qBase);

    // Alternate orientation for interlocking (paperclip style)
    // Even links: Flat (relative to bracelet plane)
    // Odd links: Vertical (rotated 90 deg around the tangent/long-axis)
    if (i % 2 === 1) {
      link.quaternion.premultiply(qAlt);
    }

    root.add(link);
  }

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