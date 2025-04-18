import Experience from '../experience.js'

/**
 * 事件触发点管理器
 * 负责管理场景中所有的 EventPoint 实例
 */
export default class EventPointManager {
  constructor() {
    this.experience = new Experience()
    this.eventPoints = [] // 存储所有事件点实例的数组
  }

  /**
   * 添加一个新的事件点到管理器
   * @param {EventPoint} eventPoint - 要添加的 EventPoint 实例
   */
  addEventPoint(eventPoint) {
    // 校验传入的是否为有效的 EventPoint 实例
    if (!eventPoint || typeof eventPoint.update !== 'function') {
      console.error('向 EventPointManager 添加了无效的 EventPoint')
      return
    }
    this.eventPoints.push(eventPoint)
    console.warn(`添加事件点，目标位置: ${eventPoint.targetPosition?.toArray().join(',') || '未知位置'}`)
  }

  /**
   * (可选) 移除一个事件点
   * @param {EventPoint} eventPointToRemove - 要移除的 EventPoint 实例
   */
  removeEventPoint(eventPointToRemove) {
    this.eventPoints = this.eventPoints.filter(
      point => point !== eventPointToRemove, // 过滤掉要移除的事件点
    )
    console.warn(`移除事件点，目标位置: ${eventPointToRemove.targetPosition?.toArray().join(',') || '未知位置'}`)
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
}
