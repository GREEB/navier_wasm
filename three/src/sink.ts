import * as THREE from 'three';
import initFluid, { Fluid, FluidConfig } from '../../pkg/navier_wasm';
import { vertexShader, fragmentShader } from './shaders';
import { getDisplayDimensions } from './utils';

import { Pane } from 'tweakpane';



import './style.css'
let fluid: Fluid;
let geometry: any;
let renderer: THREE.WebGLRenderer;
let camera: THREE.Camera;
let scene: THREE.Scene;
let nw: number
let nh: number
let canvas: any
let densityData
let velocityData
let densityTexture: THREE.DataTexture
let velocityTexture: THREE.DataTexture
let pane: any

let rotation_speed = 0.01
let velmulti = 0.1
let df = 0.5
let dt = 0.5

let shaderopacity = 0.5
let shader_min = 0.1
let shader_max = 2
let shaderMaterial: any
let lineGeometry: any
let pointGeometry: any
let pointMaterial: any
let particleGeometry: any
let particles: {
    age: number;
    update(dt: number, velocity: THREE.Vector2): unknown; position: {
        x: number;
        set(arg0: number, arg1: number): unknown; y: number;
    };
}[]
let particlePositions: any
async function init() {
    
    await initFluid();
    pane = new Pane();
    canvas = document.getElementById("scene") as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const [simwidth, simheight] = getDisplayDimensions(canvas.width, canvas.height);
    const fluidConfig = FluidConfig.new(simwidth, simheight, df);
    fluid = Fluid.new(fluidConfig, dt);
    nw = simwidth
    nh = simheight
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    console.log(width, height);

    renderer.setSize(width, height);

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-canvas.width / 2, canvas.width / 2, canvas.height / 2, -canvas.height / 2, -1, 1);    // Shader material for displaying velocity and density


    densityData = new Float32Array(nw * nh * 4);
    velocityData = new Float32Array(nw * nh * 4);

    densityTexture = new THREE.DataTexture(densityData, nw, nh, THREE.RGBAFormat, THREE.FloatType);
    velocityTexture = new THREE.DataTexture(velocityData, nw, nh, THREE.RGBAFormat, THREE.FloatType);

    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            density: { value: densityTexture },
            velocity: { value: velocityTexture },
            opacity: { value: shaderopacity },
            MIN_SPEED: { value: shader_min },
            MAX_SPEED: { value: shader_max }
        },
        vertexShader,
        fragmentShader,
        transparent: true, // Enable transparency
    });

    // Create a plane geometry and set the shader material
    const geometry = new THREE.PlaneGeometry(canvas.width, canvas.height);
    const mesh = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(mesh);
    lineGeometry = createLineGeometry(nw, nh);
    const lineMaterial = createLineMaterial();
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    pointGeometry = createPointGeometry(nw, nh);
    pointMaterial = createPointMaterial();
    const pointMesh = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(pointMesh);
    function createLineGeometry(nw: number, nh: number) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(nw * nh * 6);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
    }

    function createLineMaterial() {
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        return material;
    }

    function createPointGeometry(nw: number, nh: number) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(nw * nh * 3);
        const colors = new Float32Array(nw * nh * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geometry;
    }

    function createPointMaterial() {
        const material = new THREE.PointsMaterial({ size: 2, vertexColors: true });
        return material;
    }

    // Add global variables for the particles


    // Particle class
    class Particle {
        position: THREE.Vector2;
        age: number;

        constructor(x: number, y: number) {
            this.position = new THREE.Vector2(x, y);
            this.age = Math.random() * 10;
        }

        update(dt: number, velocity: THREE.Vector2) {
            this.position.add(velocity.clone().multiplyScalar(dt));
            this.age += dt;
        }
    }
    const numParticles = 20000;
    particles = [];
    particleGeometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(numParticles * 3);
    // Initialize particles with random positions
    for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * (nw /2) + nw/4
        const y = Math.random() * (nh /2) + nh/4
        particles.push(new Particle(x, y));

    }

    // Set up particle geometry
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ size: 1, color: 0xffffff, opacity: 0.1 });
    const particleMesh = new THREE.Points(particleGeometry, particleMaterial);
    // scene.add(particleMesh);

    animate();
    initUi()

}
init();
function getRotatingInflowProperties(radius: number, angle: number, centerX: number, centerY: number) {
    const x = centerX;
    const y = centerY;
    const velocityX = radius * Math.cos(angle);
    const velocityY = radius * Math.sin(angle);
    return { x, y, velocityX, velocityY };
}
let angle = 0;
function animate() {
    requestAnimationFrame(animate);

    // Update the fluid simulation
    fluid.simulate();
    // Calculate the rotating inflow position
    const inflowProperties = getRotatingInflowProperties(50, angle, nw / 2, nh / 2);
    const inflowIndex = fluid.ix(inflowProperties.x, inflowProperties.y);
    fluid.add_density(inflowIndex, 100);
    fluid.add_velocity(inflowIndex, inflowProperties.velocityX * velmulti, inflowProperties.velocityY * velmulti);

    angle += rotation_speed; // Adjust the rotation speed as desired
    // fluid.add_density(fluid.ix(1, 1), 10);
    // fluid.add_velocity(fluid.ix(1, 1), 1000, 10);

    // Update the textures with fluid simulation data
    for (let j = 0; j < nh; j++) {
        for (let i = 0; i < nw; i++) {
            let index = fluid.ix(i + 1, j + 1);
            let densityValue = fluid.get_density_at_index(index);
            let velocityX = fluid.get_velocity_x(index);
            let velocityY = fluid.get_velocity_y(index);

            densityData[(j * nw + i) * 4] = densityValue;
            velocityData[(j * nw + i) * 4] = velocityX;
            velocityData[(j * nw + i) * 4 + 1] = velocityY;
        }
    }
    const linePositions = lineGeometry.getAttribute('position');
    const pointPositions = pointGeometry.getAttribute('position');
    const pointColors = pointGeometry.getAttribute('color');

    for (let j = 0; j < nh; j++) {
        for (let i = 0; i < nw; i++) {
            let index = fluid.ix(i + 1, j + 1);
            let densityValue = fluid.get_density_at_index(index);
            let velocityX = fluid.get_velocity_x(index);
            let velocityY = fluid.get_velocity_y(index);

            const px = (i / nw) * canvas.width - canvas.width / 2;
            const py = (j / nh) * canvas.height - canvas.height / 2;

            const lineIndex = j * nw + i;
            linePositions.setXYZ(lineIndex * 2, px, py, 0);
            linePositions.setXYZ(lineIndex * 2 + 1, px + velocityX * 10, py + velocityY * 10, 0);

            pointPositions.setXYZ(lineIndex, px, py, 0);
            pointColors.setXYZ(lineIndex, densityValue * 0.1, densityValue * 0.1, 1 - densityValue);
        }
    }

    linePositions.needsUpdate = true;
    pointPositions.needsUpdate = true;
    pointColors.needsUpdate = true;
    updateParticles();
    renderer.render(scene, camera);
    densityTexture.needsUpdate = true;
    velocityTexture.needsUpdate = true;

}

// Update particles function
function updateParticles() {
    const dt = 0.1;
    for (const particle of particles) {
        const index = fluid.ix(Math.round(particle.position.x), Math.round(particle.position.y));
        const velocityX = fluid.get_velocity_x(index);
        const velocityY = fluid.get_velocity_y(index);
        const velocity = new THREE.Vector2(velocityX, velocityY);
        particle.update(dt, velocity);

        // Reset the particle's position when it ages
        if (particle.age > Math.random() * 12000) {
            particle.position.set(nw/2, nh/2);
            particle.age = 0;
        }
    }

    // // Update the particle positions in the geometry
    for (let i = 0; i < particles.length; i++) {
        const px = (particles[i].position.x / nw) * canvas.width - canvas.width / 2;
        const py = (particles[i].position.y / nh) * canvas.height - canvas.height / 2;
        particlePositions.set([px, py, 0], i * 3);
    }

    particleGeometry.attributes.position.needsUpdate = true;
}

const initUi = () =>{
    
    const dt_blade = pane.addBlade({
        view: 'slider',
        label: 'time step',
        min: 0,
        max: 2,
        value: dt,
    });
    dt_blade.on('change', function (ev: any) {
        fluid.set_dt(ev.value)
    });
    
    const df_blade = pane.addBlade({
        view: 'slider',
        label: 'diffusion',
        min: 0,
        max: 20,
        value: df,
    });
    df_blade.on('change', function (ev: any) {
        fluid.set_config_diffusion(ev.value)
    });
    const inflow_blade = pane.addBlade({
        view: 'slider',
        label: 'rotation speed',
        min: 0,
        max: 1,
        value: df,
    });
    inflow_blade.on('change', function (ev: any) {
        rotation_speed = ev.value
    });
    const inflow2_blade = pane.addBlade({
        view: 'slider',
        label: 'inflowspeed',
        min: 0,
        max: 10,
        value: velmulti,
    });
    inflow2_blade.on('change', function (ev: any) {
        velmulti = ev.value
    });
    const shader_blade = pane.addBlade({
        view: 'slider',
        label: 'shaderopacity',
        min: 0,
        max: 1,
        value: shaderopacity,
    });
    shader_blade.on('change', function (ev: any) {
        shaderMaterial.uniforms.opacity.value = ev.value;
    });
    const shader_min_blade = pane.addBlade({
        view: 'slider',
        label: 'shader_min',
        min: 0,
        max: 1,
        value: shader_min
    });
    shader_min_blade.on('change', function (ev: any) {
        shaderMaterial.uniforms.MIN_SPEED.value = ev.value;
    });
    const shader_max_blade = pane.addBlade({
        view: 'slider',
        label: 'shader_max',
        min: 0,
        max: 2,
        value: shader_max
    });
    shader_max_blade.on('change', function (ev: any) {
        shaderMaterial.uniforms.MIN_SPEED.value = ev.value;
    });
}