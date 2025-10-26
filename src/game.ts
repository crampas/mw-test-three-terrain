import * as THREE from 'three';

const audioLoader = new THREE.AudioLoader();


export class Game {
    private audioListener = new THREE.AudioListener();

    constructor(public scene: THREE.Scene, public camera: THREE.Camera) {
        camera.add(this.audioListener);
    }

    loadSound(file) {
        const sound = new THREE.Audio(this.audioListener);
        audioLoader.load(file, buffer => {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
        });
        return sound;
    }

    createHornSound() {
        return this.loadSound('assets/sound/old-car-horn-153262.mp3');
    }

    createCowMuhSound() {
        return this.loadSound('assets/sound/cow-mooing-type-01-293301.mp3');
    }

    createCrashSound() {
        return this.loadSound('assets/sound/car-crash-sound-376882.mp3');
    }
}
 