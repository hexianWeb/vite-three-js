import gsap from 'gsap';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

import fireworkFragmentShader from '../../shaders/fireworkWithModel/fragment.glsl';
import fireworkVertexShader from '../../shaders/fireworkWithModel/vertex.glsl';
import Experience from '../experience.js';

export default class FireworkWithModel {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.deviceSize = this.experience.sizes;
    this.debug = this.experience.debugger.ui;
    this.debugActive = this.experience.debugger.active;

    this.params = {
      uSize: 10,
      uCount: 5000 // 采样点数量
    };

    this.fireworks = [];

    this.debuggerInit();
  }

  createFirework(model) {
    // 确保模型是 THREE.Mesh 实例
    if (!(model instanceof THREE.Mesh)) {
      console.error('Provided model is not a THREE.Mesh instance');
      return;
    }

    // 创建采样器
    const sampler = new MeshSurfaceSampler(model).build();

    // 准备顶点位置和颜色数组
    const positionsArray = new Float32Array(this.params.uCount * 3);
    const colorsArray = new Float32Array(this.params.uCount * 3);
    const sizesArray = new Float32Array(this.params.uCount);
    const timeMultipliersArray = new Float32Array(this.params.uCount);

    // 临时变量
    const temporaryPosition = new THREE.Vector3();
    const temporaryColor = new THREE.Color();
    const _ = new THREE.Vector3();
    // 采样顶点
    for (let index = 0; index < this.params.uCount; index++) {
      sampler.sample(temporaryPosition, _, temporaryColor);

      const index3 = index * 3;
      positionsArray[index3] = temporaryPosition.x;
      positionsArray[index3 + 1] = temporaryPosition.y;
      positionsArray[index3 + 2] = temporaryPosition.z;

      colorsArray[index3] = temporaryColor.r;
      colorsArray[index3 + 1] = temporaryColor.g;
      colorsArray[index3 + 2] = temporaryColor.b;

      sizesArray[index] = Math.random() * 0.5 + 0.5;
      timeMultipliersArray[index] = Math.random() + 1;
    }

    // 创建几何体
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positionsArray, 3)
    );
    geometry.setAttribute(
      'aColor',
      new THREE.Float32BufferAttribute(colorsArray, 3)
    );
    geometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(sizesArray, 1)
    );
    geometry.setAttribute(
      'timeMultipliers',
      new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
    );

    // 创建材质
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uSize: { value: this.params.uSize },
        uResolution: {
          value: new THREE.Vector2(
            this.deviceSize.width,
            this.deviceSize.height
          )
        },
        uTexture: { value: this.resources.items['particles1'] },
        uProgress: { value: 0 }
      },
      vertexShader: fireworkVertexShader,
      fragmentShader: fireworkFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    // 创建点云
    const fireworkPoints = new THREE.Points(geometry, material);
    this.scene.add(fireworkPoints);

    const firework = { points: fireworkPoints, geometry, material };
    this.fireworks.push(firework);
    this.animate(firework);
  }

  animate(firework) {
    gsap.to(firework.material.uniforms.uProgress, {
      value: 1,
      duration: 5 + Math.random(),
      ease: 'power2.out',
      onComplete: () => this.destroy(firework)
    });
  }

  debuggerInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({ title: 'Firework With Model' });
      folder.addBinding(this.params, 'uSize', { min: 1, max: 20, step: 1 });
      folder.addBinding(this.params, 'uCount', {
        min: 1000,
        max: 50_000,
        step: 1000
      });
    }
  }

  destroy(firework) {
    this.scene.remove(firework.points);
    firework.geometry.dispose();
    firework.material.dispose();
    const index = this.fireworks.indexOf(firework);
    if (index > -1) {
      this.fireworks.splice(index, 1);
    }
  }

  resize() {
    this.deviceSize.width = window.innerWidth;
    this.deviceSize.height = window.innerHeight;
    for (const firework of this.fireworks) {
      firework.material.uniforms.uResolution.value.set(
        this.deviceSize.width,
        this.deviceSize.height
      );
    }
  }
}
