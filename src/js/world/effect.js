import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

import Experience from '../experience.js';
import CustomPass from './customPass.js';
import { NoisePass } from './noisePass.js'; // 新建这个文件

export default class Effects {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.renderer = this.experience.renderer;
    this.debug = this.experience.debug;

    this.setComposer();
    this.setDebug();
  }

  setComposer() {
    this.renderPass = new RenderPass(this.scene, this.camera.instance);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.15,
      0.3,
      0.22
    );

    this.customPass = new CustomPass({
      frequency: 3.5,
      amplitude: 0.1
    });

    // 创建噪点Pass（新增代码）
    this.noisePass = new NoisePass({
      intensity: 0.65,
      speed: 0.9
    });

    this.composer = new EffectComposer(this.renderer.instance);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.customPass);
    this.composer.addPass(this.noisePass); // 新增噪点Pass
  }

  setDebug() {
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder({
        title: 'Effects'
      });
      debugFolder.addBinding(this.bloomPass, 'strength', {
        min: 0,
        max: 3,
        step: 0.01
      });
      debugFolder.addBinding(this.bloomPass, 'radius', {
        min: 0,
        max: 1,
        step: 0.01
      });
      debugFolder.addBinding(this.bloomPass, 'threshold', {
        min: 0,
        max: 1,
        step: 0.01
      });
      debugFolder.addBinding(this.customPass.uniforms.frequency, 'value', {
        min: 1,
        max: 20,
        step: 0.1,
        label: 'Drunk Frequency'
      });
      debugFolder.addBinding(this.customPass.uniforms.amplitude, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Drunk Amplitude'
      });
      // 添加噪点调试参数（新增代码）
      const noiseFolder = this.debug.ui.addFolder({
        title: 'Noise Effect'
      });
      noiseFolder.addBinding(this.noisePass.uniforms.intensity, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Noise Intensity'
      });
      noiseFolder.addBinding(this.noisePass.uniforms.speed, 'value', {
        min: 0,
        max: 2,
        step: 0.1,
        label: 'Noise Speed'
      });
    }
  }

  resize() {
    this.composer.setSize(
      this.experience.sizes.width,
      this.experience.sizes.height
    );
  }

  update() {
    this.composer.render();
    this.customPass.uniforms.offset.value += this.experience.time.delta / 1000;
    this.noisePass.uniforms.time.value += this.experience.time.delta * 0.1; // 更新时间
  }
}
