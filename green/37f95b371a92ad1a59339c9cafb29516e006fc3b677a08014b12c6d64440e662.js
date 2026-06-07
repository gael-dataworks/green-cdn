export default function generate(THREE) {
  const root = new THREE.Group();

  // --- Material: Deep Blue Sapphire/Tanzanite ---
  // Using MeshPhysicalMaterial for volumetric glass/gem behavior.
  // flatShading is crucial for the faceted look.
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x1a44c0,            // Deep royal blue base
    metalness: 0.0,
    roughness: 0.1,             // Very polished
    transmission: 0.95,         // Highly transparent
    ior: 1.77,                  // Sapphire refractive index
    thickness: 0.8,             // Volume thickness for refraction
    attenuationColor: 0x1a44c0, // Absorption color (makes thick parts darker blue)
    attenuationDistance: 0.4,   // Distance over which color absorbs
    transparent: true,
    flatShading: true,          // Distinct facets
    side: THREE.DoubleSide,
  });

  // --- Geometry: Cushion Cut Gem ---
  // We start with a CylinderGeometry and modify vertices to create the cut.
  // radialSegments = 8 gives us an octagon, which approximates a rounded square (cushion).
  // heightSegments = 2 gives us 3 rings: Top (Table), Middle (Girdle), Bottom (Culet).
  const radius = 0.5;
  const height = 0.6;
  const radialSegments = 8;
  const heightSegments = 2;
  
  const geom = new THREE.CylinderGeometry(radius, radius, height, radialSegments, heightSegments, false);
  const posAttr = geom.attributes.position;
  const vertex = new THREE.Vector3();

  // We have 3 rings of vertices:
  // Ring 0 (Top): indices 0 to 7
  // Ring 1 (Middle/Girdle): indices 8 to 15
  // Ring 2 (Bottom): indices 16 to 23
  
  // Helper to get ring index
  function getRingIndex(vertexIndex) {
    return Math.floor(vertexIndex / radialSegments);
  }

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    
    const ring = getRingIndex(i);
    const angle = Math.atan2(vertex.z, vertex.x);
    
    // Calculate distance from center in XZ plane
    let dist = Math.sqrt(vertex.x * vertex.x + vertex.z * vertex.z);
    
    // --- Shape Modification ---
    
    if (ring === 1) {
      // GIRDLE (Middle Ring): Widest part.
      // Make it a "cushion" shape (square with rounded corners).
      // We modulate the radius based on angle.
      // Square-ish formula: r = 1 / max(|cos|, |sin|)
      // We blend this with a circle to get rounded corners.
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      const squareFactor = 1.0 / Math.max(cos, sin);
      // Blend: 0.7 circle + 0.3 square influence to keep it somewhat rounded but squared
      const shapeScale = 0.6 + 0.4 * squareFactor; 
      dist *= shapeScale;
      
      // Update x, z
      vertex.x = Math.cos(angle) * dist;
      vertex.z = Math.sin(angle) * dist;
      
    } else if (ring === 0) {
      // TABLE (Top Ring): Smaller than girdle, flat top.
      // Scale down significantly.
      const tableScale = 0.55; 
      // Apply same cushion shape as girdle but smaller
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      const squareFactor = 1.0 / Math.max(cos, sin);
      const shapeScale = 0.6 + 0.4 * squareFactor;
      
      vertex.x = Math.cos(angle) * dist * tableScale * shapeScale;
      vertex.z = Math.sin(angle) * dist * tableScale * shapeScale;
      // Keep Y at top (height/2)
      vertex.y = height / 2;
      
    } else if (ring === 2) {
      // CULET (Bottom Ring): Pointed tip.
      // Collapse to center.
      vertex.x = 0;
      vertex.z = 0;
      vertex.y = -height / 2;
    }

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geom.computeVertexNormals();

  const gem = new THREE.Mesh(geom, gemMat);
  // Rotate slightly to show off facets and table
  gem.rotation.x = Math.PI / 8;
  gem.rotation.y = Math.PI / 8;
  
  root.add(gem);

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