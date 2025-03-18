import gsap from 'gsap'
import * as THREE from 'three'

import Experience from '../experience.js'

export default class Hero {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse
    this.time = this.experience.time
    this.debug = this.experience.debug

    // Character object
    this.character = {
      instance: null,
      moveDistance: 1.2,
      jumpHeight: 1,
      isMoving: false,
      moveDuration: 0.3,
      currentDirection: new THREE.Vector3(-1, 0, 0), // Initially facing -X direction
      isSitting: false,
    }

    // Animation mixer
    this.mixer = null
    this.animations = {}
    this.currentAnimation = null

    // Input tracking
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false,
      z: false,
    }

    // 英雄角色参数
    this.heroParams = {
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      visible: true,
    }

    this.hero = this.resources.items.heroModel.scene.children[0]
    console.warn('模型信息:', this.resources.items.heroModel)

    // Setup the animation
    this.animation = {}
    this.animation.mixer = new THREE.AnimationMixer(this.hero)
    this.animation.actions = {}

    const skeleton = new THREE.SkeletonHelper(this.hero)
    skeleton.visible = true
    this.scene.add(skeleton)

    // Get all animations
    this.animation.clips = this.resources.items.heroModel.animations

    if (this.animation.clips.length === 0) {
      console.warn('没有找到动画剪辑，检查模型是否包含动画数据')
    }
    else {
      console.warn(`找到${this.animation.clips.length}个动画剪辑`)
    }

    // 动画参数设置
    this.animationParams = {
      fadeInDuration: 0.5,
      fadeOutDuration: 0.5,
      timeScale: 1.0,
      paused: false,
    }

    // Add animations to actions
    if (this.animation.clips.length) {
      this.animation.clips.forEach((clip) => {
        this.animation.actions[clip.name] = this.animation.mixer.clipAction(clip)
        console.warn(`添加动画: ${clip.name}, 时长: ${clip.duration}秒`)
      })

      // Set current action
      this.animation.current = this.animation.clips[0].name
      this.animation.actions[this.animation.current].play()

      // Log available animations
      console.warn('可用动画列表:', this.animation.clips.map(clip => clip.name))
    }

    this.setHero()
    this.setupAnimations()
    this.setupEventListeners()

    // Setup debug if active
    if (this.debug.active) {
      this.debugInit()
    }
  }

  setHero() {
    this.hero.position.set(0, 0.2, 0)
    this.hero.scale.set(2, 2, 2)
    this.hero.rotation.set(0, Math.PI / 2, 0) // Set initial rotation to face -X direction
    this.hero.castShadow = true
    this.hero.receiveShadow = true
    this.scene.add(this.hero)

    this.hero.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    this.character.instance = this.hero
  }

  setupAnimations() {
    this.mixer = new THREE.AnimationMixer(this.hero)

    // Get all animations from the model
    const animations = this.resources.items.heroModel.animations

    // Store animations in a map for easy access
    animations.forEach((animation) => {
      this.animations[animation.name] = this.mixer.clipAction(animation)
      console.warn(`添加动画: ${animation.name}, 时长: ${animation.duration}秒`)
    })

    // Play idle animation by default
    this.playAnimation('idle')
  }

  setupEventListeners() {
    // Add key down event listener
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase()

      if (Object.prototype.hasOwnProperty.call(this.keys, key)) {
        this.keys[key] = true
      }

      // Handle special cases like arrow keys
      if (e.key === 'ArrowUp')
        this.keys.arrowUp = true
      if (e.key === 'ArrowDown')
        this.keys.arrowDown = true
      if (e.key === 'ArrowLeft')
        this.keys.arrowLeft = true
      if (e.key === 'ArrowRight')
        this.keys.arrowRight = true

      // Z key for sitting
      if (key === 'z') {
        this.toggleSit()
      }
    })

    // Add key up event listener
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase()

      if (Object.prototype.hasOwnProperty.call(this.keys, key)) {
        this.keys[key] = false
      }

      // Handle special cases like arrow keys
      if (e.key === 'ArrowUp')
        this.keys.arrowUp = false
      if (e.key === 'ArrowDown')
        this.keys.arrowDown = false
      if (e.key === 'ArrowLeft')
        this.keys.arrowLeft = false
      if (e.key === 'ArrowRight')
        this.keys.arrowRight = false
    })
  }

  moveCharacter() {
    if (this.character.isMoving || this.character.isSitting)
      return

    let moveX = 0
    let moveZ = 0
    let newDirection = null

    // Calculate movement based on key inputs
    if (this.keys.w || this.keys.arrowUp) {
      moveZ = -this.character.moveDistance
      newDirection = new THREE.Vector3(0, 0, 1) // Facing -Z
    }
    else if (this.keys.s || this.keys.arrowDown) {
      moveZ = this.character.moveDistance
      newDirection = new THREE.Vector3(0, 0, -1) // Facing +Z
    }
    else if (this.keys.a || this.keys.arrowLeft) {
      moveX = -this.character.moveDistance
      newDirection = new THREE.Vector3(1, 0, 0) // Facing -X
    }
    else if (this.keys.d || this.keys.arrowRight) {
      moveX = this.character.moveDistance
      newDirection = new THREE.Vector3(-1, 0, 0) // Facing +X
    }

    // If there's movement input
    if (moveX !== 0 || moveZ !== 0) {
      this.character.isMoving = true

      // Update character rotation to face new direction if needed
      this.updateCharacterRotation(newDirection)

      // Play walk animation
      this.playAnimation('walk')

      // Animate movement using GSAP
      gsap.to(this.character.instance.position, {
        x: this.character.instance.position.x + moveX,
        z: this.character.instance.position.z + moveZ,
        duration: this.character.moveDuration,
        ease: 'linear',
        onComplete: () => {
          this.character.isMoving = false

          // Check if any movement keys are still pressed
          if (!(this.keys.w || this.keys.a || this.keys.s || this.keys.d
            || this.keys.arrowUp || this.keys.arrowDown
            || this.keys.arrowLeft || this.keys.arrowRight)) {
            // If no movement keys are pressed, play idle animation
            if (!this.character.isSitting) {
              this.playAnimation('idle')
            }
          }
          else {
            // If keys are still pressed, trigger movement again
            this.moveCharacter()
          }
        },
      })
    }
  }

  updateCharacterRotation(newDirection) {
    if (!newDirection || this.character.currentDirection.equals(newDirection))
      return

    // Store new direction
    this.character.currentDirection = newDirection

    // Calculate the appropriate rotation based on direction
    let targetRotation = 0

    if (newDirection.z === -1) {
      targetRotation = 0 // Facing -Z
    }
    else if (newDirection.z === 1) {
      targetRotation = Math.PI // Facing +Z
    }
    else if (newDirection.x === -1) {
      targetRotation = Math.PI / 2 // Facing -X
    }
    else if (newDirection.x === 1) {
      targetRotation = -Math.PI / 2 // Facing +X
    }

    // Get the current rotation
    const currentRotation = this.character.instance.rotation.y

    // Calculate the difference between the current rotation and the target rotation
    let deltaRotation = targetRotation - currentRotation

    // Normalize the delta rotation to the range [-PI, PI]
    if (deltaRotation > Math.PI) {
      deltaRotation -= 2 * Math.PI
    }
    else if (deltaRotation < -Math.PI) {
      deltaRotation += 2 * Math.PI
    }

    // Calculate the new target rotation
    const newTargetRotation = currentRotation + deltaRotation

    // Animate rotation
    gsap.to(this.character.instance.rotation, {
      y: newTargetRotation,
      duration: 0.2,
      ease: 'power1.out',
    })
  }

  toggleSit() {
    if (this.character.isMoving)
      return

    this.character.isSitting = !this.character.isSitting

    if (this.character.isSitting) {
      this.playAnimation('sit')
    }
    else {
      this.playAnimation('idle')
    }
  }

  playAnimation(name) {
    if (!this.animations[name])
      return

    // If we're already playing this animation, don't restart it
    if (this.currentAnimation === this.animations[name])
      return

    // Fade out current animation if exists
    if (this.currentAnimation) {
      this.currentAnimation.fadeOut(0.2)
    }

    // Fade in new animation
    const newAnimation = this.animations[name]
    newAnimation.reset()
    newAnimation.fadeIn(0.2)

    // Ensure animations loop properly
    newAnimation.setLoop(THREE.LoopRepeat)
    newAnimation.play()

    // Store current animation
    this.currentAnimation = newAnimation
  }

  /**
   * 创建调试面板，用于控制角色和动画
   */
  debugInit() {
    // ===== 角色动画控制面板 =====
    this.debugFolder = this.debug.ui.addFolder({
      title: '角色动画控制',
      expanded: true,
    })

    // ----- 基本信息显示 -----
    const infoFolder = this.debugFolder.addFolder({
      title: '基本信息',
      expanded: true,
    })

    // 显示动画信息
    infoFolder.addBinding(
      {
        动画总数: this.animation.clips.length,
        当前动画: this.animation.current,
      },
      '动画总数',
      {
        readonly: true,
      },
    )

    infoFolder.addBinding(
      {
        当前动画: this.animation.current,
      },
      '当前动画',
      {
        readonly: true,
      },
    )

    // ----- 动画选择控制 -----
    const animSelectFolder = this.debugFolder.addFolder({
      title: '动画选择',
      expanded: true,
    })

    // 创建动画选项
    const animationOptions = {}
    this.animation.clips.forEach((clip) => {
      animationOptions[clip.name] = clip.name
    })

    // 添加动画选择下拉菜单
    this.debugAnimation = {
      currentAnimation: this.animation.current,
    }

    animSelectFolder.addBinding(
      this.debugAnimation,
      'currentAnimation',
      {
        label: '切换动画',
        options: animationOptions,
      },
    ).on('change', (event) => {
      this.playAnimation(event.value)
    })

    // ----- 动画参数控制 -----
    const animParamsFolder = this.debugFolder.addFolder({
      title: '动画参数',
      expanded: true,
    })

    // 动画速度控制
    animParamsFolder.addBinding(
      this.animationParams,
      'timeScale',
      {
        label: '播放速度',
        min: 0.1,
        max: 2,
        step: 0.1,
      },
    ).on('change', (event) => {
      // 调整所有动画的速度
      Object.values(this.animation.actions).forEach((action) => {
        action.setEffectiveTimeScale(event.value)
      })
    })

    // 渐变时长控制
    animParamsFolder.addBinding(
      this.animationParams,
      'fadeInDuration',
      {
        label: '淡入时长',
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    )

    animParamsFolder.addBinding(
      this.animationParams,
      'fadeOutDuration',
      {
        label: '淡出时长',
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    )

    // 暂停/播放控制
    animParamsFolder.addBinding(
      this.animationParams,
      'paused',
      {
        label: '暂停',
      },
    ).on('change', (event) => {
      if (event.value) {
        this.animation.mixer.timeScale = 0
      }
      else {
        this.animation.mixer.timeScale = 1
      }
    })

    // 循环模式控制
    this.debugAnimation.loopMode = 'LoopRepeat'
    const loopModes = {
      LoopOnce: THREE.LoopOnce,
      LoopRepeat: THREE.LoopRepeat,
      LoopPingPong: THREE.LoopPingPong,
    }

    animParamsFolder.addBinding(
      this.debugAnimation,
      'loopMode',
      {
        label: '循环模式',
        options: {
          单次播放: 'LoopOnce',
          循环播放: 'LoopRepeat',
          来回播放: 'LoopPingPong',
        },
      },
    ).on('change', (event) => {
      // 设置当前动画的循环模式
      const action = this.animation.actions[this.animation.current]
      action.setLoop(loopModes[event.value])

      if (event.value === 'LoopOnce') {
        action.clampWhenFinished = true
      }
    })

    // ----- 动画操作按钮 -----
    const animButtonsFolder = this.debugFolder.addFolder({
      title: '动画操作',
      expanded: true,
    })

    // 重置动画按钮
    animButtonsFolder.addButton({
      title: '重置动画',
    }).on('click', () => {
      const action = this.animation.actions[this.animation.current]
      action.reset().play()
    })

    // 停止所有动画按钮
    animButtonsFolder.addButton({
      title: '停止所有动画',
    }).on('click', () => {
      Object.values(this.animation.actions).forEach((action) => {
        action.stop()
      })
    })

    // 重新激活动画按钮
    animButtonsFolder.addButton({
      title: '重新激活当前动画',
    }).on('click', () => {
      // 重置并重新播放当前动画
      const currentAnimation = this.animation.current
      this.animation.actions[currentAnimation].stop()
      this.animation.actions[currentAnimation].reset()
      this.animation.actions[currentAnimation].play()
    })

    // ===== 角色变换控制面板 =====
    const transformFolder = this.debug.ui.addFolder({
      title: '角色变换控制',
      expanded: false,
    })

    // 位置控制
    transformFolder.addBinding(
      this.heroParams,
      'position',
      {
        label: '位置',
        x: { min: -50, max: 50, step: 0.1 },
        y: { min: -50, max: 50, step: 0.1 },
        z: { min: -50, max: 50, step: 0.1 },
      },
    ).on('change', () => {
      this.hero.position.copy(this.heroParams.position)
    })

    // 旋转控制
    transformFolder.addBinding(
      this.heroParams,
      'rotation',
      {
        label: '旋转',
        x: { min: -Math.PI, max: Math.PI, step: 0.1 },
        y: { min: -Math.PI, max: Math.PI, step: 0.1 },
        z: { min: -Math.PI, max: Math.PI, step: 0.1 },
      },
    ).on('change', () => {
      this.hero.rotation.copy(this.heroParams.rotation)
    })

    // 缩放控制
    transformFolder.addBinding(
      this.heroParams,
      'scale',
      {
        label: '缩放',
        x: { min: 0.1, max: 5, step: 0.1 },
        y: { min: 0.1, max: 5, step: 0.1 },
        z: { min: 0.1, max: 5, step: 0.1 },
      },
    ).on('change', () => {
      this.hero.scale.copy(this.heroParams.scale)
    })

    // 可见性控制
    transformFolder.addBinding(
      this.heroParams,
      'visible',
      {
        label: '可见性',
      },
    ).on('change', () => {
      this.hero.visible = this.heroParams.visible
    })

    // 添加骨骼显示控制
    this.skeletonVisible = true
    transformFolder.addBinding(
      this,
      'skeletonVisible',
      {
        label: '显示骨骼',
      },
    ).on('change', (event) => {
      // 遍历场景中的所有SkeletonHelper
      this.scene.traverse((object) => {
        if (object instanceof THREE.SkeletonHelper) {
          object.visible = event.value
        }
      })
    })
  }

  update() {
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(this.time.delta / 1000)
    }

    // Check if any movement keys are pressed
    const isAnyMovementKeyPressed
      = this.keys.w || this.keys.a || this.keys.s || this.keys.d
        || this.keys.arrowUp || this.keys.arrowDown
        || this.keys.arrowLeft || this.keys.arrowRight

    // Process movement input if character is not already moving
    if (!this.character.isMoving && isAnyMovementKeyPressed && !this.character.isSitting) {
      this.moveCharacter()
    }

    // If character stops moving and no keys are pressed, switch to idle
    if (!this.character.isMoving && !isAnyMovementKeyPressed
      && this.currentAnimation === this.animations.walk && !this.character.isSitting) {
      this.playAnimation('idle')
    }
  }
}
