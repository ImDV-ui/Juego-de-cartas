const fs = require('fs');
const THREE = require('three');
// No GLTFLoader in plain node easily without JSDOM or similar unless we parse the JSON part of the GLB.
// A GLB is a binary file. We can just parse the JSON chunk.

const buffer = fs.readFileSync('assets/images/animated_donkey_kong_original.glb');
// Read GLB header
const magic = buffer.readUInt32LE(0);
const version = buffer.readUInt32LE(4);
const length = buffer.readUInt32LE(8);

// Read JSON chunk
const chunkLength = buffer.readUInt32LE(12);
const chunkType = buffer.readUInt32LE(16); // Should be 0x4E4F534A (JSON)
const jsonChunk = buffer.toString('utf8', 20, 20 + chunkLength);

const gltf = JSON.parse(jsonChunk);

console.log("Materials:");
if (gltf.materials) {
    gltf.materials.forEach((m, i) => {
        console.log(`Material ${i}:`, m.name, m.pbrMetallicRoughness);
    });
} else {
    console.log("No materials found");
}

console.log("\nMeshes:");
if (gltf.meshes) {
    gltf.meshes.forEach((m, i) => {
        console.log(`Mesh ${i}:`, m.name);
        m.primitives.forEach(p => {
            console.log(`  Primitive material index: ${p.material}`);
        });
    });
} else {
    console.log("No meshes found");
}

