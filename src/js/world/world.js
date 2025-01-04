import * as THREE from 'three';

import Experience from '../experience.js';
import EnvironmentSphere from './environmentSphere.js';
import Firework from './firework.js';
import FireworkWithModel from './firework-with-model.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.scene.add(new THREE.AxesHelper(50));

    // this.envSphere = new EnvironmentSphere();

    this.resources.on('ready', () => {
      this.fireworkWithModel = new FireworkWithModel();
      this.firework = new Firework();
      this.events();
    });
  }

  events() {
    window.addEventListener('click', () => {
      this.fireworkWithModel.createFirework(
        this.resources.items['burgerModel'].scene.children[0]
      );
      // this.firework.createFirework();
      // this.firework.createFirework();
      // this.firework.createFirework();
      // this.firework.createFirework();
      // this.firework.createFirework();
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
