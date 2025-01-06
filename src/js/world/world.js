import * as THREE from 'three';

import Float from '../components/float.js';
import Experience from '../experience.js';
import Environment from './environment.js';
import TextMesh from './text-mesh.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.scene.add(new THREE.AxesHelper(5));
    this.float = new Float({ speed: 1.5, floatIntensity: 2 });

    // Environment
    this.environment = new Environment();

    // 3D Text Mesh
    this.text = new TextMesh();
  }

  update() {
    this.text.update();
    if (this.float) {
      this.float.update();
    }
  }
}
