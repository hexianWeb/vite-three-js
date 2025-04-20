import gsap from 'gsap'
import * as THREE from 'three'
import portalFragmentShader from '../../shaders/portal/fragment.glsl'
import portalVertexShader from '../../shaders/portal/vertex.glsl'
import Experience from '../experience.js'
import DayNightManager from '../ui/day-night-manager.js'

export default class PortalEffect {
  constructor() {
    // 获取 Experience 实例
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug
    this.time = this.experience.time

    // 初始化参数
    this.params = {
      colorA: '#26353c', // 蓝紫色
      colorB: '#c847cb', // 青色
      colorBNight: '#47cb4e', // 夜晚时的颜色
      noiseScale: 4.6, // 噪声缩放
      timeScale: 0.2, // 时间缩放
      glowIntensity: 5.0, // 发光强度
      glowOffset: 1.4, // 发光偏移
    }

    // 初始化
    this.setMaterial()
    this.findPortalMesh()
    this.setupDayNightListener()

    // Debug
    if (this.debug.active) {
      this.debugInit()
    }
  }

  setupDayNightListener() {
    // 监听日夜切换事件
    this.dayNightManager = new DayNightManager()
    this.dayNightManager.on('dayNightToggle', (isNight) => {
      this.handleDayNightTransition(isNight)
    })
  }

  handleDayNightTransition(isNight) {
    // 使用 GSAP 实现颜色平滑过渡
    const targetColor = isNight ? this.params.colorBNight : this.params.colorB
    const currentColor = new THREE.Color()
    currentColor.copy(this.portalMaterial.uniforms.uColorB.value)

    gsap.to(currentColor, {
      r: new THREE.Color(targetColor).r,
      g: new THREE.Color(targetColor).g,
      b: new THREE.Color(targetColor).b,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.portalMaterial.uniforms.uColorB.value.copy(currentColor)
      },
    })
  }

  setMaterial() {
    // 创建传送门的 Shader Material
    this.portalMaterial = new THREE.ShaderMaterial({
      vertexShader: portalVertexShader,
      fragmentShader: portalFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(this.params.colorA) },
        uColorB: { value: new THREE.Color(this.params.colorB) },
        uNoiseScale: { value: this.params.noiseScale },
        uTimeScale: { value: this.params.timeScale },
        uGlowIntensity: { value: this.params.glowIntensity },
        uGlowOffset: { value: this.params.glowOffset },
      },
      side: THREE.DoubleSide,
      transparent: true,
    })
  }

  findPortalMesh() {
    // 遍历场景查找名为 "portalcircle" 的物体
    this.scene.traverse((child) => {
      if (child.name === 'portalcircle') {
        console.warn('找到传送门网格:', child)
        // 保存原始材质以备后用
        this.originalMaterial = child.material
        // 应用传送门材质
        child.material = this.portalMaterial
        // 保存网格引用
        this.portalMesh = child
      }
    })
  }

  debugInit() {
    // 创建调试面板
    this.debugFolder = this.debug.ui.addFolder({
      title: '传送门效果',
      expanded: false,
    })

    // 添加材质可见性控制
    if (this.portalMesh) {
      this.debugFolder.addBinding(
        this.portalMesh,
        'visible',
        {
          label: '显示传送门',
        },
      )
    }

    // 添加颜色控制
    this.debugFolder.addBinding(
      this.params,
      'colorA',
      {
        label: '颜色 A',
        view: 'color',
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uColorA.value.set(this.params.colorA)
    })

    this.debugFolder.addBinding(
      this.params,
      'colorB',
      {
        label: '颜色 B (日间)',
        view: 'color',
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uColorB.value.set(this.params.colorB)
    })

    this.debugFolder.addBinding(
      this.params,
      'colorBNight',
      {
        label: '颜色 B (夜间)',
        view: 'color',
      },
    )

    // 添加噪声控制
    this.debugFolder.addBinding(
      this.params,
      'noiseScale',
      {
        label: '噪声缩放',
        min: 0.1,
        max: 10.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uNoiseScale.value = this.params.noiseScale
    })

    this.debugFolder.addBinding(
      this.params,
      'timeScale',
      {
        label: '时间缩放',
        min: 0.0,
        max: 1.0,
        step: 0.01,
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uTimeScale.value = this.params.timeScale
    })

    // 添加发光控制
    this.debugFolder.addBinding(
      this.params,
      'glowIntensity',
      {
        label: '发光强度',
        min: 0.0,
        max: 10.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uGlowIntensity.value = this.params.glowIntensity
    })

    this.debugFolder.addBinding(
      this.params,
      'glowOffset',
      {
        label: '发光偏移',
        min: 0.0,
        max: 3.0,
        step: 0.1,
      },
    ).on('change', () => {
      this.portalMaterial.uniforms.uGlowOffset.value = this.params.glowOffset
    })
  }

  update() {
    // 更新时间 uniform
    if (this.portalMaterial) {
      this.portalMaterial.uniforms.uTime.value = this.time.elapsed * 0.001
    }
  }
}
