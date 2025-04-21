import * as THREE from 'three' // 引入 THREE 用于 Vector3
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import Experience from '../experience.js'
import Area from './area.js'
import Effects from './effect.js'
import Environment from './environment.js'
import EventPointManager from './eventPointManager.js' // 引入事件点管理器类
import Hero from './hero.js'
import IntroDialog from './introDialog.js'
import Lava from './lava.js'
import Ocean from './ocean.js'
import PortalEffect from './portal-effect.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.sizes = this.experience.sizes
    this.camera = this.experience.camera

    // 初始化对话框管理器
    this.introDialog = new IntroDialog()

    // 开始轮询显示介绍内容
    this.startIntroContentLoop()

    // 初始化 CSS2D 渲染器
    this.initCSS2DRenderer()

    this.eventPointManager = new EventPointManager() // 实例化事件点管理器
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
   * 开始轮询显示介绍内容
   */
  startIntroContentLoop() {
    // 显示第一条内容
    this.introDialog.startIntroContentLoop()
  }

  /**
   * 初始化 CSS2D 渲染器
   */
  initCSS2DRenderer() {
    this.css2dRenderer = new CSS2DRenderer()
    this.css2dRenderer.setSize(this.sizes.width, this.sizes.height)
    this.css2dRenderer.domElement.style.position = 'absolute'
    this.css2dRenderer.domElement.style.top = '0'
    this.css2dRenderer.domElement.style.pointerEvents = 'none'
    document.body.appendChild(this.css2dRenderer.domElement)
  }

  /**
   * 设置场景中的所有事件触发点
   */
  setupEventPoints() {
    // 床铺区域
    this.eventPointManager.createEventPoint(
      'bed_area',
      new THREE.Vector3(-15.91, -0.21, -10.34),
      3,
      () => {
        this.introDialog.showAreaContent('bed_area')
      },
      '按 F 键查看休息区信息',
    )

    // 啤酒区域
    this.eventPointManager.createEventPoint(
      'beer_area',
      new THREE.Vector3(-22.98, -0.21, -5.02),
      2,
      () => {
        this.introDialog.showAreaContent('beer_area')
      },
      '按 F 键查看收藏区信息',
    )

    // 工作台区域
    this.eventPointManager.createEventPoint(
      'workbench_area',
      new THREE.Vector3(-18.57, -0.21, -13.22),
      2,
      () => {
        this.introDialog.showAreaContent('workbench_area')
      },
      '按 F 键查看技能区信息',
    )

    // 武器区域
    this.eventPointManager.createEventPoint(
      'weapon_area',
      new THREE.Vector3(-12.68, -0.18, -7.16),
      2,
      () => {
        this.introDialog.showAreaContent('weapon_area')
      },
      '按 F 键查看项目经验',
    )

    // 用餐区域
    this.eventPointManager.createEventPoint(
      'dining_area',
      new THREE.Vector3(-10.71, 1.5, -12),
      2.5,
      () => {
        this.introDialog.showAreaContent('dining_area')
      },
      '按 F 键查看生活爱好',
    )

    // 厨房区域
    this.eventPointManager.createEventPoint(
      'kitchen_area',
      new THREE.Vector3(-22.69, 0.71, -1.39),
      2,
      () => {
        this.introDialog.showAreaContent('kitchen_area')
      },
      '按 F 键查看个人技能',
    )

    // 水井区域
    this.eventPointManager.createEventPoint(
      'well_area',
      new THREE.Vector3(-5.71, 0.76, -10.10),
      3,
      () => {
        this.introDialog.showAreaContent('well_area')
      },
      '按 F 键查看联系方式',
    )
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

    // 更新 CSS2D 渲染
    if (this.css2dRenderer && this.camera?.instance) {
      this.css2dRenderer.render(this.scene, this.camera.instance)
    }
  }

  resize() {
    this.effects.resize()
    // 更新岩浆效果尺寸
    if (this.lava) {
      this.lava.resize()
    }

    // 更新 CSS2D 渲染器尺寸
    if (this.css2dRenderer) {
      this.css2dRenderer.setSize(this.sizes.width, this.sizes.height)
    }
  }
}
