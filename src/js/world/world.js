import * as THREE from 'three'

import LensFlare from '../components/LensFlare.js'
import Experience from '../experience.js'
import Environment from './environment.js'
import Galaxy from './galaxy.js'
import Planets from './planets.js'

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

      // 创建三星系统
      this.planets = new Planets()

      // 初始化镜头光晕效果
      this.lensFlare = new LensFlare()
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

      // Lens Flare 调试入口
      if (this.lensFlare) {
        const lensFolder = this.debug.addFolder({
          title: 'Lens Flare 入口',
          expanded: true,
        })
        lensFolder.addBinding(this.lensFlare.params, 'enabled', {
          label: '启用 Lens Flare',
        }).on('change', () => {
          if (this.lensFlare.lensFlareContainer) {
            this.lensFlare.lensFlareContainer.visible = this.lensFlare.params.enabled
          }
        })
        lensFolder.addBinding(this.lensFlare.lensFlareContainer, 'visible', {
          label: '可见性',
        })
        // 其他关键参数可以在这里代理，或直接使用组件的面板
      }
    }
  }

  update() {
    if (this.galaxy) {
      this.galaxy.update()
    }

    // 更新三星系统
    if (this.planets) {
      this.planets.update()
    }

    // 更新 Lens Flare
    if (this.lensFlare) {
      this.lensFlare.update()
    }
  }
}
