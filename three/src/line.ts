import * as THREE from 'three';
import initFluid, { Fluid, FluidConfig } from '../../pkg/navier_wasm';
import { getDisplayDimensions } from './utils';
import { Pane } from 'tweakpane';
import './style.css'

let fluid: Fluid;
let renderer: THREE.WebGLRenderer;
let camera: THREE.Camera;
let scene: THREE.Scene;
let nw: number
let nh: number
let canvas: any

let pane: any

let df = 0.5
let dt = 0.5


let lineGeometry: any

async function init() {
    await initFluid(); // navier_wasm
    pane = new Pane(); // tweakpane
    canvas = document.getElementById("scene") as HTMLCanvasElement;
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    renderer.setSize(window.innerWidth,window.innerHeight);
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-canvas.width / 2, canvas.width / 2, canvas.height / 2, -canvas.height / 2, -1, 1);
    [nw, nh] = getDisplayDimensions(canvas.width, canvas.height);
    
    // navier_wasm
    const fluidConfig = FluidConfig.new(nw, nh, df);
    fluid = Fluid.new(fluidConfig, dt);

    // add lines for a vector field
    lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nw * nh * 6);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const lineMesh = new THREE.LineSegments(lineGeometry, material);
    scene.add(lineMesh);

    animate();
    initUi()
}

init(); // this function makes sure we initFluid before we run any fluid functions elsewhere

function animate() {
    
    requestAnimationFrame(animate);
    fluid.simulate();
    fluid.add_density(fluid.ix(nw/2, nh/2), 10);
    fluid.add_velocity(fluid.ix(nw/2, nh/2), 10, 0);

    updatePoints()
    renderer.render(scene, camera);
}

function updatePoints(){
    const linePositions = lineGeometry.getAttribute('position');
    for (let j = 0; j < nh; j++) {
        for (let i = 0; i < nw; i++) {
            let index = fluid.ix(i + 1, j + 1);
            let velocityX = fluid.get_velocity_x(index);
            let velocityY = fluid.get_velocity_y(index);

            const px = (i / nw) * canvas.width - canvas.width / 2;
            const py = (j / nh) * canvas.height - canvas.height / 2;

            const lineIndex = j * nw + i;
            linePositions.setXYZ(lineIndex * 2, px, py, 0);
            linePositions.setXYZ(lineIndex * 2 + 1, px + velocityX * 10, py + velocityY * 10, 0);
        }
    }
    linePositions.needsUpdate = true;
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
}