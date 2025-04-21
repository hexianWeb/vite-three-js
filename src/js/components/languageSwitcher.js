import I18nManager from '../i18n/i18nManager'
import EventEmitter from '../utils/event-emitter'

export default class LanguageSwitcher extends EventEmitter {
  constructor() {
    super()

    // 获取 i18n 管理器实例
    this.i18n = new I18nManager()

    // 绑定 i18n 按钮点击事件
    this.bindEvents()
  }

  bindEvents() {
    // 获取 i18n 切换按钮
    const i18nButton = document.getElementById('i18nToggle')
    if (!i18nButton) {
      console.warn('未找到 i18n 切换按钮')
      return
    }

    // 添加点击事件
    i18nButton.addEventListener('click', (event) => {
      const currentLang = this.i18n.getCurrentLang()
      // 切换语言
      const newLang = currentLang === 'zh' ? 'en' : 'zh'
      this.i18n.setLang(newLang)

      // 触发语言切换事件
      this.trigger('languageChanged', newLang)

      // 更新按钮图标状态
      this.updateButtonState(newLang)

      // --- 关键步骤：在处理完逻辑后调用 blur() ---
      event.currentTarget.blur() // event.currentTarget 指向被点击的按钮
    })

    // 初始化按钮状态
    this.updateButtonState(this.i18n.getCurrentLang())
  }

  /**
   * 更新按钮状态
   * @param {string} lang - 当前语言
   */
  updateButtonState(lang) {
    const i18nButton = document.getElementById('i18nToggle')
    if (!i18nButton)
      return

    const i18nIcon = i18nButton.querySelector('img')
    if (!i18nIcon)
      return

    // 根据语言更新图标
    i18nIcon.src = lang === 'zh' ? '/icon/i18n-zh.png' : '/icon/i18n-en.png'
    i18nIcon.alt = lang === 'zh' ? '切换到英文' : 'Switch to Chinese'
  }
}
