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
        textureHeight: 600,
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
water.position.y = 0.1; // Naikkan posisi air
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

    // Posisi awal diatur dalam loop animasi untuk pergerakan ombak

    boat.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(boat);
    console.log('✅ Boat loaded');
});

// === BUAT DERMAGA ===
function createDock() {
    const dockGroup = new THREE.Group();

    // Material kayu untuk dermaga
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513, // Warna coklat kayu (SaddleBrown)
        roughness: 0.8,
        metalness: 0.2
    });

    // Platform utama dermaga
    const platformGeometry = new THREE.BoxGeometry(4, 0.4, 15); // Lebar, Tinggi, Panjang
    const platform = new THREE.Mesh(platformGeometry, woodMaterial);
    platform.position.set(1, 1.3, 0); // Posisikan di samping kapal
    platform.castShadow = true;
    platform.receiveShadow = true;
    dockGroup.add(platform);

    // === BUAT TANGGA ===
    const stairsGroup = new THREE.Group();
    const stepWidth = 2.5;
    const stepHeight = 0.2;
    const stepDepth = 0.5;
    const numSteps = 5;

    for (let i = 0; i < numSteps; i++) {
        const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
        const step = new THREE.Mesh(stepGeometry, woodMaterial);
        // Posisi tangga turun dari platform
        step.position.set(
            platform.position.x - (platform.geometry.parameters.width / 2) - (stepDepth / 2) - (i * stepDepth), // Mundur dari tepi dermaga
            platform.position.y - (platform.geometry.parameters.height / 2) - (stepHeight / 2) - (i * (stepHeight + 0.1)), // Turun
            -0.7 // Di tengah dermaga
        );
        step.castShadow = true;
        step.receiveShadow = true;
        stairsGroup.add(step);
    }
    dockGroup.add(stairsGroup);

    // Tiang penyangga dermaga
    const pillarGeometry = new THREE.BoxGeometry(0.5, 4.4, 0.5);
    const numPillars = 4;
    for (let i = 0; i < numPillars; i++) {
        const pillar = new THREE.Mesh(pillarGeometry, woodMaterial);
        // Sebar tiang di sepanjang dermaga
        const zPos = -6.5 + (i * (13 / (numPillars - 1)));
        pillar.position.set(1, -0.8, zPos); // Di bawah platform
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        dockGroup.add(pillar);
    }

    scene.add(dockGroup);
    console.log('✅ Dock created');
}

// === UI INTERAKTIF ===
const boatProperties = {
    density: 1.0, // Massa jenis awal
    baseSink: -0.1 // Posisi tenggelam dasar
};

function createUI() {
    // Container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.left = '10px';
    container.style.backgroundColor = 'rgba(0,0,0,0.7)';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.color = 'white';
    container.style.fontFamily = 'sans-serif';
    container.style.fontSize = '14px';

    // Label
    const label = document.createElement('label');
    label.setAttribute('for', 'density-slider');
    label.innerText = 'Massa Jenis Kapal: ';
    container.appendChild(label);

    // Slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'density-slider';
    slider.min = '0.5'; // Lebih ringan, lebih mengapung
    slider.max = '1.5'; // Lebih berat, lebih tenggelam
    slider.step = '0.01';
    slider.value = boatProperties.density;
    container.appendChild(slider);

    // Elemen untuk menampilkan info nilai
    const infoDisplay = document.createElement('p');
    infoDisplay.style.marginTop = '10px';
    infoDisplay.style.marginBottom = '0px';
    infoDisplay.style.fontSize = '12px';
    container.appendChild(infoDisplay);

    // Fungsi untuk update teks info
    function updateInfoText() {
        // Asumsi & Konstanta Fisika untuk Simulasi
        const g = 9.8; // Percepatan gravitasi (m/s²)
        const rho_water = 1000; // Massa jenis air (kg/m³)
        const base_mass_at_1_density = 100000; // Massa kapal fiktif saat ρ = 1000 kg/m³

        // Perhitungan berdasarkan input slider
        const boat_rho = boatProperties.density * 1000; // Massa jenis kapal (kg/m³)
        const boat_mass = base_mass_at_1_density * boatProperties.density; // Massa kapal (kg)
        const submerged_volume = boat_mass / rho_water; // Volume tercelup (m³)
        const buoyant_force = boat_mass * g; // Gaya apung (Newton)

        const densityText = `ρ (Massa Jenis): ${boat_rho.toFixed(0)} kg/m³`;
        const sinkText = `Kedalaman Dasar: ${boatProperties.baseSink.toFixed(2)} m`;
        const volumeText = `V (Volume Tercelup): ${submerged_volume.toFixed(1)} m³`;
        const forceText = `FA (Gaya Apung): ${(buoyant_force / 1000).toFixed(1)} kN`; // Tampilkan dalam KiloNewton
        infoDisplay.innerText = `${densityText}\n${sinkText}\n${volumeText}\n${forceText}`;
    }

    // Event listener untuk slider
    slider.addEventListener('input', (event) => {
        boatProperties.density = parseFloat(event.target.value);
        boatProperties.baseSink = -0.1 * boatProperties.density;
        updateInfoText();
    });

    document.body.appendChild(container);
    updateInfoText(); // Panggil sekali untuk menampilkan nilai awal
}

// === KONTROL KAPAL ===
const moveState = {
    forward: 0,
    turn: 0
};

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveState.forward = 1; break;
        case 'KeyS': moveState.forward = -1; break;
        case 'KeyA': moveState.turn = 1; break;
        case 'KeyD': moveState.turn = -1; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': if (moveState.forward === 1) moveState.forward = 0; break;
        case 'KeyS': if (moveState.forward === -1) moveState.forward = 0; break;
        case 'KeyA': if (moveState.turn === 1) moveState.turn = 0; break;
        case 'KeyD': if (moveState.turn === -1) moveState.turn = 0; break;
    }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// === RESPONSIVE ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// === ANIMATE ===
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    water.material.uniforms['time'].value += 1.0 / 60.0;

    if (boat) {
        // Ombak: naik-turun sinusoidal
        boat.position.y = boatProperties.baseSink + Math.sin(time * 1.5) * 0.15; // Gunakan baseSink yang dinamis
        boat.rotation.z = Math.sin(time) * 0.05;
        const baseRotationX = Math.sin(time * 0.8) * 0.05; // Simpan rotasi ombak dasar

        // Kontrol Gerakan
        const moveSpeed = 5.0;
        const turnSpeed = 1.5;

        boat.rotation.y += moveState.turn * turnSpeed * delta;
        boat.translateX(moveState.forward * moveSpeed * delta);

        // Gabungkan rotasi ombak dengan rotasi kontrol
        boat.rotation.x = baseRotationX;
    }

    controls.update();
    renderer.render(scene, camera);
}

createDock();
createUI();
animate();
