import * as THREE from 'three';

import Experience from '../experience.js';

export default class Environment {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // Setup
    this.setSunLight();
    this.setFog();
    this.resources.on('ready', () => {
      this.setEnvironmentMap();
    });
  }
  setFog() {
    this.scene.fog = new THREE.Fog(0x20_25_33, -1, 100);
  }
  setSunLight() {
    this.ambientLight = new THREE.AmbientLight(0xCC_CC_CC, 1);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight('#ffffff', 5);
    this.sunLight.position.set(5, 5, 20);
    this.scene.add(this.sunLight);

    this.backLight = new THREE.DirectionalLight('#ffffff', 2.5);
    this.backLight.position.set(-5, -5, -10);
    this.scene.add(this.backLight);
  }
  setEnvironmentMap() {
    this.environmentMap = {};
    this.environmentMap.intensity = 0.4;
    this.environmentMap.texture = this.resources.items.environmentMapTexture;
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace;

    this.scene.environment = this.environmentMap.texture;
    this.scene.background = this.environmentMap.texture;
  }
}
