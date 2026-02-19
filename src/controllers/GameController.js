import * as CANNON from 'cannon-es';
import { GameView } from '../views/GameView.js';
import { GameData } from '../database/GameData.js';
import { CoinController } from './CoinController.js';
import { CardController } from './CardController.js';
import { InputController } from './InputController.js';
import { PhysicsController } from './PhysicsController.js';

export class GameController {
    constructor() {
        this.view = new GameView();
        this.physics = new PhysicsController();
        this.data = new GameData();

        this.coinController = new CoinController(this.physics, this.view);
        this.cardController = new CardController(this);
        this.inputController = new InputController();

        this.pusherTime = 0;

        this.inputController.onDrop((normalizedX) => {
            if (this.view.ui.money > 0) {
                this.view.ui.updateMoney(-1);
                const dropX = normalizedX * 4.5;

                this.coinController.spawnCoin(dropX, 4, 1.5);
            }
        });

        this.cardDropTimer = 0;
        this.nextCardDropTime = 10 + Math.random() * 110; // Initial random time
        this.cardItems = [];
        this.barrels = [];

        this.spawnCardItem();

        // Throw barrel after a short delay to ensure assets loaded
        setTimeout(() => {
            this.spawnBarrel();
        }, 2000);
    }

    update(deltaTime) {
        this.physics.update(deltaTime);


        this.pusherTime += deltaTime * 1.5;
        const pusherZ = -4 + Math.sin(this.pusherTime) * 2;

        this.physics.setPusherPosition(pusherZ);
        this.view.updatePusherPosition(pusherZ);

        this.coinController.update(deltaTime);
        this.cardController.update(deltaTime);

        // --- Card Drop Logic ---
        this.cardDropTimer += deltaTime;
        if (this.cardDropTimer > this.nextCardDropTime) {
            this.cardDropTimer = 0;
            this.nextCardDropTime = 10 + Math.random() * 110; // Random between 10s and 120s
            this.spawnCardItem();
        }

        // Update card items physics/visuals
        for (let i = this.cardItems.length - 1; i >= 0; i--) {
            const item = this.cardItems[i];
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);

            if (item.body.position.y < -3) {
                // Determine if it fell in the winning zone
                if (item.body.position.z > 6) {
                    // Entregar exactamente la carta que cayó
                    this.cardController.addCard({
                        ...item.cardData,
                        id: item.cardData.type + '_' + Date.now() // Forzamos un ID único
                    });
                }

                // Remove item
                this.physics.world.removeBody(item.body);
                this.view.removeItemMesh(item.mesh);
                this.cardItems.splice(i, 1);
            }
        }

        // --- Barrel Logic ---
        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const item = this.barrels[i];
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);

            // Remove if falls
            if (item.body.position.y < -5) {
                this.physics.world.removeBody(item.body);
                this.view.removeBarrelMesh(item.mesh);
                this.barrels.splice(i, 1);
            }
        }
    }

    spawnCardItem() {
        const x = (Math.random() - 0.5) * 8;
        const y = 4;
        const z = 1.5;
        const position = new CANNON.Vec3(x, y, z);

        // 1. Definimos las cartas posibles
        const cardTypes = [
            {
                id: 'bonus_100',
                name: 'MEGA SHOWER',
                description: 'Drops 30 BIG coins!',
                type: 'COIN_SHOWER',
                image: 'assets/images/lluvia de monedas.png'
            },
            {
                id: 'double_money',
                name: 'DOUBLE MONEY',
                description: 'x2 Money for 2 mins!',
                type: 'DOUBLE_MONEY',
                image: 'assets/images/x2 de dinero.png'
            }
        ];



        // 2. Elegimos una carta aleatoria
        const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];

        // 3. Creamos el cuerpo físico y la malla visual pasándole la imagen
        const body = this.physics.createCardItem(position);
        const mesh = this.view.createCardItemMesh(body.position, body.quaternion, randomCard.image);

        // Guardamos la información de la carta junto al objeto
        this.cardItems.push({ body, mesh, cardData: randomCard });
    }

    spawnBarrel() {
        // Kong Position: 0, 3, -4 (center of platform).
        // Spawn slightly in front and higher for larger barrel: 0, 7, -3
        const position = new CANNON.Vec3(0, 7, -3);

        // Velocity: Throw towards +Z (forward) and slightly up
        // Target: Center of coins approx 0, 0, 0
        const velocity = new CANNON.Vec3(0, 5, 8); // Stronger throw

        const body = this.physics.createBarrel(position, velocity);

        // Visual Mesh
        // Body quaternion is rotated -90 X. 
        // We need mesh to match.
        // If mesh is upright barrel, and we rotate -90 X, it points to camera.
        // Wait, body rotation is for the SHAPE. Body itself has quaternion.
        // In createBarrel, we added shape with local rotation. Body quaternion is identity (or set from velocity? no).
        // So body.quaternion is identity initially.
        // If we copy body quat to mesh, mesh is upright.
        // But shape is rotated inside body.
        // So physical cylinder is horizontal (Z-axis) rotated to vertical (Y-axis).
        // Mesh should be vertical. So copying identity quat works if mesh is upright.
        // Collada models are usually Y-up.

        const mesh = this.view.createBarrelMesh(body.position, body.quaternion);

        if (mesh) {
            this.barrels.push({ body, mesh });
        } else {
            // If mesh not loaded yet, maybe remove body or retry?
            // specific logic: remove body to avoid invisible physics
            this.physics.world.removeBody(body);
            console.log("Barrel mesh not loaded yet, skipping spawn.");
        }
    }

    render() {
        this.view.render();
        this.coinController.render();
        this.cardController.render();
    }
}