import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

import {CAMERA, CONTROLS} from './config.js';
import {themeColors} from './theme.js';

const ORBIT_MS = 700;

export function createViewer(container) {
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));

    const camera = new THREE.PerspectiveCamera(
        CAMERA.fov, container.clientWidth / container.clientHeight, CAMERA.near, CAMERA.far);
    camera.position.set(CAMERA.position.x, CAMERA.position.y, CAMERA.position.z);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const spherical = new THREE.Spherical();

    let orbit = null;

    function resize() {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;

        const aspect = width / height;
        camera.fov = aspect >= 1 ? CAMERA.fov : verticalFovFor(aspect);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }

    function pick(clientX, clientY, objects) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects(objects, false)[0]?.object ?? null;
    }

    function applyTheme() {
        scene.background = new THREE.Color(themeColors().sceneBg);
    }

    function orbitTo(position, duration = ORBIT_MS) {
        const from = sphericalOf(camera.position);
        const to = sphericalOf(position);
        to.theta = from.theta + shortestTurn(to.theta - from.theta);
        orbit = {from, to, duration, started: performance.now()};
    }

    function sphericalOf({x, y, z}) {
        const offset = new THREE.Vector3(x, y, z).sub(controls.target);
        return new THREE.Spherical().setFromVector3(offset);
    }

    function advanceOrbit() {
        if (!orbit) return;
        const progress = Math.min(1, (performance.now() - orbit.started) / orbit.duration);
        const eased = progress * progress * (3 - 2 * progress);
        spherical.set(
            mix(orbit.from.radius, orbit.to.radius, eased),
            mix(orbit.from.phi, orbit.to.phi, eased),
            mix(orbit.from.theta, orbit.to.theta, eased));
        camera.position.setFromSpherical(spherical).add(controls.target);
        if (progress === 1) orbit = null;
    }

    function start(onFrame) {
        renderer.setAnimationLoop(() => {
            advanceOrbit();
            controls.update();
            onFrame?.();
            renderer.render(scene, camera);
        });
    }

    applyTheme();
    new ResizeObserver(resize).observe(container);
    controls.addEventListener('start', () => {
        orbit = null;
    });

    return {
        canvas: renderer.domElement,
        add: (object) => scene.add(object),
        pick,
        applyTheme,
        orbitTo,
        cameraPose: () => camera.position.clone(),
        start,
    };
}

function createControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.minDistance = CONTROLS.minDistance;
    controls.maxDistance = CONTROLS.maxDistance;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: null,
    };
    return controls;
}

function mix(from, to, k) {
    return from + (to - from) * k;
}

function shortestTurn(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function verticalFovFor(aspect) {
    const fov = THREE.MathUtils.degToRad(CAMERA.fov);
    return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(fov / 2) / aspect));
}
