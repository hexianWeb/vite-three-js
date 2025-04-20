import gsap from 'gsap'
import * as THREE from 'three'

import Experience from '../experience.js'
import DayNightManager from '../ui/day-night-manager.js'
import EventEmitter from '../utils/event-emitter.js'
import Fireflies from './fireflies.js'

export default class Environment extends EventEmitter {
  constructor() {
    super()

    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug.ui
    this.debugActive = this.experience.debug.active

    // Setup
    this.setSunLight()
    // this.setEnvironmentMap()
    this.setAmbientLight()
    this.setupDayNightSystem()
    this.debuggerInit()
  }

  setupDayNightSystem() {
    // Initialize day/night manager
    this.dayNightManager = new DayNightManager()

    // Initialize fireflies
    this.fireflies = new Fireflies()

    // Listen for day/night toggle
    this.dayNightManager.on('dayNightToggle', (isNight) => {
      this.handleDayNightTransition(isNight)
      this.fireflies.setVisibility(isNight)
    })
  }

  setSunLight() {
    this.sunLightColor = '#ffffff'
    this.sunLightIntensity = 1.2
    this.sunLight = new THREE.DirectionalLight(
      this.sunLightColor,
      this.sunLightIntensity,
    )
    this.sunLight.castShadow = true
    this.sunLight.shadow.camera.far = 100
    this.sunLight.shadow.mapSize.set(4096, 4096)
    this.sunLight.shadow.camera.left = -50
    this.sunLight.shadow.camera.right = 50
    this.sunLight.shadow.camera.top = 50
    this.sunLight.shadow.camera.bottom = -50
    this.sunLight.shadow.normalBias = 0.2
    this.sunLightPosition = new THREE.Vector3(33, 55, 22)
    this.sunLight.position.copy(this.sunLightPosition)
    this.scene.add(this.sunLight)

    // 设置 sunLight Target
    this.sunLight.target = new THREE.Object3D()
    this.sunLightTarget = new THREE.Vector3(0, 0, 0)
    this.sunLight.target.position.copy(this.sunLightTarget)
    this.scene.add(this.sunLight.target)

    this.helper = new THREE.CameraHelper(this.sunLight.shadow.camera)
    this.helper.visible = false
    this.scene.add(this.helper)
  }

  setAmbientLight() {
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.0)
    this.scene.add(this.ambientLight)
  }

  setEnvironmentMap() {
    this.environmentMap = {}
    this.environmentMap.intensity = 1
    this.environmentMap.texture = this.resources.items.environmentMapTexture
    this.environmentMap.texture.colorSpace = THREE.SRGBColorSpace

    this.scene.environment = this.environmentMap.texture
  }

  updateSunLightPosition() {
    this.sunLight.position.copy(this.sunLightPosition)
    this.sunLight.target.position.copy(this.sunLightTarget)
    this.helper.update()
  }

  updateSunLightColor() {
    this.sunLight.color.set(this.sunLightColor)
  }

  updateSunLightIntensity() {
    this.sunLight.intensity = this.sunLightIntensity
  }

  updateAmbientLightIntensity() {
    this.ambientLight.intensity = this.ambientLightIntensity
  }

  debuggerInit() {
    if (this.debugActive) {
      const environmentFolder = this.debug.addFolder({
        title: 'Environment',
        expanded: false,
      })

      environmentFolder.addBinding(this.scene, 'environmentIntensity', {
        min: 0,
        max: 2,
        step: 0.01,
        label: 'Intensity',
      })

      const sunLightFolder = this.debug.addFolder({
        title: 'Sun Light',
        expanded: false,
      })

      sunLightFolder
        .addBinding(this, 'sunLightPosition', {
          label: 'Light Position',
        })
        .on('change', this.updateSunLightPosition.bind(this))

      sunLightFolder
        .addBinding(this, 'sunLightTarget', {
          label: 'Light Target',
        })
        .on('change', this.updateSunLightPosition.bind(this))

      sunLightFolder
        .addBinding(this, 'sunLightColor', {
          label: 'Light Color',
          view: 'color',
        })
        .on('change', this.updateSunLightColor.bind(this))

      sunLightFolder
        .addBinding(this, 'sunLightIntensity', {
          label: 'Light Intensity',
          min: 0,
          max: 20,
          step: 0.1,
        })
        .on('change', this.updateSunLightIntensity.bind(this))

      sunLightFolder.addBinding(this.helper, 'visible', {
        label: 'Helper',
      })

      const ambientLightFolder = this.debug.addFolder({
        title: 'Ambient Light',
        expanded: false,
      })

      ambientLightFolder.addBinding(this.ambientLight, 'intensity', {
        min: 0,
        max: 2,
        step: 0.01,
        label: 'Intensity',
      })
      if (this.axesHelper) {
        this.debug.addBinding(this.axesHelper, 'visible', {
          label: 'Axes',
        })
      }
    }
  }

  handleDayNightTransition(isNight) {
    const targetColor = isNight ? '#5e5994' : '#ffffff'
    const targetIntensity = isNight ? 0.2 : 1.0

    // Create a temporary color object for GSAP to animate
    const colorObj = {
      r: this.sunLight.color.r,
      g: this.sunLight.color.g,
      b: this.sunLight.color.b,
    }

    // Animate both color and intensity
    gsap.to(colorObj, {
      r: new THREE.Color(targetColor).r,
      g: new THREE.Color(targetColor).g,
      b: new THREE.Color(targetColor).b,
      duration: 1,
      onUpdate: () => {
        this.sunLight.color.setRGB(colorObj.r, colorObj.g, colorObj.b)
      },
    })

    gsap.to(this.ambientLight, {
      intensity: targetIntensity,
      duration: 1,
      ease: 'power2.inOut',
    })
  }

  update() {
    if (this.fireflies) {
      this.fireflies.update()
    }
  }
}
