import * as THREE from 'three';

import Experience from '../experience.js';

export default class Stage {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    this.setStage();
    this.setPlane();
    this.debuggerInit();
  }

  setStage() {
    const stage = this.resources.items['stage'].scene.children[0];
    stage.rotation.y = -Math.PI / 2;
    stage.position.set(0, -2, -10);
    stage.receiveShadow = true;
    this.scene.add(stage);
  }

  setPlane() {
    this.planeColor = '#1fa538';
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({
        color: this.planeColor,
        metalness: 0,
        roughness: 0.5,
        side: THREE.DoubleSide
      })
    );
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.z = -20;
    this.plane.position.y = -1.9;
    this.plane.receiveShadow = true;
    this.scene.add(this.plane);
  }

  updatePlaneColor() {
    this.plane.material.color.set(this.planeColor);
  }

  debuggerInit() {
    if (this.debugActive) {
      const planeFolder = this.debug.addFolder({
        title: 'Plane',
        expanded: false
      });

      planeFolder
        .addBinding(this, 'planeColor', {
          label: 'Color',
          view: 'color'
        })
        .on('change', this.updatePlaneColor.bind(this));
    }
  }
}
