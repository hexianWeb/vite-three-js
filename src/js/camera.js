import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Experience from './experience.js';

export default class Camera {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;

    this.setInstance();
    this.setControls();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      60,
      this.sizes.width / this.sizes.height,
      1,
      1000
    );
    this.instance.position.set(200, 4, 8);
    this.scene.add(this.instance);
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    // 限制垂直旋转角度
    this.controls.minPolarAngle = Math.PI / 5; // 最小垂直角度（弧度）
    this.controls.maxPolarAngle = Math.PI / 2 - 0.2; // 最大垂直角度（弧度，这里设置为 90 度）

    // 设置最小和最大距离
    this.controls.minDistance = 50; // 最小距离
    this.controls.maxDistance = 300; // 最大距离
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    console.log(this.instance.position);

    this.controls.update();
  }
}
