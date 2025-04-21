import Typed from 'typed.js'
import I18nManager from '../i18n/i18nManager'
import EventEmitter from '../utils/event-emitter'

export default class IntroDialog extends EventEmitter {
  constructor() {
    super()

    // DOM elements
    this.dialogText = document.getElementById('dialogText')
    this.dialogContainer = this.dialogText.closest('.fixed')

    // 获取 i18n 管理器实例
    this.i18n = new I18nManager()

    // 初始化介绍内容
    this.introContent = [
      this.i18n.t('intro.vision'),
      this.i18n.t('intro.purpose'),
      this.i18n.t('intro.about'),
      this.i18n.t('intro.skills'),
      this.i18n.t('intro.contact'),
      this.i18n.t('intro.passion'),
      this.i18n.t('intro.frameworks'),
      this.i18n.t('intro.community'),
      this.i18n.t('intro.interest'),
      this.i18n.t('intro.knowledge'),
    ]

    // 交互区域内容
    this.interactionContent = {
      bed_area: this.i18n.t('areas.bed_area'),
      beer_area: this.i18n.t('areas.beer_area'),
      workbench_area: this.i18n.t('areas.workbench_area'),
      weapon_area: this.i18n.t('areas.weapon_area'),
      dining_area: this.i18n.t('areas.dining_area'),
      kitchen_area: this.i18n.t('areas.kitchen_area'),
      well_area: this.i18n.t('areas.well_area'),
    }

    this.currentIndex = 0
    this.typed = null
    this.isVisible = true
    this.hideTimer = null
    this.introLoopTimer = null
    this.lastInteractionTime = Date.now()

    // 监听语言变更事件
    this.on('languageChanged', () => this.updateTranslations())
  }

  /**
   * 更新所有翻译内容
   */
  updateTranslations() {
    // 更新介绍内容
    this.introContent = [
      this.i18n.t('intro.vision'),
      this.i18n.t('intro.purpose'),
      this.i18n.t('intro.about'),
      this.i18n.t('intro.skills'),
      this.i18n.t('intro.contact'),
      this.i18n.t('intro.passion'),
      this.i18n.t('intro.frameworks'),
      this.i18n.t('intro.community'),
      this.i18n.t('intro.interest'),
      this.i18n.t('intro.knowledge'),
    ]

    // 更新交互区域内容
    this.interactionContent = {
      bed_area: this.i18n.t('areas.bed_area'),
      beer_area: this.i18n.t('areas.beer_area'),
      workbench_area: this.i18n.t('areas.workbench_area'),
      weapon_area: this.i18n.t('areas.weapon_area'),
      dining_area: this.i18n.t('areas.dining_area'),
      kitchen_area: this.i18n.t('areas.kitchen_area'),
      well_area: this.i18n.t('areas.well_area'),
    }

    // 如果当前正在显示内容，重新显示当前内容的翻译
    if (this.isVisible) {
      const currentContent = this.typed ? this.typed.strings[0] : this.introContent[this.currentIndex]
      this.setupTyped(currentContent, true)
    }
  }

  setupTyped(content, autoHide = true) {
    if (this.typed) {
      this.typed.destroy()
    }

    // 清除之前的隐藏计时器
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.typed = new Typed(this.dialogText, {
      strings: [content],
      typeSpeed: 70,
      backSpeed: 30,
      showCursor: true,
      cursorChar: '|',
      onComplete: () => {
        if (autoHide) {
          // 设置新的隐藏计时器
          this.hideTimer = setTimeout(() => {
            this.hideDialog()
          }, 10000)
        }
      },
    })
  }

  hideDialog() {
    // 清除隐藏计时器
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
      this.hideTimer = null
    }

    this.isVisible = false
    this.dialogContainer.style.transition = 'opacity 0.5s ease-out'
    this.dialogContainer.style.opacity = '0'
  }

  showDialog() {
    this.isVisible = true
    this.dialogContainer.style.opacity = '1'
  }

  /**
   * 显示特定区域的内容
   * @param {string} areaId 区域ID
   */
  showAreaContent(areaId) {
    // 更新最后交互时间
    this.lastInteractionTime = Date.now()

    // 获取区域内容
    const content = this.interactionContent[areaId]
    if (!content) {
      console.warn(`未找到区域 ${areaId} 的内容`)
      return
    }

    // 清空文本
    this.dialogText.textContent = ''

    // 显示对话框和内容
    this.showDialog()
    this.setupTyped(content, true) // 自动隐藏
  }

  /**
   * 开始轮询显示介绍内容
   */
  startIntroContentLoop() {
    // 显示第一条内容
    this.setupTyped(this.introContent[0], false)
    this.currentIndex = 0

    // 设置轮询检查
    this.introLoopTimer = setInterval(() => {
      // 检查是否已经超过5秒没有交互
      const timeSinceLastInteraction = Date.now() - this.lastInteractionTime
      if (timeSinceLastInteraction >= 20000) {
        this.currentIndex = (this.currentIndex + 1) % this.introContent.length
        this.setupTyped(this.introContent[this.currentIndex], false)
      }
    }, 5000)
  }

  /**
   * 停止轮询
   */
  stopIntroContentLoop() {
    if (this.introLoopTimer) {
      clearInterval(this.introLoopTimer)
      this.introLoopTimer = null
    }
  }

  /**
   * 销毁实例
   */
  destroy() {
    this.stopIntroContentLoop()
    if (this.typed) {
      this.typed.destroy()
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
    }
    // 移除所有事件监听器
    this.off('languageChanged')
  }
}
