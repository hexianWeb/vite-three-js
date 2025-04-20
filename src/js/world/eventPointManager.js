import Experience from '../experience.js'
import EventPoint from './eventPoint.js'

/**
 * 事件触发点管理器
 * 负责管理场景中所有的 EventPoint 实例
 */
export default class EventPointManager {
  constructor() {
    this.experience = new Experience()
    this.eventPoints = new Map() // 使用 Map 存储事件点，键为唯一标识符
    this.debug = this.experience.debug

    // 如果调试模式激活，创建调试面板
    if (this.debug?.active) {
      this.createDebugPanel()
    }
  }

  /**
   * 创建调试面板
   */
  createDebugPanel() {
    this.debugFolder = this.debug.ui.addFolder({
      title: '交互点管理器',
      expanded: false,
    })

    // 添加显示/隐藏所有交互范围的开关
    this.debugFolder.addBinding(
      {
        showAllTriggers: false,
      },
      'showAllTriggers',
      {
        label: '显示所有交互范围',
      },
    ).on('change', (event) => {
      this.eventPoints.forEach((point) => {
        if (point.debugSphere) {
          point.debugSphere.visible = event.value
        }
      })
    })
  }

  /**
   * 添加一个新的事件点到管理器
   * @param {string} id 事件点的唯一标识符
   * @param {THREE.Vector3} position 事件点位置
   * @param {number} radius 触发半径
   * @param {Function} callback 触发时执行的回调函数
   * @param {string} [interactionText] 交互提示文本
   * @param {string} [iconName] 交互图标名称
   * @returns {EventPoint} 创建的事件点实例
   */
  createEventPoint(id, position, radius, callback, interactionText, iconName) {
    // 检查是否已存在同ID的事件点
    if (this.eventPoints.has(id)) {
      console.warn(`事件点 ${id} 已存在，将被替换`)
      this.removeEventPoint(id)
    }

    // 创建新的事件点
    const eventPoint = new EventPoint(position, radius, callback, interactionText, iconName)
    this.eventPoints.set(id, eventPoint)

    console.warn(`创建事件点 ${id}，位置: ${position.toArray().join(',')}`)
    return eventPoint
  }

  /**
   * 移除指定ID的事件点
   * @param {string} id 要移除的事件点ID
   */
  removeEventPoint(id) {
    const eventPoint = this.eventPoints.get(id)
    if (eventPoint) {
      eventPoint.destroy() // 清理事件点资源
      this.eventPoints.delete(id)
      console.warn(`移除事件点 ${id}`)
    }
  }

  /**
   * 获取指定ID的事件点
   * @param {string} id 事件点ID
   * @returns {EventPoint|undefined} 事件点实例或undefined
   */
  getEventPoint(id) {
    return this.eventPoints.get(id)
  }

  /**
   * 清除所有事件点
   */
  clearAllEventPoints() {
    this.eventPoints.forEach((point, id) => {
      point.destroy()
      console.warn(`清理事件点 ${id}`)
    })
    this.eventPoints.clear()
  }

  /**
   * 每帧更新，调用所有受管理事件点的 update 方法
   */
  update() {
    // 如果英雄模型尚未完全加载，则不执行更新
    if (!this.experience.world?.hero?.hero) {
      // console.warn('EventPointManager update skipped: Hero not ready');
      return
    }
    // 遍历并更新所有事件点
    this.eventPoints.forEach((point) => {
      point.update()
    })
  }

  /**
   * 销毁管理器
   * 清理所有事件点和相关资源
   */
  destroy() {
    this.clearAllEventPoints()
    // 移除事件监听器等其他清理工作
  }
}
