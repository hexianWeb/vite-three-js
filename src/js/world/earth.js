import * as THREE from 'three';

import atmosphereFragmentShader from '../../shaders/atmosphere/fragment.glsl';
import atmosphereVertexShader from '../../shaders/atmosphere/vertex.glsl';
import earthFragmentShader from '../../shaders/earth/fragment.glsl';
import earthVertexShader from '../../shaders/earth/vertex.glsl';
import Experience from '../experience';

export default class Earth {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    this.resources.on('ready', () => {
      this.addEarth();
      this.addAtmosphere();
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
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
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
        uSunDirection: new THREE.Uniform(new THREE.Vector3(0, 0, 1)),
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
    atmosphere.scale.set(1.007, 1.007, 1.007);
    const atmosphereClone = atmosphere.clone();
    this.scene.add(atmosphere);
    this.scene.add(atmosphereClone);
    const atmosphere2 = new THREE.Mesh(
      this.earthGeometry,
      this.atmosphereMaterial2
    );
    atmosphere2.scale.set(1.15, 1.15, 1.15);
    this.scene.add(atmosphere2);
  }

  update() {
    if (this.earth) {
      this.earth.rotation.y += 0.001;
    }
  }

  debugInit() {
    if (this.debugActive) {
      this.sunSpherical = new THREE.Spherical(1, Math.PI * 0.5, 0.5);
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
