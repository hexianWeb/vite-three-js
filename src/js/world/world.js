import * as THREE from 'three'

import Experience from '../experience.js'
import Area from './area.js'
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
  }

  update() {
  }
}
