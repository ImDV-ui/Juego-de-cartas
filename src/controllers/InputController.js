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
        // Handle mouse down
    }

    onMouseMove(e) {
        // Handle mouse move
    }

    onMouseUp(e) {
        // Handle mouse up
    }
}
