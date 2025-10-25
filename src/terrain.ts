import * as THREE from 'three';

const groundWidth = 100, groundDepth = 100;
const groundData = new Array(groundWidth * groundDepth);

const groundTexture = new THREE.TextureLoader().load('assets/textures/grasslight-big.jpg');
groundTexture.colorSpace = THREE.SRGBColorSpace;
groundTexture.repeat = new THREE.Vector2(10, 10);
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;

const streetTexture = new THREE.TextureLoader().load('assets/textures/street-01-texture.png');
streetTexture.colorSpace = THREE.SRGBColorSpace;
streetTexture.repeat = new THREE.Vector2(1, 1);
// groundTexture2.wrapS = THREE.RepeatWrapping;
// groundTexture2.wrapT = THREE.RepeatWrapping;

const groundMaterial = new THREE.MeshBasicMaterial({map: groundTexture, wireframe: false});
const streetMaterial = new THREE.MeshBasicMaterial({
    map: streetTexture, 
    transparent: true,
    alphaToCoverage: false,
    wireframe: false
});

const treeTexture = new THREE.TextureLoader().load('assets/sprites/tree-01.png');
const treeMaterial = new THREE.MeshBasicMaterial({
    map: treeTexture,
    transparent: true,
    alphaToCoverage: true,
    wireframe: false
});

const obstacleMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color().setHex(0xf0a0a0)});
const obstackes = [
    new THREE.Vector3(10, 0, 10),
    new THREE.Vector3(210, 0, 10)
]

class GroundTile {
    public ground: THREE.Object3D;
    public trees: THREE.Object3D[] = [];

    constructor(private tileIndexI: number, private tileIndexJ: number) {
        this.ground = new THREE.Group();
        this.ground.position.set(tileIndexI * groundWidth, 0, tileIndexJ * groundDepth);

        THREE.MathUtils.seededRandom(1 + tileIndexI * tileIndexJ);
        this.createFloor(tileIndexI * groundWidth, tileIndexJ * groundDepth);

        THREE.MathUtils.seededRandom(1 + tileIndexI * tileIndexJ);
        this.createTrees();
        this.createObstackes();
    }

    createFloor(originX: number, originY: number) {
        const tileGeometry = new THREE.PlaneGeometry(groundWidth, groundDepth, 99, 99);
        tileGeometry.rotateX(-Math.PI / 2);
        tileGeometry.translate(50, 0, 50);

        const vertices = tileGeometry.attributes.position.array;

        // ground profile 
        for (let i = 0; i < 100; i++) {
            for (let j = 0; j < 100; j++) {
                const x = originX + i;
                const y = originY + j;
                // vertices[(i + j * 100) * 3 + 1] = (x*x + y*y > 12000 ? 1 : 0);
            }
        }

        // wobbly ground
        // keep edges at 0 to avoid breaks
        for (let i = 1; i < 99; i++) {
            for (let j = 1; j < 99; j++) {
                vertices[(i * 100 + j) * 3 + 1] += THREE.MathUtils.seededRandom() * 0.25;
            }
        }
        this.ground.add(new THREE.Mesh(tileGeometry, groundMaterial));
        const streetObject = new THREE.Mesh(tileGeometry, streetMaterial);
        streetObject.position.setY(0.01);
        this.ground.add(streetObject);
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

    createObstackes() {
        const origin = new THREE.Vector3(this.tileIndexI * groundWidth, 0, this.tileIndexJ * groundWidth);
        for (let position of obstackes) {
            if (position.x >= this.tileIndexI * groundWidth && position.x <= (this.tileIndexI + 1) * groundWidth &&
                position.y >= this.tileIndexJ * groundWidth && position.y <= (this.tileIndexJ + 1) * groundWidth) {
                const geometry = new THREE.CylinderGeometry(2, 2, 500, 8, 1);
                const obstacle = new THREE.Mesh(geometry, obstacleMaterial);
                obstacle.position.copy(position.clone().sub(origin));
                this.ground.add(obstacle);
            }
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

    public checkHit(position: THREE.Vector3) : THREE.Object3D {
        const hitPosition = position.clone().sub(this.ground.position);
        for (let tree of this.trees) {
            const treeHitPoint = tree.position.clone().setY(position.y);
            const d = hitPosition.distanceTo(treeHitPoint);
            if (d < 0.75) {
                return tree;
            }
        };
        return null;
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

    public checkHit(position: THREE.Vector3) : THREE.Object3D {
        if (this.currentTiles.length > 5) {
            return this.currentTiles[4].checkHit(position);
        }
        return null;
    }

}
