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
        // Spawn many coins to fill the board
        for (let i = 0; i < 150; i++) {
            this.spawnCoin(
                (Math.random() - 0.5) * 8, // Random X (-4 to 4)
                2 + Math.random() * 5,     // Drop height (staggered)
                // Spawn Z: mostly in the "pushable" area (-2 to 4)
                // Avoid spawning too far back where the pusher might overlap on start
                -2 + Math.random() * 6
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
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            coin.mesh.position.copy(coin.body.position);
            coin.mesh.quaternion.copy(coin.body.quaternion);

            // Check if coin fell off bounds (Score logic)
            if (coin.body.position.y < -5) {
                // Determine if it was a good fall (Front) or bad fall (Sides)
                // Front edge is roughly Z > 5. Side edges are X < -5 or X > 5.

                if (coin.body.position.z > 5) {
                    // Good drop! Front edge.
                    this.view.ui.updateScore(10);
                } else {
                    // Side drop - maybe less points or zero?
                    // For now, let's just count all drops as score to be satisfying
                    this.view.ui.updateScore(1);
                }

                // Remove coin from physics and scene
                this.physics.world.removeBody(coin.body);
                this.view.removeCoinMesh(coin.mesh);

                // Remove from array
                this.coins.splice(i, 1);

                // Respawn a new coin at top to keep the fun going (Infinite mode)
                this.spawnCoin(
                    (Math.random() - 0.5) * 8,
                    4,
                    (Math.random() - 0.5) * 4 - 2
                );
            }
        }
    }

    render() {
        // Render handled by GameView, but we can do custom effects here
    }
}
