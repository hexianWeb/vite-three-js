import * as THREE from 'three'
import Experience from '../experience.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
export default class Fireflies {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug
    this.time = this.experience.time
    // 创建提供采样的平面
    this.planeGeometry = new THREE.PlaneGeometry(50, 30)
    this.planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8
    })
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial)
    this.plane.rotation.x = -Math.PI * 0.5 // Rotate to be horizontal
    this.plane.position.y = 1// Slightly above ground to avoid z-fighting
    this.plane.position.z = -5
    this.plane.visible = false
    this.plane.updateMatrixWorld();
    this.scene.add(this.plane)
    // Parameters
    this.parameters = {
      fireflyCount: 300,
      fireflySize: 0.21,
      fireflyColor: '#ffeb3b',
      speedFactor: 0.5,
      visible: false
    }

    this.init()
    this.debugInit()
  }

  init() {
    // Create geometry
    this.geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.parameters.fireflyCount * 3)
    const scales = new Float32Array(this.parameters.fireflyCount)
    const noises = new Float32Array(this.parameters.fireflyCount * 3)
    const speeds = new Float32Array(this.parameters.fireflyCount)

    // 创建采样器
    const sampler = new MeshSurfaceSampler(this.plane).build()
    const tempPosition = new THREE.Vector3()
    
    // 对平面进行采样
    for(let i = 0; i < this.parameters.fireflyCount; i++) {
        // 采样位置
        sampler.sample(tempPosition)
        tempPosition.applyMatrix4(this.plane.matrixWorld)
        
        // 存储基础位置
        positions[i * 3] = tempPosition.x
        positions[i * 3 + 1] = tempPosition.y + 0.5 // 抬高一些
        positions[i * 3 + 2] = tempPosition.z
        
        // 存储噪声值用于动画
        noises[i * 3] = 0.3 + Math.random() * 0.6     // x noise
        noises[i * 3 + 1] = 0.3 + Math.random() * 0.6 // y noise
        noises[i * 3 + 2] = 0.3 + Math.random() * 0.6 // z noise
        
        // 存储速度和大小
        speeds[i] = 0.5 + Math.random()
        scales[i] = 0.3 + Math.random() * 0.7
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    this.geometry.setAttribute('aNoise', new THREE.BufferAttribute(noises, 3))
    this.geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))

    // 修改材质的 shader
    this.material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
            uSize: { value: this.parameters.fireflySize * 200 },
            uColor: { value: new THREE.Color(this.parameters.fireflyColor) }
        },
        vertexShader: /*glsl */`
            uniform float uTime;
            uniform float uPixelRatio;
            uniform float uSize;
            
            attribute float aScale;
            attribute vec3 aNoise;
            attribute float aSpeed;

            void main() {
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                
                // 使用噪声值和速度创建更自然的动画
                float time = uTime * 0.001; // 降低时间比例
                modelPosition.x += sin(time * aSpeed + aNoise.x) * aNoise.x;
                modelPosition.y += cos(time * aSpeed + aNoise.y) * aNoise.y;
                modelPosition.z += sin(time * aSpeed + aNoise.z) * aNoise.z;

                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;

                gl_Position = projectionPosition;
                gl_PointSize = uSize * aScale * uPixelRatio *0.2;
            }
        `,
        fragmentShader: /*glsl */`
            uniform vec3 uColor;

            void main() {
                float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                float strength = 0.05 / distanceToCenter - 0.1;

                vec3 color = uColor;
                gl_FragColor = vec4(vec3(strength), strength);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    })

    // Create points
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.visible = this.parameters.visible
    this.scene.add(this.points)
  }

  update() {
    if (this.material) {
        this.material.uniforms.uTime.value = this.time.elapsed*0.5
        
    }
  }

  setVisibility(visible) {
    if (this.points) {
      this.points.visible = visible
      this.parameters.visible = visible
    }
  }

  debugInit() {
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder({
        title: 'Fireflies',
        expanded: false
      })

      debugFolder.addBinding(this.parameters, 'fireflyCount', {
        min: 10,
        max: 500,
        step: 10,
        label: 'Count'
      })

      debugFolder.addBinding(this.parameters, 'fireflySize', {
        min: 0.01,
        max: 1,
        step: 0.01,
        label: 'Size'
      }).on('change', () => {
        this.material.uniforms.uSize.value = this.parameters.fireflySize * 200
      })

      debugFolder.addBinding(this.parameters, 'fireflyColor', {
        view: 'color',
        label: 'Color'
      }).on('change', () => {
        this.material.uniforms.uColor.value = new THREE.Color(this.parameters.fireflyColor)
      })

      debugFolder.addBinding(this.parameters, 'visible', {
        label: 'Visible'
      }).on('change', () => {
        this.setVisibility(this.parameters.visible)
      })
    }
  }
} 