import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#5c94fc');

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
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x00a800, roughness: 0.5, metalness: 0.2 });
        const pusherMaterial = new THREE.MeshStandardMaterial({ color: 0xfc9838, roughness: 0.4, metalness: 0.3, emissive: 0x221100 });
        const sweeperMaterial = new THREE.MeshStandardMaterial({ color: 0x6b2d08, roughness: 0.9 });

        const floorGeo = new THREE.BoxGeometry(10, 1, 10);
        const floor = new THREE.Mesh(floorGeo, floorMaterial);
        floor.position.set(0, -0.5, 2);
        floor.receiveShadow = true;
        this.scene.add(floor);

        const wallGeo = new THREE.BoxGeometry(1, 4, 12);
        const leftWall = new THREE.Mesh(wallGeo, wallMaterial);
        leftWall.position.set(-5.5, 2, 1);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMaterial);
        rightWall.position.set(5.5, 2, 1);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        const pusherGeo = new THREE.BoxGeometry(10, 1, 10);
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMaterial);
        this.pusherMesh.position.set(0, 0.45, -4);
        this.pusherMesh.castShadow = true;
        this.pusherMesh.receiveShadow = true;
        this.scene.add(this.pusherMesh);

        const sweeperGeo = new THREE.BoxGeometry(10, 2, 8);
        const sweeperMesh = new THREE.Mesh(sweeperGeo, sweeperMaterial);
        sweeperMesh.position.set(0, 2, -4.5);
        sweeperMesh.castShadow = true;
        sweeperMesh.receiveShadow = true;
        this.scene.add(sweeperMesh);
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

    createCardItemMesh(position, quaternion) {
        const geometry = new THREE.BoxGeometry(1, 0.2, 1.4);
        const material = new THREE.MeshStandardMaterial({
            color: 0x9b59b6,
            roughness: 0.4,
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

    removeItemMesh(mesh) {
        this.scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
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