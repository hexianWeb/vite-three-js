import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import Experience from './experience.js';

export default class Camera {
  constructor(orthographic = false) {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;
    this.orthographic = orthographic;

    this.setInstance();
    this.setControls();
  }

  setInstance() {
    if (this.orthographic) {
      const aspect = this.sizes.aspect;
      this.frustumSize = 15;

      this.instance = new THREE.OrthographicCamera(
        -this.frustumSize * aspect,
        this.frustumSize * aspect,
        this.frustumSize,
        -this.frustumSize,
        -1,
        1000
      );
    } else {
      this.instance = new THREE.PerspectiveCamera(
        35,
        this.sizes.width / this.sizes.height,
        0.1,
        100
      );
    }
    this.instance.position.set(-10, 10, 10);
    this.instance.lookAt(new THREE.Vector3());
    this.scene.add(this.instance);
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
  }

  resize() {
    if (this.orthographic) {
      const aspect = this.sizes.width / this.sizes.height;

      this.instance.left = (-this.frustumSize * aspect) / 2;
      this.instance.right = (this.frustumSize * aspect) / 2;
      this.instance.top = this.frustumSize / 2;
      this.instance.bottom = -this.frustumSize / 2;

      this.instance.updateProjectionMatrix();
    } else {
      this.instance.aspect = this.sizes.width / this.sizes.height;
      this.instance.updateProjectionMatrix();
    }
  }

  update() {
    this.controls.update();
  }
}
