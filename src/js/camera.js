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
    this.debug = this.experience.debug;
    this.debugActive = this.experience.debug.active;

    this.position = new THREE.Vector3(4.79, 3.4, 17);
    this.target = new THREE.Vector3(3.3, 3.4, -1.4);

    this.setInstance();
    this.setControls();
    this.setDebug();
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
        100
      );
    } else {
      this.instance = new THREE.PerspectiveCamera(
        34,
        this.sizes.width / this.sizes.height,
        0.1,
        100
      );
    }
    this.instance.position.copy(this.position);
    this.instance.lookAt(this.target);
    this.scene.add(this.instance);
  }

  setControls() {
    this.controls = new OrbitControls(this.instance, this.canvas);
    this.controls.enableDamping = true;
    this.controls.target.copy(this.target);
  }

  setDebug() {
    if (this.debugActive) {
      const cameraFolder = this.debug.ui.addFolder({
        title: 'Camera',
        expanded: false
      });

      cameraFolder
        .addBinding(this, 'position', {
          label: 'camera Position'
        })
        .on('change', this.updateCamera.bind(this));

      cameraFolder
        .addBinding(this, 'target', {
          label: 'camera Target'
        })
        .on('change', this.updateCamera.bind(this));
    }
  }

  updateCamera() {
    this.instance.position.copy(this.position);
    this.instance.lookAt(this.target);
    this.controls.target.copy(this.target);
    this.controls.update();
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
