import * as THREE from 'three';

const audioLoader = new THREE.AudioLoader();


export class Game {
    private audioListener = new THREE.AudioListener();

    constructor(public scene: THREE.Scene, public camera: THREE.Camera) {
        camera.add(this.audioListener);
    }

    loadSound(sound: THREE.Audio, file: string) {
        audioLoader.load(file, buffer => {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
        });
        return sound;
    }

    loadSound2(sound: THREE.PositionalAudio, file: string) {
        audioLoader.load(file, buffer => {
            sound.setBuffer( buffer );
            sound.setLoop( false );
            sound.setVolume( 0.5 );
        });
        return sound;
    }


    createHornSound() {
        return this.loadSound(new THREE.Audio(this.audioListener), 'assets/sound/old-car-horn-153262.mp3');
    }

    createCowMuhSound() {
        return this.loadSound2(new THREE.PositionalAudio(this.audioListener), 'assets/sound/cow-mooing-type-01-293301.mp3');
    }

    createCowPushMuhSound() {
        return this.loadSound2(new THREE.PositionalAudio(this.audioListener), 'assets/sound/cow-voice-383530.mp3');
    }

    createCrashSound() {
        return this.loadSound(new THREE.Audio(this.audioListener), 'assets/sound/car-crash-sound-376882.mp3');
    }
}
 