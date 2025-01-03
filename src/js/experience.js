import * as THREE from 'three';

import Camera from './camera.js';
import Renderer from './renderer.js';
import sources from './sources.js';
import Debug from './utils/debug.js';
import IMouse from './utils/imouse.js';
import Resources from './utils/resources.js';
import Sizes from './utils/sizes.js';
import Stats from './utils/stats.js';
import Time from './utils/time.js';
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

    this.initPanel();

    this.sizes = new Sizes();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera();
    this.renderer = new Renderer();
    this.resources = new Resources(sources);
    this.world = new World();
    this.iMouse = new IMouse();

    this.sizes.on('resize', () => {
      this.resize();
    });

    this.time.on('tick', () => {
      this.update();
    });
  }

  initPanel() {
    this.stats = new Stats();
    this.debugger = new Debug();
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
    this.world.resize();
  }

  update() {
    this.camera.update();
    this.renderer.update();
    this.world.update();
    this.stats.update();
    this.iMouse.update;
  }
}
