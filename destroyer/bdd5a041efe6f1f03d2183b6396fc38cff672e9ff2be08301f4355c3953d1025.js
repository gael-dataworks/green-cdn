export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Iridescent Purple/Pink Metallic
  // Using high metalness and low roughness to simulate the glossy, reflective shell surface.
  // Emissive adds a bit of inner glow to mimic the iridescence seen in the reference.
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xd040a0,
    metalness: 0.6,
    roughness: 0.2,
    emissive: 0x401030,
    emissiveIntensity: 0.3,
  });

  // --- Path Construction ---
  // We build a spiral path in the XY plane (Z=0).
  // The object faces +Z, tip to the left (-X), spiral bulk to the right (+X).
  const points = [];

  // 1. Tip and Neck (Linear transition to spiral)
  points.push(new THREE.Vector3(-1.6, 0, 0)); // Tip
  points.push(new THREE.Vector3(-1.0, 0, 0)); // Neck start
  points.push(new THREE.Vector3(-0.5, 0, 0)); // Neck end / Spiral start approach

  // 2. Spiral Section
  // Center of the spiral is roughly at (0.8, 0, 0)
  const centerX = 0.8;
  const centerY = 0;
  const startRadius = 0.15;
  const growthRate = 0.12;
  const totalRotations = 2.5; // 2.5 turns
  const spiralSteps = 60;

  for (let i = 0; i <= spiralSteps; i++) {
    const t = i / spiralSteps;
    const theta = t * totalRotations * Math.PI * 2;
    const r = startRadius + theta * growthRate;
    
    // Spiral in XY plane
    const x = centerX + r * Math.cos(theta);
    const y = centerY + r * Math.sin(theta);
    const z = 0;
    
    points.push(new THREE.Vector3(x, y, z));
  }

  const curve = new THREE.CatmullRomCurve3(points);

  // --- Geometry Construction ---
  // TubeGeometry creates a constant radius tube. We will taper it manually.
  const tubularSegments = 100;
  const radialSegments = 24;
  const maxRadius = 0.35;
  
  const geometry = new THREE.TubeGeometry(curve, tubularSegments, maxRadius, radialSegments, false);

  // --- Tapering Logic ---
  // Modify vertices to taper the radius from the spiral end (t=1) to the tip (t=0).
  // TubeGeometry vertices are ordered: [ring0_vertex0, ring0_vertex1, ..., ring1_vertex0, ...]
  const positionAttribute = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  const curvePoint = new THREE.Vector3();
  const direction = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    
    // Get the center point of the curve at this segment
    curve.getPoint(t, curvePoint);
    
    // Calculate scale factor. 
    // We want full radius at t=1 (spiral end) and 0 radius at t=0 (tip).
    // Use a power function for a smoother, more organic point.
    const scale = Math.pow(t, 2.5); 

    for (let j = 0; j <= radialSegments; j++) {
      const index = (i * (radialSegments + 1) + j) * 3;
      
      vertex.fromBufferAttribute(positionAttribute, index);
      
      // Vector from curve center to vertex
      direction.subVectors(vertex, curvePoint);
      
      // Scale the distance from the center
      direction.multiplyScalar(scale);
      
      // New position
      vertex.copy(curvePoint).add(direction);
      
      positionAttribute.setXYZ(index, vertex.x, vertex.y, vertex.z);
    }
  }

  geometry.computeVertexNormals();

  const shell = new THREE.Mesh(geometry, shellMat);
  root.add(shell);

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