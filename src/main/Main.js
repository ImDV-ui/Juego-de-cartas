import { GameLoop } from './GameLoop.js';
import { GameController } from '../controllers/GameController.js';

class Main {
    constructor() {
        this.gameController = new GameController();
        this.gameLoop = new GameLoop(this.gameController);
        
        this.init();
    }

    init() {
        console.log('Initializing Coin Pusher Casino Game...');
        this.gameLoop.start();
    }
}

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new Main();
});
