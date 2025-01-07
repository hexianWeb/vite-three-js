import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  color,
  Fn,
  fog,
  positionLocal,
  rangeFogFactor,
  sin,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(2, 2, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      forceWebGL: false
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setLights();
    this.setObject();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setObject() {
    this.material = new THREE.NodeMaterial();
    this.material.colorNode = Fn(() => {
      return vec4(1, 0, 0, 1);
    })();

    this.planeGeometry = new THREE.PlaneGeometry(2, 2);
    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.material);
    this.scene.add(this.planeMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.renderer.renderAsync(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
