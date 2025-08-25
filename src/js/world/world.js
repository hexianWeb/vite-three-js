import * as THREE from 'three'

import Experience from '../experience.js'
import Environment from './environment.js'
import Galaxy from './galaxy.js'
import Plant from './plant.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug.ui
    this.debugActive = this.experience.debug.active

    this.axesHelper = new THREE.AxesHelper(5)
    this.axesHelper.visible = false
    this.scene.add(this.axesHelper)

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.galaxy = new Galaxy()

      // 创建星球实例，传入半径和纹理参数
      this.plant = new Plant({
        radius: 0.5,
        texture: 'planetTexture',
      })
      // 设置星球初始属性
      this.plant.setPosition(3, 0, 0) // 将星球放在 x=3 的位置
      this.plant.setRotationSpeed(0.2, 1.0) // 设置自转速度
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

    // 更新星球
    if (this.plant) {
      this.plant.update()
    }
  }
}
