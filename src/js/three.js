import { WheelGesture } from '@use-gesture/vanilla';
import { Lethargy } from 'lethargy';
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Pane } from 'tweakpane';
import VirtualScroll from 'virtual-scroll';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio,
  slideSpeed: 4000
};

export default class Three {
  constructor(canvas) {
    this.resource = [
      {
        matcap: './img/matcap/red-512.png',
        bgTexture: './img/bg/red-bg.png',
        geometry: new THREE.BoxGeometry(0.2, 0.2, 0.2)
      },
      {
        matcap: './img/matcap/green-512.png',
        bgTexture: './img/bg/green-bg.png',
        geometry: new THREE.SphereGeometry(0.1, 32, 32)
      },
      {
        matcap: './img/matcap/blue-512.png',
        bgTexture: './img/bg/blue-bg.png',
        geometry: new THREE.TorusGeometry(0.1, 0.1, 32, 100)
      }
    ];

    this.current = 0;
    this.next = this.current + 1;
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scenes = [];
    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 3);

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
    this.renderer.toneMappingExposure = 0.8;

    this.clock = new THREE.Clock();

    // 创建轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // 禁用滚轮缩放
    this.controls.enableZoom = false;
    // 创建出要展示的场景
    for (const [index, item] of this.resource.entries()) {
      let scene = this.createScene(item.bgTexture, item.matcap, item.geometry);
      this.scenes.push(scene);
      // 提前编译场景中的 shader
      this.renderer.compile(scene, this.camera);
      scene.target = new THREE.WebGLRenderTarget(device.width, device.height);
    }

    this.setting();
    this.event();
    this.background();
    this.setLights();
    this.render();
    this.setResize();
  }

  setting() {
    this.params = {
      bgProcess: 0,
      bgShaderWidth: 0.5,
      uScaleX: 40,
      uScaleY: 40
    };
    const pane = new Pane();
    pane
      .addBinding(this.params, 'bgProcess', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bgMaterial.uniforms.uProcess.value = value;
      });
    pane
      .addBinding(this.params, 'bgShaderWidth', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', ({ value }) => {
        this.bgMaterial.uniforms.width.value = value;
      });
    pane
      .addBinding(this.params, 'uScaleX', {
        min: 1,
        max: 100,
        step: 1
      })
      .on('change', ({ value }) => {
        this.bgMaterial.uniforms.uScaleX.value = value;
      });
    pane
      .addBinding(this.params, 'uScaleY', {
        min: 1,
        max: 100,
        step: 1
      })
      .on('change', ({ value }) => {
        this.bgMaterial.uniforms.uScaleY.value = value;
      });
  }

  background() {
    let frustumSize = 1;
    this.bgCamera = new THREE.OrthographicCamera(
      (frustumSize * device.pixelRatio) / -2,
      (frustumSize * device.pixelRatio) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    this.bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(device.width, device.height) },
        uTexture1: {
          value: new THREE.TextureLoader().load(this.resource[0].bgTexture)
        },
        uTexture2: {
          value: new THREE.TextureLoader().load(this.resource[1].bgTexture)
        },
        uProcess: {
          value: 0
        },
        time: {
          value: 0
        },
        width: {
          value: this.params.bgShaderWidth
        },
        displacement: {
          type: 'f',
          value: new THREE.TextureLoader().load('./img/disp1.jpg')
        },
        uScaleX: {
          value: this.params.uScaleX
        },
        uScaleY: {
          value: this.params.uScaleY
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment
    });

    let quad = new THREE.Mesh(
      new THREE.PlaneGeometry(frustumSize, frustumSize),
      this.bgMaterial
    );
    this.bgScene = new THREE.Scene();
    this.bgScene.add(quad);
  }

  event() {
    // this.lethargy = new Lethargy();
    // const wheelGesture = new WheelGesture(this.canvas, (state) => {
    //   console.log(state);

    //   console.log(this.lethargy.check(state.delta[1]));
    // });
    this.currentState = 0;
    this.scroller = new VirtualScroll();
    this.scroller.on((state) => {
      this.currentState -= state.deltaY / device.slideSpeed;
      this.currentState = (this.currentState + 3000) % this.resource.length;
    });
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  createScene(background, matcap, geometry) {
    let scene = new THREE.Scene();

    let bgTexture = new THREE.TextureLoader().load(background);
    scene.background = bgTexture;
    let material = new THREE.MeshMatcapMaterial({
      matcap: new THREE.TextureLoader().load(matcap)
    });
    let mesh = new THREE.Mesh(geometry, material);

    // 创建 10 个 mesh 随后加入到场景中
    for (let index = 0; index < 50; index++) {
      let random = new THREE.Vector3().randomDirection();
      let clone = mesh.clone();
      clone.position.copy(random);
      clone.rotation.x = Math.random() * Math.PI;
      clone.rotation.y = Math.random() * Math.PI;
      scene.add(clone);
    }
    return scene;
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    this.current = Math.floor(this.currentState);
    this.next = (this.current + 1) % this.scenes.length;
    this.process = this.currentState % 1;

    this.renderer.setRenderTarget(this.scenes[this.current].target);
    this.renderer.render(this.scenes[this.current], this.camera);

    this.renderer.setRenderTarget(this.scenes[this.next].target);
    this.renderer.render(this.scenes[this.next], this.camera);

    this.renderer.setRenderTarget(null);

    // update uniforms
    if (this.bgMaterial) {
      this.bgMaterial.uniforms.uProcess.value = this.process;

      this.bgMaterial.uniforms.uTexture1.value =
        this.scenes[this.current].target.texture;

      this.bgMaterial.uniforms.uTexture2.value =
        this.scenes[this.next].target.texture;
      this.bgMaterial.uniforms.time.value = elapsedTime;
    }
    this.scenes[this.current].rotation.y = elapsedTime * 0.5;
    this.scenes[this.next].rotation.y = elapsedTime * 0.5;

    requestAnimationFrame(this.render.bind(this));

    this.renderer.render(this.bgScene, this.bgCamera);
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
