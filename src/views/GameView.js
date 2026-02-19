import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        this.scene = new THREE.Scene();
        // this.scene.background = new THREE.Color('#5c94fc'); // Commented out to allow CSS background

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
            metalness: 0.1, // Almost non-metallic (plastic/cartoon look)
            roughness: 0.7, // Rough surface to diffuse light
            emissive: 0x221100,
            emissiveIntensity: 0.2 // Slight glow to ensure visibility
        });

        this.setupLights();
        this.createCabinet();

        // --- CARGA DEL MODELO ---
        this.loader = new ColladaLoader();
        this.coinModelTemplate = new THREE.Group();

        // IMPORTANTE: Asegúrate de que esta ruta es la correcta en tu proyecto
        this.loader.load('assets/images/coin.dae', (collada) => {
            const model = collada.scene;

            // 1. Material corregido con los registros de color del usuario
            const shinyGoldMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(255 / 255, 255 / 255, 20 / 255), // Color Register 1: Golden Yellow
                emissive: new THREE.Color(173 / 255, 137 / 255, 16 / 255), // Color Register 2: Darker Gold/Orange for glow
                emissiveIntensity: 0.4,
                metalness: 0.8, // Increased for shiny metallic look
                roughness: 0.2, // Smoother surface
                side: THREE.DoubleSide
            });

            // 2. Extraemos las piezas
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

                    // --- NUEVO: Borde negro (outline) ---
                    // Usamos EdgesGeometry para detectar bordes afilados (>15 grados)
                    const edges = new THREE.EdgesGeometry(cleanGeom, 15);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));

                    line.position.copy(child.position);
                    line.quaternion.copy(child.quaternion);
                    line.scale.copy(child.scale);

                    this.coinModelTemplate.add(line);
                }
            });

            // 3. Centrado y auto-escalado
            const box = new THREE.Box3().setFromObject(this.coinModelTemplate);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            this.coinModelTemplate.children.forEach(child => {
                child.position.sub(center);
            });

            const maxDimension = Math.max(size.x, size.y, size.z);
            const exactScale = 1.2 / maxDimension;

            this.coinModelTemplate.scale.set(exactScale, exactScale, exactScale);

            // Revert rotation to 0 since the model is likely already upright (Z-axis)
            // and physics body is also X-rotated to be Z-axis.
            this.coinModelTemplate.rotation.set(0, 0, 0);

            // 4. Reemplazo de las monedas iniciales
            this.pendingCoins.forEach(group => {
                group.clear();
                group.add(this.coinModelTemplate.clone());
            });
            this.pendingCoins = [];

            console.log("Moneda renderizada con luz e iluminación correcta.");
        });

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

        // --- MODIFICACIÓN: Textura BlockBrick para paredes y pusher ---
        const textureLoader = new THREE.TextureLoader();
        const brickTexture = textureLoader.load('assets/images/BlockBrick2D.png');

        // Configuramos la textura para que se repita correctamente
        brickTexture.wrapS = THREE.RepeatWrapping;
        brickTexture.wrapT = THREE.RepeatWrapping;
        brickTexture.repeat.set(1, 1); // Empezamos con 1x1, se ajustará si es necesario
        brickTexture.magFilter = THREE.NearestFilter; // Pixel art crispy look

        // --- PROCERURAL TEXTURE GENERATION ---
        const grassTexture = this.createProceduralGrassTexture();

        const wallMaterial = new THREE.MeshStandardMaterial({
            map: brickTexture,
            roughness: 0.6,
            metalness: 0.1
        });

        // Clonamos la textura para el pusher si queremos diferentes settings (opcional)
        // o usamos la misma. Para el pusher que es ancho, el mapping dependera de la UV.
        const grassMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            roughness: 0.8,
            metalness: 0.0
        });
        const sweeperMaterial = new THREE.MeshStandardMaterial({ color: 0x6b2d08, roughness: 0.9 });

        const floorGeo = new THREE.BoxGeometry(10, 1, 10);
        const floor = new THREE.Mesh(floorGeo, floorMaterial);
        floor.position.set(0, -0.5, 2);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // --- REFACTOR: Walls as Blocks ---
        const blockGeo = new THREE.BoxGeometry(1, 1, 1);

        // Helper function to create a blocky structure
        const createBlockStructure = (width, height, depth, material, positionOffset) => {
            const group = new THREE.Group();
            group.position.copy(positionOffset);

            // Calculate starting positions to center the group around (0,0,0) locally
            // or we build it from 0 and move group. Let's build centered.
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

        // Left Wall: 1x4x12 blocks
        // Original pos: -5.5, 2, 1
        const leftWallGroup = createBlockStructure(1, 4, 12, wallMaterial, new THREE.Vector3(-5.5, 2, 1));
        this.scene.add(leftWallGroup);

        // Right Wall: 1x4x12 blocks
        // Original pos: 5.5, 2, 1
        const rightWallGroup = createBlockStructure(1, 4, 12, wallMaterial, new THREE.Vector3(5.5, 2, 1));
        this.scene.add(rightWallGroup);

        // Pusher: 10x1x10 blocks
        // Original pos: 0, 0.45, -4
        // Note: Pusher needs to be accessible via this.pusherMesh for movement updates
        // Since updatePusherPosition modifies this.pusherMesh.position.z, using a Group works perfectly.
        this.pusherMesh = createBlockStructure(10, 1, 10, grassMaterial, new THREE.Vector3(0, 0.45, -4));
        this.scene.add(this.pusherMesh);

        const sweeperGeo = new THREE.BoxGeometry(10, 2, 8);
        const sweeperMesh = new THREE.Mesh(sweeperGeo, sweeperMaterial);
        sweeperMesh.position.set(0, 2, -4.5);
        sweeperMesh.castShadow = true;
        sweeperMesh.receiveShadow = true;
        this.scene.add(sweeperMesh);
    }

    createProceduralGrassTexture() {
        // Create a canvas to draw the pixel art texture
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 1. Fill background with Mario-style base green
        ctx.fillStyle = '#00a800';
        ctx.fillRect(0, 0, size, size);

        // 2. Add pixel pattern details
        const lightGreen = '#58d854'; // Highlights
        const darkGreen = '#005000';  // Shadows

        // Draw simple pixel noise pattern
        for (let i = 0; i < 200; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            const w = Math.floor(Math.random() * 3) + 1;
            const h = Math.floor(Math.random() * 3) + 1;

            ctx.fillStyle = Math.random() > 0.5 ? lightGreen : darkGreen;
            ctx.fillRect(x, y, w, h);
        }

        // 3. Add a "top border" effect to simulate grass tips (optional, but nice)
        // Since we are tiling 1x1 blocks, a seamless pattern is better.
        // Let's add cross-hatch or specific Mario ground pattern approximation
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.1;
        // Scanlines/grid for texture
        for (let y = 0; y < size; y += 4) {
            ctx.fillRect(0, y, size, 1);
        }
        ctx.globalAlpha = 1.0;

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter; // Critical for pixel art look
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
        canvas.height = 768; // Ratio 1:1.5 para cartas ajustadas

        const ctx = canvas.getContext('2d');

        // 1. Fill with bone/card color background
        ctx.fillStyle = '#fdf6e3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Load and draw image
        const img = new Image();
        img.src = imageUrl;

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

        // We need to wait for image to load to draw it
        img.onload = () => {
            // Draw image covering the canvas (like object-fit: cover)
            const aspectCanvas = canvas.width / canvas.height;
            const aspectImg = img.width / img.height;

            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectImg > aspectCanvas) {
                // Image is wider than canvas
                drawHeight = canvas.height;
                drawWidth = drawHeight * aspectImg;
                offsetX = -(drawWidth - canvas.width) / 2;
            } else {
                // Image is taller than canvas
                drawWidth = canvas.width;
                drawHeight = drawWidth / aspectImg;
                offsetY = -(drawHeight - canvas.height) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Add a border maybe? -> REMOVED as requested
            // ctx.strokeStyle = '#d4c5a0';
            // ctx.lineWidth = 10;
            // ctx.strokeRect(0, 0, canvas.width, canvas.height);

            texture.needUpdate = true; // Fix typo needsUpdate to needUpdate? No, standard ThreeJS texture is needsUpdate
            texture.needsUpdate = true;
        };

        return texture;
    }

    createCardItemMesh(position, quaternion, imageUrl) {
        // 1. Tamaño ajustado: Más estrecho y largo (Ancho 1.2, Grosor 0.16, Largo 1.8)
        // Coincide con physics: 0.6 * 2, 0.08 * 2, 0.9 * 2
        const geometry = new THREE.BoxGeometry(1.2, 0.16, 1.8);

        // 2. Use CanvasTexture
        const texture = this.createCardTexture(imageUrl);

        // Canvas texture is usually upright. 
        // Our BoxGeometry top face is oriented XZ.
        // We need it to face "up" relative to the card's local space when it falls.
        // Rotamos la textura -90 grados (PI/2) para que se alinee con el largo de la tarjeta (Eje Z)
        texture.center.set(0.5, 0.5);
        // texture.rotation = Math.PI / 2; // Removed rotation to fix orientation

        const faceMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.4,
            metalness: 0.1
        });

        // Color blanco/hueso para los bordes del cartón
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0xfdf6e3,
            roughness: 0.8,
            metalness: 0.1
        });

        // Mapeo de materiales a las 6 caras del cubo
        const materials = [
            edgeMaterial, // 0: derecha
            edgeMaterial, // 1: izquierda
            faceMaterial, // 2: arriba (cara principal)
            faceMaterial, // 3: abajo (reverso)
            edgeMaterial, // 4: frente
            edgeMaterial  // 5: atrás
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
        // Si usamos múltiples materiales, hay que limpiar el array
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
        } else if (mesh.material) {
            mesh.material.dispose();
        }
    }

    render() {
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