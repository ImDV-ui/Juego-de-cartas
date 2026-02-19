import * as THREE from 'three';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        // --- 1. ESCENA Y CÁMARA (Estilo Arcade / Mario) ---
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#5c94fc'); // Cielo Azul clásico de Mario

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        // Cámara en alto e inclinada hacia abajo
        this.camera.position.set(0, 18, 15);
        this.camera.lookAt(0, -2, -5);

        // --- 2. RENDERER (Configuración de sombras y colores) ---
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.coinMeshes = [];
        this.pusherMesh = null;

        // --- 3. GEOMETRÍA Y MATERIALES DE LAS MONEDAS ---
        this.coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        // ATENCIÓN: Visuals follow Physics.
        // Physics is now Y-aligned (flat puck).
        // Three.js Cylinder is Y-aligned by default.
        // So we do NOT need to rotate the geometry.
        // this.coinGeometry.rotateX(-Math.PI / 2); // Removed to match new physics

        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xfce000, // Amarillo brillante (Oro Mario)
            metalness: 0.3,  // Lo bajamos para que no se vea negro sin entorno
            roughness: 0.2,
            emissive: 0x333300 // Un ligero brillo propio para resaltar
        });

        // --- 4. INICIALIZAR ENTORNO ---
        this.setupLights();
        this.createCabinet();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        // Luz ambiente general para iluminar todas las caras oscuras
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Luz principal simulando el sol (Genera las sombras y los brillos)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 15, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createCabinet() {
        // --- MATERIALES TEMÁTICOS MARIO BROS ---
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xc84c0c, roughness: 0.8 }); // Ladrillo Naranja
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x00a800, roughness: 0.5 });  // Tubería Verde
        const pusherMaterial = new THREE.MeshStandardMaterial({ color: 0xfc9838, roughness: 0.4 });// Bloque Amarillo
        const backMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });  // Fondo gris oscuro

        // --- Suelo (Floor) ---
        // Updated to match Physics (10 width, 14 depth)
        const floorGeo = new THREE.BoxGeometry(10, 1, 14);
        const floor = new THREE.Mesh(floorGeo, floorMaterial);
        floor.position.set(0, -0.5, -2);
        floor.receiveShadow = true;
        this.scene.add(floor);

        // --- Paredes Laterales ---
        const wallGeo = new THREE.BoxGeometry(1, 4, 14);

        const leftWall = new THREE.Mesh(wallGeo, wallMaterial);
        leftWall.position.set(-5.5, 2, -1);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMaterial);
        rightWall.position.set(5.5, 2, -1);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // --- Pared Trasera ---
        const backWallGeo = new THREE.BoxGeometry(12, 4, 1);
        const backWall = new THREE.Mesh(backWallGeo, backMaterial);
        backWall.position.set(0, 2, -8.5); // Matched physics
        this.scene.add(backWall);

        // --- Pusher (Empujador) ---
        const pusherGeo = new THREE.BoxGeometry(10, 1, 4);
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMaterial);
        this.pusherMesh.position.set(0, 0.5, -4);
        this.pusherMesh.castShadow = true;
        this.pusherMesh.receiveShadow = true;
        this.scene.add(this.pusherMesh);
    }

    createCoinMesh(position, quaternion) {
        const mesh = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
        mesh.position.copy(position);
        mesh.quaternion.copy(quaternion);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
    }

    removeCoinMesh(mesh) {
        this.scene.remove(mesh);
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