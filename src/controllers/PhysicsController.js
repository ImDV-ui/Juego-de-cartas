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
            pusher: new CANNON.Material('pusher'),
            barrel: new CANNON.Material('barrel')
        };

        const coinGround = new CANNON.ContactMaterial(this.materials.coin, this.materials.ground, { friction: 0.05, restitution: 0.3 });
        const coinCoin = new CANNON.ContactMaterial(this.materials.coin, this.materials.coin, { friction: 0.05, restitution: 0.3 });
        const coinPusher = new CANNON.ContactMaterial(this.materials.coin, this.materials.pusher, { friction: 0.1, restitution: 0.1 });

        const barrelCoin = new CANNON.ContactMaterial(this.materials.barrel, this.materials.coin, { friction: 0.3, restitution: 0.1 });
        const barrelGround = new CANNON.ContactMaterial(this.materials.barrel, this.materials.ground, { friction: 0.2, restitution: 0.0 });

        this.world.addContactMaterial(coinGround);
        this.world.addContactMaterial(coinCoin);
        this.world.addContactMaterial(coinPusher);
        this.world.addContactMaterial(barrelCoin);
        this.world.addContactMaterial(barrelGround);

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

        this.pusherBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });

        // 1. Barrera recta, plana y normal para que se apoyen las monedas.
        const mainPusherShape = new CANNON.Box(new CANNON.Vec3(5, 1, 5.5));
        this.pusherBody.addShape(mainPusherShape, new CANNON.Vec3(0, 0.5, 0.5));

        this.pusherBody.position.set(0, 0.45, -4);
        this.world.addBody(this.pusherBody);

        // 2. LA BARREDORA (Sweeper): La hacemos altísima (y=10, media altura 10 -> alto 20)
        // para que actúe como un panel de cristal frontal infinito. Así ninguna moneda 
        // podrá saltar por encima ni quedarse atascada en el balcón del castillo.
        const sweeperShape = new CANNON.Box(new CANNON.Vec3(5, 10, 4));
        const sweeperBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        sweeperBody.addShape(sweeperShape);
        sweeperBody.position.set(0, 11, -3.0);
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
        const shape = new CANNON.Cylinder(0.9, 0.9, 4.0, 16);
        const body = new CANNON.Body({
            mass: 500,
            material: this.materials.barrel,
            linearDamping: 0.1,
            angularDamping: 0.1,
            allowSleep: false
        });

        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.position.copy(position);

        if (velocity) {
            body.velocity.copy(velocity);
            body.angularVelocity.set(20, 0, 0);
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