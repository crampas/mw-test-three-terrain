import * as THREE from 'three';

const groundWidth = 100, groundDepth = 100;
const groundData = new Array(groundWidth * groundDepth);

const groundTexture = new THREE.TextureLoader().load('assets/textures/grasslight-big.jpg');
groundTexture.colorSpace = THREE.SRGBColorSpace;
groundTexture.repeat = new THREE.Vector2(10, 10);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
const groundMaterial = new THREE.MeshBasicMaterial({map: groundTexture, wireframe: false});

const treeTexture = new THREE.TextureLoader().load('assets/sprites/tree-01.png');
const treeMaterial = new THREE.MeshBasicMaterial({
    map: treeTexture,
    transparent: true,
    alphaToCoverage: false,
    wireframe: false
});

class GroundTile {
    public ground: THREE.Object3D;
    private trees: THREE.Object3D[] = [];

    constructor(tileIndexI: number, tileIndexJ: number) {
        this.ground = new THREE.Group();
        this.ground.position.set(tileIndexI * groundWidth, 0, tileIndexJ * groundDepth);

        THREE.MathUtils.seededRandom(1 + 0 * tileIndexI * tileIndexJ);
        this.createFloor();

        THREE.MathUtils.seededRandom(1 + 0 * tileIndexI * tileIndexJ);
        this.createTrees();
    }

    createFloor() {
        const tileGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth, 99, 99);
        tileGeometry.rotateX(-Math.PI / 2);
        tileGeometry.translate(50, 0, 50);
        // wobbly ground
        const vertices = tileGeometry.attributes.position.array;
        // keep edges at 0 to avoid breaks
        for (let i = 1; i < 99; i++) {
            for (let j = 1; j < 99; j++) {
                vertices[(i * 100 + j) * 3 + 1] = THREE.MathUtils.seededRandom() * 0.25;
            }
        }
        this.ground.add(new THREE.Mesh(tileGeometry, groundMaterial));
    }

    createTrees() {
        for (let index = 0; index < 30; index++) {
            const position = new THREE.Vector3(THREE.MathUtils.seededRandom() * 100, 0, THREE.MathUtils.seededRandom() * 100);
            // position.y = groundHeight(position);
            const treeGeometry = new THREE.PlaneGeometry(10, 20, 1, 1);
            const treeObject = new THREE.Mesh(treeGeometry, treeMaterial);
            treeObject.position.copy(position);
            this.trees.push(treeObject);
            this.ground.add(treeObject);
        }
    }

    public update(camera: THREE.Camera) {
        const cameraView = camera.getWorldDirection(new THREE.Vector3());
        this.trees.forEach(tree => {
            const treeLookAt = tree.position.clone()
                    .add(this.ground.position)
                    .sub(cameraView);
            tree.lookAt(treeLookAt);
        });
    }
}

export class TerrainController {
    private currentTiles: GroundTile[] = [];
    private currentTileIndexI = -170;
    private currentTileIndexJ = -180;

    constructor(private scene: THREE.Scene) {
    }

    private createTiles(tileIndexI: number, tileIndexJ: number) {
        return [
            this.createTile(tileIndexI - 1, tileIndexJ - 1),
            this.createTile(tileIndexI - 1, tileIndexJ - 0),
            this.createTile(tileIndexI - 1, tileIndexJ + 1),
            this.createTile(tileIndexI + 0, tileIndexJ - 1),
            this.createTile(tileIndexI + 0, tileIndexJ - 0),
            this.createTile(tileIndexI + 0, tileIndexJ + 1),
            this.createTile(tileIndexI + 1, tileIndexJ - 1),
            this.createTile(tileIndexI + 1, tileIndexJ - 0),
            this.createTile(tileIndexI + 1, tileIndexJ + 1)
        ]
    }

    private createTile(tileIndexI: number, tileIndexJ: number) {
        return new GroundTile(tileIndexI, tileIndexJ);
    }

    public updateTerrain(camera: THREE.Camera) {
        const position = camera.position;
        const newTileIndexI = Math.floor(position.x / 100);
        const newTileIndexJ = Math.floor(position.z / 100);
        if (newTileIndexI != this.currentTileIndexI || newTileIndexJ != this.currentTileIndexJ) {
            console.log("crete new tiles", newTileIndexI, newTileIndexJ);
            const newTiles = this.createTiles(newTileIndexI, newTileIndexJ);
            this.currentTileIndexI = newTileIndexI;
            this.currentTileIndexJ = newTileIndexJ;
            this.currentTiles.forEach(tile => this.scene.remove(tile.ground));
            this.currentTiles = newTiles;
            this.currentTiles.forEach(tile => this.scene.add(tile.ground));
        }
        this.currentTiles.forEach(tile => tile.update(camera));
    }

}
