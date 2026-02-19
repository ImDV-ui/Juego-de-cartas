export class GameLoop {
    constructor(gameController) {
        this.gameController = gameController;
        this.lastTime = 0;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    stop() {
        this.isRunning = false;
    }

    loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.gameController.update(deltaTime);
        this.gameController.render();

        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }
}
