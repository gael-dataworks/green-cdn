export default function generate(THREE) {
  const root = new THREE.Group();

  // Materials - natural bamboo/wood appearance
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xd4c5a3,
    metalness: 0.0,
    roughness: 0.65,
  });

  const carvedMat = new THREE.MeshStandardMaterial({
    color: 0xc4b593,
    metalness: 0.0,
    roughness: 0.7,
  });

  const hoopMat = new THREE.MeshStandardMaterial({
    color: 0xe8d8b8,
    metalness: 0.0,
    roughness: 0.55,
  });

  // Dimensions
  const radius = 0.32;
  const height = 0.50;
  const staveCount = 18;
  const staveThickness = 0.028;
  const hoopRadius = radius + staveThickness / 2 + 0.002;
  const hoopThickness = 0.015;
  const hoopWidth = 0.030;

  // Body staves - vertical wooden planks forming cylinder
  const staveGeom = new THREE.BoxGeometry(0.055, height, staveThickness);
  for (let i = 0; i < staveCount; i++) {
    const angle = (i / staveCount) * Math.PI * 2;
    const stave = new THREE.Mesh(staveGeom, woodMat);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    stave.position.set(x, 0, z);
    stave.rotation.y = -angle;
    root.add(stave);
  }

  // Base disc - flat bottom
  const baseGeom = new THREE.CylinderGeometry(radius - 0.01, radius - 0.01, 0.015, 32);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.y = -height / 2 - 0.0075;
  root.add(base);

  // Top hoop - simple bamboo binding ring
  const topHoopGeom = new THREE.TorusGeometry(hoopRadius, hoopThickness, 12, 48);
  const topHoop = new THREE.Mesh(topHoopGeom, hoopMat);
  topHoop.rotation.x = Math.PI / 2;
  topHoop.position.y = height / 2 - hoopWidth / 2 - 0.015;
  root.add(topHoop);

  // Bottom hoop - simple bamboo binding ring
  const bottomHoopGeom = new THREE.TorusGeometry(hoopRadius, hoopThickness, 12, 48);
  const bottomHoop = new THREE.Mesh(bottomHoopGeom, hoopMat);
  bottomHoop.rotation.x = Math.PI / 2;
  bottomHoop.position.y = -height / 2 + hoopWidth / 2 + 0.015;
  root.add(bottomHoop);

  // Top carved decorative band - simpler scroll pattern
  const topBandY = height / 2 - 0.09;
  const topBandRadius = radius + staveThickness + 0.003;
  
  function addTopCarveMotif(angleIndex, total) {
    const angle = (angleIndex / total) * Math.PI * 2;
    const x = Math.cos(angle) * topBandRadius;
    const z = Math.sin(angle) * topBandRadius;
    
    // Curved scroll element
    const scrollGeom = new THREE.TorusGeometry(0.025, 0.006, 8, 16, Math.PI * 0.7);
    const scroll = new THREE.Mesh(scrollGeom, carvedMat);
    scroll.position.set(x, topBandY, z);
    scroll.rotation.x = Math.PI / 2;
    scroll.rotation.y = -angle + Math.PI / 4;
    root.add(scroll);
    
    // Small flower center
    const flowerGeom = new THREE.SphereGeometry(0.008, 8, 6);
    const flower = new THREE.Mesh(flowerGeom, carvedMat);
    flower.position.set(x, topBandY + 0.008, z);
    root.add(flower);
  }
  
  for (let i = 0; i < 8; i++) {
    addTopCarveMotif(i, 8);
  }

  // Bottom carved decorative band - elaborate floral/scroll pattern
  const bottomBandY = -height / 2 + 0.09;
  const bottomBandRadius = radius + staveThickness + 0.003;
  
  function addBottomCarveMotif(angleIndex, total) {
    const angle = (angleIndex / total) * Math.PI * 2;
    const x = Math.cos(angle) * bottomBandRadius;
    const z = Math.sin(angle) * bottomBandRadius;
    
    // Main curved vine/scroll
    const vineGeom = new THREE.TorusGeometry(0.035, 0.007, 8, 20, Math.PI * 0.8);
    const vine = new THREE.Mesh(vineGeom, carvedMat);
    vine.position.set(x, bottomBandY, z);
    vine.rotation.x = Math.PI / 2;
    vine.rotation.y = -angle + Math.PI / 6;
    vine.rotation.z = Math.PI / 8;
    root.add(vine);
    
    // Flower petals - 5 petals around center
    for (let p = 0; p < 5; p++) {
      const petalAngle = (p / 5) * Math.PI * 2 + angle;
      const petalDist = 0.018;
      const px = Math.cos(petalAngle) * bottomBandRadius + Math.cos(petalAngle) * petalDist;
      const pz = Math.sin(petalAngle) * bottomBandRadius + Math.sin(petalAngle) * petalDist;
      
      const petalGeom = new THREE.SphereGeometry(0.010, 8, 6);
      const petal = new THREE.Mesh(petalGeom, carvedMat);
      petal.scale.set(1, 0.5, 1.5);
      petal.position.set(px, bottomBandY + 0.010, pz);
      petal.rotation.y = -petalAngle;
      root.add(petal);
    }
    
    // Flower center
    const centerGeom = new THREE.SphereGeometry(0.009, 8, 6);
    const center = new THREE.Mesh(centerGeom, carvedMat);
    center.position.set(x, bottomBandY + 0.012, z);
    root.add(center);
    
    // Leaf element
    const leafGeom = new THREE.SphereGeometry(0.012, 8, 6);
    const leaf = new THREE.Mesh(leafGeom, carvedMat);
    leaf.scale.set(1, 0.3, 2);
    const leafAngle = angle + Math.PI / 5;
    const lx = Math.cos(leafAngle) * bottomBandRadius;
    const lz = Math.sin(leafAngle) * bottomBandRadius;
    leaf.position.set(lx, bottomBandY + 0.005, lz);
    leaf.rotation.y = -leafAngle;
    leaf.rotation.x = Math.PI / 6;
    root.add(leaf);
  }
  
  for (let i = 0; i < 6; i++) {
    addBottomCarveMotif(i, 6);
  }

  // Rim top edge - slight lip
  const rimGeom = new THREE.TorusGeometry(hoopRadius + 0.005, 0.008, 12, 48);
  const rim = new THREE.Mesh(rimGeom, woodMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = height / 2 - 0.005;
  root.add(rim);

  // Hoop fastener detail - small visible joint on one side
  const fastenerGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.025, 8);
  const fastener = new THREE.Mesh(fastenerGeom, hoopMat);
  fastener.rotation.z = Math.PI / 2;
  fastener.position.set(hoopRadius + 0.008, height / 2 - hoopWidth / 2 - 0.015, 0);
  root.add(fastener);

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