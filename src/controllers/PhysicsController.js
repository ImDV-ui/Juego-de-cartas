import * as CANNON from 'cannon-es';

export class PhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true; // Allow bodies to sleep
        this.world.solver.iterations = 10;

        this.materials = {
            ground: new CANNON.Material('ground'),
            coin: new CANNON.Material('coin'),
            pusher: new CANNON.Material('pusher')
        };

        const coinGround = new CANNON.ContactMaterial(this.materials.coin, this.materials.ground, { friction: 0.3, restitution: 0.3 });
        const coinCoin = new CANNON.ContactMaterial(this.materials.coin, this.materials.coin, { friction: 0.3, restitution: 0.3 });
        const coinPusher = new CANNON.ContactMaterial(this.materials.coin, this.materials.pusher, { friction: 0.1, restitution: 0.1 });

        this.world.addContactMaterial(coinGround);
        this.world.addContactMaterial(coinCoin);
        this.world.addContactMaterial(coinPusher);

        this.bodies = [];
        this.pusherBody = null;

        this.initCabinet();
    }

    initCabinet() {
        // --- SUELO (Más adelantado para atrapar las monedas que caen) ---
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)); // Profundidad 10
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, 2); // Movido hacia adelante
        this.world.addBody(floorBody);

        // --- PAREDES ---
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 6)); // Profundidad 12
        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, 1);
        this.world.addBody(leftWall);

        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, 1);
        this.world.addBody(rightWall);

        // --- PUSHER (Barrera empujadora) ---
        const pusherShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)); // Profundidad 10
        this.pusherBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });
        this.pusherBody.addShape(pusherShape);
        this.pusherBody.position.set(0, 0.45, -4); // Base de inicio
        this.world.addBody(this.pusherBody);

        // --- SWEEPER (Techo que raspa las monedas) ---
        const sweeperShape = new CANNON.Box(new CANNON.Vec3(5, 1, 4)); // Profundidad 8
        const sweeperBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        sweeperBody.addShape(sweeperShape);
        // Su borde delantero llega hasta Z = -0.5. 
        // Cuando el pusher retrocede al máximo, su borde delantero queda en Z = -1.0.
        // ¡Esto garantiza que el techo barre el 100% de la superficie expuesta!
        sweeperBody.position.set(0, 2, -4.5);
        this.world.addBody(sweeperBody);
    }

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 5);
    }

    createCoin(radius, position) {
        const shape = new CANNON.Cylinder(radius, radius, 0.15, 12);
        const body = new CANNON.Body({
            mass: 1,
            material: this.materials.coin,
            linearDamping: 0.5,
            angularDamping: 0.5,
            allowSleep: true,
            sleepSpeedLimit: 0.1, // Body will fall asleep if speed < 0.1
            sleepTimeLimit: 0.5   // Body must be slow for 0.5s to sleep
        });

        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.position.copy(position);
        this.world.addBody(body);
        return body;
    }

    setPusherPosition(z) {
        if (this.pusherBody) {
            this.pusherBody.position.z = z;
        }
    }
}