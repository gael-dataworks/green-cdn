export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material with emissive boost to ensure brightness in the dim renderer
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xffd700,
    emissiveIntensity: 0.35,
  });

  // Ring dimensions
  const ringRadius = 0.35;      // Distance from center to tube center
  const strandRadius = 0.055;   // Thickness of the braid strands
  const wraps = 14;             // How many times the strand spirals around the ring
  const tubeSegments = 256;     // Smoothness along the spiral
  const radialSegments = 12;    // Smoothness of the tube cross-section
  const strandCount = 4;        // Number of interwoven strands

  // Helper to create a helical path on a torus
  // The ring lies in the XY plane (vertical like on a finger), facing +Z
  function createHelixPath(strandIndex) {
    const points = [];
    const phaseOffset = (strandIndex / strandCount) * Math.PI * 2;
    
    for (let i = 0; i <= tubeSegments; i++) {
      const t = i / tubeSegments;
      const u = t * Math.PI * 2;                  // Angle around the main ring
      const v = t * Math.PI * 2 * wraps + phaseOffset; // Angle around the tube cross-section

      // Torus parametric equation (Vertical Ring in XY plane)
      const x = (ringRadius + strandRadius * Math.cos(v)) * Math.cos(u);
      const y = (ringRadius + strandRadius * Math.cos(v)) * Math.sin(u);
      const z = strandRadius * Math.sin(v);

      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  // Generate the 4 strands
  for (let i = 0; i < strandCount; i++) {
    const path = createHelixPath(i);
    const geometry = new THREE.TubeGeometry(path, tubeSegments, strandRadius, radialSegments, false);
    
    const mesh = new THREE.Mesh(geometry, goldMat);
    
    // Flatten the strands slightly to mimic the flat links of a Singapore/Byzantine chain
    // Scale Z (thickness) down relative to X and Y
    mesh.scale.set(1, 1, 0.6);
    
    root.add(mesh);
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