import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {Color, MathUtils, Mesh, Object3D, Scene, Vector3} from "three";
import {CSS2DObject, CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

const SHOW_TRGETS = false;
const SHOW_TRGETS_COW = true;
const SHOW_TREES = true;
const SHOW_TREES_FAN = false;
const SHOW_TREES_SPRITES = false;


// =============================================================================
// init

const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(0xc0c0c0);
scene.fog = new THREE.FogExp2( 0xc0c0c0, 0.050 );


const loader = new GLTFLoader();
let cowMesh: THREE.Object3D = null;
/*
loader.load("assets/models/Horse.glb", model => {
            console.log("cow loaded", model);
            // cowGeometry = geometry;
        },
        xhr => {},
        error => {
            console.error("error loding geometry", error);
        });
*/

const cowTexture = new THREE.TextureLoader().load('assets/textures/Kuhfellmuster.jpg');
const cowMaterial = new THREE.MeshBasicMaterial({map: cowTexture, wireframe: false});

const objectLoader = new THREE.ObjectLoader();
objectLoader.load("assets/models/bike.json", model => {
    console.log("cow.json loaded", model);
    model.rotateY(90 * MathUtils.DEG2RAD);
    model.position.set(0, -0.5, -1.5);
    const bikeContainer = new THREE.Group();
    bikeContainer.add(model);
    scene.add(bikeContainer);
    bike = bikeContainer;

    const bikeHelm = model.children.find(item => {
        console.log(item.name)
        return item.name == "helm"
    });
    bikeHelm.rotateY(20 * MathUtils.DEG2RAD);

}, undefined, error => console.log("error loding cow", error));

const objLoader = new OBJLoader();
objLoader.load("assets/models/cow.obj", model => {
        console.log("model loaded", model);
        model.traverse( function ( child ) {
            const mesh = child as Mesh;
            if ( mesh.isMesh ) {
                mesh.material = cowMaterial;
            }
        });
        cowMesh = model;

        for (let index = 0; index < 100; index++) {
            const cube = cowMesh.clone();
            cube.position.set(Math.random() * 100, 1, Math.random() * 100);
            cube.position.y = groundHeight(cube.position) + 1;
            scene.add(cube);

            targets.push({speed: new Vector3(Math.random(), 0, Math.random()), body: cube} as Cow);
        }


    },
    xhr => {},
    error => {
        console.error("error loding geometry", error);
    });

const clock = new THREE.Clock();


const width = window.innerWidth, height = window.innerHeight;
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.1, 200 );
camera.position.set( 0, 1, 0 );
camera.lookAt(20, 1, 0);

const camera2 = new THREE.OrthographicCamera(10, -10, -10, 10, 1, 200);
camera2.position.set(50, 20, 50);
camera2.lookAt(50, 0, 50);


const stats = new Stats();
document.body.appendChild( stats.dom );


// =============================================================================
// ground
const groundWidth = 100, groundDepth = 100;
const groundData = new Array(groundWidth * groundDepth);
{
    const geometry = new THREE.PlaneGeometry(groundWidth, groundDepth, 99, 99);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(50, 0, 50);

    MathUtils.seededRandom(1);
    for (let i = 0, l = groundWidth * groundDepth; i < l; i++) {
        const x = i % groundWidth, y = Math.floor(i / groundWidth);
        groundData[i] = 0 * x * (x - groundWidth) * y * (y - groundDepth) / 1000000;
    }

    const vertices = geometry.attributes.position.array;
    for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
        vertices[ j + 1 ] = groundData[i] + MathUtils.seededRandom() * 0.25;
    }

    const texture = new THREE.TextureLoader().load('assets/textures/grasslight-big.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.repeat = new THREE.Vector2(10, 10);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const material = new THREE.MeshBasicMaterial({map: texture, wireframe: false});
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);
}

// =============================================================================
// trees

const trees: THREE.Mesh[] = [];
if (SHOW_TREES_SPRITES) {
    for (let index = 0; index < 100; index++) {
        const map = new THREE.TextureLoader().load( 'assets/sprites/tree-01.png' );
        const material = new THREE.SpriteMaterial( { map: map } );
        const sprite = new THREE.Sprite( material );
        sprite.scale.set(10, 20, 10)
        sprite.position.set(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);

        scene.add( sprite );
    }
}

if (SHOW_TREES) {
    const texture = new THREE.TextureLoader().load('assets/sprites/tree-01.png');
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaToCoverage: false,
        wireframe: false
    });
    MathUtils.seededRandom(1);
    for (let index = 0; index < 100; index++) {
        const position = new Vector3(MathUtils.seededRandom() * 100, 0, MathUtils.seededRandom() * 100);
        position.y = groundHeight(position);
        const geometry = new THREE.PlaneGeometry(10, 20, 1, 1);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        trees.push(mesh);
        scene.add(mesh);
    }
}

function groundHeight(position: Vector3) {
    const x = position.x;
    const y = position.z;
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.ceil(x);
    const y2 = Math.ceil(y);
    const v11 = groundData[x1 + y1 * groundWidth];
    const v21 = groundData[x2 + y1 * groundWidth];
    const v12 = groundData[x1 + y2 * groundWidth];
    const v22 = groundData[x2 + y2 * groundWidth];
    const dx = x - x1;
    const dy = y - y1;
    const v1 = (1.0 - dx) * v11 + dx * v21;
    const v2 = (1.0 - dx) * v12 + dx * v22;
    const v = (1.0 - dy) * v1 + dy * v2;
    return v;
}

if (SHOW_TREES_FAN) {
    for (let index = 0; index < 100; index++) {
        const position = new Vector3(Math.random() * 100 - 50, 0, Math.random() * 100 - 50);
        const geometry1 = new THREE.PlaneGeometry(10, 20, 1, 1);
        const geometry2 = new THREE.PlaneGeometry(10, 20, 1, 1);
        geometry2.rotateY(-Math.PI / 180 * 45);
        const texture = new THREE.TextureLoader().load('assets/sprites/tree-01.png');
        // texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaToCoverage: false,
            wireframe: false
        });
        const mesh1 = new THREE.Mesh(geometry1, material);
        mesh1.position.copy(position);
        scene.add(mesh1);
        trees.push(mesh1);
        const mesh2 = new THREE.Mesh(geometry2, material);
        mesh2.position.copy(position);
        // scene.add(mesh2);
        // trees.push(mesh2);
    }
}


// =============================================================================
// cows

interface Cow {
    speed: Vector3;
    body: THREE.Mesh;
}

const targets: Cow[] = [];
if (SHOW_TRGETS) {
    const texture = new THREE.TextureLoader().load('assets/textures/Kuhfellmuster.jpg');
    for (let index = 0; index < 100; index++) {
        const geometry = new THREE.CylinderGeometry( 0.5, 0.5, 1.5, 16 );
        geometry.rotateZ(-Math.PI / 180 * 90);
        geometry.rotateX(-Math.PI / 180 * 90);
        geometry.rotateY(-Math.PI / 180 * 90);
        const material = new THREE.MeshBasicMaterial({map: texture, wireframe: false});
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(Math.random() * 100, 1, Math.random() * 100);
        cube.position.y = groundHeight(cube.position) + 1;
        scene.add(cube);

        targets.push({speed: new Vector3(Math.random(), 0, Math.random()), body: cube} as Cow);
    }
}
if (SHOW_TRGETS_COW) {
}


// =============================================================================
// sky
{
    const width = 1000, depth = 1000;
    const geometry = new THREE.PlaneGeometry(width, depth, 1, 1);
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({color: new Color().setHex(0x30a0ff)});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 15, 0);
    scene.add(mesh);
}

// =============================================================================
// gauge

class Gauge {
    private container;
    private arrow;
    private labelDiv;
    public value: number = 0;

    public static createGauge(parent: Mesh, position: Vector3, min: number, max: number) {
        const gauge = new Gauge(min, max);
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
        // const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
        const geometry = new THREE.CircleGeometry(0.03, 16);
        // geometry.rotateX(-Math.PI / 180 * 90);
        const material = new THREE.MeshBasicMaterial({
            color: new Color().setHex(0xaaaabb)
        });
        const mesh = new THREE.Mesh(geometry, material);
        // mesh.position.set(1, 10, 0);
        this.container = mesh;
    }

    private createArrow() {
        const geometry = new THREE.PlaneGeometry(0.002, 0.03, 1, 1);
        // geometry.rotateX(-Math.PI / 180 * 45);
        geometry.translate(0, 0.012, 0);
        const material = new THREE.MeshBasicMaterial({color: new Color().setHex(0xff4040)});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0.001);
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
        this.arrow.rotation.z = -Math.PI / 180 * (arrowValue * 280 - 140);
        this.labelDiv.textContent = Math.floor(this.value);
    }

    public getMesh() {
        return this.container;
    }
}

let bike: Object3D = (() => {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    geometry.rotateZ(-Math.PI / 180 * 90);
    geometry.rotateX(-Math.PI / 180 * 90);
    geometry.rotateY(-Math.PI / 180 * 90);
    geometry.translate(0, -0.5, -0.5);
    const material = new THREE.MeshBasicMaterial({color: new Color().setHex(0x404040)});
    const bike = new THREE.Mesh(geometry, material);
    bike.position.set(0, 0, 0);
    // scene.add(bike);
    return bike;
})();

let handlebar = (() => {
    const geometry = new THREE.CylinderGeometry(0.025, 0.025, 0.40, 8);
    geometry.rotateZ(-Math.PI / 180 * 90);
    geometry.rotateX(-Math.PI / 180 * 90);
    geometry.rotateY(-Math.PI / 180 * 0);
    // geometry.translate(0, -0.5, -0.5);
    const material = new THREE.MeshNormalMaterial(); //{color: new Color().setHex(0x808080)});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -0.15, -0.4);
    return mesh;
})();
bike.add(handlebar);

const wheel1 = (() => {
    const geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.10, 32);
    geometry.rotateZ(-Math.PI / 180 * 90);
    // geometry.rotateX(-Math.PI / 180 * 90);
    // geometry.rotateY(-Math.PI / 180 * 90);
    // geometry.translate(0, -0.5, -0.5);
    const material = new THREE.MeshNormalMaterial() // ({color: new Color().setHex(0x808080)});
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -0.1, -0.6);
    // mesh.rotateZ(MathUtils.DEG2RAD * 90)
    return mesh;
})();
handlebar.add(wheel1);


const label = (() => {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = 'Eartdssadh';
    div.style.backgroundColor = 'transparent';
    const label = new CSS2DObject(div);
    label.position.set(0.0, -0.32, -0.6 );
    bike.add(label);
    return div;
})();


const speedGauge = Gauge.createGauge(handlebar, new Vector3(-0.065, -0.01, 0.025), 0, 140);
const helmGauge = Gauge.createGauge(handlebar, new Vector3(0.0, -0.01, 0.025), -90, 90);

// =============================================================================

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( width, height );
renderer.setAnimationLoop( animate );
// renderer.setScissorTest( true );
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
document.body.appendChild( renderer.domElement );

const renderer2 = new THREE.WebGLRenderer( { antialias: true } );
renderer2.setSize( width / 4, height / 4 );
renderer2.setAnimationLoop( animate );
// renderer2.setScissorTest( true );
renderer2.domElement.style.position = 'absolute';
renderer2.domElement.style.width = '400px';
renderer2.domElement.style.height = '400px';
renderer2.domElement.style.right = '100px';
renderer2.domElement.style.bottom = '100px';
document.body.appendChild( renderer2.domElement );

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );




const controls = new FirstPersonControls( camera, renderer.domElement );
controls.movementSpeed = 100;
controls.lookSpeed = 0.1;
controls.lookVertical = false;

window.addEventListener( 'resize', onWindowResize );


const control = new Vector3(0, 0, 0);
let pedal = 0;
let force = 0;
let speed = 0;
let horn = false;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 38) {
        pedal = 1;
    } else if (keyCode == 40) {
        pedal = -1;
    } else if (keyCode == 37) {
        control.x = -1; // left
    } else if (keyCode == 39) {
        control.x = 1; // right
    } else if (keyCode == 39) {
        // player.set(0, 0, 0);
    } else if (keyCode == 32) {
        horn = true;
    }
};
document.addEventListener("keyup", onDocumentKeyUp, false);
function onDocumentKeyUp(event) {
    var keyCode = event.which;
    if (keyCode == 38) {
        pedal = 0;
    } else if (keyCode == 40) {
        pedal = 0;
    } else if (keyCode == 37) {
        control.x = 0; // left
    } else if (keyCode == 39) {
        control.x = 0;
    } else if (keyCode == 39) {
        // player.set(0, 0, 0);
    } else if (keyCode == 32) {
        horn = false;
    }
};


const bikeWheelbase = 1.5;
const eyeLevel = 1.5;
const g = 10;
let helm = 0;

let heading = 225 * MathUtils.DEG2RAD;


/**
 *
 * F = m * v^2 / L * sin(a)
 * R = m * sin(b)
 *
 * tan(b) = tan(a) * v^2 / (L * g)
 *
 * tan(x) = x / 50
 *
 * b = (a * v^2) / (L * g)
 */
function animate( time ) {
    const dt = clock.getDelta();


    if (horn) {
        targets.forEach(cow => {
            const cowDistance = cow.body.position.clone().sub(camera.position);
            if (cowDistance.length() < 10) {
                cow.speed.add(cowDistance.multiplyScalar(dt));
            }
        });
    }
    targets.forEach(cow => {
        const ds = cow.speed.clone().multiplyScalar(dt);
        cow.speed.multiplyScalar(1 - 0.5 * dt);
        cow.body.lookAt(cow.speed.clone().add(cow.body.position));
        cow.body.position.add(ds);
        cow.body.position.y = groundHeight(cow.body.position) + 1.7;
    });


    const direction = camera.position.clone();
    const cameraView = camera.getWorldDirection(new Vector3());
    direction.y = 0;
    trees.forEach(tree => {
        const treeLookAt = tree.position.clone().sub(cameraView);
        tree.lookAt(treeLookAt);
        // tree.lookAt(direction);
    })



    // controls.update( clock.getDelta() );

    const mass = 80;
    const frictionGround = sign(speed) * mass * 0.01;
    const frictionAir = speed * 0.1; // cw
    force = pedal * 300; // power of engine
    const accelaration = force / mass;
    speed = speed + accelaration * dt - (frictionGround + frictionAir) * dt;
    speed = Math.max(speed, 0);




    camera.position.set( camera.position.x, groundHeight(camera.position) + eyeLevel, camera.position.z);
    // camera.position.set(player.x, 10, camera.position.z);

    // dy = sin(helm) * dt * v
    // tan(dHeading) = dy / dWheel
    // dHeading ∞ helm * dt * v / dWheel
    helm = MathUtils.clamp(helm + control.x * dt * 50 - (helm * speed * 0.3 * dt), -45, 45);
    heading = heading - sign(speed) * speed * helm * MathUtils.DEG2RAD * dt / bikeWheelbase;
    // helm
    // camera.rotateZ(1 * dt);
    // camera.setRotationFromAxisAngle(new Vector3(1, 0, 1), -30 / 180 * Math.PI);
    // camera.setRotationFromEuler(new THREE.Euler(0, heading, sign(control.x) * -30 / 180 * Math.PI, "XYZ"))
    const inclination = 0.1 * helm * MathUtils.DEG2RAD * speed * speed / g;
    camera.setRotationFromEuler(new THREE.Euler(0, heading, -inclination, "XYZ"))
    // camera.rotateY(- sign(speed) * control.x * Math.PI / 180 * 40 *  dt)

    // camera.up = new THREE.Vector3(0, -1, 0);

    // velocity forward
    const dir = camera.getWorldDirection(new Vector3());
    camera.position.add(dir.multiplyScalar(speed * dt));

    // bike
    {
        const mesh = bike;
        mesh.position.copy( camera.position );
        mesh.rotation.copy( camera.rotation );
        mesh.updateMatrix();
        label.textContent = `x: ${format2(camera.position.x)}, y: ${format2(camera.position.y)}, z: ${format2(camera.position.z)}`;
    }
    // handlebar
    handlebar.setRotationFromEuler(new THREE.Euler(-40 * MathUtils.DEG2RAD, -helm * MathUtils.DEG2RAD, 0, "YXZ"));
    // speed gauge
    {
        speedGauge.value = speed * 3.6;
        speedGauge.updateGameObject();
    }
    // helm gauge
    {
        helmGauge.value = helm;
        helmGauge.updateGameObject();
    }

    camera2.position.set(camera.position.x, camera.position.y + 5, camera.position.z);

    // renderer.setSize(width, height);
    stats.update();
    renderer.render(scene, camera);

    // renderer.setScissor( 0, 0, width / 2, height);
    // renderer.setViewport( 0, 0, width / 2, height);
    // renderer.setClearColor( 0xff0000, 1 );
    // renderer.render( scene, camera );

    // renderer2.setScissor(width / 2, 0, width / 2, height );
    // renderer2.setViewport(width / 2, 0, width / 2, height );
    // renderer2.setClearColor( 0x00ff00, 1 );
    renderer2.render( scene, camera2 );

    labelRenderer.render( scene, camera );

}

function format2(n: number) {
    return Math.round(n * 100) / 100;
}


function sign(n: number) {
    return n > 0 ? 1 : (n < 0 ? -1 : 0);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}
