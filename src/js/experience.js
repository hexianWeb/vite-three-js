import * as THREE from 'three';

import Camera from './camera.js';
import Renderer from './renderer.js';
import sources from './sources.js';
import Resources from './Utils/resources.js';
import Sizes from './utils/sizes.js';
import Time from './utils/time.js';
import PhysicsWorld from './world/physics-world.js';
import World from './world/world.js';

let instance;

export default class Experience {
  constructor(canvas) {
    // Singleton
    if (instance) {
      return instance;
    }
    // eslint-disable-next-line unicorn/no-this-assignment
    instance = this;

    // Global access
    window.Experience = this;

    this.canvas = canvas;

    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera(true);
    this.renderer = new Renderer();
    this.resources = new Resources(sources);
    this.physics = new PhysicsWorld();
    this.world = new World();

    this.sizes.on('resize', () => {
      this.resize();
    });

    this.time.on('tick', () => {
      this.update();
    });
  }
  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.renderer.update();
    this.world.update();
  }
}
