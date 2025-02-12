import * as THREE from 'three';

import Experience from '../experience.js';

export default class Background {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug;
    this.sizes = this.experience.sizes;

    this.setGeometry();
    this.setTextures();
    this.setMaterial();
    this.setMesh();

    this.setDebug();
  }

  setGeometry() {
    // 使用PlaneGeometry,但不指定尺寸,我们将在setMesh中设置缩放
    this.geometry = new THREE.PlaneGeometry(2 * this.sizes.aspect, 2);
  }

  setTextures() {
    this.textures = {};
    this.textures.height = this.resources.items.displacementTexture;
    this.textures.normal = this.resources.items.normalTexture;

    this.textures.normal.wrapS = this.textures.normal.wrapT =
      THREE.RepeatWrapping;
    this.textures.normal.repeat.set(1, 4);

    this.textures.height.wrapS = this.textures.height.wrapT =
      THREE.RepeatWrapping;
    this.textures.height.repeat.set(1, 4);

    this.textures.height.anisotropy = 16;
    this.textures.normal.anisotropy = 16;
  }

  setMaterial() {
    this.material = new THREE.MeshPhysicalMaterial({
      color: '#121423',
      metalness: 0.59,
      roughness: 0.41,
      displacementMap: this.textures.height,
      displacementScale: 0.1,
      normalMap: this.textures.normal,
      normalScale: new THREE.Vector2(0.68, 0.75),
      side: THREE.FrontSide
    });
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setDebug() {
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder({
        title: 'Background'
      });
      debugFolder.addBinding(this.material, 'metalness', {
        min: 0,
        max: 1,
        step: 0.01
      });
      debugFolder.addBinding(this.material, 'roughness', {
        min: 0,
        max: 1,
        step: 0.01
      });
      debugFolder.addBinding(this.material, 'displacementScale', {
        min: 0,
        max: 1,
        step: 0.01
      });
      debugFolder.addBinding(this.material.normalScale, 'x', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'normalScaleX'
      });
      debugFolder.addBinding(this.material.normalScale, 'y', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'normalScaleY'
      });
    }
  }

  update() {
    // 如果需要在每帧更新背景,可以在这里添加逻辑
  }
}
