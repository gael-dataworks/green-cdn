export default function generate(THREE) {
  // --- Configuration ---
  const CUBE_SIZE = 1.0;
  const GAP = 0.04;
  const BLOCK_SIZE = (CUBE_SIZE - GAP) / 2;
  const OFFSET = (CUBE_SIZE + GAP) / 4; // Distance from center to block center

  // --- Materials ---
  // Glossy plastic material for the puzzle blocks
  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.25,
  });

  // --- Procedural Texture Generation ---
  // Generates a colorful, wavy, abstract pattern similar to the reference
  function createAbstractPatternTexture(THREE) {
    const width = 512;
    const height = 512;
    const data = new Uint8Array(width * height * 4);
    
    // Color palette from reference: Red, Yellow, Green, Blue, Purple, Orange
    const colors = [
      { r: 220, g: 50, b: 50 },   // Red
      { r: 240, g: 200, b: 50 },  // Yellow
      { r: 50, g: 200, b: 50 },   // Green
      { r: 50, g: 100, b: 220 },  // Blue
      { r: 150, g: 50, b: 200 },  // Purple
      { r: 240, g: 120, b: 50 },  // Orange
    ];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;

        // Create organic waves using sine interference
        // We use multiple frequencies to create "cells" or "blobs"
        const f1 = Math.sin(u * 12.0 + v * 5.0);
        const f2 = Math.cos(u * 8.0 - v * 10.0);
        const f3 = Math.sin((u - 0.5) * 20.0 + (v - 0.5) * 20.0);
        
        // Combine waves to get a value between -1 and 1
        let noise = (f1 + f2 + f3 * 0.5) / 2.5;
        
        // Add some domain warping for fluid look
        const warpX = u + Math.sin(v * 10.0) * 0.05;
        const warpY = v + Math.cos(u * 10.0) * 0.05;
        const f4 = Math.sin(warpX * 15.0) * Math.cos(warpY * 15.0);
        noise = noise * 0.6 + f4 * 0.4;

        // Map noise value (-1 to 1) to color index
        // We want distinct bands, so we quantize or smoothstep
        const normalized = (noise + 1) / 2; // 0 to 1
        
        // Select color based on normalized value
        // Use smooth transitions
        const colorIdx = Math.floor(normalized * (colors.length - 0.01));
        const nextColorIdx = Math.min(colorIdx + 1, colors.length - 1);
        const t = (normalized * (colors.length - 1)) % 1;

        const c1 = colors[colorIdx];
        const c2 = colors[nextColorIdx];

        const r = c1.r + (c2.r - c1.r) * t;
        const g = c1.g + (c2.g - c1.g) * t;
        const b = c1.b + (c2.b - c1.b) * t;

        const idx = (y * width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    // Wrap to avoid seams if UVs go slightly out, though standard box UVs are 0-1
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    
    return texture;
  }

  const patternTexture = createAbstractPatternTexture(THREE);
  plasticMat.map = patternTexture;

  // --- Geometry ---
  // Use a box geometry. To simulate rounded edges without custom modifiers,
  // we use a standard box but the gaps and texture help the illusion.
  // We create one geometry and reuse it.
  const blockGeom = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

  // --- Assembly ---
  const root = new THREE.Group();

  // 2x2x2 Grid
  // Coordinates: -OFFSET, +OFFSET for x, y, z
  const positions = [-OFFSET, OFFSET];

  for (let x of positions) {
    for (let y of positions) {
      for (let z of positions) {
        const block = new THREE.Mesh(blockGeom, plasticMat);
        block.position.set(x, y, z);
        
        // Add slight deterministic rotation to vary the pattern orientation
        // This makes the 8 blocks look less identical and more like a scrambled puzzle
        // Using deterministic values based on position to avoid Math.random
        const seed = (x + 1) * 10 + (y + 1) * 3 + (z + 1);
        block.rotation.x = (seed % 3) * (Math.PI / 2);
        block.rotation.y = (seed % 2) * (Math.PI / 2);
        
        root.add(block);
      }
    }
  }

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