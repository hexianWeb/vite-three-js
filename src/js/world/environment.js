import * as THREE from 'three';

import Experience from '../experience.js';

export default class Environment {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;
    this.iMouse = this.experience.iMouse;

    this.colors = [
      new THREE.Color('orange'),
      new THREE.Color('red'),
      new THREE.Color('red'),
      new THREE.Color('orange'),
      new THREE.Color('lightblue'),
      new THREE.Color('green'),
      new THREE.Color('blue'),
      new THREE.Color('blue')
    ];

    this.lightPosition = new THREE.Vector3(0, 0, 1);
    this.colorTransition = false; // 标记是否正在进行颜色过渡
    this.targetColors = []; // 存储目标颜色

    this.setLights();
    this.setEventListeners();
    this.setDebug();
  }

  setLights() {
    this.lights = [
      this.createPointLight(2),
      this.createPointLight(3),
      this.createPointLight(2.5),
      this.createPointLight(10),
      this.createPointLight(2),
      this.createPointLight(3),
      this.createAmbientLight(1.5)
    ];

    // 初始化灯光颜色
    this.initLightColors();

    for (const light of this.lights) this.scene.add(light.object);
  }

  initLightColors() {
    const numberLights = this.lights.length;

    for (let index = 0; index < numberLights; index++) {
      const colorIndex = Math.min(index, this.colors.length - 1);
      this.lights[index].object.color.copy(this.colors[colorIndex]);
    }
  }

  createPointLight(intensity) {
    const light = new THREE.PointLight(
      0xff_ff_ff,
      intensity,
      100,
      Math.random() * 10
    );
    light.position.copy(this.lightPosition);

    return {
      object: light,
      targetColor: new THREE.Color()
    };
  }

  createAmbientLight(intensity) {
    return {
      object: new THREE.AmbientLight(0xff_ff_ff, intensity),
      targetColor: new THREE.Color()
    };
  }

  setEventListeners() {
    window.addEventListener('click', () => {
      // 打乱颜色数组
      this.colors = [...this.colors.sort(() => Math.random() - 0.5)];

      // 设置目标颜色并启动过渡
      this.startColorTransition();
    });
  }

  startColorTransition() {
    // 标记开始颜色过渡
    this.colorTransition = true;

    // 为每个灯光设置目标颜色
    const numberLights = this.lights.length;
    for (let index = 0; index < numberLights; index++) {
      const colorIndex = Math.min(index, this.colors.length - 1);
      this.lights[index].targetColor = this.colors[colorIndex].clone();
    }
  }

  setDebug() {
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder({
        title: 'Environment'
      });

      // 为所有点光源添加共同的position控制
      debugFolder.addBinding(this.lightPosition, 'x', {
        min: -10,
        max: 10,
        step: 0.1,
        label: 'Light Position X'
      });
      debugFolder.addBinding(this.lightPosition, 'y', {
        min: -10,
        max: 10,
        step: 0.1,
        label: 'Light Position Y'
      });
      debugFolder.addBinding(this.lightPosition, 'z', {
        min: -10,
        max: 10,
        step: 0.1,
        label: 'Light Position Z'
      });

      // 为每个光源添加强度控制
      for (let index = 0; index < this.lights.length; index++) {
        debugFolder.addBinding(this.lights[index].object, 'intensity', {
          min: 0,
          max: 10,
          step: 0.1,
          label: `Light ${index + 1} Intensity`
        });
      }
    }
  }

  update() {
    const delta = this.experience.time.delta / 1000;

    // 只在需要时更新颜色
    if (this.colorTransition) {
      this.updateColors(delta);
    }

    this.updatePositions(delta, this.iMouse.normalizedMouse);
  }

  updateColors(delta) {
    const numberLights = this.lights.length;
    const baseSmooth = 0.25;
    const smoothIncrement = 0.05;

    let allTransitioned = true; // 检查所有颜色是否已完成过渡

    for (let index = 0; index < numberLights; index++) {
      const smoothTime = baseSmooth + index * smoothIncrement;

      // 使用目标颜色进行平滑过渡
      const currentColor = this.lights[index].object.color;
      const targetColor = this.lights[index].targetColor;

      this.dampC(currentColor, targetColor, smoothTime, delta);

      // 检查是否还在过渡
      if (!this.isColorClose(currentColor, targetColor)) {
        allTransitioned = false;
      }
    }

    // 如果所有颜色都已完成过渡，停止更新
    if (allTransitioned) {
      this.colorTransition = false;
    }
  }

  // 检查两个颜色是否足够接近(已完成过渡)
  isColorClose(color1, color2, threshold = 0.01) {
    return (
      Math.abs(color1.r - color2.r) < threshold &&
      Math.abs(color1.g - color2.g) < threshold &&
      Math.abs(color1.b - color2.b) < threshold
    );
  }

  updatePositions(delta, mouse) {
    const targetPosition = new THREE.Vector3(
      mouse.x * 1.1, // 将鼠标位置映射到更大的范围
      mouse.y * 0.25,
      this.lightPosition.z
    );

    this.lightPosition.lerp(targetPosition, 1 - Math.exp(-1.1 * delta));

    // 更新所有点光源的位置
    for (let index = 0; index < 6; index++) {
      this.lights[index].object.position.copy(this.lightPosition);
    }
  }

  damp(current, target, smoothTime, delta) {
    return THREE.MathUtils.lerp(
      current,
      target,
      1 - Math.exp(-smoothTime * delta)
    );
  }

  dampC(color, target, smoothTime, delta) {
    color.r = this.damp(color.r, target.r, smoothTime, delta);
    color.g = this.damp(color.g, target.g, smoothTime, delta);
    color.b = this.damp(color.b, target.b, smoothTime, delta);
  }
}
