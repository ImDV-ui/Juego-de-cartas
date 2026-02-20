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

        this.mixers = []; // Keep track of animation mixers

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

        const stoneFaceTexture = textureLoader.load('assets/images/piedra/DossunFaceMat_Alb.png');
        stoneFaceTexture.wrapS = THREE.RepeatWrapping;
        stoneFaceTexture.wrapT = THREE.RepeatWrapping;
        stoneFaceTexture.magFilter = THREE.NearestFilter;
        stoneFaceTexture.repeat.set(5, 1);
        stoneFaceTexture.offset.set(0.1, 0);

        const stoneFaceMaterial = new THREE.MeshStandardMaterial({
            map: stoneFaceTexture,
            roughness: 0.9,
            metalness: 0.0
        });

        const stonePartsTexture = textureLoader.load('assets/images/piedra/DossunPartsMat_Alb.png');
        stonePartsTexture.wrapS = THREE.RepeatWrapping;
        stonePartsTexture.wrapT = THREE.RepeatWrapping;
        stonePartsTexture.magFilter = THREE.NearestFilter;
        stonePartsTexture.repeat.set(5, 5); 

        const stonePartsMaterial = new THREE.MeshStandardMaterial({
            map: stonePartsTexture,
            roughness: 0.9,
            metalness: 0.0
        });

        const pusherMaterials = [
            stonePartsMaterial, // Right
            stonePartsMaterial, // Left
            stonePartsMaterial, // Top
            stonePartsMaterial, // Bottom
            stoneFaceMaterial,  // Front (Facing the coins)
            stonePartsMaterial  // Back
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

        const pusherGeo = new THREE.BoxGeometry(10, 1, 10);
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMaterials);
        this.pusherMesh.position.set(0, 0.45, -4);
        this.pusherMesh.receiveShadow = true;
        this.pusherMesh.castShadow = true;
        this.scene.add(this.pusherMesh);

        const sweeperGeo = new THREE.BoxGeometry(10, 2, 8);
        const sweeperMesh = new THREE.Mesh(sweeperGeo, sweeperMaterial);
        sweeperMesh.position.set(0, 2, -4.5);
        sweeperMesh.castShadow = true;
        sweeperMesh.receiveShadow = true;
        this.scene.add(sweeperMesh);

        // Cargamos todos los modelos 3D
        this.loadMarioModels();
        this.loadDancingKongModel();
        
        // ¡Cargamos los nuevos Thwomps para el empujador!
        this.loadThwompPusher();
    }

    // --- NUEVA FUNCIÓN PARA AÑADIR LAS ROCAS THWOMP ---
    loadThwompPusher() {
        // Usamos el cargador MTL para leer tu thwomp.mtl
        const mtlLoader = new MTLLoader();
        mtlLoader.setPath('assets/images/');
        
        mtlLoader.load('thwomp.mtl', (materials) => {
            materials.preload();

            // Usamos el cargador OBJ y le conectamos el MTL que acabamos de cargar
            const objLoader = new OBJLoader();
            objLoader.setMaterials(materials);
            objLoader.setPath('assets/images/');
            
            objLoader.load('thwomp.obj', (object) => {

                // Ajuste de escala automático
                const box = new THREE.Box3().setFromObject(object);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 2.0 / maxDim; 
                object.scale.set(scale, scale, scale);

                const numThwomps = 5; 
                const pusherWidth = 10;
                const spacing = pusherWidth / numThwomps;
                const startX = -(pusherWidth / 2) + (spacing / 2);

                for (let i = 0; i < numThwomps; i++) {
                    const thwomp = object.clone();
                    
                    thwomp.position.set(startX + (i * spacing), 0, 5); 
                    
                    // thwomp.rotation.y = Math.PI; 

                    thwomp.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // --- CÓDIGO DE RESCATE PARA EL MTL ---
                            // Si el MTL se cargó pero dejó piezas en negro puro, lo repintamos
                            if (child.material) {
                                // Si el modelo tiene varias partes separadas
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        // Si el color es negro (0x000000), le damos color piedra
                                        if (mat.color.getHex() === 0x000000) mat.color.setHex(0x7a7a7a);
                                    });
                                } else {
                                    // Si es una sola pieza sólida
                                    if (child.material.color.getHex() === 0x000000) {
                                        child.material.color.setHex(0x7a7a7a);
                                    }
                                }
                            }
                            // -------------------------------------
                        }
                    });

                    if (this.pusherMesh) {
                        this.pusherMesh.add(thwomp);
                    }
                }

                console.log("Rocas Thwomp cargadas usando el archivo .mtl");

            }, undefined, (error) => {
                console.error('Error al cargar thwomp.obj:', error);
            });
        }, undefined, (error) => {
            console.error('Error al cargar thwomp.mtl:', error);
        });
    }
    // --------------------------------------------------

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
                marioLeft.position.set(-5.5, 4, 1);
                marioLeft.rotation.y = Math.PI / 2;

                marioLeft.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.scene.add(marioLeft);

                const marioRight = object.clone();
                marioRight.position.set(5.5, 4, 1);
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

            const scale = 1.8; 
            dancingKong.scale.set(scale, scale, scale);

            const yOffset = 2.9;
            const zOffset = -1.7;

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