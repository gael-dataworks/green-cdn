export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Rose Gold (Polished) ---
  // Following METAL BRIGHTNESS rules: metalness <= 0.4, use emissive for brightness.
  const goldColor = 0xD48C6A; // Rose Gold
  const goldMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    metalness: 0.4,
    roughness: 0.25,
    emissive: goldColor,
    emissiveIntensity: 0.45,
  });

  // --- Dimensions ---
  const ringRadius = 0.35;      // Radius of the ring circle
  const bandRadius = 0.045;     // Thickness of the band
  const twists = 12;            // Number of spiral twists
  const strands = 4;            // Number of braided strands
  const grainsPerStrand = 28;   // Resolution of each strand
  const totalGrains = strands * grainsPerStrand;

  // --- Geometry: Flattened Capsule (Grain) ---
  // CapsuleGeometry(radius, length, capSegments, radialSegments)
  // Default orientation: Y-axis.
  const baseGrainGeom = new THREE.CapsuleGeometry(0.014, 0.025, 4, 8);
  // Flatten the grain to mimic the pressed links of a wheat chain
  baseGrainGeom.scale(1, 0.55, 1);

  // --- InstancedMesh for the Braided Strands ---
  const mesh = new THREE.InstancedMesh(baseGrainGeom, goldMat, totalGrains);
  const dummy = new THREE.Object3D();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  let instanceIndex = 0;

  for (let s = 0; s < strands; s++) {
    const phaseOffset = (s / strands) * Math.PI * 2;

    for (let i = 0; i < grainsPerStrand; i++) {
      // Parameter u: angle around the main ring (0 to 2PI)
      const u = (i / grainsPerStrand) * Math.PI * 2;
      // Parameter v: angle around the tube cross-section (spiraling)
      const v = u * twists + phaseOffset;

      // Toroidal Spiral Position
      // Ring lies in XZ plane, Y is thickness
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);

      const R = ringRadius;
      const r = bandRadius;

      const x = (R + r * cosV) * cosU;
      const y = r * sinV;
      const z = (R + r * cosV) * sinU;

      dummy.position.set(x, y, z);

      // Orientation: Align with the spiral tangent
      // Derivatives with respect to u (dv/du = twists)
      const k = twists;
      
      const dx = -r * sinV * k * cosU - (R + r * cosV) * sinU;
      const dy = r * cosV * k;
      const dz = -r * sinV * k * sinU + (R + r * cosV) * cosU;

      tangent.set(dx, dy, dz).normalize();

      // Capsule is Y-up. We want Y to align with tangent.
      // lookAt aligns Z. So we lookAt with Z, then rotate X by 90 deg to bring Y to Z's old place?
      // No, simpler: Construct quaternion from direction.
      // We want local Y to point along `tangent`.
      // Standard lookAt makes local Z point to target.
      // Let's use a temporary vector for lookAt target.
      dummy.lookAt(dummy.position.clone().add(tangent));
      // Now local Z is tangent. We want local Y to be tangent.
      // Rotate -90 deg around X to bring Y to Z? 
      // Y (0,1,0) -> rotateX(-PI/2) -> (0,0,1) which is Z.
      // So if we rotateX(PI/2), Z (0,0,1) -> (0,-1,0) which is -Y.
      // Let's just rotate so Y aligns with tangent.
      // Quaternion setFromUnitVectors(Up, Tangent)
      const q = new THREE.Quaternion().setFromUnitVectors(up, tangent);
      dummy.quaternion.copy(q);

      dummy.updateMatrix();
      mesh.setMatrixAt(instanceIndex++, dummy.matrix);
    }
  }

  root.add(mesh);

  // --- Inner Smooth Band (Optional, prevents holes in the weave) ---
  // A subtle inner tube ensures no gaps show through to the background if camera clips
  const innerBandGeom = new THREE.TorusGeometry(ringRadius, bandRadius * 0.6, 16, 64);
  const innerBand = new THREE.Mesh(innerBandGeom, goldMat);
  // Rotate to lie in XZ plane (Torus is XY by default)
  innerBand.rotation.x = Math.PI / 2;
  root.add(innerBand);

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