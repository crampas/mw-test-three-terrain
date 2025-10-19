// =============================================================================
// gauge

import * as THREE from 'three';
import {Color, MathUtils, Mesh, Object3D, Scene, Vector3} from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export class Gauge {
    private container;
    private arrow;
    private labelDiv;
    public value: number = 0;
    private minAngle: number;
    private maxAngle: number;

    // public static createGauge(parent: Mesh, position: Vector3, min: number, max: number);
    public static createGauge(parent: Mesh, position: Vector3, min: number, max: number, minAngle?: number, maxAngle?: number) {
        const gauge = new Gauge(min, max);
        gauge.minAngle = minAngle === undefined ? -140 : minAngle;
        gauge.maxAngle = maxAngle === undefined ? 140 : maxAngle;
        const mesh = gauge.getMesh();
        mesh.translateX(position.x);
        mesh.translateY(position.y);
        mesh.translateZ(position.z);
        // mesh.position.set(position);
        parent.add(mesh);
        return gauge;
    }

    constructor(public min: number, public max: number) {
        this.createContainer();
        this.createArrow();
        this.createText();
    }

    private createContainer() {
        const group = new THREE.Group();
        // const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
        const geometry = new THREE.CircleGeometry(0.1, 16);
        // const geometry = new THREE.CircleGeometry(0.30, 16);
        // geometry.rotateX(-Math.PI / 180 * 90);
        const material = new THREE.MeshBasicMaterial({
            color: new Color().setHex(0xaaaabb)
        });
        const mesh = new THREE.Mesh(geometry, material);
        // mesh.position.set(1, 10, 0);
        group.add(mesh);
        this.container = group;
    }

    private createArrow() {
        const geometry = new THREE.PlaneGeometry(0.01, 0.1, 1, 1);
        // const geometry = new THREE.PlaneGeometry(0.2, 1, 1, 1);
        // geometry.rotateX(-Math.PI / 180 * 45);
        geometry.translate(0, 0.04, 0);
        const material = new THREE.MeshBasicMaterial({color: new Color().setHex(0xff4040)});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0.01);
        this.container.add(mesh);
        this.arrow = mesh;
    }

    private createText() {
        const div = document.createElement('div');
        div.className = 'label';
        div.textContent = 'Eartdssadh';
        div.style.backgroundColor = 'transparent';
        this.labelDiv = div;
        const label = new CSS2DObject(div);
        label.position.set( 0, -0.02, 0.01 );
        this.container.add( label );
    }

    public updateGameObject() {
        const arrowValue = (this.value - this.min) / (this.max - this.min);
        this.arrow.rotation.z = -Math.PI / 180 * (arrowValue * (this.maxAngle - this.minAngle) + this.minAngle);
        // this.container.rotation.z = -Math.PI / 180 * (arrowValue * 280 - 140);
        this.labelDiv.textContent = Math.floor(this.value);
    }

    public getMesh() {
        return this.container;
    }
}
