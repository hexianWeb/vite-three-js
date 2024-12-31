import * as THREE from 'three';

import HolographicMaterial from '../components/material/hologram/hologram-material';
import Experience from '../experience';

export default class Engine {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resource = this.experience.resources.items.engine.scenes[0];
    this.time = this.experience.time;
    this.debug = this.experience.debugger.ui;

    this.setModel();
  }
  setModel() {
    this.holoMaterial = new HolographicMaterial({
      enableBlinking: false,
      blinkFresnelOnly: false
    });

    this.resource.traverse((child) => {
      if (child.isMesh) {
        child.material = this.holoMaterial;
      }
    });

    this.scene.add(this.resource);
  }
  update() {
    this.holoMaterial.update();
    this.resource.rotation.x += 0.01;
  }
}
