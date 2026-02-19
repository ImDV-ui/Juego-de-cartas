import * as THREE from 'three';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Camera Setup
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 12, 12); // High angle view
        this.camera.lookAt(0, 0, 0);

        // Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.coinMeshes = [];
        this.pusherMesh = null;

        // Geometry References
        this.coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 32);
        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 1,
            roughness: 0.3
        });

        this.setupLights();
        this.createCabinet();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const spotLight = new THREE.SpotLight(0xffffff, 1.5);
        spotLight.position.set(0, 15, 5);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.castShadow = true;
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
        this.scene.add(spotLight);

        // Neon Glows (Simulated)
        const blueLight = new THREE.PointLight(0x0088ff, 0.8, 10);
        blueLight.position.set(6, 2, 2);
        this.scene.add(blueLight);

        const redLight = new THREE.PointLight(0xff0044, 0.8, 10);
        redLight.position.set(-6, 2, 2);
        this.scene.add(redLight);
    }

    createCabinet() {
        const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });

        // --- Main Floor ---
        const floorGeo = new THREE.BoxGeometry(10, 1, 10);
        const floor = new THREE.Mesh(floorGeo, cabinetMaterial);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // --- Walls ---
        const wallGeo = new THREE.BoxGeometry(0.5, 4, 12);

        const leftWall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0x3344cc })); // Blue
        leftWall.position.set(-5.25, 1.5, -1);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0xcc2222 })); // Red
        rightWall.position.set(5.25, 1.5, -1);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        // Back Wall
        const backWallGeo = new THREE.BoxGeometry(12, 5, 1);
        const backWall = new THREE.Mesh(backWallGeo, cabinetMaterial);
        backWall.position.set(0, 2, -6.5);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // --- Pusher ---
        const pusherGeo = new THREE.BoxGeometry(10, 1.2, 4);
        const pusherMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.6, roughness: 0.4 });
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMat);
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
