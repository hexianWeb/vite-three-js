import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import TextMesh from '../components/text-mesh';
import Experience from '../experience';
import EventEmitter from '../utils/event-emitter';

export default class Target360 extends EventEmitter {
  constructor(title) {
    super();

    this.experience = new Experience();
    this.renderer = this.experience.renderer.instance;
    this.sizes = this.experience.sizes;
    this.resources = this.experience.resources;
    this.canvas = this.experience.canvas;

    // 创建独立的相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);

    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    // 渲染额外场景
    this.scene360 = new THREE.Scene();

    this.setSunLight();
    this.addScene360(title);
    this.setControls();
    this.debugInit();

    // 在 scene360 中添加 TextMesh
    this.textMesh = new TextMesh(
      {
        texts: [title], // 自定义文字内容
        position: new THREE.Vector3(0, 4, -10), // 自定义位置
        rotation: new THREE.Euler(0, 0, 0) // 自定义旋转
      },
      this.scene360, // 传入 scene360
      this.camera
    );
    this.textMesh.on('reset', () => {
      this.trigger('EaseOut');
    });
  }

  setControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  setSunLight() {
    this.sunLightColor = '#ffffff';
    this.sunLightIntensity = 4;
    this.sunLight = new THREE.DirectionalLight(
      this.sunLightColor,
      this.sunLightIntensity
    );
    this.sunLight.castShadow = true;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.normalBias = 0.05;
    this.sunLightPosition = new THREE.Vector3(5, 5, 5);
    this.sunLight.position.copy(this.sunLightPosition);
    this.scene360.add(this.sunLight);

    // 设置 sunLight Target
    this.sunLight.target = new THREE.Object3D();
    this.sunLightTarget = new THREE.Vector3(0, 0, 0);
    this.sunLight.target.position.copy(this.sunLightTarget);
    this.scene360.add(this.sunLight.target);

    this.helper = new THREE.CameraHelper(this.sunLight.shadow.camera);
    this.helper.visible = false;
    this.scene360.add(this.helper);
  }

  addScene360(title) {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const environmentMap = pmremGenerator.fromEquirectangular(
      this.resources.items[title]
    ).texture;

    const background = this.resources.items[title];
    background.colorSpace = THREE.SRGBColorSpace;
    const sphere = new THREE.SphereGeometry(25, 60, 40);
    const mesh = new THREE.Mesh(
      sphere,
      new THREE.MeshBasicMaterial({
        map: background,
        side: THREE.BackSide
      })
    );

    this.scene360.environment = environmentMap;
    this.scene360.add(mesh);
  }
  debugInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({
        title: 'Target360'
      });
    }
  }

  update() {
    // 如果需要更新 TextMesh，可以调用 this.textMesh.update()
    if (this.textMesh) {
      this.textMesh.update();
    }
    if (this.controls) {
      this.controls.update();
    }
  }

  destroy() {
    // 清理场景
    this.scene360.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          for (const material of child.material) material.dispose();
        } else {
          child.material.dispose();
        }
      }
    });

    // 移除事件监听器
    this.textMesh.off('reset');

    // 清空场景
    while (this.scene360.children.length > 0) {
      this.scene360.remove(this.scene360.children[0]);
    }

    // 释放相机
    this.camera = null;
    if (this.controls) {
      this.controls.dispose();
    }
  }
}
