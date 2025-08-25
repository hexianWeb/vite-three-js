import * as THREE from 'three'
import fragment from '../../shaders/star/fragment.glsl'
import vertex from '../../shaders/star/vertex.glsl'
import Experience from '../experience.js'

export default class Galaxy {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.pixelRatio = this.experience.sizes.pixelRatio
    this.debug = this.experience.debug.ui
    this.debugActive = this.experience.debug.active
    this.time = this.experience.time
    this.textures = this.experience.resources.items

    // Point Params
    this.parameters = {
      size: 49,
      count: 140000 / 1.5,
      radius: 5,
      branches: 10,
      spin: 1,
      randomness: 9.6,
      randomnessPower: 5,
      insideColor: '#ea7914',
      outsideColor: '#6c67aa',
      timeActive: true,
      // 圆环约束参数
      innerRadius: 0.12, // 内环半径（相对于总半径的比例）
      ringFalloff: 0.1, // 环形衰减强度
      constraintStrength: 0.25, // 约束强度（0-1）
    }

    // Point Material
    this.material = new THREE.ShaderMaterial({
      transparent: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uSize: { value: this.parameters.size * this.pixelRatio },
        uTime: { value: 0 },
        uRadius: { value: this.parameters.radius },
        uInnerRadius: { value: this.parameters.innerRadius },
        uRingFalloff: { value: this.parameters.ringFalloff },
        uConstraintStrength: { value: this.parameters.constraintStrength },
      },
      vertexColors: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    })

    this.setGalaxy()
    this.debuggerInit()
  }

  setGalaxy() {
    const geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(this.parameters.count * 3)
    const colors = new Float32Array(this.parameters.count * 3)
    const scales = new Float32Array(this.parameters.count)
    const randoms = new Float32Array(this.parameters.count * 3)
    for (let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3

      // 生成在环形区域内的半径
      const minRadius = this.parameters.innerRadius * this.parameters.radius
      const maxRadius = this.parameters.radius
      const radius = minRadius + Math.random() * (maxRadius - minRadius)

      const spinAngle = radius * this.parameters.spin
      const branchAngle = (i % this.parameters.branches) / this.parameters.branches * Math.PI * 2

      // 计算距离圆环中心的归一化距离（0-1）
      const ringCenter = (minRadius + maxRadius) * 0.5
      const ringWidth = maxRadius - minRadius
      const distanceToRingCenter = Math.abs(radius - ringCenter) / (ringWidth * 0.5)

      // 使用帽形函数（反向抛物线）来约束随机扰动
      // 距离圆环中心越近，随机扰动越大；距离边缘越近，随机扰动越小
      const ringConstraint = (1.0 - distanceToRingCenter ** this.parameters.ringFalloff) * this.parameters.constraintStrength
      const effectiveRandomness = this.parameters.randomness * ringConstraint

      // 生成约束后的随机偏移
      const randomX = effectiveRandomness * radius * (Math.random() < 0.5 ? 1 : -1) * Math.random() ** this.parameters.randomnessPower
      const randomY = effectiveRandomness * radius * (Math.random() < 0.5 ? 1 : -0.4) * Math.random() ** this.parameters.randomnessPower * 20
      const randomZ = effectiveRandomness * radius * (Math.random() < 0.5 ? 1 : -1) * Math.random() ** this.parameters.randomnessPower

      const x = Math.cos(branchAngle + spinAngle) * radius
      const y = randomY
      const z = Math.sin(branchAngle + spinAngle) * radius

      //   Random
      randoms[i3] = randomX
      randoms[i3 + 1] = randomY
      randoms[i3 + 2] = randomZ

      //   Position
      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z

      //   Color
      const colorInside = new THREE.Color(this.parameters.insideColor)
      const colorOutside = new THREE.Color(this.parameters.outsideColor)
      const color = colorInside.lerp(colorOutside, radius / maxRadius)

      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      //   Scale
      scales[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3))

    this.galaxy = new THREE.Points(geometry, this.material)
    this.scene.add(this.galaxy)
  }

  update() {
    if (this.parameters.timeActive) {
      this.material.uniforms.uTime.value = this.time.elapsed * 0.002
    }
    else {
      this.material.uniforms.uTime.value = 100
    }
  }

  debuggerInit() {
    if (this.debugActive) {
      const fl = this.debug.addFolder({
        title: 'Galaxy',
        expanded: false,
      })

      fl.addBinding(this.parameters, 'count', {
        min: 1000,
        max: 200000,
        step: 1000,
      }).on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'branches', {
        min: 1,
        max: 10,
        step: 1,
      }).on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'radius', {
        min: 0.1,
        max: 5,
        step: 0.1,
      }).on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'size', {
        min: 10,
        max: 80,
        step: 1,
      }).on('change', () => {
        this.material.uniforms.uSize.value = this.parameters.size
        this.material.needsUpdate = true
      })

      fl.addBinding(this.parameters, 'spin').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'randomness').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'randomnessPower').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'insideColor').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'outsideColor').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      fl.addBinding(this.parameters, 'timeActive').on('change', () => {
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      // 圆环约束控制
      const ringFolder = fl.addFolder({
        title: '圆环约束',
        expanded: true,
      })

      ringFolder.addBinding(this.parameters, 'innerRadius', {
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: '内环半径',
      }).on('change', () => {
        this.material.uniforms.uInnerRadius.value = this.parameters.innerRadius
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      ringFolder.addBinding(this.parameters, 'ringFalloff', {
        min: 0.1,
        max: 5.0,
        step: 0.1,
        label: '环形衰减',
      }).on('change', () => {
        this.material.uniforms.uRingFalloff.value = this.parameters.ringFalloff
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })

      ringFolder.addBinding(this.parameters, 'constraintStrength', {
        min: 0.0,
        max: 3.0,
        step: 0.05,
        label: '约束强度',
      }).on('change', () => {
        this.material.uniforms.uConstraintStrength.value = this.parameters.constraintStrength
        this.scene.remove(this.galaxy)
        this.setGalaxy()
      })
    }
  }
}
