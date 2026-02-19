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

        // Pass physics and view to CoinController for 3D logic
        this.coinController = new CoinController(this.physics, this.view);
        this.cardController = new CardController();
        this.inputController = new InputController();

        this.pusherTime = 0;
    }

    update(deltaTime) {
        // Physics update
        this.physics.update(deltaTime);

        // Pusher Animation Logic (Simple Sine Wave)
        this.pusherTime += deltaTime;
        const pusherZ = -2 + Math.sin(this.pusherTime) * 2; // Oscillate between -4 and 0 roughly

        // Sync Physics Body
        this.physics.setPusherPosition(pusherZ);

        // Sync Visual Mesh
        this.view.updatePusherPosition(pusherZ);

        // Core updates
        this.coinController.update(deltaTime);
        this.cardController.update(deltaTime);
    }

    render() {
        // Render logic
        this.view.render();
        this.coinController.render();
        this.cardController.render();
    }
}
