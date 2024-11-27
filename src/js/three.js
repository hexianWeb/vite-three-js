import { gsap } from 'gsap';
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { Pane } from 'tweakpane';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(2, 2, 2);
    this.scene.add(this.camera);
    this.scene.background = new THREE.Color(0x00_00_00);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor(0x00_00_00, 0);

    // Initialize OrbitControls for rotation and panning
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableZoom = false; // Disable zoom in OrbitControls
    this.orbitControls.enableDamping = true; // Smooth damping for rotation
    this.orbitControls.dampingFactor = 0.02; // Smooth damping for rotation
    // Initialize TrackballControls for zoom
    this.trackballControls = new TrackballControls(this.camera, this.canvas);
    this.trackballControls.noRotate = true; // Disable rotation in TrackballControls
    this.trackballControls.noPan = true; // Disable panning in TrackballControls
    this.trackballControls.dynamicDampingFactor = 0.2; // Smooth damping for zoom

    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setting();
    this.setLights();
    this.loadModel();
    this.render();
    this.setResize();
  }

  setting() {
    const pane = new Pane();
    this.parameters = {
      percent: 0.5,
      color0: { r: 1, g: 1, b: 1 },
      color0Intensity: 5,
      color1: { r: 0.012, g: 1, b: 0.318 },
      color1Intensity: 2,
      vmin: 945
    };

    const folder = pane.addFolder({ title: 'Particle' });

    folder
      .addBinding(this.parameters, 'percent', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', () => {
        this.material.uniforms.uPercent.value = this.parameters.percent;
      });

    folder
      .addBinding(this.parameters, 'color0', {
        view: 'color',
        picker: 'inline',
        expanded: true,
        color: { type: 'float' }
      })
      .on('change', () => {
        this.material.uniforms.uColor0.value.setRGB(
          this.parameters.color0.r,
          this.parameters.color0.g,
          this.parameters.color0.b
        );
      });

    folder
      .addBinding(this.parameters, 'color0Intensity', {
        min: 0,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        this.material.uniforms.uColor0Intensity.value =
          this.parameters.color0Intensity;
      });

    folder
      .addBinding(this.parameters, 'color1', {
        view: 'color',
        picker: 'inline',
        expanded: true,
        color: { type: 'float' }
      })
      .on('change', () => {
        this.material.uniforms.uColor1.value.setRGB(
          this.parameters.color1.r,
          this.parameters.color1.g,
          this.parameters.color1.b
        );
      });

    folder
      .addBinding(this.parameters, 'color1Intensity', {
        min: 0,
        max: 10,
        step: 0.1
      })
      .on('change', () => {
        this.material.uniforms.uColor1Intensity.value =
          this.parameters.color1Intensity;
      });

    folder
      .addBinding(this.parameters, 'vmin', {
        min: 0,
        max: 2000,
        step: 1
      })
      .on('change', () => {
        this.material.uniforms.uVmin.value = this.parameters.vmin;
      });

    // Add buttons to Tweakpane
    folder.addButton({ title: 'Set Percent to 0' }).on('click', () => {
      gsap.to(this.parameters, {
        percent: 0,
        duration: 1,
        onUpdate: () => {
          this.material.uniforms.uPercent.value = this.parameters.percent;
        }
      });
    });

    folder.addButton({ title: 'Set Percent to 1' }).on('click', () => {
      gsap.to(this.parameters, {
        percent: 1,
        duration: 1,
        onUpdate: () => {
          this.material.uniforms.uPercent.value = this.parameters.percent;
        }
      });
    });
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  createPointsFromMesh(mesh) {
    // 创建表面采样器，用于在模型表面均匀采样点
    const surfaceSampler = new MeshSurfaceSampler(mesh)
      .setWeightAttribute('color') // 使用颜色作为权重
      .build();

    // 设置粒子系统参数
    const PARTICLE_COUNT = 20_000; // 粒子总数
    const geometry = new THREE.BufferGeometry(); // 粒子几何体
    const sharedBuffer = new ArrayBuffer(PARTICLE_COUNT * 3 * 3); // 共享缓冲区
    const positionArray = new Float32Array(sharedBuffer); // 位置数组
    const normalArray = new Float32Array(PARTICLE_COUNT * 3); // 法线数组

    // 采样辅助向量
    const samplePosition = new THREE.Vector3(); // 采样位置
    const sampleNormal = new THREE.Vector3(); // 采样法线
    const sampleColor = new THREE.Color(); // 采样颜色

    // 在模型表面进行采样
    for (let index = 0; index < positionArray.length; index += 3) {
      // 采样一个点，获取位置、法线和颜色
      surfaceSampler.sample(samplePosition, sampleNormal, sampleColor);

      // 存储位置数据
      positionArray[index] = samplePosition.x;
      positionArray[index + 1] = samplePosition.y;
      positionArray[index + 2] = samplePosition.z;

      // 存储法线数据
      const normalIndex = index * 3;
      normalArray[normalIndex] = sampleNormal.x;
      normalArray[normalIndex + 1] = sampleNormal.y;
      normalArray[normalIndex + 2] = sampleNormal.z;
    }

    const normalBuffer = new THREE.BufferAttribute(normalArray, 3);
    const positionBuffer = new THREE.BufferAttribute(positionArray, 3);

    // 将几何体的“position”属性设置为这个 BufferAttribute
    geometry.setAttribute('position', positionBuffer);
    geometry.setAttribute('normal', normalBuffer);

    return geometry;
  }

  loadModel() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor0: { value: new THREE.Color(1, 1, 1) },
        uColor0Intensity: { value: 5 },
        uColor1: { value: new THREE.Color(0.012, 1, 0.318) },
        uColor1Intensity: { value: 2 },
        uPercent: { value: this.parameters.percent },
        uTime: { value: 0 },
        uVmin: { value: 945 }
      }
    });
    this.loader.load(
      './m_pointCloudPeople-BOI66C80.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            const geometry = this.createPointsFromMesh(child);
            geometry.center();
            const particles = new THREE.Points(geometry, this.material);
            this.scene.add(particles);
          }
        });
      },
      undefined,
      (error) => {
        console.error('An error happened while loading the model', error);
      }
    );
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.trackballControls.update();
    this.orbitControls.update();
    // Update uniforms
    this.scene.traverse((child) => {
      if (child.isMesh && child.material.uniforms) {
        child.material.uniforms.uTime.value = elapsedTime;
      }
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }

  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
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
