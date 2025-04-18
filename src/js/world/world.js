import * as THREE from 'three' // 引入 THREE 用于 Vector3
import Experience from '../experience.js'
import Area from './area.js'
import Effects from './effect.js'
import Environment from './environment.js'
import EventPoint from './eventPoint.js' // 引入事件点类
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
      this.area = new Area()
      this.hero = new Hero()
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
    // === 测试事件点: 坐标原点附近 ===
    const originPoint = new EventPoint(
      new THREE.Vector3(0, 0, 0), // 目标位置 (略高于地面)
      1.2, // 触发半径
      () => { // 触发时的回调函数
        alert('你已到达坐标原点附近！')
        // console.warn('你已到达坐标原点附近！ (事件点触发)') // 使用 console.warn 代替 alert
      },
      true, // 只触发一次
    )
    this.eventPointManager.addEventPoint(originPoint) // 将事件点添加到管理器

    // === 在这里添加更多事件点 ===
    // 例如：靠近某个物体时触发对话
    // const dialoguePosition = new THREE.Vector3(5, 1, 2);
    // const dialogueTrigger = new EventPoint(
    //   dialoguePosition,
    //   2.5,
    //   () => {
    //     console.log('靠近物体，准备显示对话框...');
    //     // 调用 UI 管理器显示对话框
    //   },
    //   true
    // );
    // this.eventPointManager.addEventPoint(dialogueTrigger);
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
  }

  resize() {
    this.effects.resize()
    // 更新岩浆效果尺寸
    if (this.lava) {
      this.lava.resize()
    }
  }
}
