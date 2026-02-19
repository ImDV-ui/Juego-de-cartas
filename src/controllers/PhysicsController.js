import * as CANNON from 'cannon-es';

export class PhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);

        this.world.allowSleep = false;
        this.world.solver.iterations = 10;

        this.materials = {
            ground: new CANNON.Material('ground'),
            coin: new CANNON.Material('coin'),
            pusher: new CANNON.Material('pusher')
        };

        const coinGround = new CANNON.ContactMaterial(this.materials.coin, this.materials.ground, { friction: 0.05, restitution: 0.3 });
        const coinCoin = new CANNON.ContactMaterial(this.materials.coin, this.materials.coin, { friction: 0.05, restitution: 0.3 });
        const coinPusher = new CANNON.ContactMaterial(this.materials.coin, this.materials.pusher, { friction: 0.1, restitution: 0.1 });

        this.world.addContactMaterial(coinGround);
        this.world.addContactMaterial(coinCoin);
        this.world.addContactMaterial(coinPusher);

        this.bodies = [];
        this.pusherBody = null;

        this.initCabinet();
    }

    initCabinet() {
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5));
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, 2);
        this.world.addBody(floorBody);

        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 6));
        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, 1);
        this.world.addBody(leftWall);

        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, 1);
        this.world.addBody(rightWall);

        const pusherShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5));
        this.pusherBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });
        this.pusherBody.addShape(pusherShape);
        this.pusherBody.position.set(0, 0.45, -4);
        this.world.addBody(this.pusherBody);

        const sweeperShape = new CANNON.Box(new CANNON.Vec3(5, 1, 4));
        const sweeperBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        sweeperBody.addShape(sweeperShape);
        sweeperBody.position.set(0, 2, -4.5);
        this.world.addBody(sweeperBody);
    }

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 5);
    }

    createCoin(radius, position) {
        const shape = new CANNON.Cylinder(radius, radius, 0.3, 12);
        const body = new CANNON.Body({
            mass: 1,
            material: this.materials.coin,
            linearDamping: 0.1,
            angularDamping: 0.5,
            allowSleep: false
        });

        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.position.copy(position);
        this.world.addBody(body);
        return body;
    }

    createCardItem(position) {
        const shape = new CANNON.Box(new CANNON.Vec3(0.6, 0.08, 0.9));
        const body = new CANNON.Body({
            mass: 1.5,
            material: this.materials.coin,
            linearDamping: 0.1,
            angularDamping: 0.5,
            allowSleep: false
        });

        body.addShape(shape);
        body.position.copy(position);
        this.world.addBody(body);
        return body;
    }

    createBarrel(position, velocity) {
        // Barrel shape: Cylinder approx radius 1.2 and height 3.0 (matches 3x visual scale)
        // Using same physics properties as coins/cards for stability, just scaled up.
        const shape = new CANNON.Cylinder(1.2, 1.2, 3.0, 16);
        const body = new CANNON.Body({
            mass: 5, // Reduced from 50 to 5 for stability (closer to coins' 1.0)
            material: this.materials.coin,
            linearDamping: 0.1,
            angularDamping: 0.5, // Matches coins/cards
            allowSleep: false
        });

        // Cannon Cylinder is along Z axis. Rotate to align with Y axis (upright).
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.position.copy(position);

        if (velocity) {
            body.velocity.copy(velocity);
        }

        this.world.addBody(body);
        return body;
    }

    setPusherPosition(z) {
        if (this.pusherBody) {
            this.pusherBody.position.z = z;
        }
    }
}