import gsap from 'gsap';
import * as THREE from 'three';

import fireworkFragmentShader from '../../shaders/firework/fragment.glsl';
import fireworkVertexShader from '../../shaders/firework/vertex.glsl';
import Experience from '../experience.js';

export default class Firework {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.deviceSize = this.experience.sizes;
    this.debug = this.experience.debugger.ui;
    this.debugActive = this.experience.debugger.active;

    this.params = {
      uSizeRange: { min: 10, max: 20 },
      uCountRange: { min: 200, max: 600 },
      uRadiusRange: { min: 40, max: 80 }
    };

    this.fireworks = []; // 存储所有烟花实例

    this.debuggerInit();
  }

  createFirework() {
    const uCount =
      Math.floor(
        Math.random() *
          (this.params.uCountRange.max - this.params.uCountRange.min + 1)
      ) + this.params.uCountRange.min;
    const uSize =
      Math.random() *
        (this.params.uSizeRange.max - this.params.uSizeRange.min) +
      this.params.uSizeRange.min;
    const uColor = new THREE.Color(Math.random(), Math.random(), Math.random());
    const radius =
      Math.random() *
        (this.params.uRadiusRange.max - this.params.uRadiusRange.min) +
      this.params.uRadiusRange.min;

    const position = new THREE.Vector3(
      (Math.random() - 2) * 200,
      Math.random() * 50 + 50,
      (Math.random() - 0.5) * 300
    );

    const positionsArray = new Float32Array(uCount * 3);
    const sizesArray = new Float32Array(uCount);
    const timeMultipliersArray = new Float32Array(uCount);

    for (let index = 0; index < uCount; index++) {
      const index3 = index * 3;
      const spherical = new THREE.Spherical(
        radius,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );
      const particlePosition = new THREE.Vector3();
      particlePosition.setFromSpherical(spherical);
      positionsArray[index3] = particlePosition.x;
      positionsArray[index3 + 1] = particlePosition.y;
      positionsArray[index3 + 2] = particlePosition.z;

      sizesArray[index] = Math.random() * 0.5 + 0.5;
      timeMultipliersArray[index] = Math.random() + 1;
    }

    //   Geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positionsArray, 3)
    );
    geometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(sizesArray, 1)
    );
    geometry.setAttribute(
      'timeMultipliers',
      new THREE.Float32BufferAttribute(timeMultipliersArray, 1)
    );

    //   Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uSize: new THREE.Uniform(uSize),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(this.deviceSize.width, this.deviceSize.height)
        ),
        uTexture: {
          value: null
        },
        uColor: new THREE.Uniform(uColor),
        uProgress: new THREE.Uniform(0)
      },
      vertexShader: fireworkVertexShader,
      fragmentShader: fireworkFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    // 随机选择纹理
    const textureKeys = [
      'particles1',
      'particles2',
      'particles3',
      'particles4',
      'particles5',
      'particles6',
      'particles7',
      'particles8'
    ];
    const randomTextureKey =
      textureKeys[Math.floor(Math.random() * textureKeys.length)];
    const texture = this.resources.items[randomTextureKey];
    texture.flipY = false;
    material.uniforms.uTexture.value = texture;

    const fireworkPoints = new THREE.Points(geometry, material);
    fireworkPoints.position.copy(position);
    this.scene.add(fireworkPoints);
    const firework = { points: fireworkPoints, geometry, material };
    this.fireworks.push(firework);
    this.animate(firework);
  }

  animate(firework) {
    // Animate
    gsap.to(firework.material.uniforms.uProgress, {
      value: 1,
      duration: 2 + Math.random(), // 随机持续时间
      ease: 'power2.out',
      onComplete: () => this.destroy(firework)
    });
  }

  debuggerInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({ title: 'Firework' });
      folder.addBinding(this.params.uSizeRange, 'min', {
        min: 0.1,
        max: 20,
        step: 0.01,
        label: 'Size Min'
      });
      folder.addBinding(this.params.uSizeRange, 'max', {
        min: 20,
        max: 40,
        step: 0.01,
        label: 'Size Max'
      });
      folder.addBinding(this.params.uCountRange, 'min', {
        min: 100,
        max: 1000,
        step: 10,
        label: 'Count Min'
      });
      folder.addBinding(this.params.uCountRange, 'max', {
        min: 100,
        max: 1000,
        step: 10,
        label: 'Count Max'
      });
      folder.addBinding(this.params.uRadiusRange, 'min', {
        min: 10,
        max: 60,
        step: 0.1,
        label: 'Radius Min'
      });
      folder.addBinding(this.params.uRadiusRange, 'max', {
        min: 80,
        max: 100,
        step: 1,
        label: 'Radius Max'
      });
    }
  }

  destroy(firework) {
    this.scene.remove(firework.points);
    firework.geometry.dispose();
    firework.material.dispose();
    const index = this.fireworks.indexOf(firework);
    if (index > -1) {
      this.fireworks.splice(index, 1);
    }
  }

  resize() {
    this.deviceSize.width = window.innerWidth;
    this.deviceSize.height = window.innerHeight;
    for (const firework of this.fireworks) {
      firework.material.uniforms.uResolution.value.set(
        this.deviceSize.width,
        this.deviceSize.height
      );
    }
  }
}
