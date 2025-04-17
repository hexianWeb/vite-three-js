import Experience from '../experience.js'
import Area from './area.js'
import Effects from './effect.js'
import Environment from './environment.js'
import Hero from './hero.js'
import Lava from './lava.js'
import Ocean from './ocean.js'
import PortalEffect from './portal-effect.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment()
      this.area = new Area()
      this.hero = new Hero()
      // 初始化岩浆效果
      this.lava = new Lava()
      // 初始化海洋
      this.ocean = new Ocean()
      // 初始化传送门效果
      this.portalEffect = new PortalEffect()
    })

    this.effects = new Effects()
  }

  update() {
    // Update hero if it exists
    if (this.hero) {
      this.hero.update()
    }
    // 更新岩浆效果
    if (this.lava) {
      this.lava.update()
    }
    if (this.environment) {
      this.environment.update()
    }
    // 更新海洋
    if (this.ocean) {
      this.ocean.update()
    }
    // 更新传送门效果
    if (this.portalEffect) {
      this.portalEffect.update()
    }
    this.effects.update()
  }

  resize() {
    this.effects.resize()
    // 更新岩浆效果尺寸
    if (this.lava) {
      this.lava.resize()
    }
  }
}
