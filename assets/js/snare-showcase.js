/**
 * Falcon Drums snare showcase.
 *
 * Loads the same StandardSnareGroup GLBs as 3dDrumEditor.html and animates
 * them without touching the customizer. Part colors use the editor's swatch
 * values (hex, metalness, roughness). Inserts and tension rods stay brushed
 * stainless, which is how the editor treats them.
 *
 * Model space: the drum axis is Z, the batter hoop is +Z, and the shell
 * stands on XY. A parent rotation turns +Z up. Exploded motion is a rigid
 * slide along Z, plus a radial push that keeps each lug on its own bolt circle.
 * Screws and inserts are one mesh each, but no triangle crosses Z = 0, so
 * they split cleanly into top and bottom hardware.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const DURATION = 32.6;
const ASSEMBLED_CUE = 2.1;
const EXPLODED_CUE = 8.9;

const AMP = {
    hoopTop: 4.9,
    hoopBottom: -3.05,
    screwTop: 2.2,
    screwBottom: -1.45,
    insertTop: 0.9,
    insertBottom: -0.9,
    insertRadial: 1.25,
    lugRadial: 3.35
};

const RAW_FINISHES = [
    {
        id: 'signature',
        label: 'Silver · Gold',
        detail: 'Silver shell, gold lugs and hoops',
        shell: ['#c0c0c0', 0.7, 0.4],
        lugs: ['#ffd700', 0.7, 0.4],
        hoopTop: ['#ffd700', 0.7, 0.4],
        hoopBottom: ['#ffd700', 0.7, 0.4]
    },
    {
        id: 'green',
        label: 'Metallic Green',
        detail: 'Metallic green shell, gold lugs, silver hoops',
        shell: ['#2ecc71', 0.8, 0.3],
        lugs: ['#ffd700', 0.7, 0.4],
        hoopTop: ['#c0c0c0', 0.7, 0.4],
        hoopBottom: ['#c0c0c0', 0.7, 0.4]
    },
    {
        id: 'wood',
        label: 'Natural Wood',
        detail: 'Natural wood shell, black lugs, gold hoops',
        shell: ['#8b6f47', 0, 0.5],
        lugs: ['#1a1a1a', 0, 0.5],
        hoopTop: ['#ffd700', 0.7, 0.4],
        hoopBottom: ['#ffd700', 0.7, 0.4]
    },
    {
        id: 'red',
        label: 'Red · Split Hoops',
        detail: 'Red shell, silver lugs, gold top hoop, black bottom hoop',
        shell: ['#c41e3a', 0, 0.5],
        lugs: ['#c0c0c0', 0.7, 0.4],
        hoopTop: ['#ffd700', 0.7, 0.4],
        hoopBottom: ['#1a1a1a', 0, 0.5]
    },
    {
        id: 'blue',
        label: 'Blue · Gold',
        detail: 'Blue shell, gold lugs, silver hoops',
        shell: ['#0051ba', 0, 0.5],
        lugs: ['#ffd700', 0.7, 0.4],
        hoopTop: ['#c0c0c0', 0.7, 0.4],
        hoopBottom: ['#c0c0c0', 0.7, 0.4]
    }
];

const COLOR_KEYS = [
    { t: 0, i: 0 },
    { t: 16.1, i: 0 },
    { t: 17.7, i: 1 },
    { t: 19.3, i: 1 },
    { t: 20.9, i: 2 },
    { t: 22.5, i: 2 },
    { t: 24.1, i: 3 },
    { t: 25.7, i: 3 },
    { t: 27.3, i: 4 },
    { t: 28.9, i: 4 },
    { t: 30.5, i: 0 },
    { t: DURATION, i: 0 }
];

const CAM = {
    az: [
        { t: 0, v: 0.58 },
        { t: 3.5, v: 0.74 },
        { t: 7.65, v: 1.02 },
        { t: 10.35, v: 1.12 },
        { t: 14.45, v: 0.7 },
        { t: 16.1, v: 0.62 },
        { t: 28.9, v: 1.02 },
        { t: DURATION, v: 0.58 }
    ],
    phi: [
        { t: 0, v: 0.16 },
        { t: 3.5, v: 0.2 },
        { t: 7.65, v: 0.34 },
        { t: 10.35, v: 0.36 },
        { t: 14.45, v: 0.18 },
        { t: DURATION, v: 0.16 }
    ],
    dolly: [
        { t: 0, v: 1.08 },
        { t: 3.5, v: 1.0 },
        { t: 7.65, v: 1.05 },
        { t: 10.35, v: 1.07 },
        { t: 14.45, v: 1.0 },
        { t: DURATION, v: 1.08 }
    ],
    look: [
        { t: 0, v: 0 },
        { t: 3.5, v: 0 },
        { t: 7.65, v: 0.32 },
        { t: 10.35, v: 0.34 },
        { t: 14.45, v: 0 },
        { t: DURATION, v: 0 }
    ]
};

const PART_FILES = [
    ['shell', './3dObjects/StandardSnareGroup/Shell14x55.glb'],
    ['lugs', './3dObjects/StandardSnareGroup/LugsStandardGroup.glb'],
    ['hoopTop', './3dObjects/StandardSnareGroup/HoopTop.glb'],
    ['hoopBottom', './3dObjects/StandardSnareGroup/HoopBottom.glb'],
    ['inserts', './3dObjects/StandardSnareGroup/InsertGroup.glb'],
    ['screws', './3dObjects/StandardSnareGroup/ScrewsGroup.glb']
];

const params = new URLSearchParams(location.search);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('stage');
const loadStatus = document.getElementById('load-status');
const loadingEl = document.getElementById('loading');
const phaseEl = document.getElementById('phase');
const detailEl = document.getElementById('detail');
const finishRow = document.getElementById('finishes');
const playBtn = document.getElementById('play');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const replayBtn = document.getElementById('replay');
const assembleBtn = document.getElementById('assemble');
const explodeBtn = document.getElementById('explode');
const scrub = document.getElementById('scrub');
const clockEl = document.getElementById('clock');
const loopInput = document.getElementById('loop');
const presentBtn = document.getElementById('present');
const exportBtn = document.getElementById('export');
const presentHint = document.getElementById('present-hint');
const exportOverlay = document.getElementById('export-overlay');
const exportLabel = document.getElementById('export-label');

scrub.max = String(DURATION);

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.LinearToneMapping;
renderer.toneMappingExposure = 1.45;

const scene = new THREE.Scene();
scene.background = studioBackground();

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(4, 3, 10);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 26;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.48;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = buildStudioEnv();
pmrem.dispose();

const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
mainLight.position.set(8, 16, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 50;
mainLight.shadow.camera.left = -8;
mainLight.shadow.camera.right = 8;
mainLight.shadow.camera.top = 8;
mainLight.shadow.camera.bottom = -8;
mainLight.shadow.bias = -0.0008;
mainLight.shadow.normalBias = 0.03;
scene.add(mainLight);
scene.add(mainLight.target);

scene.add(new THREE.AmbientLight(0xffffff, 0.22));

const fill = new THREE.DirectionalLight(0xffffff, 0.55);
fill.position.set(-10, 5, 10);
scene.add(fill);

const rim = new THREE.PointLight(0xffffff, 2.0);
rim.position.set(0, 6, -15);
scene.add(rim);

const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.28);
hemi.position.set(0, 20, 0);
scene.add(hemi);

const spec1 = new THREE.PointLight(0xffffff, 4.0);
spec1.position.set(5, 15, 8);
scene.add(spec1);
const spec2 = new THREE.PointLight(0xffffff, 3.0);
spec2.position.set(-8, 12, -5);
scene.add(spec2);

const metalSpot = new THREE.SpotLight(0xffffff, 6.0, 80, Math.PI / 10, 0.05);
metalSpot.position.set(2, 18, 6);
scene.add(metalSpot);

const floorDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1, 72),
    new THREE.MeshBasicMaterial({
        map: contactShadowTexture(),
        transparent: true,
        depthWrite: false
    })
);
floorDisc.rotation.x = -Math.PI / 2;
floorDisc.position.y = 0;
floorDisc.renderOrder = -1;
scene.add(floorDisc);

const rig = new THREE.Group();
const drum = new THREE.Group();
rig.add(drum);
scene.add(rig);

const finishes = RAW_FINISHES.map(hydrate);
const printTexture = createPrintTexture();
const movers = [];
const paintTargets = { shell: [], lugs: [], hoopTop: [], hoopBottom: [] };

let frontA = Math.PI / 2;
let focusY = 1.6;
let assembledBottom = 0.8;
let bottomEnv = null;
let lugEnv = null;
let frame = { scale: 1, halfHeight: 1.8, radius: 4 };
let time = 0;
let playing = false;
let cameraDriven = true;
let pinned = null;
let seek = null;
let exporting = false;
let scrubbing = false;
let ready = false;

const api = {
    ready: false,
    duration: DURATION,
    getTime: () => time,
    setTime: (t) => {
        cancelSeek();
        time = THREE.MathUtils.clamp(t, 0, DURATION);
        cameraDriven = true;
        applyFrame();
    },
    play: () => { playing = true; syncTransport(); },
    pause: () => { playing = false; syncTransport(); },
    exportMp4: () => exportMp4()
};
window.falconShowcase = api;

bindUi();
fit();
window.addEventListener('resize', fit);
loadDrum().catch((err) => {
    console.error(err);
    loadStatus.textContent = 'Could not load the snare model.';
});

function bindUi() {
    finishes.forEach((finish, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip';
        button.dataset.id = finish.id;
        button.title = finish.detail;
        const raw = RAW_FINISHES[index];
        const hoopBg = raw.hoopTop[0] === raw.hoopBottom[0]
            ? raw.hoopTop[0]
            : `linear-gradient(90deg, ${raw.hoopTop[0]} 50%, ${raw.hoopBottom[0]} 50%)`;
        button.innerHTML =
            `<span class="dots" aria-hidden="true">` +
            `<i style="background:${raw.shell[0]}"></i>` +
            `<i style="background:${raw.lugs[0]}"></i>` +
            `<i style="background:${hoopBg}"></i>` +
            `</span>${finish.label}`;
        button.addEventListener('click', () => {
            pinned = pinned === index ? null : index;
            playing = false;
            cancelSeek();
            syncTransport();
            applyFrame();
        });
        finishRow.appendChild(button);
    });

    playBtn.addEventListener('click', () => {
        if (time >= DURATION - 0.05 && !playing) time = 0;
        playing = !playing;
        cancelSeek();
        syncTransport();
    });
    replayBtn.addEventListener('click', () => {
        pinned = null;
        time = 0;
        playing = true;
        cameraDriven = true;
        cancelSeek();
        syncTransport();
    });
    assembleBtn.addEventListener('click', () => easeTo(ASSEMBLED_CUE));
    explodeBtn.addEventListener('click', () => easeTo(EXPLODED_CUE));
    presentBtn.addEventListener('click', () => setPresent(!document.body.classList.contains('is-present')));
    exportBtn.addEventListener('click', () => {
        exportMp4().catch((err) => {
            console.error(err);
            exportLabel.textContent = 'Export failed. See the console.';
            setTimeout(() => { exportOverlay.hidden = true; }, 1800);
        });
    });

    scrub.addEventListener('pointerdown', () => {
        scrubbing = true;
        playing = false;
        cancelSeek();
        cameraDriven = true;
    });
    scrub.addEventListener('input', () => {
        time = parseFloat(scrub.value);
        applyFrame();
    });
    scrub.addEventListener('pointerup', () => { scrubbing = false; });
    scrub.addEventListener('change', () => { scrubbing = false; });

    controls.addEventListener('start', () => { cameraDriven = false; });

    document.addEventListener('keydown', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === 'range' && event.code !== 'Space') return;
        if (event.code === 'Space') {
            event.preventDefault();
            playBtn.click();
        } else if (event.key === 'r' || event.key === 'R') {
            replayBtn.click();
        } else if (event.key === 'f' || event.key === 'F') {
            setPresent(!document.body.classList.contains('is-present'));
        } else if (event.key === 'e' || event.key === 'E') {
            explodeBtn.click();
        } else if (event.key === 'a' || event.key === 'A') {
            assembleBtn.click();
        } else if (event.key === 'Escape') {
            setPresent(false);
        }
    });

    if (params.get('present') === '1') setPresent(true);
}

function setPresent(on) {
    document.body.classList.toggle('is-present', on);
    presentBtn.classList.toggle('is-on', on);
    if (on) {
        presentHint.classList.add('is-on');
        setTimeout(() => presentHint.classList.remove('is-on'), 2200);
    }
}

function easeTo(target) {
    playing = false;
    cameraDriven = true;
    const from = time;
    const dur = THREE.MathUtils.clamp(Math.abs(target - from) / 8, 0.7, 1.35);
    seek = { from, to: target, start: performance.now(), dur };
    syncTransport();
}

function cancelSeek() { seek = null; }

async function loadDrum() {
    const loader = new GLTFLoader();
    const loaded = new Map();
    let shown = 0;
    const weights = PART_FILES.map(([name]) => (name === 'screws' ? 16 : 1));
    const weightTotal = weights.reduce((a, b) => a + b, 0);
    const progress = new Array(PART_FILES.length).fill(0);

    await Promise.all(PART_FILES.map(([name, url], index) => new Promise((resolve, reject) => {
        loader.load(url, (gltf) => {
            loaded.set(name, gltf);
            progress[index] = 1;
            resolve();
        }, (event) => {
            if (event.lengthComputable && event.total > 0) {
                progress[index] = event.loaded / event.total;
                const pct = progress.reduce((sum, value, i) => sum + value * weights[i], 0) / weightTotal;
                const next = Math.round(pct * 100);
                if (next !== shown) {
                    shown = next;
                    loadStatus.textContent = `Loading the snare… ${next}%`;
                }
            }
        }, reject);
    })));

    loadStatus.textContent = 'Preparing hardware…';
    await new Promise((resolve) => setTimeout(resolve, 40));

    const shellMesh = styledMesh(loaded.get('shell'), 'shell', false);
    const lugMesh = styledMesh(loaded.get('lugs'), 'lugs', false);
    const hoopTopMesh = styledMesh(loaded.get('hoopTop'), 'hoopTop', false);
    const hoopBottomMesh = styledMesh(loaded.get('hoopBottom'), 'hoopBottom', false);
    const insertSource = firstMesh(loaded.get('inserts').scene);
    const screwSource = firstMesh(loaded.get('screws').scene);
    const [insertTop, insertBottom] = splitByEquator(insertSource, 'inserts');
    const [screwTop, screwBottom] = splitByEquator(screwSource, 'screws');
    for (const mesh of [insertTop, insertBottom, screwTop, screwBottom]) styleStainless(mesh);

    paintTargets.shell.push(shellMesh);
    paintTargets.lugs.push(lugMesh);
    paintTargets.hoopTop.push(hoopTopMesh);
    paintTargets.hoopBottom.push(hoopBottomMesh);

    drum.add(shellMesh, lugMesh, hoopTopMesh, hoopBottomMesh, insertTop, insertBottom, screwTop, screwBottom);
    frontA = shellFrontAngle(shellMesh.geometry);

    const box = new THREE.Box3().setFromObject(drum);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    drum.position.sub(center);
    const scale = 8.6 / Math.max(size.x, size.y, size.z);
    rig.scale.setScalar(scale);
    rig.rotation.x = -Math.PI / 2;
    rig.updateMatrixWorld(true);
    const worldBox = new THREE.Box3().setFromObject(rig);
    const drop = Math.abs(AMP.hoopBottom) * scale;
    assembledBottom = 0.1 + drop;
    rig.position.y += assembledBottom - worldBox.min.y;
    rig.updateMatrixWorld(true);
    const placed = new THREE.Box3().setFromObject(rig);
    focusY = (placed.min.y + placed.max.y) / 2;
    frame = {
        scale,
        halfHeight: (placed.max.y - placed.min.y) / 2,
        radius: Math.max(placed.max.x, -placed.min.x, placed.max.z, -placed.min.z)
    };
    const foot = frame.radius;
    floorDisc.scale.setScalar(foot * 1.7);
    mainLight.target.position.set(0, focusY, 0);
    metalSpot.target.position.set(0, focusY, 0);
    scene.add(metalSpot.target);

    rememberRadial(lugMesh);
    rememberRadial(insertTop);
    rememberRadial(insertBottom);

    const hoopEnv = envelope(3.5, 5.25, 12.65, 14.45);
    const hoopBotEnv = envelope(3.62, 5.37, 12.78, 14.45);
    const screwEnv = envelope(4.6, 6.45, 11.45, 13.2);
    const screwBotEnv = envelope(4.74, 6.58, 11.58, 13.32);
    lugEnv = envelope(5.95, 7.65, 10.35, 12.05);
    const insertBotEnv = envelope(6.08, 7.75, 10.48, 12.15);
    bottomEnv = hoopBotEnv;
    addMover(hoopTopMesh, AMP.hoopTop, hoopEnv, 'z');
    addMover(hoopBottomMesh, AMP.hoopBottom, hoopBotEnv, 'z');
    addMover(screwTop, AMP.screwTop, screwEnv, 'z');
    addMover(screwBottom, AMP.screwBottom, screwBotEnv, 'z');
    addMover(insertTop, AMP.insertTop, lugEnv, 'z');
    addMover(insertTop, AMP.insertRadial, lugEnv, 'radial');
    addMover(insertBottom, AMP.insertBottom, insertBotEnv, 'z');
    addMover(insertBottom, AMP.insertRadial, insertBotEnv, 'radial');
    addMover(lugMesh, AMP.lugRadial, lugEnv, 'radial');

    console.info('Snare showcase ready', {
        scale: Number(scale.toFixed(4)),
        frontDeg: Number((frontA * 180 / Math.PI).toFixed(1)),
        focusY: Number(focusY.toFixed(3)),
        triangles: {
            shell: shellMesh.geometry.index.count / 3,
            lugs: lugMesh.geometry.index.count / 3,
            screwsTop: screwTop.geometry.index.count / 3,
            screwsBottom: screwBottom.geometry.index.count / 3
        }
    });

    ready = true;
    api.ready = true;
    loadingEl.hidden = true;
    canvas.classList.add('is-ready');
    const start = params.has('t') ? parseFloat(params.get('t')) : (reduceMotion ? ASSEMBLED_CUE : 0);
    time = Number.isFinite(start) ? start : 0;
    playing = !reduceMotion && params.get('paused') !== '1';
    applyFrame();
    syncTransport();
    requestAnimationFrame(tick);
}

function tick(now) {
    requestAnimationFrame(tick);
    if (!ready || exporting) {
        controls.update();
        return;
    }
    if (seek) {
        const u = smootherstep((now - seek.start) / (seek.dur * 1000));
        time = seek.from + (seek.to - seek.from) * u;
        if (u >= 1) {
            time = seek.to;
            seek = null;
            syncTransport();
        }
    } else if (playing && !document.hidden) {
        const dt = Math.min(0.05, tick.dt(now));
        time += dt;
        if (time >= DURATION) {
            if (loopInput.checked) time = 0;
            else {
                time = DURATION;
                playing = false;
                syncTransport();
            }
        }
    } else {
        tick.dt(now);
    }
    applyFrame();
    if (cameraDriven) controls.update();
    else controls.update();
    renderer.render(scene, camera);
}
tick.dt = (function () {
    let last = performance.now();
    return (now) => {
        const dt = (now - last) / 1000;
        last = now;
        return dt;
    };
}());

function applyFrame() {
    for (const mover of movers) {
        const amount = sample(mover.keys, time) * mover.amplitude;
        if (mover.mode === 'z') mover.mesh.position.z = amount;
        else setRadial(mover.mesh, amount);
    }

    const finish = currentFinish(time);
    paint(paintTargets.shell, finish.shell);
    paint(paintTargets.lugs, finish.lugs);
    paint(paintTargets.hoopTop, finish.hoopTop);
    paint(paintTargets.hoopBottom, finish.hoopBottom);

    if (bottomEnv) {
        floorDisc.position.y = assembledBottom - Math.abs(AMP.hoopBottom) * frame.scale * sample(bottomEnv, time) - 0.04;
    }

    if (cameraDriven) {
        const open = Math.max(sample(movers[0].keys, time), lugEnv ? sample(lugEnv, time) : 0);
        const dist = viewDistance(open) * sample(CAM.dolly, time);
        const vFov = THREE.MathUtils.degToRad(camera.fov);
        const visibleH = 2 * dist * Math.tan(vFov / 2);
        const uiShift = document.body.classList.contains('is-present') ? 0 : visibleH * 0.07;
        placeCamera(
            sample(CAM.az, time),
            sample(CAM.phi, time),
            dist,
            focusY + sample(CAM.look, time) - uiShift
        );
    }

    const phase = phaseAt(time);
    if (phaseEl.textContent !== phase) phaseEl.textContent = phase;
    if (detailEl.textContent !== finish.detail) detailEl.textContent = finish.detail;
    if (!scrubbing) scrub.value = String(time);
    clockEl.textContent = `${fmt(time)} / ${fmt(DURATION)}`;

    const opened = Math.abs(movers[0].mesh.position.z) / Math.abs(AMP.hoopTop);
    assembleBtn.classList.toggle('is-on', opened < 0.12 && !seek);
    explodeBtn.classList.toggle('is-on', opened > 0.9 && !seek);
    const activeId = pinned == null ? finish.id : finishes[pinned].id;
    for (const chip of finishRow.children) chip.classList.toggle('is-on', chip.dataset.id === activeId);
}

function viewDistance(open) {
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(camera.aspect, 0.35));
    const extraY = (AMP.hoopTop + Math.abs(AMP.hoopBottom)) * frame.scale * open;
    const extraR = AMP.lugRadial * frame.scale * open;
    const halfH = frame.halfHeight + extraY / 2;
    const radius = frame.radius + extraR;
    const distH = (halfH * 1.22) / Math.tan(vFov / 2);
    const distW = (radius * 1.24) / Math.tan(hFov / 2);
    return Math.max(distH, distW);
}

function placeCamera(az, phi, radius, lookY) {
    const fx = Math.cos(frontA);
    const fz = -Math.sin(frontA);
    const cos = Math.cos(az);
    const sin = Math.sin(az);
    const dx = fx * cos - fz * sin;
    const dz = fx * sin + fz * cos;
    const horiz = Math.cos(phi) * radius;
    camera.position.set(dx * horiz, lookY + Math.sin(phi) * radius, dz * horiz);
    controls.target.set(0, lookY, 0);
}

function syncTransport() {
    const showPause = playing;
    iconPause.hidden = !showPause;
    iconPlay.hidden = showPause;
    playBtn.setAttribute('aria-label', showPause ? 'Pause' : 'Play');
}

function currentFinish(t) {
    if (pinned != null) return finishes[pinned];
    if (t <= COLOR_KEYS[0].t) return finishes[COLOR_KEYS[0].i];
    let index = 1;
    while (index < COLOR_KEYS.length && COLOR_KEYS[index].t < t) index++;
    if (index >= COLOR_KEYS.length) return finishes[COLOR_KEYS[COLOR_KEYS.length - 1].i];
    const a = COLOR_KEYS[index - 1];
    const b = COLOR_KEYS[index];
    const u = smootherstep((t - a.t) / (b.t - a.t));
    if (a.i === b.i || u <= 0) return finishes[a.i];
    if (u >= 1) return finishes[b.i];
    const A = finishes[a.i];
    const B = finishes[b.i];
    return {
        id: u < 0.5 ? A.id : B.id,
        label: u < 0.5 ? A.label : B.label,
        detail: u < 0.5 ? A.detail : B.detail,
        shell: mixPart(A.shell, B.shell, u),
        lugs: mixPart(A.lugs, B.lugs, u),
        hoopTop: mixPart(A.hoopTop, B.hoopTop, u),
        hoopBottom: mixPart(A.hoopBottom, B.hoopBottom, u)
    };
}

function phaseAt(t) {
    if (t < 3.5) return 'Assembled';
    if (t < 7.65) return 'Separating';
    if (t < 10.35) return 'Exploded view';
    if (t < 14.45) return 'Reassembling';
    if (t < 16.1 || t >= 30.5) return 'Assembled';
    return 'Finishes';
}

function paint(meshes, part) {
    const clearcoat = part.metalness > 0.5 ? 0.3 : 0.8;
    for (const mesh of meshes) {
        mesh.material.color.copy(part.color);
        mesh.material.metalness = part.metalness;
        mesh.material.roughness = part.roughness;
        mesh.material.clearcoat = clearcoat;
    }
}

function addMover(mesh, amplitude, keys, mode) {
    movers.push({ mesh, amplitude, keys, mode });
}

function envelope(outStart, outEnd, backStart, backEnd) {
    return [
        { t: 0, v: 0 },
        { t: outStart, v: 0 },
        { t: outEnd, v: 1 },
        { t: backStart, v: 1 },
        { t: backEnd, v: 0 },
        { t: DURATION, v: 0 }
    ];
}

function sample(keys, t) {
    if (t <= keys[0].t) return keys[0].v;
    if (t >= keys[keys.length - 1].t) return keys[keys.length - 1].v;
    let index = 1;
    while (keys[index].t < t) index++;
    const a = keys[index - 1];
    const b = keys[index];
    const u = smootherstep((t - a.t) / (b.t - a.t));
    return a.v + (b.v - a.v) * u;
}

function smootherstep(t) {
    const x = THREE.MathUtils.clamp(t, 0, 1);
    return x * x * x * (x * (x * 6 - 15) + 10);
}

function setRadial(mesh, amount) {
    const previous = mesh.userData.radial;
    if (previous != null && Math.abs(previous - amount) < 1e-4) return;
    mesh.userData.radial = amount;
    const pos = mesh.geometry.attributes.position;
    const base = mesh.geometry.userData.basePosition;
    if (amount === 0) {
        for (let i = 0; i < pos.count; i++) pos.setXYZ(i, base[i * 3], base[i * 3 + 1], base[i * 3 + 2]);
    } else {
        for (let i = 0; i < pos.count; i++) {
            const x = base[i * 3];
            const y = base[i * 3 + 1];
            const len = Math.hypot(x, y) || 1;
            const push = amount / len;
            pos.setXYZ(i, x + x * push, y + y * push, base[i * 3 + 2]);
        }
    }
    pos.needsUpdate = true;
}

function rememberRadial(mesh) {
    const pos = mesh.geometry.attributes.position;
    const base = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
        base[i * 3] = pos.getX(i);
        base[i * 3 + 1] = pos.getY(i);
        base[i * 3 + 2] = pos.getZ(i);
    }
    mesh.geometry.userData.basePosition = base;
    mesh.userData.radial = 0;
}

function styledMesh(gltf, slot, stainless) {
    const mesh = firstMesh(gltf.scene);
    const material = new THREE.MeshPhysicalMaterial({
        color: mesh.material.color || new THREE.Color(0xcccccc),
        metalness: 0.7,
        roughness: 0.4,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.55,
        bumpMap: printTexture,
        bumpScale: 0.02
    });
    const next = new THREE.Mesh(mesh.geometry, material);
    next.name = slot;
    next.castShadow = true;
    next.receiveShadow = true;
    next.frustumCulled = false;
    if (stainless) styleStainless(next);
    return next;
}

function styleStainless(mesh) {
    mesh.material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xcccccc),
        metalness: 1,
        roughness: 0.22,
        clearcoat: 0.2,
        clearcoatRoughness: 0.3,
        envMapIntensity: 2.5
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.material.emissive = new THREE.Color(0x000000);
}

function splitByEquator(sourceMesh, name) {
    const geometry = sourceMesh.geometry;
    const position = geometry.attributes.position;
    const index = geometry.index;
    const top = new Uint32Array(index.count);
    const bottom = new Uint32Array(index.count);
    let topCount = 0;
    let bottomCount = 0;
    for (let tri = 0; tri < index.count; tri += 3) {
        const a = index.getX(tri);
        const b = index.getX(tri + 1);
        const c = index.getX(tri + 2);
        const z = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;
        if (z >= 0) {
            top[topCount++] = a;
            top[topCount++] = b;
            top[topCount++] = c;
        } else {
            bottom[bottomCount++] = a;
            bottom[bottomCount++] = b;
            bottom[bottomCount++] = c;
        }
    }
    const topMesh = new THREE.Mesh(subsetGeometry(geometry, top.subarray(0, topCount)), sourceMesh.material);
    const bottomMesh = new THREE.Mesh(subsetGeometry(geometry, bottom.subarray(0, bottomCount)), sourceMesh.material);
    topMesh.name = name + 'Top';
    bottomMesh.name = name + 'Bottom';
    geometry.dispose();
    return [topMesh, bottomMesh];
}

function subsetGeometry(geometry, oldIndices) {
    const remap = new Int32Array(geometry.attributes.position.count);
    remap.fill(-1);
    const newIndex = new Uint32Array(oldIndices.length);
    let cursor = 0;
    for (let i = 0; i < oldIndices.length; i++) {
        const old = oldIndices[i];
        let neu = remap[old];
        if (neu === -1) {
            neu = cursor++;
            remap[old] = neu;
        }
        newIndex[i] = neu;
    }
    const order = new Uint32Array(cursor);
    for (let old = 0; old < remap.length; old++) {
        if (remap[old] !== -1) order[remap[old]] = old;
    }
    const next = new THREE.BufferGeometry();
    for (const name in geometry.attributes) {
        next.setAttribute(name, copyAttribute(geometry.attributes[name], order));
    }
    next.setIndex(new THREE.BufferAttribute(newIndex, 1));
    return next;
}

function copyAttribute(attr, order) {
    const itemSize = attr.itemSize;
    const dst = new Float32Array(order.length * itemSize);
    const packed = attr.isBufferAttribute && attr.array instanceof Float32Array && !attr.normalized && !attr.isInterleavedBufferAttribute;
    if (packed) {
        const src = attr.array;
        for (let i = 0; i < order.length; i++) {
            const from = order[i] * itemSize;
            const to = i * itemSize;
            for (let k = 0; k < itemSize; k++) dst[to + k] = src[from + k];
        }
    } else {
        for (let i = 0; i < order.length; i++) {
            for (let k = 0; k < itemSize; k++) dst[i * itemSize + k] = attr.getComponent(order[i], k);
        }
    }
    return new THREE.BufferAttribute(dst, itemSize, attr.normalized);
}

function shellFrontAngle(geometry) {
    const position = geometry.attributes.position;
    const buckets = new Float32Array(72);
    for (let i = 0; i < position.count; i++) {
        let angle = Math.atan2(position.getY(i), position.getX(i));
        if (angle < 0) angle += Math.PI * 2;
        buckets[Math.min(71, Math.floor(angle / (Math.PI * 2) * 72))]++;
    }
    let best = 0;
    for (let i = 1; i < buckets.length; i++) if (buckets[i] > buckets[best]) best = i;
    return (best + 0.5) / 72 * Math.PI * 2;
}

function firstMesh(root) {
    let found = null;
    root.traverse((obj) => {
        if (!found && obj.isMesh) found = obj;
    });
    if (!found) throw new Error('GLB has no mesh');
    return found;
}

function hydrate(raw) {
    const part = ([hex, metalness, roughness]) => ({
        color: new THREE.Color(hex),
        metalness,
        roughness
    });
    return {
        id: raw.id,
        label: raw.label,
        detail: raw.detail,
        shell: part(raw.shell),
        lugs: part(raw.lugs),
        hoopTop: part(raw.hoopTop),
        hoopBottom: part(raw.hoopBottom)
    };
}

function mixPart(a, b, u) {
    return {
        color: a.color.clone().lerp(b.color, u),
        metalness: a.metalness + (b.metalness - a.metalness) * u,
        roughness: a.roughness + (b.roughness - a.roughness) * u
    };
}

function createPrintTexture() {
    const size = 512;
    const paint = document.createElement('canvas');
    paint.width = size;
    paint.height = size;
    const ctx = paint.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    const lines = 400;
    const step = size / lines;
    for (let i = 0; i < lines; i++) {
        const val = i % 2 === 0 ? 180 : 80;
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(0, i * step, size, step);
    }
    const texture = new THREE.CanvasTexture(paint);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function studioBackground() {
    const paint = document.createElement('canvas');
    paint.width = 1024;
    paint.height = 1024;
    const ctx = paint.getContext('2d');
    const grd = ctx.createRadialGradient(512, 430, 60, 512, 560, 740);
    grd.addColorStop(0, '#3e3d3c');
    grd.addColorStop(0.42, '#232326');
    grd.addColorStop(1, '#0c0c0e');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1024, 1024);
    const texture = new THREE.CanvasTexture(paint);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function contactShadowTexture() {
    const paint = document.createElement('canvas');
    paint.width = 512;
    paint.height = 512;
    const ctx = paint.getContext('2d');
    const grd = ctx.createRadialGradient(256, 256, 30, 256, 256, 250);
    grd.addColorStop(0, 'rgba(0,0,0,0.62)');
    grd.addColorStop(0.45, 'rgba(0,0,0,0.28)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(paint);
    return texture;
}

function buildStudioEnv() {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x2a2a2a);
    const lights = [
        [0xffffff, 25, 0, 10, 2],
        [0xffffff, 18, -8, 4, 4],
        [0xffffff, 14, 8, 4, 4],
        [0xffffff, 12, 0, 3, -10],
        [0x8899aa, 8, 0, -8, 0],
        [0xffffff, 10, 0, 0, 10]
    ];
    for (const [color, intensity, x, y, z] of lights) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(x, y, z);
        envScene.add(light);
    }
    return pmrem.fromScene(envScene, 0.0).texture;
}

function fit() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const ratio = Math.min(window.devicePixelRatio || 1, width < 800 ? 1.5 : 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    if (ready) applyFrame();
}

function fmt(t) {
    const whole = Math.max(0, Math.round(t));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

async function exportMp4() {
    if (!ready || exporting) return null;
    if (typeof VideoEncoder === 'undefined') {
        throw new Error('This browser cannot encode MP4.');
    }
    exporting = true;
    playing = false;
    cancelSeek();
    cameraDriven = true;
    exportOverlay.hidden = false;
    const { Muxer, ArrayBufferTarget } = await import('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.mjs');

    const width = 1920;
    const height = 1080;
    const fps = 30;
    const previous = {
        time,
        aspect: camera.aspect,
        pixelRatio: renderer.getPixelRatio(),
        size: new THREE.Vector2()
    };
    renderer.getSize(previous.size);

    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
        target,
        video: { codec: 'avc', width, height },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset'
    });
    const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (err) => console.error(err)
    });
    const codec = 'avc1.640028';
    const support = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate: 14_000_000,
        framerate: fps
    });
    encoder.configure({
        codec: support.supported ? codec : 'avc1.42001f',
        width,
        height,
        bitrate: 14_000_000,
        framerate: fps,
        avc: { format: 'avc' },
        latencyMode: 'quality'
    });

    const frames = Math.round(DURATION * fps);
    try {
        for (let i = 0; i < frames; i++) {
            time = i / fps;
            applyFrame();
            controls.update();
            renderer.render(scene, camera);
            const frame = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / fps) });
            encoder.encode(frame, { keyFrame: i % 30 === 0 });
            frame.close();
            if (encoder.encodeQueueSize > 6) {
                await new Promise((resolve) => setTimeout(resolve, 12));
            }
            if (i % 10 === 0) {
                exportLabel.textContent = `Rendering ${i + 1} / ${frames}`;
                window.__export = { frame: i + 1, frames };
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
        }
        await encoder.flush();
        muxer.finalize();
        const blob = new Blob([target.buffer], { type: 'video/mp4' });
        downloadBlob(blob, 'falcon-snare-showcase.mp4');
        exportOverlay.hidden = true;
        window.__export = { frame: frames, frames, done: true, bytes: blob.size };
        return new Uint8Array(target.buffer);
    } finally {
        encoder.close();
        camera.aspect = previous.aspect;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(previous.pixelRatio);
        renderer.setSize(previous.size.x, previous.size.y, false);
        exporting = false;
        applyFrame();
        syncTransport();
    }
}

function downloadBlob(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
}
