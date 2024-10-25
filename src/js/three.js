import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    // 场景相机
    this.camera = new THREE.PerspectiveCamera(
      65,
      device.width / device.height,
      0.01,
      100
    );
    this.camera.position.set(0, 0, 1.35);
    this.scene.add(this.camera);

    // 构建一个专门提供给 depthTexture 的 深度相机
    this.depthCamera = new THREE.PerspectiveCamera(
      65,
      device.width / device.height,
      0.7,
      1.35
    );
    this.depthCamera.position.set(0, 0, 1.35);
    this.scene.add(this.depthCamera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(0xFF_FF_FF, 0);
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    // this.setLights();
    this.setDepthTexture();
    this.setObjects();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setDepthTexture() {
    this.target = new THREE.WebGLRenderTarget(
      device.width * device.pixelRatio,
      device.height * device.pixelRatio
    );
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthTexture = new THREE.DepthTexture();
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  setObjects() {
    const loader = new GLTFLoader();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: new THREE.Uniform(0),
        resolution: new THREE.Uniform(
          new THREE.Vector2(device.width, device.height)
        ),
        depthTexture: { value: undefined },
        cameraNear: new THREE.Uniform(this.depthCamera.near),
        cameraFar: new THREE.Uniform(this.depthCamera.far)
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.5,
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable'
      }
    });
    loader.load(
      './model/human.glb',
      (gltf) => {
        this.model = gltf.scene;
        this.model.position.set(0, 0, 0);
        this.model.rotateY(-Math.PI);

        this.model.traverse((child) => {
          if (child.type === 'Mesh') {
            child.material = new THREE.MeshBasicMaterial({
              color: 0xFF_FF_FF
            });
          }
        });

        this.scene.add(this.model);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error(error);
      }
    );

    // 创建一个 planeMesh 接受 depthTexture
    this.planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1, 512, 512),
      this.material
    );
    this.planeMesh.position.set(1, 0, 0);
    this.scene.add(this.planeMesh);
  }

  setLinePlane(count = 100) {
    this.lineGroup = new THREE.Group();
    for (let _index = 0; _index < count; _index++) {
      const geometry = new THREE.PlaneGeometry(2, 0.005, 300, 1);
      let y = [];
      let length_ = this.geometry.attributes.position.array.length;
      for (let __index = 0; __index < length_; __index += 3) {
        y.push(_index / count);
      }
      geometry.setAttribute('ay', new THREE.Float32BufferAttribute(y, 1));
      const material = this.material.clone();
      let mesh = new THREE.Mesh(geometry, material);
      // mesh.position.set(0,
    }
  }
  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.material.uniforms.time.value = elapsedTime;

    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.depthCamera);
    this.renderer.setRenderTarget(null);
    this.material.uniforms.depthTexture.value = this.target.depthTexture;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
    if (this.model) {
      // 让model随着时间作周期运动
      this.model.rotation.y = 0.6 * Math.cos(elapsedTime);
      this.model.position.z = -0.5 + 0.5 * Math.sin(elapsedTime);
    }
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
