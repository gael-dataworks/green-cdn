export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Translucent blue plastic (like a gachapon capsule or prize ball)
  // Using MeshPhysicalMaterial for transmission (see-through quality)
  const plasticMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a8cff,        // Bright azure blue
    metalness: 0.0,
    roughness: 0.15,        // Glossy surface
    transmission: 0.85,     // High translucency
    ior: 1.5,               // Plastic index of refraction
    thickness: 0.8,         // Volume thickness for refraction
    transparent: true,
    side: THREE.DoubleSide,
  });

  // Slightly darker material for seams to make them visible
  const seamMat = new THREE.MeshPhysicalMaterial({
    color: 0x1060aa,
    metalness: 0.0,
    roughness: 0.2,
    transmission: 0.6,
    ior: 1.5,
    transparent: true,
  });

  // --- Main Body: Two Hemispheres ---
  // Splitting into top and bottom to simulate the mold line at the equator
  const radius = 0.5;
  const segments = 48;

  // Top Hemisphere (theta 0 to PI/2)
  const topHemiGeom = new THREE.SphereGeometry(radius, segments, segments, 0, Math.PI * 2, 0, Math.PI / 2);
  const topHemisphere = new THREE.Mesh(topHemiGeom, plasticMat);
  root.add(topHemisphere);

  // Bottom Hemisphere (theta PI/2 to PI)
  const botHemiGeom = new THREE.SphereGeometry(radius, segments, segments, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const bottomHemisphere = new THREE.Mesh(botHemiGeom, plasticMat);
  root.add(bottomHemisphere);

  // --- Equator Seam ---
  // A thin torus to emphasize the horizontal split
  const equatorSeam = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.004, 8, 64),
    seamMat
  );
  equatorSeam.rotation.x = Math.PI / 2;
  root.add(equatorSeam);

  // --- Vertical Seams ---
  // The image shows 3 vertical seams meeting at the poles (typical 3-part mold)
  // We create 3 thin tubes running from top to bottom
  const seamCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, radius, 0),
    new THREE.Vector3(0, -radius, 0)
  );
  // We need to curve them slightly to follow the sphere surface, 
  // but straight lines inside the sphere are less visible and cheaper.
  // To make them follow the surface, we use a quadratic bezier or just place boxes.
  // Let's use thin Boxes rotated around the Y axis.
  
  const seamWidth = 0.012;
  const seamDepth = 0.005; // Slightly protruding
  const seamGeom = new THREE.BoxGeometry(seamWidth, radius * 2, seamDepth);

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.position.y = 0;
    // Position on the surface
    seam.position.x = Math.cos(angle) * radius;
    seam.position.z = Math.sin(angle) * radius;
    seam.rotation.y = -angle;
    // Tilt slightly to align with normal if needed, but box center is at 0,0,0 relative to its pivot
    // We need to move the box out so it sits ON the sphere, not through the center.
    // Actually, simpler: Create a tall thin box, rotate it to the angle, and push it out.
    // But the box pivot is center. 
    // Let's use a different approach: A thin Torus segment or just place the box at the perimeter.
    // Correct approach for vertical seam on sphere:
    // A box of height 2*radius, width small, depth small.
    // Rotate around Y to face center, then translate X by radius.
    // Wait, if I rotate a vertical box around Y, it stays vertical.
    // I need to rotate it around Z (or X) to lay it flat? No, seams are vertical.
    // They run along meridians.
    // So: Create box. Rotate Y to angle. Translate X by radius.
    // This puts the box standing vertically at the edge of the sphere.
    // But the seam should follow the curvature. A flat box will cut into the sphere or float.
    // Given the translucency, a flat box tangent to the surface is acceptable.
    
    // Let's refine: Use a Tube following a curve on the surface.
    const p1 = new THREE.Vector3(Math.cos(angle) * radius, radius, Math.sin(angle) * radius);
    const p2 = new THREE.Vector3(Math.cos(angle) * radius, -radius, Math.sin(angle) * radius);
    // Midpoint slightly out to bulge
    const mid = new THREE.Vector3(Math.cos(angle) * (radius + 0.005), 0, Math.sin(angle) * (radius + 0.005));
    
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.006, 8, false),
      seamMat
    );
    root.add(tube);
  }

  // --- Top Cap Feature ---
  // Small circular indentation/hole mechanism at the north pole
  const capRadius = 0.08;
  const capY = radius - 0.01;
  
  // Outer ring of the cap
  const capRing = new THREE.Mesh(
    new THREE.TorusGeometry(capRadius, 0.005, 8, 24),
    plasticMat
  );
  capRing.rotation.x = Math.PI / 2;
  capRing.position.y = capY;
  root.add(capRing);

  // Inner hole (dark cylinder to simulate depth)
  const holeGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 16);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x001133, roughness: 0.9 });
  const hole = new THREE.Mesh(holeGeom, holeMat);
  hole.position.y = capY;
  root.add(hole);

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