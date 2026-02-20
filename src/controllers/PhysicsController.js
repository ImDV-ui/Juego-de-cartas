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

        // MODIFICADO: Bajamos el rebote (restitution a 0.1) y la fricción para que actúe como una apisonadora
        const barrelCoin = new CANNON.ContactMaterial(this.materials.barrel, this.materials.coin, { friction: 0.3, restitution: 0.1 });

        // Material para que caiga a plomo sobre las plataformas sin rebotar
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
        // Suelo principal
        const floorShape = new CANNON.Box(new CANNON.Vec3(5, 0.5, 5));
        const floorBody = new CANNON.Body({ mass: 0, material: this.materials.ground });
        floorBody.addShape(floorShape);
        floorBody.position.set(0, -0.5, 2);
        this.world.addBody(floorBody);

        // Muros laterales
        const wallShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 6));
        const leftWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        leftWall.addShape(wallShape);
        leftWall.position.set(-5.5, 2, 1);
        this.world.addBody(leftWall);

        const rightWall = new CANNON.Body({ mass: 0, material: this.materials.ground });
        rightWall.addShape(wallShape);
        rightWall.position.set(5.5, 2, 1);
        this.world.addBody(rightWall);

        // --- SOLUCIÓN: LA CAJA FÍSICA DEL EMPUJADOR ---
        // Le damos físicas a la barrera principal y también a las piedras de enfrente.
        this.pusherBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.KINEMATIC,
            material: this.materials.pusher
        });

        // Fusionamos la barrera base y las piedras frontales en UNA ÚNICA CAJA para evitar 
        // cualquier resquicio o hueco interno donde las monedas puedan quedarse atascadas.
        // Dimensiones base: Z va de -5 a +5 (caja 5,1,5 en Z=0). 
        // Dimensiones Thwomps: Z va de +4 a +6 (caja 5,1,1 en Z=5).
        // Caja total unida: Z va de -5 a +6. Ancho = 11 -> Mitad = 5.5.
        // Centro Z: -5 + 5.5 = +0.5. Altura igual (1).
        const unifiedPusherShape = new CANNON.Box(new CANNON.Vec3(5, 1, 5.5));
        this.pusherBody.addShape(unifiedPusherShape, new CANNON.Vec3(0, 0.5, 0.5));

        this.pusherBody.position.set(0, 0.45, -4);
        this.world.addBody(this.pusherBody);
        // ----------------------------------------------

        // El techo que evita que las monedas se cuelen por arriba y por detrás
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
        // Hacemos la caja física ligeramente más alta en el eje Y (antes 0.08, ahora 0.15)
        // para que no cueste tanto empujarla pero no se deslice bajo la barrera
        const shape = new CANNON.Box(new CANNON.Vec3(0.6, 0.15, 0.9));
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
            mass: 500, // Massive weight so coins don't impede it at all and it acts as a steamroller
            material: this.materials.barrel, // Uses the new bouncy/heavy material hitting coins
            linearDamping: 0.1,
            angularDamping: 0.1,
            allowSleep: false
        });

        // Rotate the cylinder so it lies flat on its side (rolling position) horizontally (X-axis)
        // Cylinder default is along Y in Cannon-es. We want it along X.
        const q = new CANNON.Quaternion();
        q.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI / 2);
        body.addShape(shape, new CANNON.Vec3(0, 0, 0), q);

        body.position.copy(position);

        if (velocity) {
            body.velocity.copy(velocity);

            // MODIFICADO: Le damos un impulso de giro fuerte y CONSTANTE solo en el eje X
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