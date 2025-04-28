import Experience from '../experience'
import I18nManager from '../i18n/i18nManager'
import EventEmitter from '../utils/event-emitter'

export default class GameGuide extends EventEmitter {
  constructor() {
    super()
    this.experience = new Experience()
    this.i18n = new I18nManager()
    this.currentPage = 1 // Track current page
    this.totalPages = 2 // Total number of pages

    // 监听来自 Experience 实例的语言变更事件
    this.experience.languageSwitcher.on('languageChanged', () => this.updateTranslations())

    this.createGuideDialog()
    this.setupEventListeners()
    this.updatePageVisibility() // Ensure correct initial page visibility
  }

  updateTranslations() {
    const guideDialog = document.getElementById('gameGuideDialog')
    if (!guideDialog)
      return

    // Page 1 Content
    guideDialog.querySelector('#guideTitle1').textContent = this.i18n.t('guide.title')
    guideDialog.querySelectorAll('#guidePage1 h3').forEach((h3, index) => {
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
        default:
          // Handle potential unexpected index if necessary
          break
      }
    })
    guideDialog.querySelector('#moveText').textContent = this.i18n.t('guide.move')
    guideDialog.querySelector('#jumpText').textContent = this.i18n.t('guide.jump')
    guideDialog.querySelector('#sitText').textContent = this.i18n.t('guide.sit')
    guideDialog.querySelector('#interactText').textContent = this.i18n.t('guide.interact')
    guideDialog.querySelector('#interactionTip').textContent = this.i18n.t('guide.interaction_tip')
    guideDialog.querySelector('#dayNightText').textContent = this.i18n.t('guide.day_night')
    guideDialog.querySelector('#menuText').textContent = this.i18n.t('guide.menu')
    guideDialog.querySelector('#languageText').textContent = this.i18n.t('guide.language')
    guideDialog.querySelector('#iconText').textContent = this.i18n.t('guide.icon')
    guideDialog.querySelector('#guideButtonText').textContent = this.i18n.t('guide.guide_button')
    guideDialog.querySelector('#championText').textContent = this.i18n.t('guide.champion')
    guideDialog.querySelector('#resetHeroText').textContent = this.i18n.t('guide.reset_hero')

    // Page 2 Content
    guideDialog.querySelector('#guideTitle2').textContent = this.i18n.t('guide.page_title_2')
    guideDialog.querySelector('#announcementDesc').textContent = this.i18n.t('guide.announcement_board')
    guideDialog.querySelector('#assetSourcesDesc').textContent = this.i18n.t('guide.asset_sources')

    // Buttons & Page Indicator
    guideDialog.querySelector('#confirmBtn').textContent = this.i18n.t('guide.confirm')
    guideDialog.querySelector('#prevPageBtn').textContent = this.i18n.t('guide.prev_page')
    guideDialog.querySelector('#nextPageBtn').textContent = this.i18n.t('guide.next_page')
    this.updatePageIndicator()
  }

  createGuideDialog() {
    const guideDialog = document.createElement('div')
    guideDialog.id = 'gameGuideDialog'
    guideDialog.className = 'fixed inset-0 z-[9998] hidden'

    guideDialog.innerHTML = `
      <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      <div class="relative flex items-center justify-center min-h-screen p-4">
        <div class="backdrop-blur-md rounded-lg shadow-xl max-w-2xl w-full p-8 relative pixel">
          
          <!-- Page 1 Content -->
          <div id="guidePage1">
            <h2 id="guideTitle1" class="text-3xl font-pixelify text-gray-200 mb-6">${this.i18n.t('guide.title')}</h2>
            <!-- Basic Controls -->
            <div class="mb-8">
              <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.basic_controls')}</h3>
              <div class="grid grid-cols-2 gap-6">
                <div class="flex items-center justify-around gap-4">
                  <div class="flex flex-col items-center gap-2">
                    <img src="/keyboard/keyboard_arrows.png" alt="Arrow Keys" class="w-24 h-24 pixel-art">
                    <p id="moveText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.move')}</p>
                  </div>
                </div>
                <div class="flex items-center justify-around gap-4">
                  <div class="flex flex-col items-center gap-2">
                    <img src="/keyboard/keyboard_space.png" alt="Spacebar" class="w-24 h-24 pixel-art">
                    <p id="jumpText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.jump')}</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Special Actions -->
            <div class="mb-8">
              <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.special_actions')}</h3>
              <div class="grid grid-cols-3 gap-6">
                <div class="flex items-center justify-around gap-4">
                  <div class="flex flex-col items-center gap-2 ">
                    <img src="/keyboard/keyboard_z.png" alt="Z Key" class="w-24 h-24 pixel-art">
                    <p id="sitText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.sit')}</p>
                  </div>
                </div>
                <div class="flex items-center justify-around gap-4">
                  <div class="flex flex-col items-center gap-2">
                    <img src="/keyboard/keyboard_f.png" alt="F Key" class="w-24 h-24 pixel-art">
                    <p id="interactText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.interact')}</p>
                  </div>
                </div>
                <div class="flex items-center justify-around gap-4">
                  <div class="flex flex-col items-center gap-2">
                    <img src="/keyboard/keyboard_r.png" alt="R Key" class="w-24 h-24 pixel-art">
                    <p id="resetHeroText" class="text-lg font-pixelify text-gray-200">${this.i18n.t('guide.reset_hero')}</p>
                  </div>
                </div>
              </div>
            </div>
            <!-- Interaction Tips -->
            <div class="mb-8">
              <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.interaction_tips')}</h3>
              <div class="flex items-center gap-4 bg-slate-100 p-4 rounded-lg">
                <img src="/icon/marker.png" alt="Interaction Icon" class="w-8 h-8">
                <p id="interactionTip" class="text-lg font-pixelify text-black">${this.i18n.t('guide.interaction_tip')}</p>
              </div>
            </div>
             <!-- Button Controls -->
            <div class="mb-8">
              <h3 class="text-2xl font-pixelify text-gray-200 mb-4">${this.i18n.t('guide.button_controls')}</h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/sun.png" alt="Toggle Day/Night" class="w-12 h-12 pixel-art">
                  <p id="dayNightText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.day_night')}</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/menu.png" alt="Menu" class="w-12 h-12 pixel-art">
                  <p id="menuText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.menu')}</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/i18n.png" alt="Toggle Language" class="w-12 h-12 pixel-art">
                  <p id="languageText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.language')}</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/icon.png" alt="Profile" class="w-12 h-12 pixel-art">
                  <p id="iconText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.icon')}</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/new.png" alt="Controls Guide" class="w-12 h-12 pixel-art">
                  <p id="guideButtonText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.guide_button')}</p>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <img src="/icon/champion.png" alt="Leaderboard" class="w-12 h-12 pixel-art">
                  <p id="championText" class="text-sm font-pixelify text-gray-200 text-center">${this.i18n.t('guide.champion')}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Page 2 Content -->
          <div id="guidePage2" class="hidden">
            <h2 id="guideTitle2" class="text-3xl font-pixelify text-gray-200 mb-6">${this.i18n.t('guide.page_title_2')}</h2>
            <!-- Announcement Board -->
            <div class="mb-8">
                <h3 class="text-2xl font-pixelify text-gray-200 mb-4">公告栏</h3>
                <p id="announcementDesc" class="text-lg font-pixelify text-gray-300 mb-4">${this.i18n.t('guide.announcement_board')}</p>
                <!-- Placeholder for Announcement Images -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-gray-700/50 p-4 rounded pixel-border flex items-center justify-center text-gray-400 italic h-64">
                        <img src="/assets/images/brand1.png" alt="Announcement Image 1" class="w-full h-full object-cover">
                    </div>
                    <div class="bg-gray-700/50 p-4 rounded pixel-border flex items-center justify-center text-gray-400 italic h-64">
                        <img src="/assets/images/brand2.png" alt="Announcement Image 2" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>
            <!-- Asset Sources -->
            <div class="mb-8">
                <h3 class="text-2xl font-pixelify text-gray-200 mb-4">资源来源</h3>
                <p id="assetSourcesDesc" class="text-lg font-pixelify text-gray-300">${this.i18n.t('guide.asset_sources')}</p>
                <p class="text-sm font-pixelify text-gray-400 mt-2">模型来源: <a href="https://kenney.nl/assets" target="_blank" class="text-blue-400 hover:underline">Kenney.nl</a>, Hyper3D AI</p>
                <p class="text-sm font-pixelify text-gray-400">图片来源: GPT-4o</p>
            </div>
          </div>

          <!-- Navigation & Footer -->
          <div class="flex justify-between items-center mt-6">
            <button id="prevPageBtn" class="px-6 py-2 bg-gray-600 text-white font-pixelify rounded-lg hover:bg-gray-700 transition-colors pixel-border2 disabled:opacity-50 disabled:cursor-not-allowed">
              ${this.i18n.t('guide.prev_page')}
            </button>
            <span id="pageIndicator" class="text-gray-400 font-pixelify"></span>
            <div class="flex gap-4">
                <button id="nextPageBtn" class="px-6 py-2 bg-blue-500 text-white font-pixelify rounded-lg hover:bg-blue-600 transition-colors pixel-border2">
                    ${this.i18n.t('guide.next_page')}
                </button>
                <button id="confirmBtn" class="px-8 py-2 bg-green-600 text-white font-pixelify rounded-lg hover:bg-green-700 transition-colors pixel-border2 hidden">
                    ${this.i18n.t('guide.confirm')}
                </button>
            </div>
          </div>

          <!-- Close Button -->
          <button id="closeGuideBtn" class="absolute top-4 right-4 text-gray-300 hover:text-white transition-colors">
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
    const closeBtn = document.getElementById('closeGuideBtn')
    const newButton = document.getElementById('newButton') // Button to re-open the guide
    const confirmBtn = document.getElementById('confirmBtn')
    const prevPageBtn = document.getElementById('prevPageBtn')
    const nextPageBtn = document.getElementById('nextPageBtn')

    closeBtn?.addEventListener('click', () => this.hideGuide())
    newButton?.addEventListener('click', () => this.showGuide()) // Ensure newButton exists
    confirmBtn?.addEventListener('click', () => {
      localStorage.setItem('hasCompletedGuide', 'true')
      this.hideGuide()
    })
    prevPageBtn?.addEventListener('click', () => this.changePage(-1))
    nextPageBtn?.addEventListener('click', () => this.changePage(1))
  }

  changePage(direction) {
    const newPage = this.currentPage + direction
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage
      this.updatePageVisibility()
    }
  }

  updatePageVisibility() {
    const guidePage1 = document.getElementById('guidePage1')
    const guidePage2 = document.getElementById('guidePage2')
    const prevPageBtn = document.getElementById('prevPageBtn')
    const nextPageBtn = document.getElementById('nextPageBtn')
    const confirmBtn = document.getElementById('confirmBtn')

    if (!guidePage1 || !guidePage2 || !prevPageBtn || !nextPageBtn || !confirmBtn)
      return

    // Toggle page content visibility
    guidePage1.classList.toggle('hidden', this.currentPage !== 1)
    guidePage2.classList.toggle('hidden', this.currentPage !== 2)

    // Update button states
    prevPageBtn.disabled = this.currentPage === 1
    nextPageBtn.classList.toggle('hidden', this.currentPage === this.totalPages)
    confirmBtn.classList.toggle('hidden', this.currentPage !== this.totalPages)

    this.updatePageIndicator()
  }

  updatePageIndicator() {
    const pageIndicator = document.getElementById('pageIndicator')
    if (pageIndicator) {
      pageIndicator.textContent = `Page ${this.currentPage} of ${this.totalPages}`
    }
  }

  showGuide() {
    const guideDialog = document.getElementById('gameGuideDialog')
    if (guideDialog) {
      this.currentPage = 1 // Reset to first page when showing
      this.updatePageVisibility()
      guideDialog.classList.remove('hidden')
    }
  }

  hideGuide() {
    const guideDialog = document.getElementById('gameGuideDialog')
    if (guideDialog) {
      guideDialog.classList.add('hidden')
    }
  }
}
