import * as THREE from 'three'
import Experience from '../experience.js'

export default class Lava {
  constructor() {
    // 获取 Experience 单例实例
    this.experience = new Experience()

    // 获取必要的引用
    this.scene = this.experience.scene
    this.time = this.experience.time
    this.debug = this.experience.debug
    this.sizes = this.experience.sizes
    this.resources = this.experience.resources

    // 初始化着色器uniforms
    this.uniforms = {
      iTime: { value: 0.0 },
      iResolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) },
      distanceFactor: { value: 0.24 },
      distanceFactorMin: { value: 0.2 },
      distanceFactorMax: { value: 0.30 },
      distanceFactorSpeed: { value: 0.5 },
      color1: { value: new THREE.Color('#e94909') },
      color2: { value: new THREE.Color('#4cff05') },
      glowColor: { value: new THREE.Color('#ee0000') },
      glowWidth: { value: 0.10 },
      glowSoftness: { value: 0.10 },
      pixelSize: { value: 48.0 },
      flowMap: { value: this.resources.items.flowMapTexture },
      flowSpeed: { value: 0.002 },
    }

    // 创建着色器材质
    this.createShaderMaterial()

    // 创建岩浆表面网格
    this.createLavaMesh()

    // 如果debug模式激活，添加调试面板
    if (this.debug.active) {
      this.debugObject = {
        positionX: -40.0,
        positionY: 0.59,
        positionZ: -1.8,
        scale: 10,
        color1: '#e94909',
        color2: '#4cff05',
        glowColor: '#ee0000',
        flowSpeed: 0.005,
      }
      this.debugInit()
    }
  }

  createShaderMaterial() {
    // 顶点着色器
    this.vertexShader = /* glsl */ `
      uniform float iTime;
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    // 片元着色器
    this.fragmentShader = /* glsl */ `
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float distanceFactor;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 glowColor;
      uniform float glowWidth;
      uniform float glowSoftness;
      uniform float pixelSize;
      uniform sampler2D flowMap;
      uniform float flowSpeed;

      varying vec2 vUv;

      vec2 getPoint(int index) {
        vec2 baseVec = vec2(sin(float(index)), cos(float(index)));
        return sin(iTime * 0.5 + baseVec * 6.28) * 0.5 + 0.5;
      }

      void main() {
        // 获取流动图的值
        vec2 flow = texture2D(flowMap, vUv).rg * 2.0 - 1.0;
        
        // 计算流动偏移
        vec2 flowOffset = flow * flowSpeed * sin(iTime * 0.5)*1.0;
        
        // 应用流动偏移到UV坐标
        vec2 uv = vUv + flowOffset;

        // 像素化处理
        vec2 pixels = vec2(pixelSize);
        uv = floor(uv * pixels) / pixels;

        // 岩浆表面计算
        uv *= 8.0;
        vec2 uv_i = floor(uv);

        float m_dist = 2.0;

        for (int y= -1; y <= 1; y++) {
          for (int x= -1; x <= 1; x++) {
            float index_f = uv_i.x + uv_i.y * 10.0 + float(x) + float(y) * 10.0;
            index_f = mod(index_f + 100.0, 100.0);
            int index = int(index_f);
            vec2 point = getPoint(index);
            point = point + vec2(float(x), float(y)) + uv_i;
            float dist = distance(uv, point) * distanceFactor;
            m_dist = min(m_dist, dist);
          }
        }

        float factor = smoothstep(0.05, 0.4, m_dist);
        vec3 lavaColor = mix(color1, color2, factor);

        // 发光效果计算 - 使用像素化后的UV坐标
        float distToEdgeX = min(vUv.x, 1.0 - vUv.x);
        float distToEdgeY = min(vUv.y, 1.0 - vUv.y);
        float minDistToEdge = min(distToEdgeX, distToEdgeY);

        float glowFactor = 1.0 - smoothstep(glowWidth - glowSoftness, glowWidth, minDistToEdge);
        glowFactor = clamp(glowFactor, 0.0, 1.0);

        vec3 finalColor = mix(lavaColor, glowColor, glowFactor);
        gl_FragColor = vec4(finalColor, 0.7);
      }
    `

    // 创建着色器材质
    this.shaderMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    })
  }

  createLavaMesh() {
    // 创建一个大平面作为岩浆表面
    const geometry = new THREE.PlaneGeometry(10, 12.5, 1, 1)
    this.lavaMesh = new THREE.Mesh(geometry, this.shaderMaterial)

    // 设置岩浆表面位置和旋转
    this.lavaMesh.rotation.x = -Math.PI / 2 // 使平面水平放置
    this.lavaMesh.position.set(-40.0, 0.59, -1.8) // 使用默认位置

    // 将岩浆表面添加到场景
    this.scene.add(this.lavaMesh)
  }

  update() {
    // 更新时间uniform
    if (this.uniforms && this.uniforms.iTime) {
      this.uniforms.iTime.value = this.time.elapsed * 0.001

      // 计算波纹强度的周期性变化
      const time = this.time.elapsed * 0.001
      const min = this.uniforms.distanceFactorMin.value
      const max = this.uniforms.distanceFactorMax.value
      const speed = this.uniforms.distanceFactorSpeed.value

      // 使用正弦函数生成周期性变化
      this.uniforms.distanceFactor.value
        = min + (Math.sin(time * speed) * 0.5 + 0.5) * (max - min)
    }
  }

  resize() {
    // 更新分辨率uniform
    if (this.uniforms && this.uniforms.iResolution) {
      this.uniforms.iResolution.value.set(this.sizes.width, this.sizes.height)
    }
  }

  debugInit() {
    // 创建调试面板
    this.debugFolder = this.debug.ui.addFolder({
      title: '岩浆效果',
      expanded: false,
    })

    // 岩浆参数控制
    const lavaFolder = this.debugFolder.addFolder({
      title: '岩浆参数',
      expanded: false,
    })

    // 添加流动速度控制
    lavaFolder.addBinding(
      this.uniforms.flowSpeed,
      'value',
      {
        label: '流动速度',
        min: 0,
        max: 0.2,
        step: 0.001,
      },
    )

    // 添加位置控制
    const positionFolder = lavaFolder.addFolder({
      title: '位置控制',
      expanded: false,
    })

    // X轴位置控制
    positionFolder.addBinding(
      this.debugObject,
      'positionX',
      {
        label: 'X轴位置',
        min: -100,
        max: 100,
        step: 0.1,
      },
    ).on('change', () => {
      this.lavaMesh.position.x = this.debugObject.positionX
    })

    // Y轴位置控制
    positionFolder.addBinding(
      this.debugObject,
      'positionY',
      {
        label: 'Y轴位置',
        min: -5,
        max: 5,
        step: 0.01,
      },
    ).on('change', () => {
      this.lavaMesh.position.y = this.debugObject.positionY
    })

    // Z轴位置控制
    positionFolder.addBinding(
      this.debugObject,
      'positionZ',
      {
        label: 'Z轴位置',
        min: -100,
        max: 100,
        step: 0.1,
      },
    ).on('change', () => {
      this.lavaMesh.position.z = this.debugObject.positionZ
    })

    // 添加大小控制
    lavaFolder.addBinding(
      this.debugObject,
      'scale',
      {
        label: '岩浆表面大小',
        min: 1,
        max: 50,
        step: 1,
      },
    ).on('change', () => {
      this.lavaMesh.scale.set(
        this.debugObject.scale / 50,
        this.debugObject.scale / 50,
        1,
      )
    })

    lavaFolder.addBinding(
      this.uniforms.distanceFactor,
      'value',
      {
        label: '波纹强度',
        min: 0.1,
        max: 1.0,
        step: 0.01,
      },
    ).on('change', () => {
      this.uniforms.distanceFactor.value = this.debugObject.distanceFactor
    })

    lavaFolder.addBinding(
      this.debugObject,
      'color1',
      {
        label: '岩浆颜色1',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.color1.value.set(this.debugObject.color1)
    })

    lavaFolder.addBinding(
      this.debugObject,
      'color2',
      {
        label: '岩浆颜色2',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.color2.value.set(this.debugObject.color2)
    })

    // 发光参数控制
    const glowFolder = this.debugFolder.addFolder({
      title: '发光参数',
      expanded: true,
    })

    // 添加像素化控制面板
    const pixelFolder = this.debugFolder.addFolder({
      title: '像素化参数',
      expanded: true,
    })

    pixelFolder.addBinding(
      this.uniforms.pixelSize,
      'value',
      {
        label: '像素化程度',
        min: 8,
        max: 64,
        step: 1,
      },
    )

    glowFolder.addBinding(
      this.debugObject,
      'glowColor',
      {
        label: '发光颜色',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.glowColor.value.set(this.debugObject.glowColor)
    })

    glowFolder.addBinding(
      this.uniforms.glowWidth,
      'value',
      {
        label: '发光宽度',
        min: 0,
        max: 0.2,
        step: 0.005,
      },
    )

    glowFolder.addBinding(
      this.uniforms.glowSoftness,
      'value',
      {
        label: '发光柔和度',
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    )
  }
}
