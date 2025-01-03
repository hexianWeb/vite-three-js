import * as THREE from 'three';

import Float from '../components/float.js';
import Experience from '../experience.js';
import Environment from './environment.js';
import Firework from './firework.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

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
      console.log('update float');
      this.float.update();
    }
  }

  resize() {
    this.firework.resize();
  }
}
