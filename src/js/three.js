import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  EffectComposer,
  OutputPass,
  RenderPass,
  RoundedBoxGeometry,
  UnrealBloomPass
} from 'three/examples/jsm/Addons.js';
import { Pane } from 'tweakpane';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';
import { MeshReflectorMaterial } from './shaders/MeshReflectorMaterial';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

const bloomPassParameters = {
  strength: 0.35,
  radius: 0.13,
  threshold: 0.77
};

const colorOptions = [
  { text: 'red', value: { r: 6, g: 0.25, b: 0.25 } }, // 红色
  { text: 'yellow', value: { r: 4, g: 2.5, b: 0.25 } }, // 黄色
  { text: 'green', value: { r: 0.25, g: 4, b: 2.5 } } // 绿色
];
export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#bfe3dd');

    this.camera = new THREE.PerspectiveCamera(
      25,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(15, 15, 15);

    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.clock = new THREE.Clock();

    // cursor 光标定义鼠标在 3D 世界中的位置
    this.cursor = new THREE.Vector3();
    // originPosition 保存每个立方体的原始位置。
    this.originPosition = new THREE.Vector3();
    //  tempPosition 保存每个立方体的临时位置。
    this.tempPosition = new THREE.Vector3();
    // dir 给出移动方向
    this.direction = new THREE.Vector3();

    // 创建世界坐标系的 Y 轴向量
    this.worldYAxis = new THREE.Vector3(0, 1, 0);
    // 鼠标画布位置
    this.pointer = new THREE.Vector2();
    // 默认颜色
    this.selectColor = colorOptions[0].value;
    this.setLights();

    this.setMouseMove();
    this.setGeometry();
    this.setPassProcess();
    this.render();
    this.setDebug();
    this.setResize();
    // this.setFloor();
  }

  setDebug() {
    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);

    const spotLightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotLightHelper);

    const pane = new Pane();
    const f1 = pane.addFolder({
      title: 'Bloom Pass'
    });
    f1.addBinding(bloomPassParameters, 'strength', {
      min: 0,
      max: 2,
      step: 0.01,
      view: 'number'
    }).on('change', ({ value }) => {
      this.bloomPass.strength = value;
    });

    f1.addBinding(bloomPassParameters, 'radius', {
      min: 0,
      max: 1,
      step: 0.01,
      view: 'number'
    }).on('change', ({ value }) => {
      this.bloomPass.radius = value;
    });

    f1.addBinding(bloomPassParameters, 'threshold', {
      min: 0,
      max: 1,
      step: 0.01,
      view: 'number'
    }).on('change', ({ value }) => {
      this.bloomPass.threshold = value;
    });

    f1.addBinding(this.bloomPass, 'enabled', {
      view: 'checkbox',
      label: 'Enabled'
    }).on('change', ({ value }) => {
      this.bloomPass.enabled = value;
    });

    f1.addBlade({
      view: 'list',
      label: 'Color',
      options: colorOptions,
      value: 'red'
    }).on('change', ({ value }) => {
      this.selectColor = value;
      console.log(this.selectColor);
    });
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);

    this.spotLight = new THREE.SpotLight(0xB9_CE_F0, 1.9, 0, 0.15, 1, 0);
    this.spotLight.position.set(-10, 20, 20);
    this.scene.add(this.spotLight);
  }

  setGeometry() {
    this.cubeGroup = new THREE.Group();
    this.scene.add(this.cubeGroup);

    this.gap = 0.1;
    this.stride = 4;
    this.displacement = 3;
    this.intensity = 1;
    this.positions = [];
    this.center = this.stride / 2 - this.stride * this.gap + this.gap;

    for (let x = 0; x < this.stride; x++) {
      for (let y = 0; y < this.stride; y++) {
        for (let z = 0; z < this.stride; z++) {
          this.positions.push([
            x + x * this.gap - this.center,
            y + y * this.gap - this.center,
            z + z * this.gap - this.center
          ]);

          const geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.15);
          const material = new THREE.MeshLambertMaterial({
            // transparent: true,
            // opacity: 0.85
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.castShadow = true;
          cube.receiveShadow = true;
          cube.position.set(
            this.positions.at(-1)[0],
            this.positions.at(-1)[1],
            this.positions.at(-1)[2]
          );

          this.cubeGroup.add(cube);
        }
      }
    }

    this.cubeGroup.rotateX(Math.PI / 4);
    this.cubeGroup.rotateZ(Math.PI / 4);
  }

  setFloor() {
    // 加载地板贴图
    new THREE.TextureLoader().load('./map.jpg', (woodfloorDiffuse) => {
      // 规定重复次数
      woodfloorDiffuse.wrapS = THREE.RepeatWrapping;
      woodfloorDiffuse.wrapT = THREE.RepeatWrapping;
      woodfloorDiffuse.repeat.set(10, 10);
      // 添加地板
      let floorGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
      let temporaryMaterial = new THREE.MeshBasicMaterial({
        map: woodfloorDiffuse
        // color: 'red'
      });
      this.floor = new THREE.Mesh(floorGeometry, temporaryMaterial);

      this.floor.material = new MeshReflectorMaterial(
        this.renderer,
        this.camera,
        this.scene,
        this.floor,
        {
          mixBlur: 1.4,
          mixStrength: 6,
          resolution: 256,
          blur: [1024, 1024],
          minDepthThreshold: 0,
          maxDepthThreshold: 6.68,
          depthScale: 11.4,
          depthToBlurRatioBias: 0.9,
          mirror: 0,
          distortion: 1,
          mixContrast: 0.97,
          reflectorOffset: 0,
          bufferSamples: 8,
          planeNormal: new THREE.Vector3(0, 0, 1)
        }
      );
      this.floor.material.setValues({
        map: woodfloorDiffuse,
        emissiveMap: woodfloorDiffuse,
        emissive: new THREE.Color(0xff_ff_ff),
        emissiveIntensity: 0.2,
        envMapIntensity: 1.08,
        roughness: 1
      });
      this.floor.rotation.x = -Math.PI / 2;
      this.floor.position.y = -2;
      this.floor.receiveShadow = true;
      this.scene.add(this.floor);
    });
  }

  setCursor(event) {
    // 监听 mousemove 事件，获取鼠标在 3D 世界中的位置

    this.pointer = new THREE.Vector2(
      (event.clientX / device.width) * 2 - 1,
      -(event.clientY / device.height) * 2 + 1
    );
  }

  setPassProcess() {
    this.composer = new EffectComposer(this.renderer);
    const renderScene = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderScene);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(device.width, device.height),
      bloomPassParameters.strength,
      bloomPassParameters.radius,
      bloomPassParameters.threshold
    );
    this.composer.addPass(this.bloomPass);

    const outputPass = new OutputPass();

    this.composer.addPass(outputPass);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
    // 计算鼠标在 3D 世界中的位置
    this.cursor.set(this.pointer.x, this.pointer.y, 0.5).unproject(this.camera);
    this.direction.copy(this.cursor).sub(this.camera.position).normalize();
    this.cursor.add(
      this.direction.multiplyScalar(this.camera.position.length())
    );
    let count = 0;
    for (let cube of this.cubeGroup.children) {
      this.originPosition.set(...this.positions[count++]);
      this.direction.copy(this.originPosition).sub(this.cursor).normalize();
      const distance = this.originPosition.distanceTo(this.cursor);
      const distanceIntensity = this.displacement - distance;
      const col = Math.max(0.5, distanceIntensity) / 1.5;
      const mov = 1 + Math.sin(elapsedTime * 2 + 500 * count);

      cube.material.color.set(
        distance > this.displacement * 1.1
          ? new THREE.Color(col / 2, col * 2.5, col * 4)
          : new THREE.Color(
            col * this.selectColor.r,
            col * this.selectColor.g,
            col * this.selectColor.b
          ) //红色
      );

      cube.position.lerp(
        distance > this.displacement * 1.1
          ? this.originPosition
          : this.tempPosition
            .copy(this.originPosition)
            .add(
              this.direction.multiplyScalar(
                distanceIntensity * this.intensity + mov / 4
              )
            ),
        0.2
      );
    }
    this.controls.update();
    // 让 controls 随时间沿世界 Y 轴周期运动

    // 使用四元数旋转，将旋转应用到 cubeGroup
    this.cubeGroup.quaternion.premultiply(
      new THREE.Quaternion().setFromAxisAngle(
        this.worldYAxis,
        Math.sin(elapsedTime) * 0.015
      )
    );
    // this.cubeGroup.position.set(0, Math.sin(elapsedTime) * 0.5 + 2, 0);

    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
    requestAnimationFrame(this.render.bind(this));
  }
  setMouseMove() {
    window.addEventListener('mousemove', this.setCursor.bind(this));
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

    this.composer.setSize(device.width, device.height);
    this.composer.setPixelRatio(Math.min(device.pixelRatio, 2));
  }
}
