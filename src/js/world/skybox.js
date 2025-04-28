import * as THREE from 'three'
import Experience from '../experience.js'
import DayNightManager from '../ui/day-night-manager.js'

// 天空盒类，负责根据日夜切换动态更换贴图
export default class Skybox {
  constructor() {
    // 获取 Experience 单例实例
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    // 记录当前贴图类型
    this.isNight = false

    // 创建球体天空盒
    this.createSkybox()

    // 监听日夜切换
    this.dayNightManager = new DayNightManager()
    this.dayNightManager.on('dayNightToggle', (isNight) => {
      this.switchTexture(isNight)
    })

    // 调试面板
    if (this.debug.active) {
      this.debugInit()
    }
  }

  // 创建天空盒球体
  createSkybox() {
    // 创建球体几何体
    this.geometry = new THREE.SphereGeometry(128)
    // 默认使用白天贴图
    this.resources.items.dayTexture.colorSpace = THREE.SRGBColorSpace
    this.material = new THREE.MeshBasicMaterial({
      map: this.resources.items.dayTexture,
      side: THREE.BackSide,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  // 切换天空盒贴图
  switchTexture(isNight) {
    this.isNight = isNight
    const texture = isNight ? this.resources.items.nightTexture : this.resources.items.dayTexture
    texture.colorSpace = THREE.SRGBColorSpace
    this.material.map = texture
    this.material.needsUpdate = true
  }

  // 调试面板
  debugInit() {
    this.debugFolder = this.debug.ui.addFolder({
      title: '天空盒',
      expanded: false,
    })
    this.debugFolder.addBinding(this, 'isNight', {
      label: '夜间模式',
      readonly: true,
    })
  }
}
