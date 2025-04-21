import { translations } from './translations'

export default class I18nManager {
  constructor() {
    // 单例模式
    if (I18nManager.instance) {
      return I18nManager.instance
    }
    I18nManager.instance = this

    // 初始化语言设置
    this.currentLang = localStorage.getItem('lang') || 'zh'
    this.translations = translations

    // 创建事件发射器
    this.listeners = new Set()
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  getCurrentLang() {
    return this.currentLang
  }

  /**
   * 切换语言
   * @param {string} lang - 目标语言代码
   */
  setLang(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang
      localStorage.setItem('lang', lang)
      // 通知所有监听器
      this.notifyListeners()
    }
    else {
      console.warn(`不支持的语言: ${lang}`)
    }
  }

  /**
   * 获取翻译文本
   * @param {string} path - 文本路径，例如 'intro.vision'
   * @returns {string} 翻译后的文本
   */
  t(path) {
    const keys = path.split('.')
    let result = this.translations[this.currentLang]

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key]
      }
      else {
        console.warn(`翻译路径不存在: ${path}`)
        return path
      }
    }

    return result
  }

  /**
   * 添加语言变更监听器
   * @param {Function} listener - 监听器函数
   */
  addListener(listener) {
    this.listeners.add(listener)
  }

  /**
   * 移除语言变更监听器
   * @param {Function} listener - 监听器函数
   */
  removeListener(listener) {
    this.listeners.delete(listener)
  }

  /**
   * 通知所有监听器语言已变更
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentLang))
  }
}
