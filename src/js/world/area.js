import gsap from 'gsap'
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
      'weapon-sword',
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
      'campfire-pit',
      'campfire-fishing-stand',
      'spawn-round',
      'wood-structure-part.003',
    ]
    this.homeStuffsObject = []
    this.brandStuffs = ['brand1', 'brand2', 'brand3']
    this.brandStuffsObject = []

    this.raycaster = new THREE.Raycaster()

    // Store the currently hovered object
    this.hoveredObject = null

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
      const intersectedObject = intersects[0].object
      document.body.style.cursor = 'pointer'

      // If we're hovering a new object
      if (this.hoveredObject !== intersectedObject) {
        // Reset previous object if exists
        if (this.hoveredObject) {
          gsap.to(this.hoveredObject.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.3,
            ease: 'power2.out',
          })
        }

        // Scale up new object
        this.hoveredObject = intersectedObject
        gsap.to(this.hoveredObject.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.3,
          ease: 'power2.out',
        })
      }
    }
    else {
      document.body.style.cursor = 'default'

      // Reset currently hovered object if exists
      if (this.hoveredObject) {
        gsap.to(this.hoveredObject.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.3,
          ease: 'power2.out',
        })
        this.hoveredObject = null
      }
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
