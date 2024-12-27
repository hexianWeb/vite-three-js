import * as THREE from 'three';

import Float from '../components/float.js';
import Experience from '../experience.js';
import Environment from './environment.js';

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
      new THREE.MeshStandardMaterial({ color: 0xFF_00_00 })
    );
    this.float.add(testMesh);
    // this.scene.add(testMesh);
  }

  update() {
    if (this.float) {
      console.log('update float');
      this.float.update();
    }
  }
}
