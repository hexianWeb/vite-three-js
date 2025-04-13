import * as THREE from 'three'
import Experience from '../experience.js'

export default class Water {
  constructor() {
    // 获取 Experience 单例实例
    this.experience = new Experience()

    // 获取必要的引用
    this.scene = this.experience.scene
    this.time = this.experience.time
    this.debug = this.experience.debug
    this.sizes = this.experience.sizes

    // 初始化着色器uniforms
    this.uniforms = {
      iTime: { value: 0.0 },
      iResolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) },
      distanceFactor: { value: 0.19 },
      color1: { value: new THREE.Color('#075869') },
      color2: { value: new THREE.Color(0xFFFFFF) },
      foamColor: { value: new THREE.Color(0xFFFFFF) },
      foamWidth: { value: 0.04 },
      foamSoftness: { value: 0.16 },
      pixelSize: { value: 48.0 },
    }

    // 创建着色器材质
    this.createShaderMaterial()

    // 创建水面网格
    this.createWaterMesh()

    // 如果debug模式激活，添加调试面板
    if (this.debug.active) {
      this.debugObject = {
        positionX: -40.8,
        positionY: 0.3,
        positionZ: -1.8,
        scale: 10,
        color1: '#10928c',
        color2: '#dbebda',
        foamColor: '#e5f5e7',
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
          vec2 uv = uv;
          uv.x += sin(iTime * 0.1) * 0.01;
          uv.y += cos(iTime * 0.1) * 0.01;
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
      uniform vec3 foamColor;
      uniform float foamWidth;
      uniform float foamSoftness;
      uniform float pixelSize;

      varying vec2 vUv;

      vec2 getPoint(int index) {
        vec2 baseVec = vec2(sin(float(index)), cos(float(index)));
        return sin(iTime * 0.5 + baseVec * 6.28) * 0.5 + 0.5;
      }

      void main() {
        // 像素化处理
        vec2 pixels = vec2(pixelSize); // 使用uniform变量控制像素化程度
        vec2 uv = floor(vUv * pixels) / pixels;

        // 水面计算
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
        vec3 waterColor = mix(color1, color2, factor);

        // 泡沫计算 - 使用像素化后的UV坐标
        float distToEdgeX = min(vUv.x, 1.0 - vUv.x);
        float distToEdgeY = min(vUv.y, 1.0 - vUv.y);
        float minDistToEdge = min(distToEdgeX, distToEdgeY);

        float foamFactor = 1.0 - smoothstep(foamWidth - foamSoftness, foamWidth, minDistToEdge);
        foamFactor = clamp(foamFactor, 0.0, 1.0);

        vec3 finalColor = mix(waterColor, foamColor, foamFactor);
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

  createWaterMesh() {
    // 创建一个大平面作为水面
    const geometry = new THREE.PlaneGeometry(10, 12.5, 1, 1)
    this.waterMesh = new THREE.Mesh(geometry, this.shaderMaterial)

    // 设置水面位置和旋转
    this.waterMesh.rotation.x = -Math.PI / 2 // 使平面水平放置
    this.waterMesh.position.set(-40.8, 0.3, -1.7) // 使用默认位置

    // 将水面添加到场景
    this.scene.add(this.waterMesh)
  }

  update() {
    // 更新时间uniform
    if (this.uniforms && this.uniforms.iTime) {
      this.uniforms.iTime.value = this.time.elapsed * 0.001
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
      title: '水面效果',
      expanded: false,
    })

    // 水面参数控制
    const waterFolder = this.debugFolder.addFolder({
      title: '水面参数',
      expanded: false,
    })

    // 添加位置控制
    const positionFolder = waterFolder.addFolder({
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
      this.waterMesh.position.x = this.debugObject.positionX
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
      this.waterMesh.position.y = this.debugObject.positionY
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
      this.waterMesh.position.z = this.debugObject.positionZ
    })

    // 添加大小控制
    waterFolder.addBinding(
      this.debugObject,
      'scale',
      {
        label: '水面大小',
        min: 1,
        max: 50,
        step: 1,
      },
    ).on('change', () => {
      this.waterMesh.scale.set(
        this.debugObject.scale / 50,
        this.debugObject.scale / 50,
        1,
      )
    })

    waterFolder.addBinding(
      this.uniforms.distanceFactor,
      'value',
      {
        label: '波纹强度',
        min: 0.1,
        max: 0.3,
        step: 0.01,
      },
    )

    waterFolder.addBinding(
      this.debugObject,
      'color1',
      {
        label: '水面颜色1',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.color1.value.set(this.debugObject.color1)
    })

    waterFolder.addBinding(
      this.debugObject,
      'color2',
      {
        label: '水面颜色2',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.color2.value.set(this.debugObject.color2)
    })

    // 泡沫参数控制
    const foamFolder = this.debugFolder.addFolder({
      title: '泡沫参数',
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

    foamFolder.addBinding(
      this.debugObject,
      'foamColor',
      {
        label: '泡沫颜色',
        view: 'color',
      },
    ).on('change', () => {
      this.uniforms.foamColor.value.set(this.debugObject.foamColor)
    })

    foamFolder.addBinding(
      this.uniforms.foamWidth,
      'value',
      {
        label: '泡沫宽度',
        min: 0,
        max: 0.2,
        step: 0.005,
      },
    )

    foamFolder.addBinding(
      this.uniforms.foamSoftness,
      'value',
      {
        label: '泡沫柔和度',
        min: 0,
        max: 0.1,
        step: 0.001,
      },
    )
  }
}
