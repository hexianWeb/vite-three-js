import { gsap } from 'gsap/gsap-core';
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { Pane } from 'tweakpane';

import { MeshReflectorMaterial } from '../mesh-reflector-material';
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
    this.scene.background = new THREE.Color('#ffffff');
    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      100
    );
    // this.camera = new THREE.OrthographicCamera(
    //   -1,
    //   1,
    //   device.height / device.width,
    //   -device.height / device.width,
    //   0.1,
    //   100
    // );
    this.camera.position.set(-0.7, 0.5, 0.5);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    // 允许阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.canvas);
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.05;
    this.controls.target.set(0.16, 0.43, 0.31);
    this.controls.update();
    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setDebug();
    this.setLights();
    this.setFloor();
    this.setObject();
    // this.setEnv();
    this.setFog();
    this.render();
    this.setResize();
  }

  setDebug() {
    const parameters = {
      power: 0.3,
      roundFrequency: 1,
      durationTime: 3
    };
    this.shaderUniforms = {
      progress: { type: 'f', value: 0 },
      uTime: { type: 'f', value: 0 },
      uProgress: { type: 'f', value: 0.3 },
      uRoundFrequency: { type: 'f', value: 1 }
    };
    const pane = new Pane();
    pane
      .addBinding(parameters, 'power', {
        min: 0,
        max: 1,
        step: 0.01,
        label: '变化强度'
      })
      .on('change', ({ value }) => {
        this.shaderMaterial.uniforms.uProgress.value = value;
        this.depthMaterial.uniforms.uProgress.value = value;
      });

    pane
      .addBinding(parameters, 'roundFrequency', {
        min: 0,
        max: 10,
        step: 0.5,
        label: '转动周期'
      })
      .on('change', ({ value }) => {
        this.shaderMaterial.uniforms.uRoundFrequency.value = value;
        this.depthMaterial.uniforms.uRoundFrequency.value = value;
      });
    this.scene.add(new THREE.AxesHelper(5));

    // 添加 GSAP 动画按钮
    // const DURATION_TIME = 3;
    pane.addBinding(parameters, 'durationTime', {
      min: 0,
      max: 10,
      step: 0.5,
      label: '动画时长'
    });
    pane.addButton({ title: '周期动画' }).on('click', () => {
      gsap.to(this.shaderUniforms.uProgress, {
        value: 1,
        duration: parameters.durationTime,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.to(this.shaderUniforms.uProgress, {
            value: 0,
            // duration: 1,
            ease: 'power2.inOut',
            duration: parameters.durationTime
          });
        }
      });
    });
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(0xaa_aa_aa));
    this.scene.add(this.ambientLight);

    // 添加 一个聚光灯
    this.spotLight = new THREE.SpotLight(
      0xff_ff_ff,
      6.5,
      9,
      // Math.PI / 6.5,
      Math.PI / 2,
      0.01,
      0.51
    );
    this.spotLight.position.set(-1.5, 3, 2);
    this.spotLight.target.position.set(0, 0, 0);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.camera.near = 0.1;
    this.spotLight.shadow.camera.far = 7;
    this.spotLight.shadow.mapSize.width = 2048;
    this.spotLight.shadow.mapSize.height = 2048;
    this.spotLight.shadow.bias = 0.0001;
    // 添加 spotlightHelper
    const spotlightHelper = new THREE.SpotLightHelper(this.spotLight);
    this.scene.add(spotlightHelper);
    this.scene.add(this.spotLight);
  }

  setObject() {
    this.loader.load('./model/lion.glb', ({ scene }) => {
      this.geometry = scene.children[0].geometry.toNonIndexed();
      this.mesh = this.setGeometry(this.geometry);
      this.scene.add(this.mesh);
    });
  }

  setFloor() {
    // 加载地板贴图
    new THREE.TextureLoader().load('./white.jpg', (woodfloorDiffuse) => {
      // 规定重复次数
      woodfloorDiffuse.wrapS = THREE.RepeatWrapping;
      woodfloorDiffuse.wrapT = THREE.RepeatWrapping;
      woodfloorDiffuse.repeat.set(10, 10);
      // 添加地板
      let floorGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
      let temporaryMaterial = new THREE.MeshBasicMaterial({
        map: woodfloorDiffuse
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
      this.floor.position.y = -0.1;
      this.floor.receiveShadow = false;
      this.scene.add(this.floor);
    });
  }

  setFog() {
    this.scene.fog = new THREE.Fog(0xFF_FF_FF, 1, 3);
  }
  setGeometry(geometry) {
    geometry.computeBoundingSphere();

    // 获取 几何体的高度
    let height = Math.floor(geometry.boundingSphere.radius * 2);

    this.shaderUniforms.uHeight = { type: 'f', value: height };

    // 自定义着色器材质
    this.shaderMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      silent: true, // Disables the default warning if true
      uniforms: this.shaderUniforms,
      flatShading: true,
      side: THREE.FrontSide,
      emissive: '#fff',
      emissiveIntensity: 0.19
      // metalness: 0.5,
      // metalness: 0.35,
      // roughness: 0.9
      // envMapIntensity: 0
    });
    // this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    // this.pmremGenerator.compileEquirectangularShader();
    // this.envMap = new THREE.TextureLoader().load('./envmap.jpg', (texture) => {
    //   this.envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
    //   this.envMap.ColorSpace = THREE.SRGBColorSpace;
    //   this.shaderMaterial.envMap = this.envMap;
    // });
    // this.pmremGenerator.dispose();
    let length = geometry.attributes.position.count;

    let randomsArray = new Float32Array(length);
    let centersArray = new Float32Array(length * 3);

    for (let index = 0; index < length; index += 3) {
      let randomNumber = Math.random();
      randomsArray[index] = randomNumber;
      randomsArray[index + 1] = randomNumber;
      randomsArray[index + 2] = randomNumber;

      // 计算出 this.geometry 中每个三角形的重心

      // 顶点 A
      let x = geometry.attributes.position.array[index * 3];
      let y = geometry.attributes.position.array[index * 3 + 1];
      let z = geometry.attributes.position.array[index * 3 + 2];

      // 顶点B
      let x1 = geometry.attributes.position.array[index * 3 + 3];
      let y1 = geometry.attributes.position.array[index * 3 + 4];
      let z1 = geometry.attributes.position.array[index * 3 + 5];

      // 顶点C
      let x2 = geometry.attributes.position.array[index * 3 + 6];
      let y2 = geometry.attributes.position.array[index * 3 + 7];
      let z2 = geometry.attributes.position.array[index * 3 + 8];

      // 计算重心
      let center = new THREE.Vector3(x, y, z)
        .add(new THREE.Vector3(x1, y1, z1))
        .add(new THREE.Vector3(x2, y2, z2))
        .divideScalar(3);

      centersArray[index * 3] = center.x;
      centersArray[index * 3 + 1] = center.y;
      centersArray[index * 3 + 2] = center.z;
      centersArray[index * 3 + 3] = center.x;
      centersArray[index * 3 + 4] = center.y;
      centersArray[index * 3 + 5] = center.z;
      centersArray[index * 3 + 6] = center.x;
      centersArray[index * 3 + 7] = center.y;
      centersArray[index * 3 + 8] = center.z;
    }

    // 填入 attribute
    geometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randomsArray, 1)
    );

    geometry.setAttribute(
      'aCenter',
      new THREE.BufferAttribute(centersArray, 3)
    );

    const mesh = new THREE.Mesh(geometry, this.shaderMaterial);
    // mesh.translateY(height / 2);
    this.depthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      silent: true, // Disables the default warning if true
      uniforms: this.shaderUniforms,
      depthPacking: THREE.RGBADepthPacking
    });
    mesh.customDepthMaterial = this.depthMaterial;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    if (this.floor) {
      this.floor.material.update();
    }

    this.renderer.render(this.scene, this.camera);
    // this.controls.update();
    // console.log(this.camera.position);

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
