import * as dat from 'dat.gui';
import { gsap } from 'gsap';
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

//	Classic Perlin 3D Noise
//	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
const noise = /*glsl*/ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}`;
export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.width = device.width;
    this.height = device.height;
    let frustumSize = this.height;
    // 生成正交投影相机
    let aspect = device.width / device.height;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      -2000,
      2000
    );
    this.camera.position.set(20, 20, 20);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor('#bbcdc5', 1);

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.gltfLoader = new GLTFLoader();
    this.clock = new THREE.Clock();

    this.setLights();
    this.setupFBO();
    this.setObject();
    this.render();
    this.setResize();
    // this.setHelper();
    this.setupSetting();
  }

  setupSetting() {
    this.setting = {
      progress: 0,
      debugMeshVisible: true,
      picTextureVisible: true
    };
    this.gui = new dat.GUI();
    this.gui
      .add(this.setting, 'progress', 0, 1)
      .step(0.01)
      .onChange((value) => {
        this.fboMaterial.uniforms.uProgress.value = value;
      });

    this.debugMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 1, 1),
      new THREE.MeshBasicMaterial({
        map: this.fbo.texture
      })
    );

    this.debugMesh.position.set(0, 200, 0);
    this.scene.add(this.debugMesh);
    this.gui.add(this.setting, 'debugMeshVisible').onChange((value) => {
      this.debugMesh.visible = value;
    });
    // 添加一个按钮
    this.gui
      .add(
        {
          startProgress: () => {
            gsap.to(this.setting, {
              duration: 1, // 动画持续时间1秒
              progress: 1,
              ease: 'linear',
              onUpdate: () => {
                this.fboMaterial.uniforms.uProgress.value =
                  this.setting.progress;
                this.gui.updateDisplay(); // 更新GUI显示
              },
              onComplete: () => {
                this.setting.progress = 1;
                this.fboMaterial.uniforms.uProgress.value =
                  this.setting.progress;
                this.gui.updateDisplay(); // 更新GUI显示
              }
            });
          }
        },
        'startProgress'
      )
      .name('Start Progress');
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(
      new THREE.Color(1, 1, 1, 0.5),
      0.7
    );
    this.scene.add(this.ambientLight);

    // 增加聚光灯 spotlight
    this.spotLight = new THREE.SpotLight(
      0xff_ff_ff,
      600,
      2000,
      Math.PI / 3,
      1.5,
      0.4
    );
    this.spotLight.position.set(240 * 6, 200 * 3, -240 * 4);
    let target = new THREE.Object3D();
    target.position.set(0, -200 * 3, 200 * 1);
    this.spotLight.target = target;
    this.scene.add(this.spotLight);
  }

  setObject() {
    this.aoTexture = new THREE.TextureLoader().load('/aomap.png');
    // 修正贴图的Y轴方向
    this.aoTexture.flipY = false;
    this.aoTexture.minFilter = THREE.LinearFilter;
    this.aoTexture.magFilter = THREE.LinearFilter;
    // this.aoTexture.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable'
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: 'f', value: 0 },
        resolution: { type: 'v2', value: new THREE.Vector2() }
      },
      fragmentShader: fragment,
      vertexShader: vertex
    });

    this.material = new THREE.MeshPhysicalMaterial({
      map: this.aoTexture,
      aoMap: this.aoTexture,
      aoMapIntensity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.65
    });

    this.uniforms = {
      time: { value: 0 },
      aoMap: { value: this.aoTexture },
      uFBO: {
        value: undefined
      },
      // light_color: { value: new THREE.Color('#ffe9e9') },
      // ramp_color_one: { value: new THREE.Color('#06082D') },
      // ramp_color_two: { value: new THREE.Color('#020284') },
      // ramp_color_three: { value: new THREE.Color('#0000ff') },
      // ramp_color_four: { value: new THREE.Color('#71c7f5') }
      light_color: { value: new THREE.Color('#ffe9e9') },
      ramp_color_one: { value: new THREE.Color('#06082D') },
      ramp_color_two: { value: new THREE.Color('#6b2521') },
      ramp_color_three: { value: new THREE.Color('#d14e38') },
      ramp_color_four: { value: new THREE.Color('#cf2b30') }
    };

    this.material.onBeforeCompile = (shader) => {
      shader.uniforms = Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        /*glsl*/ `#include <common>
          uniform sampler2D uFBO;
          uniform float time;
          uniform vec3 light_color; // 光源颜色
          uniform vec3 ramp_color_one; // 颜色渐变1
          uniform vec3 ramp_color_two; // 颜色渐变2
          uniform vec3 ramp_color_three; // 颜色渐变3
          uniform vec3 ramp_color_four; // 颜色渐变4
          attribute vec2 instanceUV; // 实例UV
          varying float vHeight;
          varying float vHeightUV;
          ${noise}
      `
      );
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        /*glsl*/ `#include <begin_vertex>

          float n = cnoise(vec3(instanceUV.x*10.0, instanceUV.y*10.0, time*0.5));
          float height = n * 56.0;
          transformed.y += height;

          vHeightUV = clamp(position.y*2.0, 0.0, 1.0);
          vec4 transition = texture2D(uFBO, instanceUV);
          transformed *=transition.g;
          transformed.y += transition.r *150.0;
          vHeight = transformed.y;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        /*glsl*/ `#include <common>
          uniform vec3 light_color; // 光源颜色
          uniform vec3 ramp_color_one; // 颜色渐变1
          uniform vec3 ramp_color_two; // 颜色渐变2
          uniform vec3 ramp_color_three; // 颜色渐变3
          uniform vec3 ramp_color_four; // 颜色渐变4
          varying float vHeight;
          varying float vHeightUV;
          `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        /*glsl*/ `#include <color_fragment>
        vec3 hightLight = mix(ramp_color_three, ramp_color_four, vHeightUV);
        diffuseColor.rgb = mix(ramp_color_two, ramp_color_three, vHeightUV);
        diffuseColor.rgb = mix(diffuseColor.rgb, hightLight, clamp(vHeight/10.0-3.0, 0.0, 1.0));
        // diffuseColor.rgb = ramp_color_four;
        `
      );
    };
    this.gltfLoader.load('/bar.glb', (gltf) => {
      this.model = gltf.scene.children[0];
      this.model.material = this.material;
      this.geometry = this.model.geometry;
      this.geometry.scale(40, 40, 40);
      this.model.position.set(0, 0, 0);

      this.iSize = 50;
      this.instances = this.iSize ** 2;
      this.instanceMesh = new THREE.InstancedMesh(
        this.geometry,
        this.material,
        this.instances
      );

      let dummy = new THREE.Object3D();
      let w = 60;

      let instanceUVs = new Float32Array(this.instances * 2);
      for (let index = 0; index < this.iSize; index++) {
        for (let index_ = 0; index_ < this.iSize; index_++) {
          // 设置 instanceUVs
          instanceUVs.set(
            [index / this.iSize, index_ / this.iSize],
            [index * this.iSize + index_] * 2
          );
          // 设置 dummy
          dummy.position.set(
            w * (index - this.iSize / 2),
            0,
            w * (index_ - this.iSize / 2)
          );
          dummy.updateMatrix();
          this.instanceMesh.setMatrixAt(
            index * this.iSize + index_,
            dummy.matrix
          );
        }
      }
      this.instanceMesh.instanceMatrix.needsUpdate = true;

      // 写入 instanceUVs
      this.geometry.setAttribute(
        'instanceUV',
        new THREE.InstancedBufferAttribute(instanceUVs, 2)
      );
      this.scene.add(this.instanceMesh);
    });
  }

  setupFBO() {
    this.fbo = new THREE.WebGLRenderTarget(device.width, device.height);
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.fboScene = new THREE.Scene();
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uFBO: {
          value: null
        },
        uState1: {
          // value: new THREE.TextureLoader().load('/texture-mask-graph.png')
          value: new THREE.TextureLoader().load('/heart.png')
        },
        uState2: {
          // value: new THREE.TextureLoader().load('/texture-mask-map.png')
          value: new THREE.TextureLoader().load('/cn.png')
        },
        uProgress: {
          value: 0
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.fboMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.fboMaterial
    );
    this.fboScene.add(this.fboMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    // this.planeMesh.rotation.x = 0.2 * elapsedTime;
    // this.planeMesh.rotation.y = 0.1 * elapsedTime;
    this.uniforms.time.value = elapsedTime;
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.uniforms.uFBO.value = this.fbo.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  setHelper() {
    const AxesHelper = new THREE.AxesHelper(100);
    this.scene.add(AxesHelper);
    const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);
  }
  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
