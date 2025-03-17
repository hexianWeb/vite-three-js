import Experience from '../experience.js'

export default class BrandDialog {
  constructor() {
    this.experience = new Experience()

    // DOM elements
    this.dialogElement = document.getElementById('brandDialog')
    this.dialogTitle = document.getElementById('dialogTitle')
    this.dialogContent = document.getElementById('dialogContent')
    this.dialogImage = document.getElementById('dialogImage')
    this.dialogUrl = document.getElementById('dialogUrl')
    this.dialogClose = document.getElementById('dialogClose')

    // Brand content
    this.brandContent = {
      brand1: {
        title: '2024年了，前端人是时候给予页面一点 Hero Section 魔法了！！！ (Three.js)',
        content: 'This article is an intermediate-level course on Three.js, and it assumes that you have some prior knowledge of Three.js. However, you don\'t need to worry, as this course will not involve shaders at all. Feel free to dive in!',
        imageUrl: '/assets/images/hero.gif',
        url: 'https://juejin.cn/post/7415504438922592294',
      },
      brand2: {
        title: '2025 年了，我不允许有前端不会用 Trae 让页面 Hero Section 变得高级！！！(Threejs)',
        content: 'The Hero Section is the top area of a website\'s homepage, typically featuring eye-catching images, headlines, and brief descriptions designed to capture visitors\' attention and guide them to explore the site further. This section is often the most prominent and crucial part of a website. Through thoughtful design and content selection, it can pique visitors\' interest, enhance user experience, and boost the site\'s overall appeal. Let\'s take a look at today\'s Hero Section and see if it meets your expectations! Of course, the source code will be provided at the end of the article!',
        imageUrl: '/assets/images/FM2.gif',
        url: 'https://juejin.cn/post/7472650702340046886',
      },
      brand3: {
        title: '老板花一万大洋让我写的艺术工作室官网？！ HeroSection 再度来袭！(Three.js)',
        content: 'Hello everyone! It\'s been half a month since my last post, and I almost turned back into that familiar "old procrastinator." No, I can\'t let myself fall into that trap! I haven\'t yet brought Web3D to the masses, and I haven\'t let more people experience the charm of 3D graphics (actually, I haven\'t made any money yet). With these thoughts in mind, I\'ve decided to pull myself together and continue bringing you more advanced content about Three.js and Shaders.',
        imageUrl: '/assets/images/FM3.gif',
        url: 'https://juejin.cn/post/7478403990141796352',
      },
    }

    // Initialize event listeners
    this.dialogClose.addEventListener('click', this.closeDialog.bind(this))

    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.dialogElement.classList.contains('hidden')) {
        this.closeDialog()
      }
    })

    // Add click event on backdrop to close dialog
    this.dialogElement.addEventListener('click', (event) => {
      // Close only if clicking on the backdrop, not the dialog content
      if (event.target === this.dialogElement || event.target === this.dialogElement.firstElementChild) {
        this.closeDialog()
      }
    })
  }

  showDialog(brandName) {
    if (this.brandContent[brandName]) {
      const brandData = this.brandContent[brandName]

      // Set content based on brand
      this.dialogTitle.textContent = brandData.title
      this.dialogContent.textContent = brandData.content

      // Set image with loading state
      this.dialogImage.innerHTML = `
        <div class="w-full flex items-center justify-center py-8 bg-gray-100">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      `

      // Load image
      const img = new Image()
      img.onload = () => {
        this.dialogImage.innerHTML = `<img src="${brandData.imageUrl}" alt="${brandData.title}" class="w-full h-auto">`
      }
      img.onerror = () => {
        this.dialogImage.innerHTML = `
          <div class="w-full flex items-center justify-center py-8 bg-gray-100 text-gray-500">
            <span>图片加载失败</span>
          </div>
        `
      }
      img.src = brandData.imageUrl

      // Set URL
      this.dialogUrl.href = brandData.url
      this.dialogUrl.textContent = `访问 ${brandData.title}`

      // Show dialog with animation
      this.dialogElement.classList.remove('hidden')

      // Add animation classes
      const dialogContent = this.dialogElement.querySelector('.relative > div')
      dialogContent.classList.add('opacity-0', 'scale-95')

      // Force reflow
      void dialogContent.offsetWidth

      // Add transition
      dialogContent.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
      dialogContent.classList.remove('opacity-0', 'scale-95')
      dialogContent.classList.add('opacity-100', 'scale-100')
    }
  }

  closeDialog() {
    // Get dialog content
    const dialogContent = this.dialogElement.querySelector('.relative > div')

    // Add transition
    dialogContent.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in'
    dialogContent.classList.remove('opacity-100', 'scale-100')
    dialogContent.classList.add('opacity-0', 'scale-95')

    // Hide dialog after animation
    setTimeout(() => {
      this.dialogElement.classList.add('hidden')
      dialogContent.style.transition = ''
    }, 200)
  }
}
