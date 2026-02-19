import * as CANNON from 'cannon-es';

export class PhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 20; // Increased for better stability

        // Materials
        this.materials = {
            ground: new CANNON.Material('ground'),
            coin: new CANNON.Material('coin'),
            pusher: new CANNON.Material('pusher')
        };

        // Contact Materials
        const coinGround = new CANNON.ContactMaterial(this.materials.coin, this.materials.ground, {
            friction: 0.5,      // Increased friction so coins don't slide wildly
            restitution: 0.2,   // Lower bounciness
            contactEquationStiffness: 1e8,
            contactEquationRelaxation: 3
        });
        const coinCoin = new CANNON.ContactMaterial(this.materials.coin, this.materials.coin, {
            friction: 0.3,
            restitution: 0.2
        });
        const coinPusher = new CANNON.ContactMaterial(this.materials.coin, this.materials.pusher, {
            friction: 0.1,
            restitution: 0.0
        });

        this.world.addContactMaterial(coinGround);
        this.world.addContactMaterial(coinCoin);
        this.world.addContactMaterial(coinPusher);

        this.bodies = [];
        this.pusherBody = null;

        this.initCabinet();
    }

    initCabinet() {
        // --- Suelo ---
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 7)); // 10 wide, 14 deep
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, -2);
        this.world.addBody(floorBody);

        // --- Paredes ---
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 7));

        // Pared Izquierda
        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, -1);
        this.world.addBody(leftWall);

        // Pared Derecha
        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, -1);
        this.world.addBody(rightWall);

        // Pared Trasera
        const backWallShape = new CANNON.Box(new CANNON.Vec3(6, 2, 0.5));
        const backWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        backWall.addShape(backWallShape);
        backWall.position.set(0, 2, -8.5);
        this.world.addBody(backWall);

        // --- Empujador (Pusher) ---
        // Height 1.0 (0.5 * 2). 
        // We lower it slightly to y=0.45 so the bottom is at -0.05, intersecting floor slightly.
        // This prevents "razor thin gap" issues.
        const pusherShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 2));
        this.pusherBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });
        this.pusherBody.addShape(pusherShape);

        // Lowered from 0.5 to 0.48 to scrape the floor
        this.pusherBody.position.set(0, 0.48, -4);
        this.world.addBody(this.pusherBody);
    }

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 10);
    }

    // Crea la moneda física
    createCoin(radius, position) {
        // Increased thickness from 0.05 to 0.1 for better collision detection
        // Visuals can remain thin, but physics needs volume
        const shape = new CANNON.Cylinder(radius, radius, 0.15, 12);

        const body = new CANNON.Body({
            mass: 5, // Increased mass for stability
            material: this.materials.coin,
            linearDamping: 0.5,
            angularDamping: 0.5
        });

        // Rotamos la forma para que la moneda caiga plana al suelo
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
