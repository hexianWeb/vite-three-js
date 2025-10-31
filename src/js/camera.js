import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

import Experience from './experience.js'

export default class Camera {
  constructor(orthographic = false) {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas
    this.orthographic = orthographic
    this.debug = this.experience.debug
    this.debugActive = this.experience.debug.active

    this.position = new THREE.Vector3(0, 15, 0)
    this.target = new THREE.Vector3(0, 0, 0)

    this.setInstance()
    this.setControls()
    this.setDebug()
  }

  // 添加 throttle 函数（优化延迟）
  throttle(func, limit) {
    let inThrottle
    return function (...args) {
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // 添加平滑插值相机位置的属性
  setInstance() {
    if (this.orthographic) {
      const aspect = this.sizes.aspect
      this.frustumSize = 1

      this.instance = new THREE.OrthographicCamera(
        -this.frustumSize * aspect,
        this.frustumSize * aspect,
        this.frustumSize,
        -this.frustumSize,
        -1,
        100,
      )
    }
    else {
      this.instance = new THREE.PerspectiveCamera(
        34,
        this.sizes.width / this.sizes.height,
        0.1,
        100,
      )
    }
    this.instance.position.copy(this.position)
    this.instance.lookAt(this.target)
    this.scene.add(this.instance)

    // 初始化目标位置用于平滑插值
    this.targetPosition = this.position.clone()
  }

  setControls() {
    // OrbitControls 设置
    this.orbitControls = new OrbitControls(this.instance, this.canvas)
    this.orbitControls.enableRotate = false
    this.orbitControls.enablePan = false
    this.orbitControls.enableDamping = false
    this.orbitControls.enableZoom = false // 禁用缩放
    this.orbitControls.target.copy(this.target)

    // TrackballControls 设置
    this.trackballControls = new TrackballControls(this.instance, this.canvas)
    this.trackballControls.noRotate = true // 禁用旋转
    this.trackballControls.noPan = true // 禁用平移
    this.trackballControls.noZoom = false // 启用缩放
    this.trackballControls.zoomSpeed = 0.5 // 设置缩放速度
    this.trackballControls.minDistance = 5
    this.trackballControls.maxDistance = 50

    // 同步两个控制器的目标点
    this.trackballControls.target.copy(this.target)
  }

  setDebug() {
    if (this.debugActive) {
      const cameraFolder = this.debug.ui.addFolder({
        title: 'Camera',
        expanded: false,
      })

      cameraFolder
        .addBinding(this, 'position', {
          label: 'camera Position',
        })
        .on('change', this.updateCamera.bind(this))

      cameraFolder
        .addBinding(this, 'target', {
          label: 'camera Target',
        })
        .on('change', this.updateCamera.bind(this))
    }
  }

  updateCamera() {
    this.instance.position.copy(this.position)
    this.instance.lookAt(this.target)
    this.orbitControls.target.copy(this.target)
    this.trackballControls.target.copy(this.target)
    this.orbitControls.update()
    this.trackballControls.update()
  }

  resize() {
    if (this.orthographic) {
      const aspect = this.sizes.width / this.sizes.height

      this.instance.left = (-this.frustumSize * aspect) / 2
      this.instance.right = (this.frustumSize * aspect) / 2
      this.instance.top = this.frustumSize / 2
      this.instance.bottom = -this.frustumSize / 2

      this.instance.updateProjectionMatrix()
    }
    else {
      this.instance.aspect = this.sizes.width / this.sizes.height
      this.instance.updateProjectionMatrix()
    }
    this.trackballControls.handleResize()
  }

  update() {
    // 原有控制器更新
    this.orbitControls.update()
    this.trackballControls.update()

    // 平滑插值相机位置（减少卡顿）
    if (this.targetPosition && !this.targetPosition.equals(this.instance.position)) {
      this.instance.position.lerp(this.targetPosition, 0.1) // 平滑因子0.1
      this.instance.lookAt(this.target)
    }

    // 添加滚动事件监听（仅首次绑定）
    if (!this.scrollHandler) {
      this.scrollHandler = this.throttle((event) => {
        // 根据滚动方向调整相机距离
        const delta = event.deltaY || event.wheelDelta || -event.detail
        const scrollDirection = delta > 0 ? 1 : -1

        // 提高缩放灵敏度
        const zoomFactor = 5 // 增强缩放灵敏度
        const currentDistance = this.instance.position.distanceTo(this.target)
        const newDistance = Math.max(5, Math.min(50, currentDistance + scrollDirection * zoomFactor))

        // 计算新的目标位置（沿视向移动）
        const direction = new THREE.Vector3()
        direction.subVectors(this.instance.position, this.target).normalize()
        this.targetPosition.copy(this.target).add(direction.multiplyScalar(newDistance))

        // 更新控制器的目标
        this.trackballControls.target.copy(this.target)
        this.orbitControls.target.copy(this.target)
      }, 16) // 增加延迟到32ms，约30fps，更平滑

      // 绑定滚动事件到window而不是canvas
      window.addEventListener('wheel', this.scrollHandler, { passive: true })
    }
  }
}
