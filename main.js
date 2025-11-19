import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';

let boat;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// === SCENE ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // sky blue

// === CAMERA ===
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);

// === CONTROLS ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.update();

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// === AIR / LAUT (Water) ===
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = -Math.PI / 2;
scene.add(water);

// === LOAD KAPAL .GLB ===
const loader = new GLTFLoader();
loader.load('/boat.glb', (gltf) => {
    boat = gltf.scene;

    // Center and scale
    const box = new THREE.Box3().setFromObject(boat);
    const center = new THREE.Vector3();
    box.getCenter(center);
    boat.position.sub(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 5 / maxDim;
    boat.scale.setScalar(scaleFactor);

    boat.position.y = 0.2; // Turunkan posisi kapal agar lebih 'tenggelam'

    boat.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(boat);
    console.log('✅ Boat loaded');
});

// === RESPONSIVE ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// === ANIMATE (ombak) ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    water.material.uniforms['time'].value += 1.0 / 60.0;

    if (boat) {
        // Ombak: naik-turun sinusoidal
        boat.position.y = 0.2 + Math.sin(time * 1.5) * 0.15; // Sesuaikan base height dan amplitudo
        boat.rotation.z = Math.sin(time) * 0.05; // Tingkatkan goyangan sisi
        boat.rotation.x = Math.sin(time * 0.8) * 0.05; // Tingkatkan goyangan depan-belakang
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();
