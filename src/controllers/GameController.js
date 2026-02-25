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
        this.data.load();

        this.coinController = new CoinController(this.physics, this.view);
        this.cardController = new CardController(this);
        this.inputController = new InputController();

        this.pusherTime = 0;
        this.autoDropTimer = 0;

        this.view.ui.multiplier = 1 + this.data.saveData.upgrades.coinMultiplier;

        this.view.ui.setUpgradeData(this.data.saveData.upgrades, (upgradeKey) => {
            this.handleUpgradePurchased(upgradeKey);
        });

        this.inputController.onDrop((normalizedX) => {
            if (this.view.ui.money > 0) {
                this.view.ui.updateMoney(-1);
                const dropX = normalizedX * 4.5;

                const type = this.coinController.getRandomCoinType();
                this.coinController.spawnCoin(dropX, 4, 2.0, type);
            }
        });

        this.cardDropTimer = 0;
        this.nextCardDropTime = this.getCardDropTime();
        this.cardItems = [];
        this.barrels = [];

        this.spawnCardItem();
    }

    getCardDropTime() {
        const luckyLevel = this.data.saveData.upgrades.luckyCards;
        const base = Math.max(2, 10 - (luckyLevel * 0.5));
        const variance = Math.max(20, 110 - (luckyLevel * 5));
        return base + Math.random() * variance;
    }

    handleUpgradePurchased(upgradeKey) {
        this.data.saveData.upgrades[upgradeKey]++;

        this.data.save();

        if (upgradeKey === 'coinMultiplier') {
            this.view.ui.multiplier = 1 + this.data.saveData.upgrades.coinMultiplier;
        } else if (upgradeKey === 'luckyCards') {
            if (this.cardDropTimer > this.getCardDropTime()) {
                this.cardDropTimer = this.getCardDropTime();
            }
        }
    }

    update(deltaTime) {
        this.physics.update(deltaTime);

        const speedLevel = this.data.saveData.upgrades.pusherSpeed;
        const speedMultiplier = 1.5 + (speedLevel * 0.2);
        this.pusherTime += deltaTime * speedMultiplier;

        const pusherZ = -3.5 + Math.sin(this.pusherTime) * 1.5;

        this.physics.setPusherPosition(pusherZ);
        this.view.updatePusherPosition(pusherZ);

        this.coinController.update(deltaTime);
        this.cardController.update(deltaTime);

        const autoDropperLevel = this.data.saveData.upgrades.autoDropper;
        if (autoDropperLevel > 0) {
            this.autoDropTimer += deltaTime;
            const dropInterval = Math.max(0.2, 3.0 - (autoDropperLevel * 0.2));

            if (this.autoDropTimer >= dropInterval) {
                this.autoDropTimer = 0;
                if (this.view.ui.money > 0) {
                    this.view.ui.updateMoney(-1);
                    const randX = (Math.random() - 0.5) * 8;
                    const type = this.coinController.getRandomCoinType();
                    this.coinController.spawnCoin(randX, 4, 2.0, type);
                }
            }
        }

        this.cardDropTimer += deltaTime;
        if (this.cardDropTimer > this.nextCardDropTime) {
            this.cardDropTimer = 0;
            this.nextCardDropTime = this.getCardDropTime();
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
        this.view.playKongAnimation();

        setTimeout(() => {
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
        }, 4500);
    }

    render(deltaTime) {
        this.view.render(deltaTime);
        this.coinController.render();
        this.cardController.render();
    }
}