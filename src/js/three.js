import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import fragment from '../shaders/fragment.glsl';
import simulationFragment from '../shaders/simulation/simFragment.glsl';
import simulationVertex from '../shaders/simulation/simVertex.glsl';
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

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 4);
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

    this.size = 256;

    this.scene.add(new THREE.AxesHelper(2));
    this.setFBO();
    this.setLights();
    this.setGeometry();
    this.render();
    this.setResize();
  }

  // 创建渲染 FBO 渲染画布
  getRenderTarget() {
    return new THREE.WebGLRenderTarget(device.width, device.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    });
  }

  setFBO() {
    this.fbo = this.getRenderTarget();
    this.fbo1 = this.getRenderTarget();

    this.fboScene = new THREE.Scene();
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.fboCamera.z = 0.5;
    this.fboCamera.lookAt(0, 0, 0);

    let geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    this.data = new Float32Array(this.size * this.size * 4);

    for (let index_ = 0; index_ < this.size; index_++) {
      for (let index__ = 0; index__ < this.size; index__++) {
        let index = (index_ + index__ * this.size) * 4;
        let theta = Math.random() * Math.PI * 2;
        let r = 0.5 + 0.5 * Math.random();
        this.data[index + 0] = r * Math.cos(theta);
        this.data[index + 1] = r * Math.sin(theta);
        this.data[index + 2] = 1;
        this.data[index + 3] = 1;
      }
    }

    this.fboTexture = new THREE.DataTexture(
      this.data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.fboTexture.needsUpdate = true;
    this.fboTexture.minFilter = THREE.NearestFilter;
    this.fboTexture.magFilter = THREE.NearestFilter;

    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: {
          value: this.fboTexture
        },
        uInfo: {
          value: undefined
        },
        time: { value: 0 }
      },
      vertexShader: simulationVertex,
      fragmentShader: simulationFragment
    });

    this.info = new Float32Array(this.size * this.size * 4);

    for (let index_ = 0; index_ < this.size; index_++) {
      for (let index__ = 0; index__ < this.size; index__++) {
        let index = (index_ + index__ * this.size) * 4;
        this.info[index + 0] = 0.5 + Math.random();
        this.info[index + 1] = 0.5 + Math.random();
        this.info[index + 2] = 1;
        this.info[index + 3] = 1;
      }
    }
    this.infoTexture = new THREE.DataTexture(
      this.info,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.infoTexture.needsUpdate = true;
    this.infoTexture.minFilter = THREE.NearestFilter;
    this.infoTexture.magFilter = THREE.NearestFilter;

    this.fboMaterial.uniforms.uInfo = { value: this.infoTexture };
    this.fboMesh = new THREE.Mesh(geometry, this.fboMaterial);
    this.fboScene.add(this.fboMesh);

    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.renderer.setRenderTarget(this.fbo1);
    this.renderer.render(this.fboScene, this.fboCamera);
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    this.count = this.size * this.size;
    this.positions = new Float32Array(this.count * 3);
    this.uv = new Float32Array(this.count * 2);

    for (let index_ = 0; index_ < this.size; index_++) {
      for (let index__ = 0; index__ < this.size; index__++) {
        let index = index_ + index__ * this.size;
        this.positions[index * 3 + 0] = Math.random();
        this.positions[index * 3 + 1] = Math.random();
        this.positions[index * 3 + 2] = 0;
        this.uv[index * 2 + 0] = index_ / (this.size - 1);
        this.uv[index * 2 + 1] = index__ / (this.size - 1);
      }
    }

    this.bufferGeometry = new THREE.BufferGeometry();
    this.bufferGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );
    this.bufferGeometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(this.uv, 2)
    );

    this.bufferShaderMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable'
      },
      transparent: true,
      side: THREE.DoubleSide,
      // blending: THREE.AdditiveBlending,
      uniforms: {
        uPosition: {
          value: new THREE.Uniform(null)
        },
        uTime: { value: new THREE.Uniform(0) }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.bufferShaderMaterial.uniforms.uPosition.value = this.fboTexture;
    this.points = new THREE.Points(
      this.bufferGeometry,
      this.bufferShaderMaterial
    );

    this.scene.add(this.points);

    // // 创建一个 红色 basic 材质的立方体
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0xFF_00_00 });
    // const cube = new THREE.Mesh(geometry, material);
    // this.scene.add(cube);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.bufferShaderMaterial.uniforms.uTime.value = elapsedTime;
    this.fboMaterial.uniforms.time.value = elapsedTime;

    this.fboMaterial.uniforms.uPosition.value = this.fbo1.texture;
    this.bufferShaderMaterial.uniforms.uPosition.value = this.fbo.texture;

    // 进一步计算 fbo 缓冲区
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    // ping pong 交换 fbo 缓冲区
    [this.fbo, this.fbo1] = [this.fbo1, this.fbo];
    // this.renderer.setRenderTarget(null);
    // this.renderer.render(this.fboScene, this.fboCamera);
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
