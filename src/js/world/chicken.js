import gsap from 'gsap'
import * as THREE from 'three'
import Experience from '../experience.js'
import EventPointCSS2D from './eventPointCSS2D.js'

export default class Chicken {
  constructor() {
    // 获取核心实例
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time
    this.debug = this.experience.debug

    // GSAP bounce 缓动函数
    this.bounceEase = gsap.parseEase('bounce.out')

    // 小鸡参数
    this.chickenParams = {
      scale: 0.7,
      position: { x: 22, y: -0.43, z: 3.48 },
      jumpLength: 1, // 跳跃长度（可调）
    }

    // 跳跃动画状态
    this.jumpState = {
      direction: -1, // -1: 向左, 1: 向右
      step: 0, // 当前是第几跳（0-3）
      startX: this.chickenParams.position.x,
      startTime: this.time.elapsed * 0.001,
    }

    // 小鸡模型对象
    this.chickenObject = null
    // 交互提示
    this.interactionPrompt = new EventPointCSS2D()

    // 初始化
    this.initChicken()

    // 调试面板
    if (this.debug.active) {
      this.debugInit()
    }
  }

  // 初始化小鸡模型
  initChicken() {
    const chickenResource = this.resources.items.chickenModel
    if (chickenResource && chickenResource.scene) {
      this.chickenObject = chickenResource.scene
      this.chickenObject.name = 'chickenModel'
      this.chickenObject.scale.setScalar(this.chickenParams.scale)
      this.chickenObject.position.set(
        this.chickenParams.position.x,
        this.chickenParams.position.y,
        this.chickenParams.position.z,
      )
      this.scene.add(this.chickenObject)
      // 添加交互提示到场景
      this.scene.add(this.interactionPrompt.getObject())
    }
  }

  // 更新动画
  update() {
    if (!this.chickenObject)
      return
    // 跳跃动画参数
    const bounceDuration = 0.5 // 每次跳跃时长（秒）
    const jumpCount = 4 // 每个方向跳几下
    const t = this.time.elapsed * 0.001
    let { direction, startX, startTime } = this.jumpState
    const progress = Math.min((t - startTime) / bounceDuration, 1)

    // 计算当前跳跃的起止点
    const jumpLength = this.chickenParams.jumpLength
    const fromX = startX
    const toX = startX + direction * jumpLength
    // 水平插值
    const x = THREE.MathUtils.lerp(fromX, toX, progress)
    this.chickenObject.position.x = x
    this.chickenObject.position.z = this.chickenParams.position.z
    // 跳跃高度（GSAP bounce 曲线）
    const bounceProgress = this.bounceEase(progress)
    const jumpHeight = bounceProgress * 0.28
    this.chickenObject.position.y = this.chickenParams.position.y + 0.22 + jumpHeight
    // squash & stretch
    const squash = 0.85 + 0.15 * bounceProgress
    const stretch = 1.0 + 0.15 * (1 - bounceProgress)
    const baseScale = this.chickenParams.scale
    this.chickenObject.scale.set(baseScale * stretch, baseScale * squash, baseScale * stretch)
    // 朝向调整
    this.chickenObject.rotation.y = direction === -1 ? -Math.PI / 2 : Math.PI / 2

    // 跳跃结束，切换到下一跳
    if (progress >= 1) {
      this.jumpState.step++
      this.jumpState.startX = toX
      this.jumpState.startTime = t
      // 跳两下后换方向
      if (this.jumpState.step >= jumpCount) {
        this.jumpState.direction *= -1
        this.jumpState.step = 0
      }
    }

    // 交互提示位置更新
    this.interactionPrompt.updatePosition(this.chickenObject.position)
  }

  // 显示交互提示
  showInteractionPrompt() {
    if (this.chickenObject) {
      // 克隆 this.chickenObject 的 position 属性
      const position = this.chickenObject.position.clone()
      position.y += 1.5 // 在目标位置上方1.5个单位
      this.interactionPrompt.showInteractionPrompt(position, 'pointer_a.png')
    }
  }

  // 隐藏交互提示
  hideInteractionPrompt() {
    this.interactionPrompt.hideInteractionPrompt()
  }

  // 点击事件（可在 area/onMouseDown 里调用）
  onClick() {
    window.open('https://cross-road-eight.vercel.app/', '_blank')
  }

  // 调试面板
  debugInit() {
    const chickenFolder = this.debug.ui.addFolder({
      title: '小鸡模型调试',
      expanded: true,
    })
    // 缩放调节
    chickenFolder.addBinding(
      this.chickenParams,
      'scale',
      {
        label: '缩放',
        min: 0.1,
        max: 5,
        step: 0.01,
      },
    )
    // 跳跃长度调节
    chickenFolder.addBinding(
      this.chickenParams,
      'jumpLength',
      {
        label: '跳跃长度',
        min: 0.5,
        max: 10,
        step: 0.1,
      },
    )
    // 位置调节
    const posFolder = chickenFolder.addFolder({
      title: '位置',
      expanded: true,
    })
    posFolder.addBinding(this.chickenParams.position, 'x', {
      label: 'X',
      min: -100,
      max: 100,
      step: 0.01,
    })
    posFolder.addBinding(this.chickenParams.position, 'y', {
      label: 'Y',
      min: -10,
      max: 10,
      step: 0.01,
    })
    posFolder.addBinding(this.chickenParams.position, 'z', {
      label: 'Z',
      min: -100,
      max: 100,
      step: 0.01,
    })
  }
}
