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
                // Dejamos caer la moneda en z=2.0 en vez de 1.5 para evitar que roce con el nuevo muro de cristal (z=1.0)
                this.coinController.spawnCoin(dropX, 4, 2.0);
            }
        });

        this.cardDropTimer = 0;
        this.nextCardDropTime = 10 + Math.random() * 110;
        this.cardItems = [];
        this.barrels = [];

        this.spawnCardItem();
    }

    update(deltaTime) {
        this.physics.update(deltaTime);

        this.pusherTime += deltaTime * 1.5;
        // Ajuste para evitar que se esconda del todo la cara del Thwomp
        const pusherZ = -3.5 + Math.sin(this.pusherTime) * 1.5;

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
            item.mesh.position.copy(item.body.position);
            item.mesh.quaternion.copy(item.body.quaternion);

            if (item.body.position.y < 1.0) {
                const fuerzaSuelo = new CANNON.Vec3(0, -800, 2000);
                item.body.applyForce(fuerzaSuelo, new CANNON.Vec3(0, 0, 0));
            }

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
        // Spawneamos la carta un poco más adelante (z=2.5) para que no interseque con el nuevo muro invisible del castillo (que llega hasta z=1.0)
        const z = 2.5;
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
            },
            {
                id: 'donkey_barrel',
                name: 'KONG BARREL',
                description: 'Summons a heavy barrel to crush coins!',
                type: 'DONKEY_BARREL',
                image: 'assets/images/carta barril.png'
            }
        ];

        const randomCard = cardTypes[Math.floor(Math.random() * cardTypes.length)];

        const body = this.physics.createCardItem(position);
        const mesh = this.view.createCardItemMesh(body.position, body.quaternion, randomCard.image);

        this.cardItems.push({ body, mesh, cardData: randomCard });
    }

    spawnBarrel() {
        const x = 0;
        const y = 3.5;
        const z = 1.0;

        const position = new CANNON.Vec3(x, y, z);

        const velocity = new CANNON.Vec3(
            0,
            -15,
            8
        );

        const body = this.physics.createBarrel(position, velocity);
        const mesh = this.view.createBarrelMesh(body.position, body.quaternion);

        this.barrels.push({ body, mesh });
    }

    render(deltaTime) {
        this.view.render(deltaTime);
        this.coinController.render();
        this.cardController.render();
    }
}