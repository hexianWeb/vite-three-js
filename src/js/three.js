import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';

import { Pane } from 'tweakpane';
import gsap from 'gsap';

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
      65,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(-7,2,10);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));
    this.renderer.setClearColor('#1c1c1c')
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.setEnv();
    this.setLights();
    this.setMaterial();
    this.LoadModel();
    this.render();
    this.setResize();
    this.setDebug();
  }

  setDebug() {
    // this.scene.add(new THREE.AxesHelper(5));
    const params = {
      process: 0,
      envIntensity: 1,
      metalness: 0.75,
      roughness: 0.25,
      clearcoat:1,
      clearcoatRoughness:0.05
    }

    const pane = new Pane();

    pane.addBinding(
      params, 'process',{
        min: 0,
        max: 1,
        step: 0.01,
      }
    ).on('change', () => {
      this.material.uniforms.uProgress.value = params.process;
    })
    const envFolder = pane.addFolder({ title: 'Environment' });
    envFolder.addBinding(
      params, 'envIntensity',{
        min: 0,
        max: 5,
        step: 0.01,
      }
    ).on('change', () => {
      this.scene.environmentIntensity = params.envIntensity;
    })

    const PBRFolder = pane.addFolder({ title: 'Custom Shader' });
    PBRFolder.addBinding(params, 'metalness', {
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change',()=>{
      this.material.metalness = params.metalness;
    })
    PBRFolder.addBinding(params, 'roughness', {
      min: 0,
      max: 1,
      step: 0.01,
      }).on('change',()=>{
        this.material.roughness = params.roughness;
    })
    PBRFolder.addBinding(params, 'clearcoat', {
      min: 0,
      max: 2,
      step: 0.01,
    }).on('change',()=>{
      this.material.clearcoat = params.clearcoat;
    })

    PBRFolder.addBinding(params, 'clearcoatRoughness', {
      min: 0,
      max: 1,
      step: 0.01,
    }).on('change',()=>{
      this.material.clearcoatRoughness = params.clearcoatRoughness;
    })

    const colorFolder = pane.addFolder({ title: 'Color Controls' });
    let isAnimating = false; // Animation flag

    colorFolder.addButton({
      title: 'Change Color',
    }).on('click', () => {
      if (isAnimating) return; // If already animating, do nothing

      isAnimating = true; // Set animating flag to true
      // Assign uNewColor to uPrevColor
      this.material.uniforms.uPrevColor.value.copy(this.material.uniforms.uNewColor.value);

      // Generate a random new color
      const newColor = new THREE.Color(Math.random(), Math.random(), Math.random());
      this.material.uniforms.uNewColor.value.copy(newColor);

      // Reset uProgress
      this.material.uniforms.uProgress.value = 0;

      // Use gsap to animate uProgress
      gsap.to(this.material.uniforms.uProgress, {
        value: 1,
        duration: 2.5, // Duration of the animation in seconds
        ease: 'power1.inOut',
        onComplete: () => { // Callback when animation completes
          isAnimating = false; // Reset animating flag
        }
      });
    });
  }

  setEnv () {
    // 添加 fog
    this.scene.fog = new THREE.FogExp2('#1c1c1c', 0.001);
    // 引入 hdr
    const loader = new RGBELoader();
    loader.load('./env.hdr',(texture)=> {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.environmentIntensity = 1.2;
    })
  }

  setFloor() {

  }
  setLights() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    this.directionalLight.position.set(-2,2.5,1);
    this.scene.add(this.directionalLight);
    this.directionalLight.shadow.mapSize.width =  256;
    this.directionalLight.shadow.mapSize.height = 256;
    this.directionalLight.shadow.bias = -0.0001;
    // 添加 Helper 辅助线
    const helper = new THREE.DirectionalLightHelper(this.directionalLight, 1);
    // this.scene.add(helper);
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setMaterial() {
    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      // Your Uniforms
      uniforms: {
        uProgress: { value: 0 },
        uPrevColor: { value: new THREE.Color('#ff0000') },
        uNewColor: {value: new THREE.Color('#00ff00')},
        uResolution: { value: new THREE.Vector2(device.width, device.height) }
      },
      metalness:0.75,
      roughness:0.25,
      clearcoat:1,
      clearcoatRoughness:0.05
    });
  }

  LoadModel() {
    const loader = new GLTFLoader();
    loader.load('./model/car.glb', ({ scene }) => {
      scene.traverse((child) => {
        if (child.isMesh && child.name === 'outside') {
          child.material = this.material;
        }
      });
      this.scene.add(scene);
    });
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();
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
