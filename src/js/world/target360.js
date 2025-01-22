import * as THREE from 'three';

import Experience from '../experience';

export default class Target360 {
  constructor() {
    this.experience = new Experience();
    this.renderer = this.experience.renderer.instance;
    this.camera = this.experience.camera.instance;
    this.resources = this.experience.resources;

    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    // 渲染额外场景
    this.scene360 = new THREE.Scene();

    this.resources.on('ready', () => {
      this.addScene360();
      this.debugInit();
    });
  }

  addScene360() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const environmentMap = pmremGenerator.fromEquirectangular(
      this.resources.items['hdriEnvTexture']
    ).texture;

    const background = this.resources.items['hdriEnvTexture'];
    const sphere = new THREE.SphereGeometry(25, 60, 40);
    const mesh = new THREE.Mesh(
      sphere,
      new THREE.MeshBasicMaterial({
        map: background,
        side: THREE.BackSide
      })
    );
    this.scene360.environment = environmentMap;
    this.scene360.add(mesh);
  }
  debugInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({
        title: 'Target360'
      });
    }
  }

  update() {
    this.renderer.render(this.scene360, this.camera);
  }
}
