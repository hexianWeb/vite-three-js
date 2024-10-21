import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
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
    this.camera.position.set(2, 2, 8);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    // 开启阴影渲染
    this.renderer.shadowMap.enabled = true;
    // 设定透明 background
    this.renderer.setClearColor(0x00_00_00, 0);
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setDebug();
    this.setLights();
    this.setEnv('./lake_pier_2k.hdr');
    this.setGeometry();
    this.render();
    this.setResize();
  }

  setDebug() {
    this.uniforms = {
      uTime: new THREE.Uniform(0),
      uPositionFrequency: new THREE.Uniform(0.6),
      uTimeFrequency: new THREE.Uniform(0.95),
      uNoiseFrequency: new THREE.Uniform(0.5),
      uNoiseTimeFrequency: new THREE.Uniform(0.3),
      uNoiseStrength: new THREE.Uniform(2.3),
      uColor: new THREE.Uniform(new THREE.Color('#fff')),
      uStrength: new THREE.Uniform(0.115),
      colorA: new THREE.Uniform(new THREE.Color('#fff')), // New colorA uniform
      colorB: new THREE.Uniform(new THREE.Color('#fff')) // New colorB uniform
    };
    this.materialParams = {
      metalness: 0.08,
      roughness: 0.22,
      color: new THREE.Color('#fff'),
      transmission: 1,
      ior: 1.6,
      thickness: 1.44
    };

    const pane = new Pane();
    const debugFolder = pane.addFolder({ title: 'Debug' });

    debugFolder.addBinding(this.uniforms.uPositionFrequency, 'value', {
      label: 'Position Frequency',
      step: 0.005,
      min: 0,
      max: 2.5
    });

    debugFolder.addBinding(this.uniforms.uTimeFrequency, 'value', {
      label: 'Time Frequency',
      step: 0.005,
      min: 0,
      max: 2.5
    });

    // For the color, assuming you want to bind it as an interactive color picker
    debugFolder.addBinding(this.uniforms.uColor, 'value', {
      label: 'Color',
      view: 'color',
      color: { type: 'float' }
    });

    debugFolder.addBinding(this.uniforms.uStrength, 'value', {
      label: 'Strength',
      step: 0.005,
      min: 0,
      max: 2.5
    });
    // New uniforms for noise parameters
    debugFolder.addBinding(this.uniforms.uNoiseFrequency, 'value', {
      step: 0.005,
      min: 0,
      max: 2.5,
      label: 'Noise Frequency'
    });

    debugFolder.addBinding(this.uniforms.uNoiseTimeFrequency, 'value', {
      step: 0.005,
      min: 0,
      max: 2.5,
      label: 'Noise Time Frequency'
    });

    debugFolder.addBinding(this.uniforms.uNoiseStrength, 'value', {
      step: 0.005,
      min: 0,
      max: 2.5,
      label: 'Noise Strength'
    });

    // Bindings for colorA and colorB with color: { type: 'float' }
    debugFolder.addBinding(this.uniforms.colorA, 'value', {
      view: 'color',
      color: { type: 'float' }, // Added color type as float
      label: 'Color A'
    });

    debugFolder.addBinding(this.uniforms.colorB, 'value', {
      view: 'color',
      color: { type: 'float' }, // Added color type as float
      label: 'Color B'
    });

    // Separate folder for material parameters
    const materialParametersFolder = pane.addFolder({
      title: 'Material Parameters'
    });

    // GUI for materialParams with appropriate steps, ranges, and views, using 'value' and 'onChange'
    materialParametersFolder
      .addBinding(this.materialParams, 'metalness', {
        step: 0.01,
        min: 0,
        max: 1
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.metalness = value; // Update metalness in real-time
      });

    materialParametersFolder
      .addBinding(this.materialParams, 'roughness', {
        step: 0.01,
        min: 0,
        max: 1
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.roughness = value; // Update roughness in real-time
      });

    materialParametersFolder
      .addBinding(this.materialParams, 'color', {
        view: 'color',
        color: { type: 'float' }
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.color.set(new THREE.Color(value)); // Update color in real-time
      });

    materialParametersFolder
      .addBinding(this.materialParams, 'transmission', {
        step: 0.01,
        min: 0,
        max: 1
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.transmission = value; // Update transmission in real-time
      });

    materialParametersFolder
      .addBinding(this.materialParams, 'ior', {
        step: 0.1,
        min: 1,
        max: 2.5
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.ior = value; // Update index of refraction in real-time
      });

    // Modify 'thickness' to bind to the 'value' field with 'onChange'
    materialParametersFolder
      .addBinding(this.materialParams, 'thickness', {
        step: 0.01,
        min: 0,
        max: 10
      })
      .on('change', ({ value }) => {
        this.sphereMaterial.thickness = value; // Update thickness in real-time
      });
  }
  setLights() {
    // this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    // this.scene.add(this.ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xFF_FF_FF, 1);
    directionalLight.position.set(0, 0, 5);
    directionalLight.castShadow = true; // 启用阴影投射
    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    this.scene.add(directionalLight);
  }

  setEnv(hdrPath) {
    const rgbeLoader = new RGBELoader();
    // rgbeLoader.setDataType(THREE.UnsignedByteType);
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    rgbeLoader.load(hdrPath, (texture) => {
      const environmentMap =
        pmremGenerator.fromEquirectangular(texture).texture;
      // this.scene.background = environmentMap;
      this.scene.environment = environmentMap;
      this.scene.environmentIntensity = 0.5;
    });
  }

  setGeometry() {
    const textureLoader = new THREE.TextureLoader();
    const matcap = textureLoader.load('./matcap.png');
    // 利用 csm 创建一个基于物理材质的球体
    let sphereGeometry = new THREE.IcosahedronGeometry(2.5, 64);
    sphereGeometry.center();
    sphereGeometry = BufferGeometryUtils.mergeVertices(sphereGeometry);
    sphereGeometry.computeTangents();

    this.sphereMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      metalness: this.materialParams.metalness,
      roughness: this.materialParams.roughness,
      color: this.materialParams.color,
      transmission: this.materialParams.transmission,
      ior: this.materialParams.ior,
      thickness: this.materialParams.thickness,
      transparent: true,
      wireframe: false,
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: this.uniforms
    });
    // this.sphereMaterial.flatShading = true; // 开启平滑渲染
    // 创建深度材质 用于渲染物体的深度 修复阴影问题
    const depthMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      wireframe: false,
      vertexShader: vertex,
      // 一种特殊的深度信息打包方式，bit-packing，将深度信息分成4个通道，分别存储在RGBA各个通道中 而不是往常的白近黑远
      depthPacking: THREE.RGBADepthPacking,
      uniforms: this.uniforms
    });
    this.sphereMesh = new THREE.Mesh(sphereGeometry, this.sphereMaterial);
    this.sphereMesh.castShadow = true;
    this.sphereMesh.receiveShadow = true;
    this.sphereMesh.customDepthMaterial = depthMaterial;

    const insideSphereGeometry = new THREE.CapsuleGeometry(1.2, 0.9, 4, 8);
    const insideSphereMaterial = new THREE.MeshMatcapMaterial({
      matcap: matcap
    });
    this.insideSphereMesh = new THREE.Mesh(
      insideSphereGeometry,
      insideSphereMaterial
    );
    this.scene.add(this.insideSphereMesh);
    this.scene.add(this.sphereMesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.uniforms.uTime.value = Math.cos(elapsedTime) * 1.5;

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
