import * as CANNON from 'cannon-es';

export class PhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
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
        // --- Main Floor ---
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)); 
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, 0);
        this.world.addBody(floorBody);

        // --- Walls ---
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 6));

        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, 0);
        this.world.addBody(leftWall);

        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, 0);
        this.world.addBody(rightWall);

        const backWallShape = new CANNON.Box(new CANNON.Vec3(6, 4, 0.5));
        const backWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        backWall.addShape(backWallShape);
        backWall.position.set(0, 2, -6.5); 
        this.world.addBody(backWall);

        // --- Pusher (Extendido para que nunca haya hueco atrás) ---
        // Incrementamos la profundidad de 2 a 6 (CANNON usa half-extents, así que mide 12 de largo)
        const pusherShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 6)); 
        this.pusherBody = new CANNON.Body({
            mass: 0, 
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });
        this.pusherBody.addShape(pusherShape);
        this.pusherBody.position.set(0, 0.45, -3); // Ligeramente hundido
        this.world.addBody(this.pusherBody);

        // --- Sweeper (El bloque superior que barre las monedas) ---
        // Este bloque es estático, se sitúa justo por encima de la barrera.
        const sweeperShape = new CANNON.Box(new CANNON.Vec3(5, 1, 4)); // Profundidad 8
        const sweeperBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        sweeperBody.addShape(sweeperShape);
        // Colocado en Y=2. Su base queda en Y=1.0. La barrera está en Y=0.95.
        // Así queda un hueco minúsculo de 0.05. Las monedas miden 0.15, por lo que chocarán y caerán.
        sweeperBody.position.set(0, 2, -2); 
        this.world.addBody(sweeperBody);
    }

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 5);
    }

    createCoin(radius, position) {
        // Grosor ajustado a 0.15
        const shape = new CANNON.Cylinder(radius, radius, 0.15, 12);
        const body = new CANNON.Body({
            mass: 1, 
            material: this.materials.coin,
            linearDamping: 0.5, 
            angularDamping: 0.5
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