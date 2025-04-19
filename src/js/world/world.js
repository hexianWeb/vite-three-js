import * as THREE from 'three' // 引入 THREE 用于 Vector3
import Experience from '../experience.js'
import Area from './area.js'
import Effects from './effect.js'
import Environment from './environment.js'
import EventPointManager from './eventPointManager.js' // 引入事件点管理器类
import Hero from './hero.js'
import Lava from './lava.js'
import Ocean from './ocean.js'
import PortalEffect from './portal-effect.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.eventPointManager = new EventPointManager() // 实例化事件点管理器
    this.scene.add(new THREE.AxesHelper(5))
    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.hero = new Hero()
      this.area = new Area()
      // 初始化岩浆效果
      this.lava = new Lava()
      // 初始化海洋
      this.ocean = new Ocean()
      // 初始化传送门效果
      this.portalEffect = new PortalEffect()

      // 英雄和其他资源准备好后，设置事件点
      this.setupEventPoints()
    })

    this.effects = new Effects()
  }

  /**
   * 设置场景中的所有事件触发点
   */
  setupEventPoints() {
    // 创建一个测试交互点在坐标原点
    this.eventPointManager.createEventPoint(
      'origin_test', // 交互点的唯一ID
      new THREE.Vector3(0, 0, 0), // 位置在坐标原点
      2, // 交互半径为2个单位
      () => {
        console.warn('触发了原点交互！按 F 键进行交互')
        // 这里可以添加更多交互逻辑，比如：
        // - 显示对话框
        // - 播放动画
        // - 触发事件
        // - 改变场景状态
      },
      '按 F 键查看原点信息', // 交互提示文本
    )

    // === 在这里添加更多交互点 ===
    // 示例：
    // this.eventPointManager.createEventPoint(
    //   'npc_1',
    //   new THREE.Vector3(5, 0, 5),
    //   2,
    //   () => { console.warn('与NPC对话') },
    //   '按 F 键与NPC对话'
    // )
  }

  update() {
    // Update hero if it exists
    if (this.hero) {
      this.hero.update()
    }
    // 更新岩浆效果
    if (this.lava) {
      this.lava.update()
    }
    if (this.environment) {
      this.environment.update()
    }
    // 更新海洋
    if (this.ocean) {
      this.ocean.update()
    }
    // 更新传送门效果
    if (this.portalEffect) {
      this.portalEffect.update()
    }
    this.effects.update()

    // 更新事件点管理器 (检查是否有事件触发)
    if (this.eventPointManager) {
      this.eventPointManager.update()
    }
    if (this.area) {
      this.area.update()
    }
  }

  resize() {
    this.effects.resize()
    // 更新岩浆效果尺寸
    if (this.lava) {
      this.lava.resize()
    }
  }
}
