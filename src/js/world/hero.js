import * as THREE from 'three'

import Experience from '../experience.js'

export default class Hero {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse

    this.hero = this.resources.items.heroModel.scene.children[0]

    this.setHero()
  }

  setHero() {
    this.hero.position.set(0, 0, 0)
    this.hero.scale.set(1, 1, 1)
    this.hero.rotation.set(0, 0, 0)
    this.hero.castShadow = true
    this.hero.receiveShadow = true
    this.scene.add(this.hero)

    this.hero.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }
}
