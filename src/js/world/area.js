import * as THREE from 'three'

import Experience from '../experience.js'
import BrandDialog from './brandDialog.js'

export default class Area {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse

    // Initialize brand dialog
    this.brandDialog = new BrandDialog()

    this.homeStuffs = [
      'bedroll',
      'bedroll-packed',
      'bricks.021',
      'tent-canvas',
      'chest',
      'bottle',
      'workbench-anvil',
      'tool-axe-upgraded',
      'tool-hammer',
      'weapon-rack',
      '立方体.002',
      'weapon-sword',
      'barrel',
      'barrel.001',
      'barrel.002',
      'bench',
      'bench-short',
      'bottle-large',
      'bowl',
      'cooking-knife',
      'cup',
      'egg-cooked',
      'fish',
      'fish-bones',
      'fish-bones.001',
      'flag-red',
      'grass',
      'pan',
      '圆环',
      'workbench.003',
      'workbench.001',
      'workbench.002',
      'campfire-pit',
      'campfire-fishing-stand',
      'spawn-round',
      'wood-structure-part.003',
      'bucket.001',
      'rock-flat.001',
      'bench.001',
      'tree-log-small.004',
      'tool-axe.001',
    ]
    this.homeStuffsObject = []
    this.brandStuffs = ['brand1', 'brand2', 'brand3']
    this.brandStuffsObject = []

    this.raycaster = new THREE.Raycaster()

    this.setupArea()
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('click', this.onMouseDown.bind(this))
  }

  setupArea() {
    this.model = this.resources.items.sceneModel
    // 设置模型接受阴影
    this.model.scene.traverse((child) => {
      if (this.homeStuffs.includes(child.name)) {
        this.homeStuffsObject.push(child)
      }
      if (this.brandStuffs.includes(child.name)) {
        this.brandStuffsObject.push(child)
      }
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    this.scene.add(this.model.scene)
  }

  onMouseMove() {
    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.homeStuffsObject)
    if (intersects.length > 0) {
      intersects.forEach((intersect) => {
        document.body.style.cursor = 'pointer'
        intersect.object.material.color.set(0x00FF00)
      })
    }
    else {
      document.body.style.cursor = 'default'
    }
  }

  onMouseDown() {
    const intersects = this.raycaster.intersectObjects(this.brandStuffsObject)
    if (intersects.length > 0) {
      const brandName = intersects[0].object.parent.name
      this.brandDialog.showDialog(brandName)
    }
  }
}
