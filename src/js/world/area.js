import * as THREE from 'three'

import Experience from '../experience.js'

export default class Area {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.setupArea()
  }

  setupArea() {
    this.model = this.resources.items.sceneModel
    // 设置模型接受阴影
    this.model.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        // child.material.metalness = 0.5
      }
    })
    this.scene.add(this.model.scene)
  }
}
