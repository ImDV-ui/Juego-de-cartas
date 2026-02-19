import { GameView } from '../views/GameView.js';
import { GameData } from '../database/GameData.js';
import { CoinController } from './CoinController.js';
import { CardController } from './CardController.js';
import { InputController } from './InputController.js';

export class GameController {
    constructor() {
        this.view = new GameView();
        this.data = new GameData();

        this.coinController = new CoinController();
        this.cardController = new CardController();
        this.inputController = new InputController();
    }

    update(deltaTime) {
        // Main game logic update
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
