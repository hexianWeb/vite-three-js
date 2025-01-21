import * as THREE from 'three';

import Experience from '../experience.js';
import Earth from './earth.js';
import Environment from './environment.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment();
    });

    this.earth = new Earth();
  }

  update() {
    if (this.earth) {
      this.earth.update();
    }
  }
}
