import gsap from 'gsap';
import * as THREE from 'three';

import atmosphereFragmentShader from '../../shaders/atmosphere/fragment.glsl';
import atmosphereVertexShader from '../../shaders/atmosphere/vertex.glsl';
import earthFragmentShader from '../../shaders/earth/fragment.glsl';
import earthVertexShader from '../../shaders/earth/vertex.glsl';
import Experience from '../experience';
import EventEmitter from '../utils/event-emitter';
import EarthMarker from './earthMarker';

export default class Earth extends EventEmitter {
  constructor() {
    super();
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.camera = this.experience.camera.instance;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    this.resources.on('ready', () => {
      this.addEarth();
      this.addAtmosphere();

      // 存储初始四元数
      this.initialQuaternion = this.earth.quaternion.clone();
      this.earthMarker = new EarthMarker();
      this.earthMarker.on('markerClicked', (argument1, argument2) => {
        this.onMarkerClicked(argument1, argument2);
        this.trigger('EaseIn', [argument1, argument2]);
      });
      this.earth.add(this.earthMarker.markersGroup);
      this.earthRotationFlag = {
        value: true
      };
      this.debugInit();
    });
  }

  addEarth() {
    this.earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    // Textures
    const earthDayTexture = this.resources.items['earthDayTexture'];
    earthDayTexture.colorSpace = THREE.SRGBColorSpace;
    earthDayTexture.magFilter = THREE.LinearFilter;
    earthDayTexture.anisotropy = 8;
    const earthNightTexture = this.resources.items['earthNightTexture'];
    earthNightTexture.colorSpace = THREE.SRGBColorSpace;
    earthNightTexture.magFilter = THREE.LinearFilter;
    earthNightTexture.minFilter = THREE.LinearMipMapNearestFilter;
    earthNightTexture.anisotropy = 8;
    const earthCloudTexture = this.resources.items['earthCloudTexture'];
    earthCloudTexture.anisotropy = 8;
    const earthNormalTexture = this.resources.items['earthNormalTexture'];
    earthNormalTexture.anisotropy = 8;
    this.earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        uDayTexture: new THREE.Uniform(earthDayTexture),
        uNightTexture: new THREE.Uniform(earthNightTexture),
        uCloudTexture: new THREE.Uniform(earthCloudTexture),
        uSunDirection: new THREE.Uniform(
          new THREE.Vector3(-0.852, 0.5233, 0.0064)
        ),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color('#00aaff')),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color('#ff6600'))
      }
    });

    this.earthGeometry.computeTangents();
    this.earth = new THREE.Mesh(this.earthGeometry, this.earthMaterial);

    this.scene.add(this.earth);
  }

  addAtmosphere() {
    this.atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uSunDirection: new THREE.Uniform(
          new THREE.Vector3(-0.852, 0.5233, 0.0064)
        ),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color('#0000ff')),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color('#ff0000')),
        uAtmosphereIntensity: new THREE.Uniform(1),
        uAtmosphereExponent: new THREE.Uniform(1.5),
        uAtmosphereInnerExponent: new THREE.Uniform(5),
        uAtmosphereOuterExponent: new THREE.Uniform(2),
        uScale: new THREE.Uniform(1)
      },
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.atmosphereMaterial2 = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
        uAtmosphereDayColor: new THREE.Uniform(new THREE.Color('#00aaff')),
        uAtmosphereTwilightColor: new THREE.Uniform(new THREE.Color('#ff6600')),
        uAtmosphereIntensity: new THREE.Uniform(1),
        uAtmosphereExponent: new THREE.Uniform(1.5),
        uAtmosphereInnerExponent: new THREE.Uniform(5),
        uAtmosphereOuterExponent: new THREE.Uniform(2),
        uScale: new THREE.Uniform(16)
      },
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const atmosphere = new THREE.Mesh(
      this.earthGeometry,
      this.atmosphereMaterial
    );
    atmosphere.scale.set(1.02, 1.02, 1.02);
    const atmosphereClone = atmosphere.clone();
    this.scene.add(atmosphere);
    this.scene.add(atmosphereClone);
    const atmosphere2 = new THREE.Mesh(
      this.earthGeometry,
      this.atmosphereMaterial2
    );
    atmosphere2.scale.set(1.13, 1.13, 1.13);
    this.scene.add(atmosphere2);
  }

  update() {
    if (this.earth && this.earthRotationFlag.value) {
      this.earth.rotation.y += 0.001;
    }
    if (this.earthMarker) {
      this.earthMarker.update();
    }
  }

  // 定义一个方法，当标记被点击时调用
  onMarkerClicked(markerData, coords) {
    // 使用console.log输出被点击标记的标题到控制台
    this.rotateToMarker(coords.lat, coords.lng);
  }

  rotateToMarker(lat, lng) {
    // 创建辅助对象，与createMarkers方法中的类似
    const lonHelper = new THREE.Object3D();
    const latHelper = new THREE.Object3D();
    const positionHelper = new THREE.Object3D();
    lonHelper.add(latHelper);
    latHelper.add(positionHelper);
    positionHelper.position.z = this.earth.geometry.parameters.radius;

    // 设置经纬度
    lonHelper.rotation.y = THREE.MathUtils.degToRad(lng) + Math.PI * 0.5;
    latHelper.rotation.x = THREE.MathUtils.degToRad(-lat);

    // 更新世界矩阵
    lonHelper.updateWorldMatrix(true, false);

    // 获取marker的世界位置
    const markerWorldPosition = new THREE.Vector3();
    positionHelper.getWorldPosition(markerWorldPosition);

    // 计算从地球中心到marker的方向
    const directionToMarker = markerWorldPosition
      .clone()
      .sub(this.earth.position)
      .normalize();

    // 定义一个固定的目标点，比如说(0, 0, -1)，即z轴负方向
    const targetDirection = this.camera.position.clone().normalize();

    // 创建四元数，表示从marker方向到目标方向的旋转
    const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      directionToMarker,
      targetDirection
    );

    // 应用旋转
    gsap.to(this.earth.quaternion, {
      duration: 1,
      x: rotationQuaternion.x,
      y: rotationQuaternion.y,
      z: rotationQuaternion.z,
      w: rotationQuaternion.w,
      ease: 'power2.out',
      onUpdate: () => {
        this.earth.quaternion.normalize(); // 确保四元数保持单位长度
      }
    });
  }

  // 新增方法：复原到初始旋转姿态
  resetRotation() {
    gsap.to(this.earth.quaternion, {
      duration: 1,
      x: this.initialQuaternion.x,
      y: this.initialQuaternion.y,
      z: this.initialQuaternion.z,
      w: this.initialQuaternion.w,
      ease: 'power2.out',
      onUpdate: () => {
        this.earth.quaternion.normalize(); // 确保四元数保持单位长度
      }
    });
  }

  debugInit() {
    if (this.debugActive) {
      this.sunSpherical = new THREE.Spherical(1, 1.02, 4.71);
      this.sunDirection = new THREE.Vector3();
      const debugSun = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1, 2),
        new THREE.MeshBasicMaterial()
      );
      this.scene.add(debugSun);

      const earthFolder = this.debug.addFolder({
        title: 'earth'
      });

      earthFolder.addBinding(
        this.earthMaterial.uniforms.uAtmosphereDayColor,
        'value',
        {
          color: { type: 'float' }
        }
      );

      earthFolder.addBinding(
        this.earthMaterial.uniforms.uAtmosphereTwilightColor,
        'value',
        {
          color: { type: 'float' }
        }
      );

      earthFolder.addBinding(this.earthRotationFlag, 'value');
      const sunFolder = earthFolder.addFolder({
        title: 'sun'
      });
      sunFolder
        .addBinding(this.sunSpherical, 'phi', {
          min: 0,
          max: Math.PI * 2,
          step: 0.01
        })
        .on('change', () => {
          this.sunDirection.setFromSpherical(this.sunSpherical);
          debugSun.position.copy(this.sunDirection).multiplyScalar(5);
          this.earthMaterial.uniforms.uSunDirection.value.copy(
            this.sunDirection
          );
          this.atmosphereMaterial.uniforms.uSunDirection.value.copy(
            this.sunDirection
          );
        });
      sunFolder
        .addBinding(this.sunSpherical, 'theta', {
          min: 0,
          max: 2 * Math.PI,
          step: 0.01
        })
        .on('change', () => {
          this.sunDirection.setFromSpherical(this.sunSpherical);
          console.log(this.sunDirection);

          debugSun.position.copy(this.sunDirection).multiplyScalar(5);
          this.earthMaterial.uniforms.uSunDirection.value.copy(
            this.sunDirection
          );
          this.atmosphereMaterial.uniforms.uSunDirection.value.copy(
            this.sunDirection
          );
        });
      sunFolder.addBinding(
        this.atmosphereMaterial.uniforms.uAtmosphereDayColor,
        'value',
        {
          color: { type: 'float' }
        }
      );
      sunFolder.addBinding(
        this.atmosphereMaterial.uniforms.uAtmosphereTwilightColor,
        'value',
        {
          color: { type: 'float' }
        }
      );
    }
  }
}
