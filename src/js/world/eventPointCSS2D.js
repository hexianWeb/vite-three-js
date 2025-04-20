import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

/**
 * EventPoint CSS2D 管理类
 * 用于管理事件点的 CSS2D 显示
 */
export default class EventPointCSS2D {
  constructor() {
    // 创建新的交互图标容器
    this.iconContainer = document.createElement('div')
    this.iconContainer.className = 'hidden'

    // 创建图标图片元素
    this.iconImage = document.createElement('img')
    this.iconImage.className = 'w-12 h-8 pixel-art transition-opacity duration-300 opacity-0'
    this.iconContainer.appendChild(this.iconImage)

    // 将容器添加到 body
    document.body.appendChild(this.iconContainer)

    // 创建 CSS2D 对象
    this.css2dObject = new CSS2DObject(this.iconContainer)

    // 跟踪状态
    this.isVisible = false
  }

  /**
   * 显示交互提示
   * @param {THREE.Vector3} position - 显示位置
   * @param {string} iconName - 图标名称
   */
  showInteractionPrompt(position, iconName = 'chat.png') {
    // 更新图标
    this.iconImage.src = `/icon/${iconName}`

    // 设置位置
    this.updatePosition(position)

    // 显示图标
    this.iconContainer.classList.remove('hidden')
    // 使用 requestAnimationFrame 确保在下一帧添加 opacity
    requestAnimationFrame(() => {
      this.iconImage.classList.remove('opacity-0')
    })

    this.isVisible = true
  }

  /**
   * 更新位置
   * @param {THREE.Vector3} position - 新位置
   */
  updatePosition(position) {
    if (this.isVisible && position) {
      this.css2dObject.position.copy(position)
      this.css2dObject.position.y += 1.5 // 在目标位置上方1.5个单位
    }
  }

  /**
   * 隐藏交互提示
   */
  hideInteractionPrompt() {
    this.iconImage.classList.add('opacity-0')
    // 等待过渡动画完成后隐藏容器
    this.iconContainer.classList.add('hidden')
    this.isVisible = false
  }

  /**
   * 获取 CSS2D 对象
   * @returns {CSS2DObject}
   */
  getObject() {
    return this.css2dObject
  }

  /**
   * 销毁实例
   */
  destroy() {
    // 从 DOM 中移除容器
    if (this.iconContainer && this.iconContainer.parentNode) {
      this.iconContainer.parentNode.removeChild(this.iconContainer)
    }
  }
}
