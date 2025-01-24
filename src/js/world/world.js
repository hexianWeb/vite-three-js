import gsap from 'gsap';
import * as THREE from 'three';

import Experience from '../experience.js';
import Earth from './earth.js';
import Environment from './environment.js';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import Target360 from './target360';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.sizes = this.experience.sizes;
    this.renderer = this.experience.renderer.instance;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment();
    });

    // 构建一个正交相机
    this.cameraFinal = new THREE.OrthographicCamera(
      1 / -2,
      1 / 2,
      1 / 2,
      1 / -2,
      -1000,
      1000
    );

    this.sceneFinal = new THREE.Scene();

    this.earth = new Earth();
    // Add target360
    this.target360 = null;

    this.createFinalScene();
    this.debuggerInit();

    this.earth.on('EaseIn', (argument1, argument2) => {
      this.onEaseIn(argument1, argument2);
    });
  }

  onEaseIn(markerData, coords) {
    console.log('onEaseIn', markerData, coords);

    // 创建 Target360 实例
    this.target360 = new Target360(markerData);
    this.target360.on('EaseOut', () => {
      this.onEaseOut();
    });

    // gsap animation uProgress to 1
    gsap.to(this.material.uniforms.uProgress, {
      duration: 1,
      value: 1,
      ease: 'power2.inOut'
    });
  }
  onEaseOut() {
    gsap.to(this.material.uniforms.uProgress, {
      duration: 1,
      value: 0,
      ease: 'power2.inOut',
      onComplete: () => {
        this.earth.resetRotation();
        // 销毁 Target360 实例
        if (this.target360) {
          this.target360.destroy();
          this.target360 = null;
        }
      }
    });
  }

  createFinalScene() {
    this.texture360 = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter
      }
    );
    this.textureEarth = new THREE.WebGLRenderTarget(
      this.sizes.width,
      this.sizes.height,
      {
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter
      }
    );

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        texture360: { value: null },
        textureEarth: { value: null },
        uProgress: { value: 0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
    let geometry = new THREE.PlaneGeometry(1, 1);
    let mesh = new THREE.Mesh(geometry, this.material);
    this.sceneFinal.add(mesh);
  }
  // 定义一个名为update的方法，用于更新场景
  update() {
    if (this.earth) {
      this.earth.update();
      this.renderer.setRenderTarget(this.textureEarth);
      this.renderer.render(this.earth.scene, this.earth.camera);
    }

    if (this.target360) {
      this.target360.update();
      this.renderer.setRenderTarget(this.texture360);
      this.renderer.render(this.target360.scene360, this.target360.camera);
    }

    this.material.uniforms.texture360.value = this.texture360.texture;
    this.material.uniforms.textureEarth.value = this.textureEarth.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.sceneFinal, this.cameraFinal);
  }

  debuggerInit() {
    if (this.debugActive) {
      const f1 = this.debug.addFolder({
        title: 'transition'
      });
      f1.addBinding(this.material.uniforms.uProgress, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'progress'
      });
    }
  }
}
