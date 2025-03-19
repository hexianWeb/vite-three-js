import Typed from 'typed.js'

export default class IntroDialog {
  constructor() {
    // DOM elements
    this.dialogText = document.getElementById('dialogText')
    this.dialogContainer = this.dialogText.closest('.fixed')

    // Introduction content
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

    this.currentIndex = 0
    this.typed = null
    this.isVisible = true

    // Initialize the dialog
    this.initializeDialog()
  }

  initializeDialog() {
    // Initial setup of Typed.js
    this.setupTyped()

    // Start the content rotation
    this.startContentRotation()
  }

  setupTyped() {
    if (this.typed) {
      this.typed.destroy()
    }

    this.typed = new Typed(this.dialogText, {
      strings: [this.introContent[this.currentIndex]],
      typeSpeed: 50,
      backSpeed: 30,
      showCursor: true,
      cursorChar: '|',
      onComplete: () => {
        // After typing is complete, wait 5s then hide
        setTimeout(() => this.hideDialog(), 5000)
      },
    })
  }

  hideDialog() {
    this.isVisible = false
    this.dialogContainer.style.transition = 'opacity 0.5s ease-out'
    this.dialogContainer.style.opacity = '0'

    // After hiding, wait 2s then show next content
    setTimeout(() => {
      this.showNextContent()
    }, 2000)
  }

  showDialog() {
    this.isVisible = true
    this.dialogContainer.style.opacity = '1'
    this.setupTyped()
  }

  showNextContent() {
    // Update current index
    this.currentIndex = (this.currentIndex + 1) % this.introContent.length

    // Clear the text
    this.dialogText.textContent = ''

    // Show dialog with new content
    this.showDialog()
  }

  startContentRotation() {
    // Initial display
    this.showDialog()
  }
}
