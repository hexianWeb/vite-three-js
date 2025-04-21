import * as THREE from 'three'
import Experience from '../experience.js'
import EventPointCSS2D from './eventPointCSS2D.js'

/**
 * 事件触发点类
 * 用于检测英雄角色是否靠近特定位置并触发回调
 */
export default class EventPoint {
  /**
   * @param {THREE.Vector3} targetPosition 目标触发位置
   * @param {number} radius 触发半径
   * @param {Function} callback 触发时执行的回调函数
   * @param {string} [interactionText] 交互提示文本
   * @param {string} [iconName] 交互图标名称
   */
  constructor(targetPosition, radius, callback, interactionText = '按 F 键互动', iconName = 'chat.png') {
    this.experience = new Experience()
    this.hero = this.experience.world?.hero // 获取英雄实例 (初始可能为 null)
    this.targetPosition = targetPosition // 目标位置
    this.radius = radius // 触发半径
    this.callback = callback // 回调函数
    this.interactionText = interactionText // 交互提示文本
    this.iconName = iconName // 交互图标名称

    this.isHeroNearby = false // 标记英雄当前是否在半径内
    this.isInteractionAvailable = false // 标记是否可以进行交互
    this.isKeyPressed = false // 标记F键是否正在被按下

    // 创建动态 CSS2D 管理器（跟随角色）
    this.css2dManager = new EventPointCSS2D()
    this.experience.scene.add(this.css2dManager.getObject())

    // 创建固定位置的 CSS2D 标识（标记互动点）
    this.fixedCss2dManager = new EventPointCSS2D()
    this.fixedCss2dManager.getObject().position.copy(this.targetPosition)
    this.fixedCss2dManager.getObject().position.y += 2 // 在目标位置上方2个单位
    this.experience.scene.add(this.fixedCss2dManager.getObject())
    this.fixedCss2dManager.showInteractionPrompt(this.targetPosition, 'marker.png') // 使用一个标记图标

    // 创建辅助球体来可视化交互范围（调试用）
    if (this.experience.debug?.active) {
      this.createDebugSphere()
    }

    // 绑定按键事件
    this.setupEventListeners()
  }

  /**
   * 创建用于调试的交互范围可视化球体
   */
  createDebugSphere() {
    const geometry = new THREE.SphereGeometry(this.radius, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00FF00,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    })
    this.debugSphere = new THREE.Mesh(geometry, material)
    this.debugSphere.position.copy(this.targetPosition)
    this.experience.scene.add(this.debugSphere)
  }

  /**
   * 设置按键事件监听
   */
  setupEventListeners() {
    // 监听 F 键按下事件
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'f' && !this.isKeyPressed && this.isInteractionAvailable) {
        this.isKeyPressed = true
        this.triggerInteraction()
      }
    })

    // 监听 F 键释放事件
    window.addEventListener('keyup', (e) => {
      if (e.key.toLowerCase() === 'f') {
        this.isKeyPressed = false
      }
    })
  }

  /**
   * 触发交互事件
   */
  triggerInteraction() {
    if (this.isInteractionAvailable) {
      this.callback()
    }
  }

  /**
   * 显示交互提示
   */
  showInteractionPrompt() {
    // 使用英雄当前位置而不是目标位置
    const heroPosition = this.hero.hero.position
    this.css2dManager.showInteractionPrompt(heroPosition, this.iconName)
  }

  /**
   * 隐藏交互提示
   */
  hideInteractionPrompt() {
    this.css2dManager.hideInteractionPrompt()
  }

  /**
   * 每帧更新，检查英雄位置并更新状态
   */
  update() {
    // 如果英雄实例尚不可用，则尝试再次获取
    if (!this.hero) {
      this.hero = this.experience.world?.hero
      if (!this.hero || !this.hero.hero) {
        return // 如果英雄仍然不可用，则退出
      }
    }

    const heroPosition = this.hero.hero.position // 获取英雄当前位置
    const distance = heroPosition.distanceTo(this.targetPosition) // 计算英雄与目标点的距离

    const wasHeroNearby = this.isHeroNearby // 记录上一帧英雄是否在附近
    this.isHeroNearby = distance < this.radius // 更新当前帧英雄是否在半径内

    // 更新交互可用状态
    this.isInteractionAvailable = this.isHeroNearby

    // 处理状态变化
    if (this.isHeroNearby !== wasHeroNearby) {
      if (this.isHeroNearby) {
        // 英雄进入范围
        this.showInteractionPrompt()
        if (this.debugSphere) {
          this.debugSphere.material.color.setHex(0xFF0000)
        }
      }
      else {
        // 英雄离开范围
        this.hideInteractionPrompt()
        if (this.debugSphere) {
          this.debugSphere.material.color.setHex(0x00FF00)
        }
      }
    }

    // 如果英雄在范围内，持续更新图标位置
    if (this.isHeroNearby) {
      this.css2dManager.updatePosition(heroPosition)
    }

    // 更新调试球体的颜色（如果存在）
    if (this.debugSphere && this.isInteractionAvailable) {
      this.debugSphere.material.opacity = 0.5
    }
    else if (this.debugSphere) {
      this.debugSphere.material.opacity = 0.3
    }
  }

  /**
   * 销毁事件点
   */
  destroy() {
    // 移除按键事件监听器
    window.removeEventListener('keydown', this.setupEventListeners)
    window.removeEventListener('keyup', this.setupEventListeners)

    // 移除动态 CSS2D 对象
    this.experience.scene.remove(this.css2dManager.getObject())
    this.css2dManager.destroy()

    // 移除固定位置的 CSS2D 对象
    this.experience.scene.remove(this.fixedCss2dManager.getObject())
    this.fixedCss2dManager.destroy()

    // 移除调试球体（如果存在）
    if (this.debugSphere) {
      this.experience.scene.remove(this.debugSphere)
      this.debugSphere.geometry.dispose()
      this.debugSphere.material.dispose()
    }
  }
}
