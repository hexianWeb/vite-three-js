import * as THREE from 'three'

import Experience from '../experience.js'
import Environment from './environment.js'
import Galaxy from './galaxy.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug.ui
    this.debugActive = this.experience.debug.active

    this.axesHelper = new THREE.AxesHelper(5)
    this.scene.add(this.axesHelper)

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.galaxy = new Galaxy()
    })

    // 添加调试器
    this.debuggerInit()
  }

  debuggerInit() {
    if (this.debugActive) {
      const fl = this.debug.addFolder({
        title: 'AxesHelper',
        expanded: true,
      })
      // 控制 AxesHelper 的显示
      fl.addBinding(this.axesHelper, 'visible')
    }
  }

  update() {
    if (this.galaxy) {
      this.galaxy.update()
    }
  }
}
