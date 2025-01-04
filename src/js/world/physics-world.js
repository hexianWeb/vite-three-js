import CANNON from 'cannon';

import Experience from '../experience.js';

export default class PhysicsWorld {
  constructor(gravity) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.world = new CANNON.World();
    this.world.gravity.set(0, -gravity, 0);
  }
}
