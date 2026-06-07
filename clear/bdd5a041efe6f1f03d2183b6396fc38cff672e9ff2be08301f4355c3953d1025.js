export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Iridescent/Purple Metal
  // Using metalness 0.6 (max allowed for non-black reflection) and low roughness.
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xc040c0,      // Purple-Pink base
    metalness: 0.6,       // High reflectivity
    roughness: 0.15,      // Very smooth/polished
  });

  // --- 1. Generate the Spiral Path ---
  // We construct a path that starts at the tip (left) and spirals inward to the center (right).
  // Coordinate system: X is horizontal (left-right), Y is vertical, Z is depth.
  // The spiral lies primarily in the XY plane.
  
  const points = [];
  const turns = 2.5;
  const totalPoints = 120;
  
  // Parameters for the spiral shape
  // Tip starts at x = -1.0, spirals to center at x = 0.5
  const tipX = -1.2;
  const centerX = 0.6;
  const spiralWidth = centerX - tipX;
  
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints; // 0.0 (tip) to 1.0 (center)
    
    // Angle increases as we go from tip to center
    const angle = t * turns * Math.PI * 2; 
    
    // Radius of the spiral path from the center point
    // Starts large (at tip? no, tip is far from center) -> wait.
    // Let's model from Center (t=1) to Tip (t=0).
    // At t=1 (center), radius should be 0.
    // At t=0 (tip), radius should be max.
    
    // Actually, let's reverse logic for easier math:
    // u = 1 - t (1 at tip, 0 at center)
    const u = 1 - t;
    
    // Logarithmic-like growth for the path radius
    // Path radius grows as we move away from center towards tip
    const pathRadius = u * u * spiralWidth * 0.8; 
    
    // The center of the spiral is at (centerX, 0, 0)
    const cx = centerX;
    const cy = 0;
    
    // Calculate position on the spiral arm centerline
    // We add some Y variation to make it look organic, not perfectly flat
    const px = cx - pathRadius * Math.cos(angle);
    const py = pathRadius * Math.sin(angle) * 0.8; // Flatten Y slightly
    const pz = Math.sin(angle * 2) * 0.05; // Slight 3D warp
    
    points.push(new THREE.Vector3(px, py, pz));
  }
  
  // Reverse points so index 0 is the Tip (left) and index N is the Center (right)
  // This matches the visual flow: Tip -> Body -> Spiral Center
  points.reverse();
  
  const curve = new THREE.CatmullRomCurve3(points);

  // --- 2. Create Tapered Tube Geometry ---
  // Standard TubeGeometry has constant radius. We will modify vertices to taper.
  const tubularSegments = 100;
  const radialSegments = 24;
  const baseRadius = 0.18;
  
  const tubeGeom = new THREE.TubeGeometry(curve, tubularSegments, baseRadius, radialSegments, false);
  const positions = tubeGeom.attributes.position.array;
  const vertex = new THREE.Vector3();
  const centerPoint = new THREE.Vector3();
  
  // We need to access the curve points corresponding to each segment to calculate taper
  // TubeGeometry organizes vertices: segmentIndex * (radialSegments + 1) + radialIndex
  
  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments; // 0.0 (Tip) to 1.0 (Center)
    
    // Determine desired radius at this segment
    // Tip (u=0): Thin (0.04)
    // Body (u=0.3): Thick (0.18)
    // Inner Spiral (u=0.6): Medium (0.12)
    // Center (u=1.0): Very Thin/Closed (0.02)
    
    let targetRadius;
    if (u < 0.2) {
      // Tip taper
      targetRadius = 0.04 + (0.18 - 0.04) * (u / 0.2);
    } else if (u < 0.7) {
      // Main body taper down
      targetRadius = 0.18 - (0.18 - 0.08) * ((u - 0.2) / 0.5);
    } else {
      // Spiral center closure
      targetRadius = 0.08 - (0.08 - 0.01) * ((u - 0.7) / 0.3);
    }
    
    // Get the center of the tube at this segment
    curve.getPointAt(u, centerPoint);
    
    // Modify all radial vertices for this segment
    for (let j = 0; j <= radialSegments; j++) {
      const index = (i * (radialSegments + 1) + j) * 3;
      
      vertex.set(positions[index], positions[index + 1], positions[index + 2]);
      
      // Vector from curve center to vertex
      const direction = new THREE.Vector3().subVectors(vertex, centerPoint).normalize();
      
      // New position = center + direction * targetRadius
      direction.multiplyScalar(targetRadius).add(centerPoint);
      
      positions[index] = direction.x;
      positions[index + 1] = direction.y;
      positions[index + 2] = direction.z;
    }
  }
  
  tubeGeom.computeVertexNormals();
  const shellMesh = new THREE.Mesh(tubeGeom, shellMat);
  root.add(shellMesh);

  // --- 3. Add Tip Ridges ---
  // The image shows 2 distinct rings near the sharp tip.
  // We place small Torus meshes at the tip end of the curve.
  
  const tipPos = points[0]; // First point is the tip
  const tipDir = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
  
  // Align rings perpendicular to the tip direction
  // Torus is in XY plane by default. We need to rotate it to face tipDir.
  // tipDir is roughly (-1, 0, 0). So we need rotation to face X.
  
  const ridgeMat = shellMat; // Same material
  
  function addRidge(offsetX, radius, tubeRadius) {
    // Torus lies in XY. To wrap around X-axis tube, we rotate Z by 90 (PI/2)
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.015, 8, 16), 
      ridgeMat
    );
    ridge.position.copy(tipPos);
    // Move slightly along the tip direction
    ridge.position.x += offsetX; 
    ridge.rotation.z = Math.PI / 2;
    ridge.scale.set(1, 1, 1); // Uniform scale
    root.add(ridge);
  }
  
  // Add two ridges near the tip
  addRidge(0.08, 0.045, 0.04);
  addRidge(0.14, 0.055, 0.05);

  // --- 4. Normalization ---
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