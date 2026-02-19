import { UIView } from './UIView.js';

export class GameView {
    constructor() {
        this.container = document.getElementById('game-container');
        this.ui = new UIView();

        // Initialize Canvas or DOM elements here
    }

    render() {
        // Clear screen / Update Canvas
        this.ui.render();
    }
}
