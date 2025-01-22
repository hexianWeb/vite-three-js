import * as THREE from 'three';

import Experience from '../experience';

export default class EarthMarker {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // 地球半径
    this.earthRadius = 2;

    // 创建一个组来包含所有标记
    this.markersGroup = new THREE.Group();

    // 标记数组
    this.markers = [
      { title: '北京', coords: { lat: 39.9042, lng: 116.4074 } },
      { title: '纽约', coords: { lat: 40.7128, lng: -74.006 } },
      {
        title: '台湾',
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

    this.createMarkers();

    // 将标记组添加到场景中
    this.scene.add(this.markersGroup);
  }

  createMarkers() {
    const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
    markerGeometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(0, 0, 0.25)
    );

    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF_00_00 });

    for (const marker of this.markers) {
      const mesh = new THREE.Mesh(markerGeometry, markerMaterial);

      // 调整辅助器指向经纬度
      this.lonHelper.rotation.y =
        THREE.MathUtils.degToRad(marker.coords.lng) + Math.PI * 0.5;
      this.latHelper.rotation.x = THREE.MathUtils.degToRad(-marker.coords.lat);

      // 更新世界矩阵
      this.positionHelper.updateWorldMatrix(true, false);
      mesh.applyMatrix4(this.positionHelper.matrixWorld);

      // 将标记的标题存储在userData中
      mesh.userData.title = marker.title;

      // 将标记添加到组中
      this.markersGroup.add(mesh);
    }
  }

  update() {
    // 旋转标记组
    this.markersGroup.rotation.y += 0.001; // 可以调整旋转速度
  }
}
