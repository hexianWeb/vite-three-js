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
      { title: '纽约', coords: { lat: 40.7128, lng: -74.006 } }
      // 可以添加更多标记
    ];

    this.createMarkers();

    // 将标记组添加到场景中
    this.scene.add(this.markersGroup);
  }

  // 经纬度转换为三维坐标
  latLngToVector3(lat, lng) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -this.earthRadius * Math.sin(phi) * Math.cos(theta);
    const y = this.earthRadius * Math.cos(phi);
    const z = this.earthRadius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  createMarkers() {
    // const markerGeometry = new THREE.SphereGeometry(0.02, 16, 16); // 小球体几何体
    const markerGeometry = new THREE.BoxGeometry(0.02, 0.5, 0.02); // 小球体几何体
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF_00_00 }); // 红色材质

    for (const marker of this.markers) {
      const position = this.latLngToVector3(
        marker.coords.lat,
        marker.coords.lng
      );
      const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
      markerMesh.position.copy(position);

      // 将标记的标题存储在userData中
      markerMesh.userData.title = marker.title;

      // 将标记添加到组中，而不是直接添加到场景
      this.markersGroup.add(markerMesh);
    }
  }

  update() {
    // 旋转标记组
    this.markersGroup.rotation.y += 0.001; // 可以调整旋转速度
  }
}
