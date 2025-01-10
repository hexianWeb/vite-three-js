import * as THREE from 'three';

import Float from '../components/float.js';
import Experience from '../experience.js';

export default class Emoji {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;
    this.iMouse = this.experience.iMouse;
    this.camera = this.experience.camera.instance;

    this.rotation = new THREE.Euler(0, 0, 0.1);
    this.targetRotation = new THREE.Euler(0, 0, 0.1);
    this.rotationSpeed = 0.05; // 调整这个值来改变旋转速度

    this.float = new Float({
      speed: 0.5,
      floatIntensity: 2,
      rotationIntensity: 0.5
    });
    this.setEmoji();
    this.debuggerInit();
    this.events();
  }

  events() {
    window.addEventListener('mousemove', () => this.onMouseMove());
  }

  setEmoji() {
    this.emoji = this.resources.items['emoji'].scene;

    this.emoji.traverse((item) => {
      if (item.isMesh) {
        item.castShadow = true;
      }
    });

    this.position = new THREE.Vector3(7, 3.6, -2.7);
    this.rotation = new THREE.Euler(0, -0.34, 0.1);
    this.scale = new THREE.Vector3(1.5, 1.5, 1.1);

    this.updateTransform();
    // this.scene.add(this.emoji);
    this.float.add(this.emoji);
  }

  onMouseMove() {
    if (!this.emoji) return;

    const { x, y } = this.iMouse.normalizedMouse;

    // 将x从[-1, 1]映射到[-0.7, 0.7]
    const rotationY = THREE.MathUtils.mapLinear(x, -1, 1, -0.7, 0.7);

    // 将y从[-1, 1]映射到[-0.6, 0.6]，注意y轴是反的
    const rotationX = THREE.MathUtils.mapLinear(y, -1, 1, 0.6, -0.6);

    // 更新目标旋转
    this.targetRotation.x = rotationX;
    this.targetRotation.y = rotationY;
  }

  updateTransform() {
    if (this.emoji) {
      this.emoji.position.copy(this.position);
      this.emoji.rotation.copy(this.rotation);
      this.emoji.scale.copy(this.scale);
    }
  }

  update() {
    // 平滑地接近目标旋转
    this.rotation.x +=
      (this.targetRotation.x - this.rotation.x) * this.rotationSpeed;
    this.rotation.y +=
      (this.targetRotation.y - this.rotation.y) * this.rotationSpeed;

    this.updateTransform();
    if (this.float) {
      this.float.update();
    }
  }

  debuggerInit() {
    if (this.debugActive) {
      const emojiFolder = this.debug.addFolder({
        title: 'Emoji',
        expanded: false
      });

      emojiFolder
        .addBinding(this, 'position', {
          label: 'Position'
        })
        .on('change', this.updateTransform.bind(this));

      emojiFolder
        .addBinding(this, 'rotation', {
          label: 'Rotation'
        })
        .on('change', this.updateTransform.bind(this));

      emojiFolder
        .addBinding(this, 'scale', {
          label: 'Scale'
        })
        .on('change', this.updateTransform.bind(this));
    }
  }
}
