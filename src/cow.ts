console.log("cow module");

import * as THREE from 'three';
import {Color, MathUtils, Mesh, Object3D, Scene, Vector3} from "three";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { BehaviorSubject, Observable, single, defer, shareReplay } from 'rxjs';

const cowTexture = new THREE.TextureLoader().load('assets/textures/Kuhfellmuster.jpg');
export const cowMaterial = new THREE.MeshBasicMaterial({map: cowTexture, wireframe: false});

export interface CowTarget {
    speed: Vector3;
    body: THREE.Mesh;
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
    return {speed, body} as CowTarget;
}

