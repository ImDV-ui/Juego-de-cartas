import * as CANNON from 'cannon-es';

export class CoinController {
    constructor(physicsController, gameView) {
        this.physics = physicsController;
        this.view = gameView;
        this.coins = [];

        this.spawnInitialCoins();
    }

    spawnInitialCoins() {

        for (let i = 0; i < 40; i++) {
            this.spawnCoin(
                (Math.random() - 0.5) * 8,
                2 + Math.random() * 2,
                1 + (Math.random() * 3)
            );
        }
    }

    spawnCoin(x, y, z) {


        const position = new CANNON.Vec3(x, y, z);
        const radius = 0.6;

        const body = this.physics.createCoin(radius, position);
        const mesh = this.view.createCoinMesh(body.position, body.quaternion);

        this.coins.push({ body, mesh });
    }

    update(deltaTime) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            coin.mesh.position.copy(coin.body.position);
            coin.mesh.quaternion.copy(coin.body.quaternion);

            if (coin.body.position.y < -3) {
                if (coin.body.position.z > 6) {
                    this.view.ui.updateMoney(1);
                }
                this.physics.world.removeBody(coin.body);
                this.view.removeCoinMesh(coin.mesh);
                this.coins.splice(i, 1);
            }
        }
    }

    render() {
    }
}