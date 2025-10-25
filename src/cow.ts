import * as THREE from 'three';
import {Color, MathUtils, Mesh, Object3D, Scene, Vector3} from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { BehaviorSubject, Observable, single, defer, shareReplay } from 'rxjs';

const cowTexture = new THREE.TextureLoader().load('assets/textures/Kuhfellmuster.jpg');
export const cowMaterial = new THREE.MeshBasicMaterial({map: cowTexture, wireframe: false});


export class CowTarget {
    targetSpeed: Vector3 = new THREE.Vector3();

    constructor(public body: THREE.Object3D, public speed: Vector3) {
        this.targetSpeed = speed.clone();
    }

    public pushFrom(position: Vector3) {
        const cowDistance = this.body.position.clone().sub(position);
        if (cowDistance.length() < 100) {
            // this.speed.add(cowDistance.multiplyScalar(0.1 / (cowDistance.length() + 1.0)));
            this.targetSpeed.add(cowDistance.multiplyScalar(0.1 / (cowDistance.length() + 1.0)));
            const maxSpeed = Math.min(this.targetSpeed.length(), 2.0);
            this.targetSpeed.normalize().multiplyScalar(maxSpeed);
        }
    }

    public update(dt: number) {
        const ds = this.speed.clone().multiplyScalar(dt);
        this.targetSpeed.multiplyScalar(1 - 0.5 * dt); // deceleration

        this.speed = this.speed.clone().multiplyScalar(1.0 - dt * 0.4)
                .add(this.targetSpeed.clone().multiplyScalar(dt * 0.4))
                .multiplyScalar(1.0);

        this.body.lookAt(this.speed.clone().add(this.body.position));
        this.body.position.add(ds);
        this.body.position.y = 1.7;
    }

    public checkHit(position: Vector3) {
        const d = position.distanceTo(this.body.position);
        if (d < 0.75) {
            return this;
        }
    }
}



const cowModel = new Observable<THREE.Object3D>((subscriber) => {
    console.log("creating cow")
    const objLoader = new OBJLoader();
    objLoader.load("assets/models/cow.obj", model => {
            console.log("cow.obj loaded", model);
            model.traverse( function ( child ) {
                const mesh = child as Mesh;
                if ( mesh.isMesh ) {
                    mesh.material = cowMaterial;
                }
            });
            // const cowMesh: THREE.Object3D = new THREE.Group();
            // cowMesh.add(model);
            subscriber.next(model);
            subscriber.complete();
        },
        xhr => {}, // on progress
        error => {
            console.error("error loding geometry", error);
        }
    );
}).pipe(shareReplay(1));

export const createCow = (scene: Scene, position: Vector3, speed: Vector3) => {
    const body: THREE.Object3D = new THREE.Group();
    cowModel.subscribe(model => {
        body.add(model.clone());
    });
    body.position.set(position.x, position.y, position.z);
    scene.add(body);
    return new CowTarget(body, speed);
}

export class CowController {
    public targets: CowTarget[] = [];

    constructor(private scene: THREE.Scene) {
    }

    createCow(position: Vector3, speed: Vector3) {
        this.targets.push(createCow(this.scene, position, speed));
    }

    pushCows(position: Vector3) {
         this.targets.forEach(cow => {
            cow.pushFrom(position);
        });
    }

    update(dt: number) {
        this.targets.forEach(cow => {
            cow.update(dt);
        });
    }

    public checkHit(position: THREE.Vector3) : CowTarget {
        for (let cow of this.targets) {
            const hit = cow.checkHit(position);
            if (hit) {
                return hit;
            }
        }
        return null;
    }
    
}
