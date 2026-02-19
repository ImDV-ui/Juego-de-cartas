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
        this.nextCardDropTime = 10 + Math.random() * 110;
        this.cardItems = [];
        this.barrels = [];

        this.spawnCardItem();

        this.trySpawnBarrelTest();
    }

    update(deltaTime) {
        this.physics.update(deltaTime);

        this.pusherTime += deltaTime * 1.5;
        const pusherZ = -4 + Math.sin(this.pusherTime) * 2;

        this.physics.setPusherPosition(pusherZ);
        this.view.updatePusherPosition(pusherZ);

        this.coinController.update(deltaTime);
        this.cardController.update(deltaTime);

        this.cardDropTimer += deltaTime;
        if (this.cardDropTimer > this.nextCardDropTime) {
            this.cardDropTimer = 0;
            this.nextCardDropTime = 10 + Math.random() * 110;
            this.spawnCardItem();
        }

        for (let i = this.cardItems.length - 1; i >= 0; i--) {
            const item = this.cardItems[i];
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);

            if (item.body.position.y < -3) {
                if (item.body.position.z > 6) {
                    this.cardController.addCard({
                        ...item.cardData,
                        id: item.cardData.type + '_' + Date.now()
                    });
                }

                this.physics.world.removeBody(item.body);
                this.view.removeItemMesh(item.mesh);
                this.cardItems.splice(i, 1);
            }
        }

        for (let i = this.barrels.length - 1; i >= 0; i--) {
            const item = this.barrels[i];

            // --- ESCUDO ANTI-ERRORES DE CANNON ---
            if (isNaN(item.body.position.y)) {
                this.physics.world.removeBody(item.body);
                this.view.removeBarrelMesh(item.mesh);
                this.barrels.splice(i, 1);
                continue;
            }

            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);

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

        const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];

        const body = this.physics.createCardItem(position);
        const mesh = this.view.createCardItemMesh(body.position, body.quaternion, randomCard.image);

        this.cardItems.push({ body, mesh, cardData: randomCard });
    }

    trySpawnBarrelTest(attempts = 0) {
        if (this.view.barrelModelTemplate && this.view.barrelModelTemplate !== 'error') {
            console.log("Modelo 3D listo. ¡Lanzando barril!");
            this.spawnBarrel();
        } else if (this.view.barrelModelTemplate === 'error' || attempts > 10) {
            console.log("Lanzando barril de emergencia...");
            this.spawnBarrel();
        } else {
            console.log("Esperando a que cargue el barril... (Intento " + attempts + ")");
            setTimeout(() => this.trySpawnBarrelTest(attempts + 1), 500);
        }
    }

    spawnBarrel() {
        // SPAWN 100% SEGURO: Alto, en el centro de la escena, lejos del pusher
        const position = new CANNON.Vec3(0, 12, 0);

        // Lo dejamos caer con un leve empuje hacia el frente
        const velocity = new CANNON.Vec3(0, -2, 2);

        const body = this.physics.createBarrel(position, velocity);
        const mesh = this.view.createBarrelMesh(body.position, body.quaternion);

        if (mesh) {
            this.barrels.push({ body, mesh });
            console.log("¡Barril lanzado cayendo desde el cielo!");
        } else {
            this.physics.world.removeBody(body);
            console.log("Error crítico: No se instanció ninguna malla.");
        }
    }

    render() {
        this.view.render();
        this.coinController.render();
        this.cardController.render();
    }
}