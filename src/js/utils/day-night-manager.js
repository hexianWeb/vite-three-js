import EventEmitter from './event-emitter.js'

export default class DayNightManager extends EventEmitter {
  constructor() {
    super()
    
    // Initial state
    this.isNightMode = false
    
    // Get DOM element
    this.toggleDayNightDom = document.getElementById('dayNightToggle')
    
    // Bind event listener
    this.toggleDayNightDom.addEventListener('click', () => {
      this.isNightMode = !this.isNightMode
      this.trigger('dayNightToggle', [this.isNightMode])
    })
  }

  getIsNightMode() {
    return this.isNightMode
  }
} 