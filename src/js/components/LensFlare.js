import { easing } from 'maath'
import * as THREE from 'three'
import lensFlareFragmentShader from '../../shaders/lensflare/fragment.glsl'
import lensFlareVertexShader from '../../shaders/lensflare/vertex.glsl'
import Experience from '../experience.js'

/**
 * Lens Flare 组件，基于 Anderson Mancini 的实现
 * 适配当前框架，使用 Experience 单例管理依赖
 */

export default class LensFlare {
  constructor() {
    // 获取 Experience 单例实例
    this.experience = new Experience()

    // 通过 experience 实例访问核心组件和工具
    this.scene = this.experience.scene
    this.renderer = this.experience.renderer.instance
    this.camera = this.experience.camera.instance
    this.time = this.experience.time
    this.iMouse = this.experience.iMouse
    this.resources = this.experience.resources
    this.debug = this.experience.debug.ui // 调试 UI
    this.debugActive = this.experience.debug.active

    // 组件自身属性
    this.lensFlareContainer = null
    this.lensFlareMaterial = null
    this.lensPosition = new THREE.Vector3(25, 2, -40) // 默认镜头位置（世界坐标）
    this.internalOpacity = 0.8 // 内部不透明度，用于平滑过渡
    this.currentLensPosition = new THREE.Vector2(0, 0) // 当前镜头位置（用于 lerp 插值）

    // 参数对象，用于调试和配置
    this.params = {
      enabled: true, // 是否启用效果
      opacity: 0.8, // 整体不透明度
      colorGain: new THREE.Color(95 / 255, 12 / 255, 10 / 255), // 颜色增益（归一化 0-1）
      starPoints: 5.0, // 星芒点数
      glareSize: 0.225, // 眩光大小
      flareSize: 0.004, // 耀斑大小
      flareSpeed: 0.4, // 耀斑动画速度
      flareShape: 1.2, // 耀斑形状锐度
      haloScale: 0.5, // 光晕缩放
      mouseLerpSpeed: 0.1, // 鼠标跟随插值速度（0-1，值越大跟随越快）
      animated: true, // 动画旋转
      anamorphic: false, // 变形镜头效果
      secondaryGhosts: true, // 次级幽灵
      starBurst: true, // 星爆效果（性能消耗大）
      ghostScale: 0.3, // 幽灵缩放
      aditionalStreaks: true, // 额外条纹
      followMouse: true, // 跟随鼠标
    }

    // 等待资源加载完成后再初始化
    if (this.resources) {
      this.resources.on('ready', () => {
        this.setLensFlare()
      })
    }
    else {
      // 如果无资源系统，直接初始化
      this.setLensFlare()
    }

    // 初始化调试面板
    if (this.debugActive) {
      this.debugInit()
    }
  }

  /**
   * 设置 Lens Flare 效果，包括材质和容器创建
   */
  setLensFlare() {
    // 更新材质参数
    this.updateMaterialParams()

    // 内部工具对象
    const viewport = new THREE.Vector4()
    const flarePosition = new THREE.Vector3()
    const raycaster = new THREE.Raycaster()
    const oldOpacity = this.params.opacity

    // 加载镜头污渍纹理
    let lensDirtTexture = null
    if (this.resources && this.resources.items && this.resources.items.lensDirtTexture) {
      lensDirtTexture = this.resources.items.lensDirtTexture
    }
    else {
      // 备用：直接加载外部纹理
      const loader = new THREE.TextureLoader()
      lensDirtTexture = loader.load('https://i.ibb.co/c3x4dBy/lens-Dirt-Texture.jpg')
    }

    // 创建 ShaderMaterial
    this.lensFlareMaterial = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 }, // 时间 uniform
        iResolution: { value: new THREE.Vector2() }, // 视口分辨率
        lensPosition: { value: new THREE.Vector2(0, 0) }, // 镜头位置 (NDC)
        enabled: { value: this.params.enabled },
        colorGain: { value: this.params.colorGain.clone() },
        starPoints: { value: this.params.starPoints },
        glareSize: { value: this.params.glareSize },
        flareSize: { value: this.params.flareSize },
        flareSpeed: { value: this.params.flareSpeed },
        flareShape: { value: this.params.flareShape },
        haloScale: { value: this.params.haloScale },
        opacity: { value: this.internalOpacity }, // 当前不透明度
        animated: { value: this.params.animated },
        anamorphic: { value: this.params.anamorphic },
        secondaryGhosts: { value: this.params.secondaryGhosts },
        starBurst: { value: this.params.starBurst },
        ghostScale: { value: this.params.ghostScale },
        aditionalStreaks: { value: this.params.aditionalStreaks },
        followMouse: { value: this.params.followMouse },
        lensDirtTexture: { value: lensDirtTexture }, // 污渍纹理
      },
      vertexShader: lensFlareVertexShader,
      fragmentShader: lensFlareFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending, // 加法混合
      name: 'LensFlareShader',
    })

    // 设置 onBeforeRender 回调，每帧更新 uniform
    this.lensFlareMaterial.onBeforeRender = (renderer, scene, camera) => {
      const elapsedTime = this.time.elapsed // 使用框架时间

      // 更新分辨率
      renderer.getCurrentViewport(viewport)
      this.lensFlareMaterial.uniforms.iResolution.value.set(viewport.z, viewport.w)

      // 更新镜头位置
      const normalizedMouse = this.iMouse.normalizedMouse

      if (this.params.followMouse) {
        // 跟随鼠标 (NDC 坐标)，使用 lerp 逐渐逼近
        const targetX = normalizedMouse.x * 0.06
        const targetY = normalizedMouse.y * 0.06
        const targetPosition = new THREE.Vector2(targetX, targetY)

        // 使用 lerp 插值逐渐逼近目标位置
        this.currentLensPosition.lerp(targetPosition, this.params.mouseLerpSpeed)

        // 更新 uniform 值
        this.lensFlareMaterial.uniforms.lensPosition.value.copy(this.currentLensPosition)
      }
      else {
        // 投影固定世界位置到屏幕
        const projectedPosition = this.lensPosition.clone().project(camera)
        flarePosition.copy(projectedPosition)

        if (flarePosition.z < 1) { // 在相机前方
          this.lensFlareMaterial.uniforms.lensPosition.value.set(flarePosition.x, flarePosition.y)
        }

        // 射线检测遮挡
        raycaster.setFromCamera(projectedPosition, camera)
        const intersects = raycaster.intersectObjects(this.scene.children, true)
        this.checkTransparency(intersects, oldOpacity)
      }

      // 更新时间
      this.lensFlareMaterial.uniforms.iTime.value = elapsedTime

      // 平滑更新不透明度
      easing.damp(this.lensFlareMaterial.uniforms.opacity, 'value', this.internalOpacity, 0.007, this.time.delta)
    }

    // 创建全屏平面容器
    this.lensFlareContainer = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.lensFlareMaterial,
    )

    // 添加到场景（始终面向相机）
    this.scene.add(this.lensFlareContainer)
  }

  /**
   * 更新材质 uniform 参数（当 params 改变时调用）
   */
  updateMaterialParams() {
    if (this.lensFlareMaterial) {
      this.lensFlareMaterial.uniforms.enabled.value = this.params.enabled
      this.lensFlareMaterial.uniforms.colorGain.value.copy(this.params.colorGain)
      this.lensFlareMaterial.uniforms.starPoints.value = this.params.starPoints
      this.lensFlareMaterial.uniforms.glareSize.value = this.params.glareSize
      this.lensFlareMaterial.uniforms.flareSize.value = this.params.flareSize
      this.lensFlareMaterial.uniforms.flareSpeed.value = this.params.flareSpeed
      this.lensFlareMaterial.uniforms.flareShape.value = this.params.flareShape
      this.lensFlareMaterial.uniforms.haloScale.value = this.params.haloScale
      this.lensFlareMaterial.uniforms.animated.value = this.params.animated
      this.lensFlareMaterial.uniforms.anamorphic.value = this.params.anamorphic
      this.lensFlareMaterial.uniforms.secondaryGhosts.value = this.params.secondaryGhosts
      this.lensFlareMaterial.uniforms.starBurst.value = this.params.starBurst
      this.lensFlareMaterial.uniforms.ghostScale.value = this.params.ghostScale
      this.lensFlareMaterial.uniforms.aditionalStreaks.value = this.params.aditionalStreaks
      this.lensFlareMaterial.uniforms.followMouse.value = this.params.followMouse
      this.internalOpacity = this.params.opacity
    }
  }

  /**
   * 检查透明度遮挡（射线检测）
   * @param {Array} intersects 射线交点数组
   * @param {number} oldOpacity 原始不透明度
   */
  checkTransparency(intersects, oldOpacity) {
    if (intersects.length > 0) {
      const obj = intersects[0].object
      if (obj.visible) {
        const material = obj.material
        if (material.transmission !== undefined) {
          // 透射材质
          this.internalOpacity = material.transmission > 0.2
            ? oldOpacity * (material.transmission * 0.5)
            : 0
        }
        else if (material.transparent) {
          // 透明材质
          this.internalOpacity = material.opacity < 0.98
            ? oldOpacity / (material.opacity * 10)
            : oldOpacity
        }
        else {
          // 不透明材质
          this.internalOpacity = obj.userData.noOcclusion
            ? oldOpacity
            : 0
        }
      }
    }
    else {
      this.internalOpacity = oldOpacity
    }
  }

  /**
   * 初始化调试面板
   * 参考 readme.md 中的 GUI 项，提供实时控制
   */
  debugInit() {
    // ===== Lens Flare 总面板 =====
    this.debugFolder = this.debug.addFolder({
      title: '镜头光晕 (Lens Flare)',
      expanded: true, // 默认折叠
    })

    // ----- 基本控制 -----
    const basicFolder = this.debugFolder.addFolder({
      title: '基本控制',
      expanded: true,
    })
    basicFolder.addBinding(this.params, 'enabled', {
      label: '启用光晕',
    }).on('change', () => this.updateMaterialParams())

    basicFolder.addBinding(this.params, 'followMouse', {
      label: '跟随鼠标',
    }).on('change', () => this.updateMaterialParams())

    basicFolder.addBinding(this.params, 'opacity', {
      label: '不透明度',
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change', () => {
      this.internalOpacity = this.params.opacity
      this.updateMaterialParams()
    })

    // ----- 形状与动画 -----
    const shapeFolder = this.debugFolder.addFolder({
      title: '形状 & 动画',
      expanded: true,
    })
    shapeFolder.addBinding(this.params, 'starPoints', {
      label: '星芒点数',
      min: 0,
      max: 9,
      step: 0.1,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'glareSize', {
      label: '眩光大小',
      min: 0,
      max: 2,
      step: 0.01,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'flareSize', {
      label: '耀斑大小',
      min: 0,
      max: 0.1,
      step: 0.001,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'flareSpeed', {
      label: '耀斑速度',
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'flareShape', {
      label: '耀斑形状',
      min: 0,
      max: 2,
      step: 0.01,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'haloScale', {
      label: '光晕缩放',
      min: -0.5,
      max: 1,
      step: 0.01,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'ghostScale', {
      label: '幽灵大小',
      min: 0,
      max: 2,
      step: 0.01,
    }).on('change', () => this.updateMaterialParams())

    shapeFolder.addBinding(this.params, 'mouseLerpSpeed', {
      label: '鼠标跟随速度',
      min: 0.01,
      max: 1,
      step: 0.01,
    }).on('change', () => {
      // 不需要调用 updateMaterialParams，因为这是运行时参数
    })

    // ----- 效果开关 -----
    const effectsFolder = this.debugFolder.addFolder({
      title: '效果开关',
      expanded: true,
    })
    effectsFolder.addBinding(this.params, 'animated', {
      label: '启用动画',
    }).on('change', () => this.updateMaterialParams())

    effectsFolder.addBinding(this.params, 'anamorphic', {
      label: '变形镜头',
    }).on('change', () => this.updateMaterialParams())

    effectsFolder.addBinding(this.params, 'secondaryGhosts', {
      label: '次级幽灵',
    }).on('change', () => this.updateMaterialParams())

    effectsFolder.addBinding(this.params, 'starBurst', {
      label: '星爆 (高消耗)',
    }).on('change', () => this.updateMaterialParams())

    effectsFolder.addBinding(this.params, 'aditionalStreaks', {
      label: '额外条纹',
    }).on('change', () => this.updateMaterialParams())

    // ----- 颜色控制 -----
    const colorFolder = this.debugFolder.addFolder({
      title: '颜色控制',
      expanded: true,
    })
    colorFolder.addBinding(this.params, 'colorGain', {
      label: '颜色增益',
      view: 'color', // 使用颜色拾取器
    }).on('change', () => {
      // 归一化颜色 (0-1)
      this.params.colorGain.r = this.params.colorGain.r / 255
      this.params.colorGain.g = this.params.colorGain.g / 255
      this.params.colorGain.b = this.params.colorGain.b / 255
      this.updateMaterialParams()
    })
  }

  /**
   * 更新方法，如果父组件需要调用（当前 onBeforeRender 已处理大部分）
   */
  update() {
    // 可扩展：如需要额外更新逻辑
  }

  /**
   * 销毁组件，释放资源
   */
  destroy() {
    if (this.lensFlareContainer) {
      this.scene.remove(this.lensFlareContainer)
      if (this.lensFlareContainer.geometry) {
        this.lensFlareContainer.geometry.dispose()
      }
      if (this.lensFlareMaterial) {
        this.lensFlareMaterial.dispose()
      }
    }
    // 移除调试面板
    if (this.debugFolder) {
      this.debugFolder.dispose()
    }
  }
}
