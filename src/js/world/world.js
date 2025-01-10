import Float from '../components/float.js';
import Experience from '../experience.js';
import Emoji from './emoji.js';
import Environment from './environment.js';
import GlassWall from './glass-wall.js';
import Stage from './stage.js';
import TextMesh from './text-mesh.js';

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.camera = this.experience.camera.instance;
    this.float = new Float({ speed: 1.5, floatIntensity: 2 });

    // Environment
    this.resources.on('ready', () => {
      // Setup
      this.environment = new Environment();
      this.sceneSetup = new Stage();
      this.emoji = new Emoji();
    });

    this.glassWall = new GlassWall();
  }

  update() {
    if (this.float) {
      this.float.update();
    }
    if (this.glassWall) {
      this.glassWall.update();
    }
    if (this.text) {
      this.text.update();
    }
    if (this.emoji) {
      this.emoji.update();
    }
  }
}
