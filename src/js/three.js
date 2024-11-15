import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

    const frustumSize = 1;
    // 生成正交相机
    this.camera = new THREE.OrthographicCamera(
      frustumSize / device.pixelRatio / -2,
      frustumSize / device.pixelRatio / 2,
      frustumSize / device.pixelRatio / 2,
      frustumSize / device.pixelRatio / -2,
      -1000,
      1000
    );
    this.camera.position.set(0, 0, 2);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.params = {
      smoothMin: 0.05,
      leftLen: -1.5,
      rightLen: 1.04,
      xOffset: 0.5, // 新增 X 轴偏移
      yOffset: 2 // 新增 Y 轴偏移
    };
    this.setting();
    this.setLights();
    this.setGeometry();
    this.event(); // Initialize mouse event handling
    this.render();
    this.setResize();
  }

  setting() {
    const pane = new Pane();
    pane
      .addBinding(this.params, 'smoothMin', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', () => {
        this.planeMaterial.uniforms.uSmoothMin.value = this.params.smoothMin;
      });
    pane
      .addBinding(this.params, 'leftLen', {
        min: -2,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.planeMaterial.uniforms.uLeftLength.value = this.params.leftLen;
      });
    pane
      .addBinding(this.params, 'rightLen', {
        min: 0,
        max: 2,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.planeMaterial.uniforms.uRightLength.value = this.params.rightLen;
      });
    pane
      .addBinding(this.params, 'xOffset', {
        min: -2,
        max: 2,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.planeMaterial.uniforms.uXoffset.value = this.params.xOffset;
      });
    pane
      .addBinding(this.params, 'yOffset', {
        min: -2,
        max: 2,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.planeMaterial.uniforms.uYoffset.value = this.params.yOffset;
      });
  }
  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setGeometry() {
    this.planeGeometry = new THREE.PlaneGeometry(1, 1, 16, 16);
    this.planeMaterial = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      wireframe: false,
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        uProgress: { type: 'f', value: 0 },
        uTime: { type: 'f', value: 0 },
        uResolution: {
          type: 'v2', // Change to 'v2' for a vector
          value: new THREE.Vector2(device.width / device.height, 1) // Set to width and height
        },
        uTexture: { type: 't', value: null },
        uMatcap: {
          value: new THREE.TextureLoader().load('./img/white-map.png')
        },
        uCameraPosition: {
          type: 'v3',
          value: this.camera.position
        },
        uSmoothMin: { type: 'f', value: this.params.smoothMin },
        uMouse: { type: 'v2', value: new THREE.Vector2(0, 0) }, // Initialize uMouse
        uLeftLength: { type: 'f', value: this.params.leftLen },
        uRightLength: { type: 'f', value: this.params.rightLen },
        uXoffset: { type: 'f', value: this.params.xOffset }, // 新增 X 轴偏移
        uYoffset: { type: 'f', value: this.params.yOffset } // 新增 Y 轴偏移
      }
    });

    this.planeMesh = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.scene.add(this.planeMesh);
  }

  event() {
    // 监听鼠标移动事件
    window.addEventListener('mousemove', (event) => {
      // 将鼠标位置转换为[-0.5, 0.5]的范围
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1; // Convert to [-1, 1] range
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Convert to [-1, 1] range
      const uMouse = new THREE.Vector2(mouseX, mouseY);

      // 将uMouse的值映射到[-0.5, 0.5]的范围
      this.planeMaterial.uniforms.uMouse.value.set(
        uMouse.x * 0.5,
        uMouse.y * 0.5
      );
    });
  }
  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.planeMaterial.uniforms.uTime.value = elapsedTime;
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
