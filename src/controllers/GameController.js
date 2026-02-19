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
        this.cardController = new CardController();
        this.inputController = new InputController();

        this.pusherTime = 0;

        // --- SISTEMA DE CLIC PARA SOLTAR MONEDAS ---
        // --- SISTEMA DE CLIC PARA SOLTAR MONEDAS ---
        this.inputController.onDrop((normalizedX) => {
            // Check if user has money
            if (this.view.ui.money > 0) {
                // Deduct cost
                this.view.ui.updateMoney(-1);

                // La mesa mide 10 de ancho (de -5 a 5). 
                const dropX = normalizedX * 4.5;

                // Soltamos la moneda
                this.coinController.spawnCoin(dropX, 4, 2.5);
            }
        });
    }

    update(deltaTime) {
        this.physics.update(deltaTime);

        // Movimiento de la barrera (Oscila entre Z = -4.5 y Z = -1.5)
        this.pusherTime += deltaTime * 1.5;
        const pusherZ = -3 + Math.sin(this.pusherTime) * 1.5;

        this.physics.setPusherPosition(pusherZ);
        this.view.updatePusherPosition(pusherZ);

        this.coinController.update(deltaTime);
        this.cardController.update(deltaTime);
    }

    render() {
        this.view.render();
        this.coinController.render();
        this.cardController.render();
    }
}