import EventEmitter from '../utils/event-emitter.js'

export default class DayNightManager extends EventEmitter {
  constructor() {
    super()

    // Initial state
    this.isNightMode = false

    // Get DOM elements
    this.toggleDayNightDom = document.getElementById('dayNightToggle')
    this.toggleIcon = this.toggleDayNightDom.querySelector('img')

    // Set initial icon
    this.updateIcon()

    // Bind event listener
    this.toggleDayNightDom.addEventListener('click', (event) => {
      this.isNightMode = !this.isNightMode
      this.updateIcon()
      this.trigger('dayNightToggle', [this.isNightMode])
      // --- 关键步骤：在处理完逻辑后调用 blur() ---
      event.currentTarget.blur() // event.currentTarget 指向被点击的按钮
    })
  }

  updateIcon() {
    const iconPath = this.isNightMode ? '/icon/night.png' : '/icon/sun.png'
    this.toggleIcon.src = iconPath
    this.toggleIcon.alt = this.isNightMode ? 'Switch to Day' : 'Switch to Night'
  }

  getIsNightMode() {
    return this.isNightMode
  }
}
