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

    // Camera controls interaction flag
    this.controls = this.experience.camera.orbitControls // 获取 OrbitControls 实例
    this.isUserInteracting = false // 标志位，指示用户是否正在与相机交互

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

    // Listen for user interaction with OrbitControls
    this.setupControlsListeners()

    // Setup debug if active
    if (this.debug.active) {
      this.debugInit()
    }
  }

  setHero() {
    this.hero.position.set(37, 10, 6)
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
    // 定义动作映射
    this.actions = {
      up: false,
      down: false,
      left: false,
      right: false,
      brake: false,
      boost: false,
      reset: false,
    }

    // 按键按下事件
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.actions.up = true
          this.keys.w = true
          this.keys.arrowUp = true
          break

        case 'ArrowDown':
        case 'KeyS':
          this.actions.down = true
          this.keys.s = true
          this.keys.arrowDown = true
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.actions.left = true
          this.keys.a = true
          this.keys.arrowLeft = true
          break

        case 'ArrowRight':
        case 'KeyD':
          this.actions.right = true
          this.keys.d = true
          this.keys.arrowRight = true
          break

        case 'ControlLeft':
        case 'ControlRight':
        case 'Space':
          this.actions.brake = true
          this.keys.space = true
          // 跳跃逻辑
          if (e.code === 'Space' && this.playerOnFloor && !this.character.isSitting) {
            this.jump()
          }
          break

        case 'ShiftLeft':
        case 'ShiftRight':
          this.actions.boost = true
          break

        case 'KeyR':
          this.actions.reset = true
          // 按下R键时重置角色位置
          this.resetPosition()
          break

        case 'KeyZ':
          this.toggleSit()
          break
      }
    })

    // 按键松开事件
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.actions.up = false
          this.keys.w = false
          this.keys.arrowUp = false
          break

        case 'ArrowDown':
        case 'KeyS':
          this.actions.down = false
          this.keys.s = false
          this.keys.arrowDown = false
          break

        case 'ArrowLeft':
        case 'KeyA':
          this.actions.left = false
          this.keys.a = false
          this.keys.arrowLeft = false
          break

        case 'ArrowRight':
        case 'KeyD':
          this.actions.right = false
          this.keys.d = false
          this.keys.arrowRight = false
          break

        case 'ControlLeft':
        case 'ControlRight':
        case 'Space':
          this.actions.brake = false
          this.keys.space = false
          break

        case 'ShiftLeft':
        case 'ShiftRight':
          this.actions.boost = false
          break

        case 'KeyR':
          this.actions.reset = false
          break
      }
    })
  }

  /**
   * 监听 OrbitControls 的 start 和 end 事件
   */
  setupControlsListeners() {
    if (this.controls) {
      this.controls.addEventListener('start', () => {
        this.isUserInteracting = true
      })
      this.controls.addEventListener('end', () => {
        this.isUserInteracting = false
      })
    }
    else {
      console.warn('OrbitControls not found in Camera instance.')
    }
  }

  moveCharacter(deltaTime) {
    if (this.character.isSitting)
      return

    // 计算移动方向
    let moveX = 0
    let moveZ = 0
    let newDirection = null

    // 重力
    if (!this.playerOnFloor) {
      this.playerVelocity.y -= this.GRAVITY * deltaTime
    }

    // 速度
    const speedDelta = deltaTime * (this.playerOnFloor ? 25 : 8)

    // 用 actions 判断移动
    if (this.actions.up) {
      moveZ = -speedDelta
      newDirection = new THREE.Vector3(0, 0, 1) // 朝向-Z
    }
    else if (this.actions.down) {
      moveZ = speedDelta
      newDirection = new THREE.Vector3(0, 0, -1) // 朝向+Z
    }
    else if (this.actions.left) {
      moveX = -speedDelta
      newDirection = new THREE.Vector3(1, 0, 0) // 朝向-X
    }
    else if (this.actions.right) {
      moveX = speedDelta
      newDirection = new THREE.Vector3(-1, 0, 0) // 朝向+X
    }

    // 添加速度
    if (moveX !== 0 || moveZ !== 0) {
      // 更新角色朝向
      this.updateCharacterRotation(newDirection)

      // 只有在地面且不是跳跃时才播放行走动画
      if (this.playerOnFloor && this.currentAnimation !== this.animations.jump) {
        this.playAnimation('walk')
      }

      // 添加速度
      if (moveX !== 0) {
        this.playerVelocity.x += moveX
      }
      if (moveZ !== 0) {
        this.playerVelocity.z += moveZ
      }
    }
    else if (this.playerOnFloor) {
      // 没有移动时播放待机动画
      if (!this.character.isSitting && this.currentAnimation !== this.animations.jump) {
        this.playAnimation('idle')
      }
    }

    // 阻尼
    const damping = Math.exp(-4 * deltaTime) - 1
    this.playerVelocity.addScaledVector(this.playerVelocity, damping)

    // 位置更新
    const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime)
    this.playerCollider.translate(deltaPosition)

    // 动画状态更新
    this.updateAnimationState()
  }

  updateAnimationState() {
    // 如果刚落地
    if (this.playerOnFloor && this.currentAnimation === this.animations.jump) {
      // 判断是否有移动动作
      const isMoving = this.actions.up || this.actions.down || this.actions.left || this.actions.right

      // 播放行走或待机动画
      if (isMoving) {
        this.playAnimation('walk')
      }
      else {
        this.playAnimation('idle')
      }
    }

    // 下落动画
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

    // 归一化 deltaRotation 到 [-PI, PI] 区间
    deltaRotation = ((deltaRotation + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI

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
      expanded: false,
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

    // 动画更新
    if (this.mixer) {
      this.mixer.update(deltaTime)
    }

    // 判断是否有移动动作
    const isAnyMovementKeyPressed = this.actions.up || this.actions.down || this.actions.left || this.actions.right

    // 角色移动
    if (!this.character.isSitting) {
      this.moveCharacter(deltaTime)
    }
    else if (!isAnyMovementKeyPressed && this.playerOnFloor) {
      // 阻尼
      const damping = Math.exp(-10 * deltaTime) - 1
      this.playerVelocity.addScaledVector(this.playerVelocity, damping)

      // 位置更新
      const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime)
      this.playerCollider.translate(deltaPosition)
    }
    this.playerCollisions()
    this.updateModelFromCollider()

    // 判断角色是否掉落到Y轴-20以下，自动重置
    if (this.hero.position.y < -20) {
      this.resetPosition()
    }

    // 相机更新
    this.updateCamera()
  }

  updateCamera() {
    // Calculate target camera position based on character's position and rotation
    const characterPosition = this.hero.position.clone()

    // Set camera look-at point (slightly above character's position)
    this.cameraLookAt.copy(characterPosition)
    this.cameraLookAt.y += 1.5 // Look at character's upper body
    // 如果用户正在通过鼠标控制相机，则不执行自动更新
    if (this.isUserInteracting) {
      this.camera.lookAt(this.cameraLookAt)
      return
    }

    // Set camera target position
    this.cameraTarget.copy(characterPosition).add(new THREE.Vector3(10, 12, 15))

    // Smoothly move camera to target position
    this.camera.position.lerp(this.cameraTarget, this.cameraLerpFactor)

    // Make camera look at the target point
    this.camera.lookAt(this.cameraLookAt)
  }

  // 重置角色到初始位置的方法
  resetPosition() {
    // 设置角色初始位置、旋转、缩放
    this.hero.position.set(37, 10, 6)
    this.hero.scale.set(2, 2, 2)
    this.hero.rotation.set(0, Math.PI / 2, 0)
    this.hero.visible = true
    // 重置碰撞体位置
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
    // 重置速度
    this.playerVelocity.set(0, 0, 0)
    // 重置动画为idle
    this.playAnimation('idle')
  }
}
