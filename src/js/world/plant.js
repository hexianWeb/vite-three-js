import * as THREE from 'three'

// 导入着色器
import planetFragmentShader from '../../shaders/planet/fragment.glsl'
import planetVertexShader from '../../shaders/planet/vertex.glsl'
import Experience from '../experience.js'

// 构建单个星球
export default class Plant {
  constructor(options = {}) {
    // 获取 Experience 单例实例
    this.experience = new Experience()

    // 通过 experience 实例访问核心组件和工具
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug
    this.time = this.experience.time

    // 星球属性 - 支持传入参数
    this.planet = null
    this.radius = options.radius || 1.0 // 星球半径，支持传入
    this.textureName = options.texture || 'planetTexture' // 纹理名称，支持传入
    this.position = { x: 0, y: 0, z: 0 } // 星球位置
    this.rotation = { x: 0, y: 0, z: 0 } // 星球旋转速度

    this.params = {
      ambientLight: '#8282d2',
      ambientLightIntensity: 0.25,
      pointLightColor: '#d8aaf5',
      pointLightIntensity: 6.0,
      pointLightPosition: {
        x: -5.0,
        y: 0.5,
      },
      roughness: 0.7,
      metalness: 0.1,
      normalScale: 1.0,
      displacementScale: 0.1,
    }
    // 初始化星球
    this.init()

    // 添加调试控制
    if (this.debug.active) {
      this.debugInit()
      this.debuggerInit() // 新增的光照调节面板
    }
  }

  init() {
    // 创建星球几何体（增加细分以支持置换）
    this.geometry = new THREE.SphereGeometry(this.radius, 128, 64)

    // 设置主纹理
    const texture = this.resources.items[this.textureName]
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16

    // 设置法线贴图
    const normalMap = this.resources.items.planetNormal
    normalMap.anisotropy = 16

    // 设置置换贴图
    const displacementMap = this.resources.items.planetDisplacement
    displacementMap.anisotropy = 16
    // 创建着色器材质，模拟光照
    this.material = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        // 纹理
        uTexture: { value: texture },
        uNormalMap: { value: normalMap },
        uDisplacementMap: { value: displacementMap },

        // 贴图强度
        uNormalScale: { value: this.params.normalScale },
        uDisplacementScale: { value: this.params.displacementScale },

        // 环境光（柔和的蓝白色环境光）
        uAmbientLight: new THREE.Uniform(new THREE.Color(this.params.ambientLight)),
        uAmbientLightIntensity: { value: this.params.ambientLightIntensity },

        // 点光源颜色
        uPointLightColor: { value: new THREE.Color(this.params.pointLightColor) },
        uPointLightIntensity: { value: this.params.pointLightIntensity },

        // 点光源位置
        uPointLightPosition: { value: new THREE.Vector3(this.params.pointLightPosition.x, 0, this.params.pointLightPosition.y) },

        // 材质属性
        uRoughness: { value: this.params.roughness },
        uMetalness: { value: this.params.metalness },
      },
    })

    // 创建星球网格
    this.planet = new THREE.Mesh(this.geometry, this.material)
    this.planet.position.set(this.position.x, this.position.y, this.position.z)

    // 创建点光源位置指示器
    this.createLightIndicator()

    // 添加到场景
    this.scene.add(this.planet)
  }

  // 创建点光源位置指示器
  createLightIndicator() {
    // 创建二十面体几何体作为光源指示器
    this.lightIndicatorGeometry = new THREE.IcosahedronGeometry(0.1, 0)

    // 创建发光材质
    this.lightIndicatorMaterial = new THREE.MeshBasicMaterial({
      color: this.params.pointLightColor,
      transparent: true,
      opacity: 0.8,
    })

    // 创建光源指示器网格
    this.lightIndicator = new THREE.Mesh(this.lightIndicatorGeometry, this.lightIndicatorMaterial)

    // 设置初始位置
    this.updateLightIndicatorPosition()

    // 添加到场景
    this.scene.add(this.lightIndicator)
  }

  // 更新光源指示器位置
  updateLightIndicatorPosition() {
    if (this.lightIndicator) {
      this.lightIndicator.position.set(
        this.params.pointLightPosition.x,
        0,
        this.params.pointLightPosition.y,
      )
    }
  }

  // 更新光源指示器颜色
  updateLightIndicatorColor() {
    if (this.lightIndicatorMaterial) {
      this.lightIndicatorMaterial.color.set(this.params.pointLightColor)
    }
  }

  // 更新星球（自转）
  update() {
    if (this.planet) {
      // 星球自转
      this.planet.rotation.y -= this.rotation.y * this.time.delta * 0.0005
    }

    // 让光源指示器缓慢旋转，增加视觉效果
    if (this.lightIndicator) {
      this.lightIndicator.rotation.x += this.time.delta * 0.001
      this.lightIndicator.rotation.y += this.time.delta * 0.002
    }
  }

  // 调试控制面板
  debugInit() {
    // ===== 星球控制面板 =====
    this.debugFolder = this.debug.ui.addFolder({
      title: '星球控制',
      expanded: true,
    })

    // ----- 基本属性控制 -----
    const basicFolder = this.debugFolder.addFolder({
      title: '基本属性',
      expanded: true,
    })

    // 星球半径控制
    basicFolder.addBinding(
      this,
      'radius',
      {
        label: '星球半径',
        min: 0.1,
        max: 5.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.updateGeometry()
    })

    // 位置控制
    const positionFolder = this.debugFolder.addFolder({
      title: '位置控制',
      expanded: false,
    })

    positionFolder.addBinding(
      this.position,
      'x',
      {
        label: 'X 位置',
        min: -10,
        max: 10,
        step: 0.1,
      },
    ).on('change', () => {
      this.updatePosition()
    })

    positionFolder.addBinding(
      this.position,
      'y',
      {
        label: 'Y 位置',
        min: -10,
        max: 10,
        step: 0.1,
      },
    ).on('change', () => {
      this.updatePosition()
    })

    positionFolder.addBinding(
      this.position,
      'z',
      {
        label: 'Z 位置',
        min: -10,
        max: 10,
        step: 0.1,
      },
    ).on('change', () => {
      this.updatePosition()
    })

    // 旋转速度控制
    const rotationFolder = this.debugFolder.addFolder({
      title: '自转速度',
      expanded: false,
    })

    rotationFolder.addBinding(
      this.rotation,
      'y',
      {
        label: 'Y轴旋转速度',
        min: -5,
        max: 5,
        step: 0.1,
      },
    )
    // 材质控制
    const materialFolder = this.debugFolder.addFolder({
      title: '材质属性',
      expanded: false,
    })

    materialFolder.addBinding(
      this.material.uniforms.uRoughness,
      'value',
      {
        label: '粗糙度',
        min: 0,
        max: 1,
        step: 0.01,
      },
    )

    materialFolder.addBinding(
      this.material.uniforms.uMetalness,
      'value',
      {
        label: '金属度',
        min: 0,
        max: 1,
        step: 0.01,
      },
    )

    // 贴图强度控制
    const textureFolder = this.debugFolder.addFolder({
      title: '表面细节',
      expanded: false,
    })

    // 法线贴图强度
    textureFolder.addBinding(
      this.params,
      'normalScale',
      {
        label: '法线强度',
        min: 0.0,
        max: 3.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uNormalScale.value = this.params.normalScale
    })

    // 置换贴图强度
    textureFolder.addBinding(
      this.params,
      'displacementScale',
      {
        label: '置换强度',
        min: 0.0,
        max: 1.0,
        step: 0.01,
      },
    ).on('change', () => {
      this.material.uniforms.uDisplacementScale.value = this.params.displacementScale
    })

    // 纹理切换
    const textureOptions = [
      { text: '星球纹理1', value: 'planetTexture' },
      { text: '星球纹理2', value: 'planetTexture2' },
      { text: '星球纹理3', value: 'planetTexture3' },
    ]

    const currentTexture = this.textureName
    materialFolder.addBinding(
      { texture: currentTexture },
      'texture',
      {
        label: '纹理选择',
        options: textureOptions,
      },
    ).on('change', (event) => {
      this.material.uniforms.uTexture.value = this.resources.items[event.value]
      this.textureName = event.value
    })
  }

  // 更新几何体
  updateGeometry() {
    if (this.planet) {
      this.planet.geometry.dispose()
      this.planet.geometry = new THREE.SphereGeometry(this.radius, 64, 32)
    }
  }

  // 更新位置
  updatePosition() {
    if (this.planet) {
      this.planet.position.set(this.position.x, this.position.y, this.position.z)
    }
  }

  // 设置星球纹理
  setTexture(textureName) {
    if (this.resources.items[textureName]) {
      this.material.uniforms.uTexture.value = this.resources.items[textureName]
      this.textureName = textureName
    }
  }

  // 设置星球位置
  setPosition(x, y, z) {
    this.position.x = x
    this.position.y = y
    this.position.z = z
    this.updatePosition()
  }

  // 设置自转速度
  setRotationSpeed(x, y, z = 0) {
    this.rotation.x = x
    this.rotation.y = y
    this.rotation.z = z
  }

  // 新增光照调节面板
  debuggerInit() {
    // ===== 光照调节面板 =====
    this.lightingDebugFolder = this.debug.ui.addFolder({
      title: '🌟 光照调节面板',
      expanded: true,
    })

    // ----- 环境光控制 -----
    const ambientFolder = this.lightingDebugFolder.addFolder({
      title: '环境光设置',
      expanded: true,
    })

    // 环境光颜色
    ambientFolder.addBinding(
      this.params,
      'ambientLight',
      {
        label: '环境光颜色',
        picker: 'inline',
        type: 'color',
      },
    ).on('change', ({ value }) => {
      this.material.uniforms.uAmbientLight.value = new THREE.Color(value)
    })

    // 环境光强度
    ambientFolder.addBinding(
      this.params,
      'ambientLightIntensity',
      {
        label: '环境光强度',
        min: 0.0,
        max: 3.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uAmbientLightIntensity.value = this.params.ambientLightIntensity
    })

    // ----- 点光源控制 -----
    const pointLightFolder = this.lightingDebugFolder.addFolder({
      title: '点光源设置',
      expanded: true,
    })

    // 点光源颜色
    pointLightFolder.addBinding(
      this.params,
      'pointLightColor',
      {
        label: '点光源颜色',
        picker: 'inline',
      },
    ).on('change', ({ value }) => {
      this.material.uniforms.uPointLightColor.value = new THREE.Color(value)
      this.updateLightIndicatorColor()
    })

    // 点光源强度
    pointLightFolder.addBinding(
      this.params,
      'pointLightIntensity',
      {
        label: '点光源强度',
        min: 0.0,
        max: 5.0,
        step: 0.1,
      },
    ).on('change', ({ value }) => {
      this.material.uniforms.uPointLightIntensity.value = value
    })

    // ----- 点光源位置控制 -----
    const lightPositionFolder = pointLightFolder.addFolder({
      title: '光源位置',
      expanded: true,
    })

    lightPositionFolder.addBinding(
      this.params,
      'pointLightPosition',
      {
        label: '光源位置',
        min: -5,
        max: 5,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uPointLightPosition.value.set(this.params.pointLightPosition.x, 0, this.params.pointLightPosition.y)
      this.updateLightIndicatorPosition()
    })

    // ----- 快速预设 -----
    const presetFolder = this.lightingDebugFolder.addFolder({
      title: '光照预设',
      expanded: false,
    })

    // 预设选项
    const lightPresets = [
      { text: '默认设置', value: 'default' },
      { text: '暖色调', value: 'warm' },
      { text: '冷色调', value: 'cool' },
      { text: '强光照', value: 'bright' },
      { text: '柔和光照', value: 'soft' },
      { text: '戏剧性光照', value: 'dramatic' },
    ]

    presetFolder.addBinding(
      { preset: 'default' },
      'preset',
      {
        label: '选择预设',
        options: lightPresets,
      },
    ).on('change', (event) => {
      this.applyLightingPreset(event.value)
    })
  }

  // 应用光照预设
  applyLightingPreset(presetName) {
    switch (presetName) {
      case 'default':
        this.params.ambientLight = '#d2b9e5'
        this.params.ambientLightIntensity = 0.6
        this.params.pointLightColor = '#ffff88'
        this.params.pointLightIntensity = 2.0
        this.params.pointLightPosition = { x: 5.0, y: 3.0 }
        this.params.normalScale = 1.0
        this.params.displacementScale = 0.1
        break

      case 'warm':
        this.params.ambientLight = '#fff5e6'
        this.params.ambientLightIntensity = 0.4
        this.params.pointLightColor = '#ffa500'
        this.params.pointLightIntensity = 3.0
        this.params.pointLightPosition = { x: 4.0, y: 4.0 }
        this.params.normalScale = 1.5
        this.params.displacementScale = 0.15
        break

      case 'cool':
        this.params.ambientLight = '#e6f3ff'
        this.params.ambientLightIntensity = 0.8
        this.params.pointLightColor = '#87ceeb'
        this.params.pointLightIntensity = 2.5
        this.params.pointLightPosition = { x: -3.0, y: 2.0 }
        this.params.normalScale = 0.8
        this.params.displacementScale = 0.05
        break

      case 'bright':
        this.params.ambientLight = '#ffffff'
        this.params.ambientLightIntensity = 1.0
        this.params.pointLightColor = '#ffffff'
        this.params.pointLightIntensity = 4.0
        this.params.pointLightPosition = { x: 0.0, y: 6.0 }
        this.params.normalScale = 2.0
        this.params.displacementScale = 0.2
        break

      case 'soft':
        this.params.ambientLight = '#f0f0f0'
        this.params.ambientLightIntensity = 1.2
        this.params.pointLightColor = '#ffe4e1'
        this.params.pointLightIntensity = 1.5
        this.params.pointLightPosition = { x: 2.0, y: 2.0 }
        this.params.normalScale = 0.5
        this.params.displacementScale = 0.03
        break

      case 'dramatic':
        this.params.ambientLight = '#1a1a2e'
        this.params.ambientLightIntensity = 0.2
        this.params.pointLightColor = '#ff6b6b'
        this.params.pointLightIntensity = 5.0
        this.params.pointLightPosition = { x: -5.0, y: 1.0 }
        this.params.normalScale = 2.5
        this.params.displacementScale = 0.25
        break
    }

    // 更新所有 uniforms
    this.material.uniforms.uAmbientLight.value = new THREE.Color(this.params.ambientLight)
    this.material.uniforms.uAmbientLightIntensity.value = this.params.ambientLightIntensity
    this.material.uniforms.uPointLightColor.value = new THREE.Color(this.params.pointLightColor)
    this.material.uniforms.uPointLightIntensity.value = this.params.pointLightIntensity
    this.material.uniforms.uPointLightPosition.value.set(
      this.params.pointLightPosition.x,
      0,
      this.params.pointLightPosition.y,
    )

    // 更新贴图强度
    this.material.uniforms.uNormalScale.value = this.params.normalScale
    this.material.uniforms.uDisplacementScale.value = this.params.displacementScale

    // 更新指示器
    this.updateLightIndicatorPosition()
    this.updateLightIndicatorColor()
  }

  // 销毁星球
  destroy() {
    if (this.planet) {
      this.scene.remove(this.planet)
      this.geometry.dispose()
      this.material.dispose()
    }

    // 清理光源指示器
    if (this.lightIndicator) {
      this.scene.remove(this.lightIndicator)
      this.lightIndicatorGeometry.dispose()
      this.lightIndicatorMaterial.dispose()
    }
  }
}
