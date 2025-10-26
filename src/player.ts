import * as THREE from 'three';
import { TerrainController } from './terrain';
import { CowController } from './cow';
import { Game } from './game';

const g = 10;
const mass = 180;
const bikeWheelbase = 1.5;
const power = 2000;

export class Player {
    private eyeLevel: number = 1.5;
    public speed: number = 0.0;
    private control:THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    
    private pedal: number = 0.0;
    public helm: number = 0.0;
    public heading: number = 0.0;
    public horn: boolean = false;

    public crashSound: THREE.Audio = null;
    public crashed: boolean = false;

    constructor(private camera: THREE.Camera, 
            game: Game,
            private terrainController: TerrainController,
            private cowController: CowController
        ) {
        document.addEventListener("keydown", (event) => {
            var keyCode = event.keyCode;
            if (keyCode == 38) {
                this.pedal = 1;
            } else if (keyCode == 40) {
                this.pedal = -1;
            } else if (keyCode == 37) {
                this.control.x = -1; // left
            } else if (keyCode == 39) {
                this.control.x = 1; // right
            } else if (keyCode == 39) {
                // player.set(0, 0, 0);
            } else if (keyCode == 32) {
                this.horn = true;
            }
        }, false);
        document.addEventListener("keyup", (event) => {
            var keyCode = event.which;
            if (keyCode == 38) {
                this.pedal = 0;
            } else if (keyCode == 40) {
                this.pedal = 0;
            } else if (keyCode == 37) {
                this.control.x = 0; // left
            } else if (keyCode == 39) {
                this.control.x = 0;
            } else if (keyCode == 39) {
                // player.set(0, 0, 0);
            } else if (keyCode == 32) {
                this.horn = false;
            }
        }, false);

        this.crashSound = game.createCrashSound();
    }

    public update(time: number, dt: number) {
        this.camera.position.setY(this.groundHeight(this.camera.position) + this.eyeLevel);

        const frictionGround = sign(this.speed) * mass * 0.01;
        const frictionAir = this.speed * this.speed * 0.01; // cw
        const force = this.pedal * power; // power of engine
        const accelaration = force / mass;
        this.speed = this.speed + accelaration * dt - (frictionGround + frictionAir) * dt;
        this.speed = Math.max(this.speed, -0.5);

        // dy = sin(helm) * dt * v
        // tan(dHeading) = dy / dWheel
        // dHeading ∞ helm * dt * v / dWheel
        this.helm = THREE.MathUtils.clamp(this.helm 
                + this.control.x * dt * 50 / (1 + this.speed / 20) 
                - (this.helm * this.speed * 0.1 * dt), 
            -45, 45);
        this.heading = this.heading - this.speed * this.helm * THREE.MathUtils.DEG2RAD * dt / bikeWheelbase;
        // helm
        // camera.rotateZ(1 * dt);
        // camera.setRotationFromAxisAngle(new Vector3(1, 0, 1), -30 / 180 * Math.PI);
        // camera.setRotationFromEuler(new THREE.Euler(0, heading, sign(control.x) * -30 / 180 * Math.PI, "XYZ"))
        const inclination = 0.1 * this.helm * THREE.MathUtils.DEG2RAD * this.speed * this.speed / g;
        this.camera.setRotationFromEuler(new THREE.Euler(0,  this.heading, -inclination, "XYZ"))
        // camera.rotateY(- sign(speed) * control.x * Math.PI / 180 * 40 *  dt)

        // camera.up = new THREE.Vector3(0, -1, 0);

        // velocity forward
        const dir = this.camera.getWorldDirection(new THREE.Vector3());
        this.camera.position.add(dir.multiplyScalar(this.speed * dt));


        // collision detection
        let hit = false;
        const bikeDirection = this.camera.getWorldDirection(new THREE.Vector3());
        const hitPosition1 = this.camera.position.clone().add(bikeDirection);
        const hitPosition2 = this.camera.position.clone();

        const hitTerrain1 = this.terrainController.checkHit(hitPosition1);
        const hitTerrain2 = this.terrainController.checkHit(hitPosition2);
        if (hitTerrain1 || hitTerrain2) {
            hit = true;
        }
        const hitCow1 = this.cowController.checkHit(hitPosition1);
        const hitCow2 = this.cowController.checkHit(hitPosition2);
        if (hitCow1 || hitCow2) {
            hit = true;
        }

        if (hit) {
            this.speed = Math.max(Math.min(this.speed, 0), -0.5);
            if (!this.crashed && !this.crashSound.isPlaying) {
                this.crashSound.play();
            }
        }
        this.crashed = hit;
    }

    groundHeight(position: THREE.Vector3) {
        return 0;
    }
}

function sign(n: number) {
    return n > 0 ? 1 : (n < 0 ? -1 : 0);
}
