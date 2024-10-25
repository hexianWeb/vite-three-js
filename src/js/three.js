import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const imgUrls = ['./img/01.jpg', './img/02.jpg', './img/03.jpg'];
export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      device.width / device.height,
      1,
      10_000
    );
    this.camera.position.set(0, 0, 900);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.textures = imgUrls;

    this.setLights();
    this.setGroup();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGroup() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.planeGeometry = new THREE.PlaneGeometry(1920, 1080, 1, 1);
    this.planeMaterials = [];
    // 载入图片
    const textureLoader = new THREE.TextureLoader();
    this.textures = this.textures.map((url) => textureLoader.load(url));
    let maskTexture = textureLoader.load('./img/mask.png');
    // 生成 3 层 layer
    for (let _index = 0; _index < this.textures.length; _index++) {
      let singlePictureGroup = new THREE.Group();
      this.group.add(singlePictureGroup);
      for (let __index = 0; __index < 3; __index++) {
        const material = new THREE.MeshBasicMaterial({
          map: this.textures[_index],
          transparent: true,
          alphaMap: __index !== 2 && maskTexture
        });
        this.planeMaterials.push(material);
        let planeMesh = new THREE.Mesh(this.planeGeometry, material);
        planeMesh.position.set(2500 * _index, 0, __index * -150);
        singlePictureGroup.add(planeMesh);
      }
    }

    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterials[0]);
    this.scene.add(this.planeMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.renderer.render(this.scene, this.camera);
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
