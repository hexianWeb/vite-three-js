import * as THREE from 'three'

import Experience from '../experience.js'
import Area from './area.js'
import Effects from './effect.js'
import Environment from './environment.js'
import Hero from './hero.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.scene.add(new THREE.AxesHelper(5))
    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.area = new Area()
      this.hero = new Hero()
    })
    // 添加一个白色大网格
    const gridHelper = new THREE.GridHelper(100, 100)
    gridHelper.material.color.set(0xFFFFFF)
    gridHelper.material.opacity = 0.5
    gridHelper.material.transparent = true
    gridHelper.position.y = -0.1
    this.scene.add(gridHelper)
    this.effects = new Effects()
  }

  update() {
    // Update hero if it exists
    if (this.hero) {
      this.hero.update()
    }
    this.effects.update()
  }

  resize() {
    this.effects.resize()
  }
}
