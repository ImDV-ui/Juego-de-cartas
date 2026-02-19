import * as THREE from 'three';
import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#5c94fc'); 

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 18, 15); 
        this.camera.lookAt(0, -2, -5);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.coinMeshes = [];
        this.pusherMesh = null;

        // Grosor de 0.15
        this.coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 32);
        this.coinGeometry.rotateX(-Math.PI / 2);

        this.coinMaterial = new THREE.MeshStandardMaterial({
            color: 0xfce000, 
            metalness: 0.3,  
            roughness: 0.2,
            emissive: 0x333300 
        });

        this.setupLights();
        this.createCabinet();

        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(5, 15, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
    }

    createCabinet() {
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xc84c0c, roughness: 0.8 }); 
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x00a800, roughness: 0.5 });  
        const pusherMaterial = new THREE.MeshStandardMaterial({ color: 0xfc9838, roughness: 0.4 });
        const backMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });  

        const floorGeo = new THREE.BoxGeometry(10, 1, 10);
        const floor = new THREE.Mesh(floorGeo, floorMaterial);
        floor.position.set(0, -0.5, 0); 
        floor.receiveShadow = true;
        this.scene.add(floor);

        const wallGeo = new THREE.BoxGeometry(1, 4, 12);
        const leftWall = new THREE.Mesh(wallGeo, wallMaterial);
        leftWall.position.set(-5.5, 2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMaterial);
        rightWall.position.set(5.5, 2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);

        const backWallGeo = new THREE.BoxGeometry(12, 8, 1);
        const backWall = new THREE.Mesh(backWallGeo, backMaterial);
        backWall.position.set(0, 2, -6.5);
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Pusher ahora mide 12 de profundidad
        const pusherGeo = new THREE.BoxGeometry(10, 1, 12);
        this.pusherMesh = new THREE.Mesh(pusherGeo, pusherMaterial);
        this.pusherMesh.position.set(0, 0.45, -3);
        this.pusherMesh.castShadow = true;
        this.pusherMesh.receiveShadow = true;
        this.scene.add(this.pusherMesh);

        // Nuevo bloque "Sweeper" (Actúa como techo oscuro atrás)
        const sweeperGeo = new THREE.BoxGeometry(10, 2, 8);
        const sweeperMesh = new THREE.Mesh(sweeperGeo, backMaterial);
        sweeperMesh.position.set(0, 2, -2);
        sweeperMesh.castShadow = true;
        sweeperMesh.receiveShadow = true;
        this.scene.add(sweeperMesh);
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