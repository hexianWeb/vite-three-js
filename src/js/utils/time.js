import * as THREE from 'three';

import EventEmitter from './event-emitter.js';
// eslint-disable-next-line unicorn/prefer-event-target
export default class Time extends EventEmitter {
  constructor() {
    super();

    // Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsed = 0;
    this.delta = 16;

    this.clock = new THREE.Clock();

    // window.requestAnimationFrame(() => {
    this.tick();
    // });
  }

  tick() {
    // 低数值 update time 方案
    const newElapsedTime = this.clock.getElapsedTime();
    const deltaTime = newElapsedTime - this.elapsed;
    this.delta = deltaTime;
    this.elapsed = newElapsedTime;

    // 不同设备稳定帧数方案
    // const currentTime = Date.now();
    // this.delta = currentTime - this.current;
    // this.current = currentTime;
    // this.elapsed = this.current - this.start;

    this.trigger('tick');

    window.requestAnimationFrame(() => {
      this.tick();
    });
  }
}
