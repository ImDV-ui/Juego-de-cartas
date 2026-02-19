import * as CANNON from 'cannon-es';

export class PhysicsController {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.solver.iterations = 10;

        // Materials
        this.materials = {
            ground: new CANNON.Material('ground'),
            coin: new CANNON.Material('coin'),
            pusher: new CANNON.Material('pusher')
        };

        // Contact Materials
        const coinGround = new CANNON.ContactMaterial(this.materials.coin, this.materials.ground, {
            friction: 0.3,
            restitution: 0.3
        });
        const coinCoin = new CANNON.ContactMaterial(this.materials.coin, this.materials.coin, {
            friction: 0.3,
            restitution: 0.3
        });
        const coinPusher = new CANNON.ContactMaterial(this.materials.coin, this.materials.pusher, {
            friction: 0.1, // Low friction for pusher to slide well
            restitution: 0.1
        });

        this.world.addContactMaterial(coinGround);
        this.world.addContactMaterial(coinCoin);
        this.world.addContactMaterial(coinPusher);

        this.bodies = [];
        this.pusherBody = null;

        this.initCabinet();
    }

    initCabinet() {
        // --- Static Bed (Main Floor) ---
        // We need a floor that allows coins to fall off the front (triangle) and sides.
        // Instead of one big box, we build walls and a floor. 
        // Actually, for the triangle dropout, it's easier to make the floor "V" shaped or use multiple boxes.
        // Simplified approach: Large floor, but we check bounds manually for "winning", OR use static planes.

        // Let's stick to a solid floor for the main area, and side gutters.
        // For the triangle dropout, we can model the floor as 3 shapes? 
        // Or just a large floor and we detect when coins fall off the edge.
        // To match the image: The floor is a rectangle that ends at the triangle tip.

        // Floor
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5)); // 10x1x10
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, 0);
        this.world.addBody(floorBody);

        // --- Walls ---
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 6));

        // Left Wall
        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, 0);
        this.world.addBody(leftWall);

        // Right Wall
        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, 0);
        this.world.addBody(rightWall);

        // Back Wall
        const backWallShape = new CANNON.Box(new CANNON.Vec3(6, 2, 0.5));
        const backWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        backWall.addShape(backWallShape);
        backWall.position.set(0, 2, -6.5); // Slightly wider to cover corners
        this.world.addBody(backWall);

        // --- Pusher ---
        // Kinematic body that moves back and forth
        const pusherShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 2)); // 10 width, 1 height, 4 depth
        this.pusherBody = new CANNON.Body({
            mass: 0, // Kinematic = infinite mass, controlled by us
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });
        this.pusherBody.addShape(pusherShape);
        this.pusherBody.position.set(0, 0.5, -4);
        this.world.addBody(this.pusherBody);
    }

    update(deltaTime) {
        this.world.step(1 / 60, deltaTime, 5);
    }

    // Creates a physical coin
    createCoin(radius, position) {
        const shape = new CANNON.Cylinder(radius, radius, 0.05, 12);
        // Cannon cylinder is upright by default, we need to rotate it?
        // Cannon cylinder axis is Y. Coins usually lay flat. 
        // We need to rotate the shape or the body.

        const body = new CANNON.Body({
            mass: 1, // Dynamic
            material: this.materials.coin,
            linearDamping: 0.5, // Simulate air/friction drag
            angularDamping: 0.5
        });

        // Rotate shape so cylinder flat side is N/S? No, cylinder axis is height.
        // A flat coin on the ground has local Y axis pointing UP.
        // Cannon Cylinder is created with radiusTop, radiusBottom, height, numSegments
        // Aligned with Z axis usually? No, mostly Y in older versions, let's check.
        // Cannon-es cylinder is along Y axis. So a coin standing on edge.
        // We want it flat. So we rotate the SHAPE relative to the BODY.
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
