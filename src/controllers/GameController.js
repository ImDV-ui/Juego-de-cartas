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

        this.spawnCardItem();
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
                    this.cardController.giveRandomCard();
                }

                // Remove item
                this.physics.world.removeBody(item.body);
                this.view.removeItemMesh(item.mesh);
                this.cardItems.splice(i, 1);
            }
        }
    }

    spawnCardItem() {
        const x = (Math.random() - 0.5) * 8;
        const y = 4;
        const z = 1.5;
        const position = new CANNON.Vec3(x, y, z);

        const body = this.physics.createCardItem(position);
        const mesh = this.view.createCardItemMesh(body.position, body.quaternion);

        this.cardItems.push({ body, mesh });
    }

    render() {
        this.view.render();
        this.coinController.render();
        this.cardController.render();
    }
}