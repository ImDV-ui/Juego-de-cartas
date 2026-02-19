export class InputController {
    constructor() {
        this.initListeners();
    }

    initListeners() {
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        // Add touch listeners for mobile support
    }

    onMouseDown(e) {
        // Simple click to spawn coin
        if (this.onDropCoin) {
            // Randomize drops slightly across the width
            const x = (Math.random() - 0.5) * 6;
            this.onDropCoin(x);
        }
    }

    onMouseMove(e) {
        // Handle mouse move
    }

    onMouseUp(e) {
        // Handle mouse up
    }
}
