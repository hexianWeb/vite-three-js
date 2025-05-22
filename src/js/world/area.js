import gsap from 'gsap'
import * as THREE from 'three'

import outlineFragmentShader from '../../shaders/outline/fragment.glsl'
// 导入着色器代码
import outlineVertexShader from '../../shaders/outline/vertex.glsl'

import Experience from '../experience.js'
import BrandDialog from './brandDialog.js'
import Chicken from './chicken.js'
import Skybox from './skybox.js'

export default class Area {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse
    this.time = this.experience.time // 获取 time 实例
    this.debug = this.experience.debug

    // Initialize brand dialog
    this.brandDialog = new BrandDialog()

    this.homeStuffs = [
      // 床
      'bedroll',
      'bedroll-packed',
      'tent-canvas',
      // 啤酒
      'chest',
      'bottle',
      // 铁砧
      'workbench-anvil',
      'tool-axe-upgraded',
      'tool-hammer',
      'weapon-rack',
      // 武器
      'weapon-sword',
      // 椅子 + 饭
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
      '圆环',
      // 锅
      'pan',
      // 水井
      'spawn-round',
    ]
    this.homeStuffsObject = []
    this.brandStuffs = ['brand1', 'brand2', 'brand3']
    this.brandStuffsObject = []
    this.outlineMeshes = [] // 存储轮廓网格和它们的材质

    this.raycaster = new THREE.Raycaster()

    // 创建基础轮廓材质（作为模板）
    this.createBaseMaterial()

    // 如果debug模式激活，添加调试面板
    if (this.debug.active) {
      this.debugInit()
    }

    // Store the currently hovered object
    this.hoveredObject = null

    // 小鸡实例
    this.chicken = new Chicken()

    this.setupArea()
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('click', this.onMouseDown.bind(this))
  }

  // 创建基础材质方法
  createBaseMaterial() {
    // 定义默认参数
    this.outlineParams = {
      thickness: 0.051,
      color: '#d7df9c',
      opacity: 0.8,
      breathingSpeed: 4.0,
      breathingMin: 0.6,
      breathingRange: 0.4,
      timeOffset: Math.PI * 2,
    }

    // 基础材质配置
    this.baseMaterialConfig = {
      uniforms: {
        uOutlineThickness: { value: this.outlineParams.thickness },
        uOutlineColor: { value: new THREE.Color(this.outlineParams.color) },
        uTime: { value: 0 },
        uOpacity: { value: this.outlineParams.opacity },
        uTimeOffset: { value: this.outlineParams.timeOffset },
        uBreathingSpeed: { value: this.outlineParams.breathingSpeed },
        uBreathingMin: { value: this.outlineParams.breathingMin },
        uBreathingRange: { value: this.outlineParams.breathingRange },
      },
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      side: THREE.BackSide,
      transparent: true,
    }
  }

  // 创建独立材质实例方法
  createMaterialInstance(_index) {
    // 为每个实例创建新的uniforms对象
    const materialConfig = {
      ...this.baseMaterialConfig,
      uniforms: {
        ...this.baseMaterialConfig.uniforms,
        uTimeOffset: { value: (_index / this.homeStuffs.length) * Math.PI * 2 + Math.random() },
      },
    }
    return new THREE.ShaderMaterial(materialConfig)
  }

  setupArea() {
    this.model = this.resources.items.sceneModel
    let meshIndex = 0 // 用于生成时间偏移

    // 设置模型接受阴影
    this.model.scene.traverse((child) => {
      if (this.homeStuffs.includes(child.name)) {
        this.homeStuffsObject.push(child)

        // 确保子对象是 Mesh 并且有几何体
        if (child instanceof THREE.Mesh && child.geometry) {
          // 为每个轮廓创建独立的材质实例
          const outlineMaterial = this.createMaterialInstance(meshIndex++)

          // 创建轮廓网格
          const outlineMesh = new THREE.Mesh(child.geometry, outlineMaterial)
          outlineMesh.name = `${child.name}_outline`
          outlineMesh.castShadow = false
          outlineMesh.receiveShadow = false

          // 将轮廓网格添加为原始网格的子对象
          child.add(outlineMesh)
          // 保存轮廓网格和它的材质引用
          this.outlineMeshes.push({ mesh: outlineMesh, material: outlineMaterial })
        }
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

    // ====== 天空盒迁移 ======
    // 原有天空盒代码已移除
    this.skybox = new Skybox()

    // 显示小鸡交互提示
    this.chicken.showInteractionPrompt()
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

        // Scale up new object (父对象缩放，子轮廓也会一起缩放)
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
    // 检查是否点击到小鸡
    if (this.chicken && this.chicken.chickenObject) {
      this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera)
      const chickenIntersects = this.raycaster.intersectObject(this.chicken.chickenObject, true)
      if (chickenIntersects.length > 0) {
        this.chicken.onClick()
        return // 避免后续 brandStuffsObject 检测
      }
    }
    const intersects = this.raycaster.intersectObjects(this.brandStuffsObject)
    if (intersects.length > 0) {
      const brandName = intersects[0].object.parent.name
      this.brandDialog.showDialog(brandName)
    }
  }

  update() {
    // 更新每个轮廓材质的时间 uniform
    const time = this.time.elapsed * 0.002
    for (const { material } of this.outlineMeshes) {
      material.uniforms.uTime.value = time
    }
    // 更新小鸡动画
    if (this.chicken) {
      this.chicken.update()
    }
  }

  // 调试面板初始化
  debugInit() {
    // ===== 轮廓发光控制面板 =====
    this.debugFolder = this.debug.ui.addFolder({
      title: '轮廓发光效果',
      expanded: false,
    })

    // ----- 基本属性控制 -----
    const basicFolder = this.debugFolder.addFolder({
      title: '基本属性',
      expanded: true,
    })

    // 轮廓厚度控制
    basicFolder.addBinding(
      this.outlineParams,
      'thickness',
      {
        label: '轮廓厚度',
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uOutlineThickness.value = this.outlineParams.thickness
      })
    })

    // 轮廓颜色控制
    basicFolder.addBinding(
      this.outlineParams,
      'color',
      {
        label: '轮廓颜色',
        view: 'color',
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uOutlineColor.value.set(this.outlineParams.color)
      })
    })

    // 基础不透明度控制
    basicFolder.addBinding(
      this.outlineParams,
      'opacity',
      {
        label: '基础不透明度',
        min: 0,
        max: 1,
        step: 0.01,
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uOpacity.value = this.outlineParams.opacity
      })
    })

    // ----- 呼吸效果控制 -----
    const breathingFolder = this.debugFolder.addFolder({
      title: '呼吸效果',
      expanded: true,
    })

    // 呼吸速度控制
    breathingFolder.addBinding(
      this.outlineParams,
      'breathingSpeed',
      {
        label: '呼吸速度',
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uBreathingSpeed.value = this.outlineParams.breathingSpeed
      })
    })

    // 最小亮度控制
    breathingFolder.addBinding(
      this.outlineParams,
      'breathingMin',
      {
        label: '最小亮度',
        min: 0,
        max: 1,
        step: 0.01,
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uBreathingMin.value = this.outlineParams.breathingMin
      })
    })

    // 亮度变化范围控制
    breathingFolder.addBinding(
      this.outlineParams,
      'breathingRange',
      {
        label: '亮度变化范围',
        min: 0,
        max: 1,
        step: 0.01,
      },
    ).on('change', () => {
      this.outlineMeshes.forEach(({ material }) => {
        material.uniforms.uBreathingRange.value = this.outlineParams.breathingRange
      })
    })
  }
}
