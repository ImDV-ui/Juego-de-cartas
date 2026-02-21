import * as CANNON from 'cannon-es';

export class CoinController {
    constructor(physicsController, gameView) {
        this.physics = physicsController;
        this.view = gameView;
        this.coins = [];

        this.coinValues = {
            yellow: 1,
            blue: 5,
            red: 10
        };

        this.spawnInitialCoins();
    }

    getRandomCoinType() {
        const rand = Math.random();
        // 80% amarillas, 15% azules, 5% rojas
        if (rand > 0.95) return 'red';
        if (rand > 0.8) return 'blue';
        return 'yellow';
    }

    spawnInitialCoins() {

        for (let i = 0; i < 40; i++) {
            const type = this.getRandomCoinType();

            this.spawnCoin(
                (Math.random() - 0.5) * 8,
                2 + Math.random() * 2,
                1 + (Math.random() * 3),
                type
            );
        }
    }

    spawnCoin(x, y, z, type = 'yellow') {


        const position = new CANNON.Vec3(x, y, z);
        const radius = 0.6;

        const body = this.physics.createCoin(radius, position);
        const mesh = this.view.createCoinMesh(body.position, body.quaternion, type);

        const value = this.coinValues[type] || 1;

        this.coins.push({ body, mesh, value, type });
    }

    update(deltaTime) {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            coin.mesh.position.copy(coin.body.position);
            coin.mesh.quaternion.copy(coin.body.quaternion);

            if (coin.body.position.y < -3) {
                if (coin.body.position.z > 6) {
                    this.view.ui.updateMoney(coin.value);
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