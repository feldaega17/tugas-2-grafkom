import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

let boat;
let dockGroup; // <-- dermaga disimpan global untuk collision

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
dirLight.position.set(100, 100, -100);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 500;
scene.add(dirLight);

// === BUAT MATAHARI ===
const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff5c3 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.copy(dirLight.position);
scene.add(sun);

// === POST-PROCESSING (BLOOM EFFECT) ===
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
);
bloomPass.threshold = 0.9;
bloomPass.strength = 0.8;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// === AIR / LAUT (Water) ===
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

const water = new Water(
    waterGeometry,
    {
        textureWidth: 512,
        textureHeight: 600,
        waterNormals: new THREE.TextureLoader().load(
            'https://threejs.org/examples/textures/waternormals.jpg',
            function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }
        ),
        sunDirection: dirLight.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    }
);

water.rotation.x = -Math.PI / 2;
water.position.y = 0.1;
scene.add(water);

// === LOAD KAPAL .GLB ===
const loader = new GLTFLoader();
loader.load('/boat.glb', (gltf) => {
    boat = gltf.scene;

    // Center dan scale
    const box = new THREE.Box3().setFromObject(boat);
    const center = new THREE.Vector3();
    box.getCenter(center);
    boat.position.sub(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 5 / maxDim;
    boat.scale.setScalar(scaleFactor);

    // POSISI AWAL KAPAL SEJAJAR DENGAN DERMAGA
    // Dermaga berada di x=1, memanjang di sumbu z.
    boat.position.set(-5.7, 0, 0); // Posisikan di sebelah dermaga
    boat.rotation.y = -Math.PI / 2; // Putar 90 derajat agar sejajar sumbu z

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
    dockGroup = new THREE.Group(); // <-- pakai variabel global

    const woodMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,
        roughness: 0.8,
        metalness: 0.2
    });

    // Platform utama dermaga
    const platformGeometry = new THREE.BoxGeometry(4, 0.4, 15);
    const platform = new THREE.Mesh(platformGeometry, woodMaterial);
    platform.position.set(1, 1.3, 0);
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

        step.position.set(
            platform.position.x - (platform.geometry.parameters.width / 2) - (stepDepth / 2) - (i * stepDepth),
            platform.position.y - (platform.geometry.parameters.height / 2) - (stepHeight / 2) - (i * (stepHeight + 0.1)),
            -0.7
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
        const zPos = -6.5 + (i * (13 / (numPillars - 1)));
        pillar.position.set(1, -0.8, zPos);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        dockGroup.add(pillar);
    }

    scene.add(dockGroup);
    console.log('✅ Dock created');
}

// === BUAT JUDUL SIMULASI ===
function createTitleUI() {
    const titleContainer = document.createElement('div');
    titleContainer.style.position = 'absolute';
    titleContainer.style.top = '20px';
    titleContainer.style.left = '50%';
    titleContainer.style.transform = 'translateX(-50%)';
    titleContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
    titleContainer.style.padding = '10px 20px';
    titleContainer.style.borderRadius = '8px';
    titleContainer.style.color = 'white';
    titleContainer.style.fontFamily = 'sans-serif';
    titleContainer.style.fontSize = '22px';
    titleContainer.style.fontWeight = 'bold';
    titleContainer.style.textAlign = 'center';
    titleContainer.style.whiteSpace = 'nowrap'; // Mencegah judul terpotong
    titleContainer.innerText = 'Hukum Archimedes: Gaya Apung Kapal';
    document.body.appendChild(titleContainer);
}

// === BUAT INFO KELOMPOK ===
function createGroupInfoUI() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0,0,0,0.7)';
    container.style.padding = '10px 15px';
    container.style.borderRadius = '5px';
    container.style.color = 'white';
    container.style.fontFamily = 'sans-serif';
    container.style.fontSize = '14px';
    container.style.textAlign = 'right';

    const title = document.createElement('h3');
    title.innerText = 'Tugas Pengganti ETS - GRAFKOM D';
    title.style.margin = '0 0 10px 0';
    title.style.borderBottom = '1px solid rgba(255,255,255,0.5)';
    title.style.paddingBottom = '5px';
    container.appendChild(title);

    const members = [
        { name: 'Felda Ega Fadhila', nrp: '5025231199' },
        { name: 'Naswan Nashir Ramadhan', nrp: '5025231246' },
    ];

    members.forEach(member => {
        container.innerHTML += `${member.name} - ${member.nrp}<br>`;
    });

    const controlInfo = document.createElement('div');
    controlInfo.style.marginTop = '15px';
    controlInfo.style.paddingTop = '10px';
    controlInfo.style.borderTop = '1px solid rgba(255,255,255,0.5)';
    controlInfo.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Kontrol Kapal:</div>
        <div style="font-size: 12px; line-height: 1.8;">
            <div><strong>W</strong> - Maju</div>
            <div><strong>S</strong> - Mundur</div>
            <div><strong>A</strong> - Belok Kiri</div>
            <div><strong>D</strong> - Belok Kanan</div>
        </div>
    `;
    container.appendChild(controlInfo);

    document.body.appendChild(container);
}

// === UI INTERAKTIF ===
const boatProperties = {
    density: 1.0,
    baseSink: -0.1
};

function createUI() {
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

    const label = document.createElement('label');
    label.setAttribute('for', 'density-slider');
    label.innerText = 'Massa Jenis Kapal: ';
    container.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'density-slider';
    slider.min = '0.5';
    slider.max = '1.5';
    slider.step = '0.01';
    slider.value = boatProperties.density;
    container.appendChild(slider);

    const infoDisplay = document.createElement('p');
    infoDisplay.style.marginTop = '10px';
    infoDisplay.style.marginBottom = '0px';
    infoDisplay.style.fontSize = '12px';
    container.appendChild(infoDisplay);

    function updateInfoText() {
        const g = 9.8;
        const rho_water = 1000;
        const base_mass_at_1_density = 100000;

        const boat_rho = boatProperties.density * 1000;
        const boat_mass = base_mass_at_1_density * boatProperties.density;
        const submerged_volume = boat_mass / rho_water;
        const buoyant_force = boat_mass * g;

        const densityText = `ρ (Massa Jenis): ${boat_rho.toFixed(0)} kg/m³`;
        const sinkText = `Kedalaman Dasar: ${boatProperties.baseSink.toFixed(2)} m`;
        const volumeText = `V (Volume Tercelup): ${submerged_volume.toFixed(1)} m³`;
        const forceText = `FA (Gaya Apung): ${(buoyant_force / 1000).toFixed(1)} kN`;
        infoDisplay.innerText = `${densityText}\n${sinkText}\n${volumeText}\n${forceText}`;
    }

    slider.addEventListener('input', (event) => {
        boatProperties.density = parseFloat(event.target.value);
        boatProperties.baseSink = -0.1 * boatProperties.density;
        updateInfoText();
    });

    document.body.appendChild(container);
    updateInfoText();
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
    composer.setSize(window.innerWidth, window.innerHeight);
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
        // Ombak
        boat.position.y = boatProperties.baseSink + Math.sin(time * 1.5) * 0.15;
        boat.rotation.z = Math.sin(time) * 0.05;
        const baseRotationX = Math.sin(time * 0.8) * 0.05;

        const moveSpeed = 5.0;
        const turnSpeed = 1.5;

        // Simpan posisi & rotasi sebelum gerak
        const prevPosition = boat.position.clone();
        const prevRotationY = boat.rotation.y;

        // Gerakan kapal
        boat.rotation.y += moveState.turn * turnSpeed * delta;
        boat.translateX(moveState.forward * moveSpeed * delta);

        // Rotasi ombak
        boat.rotation.x = baseRotationX;

        // === CEK KOLISI DENGAN DERMAGA ===
        if (dockGroup) {
            boat.updateWorldMatrix(true, true);
            dockGroup.updateWorldMatrix(true, true);

            const boatBox = new THREE.Box3().setFromObject(boat);
            const dockBox = new THREE.Box3().setFromObject(dockGroup);

            // Perkecil sedikit bounding box dermaga supaya tidak terlalu sensitif
            dockBox.expandByScalar(-0.001);

            if (boatBox.intersectsBox(dockBox)) {
                // Kena tabrak → kembalikan posisi & rotasi
                boat.position.copy(prevPosition);
                boat.rotation.y = prevRotationY;
            }
        }
    }

    controls.update();
    composer.render();
}

createDock();
createTitleUI();
createGroupInfoUI();
createUI();
animate();
