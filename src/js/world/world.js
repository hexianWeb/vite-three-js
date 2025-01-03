import * as THREE from 'three';

import Experience from '../experience.js';
import EnvironmentSphere from './environmentSphere.js';
import Firework from './firework.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.scene.add(new THREE.AxesHelper(50));

    this.envSphere = new EnvironmentSphere();

    this.resources.on('ready', () => {
      this.firework = new Firework();
      this.events();
    });
  }

  events() {
    window.addEventListener('click', () => {
      this.firework.createFirework();
    });
  }
  update() {
    if (this.float) {
      this.float.update();
    }
  }

  resize() {
    this.firework.resize();
  }
}
