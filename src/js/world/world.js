import * as THREE from 'three';

import Float from '../components/position/float.js';
import Experience from '../experience.js';
import Engine from './engine.js';
import Environment from './environment.js';
import Laser from './laser.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.float = new Float({ speed: 1.5, floatIntensity: 2 });

    // axesHelper
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment();
      this.engine = new Engine();
      this.laser = new Laser(); // 添加这行
    });
  }

  update() {
    // if (this.float) {
    //   this.float.update();
    // }
    if (this.contactShadows) {
      this.contactShadows.update();
    }
    if (this.engine) {
      this.engine.update();
    }
    if (this.laser) {
      this.laser.update();
    }
  }
}
