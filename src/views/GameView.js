import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 15, 13);
        this.camera.lookAt(0, -1, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.pusherMesh = null;
        this.pendingCoins = [];

        this.coinGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.3, 16);
        this.coinGeometry.rotateX(-Math.PI / 2);

        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.1,
            roughness: 0.7,
            emissive: 0x221100,
            emissiveIntensity: 0.2
        });

        this.setupLights();
        this.createCabinet();

        this.loader = new ColladaLoader();
        this.coinModelTemplate = new THREE.Group();

        this.loader.load('assets/images/coin.dae', (collada) => {
            const model = collada.scene;

            const shinyGoldMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(255 / 255, 255 / 255, 20 / 255),
                emissive: new THREE.Color(173 / 255, 137 / 255, 16 / 255),
                emissiveIntensity: 0.4,
                metalness: 0.8,
                roughness: 0.2,
                side: THREE.DoubleSide
            });

            model.traverse((child) => {
                if (child.isMesh || child.isSkinnedMesh) {
                    const cleanGeom = child.geometry.clone();
                    cleanGeom.computeVertexNormals();

                    const mesh = new THREE.Mesh(cleanGeom, shinyGoldMaterial);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;

                    mesh.position.copy(child.position);
                    mesh.quaternion.copy(child.quaternion);
                    mesh.scale.copy(child.scale);

                    this.coinModelTemplate.add(mesh);

                    const edges = new THREE.EdgesGeometry(cleanGeom, 15);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));

                    line.position.copy(child.position);
                    line.quaternion.copy(child.quaternion);
                    line.scale.copy(child.scale);

                    this.coinModelTemplate.add(line);
                }
            });

            const box = new THREE.Box3().setFromObject(this.coinModelTemplate);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            this.coinModelTemplate.children.forEach(child => {
                child.position.sub(center);
            });

            const maxDimension = Math.max(size.x, size.y, size.z);
            const exactScale = 1.2 / maxDimension;

            this.coinModelTemplate.scale.set(exactScale, exactScale, exactScale);
            this.coinModelTemplate.rotation.set(0, 0, 0);

            this.pendingCoins.forEach(group => {
                group.clear();
                group.add(this.coinModelTemplate.clone());
            });
            this.pendingCoins = [];

            console.log("Moneda renderizada con luz e iluminación correcta.");
        });

        this.mixers = [];

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.1);
        directionalLight.position.set(3, 15, 8);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.radius = 2;
        this.scene.add(directionalLight);
    }

    createCabinet() {
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xc84c0c, roughness: 0.8, metalness: 0.1 });

        const textureLoader = new THREE.TextureLoader();
        const brickTexture = textureLoader.load('assets/images/BlockBrick2D.png');
        brickTexture.wrapS = THREE.RepeatWrapping;
        brickTexture.wrapT = THREE.RepeatWrapping;
        brickTexture.repeat.set(1, 1);
        brickTexture.magFilter = THREE.NearestFilter;

        const grassTexture = this.createProceduralGrassTexture();

        const wallMaterial = new THREE.MeshStandardMaterial({
            map: brickTexture,
            roughness: 0.6,
            metalness: 0.1
        });

        const grassMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.0
        });

        const pusherBoxMaterial = new THREE.MeshStandardMaterial({
            color: 0x5a5a5a,
            roughness: 0.9,
            metalness: 0.1
        });

        const pusherMaterials = [
            pusherBoxMaterial, pusherBoxMaterial, pusherBoxMaterial,
            pusherBoxMaterial, pusherBoxMaterial, pusherBoxMaterial
        ];

        const sweeperMaterial = new THREE.MeshStandardMaterial({ color: 0x6b2d08, roughness: 0.9 });

        const floorGeo = new THREE.BoxGeometry(10, 1, 10);
        const floor = new THREE.Mesh(floorGeo, floorMaterial);
        floor.position.set(0, -0.5, 2);
        floor.receiveShadow = true;
        this.scene.add(floor);

        const blockGeo = new THREE.BoxGeometry(1, 1, 1);

        const createBlockStructure = (width, height, depth, material, positionOffset) => {
            const group = new THREE.Group();
            group.position.copy(positionOffset);

            const startX = -(width - 1) / 2;
            const startY = -(height - 1) / 2;
            const startZ = -(depth - 1) / 2;

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    for (let z = 0; z < depth; z++) {
                        const block = new THREE.Mesh(blockGeo, material);
                        block.position.set(
                            startX + x,
                            startY + y,
                            startZ + z
                        );
                        block.castShadow = true;
                        block.receiveShadow = true;
                        group.add(block);
                    }
                }
            }
            return group;
        };

        const leftWallGroup = createBlockStructure(1, 4, 12, wallMaterial, new THREE.Vector3(-5.5, 2, 1));
        this.scene.add(leftWallGroup);

        const rightWallGroup = createBlockStructure(1, 4, 12, wallMaterial, new THREE.Vector3(5.5, 2, 1));
        this.scene.add(rightWallGroup);

        const pusherGeo = new THREE.BoxGeometry(10, 2, 10);
        pusherGeo.translate(0, 0.5, 0);
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMaterials);
        this.pusherMesh.position.set(0, 0.45, -4);
        this.pusherMesh.receiveShadow = true;
        this.pusherMesh.castShadow = true;
        this.scene.add(this.pusherMesh);

        // Movemos el techo de la barredora visualmente hacia adelante (z = -3.0)
        // Eliminado sweeperMesh normal para poner EL CASTILLO
        const castleStructure = this.createCastleStructure();
        this.scene.add(castleStructure);

        this.loadMarioModels();
        this.loadDancingKongModel();

        this.loadThwompPusher();
    }

    loadThwompPusher() {
        const gltfLoader = new GLTFLoader();

        gltfLoader.load('assets/images/thwomp.glb', (gltf) => {
            const object = gltf.scene;

            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / maxDim;

            const numThwomps = 5;
            const pusherWidth = 10;
            const spacing = pusherWidth / numThwomps;
            const startX = -(pusherWidth / 2) + (spacing / 2);

            for (let i = 0; i < numThwomps; i++) {
                const wrapper = new THREE.Group();
                const thwomp = object.clone();

                thwomp.position.set(-center.x, -center.y, -center.z);

                wrapper.add(thwomp);
                wrapper.scale.set(scale, scale * 0.98, scale);
                wrapper.position.set(startX + (i * spacing), 0.45, 5.0);

                wrapper.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                if (this.pusherMesh) {
                    this.pusherMesh.add(wrapper);
                }
            }

            console.log("✅ Rocas Thwomp (.glb) cargadas con éxito y pegadas al empujador.");

        }, undefined, (error) => {
            console.error('❌ Error al cargar thwomp.glb:', error);
        });
    }

    loadMarioModels() {
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath('assets/images/Mario/');
        mtlLoader.load('mariotroph.mtl', (materials) => {
            materials.preload();

            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('assets/images/Mario/');
            objLoader.load('mariotroph.obj', (object) => {

                const box = new THREE.Box3().setFromObject(object);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.0 / maxDim;

                object.scale.set(scale, scale, scale);

                const marioLeft = object.clone();
                marioLeft.position.set(-5.5, 4, 3.5);
                marioLeft.rotation.y = Math.PI / 2;

                marioLeft.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.scene.add(marioLeft);

                const marioRight = object.clone();
                marioRight.position.set(5.5, 4, 3.5);
                marioRight.rotation.y = -Math.PI / 2;

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

    loadDancingKongModel() {
        const gltfLoader = new GLTFLoader();

        gltfLoader.load('assets/images/donkey_kong_dancing.glb', (gltf) => {
            const dancingKong = gltf.scene;

            const scale = 1.3;
            dancingKong.scale.set(scale, scale, scale);

            const yOffset = 4.8; // Adjust to stand on the castle better
            const zOffset = 0.6; // Slightly forward towards the edge

            dancingKong.position.set(0, yOffset, zOffset);
            dancingKong.rotation.set(0, 0, 0);

            dancingKong.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(dancingKong);

            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(dancingKong);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                this.mixers.push(mixer);
            }

            console.log("✅ Modelo Dancing Kong cargado y animado correctamente.");
        }, undefined, (error) => {
            console.error('❌ Error cargando el modelo Dancing Kong:', error);
        });
    }

    createBarrelMesh(position, quaternion) {
        const geometry = new THREE.CylinderGeometry(0.9, 0.9, 4.0, 16);
        geometry.rotateZ(Math.PI / 2);

        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('assets/images/barril/skbarrelTex0.png');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        texture.repeat.set(1, 0.5);
        texture.offset.set(0, 0);

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.8,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(position);
        mesh.quaternion.copy(quaternion);

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
        return mesh;
    }

    removeBarrelMesh(mesh) {
        if (mesh) {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
    }

    createCastleStructure() {
        const textureLoader = new THREE.TextureLoader();
        const brickTexture = textureLoader.load('assets/images/BlockBrick2D.png');
        brickTexture.wrapS = THREE.RepeatWrapping;
        brickTexture.wrapT = THREE.RepeatWrapping;
        brickTexture.magFilter = THREE.NearestFilter;

        const wallMaterial = new THREE.MeshStandardMaterial({
            map: brickTexture,
            roughness: 0.6,
            metalness: 0.1
        });

        // 3 Niveles del castillo construidos matemáticamente, garantizando 
        // número de bloques impar para almenas perfectas en las esquinas.
        // Se ha eliminado la fila inferior (y=2) para evitar recortes con la barrera empujadora.
        const levels = [
            {
                bounds: { xMin: -5, xMax: 5, zMin: -6, zMax: 0, yMin: 3, yMax: 4 },
                isArch: (x, y, z) => (x === -3 || x === 0 || x === 3) && (y === 3) && (z === 0 || z === -1)
            },
            {
                bounds: { xMin: -3, xMax: 3, zMin: -6, zMax: -2, yMin: 5, yMax: 7 },
                isArch: (x, y, z) => (x === -1 || x === 1) && (y === 5 || y === 6) && (z === -2 || z === -3)
            },
            {
                bounds: { xMin: -1, xMax: 1, zMin: -6, zMax: -4, yMin: 8, yMax: 10 },
                isArch: (x, y, z) => (x === 0) && (y === 8 || y === 9) && (z === -4 || z === -5)
            }
        ];

        let blocksInfo = [];

        levels.forEach((level, i) => {
            let b = level.bounds;
            let nextB = levels[i + 1] ? levels[i + 1].bounds : null;

            for (let x = b.xMin; x <= b.xMax; x++) {
                for (let z = b.zMin; z <= b.zMax; z++) {

                    for (let y = b.yMin; y <= b.yMax; y++) {
                        if (!level.isArch(x, y, z)) {
                            blocksInfo.push({ x, y, z });
                        }
                    }

                    let isCovered = false;
                    if (nextB) {
                        if (x >= nextB.xMin && x <= nextB.xMax && z >= nextB.zMin && z <= nextB.zMax) {
                            isCovered = true;
                        }
                    }

                    if (!isCovered) {
                        let isXEdge = (x === b.xMin || x === b.xMax);
                        let isZEdge = (z === b.zMin || z === b.zMax);

                        let keep = false;
                        if (isXEdge && Math.abs(z - b.zMin) % 2 === 0) keep = true;
                        if (isZEdge && Math.abs(x - b.xMin) % 2 === 0) keep = true;

                        if (keep) {
                            blocksInfo.push({ x, y: b.yMax + 1, z });
                        }
                    }
                }
            }
        });

        const blockGeo = new THREE.BoxGeometry(1, 1, 1);
        const instancedMesh = new THREE.InstancedMesh(blockGeo, wallMaterial, blocksInfo.length);
        instancedMesh.castShadow = true;
        instancedMesh.receiveShadow = true;

        const dummy = new THREE.Object3D();
        blocksInfo.forEach((pos, idx) => {
            // Desplazamos Y en -0.5 para que apoye rasante con el suelo y el fondo físico.
            // Desplazamos Z en +0.5 para que la cara frontal (Z=0) caiga en Z=1 visual perfecto.
            dummy.position.set(pos.x, pos.y - 0.5, pos.z + 0.5);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(idx, dummy.matrix);
        });

        instancedMesh.instanceMatrix.needsUpdate = true;
        return instancedMesh;
    }

    createProceduralGrassTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, size, size);

        const lightGreen = '#58d854';
        const darkGreen = '#005000';

        for (let i = 0; i < 200; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            const w = Math.floor(Math.random() * 3) + 1;
            const h = Math.floor(Math.random() * 3) + 1;

            ctx.fillStyle = Math.random() > 0.5 ? lightGreen : darkGreen;
            ctx.fillRect(x, y, w, h);
        }

        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.1;
        for (let y = 0; y < size; y += 4) {
            ctx.fillRect(0, y, size, 1);
        }
        ctx.globalAlpha = 1.0;

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.colorSpace = THREE.SRGBColorSpace;

        return texture;
    }

    createCoinMesh(position, quaternion) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.quaternion.copy(quaternion);

        if (this.coinModelTemplate && this.coinModelTemplate.children.length > 0) {
            group.add(this.coinModelTemplate.clone());
        } else {
            const fallbackMesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
            fallbackMesh.castShadow = true;
            fallbackMesh.receiveShadow = true;
            group.add(fallbackMesh);

            this.pendingCoins.push(group);
        }

        this.scene.add(group);
        return group;
    }

    removeCoinMesh(mesh) {
        this.scene.remove(mesh);
    }

    createCardTexture(imageUrl) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 768;

        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#fdf6e3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.src = imageUrl;

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        img.onload = () => {
            const aspectCanvas = canvas.width / canvas.height;
            const aspectImg = img.width / img.height;

            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectImg > aspectCanvas) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * aspectImg;
                offsetX = -(drawWidth - canvas.width) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / aspectImg;
                offsetY = -(drawHeight - canvas.height) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            texture.needsUpdate = true;
        };

        return texture;
    }

    createCardItemMesh(position, quaternion, imageUrl) {
        const geometry = new THREE.BoxGeometry(1.2, 0.3, 1.8);
        const texture = this.createCardTexture(imageUrl);

        texture.center.set(0.5, 0.5);

        const faceMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.1
        });

        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xfdf6e3,
            roughness: 0.8,
            metalness: 0.1
        });

        const materials = [
            edgeMaterial,
            edgeMaterial,
            faceMaterial,
            faceMaterial,
            edgeMaterial,
            edgeMaterial
        ];

        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.copy(position);
        mesh.quaternion.copy(quaternion);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        return mesh;
    }

    removeItemMesh(mesh) {
        this.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
        } else if (mesh.material) {
            mesh.material.dispose();
        }
    }

    render(deltaTime = 0) {
        for (const mixer of this.mixers) {
            mixer.update(deltaTime);
        }

        this.renderer.render(this.scene, this.camera);
        this.ui.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updatePusherPosition(z) {
        if (this.pusherMesh) {
            this.pusherMesh.position.z = z;
        }
    }
}