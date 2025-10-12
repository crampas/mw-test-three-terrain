import * as THREE from 'three';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";
import {DRACOLoader} from "three/examples/jsm/loaders/DRACOLoader";
import {Color, MathUtils, Mesh, Object3D, Scene, Vector3} from "three";
import {CSS2DObject, CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {Gauge} from "./gauge";
import { CowTarget, createCow } from './cow';
import { TerrainController } from './terrain';


const SHOW_TRGETS = false;
const SHOW_TRGETS_COW = true;
const SHOW_TREES = true;
const SHOW_TREES_FAN = false;
const SHOW_TREES_SPRITES = false;
const SHOW_HORSE = false;


// =============================================================================
// init

const scene = new THREE.Scene();
scene.background = new THREE.Color().setHex(0xc0c0c0);
scene.fog = new THREE.FogExp2( 0xc0c0c0, 0.050 );

// ============================================================================
// horse

if (SHOW_HORSE) {
    const loader = new GLTFLoader();
    // let cowMesh: THREE.Object3D = null;
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
}

// ============================================================================
// bike

const bike = new THREE.Group();
scene.add(bike);

const objectLoader = new THREE.ObjectLoader();
let bikeHandlebar = undefined;
let helmGauge: Gauge = undefined;
let speedGauge: Gauge = undefined;
objectLoader.load("assets/models/bike.json", model => {
    console.log("bike.json loaded", model);
    model.rotateY(90 * MathUtils.DEG2RAD);
    model.position.set(0, -0.5, -1.5);
    // const bikeContainer = new THREE.Group();
    let bikeContainer = bike;
    bikeContainer.add(model);
    // scene.add(bikeContainer);
    // bike = bikeContainer;

    const bikeHelm = model.children.find(item => {
        console.log(item.name)
        return item.name == "helm"
    });
    bikeHelm.rotateY(0 * MathUtils.DEG2RAD);
    bikeHandlebar = bikeHelm;
    helmGauge = Gauge.createGauge(bikeHandlebar, new Vector3(-0.1, 0.25, 0.0), -90, 90);
    helmGauge.getMesh().rotateY(-Math.PI / 180 * 90);
    helmGauge.getMesh().rotateX(-Math.PI / 180 * 20);
    speedGauge = Gauge.createGauge(bikeHandlebar, new Vector3(-0.1, 0.25, 0.2), 0, 140);
    speedGauge.getMesh().rotateY(-Math.PI / 180 * 90);
    speedGauge.getMesh().rotateX(-Math.PI / 180 * 20);
}, undefined, error => console.log("error loding cow", error));

// ============================================================================


const clock = new THREE.Clock();


const width = window.innerWidth, height = window.innerHeight;
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.1, 200 );
camera.position.set( 0, 1, 0 );
camera.lookAt(20, 1, 0);

const mapCamera = new THREE.OrthographicCamera(10, -10, -10, 10, 1, 200);
mapCamera.position.set(50, 20, 50);
mapCamera.lookAt(50, 0, 50);


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
}

const terrainController = new TerrainController(scene);

function groundHeight(position: Vector3) {
    return 0.0;
}
/*
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
*/

// ============================================================================
// cows

const targets: CowTarget[] = [];

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

        targets.push({speed: new Vector3(Math.random(), 0, Math.random()), body: cube} as CowTarget);
    }
}

if (SHOW_TRGETS_COW) {
    for (let index = 0; index < 100; index++) {
        const position = new Vector3(Math.random() * 100, 1, Math.random() * 100);
        position.y = groundHeight(position) + 1;
        const speed = new Vector3(Math.random(), 0, Math.random());
        targets.push(createCow(scene, position, speed));
    }
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


/*
let bike: Object3D = (() => {
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    geometry.rotateZ(-Math.PI / 180 * 90);
    geometry.rotateX(-Math.PI / 180 * 90);
    geometry.rotateY(-Math.PI / 180 * 90);
    geometry.translate(0, -0.5, -0.5);
    const material = new THREE.MeshBasicMaterial({color: new Color().setHex(0x404040)});
    const bike = new THREE.Mesh(geometry, material);
    bike.position.set(0, 0, 0);
    scene.add(bike);
    return bike;
})();
*/

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


// const speedGauge = Gauge.createGauge(handlebar, new Vector3(-0.065, -0.01, 0.025), 0, 140);
// const helmGauge = Gauge.createGauge(handlebar, new Vector3(0.0, -0.01, 0.025), -90, 90);

// =============================================================================

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( width, height );
renderer.setAnimationLoop( animate );
// renderer.setScissorTest( true );
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
document.body.appendChild( renderer.domElement );

const mapRenderer = new THREE.WebGLRenderer( { antialias: true } );
mapRenderer.setSize( width / 4, height / 4 );
mapRenderer.setAnimationLoop( animate );
// renderer2.setScissorTest( true );
mapRenderer.domElement.style.position = 'absolute';
mapRenderer.domElement.style.width = '100px';
mapRenderer.domElement.style.height = '100px';
mapRenderer.domElement.style.right = '50px';
mapRenderer.domElement.style.top = '50px';
document.body.appendChild( mapRenderer.domElement );

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
    if (bikeHandlebar) {
        bikeHandlebar.setRotationFromEuler(new THREE.Euler(0 * MathUtils.DEG2RAD, -helm * MathUtils.DEG2RAD, 0, "YXZ"));
    }
    // speed gauge
    if (speedGauge) {
        speedGauge.value = speed * 3.6;
        speedGauge.updateGameObject();
    }
    // helm gauge
    if (helmGauge) {
        helmGauge.value = helm;
        helmGauge.updateGameObject();
    }

    terrainController.updateTerrain(camera);


    // renderer.setSize(width, height);
    stats.update();
    renderer.render(scene, camera);

    // map - view from above
    mapCamera.position.set(camera.position.x, camera.position.y + 5, camera.position.z);
   // renderer.setScissor( 0, 0, width / 2, height);
    // renderer.setViewport( 0, 0, width / 2, height);
    // renderer.setClearColor( 0xff0000, 1 );
    // renderer.render( scene, camera );

    // renderer2.setScissor(width / 2, 0, width / 2, height );
    // renderer2.setViewport(width / 2, 0, width / 2, height );
    // renderer2.setClearColor( 0x00ff00, 1 );
    mapRenderer.render(scene, mapCamera);

    // all labels
    labelRenderer.render(scene, camera);
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
