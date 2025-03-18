import gsap from 'gsap'
import * as THREE from 'three'
import { Capsule } from 'three/addons/math/Capsule.js'
import { Octree } from 'three/addons/math/Octree.js'

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

    // Camera follow parameters
    this.cameraOffset = new THREE.Vector3(0, 2, 5) // Camera offset from character
    this.cameraLerpFactor = 0.1 // Smoothing factor for camera movement
    this.cameraTarget = new THREE.Vector3() // Target position for camera
    this.cameraLookAt = new THREE.Vector3() // Point for camera to look at

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

    // Collision
    this.worldOctree = new Octree()
    this.playerCollider = new Capsule(
      new THREE.Vector3(0, 2.35, 0),
      new THREE.Vector3(0, 3, 0),
      0.35,
    )
    this.playerVelocity = new THREE.Vector3()
    this.playerOnFloor = false
    this.GRAVITY = 30

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
      space: false,
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

    this.collider = this.resources.items.colliderModel.scene

    this.animation = {}
    this.animation.mixer = new THREE.AnimationMixer(this.hero)
    this.animation.actions = {}

    const skeleton = new THREE.SkeletonHelper(this.hero)
    skeleton.visible = false
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
    this.setupCollider()

    // Setup debug if active
    if (this.debug.active) {
      this.debugInit()
    }
  }

  setHero() {
    this.hero.position.set(36, 10, 5)
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

    // Initialize player collider position
    this.playerCollider.start.set(
      this.hero.position.x,
      this.hero.position.y + 2.35,
      this.hero.position.z,
    )
    this.playerCollider.end.set(
      this.hero.position.x,
      this.hero.position.y + 3,
      this.hero.position.z,
    )
  }

  setupCollider() {
    // Initialize octree from the collision model
    if (this.collider) {
      this.worldOctree.fromGraphNode(this.collider)
      console.warn('Octree created from collider model')

      // Make collider model invisible but keep it in the scene for collisions
      this.collider.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.visible = false
        }
      })

      this.scene.add(this.collider)

      // Add debug visualizer if debug is active
      if (this.debug.active) {
        this.setupColliderVisualizer()
      }
    }
  }

  setupColliderVisualizer() {
    // Import OctreeHelper if not already imported
    import('three/addons/helpers/OctreeHelper.js').then(({ OctreeHelper }) => {
      this.octreeHelper = new OctreeHelper(this.worldOctree)
      this.octreeHelper.visible = false
      this.scene.add(this.octreeHelper)

      // Add to debug panel
      const colliderFolder = this.debug.ui.addFolder({
        title: '碰撞体系统',
        expanded: false,
      })

      colliderFolder.addBinding(
        { visualize: false },
        'visualize',
        {
          label: '显示碰撞体',
        },
      ).on('change', (event) => {
        this.octreeHelper.visible = event.value
      })

      // Add capsule helper to visualize player collider
      const geometry = new THREE.CapsuleGeometry(
        this.playerCollider.radius,
        this.playerCollider.end.y - this.playerCollider.start.y,
        4,
        8,
      )
      const material = new THREE.MeshBasicMaterial({
        color: 0x00FF00,
        wireframe: true,
      })
      this.capsuleHelper = new THREE.Mesh(geometry, material)
      this.capsuleHelper.visible = false
      this.scene.add(this.capsuleHelper)

      colliderFolder.addBinding(
        { playerCollider: false },
        'playerCollider',
        {
          label: '显示角色碰撞体',
        },
      ).on('change', (event) => {
        this.capsuleHelper.visible = event.value
      })
    })
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
      if (e.key === ' ' || e.code === 'Space')
        this.keys.space = true

      // Z key for sitting
      if (key === 'z') {
        this.toggleSit()
      }

      // Jump when space is pressed and player is on floor
      if ((e.key === ' ' || e.code === 'Space') && this.playerOnFloor && !this.character.isSitting) {
        this.jump()
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
      if (e.key === ' ' || e.code === 'Space')
        this.keys.space = false
    })
  }

  moveCharacter(deltaTime) {
    if (this.character.isSitting)
      return

    // Calculate movement direction
    let moveX = 0
    let moveZ = 0
    let newDirection = null

    // Apply gravity if not on floor
    if (!this.playerOnFloor) {
      this.playerVelocity.y -= this.GRAVITY * deltaTime
    }

    // Calculate movement based on key inputs
    const speedDelta = deltaTime * (this.playerOnFloor ? 25 : 8)

    if (this.keys.w || this.keys.arrowUp) {
      moveZ = -speedDelta
      newDirection = new THREE.Vector3(0, 0, 1) // Facing -Z
    }
    else if (this.keys.s || this.keys.arrowDown) {
      moveZ = speedDelta
      newDirection = new THREE.Vector3(0, 0, -1) // Facing +Z
    }
    else if (this.keys.a || this.keys.arrowLeft) {
      moveX = -speedDelta
      newDirection = new THREE.Vector3(1, 0, 0) // Facing -X
    }
    else if (this.keys.d || this.keys.arrowRight) {
      moveX = speedDelta
      newDirection = new THREE.Vector3(-1, 0, 0) // Facing +X
    }

    // Add velocity in the movement direction
    if (moveX !== 0 || moveZ !== 0) {
      // Update character rotation to face new direction if needed
      this.updateCharacterRotation(newDirection)

      // Only play walk animation if on floor and not already playing jump
      if (this.playerOnFloor && this.currentAnimation !== this.animations.jump) {
        this.playAnimation('walk')
      }

      // Add velocity in the direction
      if (moveX !== 0) {
        this.playerVelocity.x += moveX
      }
      if (moveZ !== 0) {
        this.playerVelocity.z += moveZ
      }
    }
    else if (this.playerOnFloor) {
      // If no movement keys are pressed and on floor, play idle animation
      // But only if not already jumping
      if (!this.character.isSitting && this.currentAnimation !== this.animations.jump) {
        this.playAnimation('idle')
      }
    }

    // Apply damping to slow down movement over time
    const damping = Math.exp(-4 * deltaTime) - 1
    this.playerVelocity.addScaledVector(this.playerVelocity, damping)

    // Move player with velocity
    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime)
    this.playerCollider.translate(deltaPosition)

    // Check for collisions and adjust position
    this.playerCollisions()

    // Handle animation transitions
    this.updateAnimationState()

    // Update model position to match collider
    this.updateModelFromCollider()
  }

  updateAnimationState() {
    // If just landed on the floor
    if (this.playerOnFloor && this.currentAnimation === this.animations.jump) {
      // Check if any movement keys are pressed
      const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d
        || this.keys.arrowUp || this.keys.arrowDown
        || this.keys.arrowLeft || this.keys.arrowRight

      // Play walk animation if moving, otherwise play idle
      if (isMoving) {
        this.playAnimation('walk')
      }
      else {
        this.playAnimation('idle')
      }
    }

    // If falling (not on floor and moving down)
    if (!this.playerOnFloor && this.playerVelocity.y < 0 && this.currentAnimation !== this.animations.fall) {
      this.playAnimation('fall')
    }
  }

  playerCollisions() {
    const result = this.worldOctree.capsuleIntersect(this.playerCollider)
    this.playerOnFloor = false

    if (result) {
      this.playerOnFloor = result.normal.y > 0

      if (!this.playerOnFloor) {
        // Slide along the surface if falling
        this.playerVelocity.addScaledVector(
          result.normal,
          -result.normal.dot(this.playerVelocity),
        )
      }

      // Adjust position to prevent clipping
      if (result.depth >= 1e-10) {
        this.playerCollider.translate(result.normal.multiplyScalar(result.depth))
      }
    }
  }

  updateModelFromCollider() {
    // Get center position between collider start and end
    const center = new THREE.Vector3()
      .addVectors(this.playerCollider.start, this.playerCollider.end)
      .multiplyScalar(0.5)

    // Update hero position
    this.hero.position.copy(center)
    this.hero.position.y -= 0.7 // Adjust height to make feet touch ground

    // Update capsule helper position if it exists
    if (this.capsuleHelper) {
      this.capsuleHelper.position.copy(center)
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

  jump() {
    // Apply upward velocity for jumping
    if (this.playerOnFloor) {
      this.playerVelocity.y = 10
      this.playerOnFloor = false
      this.playAnimation('jump')
    }
  }

  // #region
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

    // Add camera follow controls to debug panel
    const cameraFolder = this.debug.ui.addFolder({
      title: '相机跟随设置',
      expanded: false,
    })

    // Camera offset controls
    cameraFolder.addBinding(
      this.cameraOffset,
      'x',
      {
        label: '相机X偏移',
        min: -10,
        max: 10,
        step: 0.1,
      },
    )

    cameraFolder.addBinding(
      this.cameraOffset,
      'y',
      {
        label: '相机Y偏移',
        min: -10,
        max: 10,
        step: 0.1,
      },
    )

    cameraFolder.addBinding(
      this.cameraOffset,
      'z',
      {
        label: '相机Z偏移',
        min: -10,
        max: 10,
        step: 0.1,
      },
    )

    // Camera smoothing control
    cameraFolder.addBinding(
      this,
      'cameraLerpFactor',
      {
        label: '相机平滑度',
        min: 0.01,
        max: 0.5,
        step: 0.01,
      },
    )
  }

  // #endregion
  update() {
    const deltaTime = this.time.delta / 1000

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }

    // Check if any movement keys are pressed
    const isAnyMovementKeyPressed
      = this.keys.w || this.keys.a || this.keys.s || this.keys.d
        || this.keys.arrowUp || this.keys.arrowDown
        || this.keys.arrowLeft || this.keys.arrowRight

    // Move character with collision detection
    if (!this.character.isSitting) {
      this.moveCharacter(deltaTime)
    }
    else if (!isAnyMovementKeyPressed && this.playerOnFloor) {
      // Apply small damping when not pressing keys
      const damping = Math.exp(-10 * deltaTime) - 1
      this.playerVelocity.addScaledVector(this.playerVelocity, damping)

      // Still update position for gravity
      const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime)
      this.playerCollider.translate(deltaPosition)
      this.playerCollisions()
      this.updateModelFromCollider()
    }

    // Update camera position
    this.updateCamera()
  }

  updateCamera() {
    // Calculate target camera position based on character's position and rotation
    const characterPosition = this.hero.position.clone()

    // Set camera target position
    this.cameraTarget.copy(characterPosition).add(new THREE.Vector3(10, 12, 15))

    // Set camera look-at point (slightly above character's position)
    this.cameraLookAt.copy(characterPosition)
    this.cameraLookAt.y += 1.5 // Look at character's upper body

    // Smoothly move camera to target position
    this.camera.position.lerp(this.cameraTarget, this.cameraLerpFactor)

    // Make camera look at the target point
    this.camera.lookAt(this.cameraLookAt)
  }
}
