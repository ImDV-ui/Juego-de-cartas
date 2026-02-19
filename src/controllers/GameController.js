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
        this.cardController = new CardController(this); // Pass self for callbacks
        this.inputController = new InputController();

        this.pusherTime = 0;

        this.inputController.onDrop((normalizedX) => {
            if (this.view.ui.money > 0) {
                this.view.ui.updateMoney(-1);
                const dropX = normalizedX * 4.5;
                // CAÍDA EN Z = 1.5: Esto asegura que caen justo delante del techo oscuro,
                // directamente sobre la plataforma móvil plateada.
                this.coinController.spawnCoin(dropX, 4, 1.5);
            }
        });
    }

    update(deltaTime) {
        this.physics.update(deltaTime);

        // Movimiento de la barrera: Oscila entre Z = -6 (muy atrás) y Z = -2 (adelante)
        this.pusherTime += deltaTime * 1.5;
        const pusherZ = -4 + Math.sin(this.pusherTime) * 2;

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