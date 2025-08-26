import EventEmitter from './event-emitter.js'

export default class Sizes extends EventEmitter {
  constructor() {
    super()

    // Setup
    this.width = window.innerWidth
    this.height = window.innerHeight + 252
    this.aspect = this.width / this.height
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Resize event
    window.addEventListener('resize', () => {
      this.width = window.innerWidth
      this.height = window.innerHeight + 252
      this.pixelRatio = Math.min(window.devicePixelRatio, 2)

      this.trigger('resize')
    })
  }
}
