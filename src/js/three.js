import { gsap } from 'gsap/gsap-core';
import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
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
    // this.camera = new THREE.OrthographicCamera(
    //   -1,
    //   1,
    //   device.height / device.width,
    //   -device.height / device.width,
    //   0.1,
    //   100
    // );
    this.camera.position.set(3, 3, 3);
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

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setDebug();
    this.setLights();
    this.setObject();
    this.render();
    this.setResize();
  }

  setDebug() {
    const parameters = {
      power: 0.3,
      roundFrequency: 1
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
        this.depthMesh.uniforms.uProgress.value = value;
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
        this.depthMesh.uniforms.uRoundFrequency.value = value;
      });
    this.scene.add(new THREE.AxesHelper(5));

    // 添加 GSAP 动画按钮
    pane.addButton({ title: '周期动画' }).on('click', () => {
      gsap.to(this.shaderUniforms.uProgress, {
        value: 1,
        duration: 1,
        onComplete: () => {
          gsap.to(this.shaderUniforms.uProgress, { value: 0, duration: 1 });
        }
      });
    });
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(0xaa_aa_aa));
    this.scene.add(this.ambientLight);

    // 添加 一个聚光灯
    const light = new THREE.SpotLight(0xff_ff_ff, 200, 9, Math.PI / 6.5, 0.15);
    light.position.set(0, 5, 5);
    light.target.position.set(0, 2, 0);
    light.castShadow = true;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 7;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.bias = 0.0001;

    // 添加 spotlightHelper
    const spotlightHelper = new THREE.SpotLightHelper(light);
    this.scene.add(spotlightHelper);
    this.scene.add(light);
  }

  setObject() {
    this.geometry = new THREE.IcosahedronGeometry(1, 9).toNonIndexed();
    // this.geometry = new THREE.SphereGeometry(2, 32, 32).toNonIndexed();
    this.loader.load('./model/lion.glb', ({ scene }) => {
      // console.log(scene);
      this.geometry = scene.children[0].geometry.toNonIndexed();
      this.geometry.computeVertexNormals();
      this.geometry.computeFaceNormals();
      this.geometry.computeBoundingSphere();
    });
    // 计算包围球
    this.geometry.computeBoundingSphere();
    // 获取 几何体的高度
    let height = Math.floor(this.geometry.boundingSphere.radius * 2);

    this.shaderUniforms.uHeight = { type: 'f', value: height };

    // 自定义着色器材质
    this.shaderMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      silent: true, // Disables the default warning if true
      uniforms: this.shaderUniforms,
      flatShading: true,
      side: THREE.FrontSide,
      color: 0xff_00_ff
    });
    let length = this.geometry.attributes.position.count;

    let randomsArray = new Float32Array(length);
    let centersArray = new Float32Array(length * 3);

    for (let index = 0; index < length; index += 3) {
      let randomNumber = Math.random();
      randomsArray[index] = randomNumber;
      randomsArray[index + 1] = randomNumber;
      randomsArray[index + 2] = randomNumber;

      // 计算出 this.geometry 中每个三角形的重心

      // 顶点 A
      let x = this.geometry.attributes.position.array[index * 3];
      let y = this.geometry.attributes.position.array[index * 3 + 1];
      let z = this.geometry.attributes.position.array[index * 3 + 2];

      // 顶点B
      let x1 = this.geometry.attributes.position.array[index * 3 + 3];
      let y1 = this.geometry.attributes.position.array[index * 3 + 4];
      let z1 = this.geometry.attributes.position.array[index * 3 + 5];

      // 顶点C
      let x2 = this.geometry.attributes.position.array[index * 3 + 6];
      let y2 = this.geometry.attributes.position.array[index * 3 + 7];
      let z2 = this.geometry.attributes.position.array[index * 3 + 8];

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
    this.geometry.setAttribute(
      'aRandom',
      new THREE.BufferAttribute(randomsArray, 1)
    );

    this.geometry.setAttribute(
      'aCenter',
      new THREE.BufferAttribute(centersArray, 3)
    );

    console.log(this.geometry.attributes);

    this.mesh = new THREE.Mesh(this.geometry, this.shaderMaterial);
    this.mesh.translateY(height / 2);
    this.depthMesh = new CustomShaderMaterial({
      baseMaterial: THREE.MeshDepthMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      silent: true, // Disables the default warning if true
      uniforms: this.shaderUniforms,
      depthPacking: THREE.RGBADepthPacking
    });
    this.mesh.customDepthMaterial = this.depthMesh;

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    // 添加地板
    let floorGeometry = new THREE.PlaneGeometry(10, 10);
    let floorMaterial = new THREE.MeshStandardMaterial({
      color: '#fff',
      // shininess: 0,
      side: THREE.DoubleSide
    });
    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  // setGeometry(geometry) {
  //   geometry.computeVertexNormals();
  //   geometry.computeFaceNormals();
  //   geometry.computeBoundingSphere();

  //   let height = Math.floor(geometry.boundingSphere.radius * 2);

  // }
  render() {
    const elapsedTime = this.clock.getElapsedTime();

    // 材质的 uniforms 值更新
    this.shaderMaterial.uniforms.uTime.value = elapsedTime;

    // this.mesh.rotation.x = 0.2 * elapsedTime;
    // this.mesh.rotation.y = 0.1 * elapsedTime;

    this.renderer.render(this.scene, this.camera);
    this.controls.update();
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
