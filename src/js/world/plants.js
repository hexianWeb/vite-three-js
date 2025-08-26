import Experience from '../experience.js'
import Plant from './plant.js'

const RADIUS = 0.7

// 构建三星运动系统
export default class Plants {
  constructor() {
    // 获取 Experience 单例实例
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug
    this.time = this.experience.time

    // 三星系统属性
    this.planets = []

    // 伪三体运动参数
    this.motionParams = {
      // 基础轨道参数
      baseRadius: 4.2, // 基础轨道半径
      primarySpeed: 0.40, // 主要运动速度

      // 扰动参数
      perturbationRadius: 1.5, // 扰动幅度
      perturbationSpeed: 0.8, // 扰动频率

      // 相互影响参数
      interactionStrength: 0.6, // 星球间相互影响强度
      interactionPhase: 0.4, // 相互影响相位差

      // 复杂性参数
      harmonicCount: 3, // 谐波数量
      chaosStrength: 0.3, // 混沌强度

      // 垂直运动参数
      verticalAmplitude: 0.3, // 垂直运动幅度
      verticalFreq: 0.6, // 垂直运动频率

      // Y轴错开参数
      yOffsetScale: 1.5, // Y轴偏移缩放因子
    }

    // 全局共享光照参数（由 Plants 统一调控）
    this.sharedLighting = {
      ambientLight: '#a08ebd',
      ambientLightIntensity: 0.25,
      pointLightColor: '#c1a085',
      pointLightIntensity: 6.0,
      pointLightPosition: { x: 0.0, y: 0.0 },
    }

    this.sharedAtmosphereIntensity = 3.0
    this.sharedAtmosphereThickness = 1.5

    this.timeOffset = 0 // 时间偏移
    this.showTrajectories = false // 是否显示轨迹
    this.trajectories = [] // 轨迹点存储

    // 为每个星体配置不同的运动速度
    this.planetSpeeds = [
      {
        baseSpeed: 1.0, // Planet A (radius: RADIUS * 1.2) - 最大，最慢
        speedMultiplier: 0.8, // 相对速度倍数
      },
      {
        baseSpeed: 1.0, // Planet B (radius: RADIUS * 0.7) - 最小，最快
        speedMultiplier: 1.3,
      },
      {
        baseSpeed: 1.0, // Planet C (radius: RADIUS * 1.0) - 中等，中等速度
        speedMultiplier: 1.0,
      },
    ]

    // 速度模式配置
    this.speedMode = 'size_based' // 'uniform', 'size_based', 'custom'

    // 创建三颗星球
    this.createThreeStarSystem()

    // 添加调试控制
    if (this.debug.active) {
      this.debugInit()
    }
  }

  createThreeStarSystem() {
    // 三颗星球的配置
    const planetConfigs = [
      {
        name: 'Planet A',
        radius: RADIUS * 1.2,
        texture: 'planetTexture',
        angleOffset: 0, // 0度
        params: {
          pointLightPosition: {
            x: 0.0,
            y: 0.0,
          },
          ambientLight: '#a08ebd',
          ambientLightIntensity: 0.3,
          atmosphereDayColor: '#5c67a5',
          atmosphereTwilightColor: '#2b444e',
        },
      },
      {
        name: 'Planet B',
        radius: RADIUS * 0.7,
        texture: 'planetTexture2',
        angleOffset: Math.PI * 2 / 3, // 120度
      },
      {
        name: 'Planet C',
        radius: RADIUS * 1,
        texture: 'planetTexture3',
        angleOffset: Math.PI * 4 / 3, // 240度
        params: {
          atmosphereDayColor: '#e58200',
          atmosphereTwilightColor: '#e4da9f',
          pointLightColor: '#e8b381',
          pointLightIntensity: 5.5,
        },
      },
    ]

    // 创建三颗星球
    planetConfigs.forEach((config) => {
      const planet = new Plant({
        radius: config.radius,
        texture: config.texture,
        params: config.params,
      })

      // 设置初始位置
      const x = Math.cos(config.angleOffset) * this.motionParams.baseRadius
      const z = Math.sin(config.angleOffset) * this.motionParams.baseRadius
      planet.setPosition(x, 0, z)

      // 统一应用共享光照参数
      planet.syncLighting(this.sharedLighting)

      // 保存配置信息
      planet.angleOffset = config.angleOffset
      planet.name = config.name

      this.planets.push(planet)
    })

    // 应用初始速度配置
    this.speedMode = 'size_based' // 默认基于大小的速度
    this.updateSpeedMultipliers()
  }

  update() {
    // 更新时间
    this.timeOffset += this.motionParams.primarySpeed * this.time.delta * 0.0007

    this.planets.forEach((planet, index) => {
      // 计算复杂的伪三体运动位置
      const position = this.calculatePseudoThreeBodyPosition(index, this.timeOffset)

      // 更新星球位置
      planet.setPosition(position.x, position.y, position.z)

      // 记录轨迹点
      if (this.showTrajectories) {
        this.recordTrajectory(index, position)
      }

      // 更新星球自转
      planet.update()
    })
  }

  // 椭圆轨迹计算函数（集成速度控制和Y轴错开）
  calculatePseudoThreeBodyPosition(planetIndex, time) {
    // 为三个星体配置不同的椭圆轨道参数
    const ellipseConfigs = [
      {
        // Planet A (最大) - 最外层轨道
        a: this.motionParams.baseRadius * 1.3, // 长轴更大
        b: this.motionParams.baseRadius * 1.3 * 0.7, // 短轴对应调整
        yOffset: this.motionParams.yOffsetScale, // Y轴偏移量 (向上)
        name: 'Planet A (大)',
      },
      {
        // Planet B (最小) - 最内层轨道
        a: this.motionParams.baseRadius * 0.7, // 长轴最小
        b: this.motionParams.baseRadius * 0.7 * 0.8, // 短轴对应调整
        yOffset: -this.motionParams.yOffsetScale, // Y轴偏移量 (向下)
        name: 'Planet B (小)',
      },
      {
        // Planet C (中等) - 中层轨道
        a: this.motionParams.baseRadius * 1.0, // 中等长轴
        b: this.motionParams.baseRadius * 1.0 * 0.6, // 中等短轴
        yOffset: 0.0, // Y轴中心位置
        name: 'Planet C (中)',
      },
    ]

    const ellipseParams = ellipseConfigs[planetIndex]

    // 获取当前星体的运动速度
    const planetSpeed = this.getPlanetSpeed(planetIndex)

    const rotationAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3]
    const phaseOffsets = [0, Math.PI * 2 / 3, Math.PI * 4 / 3]

    const orbitRotation = rotationAngles[planetIndex]
    const phaseOffset = phaseOffsets[planetIndex]

    // 使用星体特定的速度
    const ellipseAngle = time * planetSpeed + phaseOffset

    const localX = ellipseParams.a * Math.cos(ellipseAngle)
    const localY = ellipseParams.b * Math.sin(ellipseAngle)

    const x = localX * Math.cos(orbitRotation) - localY * Math.sin(orbitRotation)
    const z = localX * Math.sin(orbitRotation) + localY * Math.cos(orbitRotation)

    // 基础Y轴偏移 + 少量垂直运动
    const baseYOffset = ellipseParams.yOffset
    const verticalMotion = Math.sin(ellipseAngle * 2 + phaseOffset) * this.motionParams.verticalAmplitude * 0.1
    const y = baseYOffset + verticalMotion

    return { x, y, z }
  }

  // 记录轨迹点
  recordTrajectory(planetIndex, position) {
    if (!this.trajectories[planetIndex]) {
      this.trajectories[planetIndex] = []
    }

    // 添加新点
    this.trajectories[planetIndex].push({
      x: position.x,
      y: position.y,
      z: position.z,
      time: this.timeOffset,
    })

    // 限制轨迹点数量
    const maxPoints = 500
    if (this.trajectories[planetIndex].length > maxPoints) {
      this.trajectories[planetIndex].shift()
    }
  }

  debugInit() {
    // ===== 伪三体运动控制面板 =====
    this.debugFolder = this.debug.ui.addFolder({
      title: '🌟 伪三体运动系统',
      expanded: true,
    })

    // ===== 全局光照（共享） =====
    const lightingFolder = this.debugFolder.addFolder({
      title: '全局光照',
      expanded: true,
    })

    // 环境光设置
    const ambientFolder = lightingFolder.addFolder({
      title: '环境光',
      expanded: true,
    })

    ambientFolder.addBinding(
      this.sharedLighting,
      'ambientLight',
      {
        label: '环境光颜色',
        picker: 'inline',
      },
    ).on('change', ({ value }) => {
      this.sharedLighting.ambientLight = value
      this.propagateLighting()
    })

    ambientFolder.addBinding(
      this.sharedLighting,
      'ambientLightIntensity',
      {
        label: '环境光强度',
        min: 0.0,
        max: 3.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.propagateLighting()
    })

    // 点光源设置
    const pointFolder = lightingFolder.addFolder({
      title: '点光源',
      expanded: true,
    })

    pointFolder.addBinding(
      this.sharedLighting,
      'pointLightColor',
      {
        label: '点光源颜色',
        picker: 'inline',
      },
    ).on('change', ({ value }) => {
      this.sharedLighting.pointLightColor = value
      this.propagateLighting()
    })

    pointFolder.addBinding(
      this.sharedLighting,
      'pointLightIntensity',
      {
        label: '点光源强度',
        min: 0.0,
        max: 5.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.propagateLighting()
    })

    // 光源位置
    const lightPosFolder = pointFolder.addFolder({
      title: '光源位置',
      expanded: true,
    })

    lightPosFolder.addBinding(
      this.sharedLighting,
      'pointLightPosition',
      {
        label: '光源位置',
        min: -5,
        max: 5,
        step: 0.1,
      },
    ).on('change', () => {
      this.propagateLighting()
    })

    // ===== 全局大气（共享） =====
    const atmosFolder = this.debugFolder.addFolder({
      title: '全局大气',
      expanded: true,
    })

    // 大气强度（共享）
    atmosFolder.addBinding(
      this,
      'sharedAtmosphereIntensity',
      {
        label: '大气强度',
        min: 0.0,
        max: 10.0,
        step: 0.1,
      },
    ).on('change', (e) => {
      if (typeof e?.value === 'number')
        this.sharedAtmosphereIntensity = e.value
      this.planets.forEach((p) => {
        if (p.atmosphereMaterial) {
          p.atmosphereMaterial.uniforms.uAtmosphereIntensity.value = this.sharedAtmosphereIntensity
        }
      })
    })

    // 大气厚度（共享）
    atmosFolder.addBinding(
      this,
      'sharedAtmosphereThickness',
      {
        label: '大气厚度',
        min: 0.5,
        max: 10.0,
        step: 0.1,
      },
    ).on('change', (e) => {
      if (typeof e?.value === 'number')
        this.sharedAtmosphereThickness = e.value
      this.planets.forEach((p) => {
        if (p.atmosphereMaterial) {
          p.atmosphereMaterial.uniforms.uAtmosphereThickness.value = this.sharedAtmosphereThickness
        }
      })
    })

    // ===== 基础轨道 =====
    const basicFolder = this.debugFolder.addFolder({
      title: '基础轨道',
      expanded: true,
    })

    basicFolder.addBinding(
      this.motionParams,
      'baseRadius',
      {
        label: '基础半径',
        min: 2.0,
        max: 8.0,
        step: 0.1,
      },
    )

    basicFolder.addBinding(
      this.motionParams,
      'primarySpeed',
      {
        label: '运动速度',
        min: 0.1,
        max: 1.0,
        step: 0.05,
      },
    )

    basicFolder.addBinding(
      this.motionParams,
      'yOffsetScale',
      {
        label: 'Y轴错开程度',
        min: 0.0,
        max: 5.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.clearTrajectories() // 清空轨迹以便观察新的轨道
    })

    // 扰动参数
    const perturbFolder = this.debugFolder.addFolder({
      title: '轨道扰动',
      expanded: false,
    })

    perturbFolder.addBinding(
      this.motionParams,
      'perturbationRadius',
      {
        label: '扰动幅度',
        min: 0.0,
        max: 3.0,
        step: 0.1,
      },
    )

    perturbFolder.addBinding(
      this.motionParams,
      'perturbationSpeed',
      {
        label: '扰动频率',
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    )

    perturbFolder.addBinding(
      this.motionParams,
      'harmonicCount',
      {
        label: '谐波数量',
        min: 1,
        max: 5,
        step: 1,
      },
    )

    // 相互作用参数
    const interactionFolder = this.debugFolder.addFolder({
      title: '星球间相互作用',
      expanded: false,
    })

    interactionFolder.addBinding(
      this.motionParams,
      'interactionStrength',
      {
        label: '作用强度',
        min: 0.0,
        max: 2.0,
        step: 0.1,
      },
    )

    interactionFolder.addBinding(
      this.motionParams,
      'interactionPhase',
      {
        label: '相位差',
        min: 0.0,
        max: 1.0,
        step: 0.05,
      },
    )

    // 复杂性参数
    const complexityFolder = this.debugFolder.addFolder({
      title: '复杂性与混沌',
      expanded: false,
    })

    complexityFolder.addBinding(
      this.motionParams,
      'chaosStrength',
      {
        label: '混沌强度',
        min: 0.0,
        max: 1.0,
        step: 0.05,
      },
    )

    complexityFolder.addBinding(
      this.motionParams,
      'verticalAmplitude',
      {
        label: '垂直幅度',
        min: 0.0,
        max: 2.0,
        step: 0.1,
      },
    )

    complexityFolder.addBinding(
      this.motionParams,
      'verticalFreq',
      {
        label: '垂直频率',
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    )

    // 控制按钮
    const controlFolder = this.debugFolder.addFolder({
      title: '控制',
      expanded: true,
    })

    controlFolder.addBinding(
      this,
      'showTrajectories',
      {
        label: '显示轨迹',
      },
    ).on('change', () => {
      if (!this.showTrajectories) {
        this.clearTrajectories()
      }
    })

    controlFolder.addButton({
      title: '重置运动',
    }).on('click', () => {
      this.timeOffset = 0
      this.clearTrajectories()
    })

    controlFolder.addButton({
      title: '随机化参数',
    }).on('click', () => {
      this.randomizeMotionParameters()
    })

    // 预设按钮
    const presetFolder = this.debugFolder.addFolder({
      title: '运动预设',
      expanded: false,
    })

    const presets = [
      { text: '经典三体', value: 'classic' },
      { text: '稳定轨道', value: 'stable' },
      { text: '混沌舞蹈', value: 'chaos' },
      { text: '螺旋运动', value: 'spiral' },
      { text: '花朵轨迹', value: 'flower' },
    ]

    presets.forEach((preset) => {
      presetFolder.addButton({
        title: preset.text,
      }).on('click', () => {
        this.applyMotionPreset(preset.value)
      })
    })

    // ===== 速度控制面板 =====
    const speedFolder = this.debugFolder.addFolder({
      title: '🚀 星体运动速度',
      expanded: true,
    })

    // 速度模式选择
    const speedModeOptions = {
      统一速度: 'uniform',
      基于大小: 'size_based',
      自定义: 'custom',
    }

    speedFolder.addBlade({
      view: 'list',
      label: '速度模式',
      options: Object.entries(speedModeOptions).map(([text, value]) => ({ text, value })),
      value: this.speedMode,
    }).on('change', (e) => {
      this.speedMode = e.value
      if (e.value === 'size_based') {
        this.updateSpeedMultipliers()
      }
      this.clearTrajectories()
    })

    // 个别星体速度控制
    const individualSpeedFolder = speedFolder.addFolder({
      title: '个别星体速度',
      expanded: true,
    })

    // 为每个星体添加速度控制
    const planetNames = ['Planet A (大)', 'Planet B (小)', 'Planet C (中)']

    this.planetSpeeds.forEach((speedConfig, index) => {
      const planetFolder = individualSpeedFolder.addFolder({
        title: planetNames[index],
        expanded: false,
      })

      planetFolder.addBinding(speedConfig, 'speedMultiplier', {
        label: '速度倍数',
        min: 0.2,
        max: 2.0,
        step: 0.1,
      }).on('change', () => {
        this.speedMode = 'custom' // 手动调整时切换到自定义模式
        this.clearTrajectories()
      })
    })

    // 速度预设
    const speedPresetFolder = speedFolder.addFolder({
      title: '速度预设',
      expanded: false,
    })

    const speedPresets = [
      { text: '统一速度', value: 'uniform' },
      { text: '物理真实', value: 'physics_based' },
      { text: '艺术效果', value: 'artistic' },
      { text: '谐波关系', value: 'harmonic' },
      { text: '随机混沌', value: 'chaotic' },
    ]

    speedPresets.forEach((preset) => {
      speedPresetFolder.addButton({
        title: preset.text,
      }).on('click', () => {
        this.applySpeedPreset(preset.value)
      })
    })
  }

  // 清空轨迹
  clearTrajectories() {
    this.trajectories = []
  }

  // 获取特定星体的运动速度
  getPlanetSpeed(planetIndex) {
    const baseSpeed = this.motionParams.primarySpeed * 2

    switch (this.speedMode) {
      case 'uniform':
        // 统一速度
        return baseSpeed

      case 'size_based':
        // 基于星体大小的速度：大星体慢，小星体快
        return baseSpeed * this.planetSpeeds[planetIndex].speedMultiplier

      case 'custom':
        // 自定义速度
        return this.planetSpeeds[planetIndex].baseSpeed * this.planetSpeeds[planetIndex].speedMultiplier

      default:
        return baseSpeed
    }
  }

  // 更新速度倍数配置
  updateSpeedMultipliers() {
    if (this.speedMode === 'size_based') {
      // 根据星体半径自动计算速度倍数
      const planetRadii = [
        RADIUS * 1.2, // Planet A - 最大
        RADIUS * 0.7, // Planet B - 最小
        RADIUS * 1.0, // Planet C - 中等
      ]

      // 计算相对速度：半径越大，速度越慢
      const maxRadius = Math.max(...planetRadii)
      const minRadius = Math.min(...planetRadii)
      const radiusRange = maxRadius - minRadius

      this.planetSpeeds.forEach((speedConfig, index) => {
        const radius = planetRadii[index]
        // 线性映射：大半径 -> 低速度
        const normalizedRadius = (radius - minRadius) / radiusRange
        speedConfig.speedMultiplier = 1.4 - (normalizedRadius * 0.6) // 范围: 0.8 - 1.4
      })
    }
  }

  // 预设速度配置
  applySpeedPreset(presetName) {
    switch (presetName) {
      case 'uniform':
        // 统一速度
        this.speedMode = 'uniform'
        break

      case 'physics_based':
        // 基于物理的速度：大质量慢速度
        this.speedMode = 'size_based'
        this.planetSpeeds[0].speedMultiplier = 0.7 // 大星体，慢
        this.planetSpeeds[1].speedMultiplier = 1.4 // 小星体，快
        this.planetSpeeds[2].speedMultiplier = 1.0 // 中等星体，中等
        break

      case 'artistic':
        // 艺术效果：创造有趣的视觉模式
        this.speedMode = 'custom'
        this.planetSpeeds[0].speedMultiplier = 0.8
        this.planetSpeeds[1].speedMultiplier = 1.6 // 很快，创造追逐效果
        this.planetSpeeds[2].speedMultiplier = 0.9
        break

      case 'harmonic':
        // 谐波关系：速度比为简单整数比
        this.speedMode = 'custom'
        this.planetSpeeds[0].speedMultiplier = 0.5 // 1:2:3 的速度关系
        this.planetSpeeds[1].speedMultiplier = 1.0
        this.planetSpeeds[2].speedMultiplier = 1.5
        break

      case 'chaotic':
        // 混沌模式：随机但有限制的速度
        this.speedMode = 'custom'
        this.planetSpeeds.forEach((speedConfig) => {
          speedConfig.speedMultiplier = 0.6 + Math.random() * 0.8 // 0.6-1.4 范围
        })
        break
    }

    this.clearTrajectories()
  }

  // 辅助方法：获取星体配置信息
  getPlanetInfo(index) {
    const configs = [
      { name: 'Planet A', radius: RADIUS * 1.2, mass: 'Large' },
      { name: 'Planet B', radius: RADIUS * 0.7, mass: 'Small' },
      { name: 'Planet C', radius: RADIUS * 1.0, mass: 'Medium' },
    ]
    return configs[index]
  }

  // 随机化运动参数
  randomizeMotionParameters() {
    this.motionParams.perturbationRadius = 0.5 + Math.random() * 2.5
    this.motionParams.perturbationSpeed = 0.3 + Math.random() * 1.5
    this.motionParams.interactionStrength = Math.random() * 1.5
    this.motionParams.interactionPhase = Math.random()
    this.motionParams.chaosStrength = Math.random() * 0.8
    this.motionParams.verticalAmplitude = Math.random() * 1.5
    this.motionParams.verticalFreq = 0.2 + Math.random() * 1.5
    this.motionParams.harmonicCount = Math.floor(1 + Math.random() * 4)
    this.motionParams.yOffsetScale = 0.5 + Math.random() * 3.0 // 随机Y轴错开程度

    this.clearTrajectories()
  }

  // 应用运动预设
  applyMotionPreset(presetName) {
    switch (presetName) {
      case 'classic':
        Object.assign(this.motionParams, {
          baseRadius: 4.0,
          primarySpeed: 0.3,
          perturbationRadius: 1.5,
          perturbationSpeed: 0.8,
          interactionStrength: 0.6,
          interactionPhase: 0.4,
          harmonicCount: 3,
          chaosStrength: 0.3,
          verticalAmplitude: 0.8,
          verticalFreq: 0.6,
          yOffsetScale: 1.5,
        })
        break

      case 'stable':
        Object.assign(this.motionParams, {
          baseRadius: 5.0,
          primarySpeed: 0.2,
          perturbationRadius: 0.8,
          perturbationSpeed: 0.5,
          interactionStrength: 0.3,
          interactionPhase: 0.2,
          harmonicCount: 2,
          chaosStrength: 0.1,
          verticalAmplitude: 0.3,
          verticalFreq: 0.4,
          yOffsetScale: 2.0,
        })
        break

      case 'chaos':
        Object.assign(this.motionParams, {
          baseRadius: 3.5,
          primarySpeed: 0.4,
          perturbationRadius: 2.2,
          perturbationSpeed: 1.2,
          interactionStrength: 1.0,
          interactionPhase: 0.7,
          harmonicCount: 4,
          chaosStrength: 0.6,
          verticalAmplitude: 1.2,
          verticalFreq: 0.9,
          yOffsetScale: 1.0,
        })
        break

      case 'spiral':
        Object.assign(this.motionParams, {
          baseRadius: 4.5,
          primarySpeed: 0.15,
          perturbationRadius: 1.0,
          perturbationSpeed: 0.3,
          interactionStrength: 0.8,
          interactionPhase: 0.1,
          harmonicCount: 2,
          chaosStrength: 0.2,
          verticalAmplitude: 1.5,
          verticalFreq: 0.2,
          yOffsetScale: 3.0,
        })
        break

      case 'flower':
        Object.assign(this.motionParams, {
          baseRadius: 3.0,
          primarySpeed: 0.25,
          perturbationRadius: 1.8,
          perturbationSpeed: 1.5,
          interactionStrength: 0.4,
          interactionPhase: 0.33,
          harmonicCount: 5,
          chaosStrength: 0.15,
          verticalAmplitude: 0.5,
          verticalFreq: 1.2,
          yOffsetScale: 1.2,
        })
        break
    }

    this.clearTrajectories()
  }

  // 将共享光照参数同步到所有星球
  propagateLighting() {
    this.planets.forEach((planet) => {
      if (planet && typeof planet.syncLighting === 'function') {
        planet.syncLighting(this.sharedLighting)
      }
    })
  }

  // 获取特定星球
  getPlanet(index) {
    return this.planets[index]
  }

  // 获取所有星球
  getAllPlanets() {
    return this.planets
  }

  // 销毁三星系统
  destroy() {
    this.planets.forEach((planet) => {
      planet.destroy()
    })
    this.planets = []
    this.clearTrajectories()
  }
}
