export class InputController {
    constructor() {
        this.onDropCallbacks = [];
        this.isMouseDown = false;
        this.mouseX = 0;
        this.lastDropTime = 0;
        this.dropInterval = 150;

        this.initListeners();
        this.update();
    }

    initListeners() {
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        window.addEventListener('mouseleave', () => this.onMouseUp());

        window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        window.addEventListener('touchend', () => this.onMouseUp());
    }

    onMouseDown(e) {
        if (e.target.closest('.game-card') || e.target.closest('#card-container')) return;
        this.isMouseDown = true;
        this.updateMousePosition(e.clientX);
        this.tryDrop(true);
    }

    onMouseMove(e) {
        this.updateMousePosition(e.clientX);
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    onTouchStart(e) {
        if (e.target.closest('.game-card') || e.target.closest('#card-container')) return;
        if (e.touches.length > 0) {
            this.isMouseDown = true;
            this.updateMousePosition(e.touches[0].clientX);
            this.tryDrop(true);
        }
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            this.updateMousePosition(e.touches[0].clientX);
        }
    }

    updateMousePosition(clientX) {
        this.mouseX = (clientX / window.innerWidth) * 2 - 1;
    }

    tryDrop(force = false) {
        const now = Date.now();
        if (force || (this.isMouseDown && now - this.lastDropTime > this.dropInterval)) {
            this.lastDropTime = now;
            this.onDropCallbacks.forEach(callback => callback(this.mouseX));
        }
    }

    update() {
        this.tryDrop();
        requestAnimationFrame(() => this.update());
    }


    onDrop(callback) {
        this.onDropCallbacks.push(callback);
    }
}