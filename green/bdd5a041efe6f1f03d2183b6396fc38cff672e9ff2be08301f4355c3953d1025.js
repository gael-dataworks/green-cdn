export default function generate(THREE) {
  const root = new THREE.Group();

  // Material: Iridescent Metallic
  // Using MeshPhysicalMaterial for iridescence and high reflectivity.
  // Metalness capped at 0.6 per safety rules.
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xd040d0,        // Purple/Pink base
    metalness: 0.6,         // High metalness for chrome look
    roughness: 0.15,        // Very smooth
    iridescence: 1.0,       // Enable rainbow sheen
    iridescenceIOR: 1.3,    // Thin film IOR
    clearcoat: 1.0,         // Extra glossy layer
    clearcoatRoughness: 0.1,
  });

  // --- Geometry Construction: Variable Radius Tube ---
  // The object is a teardrop shape that curls into a spiral.
  // We define a centerline path and a radius profile.

  const pathPoints = [];
  const radii = [];

  // 1. The Tail (Teardrop part)
  // Points along X axis, tapering from body to tip.
  const tipPos = new THREE.Vector3(-1.8, 0, 0);
  const neckPos = new THREE.Vector3(-0.8, 0, 0);
  const bodyCenter = new THREE.Vector3(0, 0, 0);
  
  // Tail segments
  const tailSteps = 20;
  for (let i = 0; i <= tailSteps; i++) {
    const t = i / tailSteps;
    // Lerp from tip to body center
    const pos = new THREE.Vector3().lerpVectors(tipPos, bodyCenter, t);
    // Add a slight curve upwards for organic feel
    pos.y += Math.sin(t * Math.PI) * 0.1; 
    pathPoints.push(pos);
    
    // Radius profile: 0 at tip, max at body
    // Using a sine ease for smooth taper
    const r = 0.02 + 0.55 * Math.pow(Math.sin(t * Math.PI / 2), 1.5);
    radii.push(r);
  }

  // 2. The Spiral (Nautilus shell part)
  // Spirals in the XY plane, starting from body center and winding inward.
  const spiralCenter = new THREE.Vector3(0.6, 0, 0);
  const spiralStartRadius = 0.6;
  const spiralEndRadius = 0.15;
  const spiralTurns = 1.8;
  const spiralSteps = 60;

  for (let i = 0; i <= spiralSteps; i++) {
    const t = i / spiralSteps;
    const angle = t * spiralTurns * Math.PI * 2;
    // Radius decreases as we go inward (t goes 0->1)
    // But visually the spiral grows outward from center. 
    // Let's trace from Body -> Outer Spiral -> Inner Spiral center.
    // Actually, the image shows the spiral winding *in* towards a center point on the right.
    // So the path goes from Body (left of spiral) -> Outer Loop -> Inner Loop.
    
    // Let's adjust: Path continues from bodyCenter.
    // We want a spiral that starts wide and gets tight.
    // Angle starts at PI (left side) and goes to 0? Or continues?
    // Let's just define points in XY plane.
    
    const currentR = spiralStartRadius - (spiralStartRadius - spiralEndRadius) * t;
    // Spiral equation: x = cx + r * cos(a), y = cy + r * sin(a)
    // We want it to wrap around (0.6, 0).
    // Start angle: PI (pointing left, connecting to body)
    // End angle: 0 (pointing right, at center)
    // Wait, standard spiral: angle increases, radius increases.
    // Here we trace the centerline of the shell wall.
    // Let's trace from the body connection (outer) to the center (inner).
    
    const a = Math.PI + (1 - t) * 1.8 * Math.PI; // Starts at PI, ends near 0 (wrapping around)
    // Actually, let's just make it a simple arc that tightens.
    
    const px = spiralCenter.x + currentR * Math.cos(a);
    const py = spiralCenter.y + currentR * Math.sin(a);
    
    pathPoints.push(new THREE.Vector3(px, py, 0));
    radii.push(0.55 + 0.1 * (1-t)); // Radius stays thick, maybe tapers slightly at very end
  }

  const curve = new THREE.CatmullRomCurve3(pathPoints);
  
  // Custom Variable Tube Geometry Generator
  function createVariableTube(curve, radiiArray, tubularSegments, radialSegments) {
    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const points = curve.getSpacedPoints(tubularSegments);
    
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const point = points[i];
      const normal = frames.normals[i];
      const binormal = frames.binormals[i];
      
      // Interpolate radius
      const rIndex = Math.floor(t * (radiiArray.length - 1));
      const rNext = Math.min(rIndex + 1, radiiArray.length - 1);
      const rFrac = (t * (radiiArray.length - 1)) - rIndex;
      const radius = radiiArray[rIndex] * (1 - rFrac) + radiiArray[rNext] * rFrac;

      for (let j = 0; j <= radialSegments; j++) {
        const u = (j / radialSegments) * Math.PI * 2;
        const cx = Math.cos(u) * radius;
        const cy = Math.sin(u) * radius;
        
        // Vertex = point + normal * cx + binormal * cy
        const vx = point.x + normal.x * cx + binormal.x * cy;
        const vy = point.y + normal.y * cx + binormal.y * cy;
        const vz = point.z + normal.z * cx + binormal.z * cy;
        
        vertices.push(vx, vy, vz);
        
        // Normal (approximate radial)
        normals.push(normal.x * Math.cos(u) + binormal.x * Math.sin(u),
                     normal.y * Math.cos(u) + binormal.y * Math.sin(u),
                     normal.z * Math.cos(u) + binormal.z * Math.sin(u));
        
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    // Indices
    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = i * (radialSegments + 1) + j;
        const b = i * (radialSegments + 1) + j + 1;
        const c = (i + 1) * (radialSegments + 1) + j;
        const d = (i + 1) * (radialSegments + 1) + j + 1;
        
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }

  // Main Body Mesh
  const bodyGeom = createVariableTube(curve, radii, 100, 24);
  const bodyMesh = new THREE.Mesh(bodyGeom, shellMat);
  root.add(bodyMesh);

  // Spiral Ridge Detail
  // Add a raised ridge along the outer edge of the spiral to match the reference.
  // We create a second, thinner tube that follows the spiral path but is offset outwards.
  const ridgePoints = [];
  const ridgeRadii = [];
  
  // Reuse spiral logic for ridge path
  const ridgeStartIdx = tailSteps + 1; // Start where spiral begins
  const totalPoints = pathPoints.length;
  
  for (let i = ridgeStartIdx; i < totalPoints; i++) {
    const p = pathPoints[i];
    const r = radii[i];
    // Offset outward from spiral center (0.6, 0, 0)
    const dir = new THREE.Vector3(p.x - 0.6, p.y - 0, p.z - 0).normalize();
    const offsetP = p.clone().add(dir.multiplyScalar(r * 0.6)); // Offset by 60% of radius
    ridgePoints.push(offsetP);
    ridgeRadii.push(0.04); // Thin ridge
  }

  if (ridgePoints.length > 2) {
    const ridgeCurve = new THREE.CatmullRomCurve3(ridgePoints);
    const ridgeGeom = createVariableTube(ridgeCurve, ridgeRadii, 60, 12);
    const ridgeMesh = new THREE.Mesh(ridgeGeom, shellMat);
    root.add(ridgeMesh);
  }

  // Normalization
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