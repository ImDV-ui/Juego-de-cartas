import * as CANNON from 'cannon-es';

export class CoinController {
    constructor(physicsController, gameView) {
        this.physics = physicsController;
        this.view = gameView;
        this.coins = [];

        this.spawnInitialCoins();
    }

    spawnInitialCoins() {
        for (let i = 0; i < 30; i++) {
            // Spawnear las monedas en el borde delantero de la barrera
            // Z está entre +2 y +4 para que caigan perfectamente en el área de juego
            this.spawnCoin(
                (Math.random() - 0.5) * 8,
                3 + Math.random() * 2,
                2 + (Math.random() * 2)
            );
        }
    }

    spawnCoin(x, y, z) {
        const position = new CANNON.Vec3(x, y, z);
        const radius = 0.3;

        const body = this.physics.createCoin(radius, position);
        const mesh = this.view.createCoinMesh(body.position, body.quaternion);

        this.coins.push({ body, mesh });
    }

    update(deltaTime) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            coin.mesh.position.copy(coin.body.position);
            coin.mesh.quaternion.copy(coin.body.quaternion);

            // Check if coin fell off bounds (Score logic)
            if (coin.body.position.y < -5) {
                // Determine if it was a good fall (Front) or bad fall (Sides)
                // Front edge is roughly Z > 5.

                if (coin.body.position.z > 5) {
                    // Good drop! Front edge. 1 Point per coin.
                    this.view.ui.updateMoney(1);
                } else {
                    // Side drop - 0 points? Or maybe also 1 point? 
                    // User asked for "each coin one point", implies all drops.
                    this.view.ui.updateMoney(1);
                }

                // Remove coin from physics and scene
                this.physics.world.removeBody(coin.body);
                this.view.removeCoinMesh(coin.mesh);

                // Remove from array
                this.coins.splice(i, 1);

                // No respawn - coins are finite
            }
        }
    }

    render() {
    }
}