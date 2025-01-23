import * as THREE from 'three';

import Experience from '../experience';
import EventEmitter from '../utils/event-emitter';

export default class EarthMarker extends EventEmitter {
  constructor() {
    super();
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.camera = this.experience.camera.instance;
    this.iMouse = this.experience.iMouse;
    this.raycaster = new THREE.Raycaster();

    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;
    // 地球半径
    this.earthRadius = 2.02;

    // 创建一个组来包含所有标记
    this.markersGroup = new THREE.Group();

    // 标记数组
    this.markers = [
      { title: '北京', coords: { lat: 39.9042, lng: 116.4074 } },
      { title: '纽约', coords: { lat: 40.7128, lng: -74.006 } },
      {
        title: '中国台湾',
        coords: {
          lat: 24.915_71,
          lng: 121.6739
        }
      }
      // 可以添加更多标记
    ];

    // 创建位置辅助器
    this.lonHelper = new THREE.Object3D();
    this.latHelper = new THREE.Object3D();
    this.lonHelper.add(this.latHelper);
    this.positionHelper = new THREE.Object3D();
    this.positionHelper.position.z = this.earthRadius;
    this.latHelper.add(this.positionHelper);

    this.resources.on('ready', () => {
      this.createMarkers();
    });

    window.addEventListener('click', this.onMouseClick.bind(this));

    // 将标记组添加到场景中
    this.debugInit();
  }

  createMarkers() {
    const pointMarker = this.resources.items['pointMarker'];

    for (const marker of this.markers) {
      const markerModel = pointMarker.scene.clone();
      markerModel.scale.set(0.042, 0.042, 0.042);
      // 调整辅助器指向经纬度
      this.lonHelper.rotation.y =
        THREE.MathUtils.degToRad(marker.coords.lng) + Math.PI * 0.5;
      this.latHelper.rotation.x = THREE.MathUtils.degToRad(-marker.coords.lat);

      // 更新世界矩阵
      this.positionHelper.updateWorldMatrix(true, false);
      markerModel.applyMatrix4(this.positionHelper.matrixWorld);

      // 添加 userData marker 并且合并当前 markerModelPosition
      markerModel.userData = marker;

      // 将标记添加到组中
      this.markersGroup.add(markerModel);
    }
  }

  onMouseClick() {
    this.raycaster.setFromCamera(this.iMouse.normalizedMouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.markersGroup.children,
      true
    );

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

      let markerObject = intersectedObject;

      // 遍历父级对象，直到找到包含 userData.title 的对象
      while (markerObject && !markerObject.userData.title) {
        markerObject = markerObject.parent;
      }

      if (markerObject && markerObject.userData.title) {
        this.trigger('markerClicked', [
          markerObject.userData.title,
          markerObject.userData.coords
        ]);
      }
    }
  }

  update() {
    // 保证所有 markersGroup的 marker up 为0,1,0 且lookAt 摄像机
    for (const item of this.markersGroup.children) {
      //   item.up.set(0, 1, 0);
      item.lookAt(this.camera.position);
    }
  }

  debugInit() {
    if (this.debugActive) {
      const f1 = this.debug.addFolder({
        title: 'Marker'
      });
    }
  }
}
