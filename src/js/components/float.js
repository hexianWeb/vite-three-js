import * as THREE from 'three';

import Experience from '../experience.js';

/**
 * Float class for creating floating animation effects on 3D objects
 */
export default class Float {
  /**
   * @param {Object} config - Configuration options for the floating effect
   * @param {number} [config.speed=1] - Speed of the floating animation
   * @param {number} [config.rotationIntensity=1] - Intensity of rotation
   * @param {number} [config.floatIntensity=1] - Intensity of vertical floating
   * @param {number[]} [config.floatingRange=[-0.1, 0.1]] - Range of vertical floating
   */
  constructor(config = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;

    // Set up configuration parameters
    this.speed = config.speed || 1;
    this.rotationIntensity = config.rotationIntensity || 1;
    this.floatIntensity = config.floatIntensity || 1;
    this.floatingRange = config.floatingRange || [-0.1, 0.1];

    // Create a group to hold floating objects
    this.group = new THREE.Group();

    // Random offset for varied animation start points
    this.offset = Math.random() * 114_514;

    // Add the group to the scene
    this.scene.add(this.group);
  }

  /**
   * Add objects to the floating group
   * @param  {...THREE.Object3D} objects - 3D objects to add to the floating effect
   */
  add(...objects) {
    this.group.add(...objects);
  }

  /**
   * Update the floating animation
   * Should be called in the animation loop
   */
  update() {
    const t = (this.offset + this.time.elapsed) * 0.01;

    // Apply rotation
    this.group.rotation.x =
      (Math.cos((t / 4) * this.speed) / 8) * this.rotationIntensity;
    this.group.rotation.y =
      (Math.sin((t / 4) * this.speed) / 8) * this.rotationIntensity;
    this.group.rotation.z =
      (Math.sin((t / 4) * this.speed) / 20) * this.rotationIntensity;

    // Calculate and apply vertical position for floating effect
    let yPosition = Math.sin((t / 4) * this.speed) / 10;
    yPosition = THREE.MathUtils.mapLinear(
      yPosition,
      -0.1,
      0.1,
      this.floatingRange[0] ?? -0.1,
      this.floatingRange[1] ?? 0.1
    );
    this.group.position.y = yPosition * this.floatIntensity;
  }
}
