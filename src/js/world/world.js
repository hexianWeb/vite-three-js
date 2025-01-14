import * as THREE from 'three/webgpu';

import Float from '../components/float.js';
import Experience from '../experience.js';
import Environment from './environment.js';
import Model from './spider.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.float = new Float({ speed: 1.5, floatIntensity: 2 });

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment();
    });
    // Test mesh
    const testMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardNodeMaterial({ color: '#ff622e' })
    );

    this.spider = new Model();

    this.scene.add(testMesh);
  }

  update() {
    if (this.float) {
      this.float.update();
    }
  }
}
