import Experience from '../experience.js'

/**
 * 事件触发点类
 * 用于检测英雄角色是否靠近特定位置并触发回调
 */
export default class EventPoint {
  /**
   * @param {THREE.Vector3} targetPosition 目标触发位置
   * @param {number} radius 触发半径
   * @param {Function} callback 触发时执行的回调函数
   * @param {boolean} [triggerOnce] 事件是否只触发一次
   */
  constructor(targetPosition, radius, callback, triggerOnce = true) {
    this.experience = new Experience()
    this.hero = this.experience.world?.hero // 获取英雄实例 (初始可能为 null)
    this.targetPosition = targetPosition // 目标位置
    this.radius = radius // 触发半径
    this.callback = callback // 回调函数
    this.triggerOnce = triggerOnce // 是否只触发一次

    this.triggered = false // 标记事件是否已被触发
    this.isHeroNearby = false // 标记英雄当前是否在半径内

    // 确保英雄实例可用
    if (!this.hero) {
      console.warn('事件点构造函数中英雄实例尚不可用，将在 update 中重试。')
    }
  }

  /**
   * 每帧更新，检查英雄位置并触发事件
   */
  update() {
    // 如果英雄实例尚不可用，则尝试再次获取
    if (!this.hero) {
      this.hero = this.experience.world?.hero
      if (!this.hero || !this.hero.hero) {
        // console.warn('事件点 update 中英雄或 hero.hero 不可用');
        return // 如果英雄仍然不可用，则退出
      }
    }

    const heroPosition = this.hero.hero.position // 获取英雄当前位置
    const distance = heroPosition.distanceTo(this.targetPosition) // 计算英雄与目标点的距离

    const wasHeroNearby = this.isHeroNearby // 记录上一帧英雄是否在附近
    this.isHeroNearby = distance < this.radius // 更新当前帧英雄是否在半径内

    // 检查英雄是否刚进入触发半径
    if (this.isHeroNearby && !wasHeroNearby) {
      // 如果事件尚未触发或允许重复触发，则执行回调
      if (!this.triggered || !this.triggerOnce) {
        console.warn(`英雄进入触发区域: ${this.targetPosition.toArray().join(',')}`)
        this.callback()
        this.triggered = true // 标记为已触发
      }
    }
    // 可选: 如果英雄离开区域且 triggerOnce 为 true，可以重置触发状态
    // else if (!this.isHeroNearby && wasHeroNearby && this.triggerOnce) {
    //   // console.warn('英雄离开触发区域，若 triggerOnce=true 则可再次触发');
    //   // 如果希望离开后能再次触发:
    //   // this.triggered = false;
    // }

    // 如果不允许只触发一次 (triggerOnce is false)，则在英雄离开时重置触发状态
    if (!this.isHeroNearby && wasHeroNearby && !this.triggerOnce) {
      console.warn(`英雄离开触发区域: ${this.targetPosition.toArray().join(',')}`)
      this.triggered = false // 允许非一次性事件重新触发
    }
  }
}
