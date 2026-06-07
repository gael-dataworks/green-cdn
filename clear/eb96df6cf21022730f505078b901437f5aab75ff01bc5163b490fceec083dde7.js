export default function generate(THREE) {
  const root = new THREE.Group();

  // Gold material - warm yellow gold. 
  // Metalness capped at 0.6 per rules to avoid black rendering without env map.
  // Emissive added to ensure brightness against white background.
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.6,
    roughness: 0.25,
    emissive: 0xD4AF37,
    emissiveIntensity: 0.35,
  });

  // Ring dimensions
  const baseRadius = 0.35;
  const tubeRadius = 0.038;
  const waveCount = 16;
  const waveAmp = 0.045;
  const tubularSegments = 200;
  const radialSegments = 14;

  // Helper to create a wavy circular path for the braid strands
  function createBraidedPath(phaseOffset) {
    const points = [];
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const angle = t * Math.PI * 2;
      
      // Calculate the wave phase for this point
      const wavePhase = angle * waveCount + phaseOffset;
      
      // Oscillate radius and height to create the weave
      const currentRadius = baseRadius + waveAmp * Math.cos(wavePhase);
      const y = waveAmp * Math.sin(wavePhase);
      
      // Convert polar to cartesian (ring lies in XZ plane)
      const x = currentRadius * Math.cos(angle);
      const z = currentRadius * Math.sin(angle);
      
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }

  // Create two intertwined strands to simulate the braid/foxtail pattern
  const path1 = createBraidedPath(0);
  const path2 = createBraidedPath(Math.PI);

  const tubeGeom1 = new THREE.TubeGeometry(path1, tubularSegments, tubeRadius, radialSegments, false);
  const tubeGeom2 = new THREE.TubeGeometry(path2, tubularSegments, tubeRadius, radialSegments, false);

  const strand1 = new THREE.Mesh(tubeGeom1, goldMat);
  const strand2 = new THREE.Mesh(tubeGeom2, goldMat);

  // Flatten the tubes slightly to resemble metal links/ribbons rather than round ropes
  strand1.scale.y = 0.7;
  strand2.scale.y = 0.7;

  root.add(strand1);
  root.add(strand2);

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