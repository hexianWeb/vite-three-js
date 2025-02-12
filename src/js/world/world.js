import * as THREE from 'three';

import Experience from '../experience.js';
import Background from './background.js';
import Effects from './effect.js';
import Environment from './environment.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.resources.on('ready', () => {
      this.environment = new Environment();
      this.background = new Background();
      this.effects = new Effects();
    });
  }

  update() {
    if (this.background) this.background.update();
    if (this.environment) this.environment.update();
    if (this.effects) this.effects.update();
  }
}
