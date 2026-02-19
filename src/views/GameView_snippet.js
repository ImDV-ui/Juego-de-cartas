loadMarioModels() {
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('assets/images/Mario/');
    mtlLoader.load('mariotroph.mtl', (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('assets/images/Mario/');
        objLoader.load('mariotroph.obj', (object) => {
            // Apply optional gold override if needed or trust the MTL
            // Scaling
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim; // Make it about 2 units tall

            object.scale.set(scale, scale, scale);

            // Mario Left
            const marioLeft = object.clone();
            marioLeft.position.set(-5.5, 4, 1);
            // Rotate to face center/camera
            marioLeft.rotation.y = Math.PI / 2;
            marioLeft.castShadow = true;
            marioLeft.receiveShadow = true;

            // Traverse to enable shadows on all meshes
            marioLeft.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(marioLeft);

            // Mario Right
            const marioRight = object.clone();
            marioRight.position.set(5.5, 4, 1);
            // Rotate to face center/camera (opposite)
            marioRight.rotation.y = -Math.PI / 2;
            marioRight.castShadow = true;
            marioRight.receiveShadow = true;

            marioRight.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(marioRight);

        }, undefined, (error) => {
            console.error('An error occurred loading Mario model:', error);
        });
    });
}
