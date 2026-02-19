import * as CANNON from 'cannon-es';

export class CoinController {
    constructor(physicsController, gameView) {
        this.physics = physicsController;
        this.view = gameView;
        this.coins = []; // Objects { body, mesh }

        // Debug: Spawn some initial coins
        this.spawnInitialCoins();
    }

    spawnInitialCoins() {
        for (let i = 0; i < 20; i++) {
            this.spawnCoin(
                (Math.random() - 0.5) * 8, // Random X
                2 + Math.random() * 2,     // Drop height
                (Math.random() - 0.5) * 5  // Random Z
            );
        }
    }

    spawnCoin(x, y, z) {
        const position = new CANNON.Vec3(x, y, z);
        const radius = 0.3; // Match visual radius

        // Create Physics Body
        const body = this.physics.createCoin(radius, position);

        // Create Visual Mesh
        const mesh = this.view.createCoinMesh(body.position, body.quaternion);

        this.coins.push({ body, mesh });
    }

    update(deltaTime) {
        // Sync Visuals with Physics
        this.coins.forEach(coin => {
            coin.mesh.position.copy(coin.body.position);
            coin.mesh.quaternion.copy(coin.body.quaternion);

            // TODO: Check if coin fell off bounds (Win/loss logic)
            if (coin.body.position.y < -5) {
                // Remove coin (simplified for now)
                // In real game: Add to score or return to pool
            }
        });
    }

    render() {
        // Render handled by GameView, but we can do custom effects here
    }
}
