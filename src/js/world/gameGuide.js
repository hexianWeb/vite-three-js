import Experience from '../experience'
import I18nManager from '../i18n/i18nManager'
import EventEmitter from '../utils/event-emitter'

export default class GameGuide extends EventEmitter {
  constructor() {
    super()
    this.experience = new Experience()
    this.i18n = new I18nManager()

    // 监听语言变更事件
    this.on('languageChanged', () => this.updateTranslations())

    this.createGuideDialog()
    this.setupEventListeners()
  }

  updateTranslations() {
    // 更新所有文本内容
    const guideDialog = document.getElementById('gameGuideDialog')
    if (!guideDialog)
      return

    // 更新标题和子标题
    guideDialog.querySelector('h2').textContent = this.i18n.t('guide.title')
    guideDialog.querySelectorAll('h3').forEach((h3, index) => {
      switch (index) {
        case 0:
          h3.textContent = this.i18n.t('guide.basic_controls')
          break
        case 1:
          h3.textContent = this.i18n.t('guide.special_actions')
          break
        case 2:
          h3.textContent = this.i18n.t('guide.interaction_tips')
          break
        case 3:
          h3.textContent = this.i18n.t('guide.button_controls')
          break
      }
    })

    // 更新按钮文本
    guideDialog.querySelector('#moveText').textContent = this.i18n.t('guide.move')
    guideDialog.querySelector('#jumpText').textContent = this.i18n.t('guide.jump')
    guideDialog.querySelector('#sitText').textContent = this.i18n.t('guide.sit')
    guideDialog.querySelector('#interactText').textContent = this.i18n.t('guide.interact')
    guideDialog.querySelector('#interactionTip').textContent = this.i18n.t('guide.interaction_tip')
    guideDialog.querySelector('#confirmBtn').textContent = this.i18n.t('guide.confirm')

    // 更新界面按钮说明文本
    guideDialog.querySelector('#dayNightText').textContent = this.i18n.t('guide.day_night')
    guideDialog.querySelector('#menuText').textContent = this.i18n.t('guide.menu')
    guideDialog.querySelector('#languageText').textContent = this.i18n.t('guide.language')
    guideDialog.querySelector('#iconText').textContent = this.i18n.t('guide.icon')
    guideDialog.querySelector('#guideButtonText').textContent = this.i18n.t('guide.guide_button')
    guideDialog.querySelector('#championText').textContent = this.i18n.t('guide.champion')
  }

  createGuideDialog() {
    // 创建指引对话框的HTML结构
    const guideDialog = document.createElement('div')
    guideDialog.id = 'gameGuideDialog'
    guideDialog.className = 'fixed inset-0 z-[9998] hidden'

    guideDialog.innerHTML = `
      <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      <div class="relative flex items-center justify-center min-h-screen p-4">
        <div class=" backdrop-blur-md rounded-lg shadow-xl max-w-2xl w-full p-8 relative pixel">
          <h2 class="text-3xl font-pixelify text-gray-200 mb-6">${this.i18n.t('guide.title')}</h2>
          
          <!-- 基本移动控制 -->
          <div class="mb-8">
            <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.basic_controls')}</h3>
            <div class="grid grid-cols-2 gap-6">
              <div class="flex items-center gap-4">
                <div class="flex flex-col items-center gap-2">
                  <img src="/keyboard/keyboard_arrows.png" alt="方向键" class="w-24 h-24 pixel-art">
                  <p id="moveText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.move')}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex flex-col items-center gap-2">
                  <img src="/keyboard/keyboard_space.png" alt="空格键" class="w-24 h-24 pixel-art">
                  <p id="jumpText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.jump')}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 特殊动作 -->
          <div class="mb-8">
            <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.special_actions')}</h3>
            <div class="grid grid-cols-2 gap-6">
              <div class="flex items-center gap-4">
                <div class="flex flex-col items-center gap-2">
                  <img src="/keyboard/keyboard_z.png" alt="Z键" class="w-24 h-24 pixel-art">
                  <p id="sitText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.sit')}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex flex-col items-center gap-2">
                  <img src="/keyboard/keyboard_f.png" alt="F键" class="w-24 h-24 pixel-art">
                  <p id="interactText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.interact')}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 互动提示 -->
          <div class="mb-8">
            <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.interaction_tips')}</h3>
            <div class="flex items-center gap-4 bg-slate-100 p-4 rounded-lg">
              <img src="/icon/marker.png" alt="感叹号图标" class="w-8 h-8">
                <p id="interactionTip" class="text-lg font-pixelify text-black">${this.i18n.t('guide.interaction_tip')}</p>
            </div>
          </div>

          <!-- 界面按钮说明 -->
          <div class="mb-8">
            <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.button_controls')}</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/sun.png" alt="昼夜切换" class="w-12 h-12 pixel-art">
                <p id="dayNightText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.day_night')}</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/menu.png" alt="菜单" class="w-12 h-12 pixel-art">
                <p id="menuText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.menu')}</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/i18n.png" alt="语言切换" class="w-12 h-12 pixel-art">
                <p id="languageText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.language')}</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/icon.png" alt="个人主页" class="w-12 h-12 pixel-art">
                <p id="iconText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.icon')}</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/new.png" alt="操作指南" class="w-12 h-12 pixel-art">
                <p id="guideButtonText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.guide_button')}</p>
              </div>
              <div class="flex flex-col items-center gap-2">
                <img src="/icon/champion.png" alt="排行榜" class="w-12 h-12 pixel-art">
                <p id="championText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.champion')}</p>
              </div>
            </div>
          </div>

          <!-- 确认按钮 -->
          <div class="flex justify-center mt-6">
            <button id="confirmBtn" class="px-8 py-3 bg-blue-500 text-white font-pixelify rounded-lg hover:bg-blue-600 transition-colors pixel-border2">
              ${this.i18n.t('guide.confirm')}
            </button>
          </div>

          <button id="closeGuideBtn" class="absolute top-4 right-4 text-slate-700 hover:text-slate-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    `

    document.body.appendChild(guideDialog)
  }

  setupEventListeners() {
    // 关闭按钮事件
    const closeBtn = document.getElementById('closeGuideBtn')
    closeBtn.addEventListener('click', () => this.hideGuide())

    // 新手指引按钮事件
    const newButton = document.getElementById('newButton')
    newButton.addEventListener('click', () => this.showGuide())

    // 确认按钮事件
    const confirmBtn = document.getElementById('confirmBtn')
    confirmBtn.addEventListener('click', () => {
      localStorage.setItem('hasCompletedGuide', 'true')
      this.hideGuide()
    })
  }

  showGuide() {
    const guideDialog = document.getElementById('gameGuideDialog')
    guideDialog.classList.remove('hidden')
  }

  hideGuide() {
    const guideDialog = document.getElementById('gameGuideDialog')
    guideDialog.classList.add('hidden')
  }
}
