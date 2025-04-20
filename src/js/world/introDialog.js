import Typed from 'typed.js'

export default class IntroDialog {
  constructor() {
    // DOM elements
    this.dialogText = document.getElementById('dialogText')
    this.dialogContainer = this.dialogText.closest('.fixed')
    // 常规介绍内容
    this.introContent = [
      '本专栏的愿景是通过分享 Three.js 的中高级应用和实战技巧，帮助开发者更好地将 3D 技术应用到实际项目中，打造令人印象深刻的 Hero Section。',
      '我们希望通过本专栏的内容，能够激发开发者的创造力，推动 Web3D 技术的普及和应用。',
      '我是一位 Three.js 和计算机图形学爱好者，拥有前端开发的专业背景。我热衷于使用现代 JavaScript 框架和库创建视觉震撼且高度交互的网页体验。',
      '技术栈：JavaScript (ES6+)、Three.js、Vue.js、HTML & CSS、WebGL。擅长构建动态和响应式的用户界面。',
      '如果您对 Web 开发和计算机图形学领域的合作感兴趣，欢迎通过以下方式联系我：\nWeChat: hexianWeb\nEmail: hexianweb@gmail.com',
      '我热爱探索新技术，喜欢研究前沿的 Web3D 开发技术。',
      '此外，如果您很喜欢 Threejs 又在烦恼其原生开发的繁琐，那么我诚邀您尝试  Tresjs 和 TvTjs, 他们都是基于 Vue 的 Threejs 框架。 ',
      'TvTjs 也为您提供了大量的可使用案例，并且拥有较为活跃的开发社区，在这里你能碰到志同道合的朋友一起做开源！',
      '如果您对 Threejs 这个 3D 图像框架很感兴趣，或者您也深信未来国内会涌现越来越多 3D 设计风格的网站，欢迎加入 ice 图形学社区。',
      '这里是国内 Web 图形学最全的知识库，致力于打造一个全新的图形学生态体系！您可以在认证达人里找到我这个 Threejs 爱好者和其他大佬。',
    ]
    // 交互区域内容
    this.interactionContent = {
      bed_area: '这是我的休息区，',
      beer_area: '这是我的收藏区，',
      workbench_area: '这是我的技能区，',
      weapon_area: '这里展示了我参与过的项目经验，',
      dining_area: '这里记录了我的一些生活爱好，',
      kitchen_area: '这里是我的个人技能展示区，',
      well_area: '这里是我的厨房',
    }

    this.currentIndex = 0
    this.typed = null
    this.isVisible = true
    this.hideTimer = null // 添加隐藏计时器
    this.introLoopTimer = null // 添加轮询计时器
    this.lastInteractionTime = Date.now() // 记录最后一次交互时间
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
          }, 5000)
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
      if (timeSinceLastInteraction >= 5000) {
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
  }
}
