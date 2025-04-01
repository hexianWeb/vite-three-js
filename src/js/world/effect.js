import gsap from 'gsap'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'
import Experience from '../experience.js'
import { NoisePass } from './noise-pass.js' // 新建这个文件

export default class Effects {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.camera = this.experience.camera
    this.renderer = this.experience.renderer
    this.debug = this.experience.debug

    this.setComposer()
    this.setDebug()
    this.animatePixelSize()
  }

  setComposer() {
    this.renderPass = new RenderPass(this.scene, this.camera.instance)

    // 创建噪点Pass（新增代码）
    this.noisePass = new NoisePass({
      intensity: 0.65,
      speed: 0.9,
    })

    // 创建像素化Pass
    this.pixelPass = new RenderPixelatedPass(3, this.scene, this.camera.instance)
    this.pixelPass.normalEdgeStrength = 0.53
    this.pixelPass.depthEdgeStrength = 0.4

    // 创建输出Pass用于提亮画面
    this.outputPass = new OutputPass()
    this.outputPass.exposure = 1.2 // 增加曝光度
    this.outputPass.toneMapping = THREE.ReinhardToneMapping // 使用Reinhard色调映射
    this.outputPass.toneMappingExposure = 1.2 // 色调映射曝光度

    this.composer = new EffectComposer(this.renderer.instance)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.noisePass) // 新增噪点Pass
    this.composer.addPass(this.pixelPass)
    // 此时像素化效果已经生效，但画面比较灰暗 需要提亮
    this.composer.addPass(this.outputPass) // 添加输出Pass
  }

  setDebug() {
    if (this.debug.active) {
      // 添加噪点调试参数（新增代码）
      const noiseFolder = this.debug.ui.addFolder({
        title: 'Noise Effect',
      })
      noiseFolder.addBinding(this.noisePass.uniforms.intensity, 'value', {
        min: 0,
        max: 1,
        step: 0.01,
        label: 'Noise Intensity',
      })
      noiseFolder.addBinding(this.noisePass.uniforms.speed, 'value', {
        min: 0,
        max: 2,
        step: 0.1,
        label: 'Noise Speed',
      })

      // 添加像素化调试参数
      const pixelFolder = this.debug.ui.addFolder({
        title: 'Pixelation Effect',
      })
      pixelFolder.addBinding(this.pixelPass, 'pixelSize', {
        min: 1,
        max: 16,
        step: 1,
        label: 'Pixel Size',
      }).on('change', ({ value }) => {
        this.pixelPass.setPixelSize(value)
      })
      pixelFolder.addBinding(this.pixelPass, 'normalEdgeStrength', {
        min: 0,
        max: 2,
        step: 0.05,
        label: 'Normal Edge Strength',
      })
      pixelFolder.addBinding(this.pixelPass, 'depthEdgeStrength', {
        min: 0,
        max: 1,
        step: 0.05,
        label: 'Depth Edge Strength',
      })

      // 添加输出调试参数
      const outputFolder = this.debug.ui.addFolder({
        title: 'Output Effect',
      })
      outputFolder.addBinding(this.outputPass, 'exposure', {
        min: 0,
        max: 2,
        step: 0.1,
        label: 'Exposure',
      })
      outputFolder.addBinding(this.outputPass, 'toneMappingExposure', {
        min: 0,
        max: 2,
        step: 0.1,
        label: 'Tone Mapping Exposure',
      })
    }
  }

  resize() {
    this.composer.setSize(
      this.experience.sizes.width,
      this.experience.sizes.height,
    )
  }

  // 添加像素大小动画方法
  animatePixelSize() {
    gsap.fromTo(
      this.pixelPass,
      { pixelSize: 10 }, // 初始值
      {
        pixelSize: 2, // 目标值
        duration: 5, // 动画时长（秒）
        ease: 'power2.out', // 缓动函数
        onUpdate: () => {
          this.pixelPass.pixelSize = Math.round(this.pixelPass.pixelSize / 1) * 1
          this.pixelPass.setPixelSize(this.pixelPass.pixelSize) // 更新像素大小
        },
      },
    )
  }

  update() {
    this.composer.render()
    this.noisePass.uniforms.time.value += this.experience.time.delta * 0.1 // 更新时间
  }
}
