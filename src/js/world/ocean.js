import * as THREE from 'three'
import Experience from '../experience.js'

export default class Ocean {
  constructor() {
    // 获取必要的实例
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.time = this.experience.time
    this.debug = this.experience.debug

    // 调试对象
    this.debugObject = {
      surfaceColor: '#179f8e',
      foamColor: '#36cee5',
      colorOffset: 0.25,
      colorMultiplier: 1.87,
      flowSpeed: 0.1,
      waveSpeed: 0.12,
      noiseScale: 1.5, // 添加噪声缩放控制
      waveHeight: 2.35, // 添加波浪高度控制
    }

    // 设置
    this.setGeometry()
    this.setMaterial()
    this.setMesh()

    if (this.debug.active) {
      this.debugInit()
    }
  }

  setGeometry() {
    // 创建一个大平面作为海洋
    this.geometry = new THREE.PlaneGeometry(128, 128, 64, 64)
  }

  setMaterial() {
    this.resources.items.waterMaskTexture.wrapS = THREE.RepeatWrapping
    this.resources.items.waterMaskTexture.wrapT = THREE.RepeatWrapping

    // 创建自定义着色器材质
    this.material = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        varying vec2 vUv;
        varying float vElevation;
        
        uniform float uTime;
        uniform float uFlowSpeed;
        uniform float uWaveSpeed;
        uniform float uNoiseScale;
        uniform float uWaveHeight;

        // 随机函数
        vec2 random2(vec2 point) {
          float d1 = dot(point, vec2(12.3, 32.1));
          float d2 = dot(point, vec2(45.6, 65.4));
          point = vec2(d1, d2);
          return fract(sin(point) * 78.9) * 2.0 - 1.0;
        }

        // 梯度噪声函数
        float noise(vec2 point) {
          vec2 i = floor(point);
          vec2 f = fract(point);

          vec2 u = smoothstep(0.0, 1.0, f);
          
          float d1 = dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
          float d2 = dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
          float d3 = dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
          float d4 = dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
          
          return mix(mix(d1, d2, u.x), mix(d3, d4, u.x), u.y);
        }

        // FBM（分形布朗运动）函数
        float fbm(vec2 point) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          // 叠加多层噪声
          for(int i = 0; i < 4; i++) {
            value += amplitude * noise(point * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          
          return value;
        }
        
        void main() {
          vUv = uv;
          
          vUv.x += uTime * uFlowSpeed * 0.015;
          // 创建波浪效果
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          
          // 添加UV动画
          vec2 flowUv = vUv;
          flowUv.x += uTime * uFlowSpeed * 0.05;
          
          // 使用FBM计算波浪高度
          float elevation = fbm(vec2(
            modelPosition.x * uNoiseScale + uTime * uWaveSpeed,
            modelPosition.z * uNoiseScale + uTime * uWaveSpeed
          )) * uWaveHeight;
          
          modelPosition.y += abs(elevation);
          vElevation = elevation;
          
          gl_Position = projectionMatrix * viewMatrix * modelPosition;
        }
      `,
      fragmentShader: /* glsl  */`
        uniform sampler2D uWaterMask;
        uniform vec3 uSurfaceColor;
        uniform vec3 uFoamColor;
        uniform float uColorOffset;
        uniform float uColorMultiplier;
        
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          // 获取水面遮罩纹理
          vec4 waterMask = texture2D(uWaterMask, vUv * vec2(64.0, 64.0));
          
          // 混合海面颜色和泡沫颜色
          float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
          vec3 color = mix(uSurfaceColor, uFoamColor, mixStrength * waterMask.r);
          
          gl_FragColor = vec4(color, 0.7);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uWaterMask: { value: this.resources.items.waterMaskTexture },
        uSurfaceColor: { value: new THREE.Color(this.debugObject.surfaceColor) },
        uFoamColor: { value: new THREE.Color(this.debugObject.foamColor) },
        uColorOffset: { value: this.debugObject.colorOffset },
        uColorMultiplier: { value: this.debugObject.colorMultiplier },
        uFlowSpeed: { value: this.debugObject.flowSpeed },
        uWaveSpeed: { value: this.debugObject.waveSpeed },
        uNoiseScale: { value: this.debugObject.noiseScale },
        uWaveHeight: { value: this.debugObject.waveHeight },
      },
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.rotation.x = -Math.PI * 0.5
    this.mesh.position.y = -1
    this.scene.add(this.mesh)
  }

  debugInit() {
    // 创建调试面板
    this.debugFolder = this.debug.ui.addFolder({
      title: '海洋',
      expanded: true,
    })

    // 添加海面颜色控制
    this.debugFolder.addBinding(
      this.debugObject,
      'surfaceColor',
      {
        label: '海面颜色',
        view: 'color',
      },
    ).on('change', () => {
      this.material.uniforms.uSurfaceColor.value.set(this.debugObject.surfaceColor)
    })

    // 添加泡沫颜色控制
    this.debugFolder.addBinding(
      this.debugObject,
      'foamColor',
      {
        label: '泡沫颜色',
        view: 'color',
      },
    ).on('change', () => {
      this.material.uniforms.uFoamColor.value.set(this.debugObject.foamColor)
    })

    // 添加混合参数控制
    this.debugFolder.addBinding(
      this.debugObject,
      'colorOffset',
      {
        label: '颜色偏移',
        min: 0,
        max: 1,
      },
    ).on('change', () => {
      this.material.uniforms.uColorOffset.value = this.debugObject.colorOffset
    })

    this.debugFolder.addBinding(
      this.debugObject,
      'colorMultiplier',
      {
        label: '颜色倍增',
        min: 0,
        max: 10,
      },
    ).on('change', () => {
      this.material.uniforms.uColorMultiplier.value = this.debugObject.colorMultiplier
    })

    // 添加流动速度控制
    this.debugFolder.addBinding(
      this.debugObject,
      'flowSpeed',
      {
        label: '流动速度',
        min: -5,
        max: 5,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uFlowSpeed.value = this.debugObject.flowSpeed
    })

    // 添加波浪速度控制
    this.debugFolder.addBinding(
      this.debugObject,
      'waveSpeed',
      {
        label: '波浪速度',
        min: 0,
        max: 0.3,
        step: 0.001,
      },
    ).on('change', () => {
      this.material.uniforms.uWaveSpeed.value = this.debugObject.waveSpeed
    })

    // 添加噪声缩放控制
    this.debugFolder.addBinding(
      this.debugObject,
      'noiseScale',
      {
        label: '噪声缩放',
        min: 0.1,
        max: 10,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uNoiseScale.value = this.debugObject.noiseScale
    })

    // 添加波浪高度控制
    this.debugFolder.addBinding(
      this.debugObject,
      'waveHeight',
      {
        label: '波浪高度',
        min: 0,
        max: 4,
        step: 0.1,
      },
    ).on('change', () => {
      this.material.uniforms.uWaveHeight.value = this.debugObject.waveHeight
    })
  }

  update() {
    // 更新时间uniform
    this.material.uniforms.uTime.value = this.time.elapsed * 0.001
  }
}
