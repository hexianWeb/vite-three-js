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
      uSize: 0.35,
      uCount: 400,
      uColor: '#ff0000', // Color
      uProgress: 0
    };

    this.fireworks = []; // 存储所有烟花实例

    this.debuggerInit();
  }

  createFirework(position = new THREE.Vector3(0, 0, 0), radius = 3) {
    // 几何体
    const positionsArray = new Float32Array(this.params.uCount * 3);
    const sizesArray = new Float32Array(this.params.uCount);
    const timeMultipliersArray = new Float32Array(this.params.uCount);

    for (let index = 0; index < this.params.uCount; index++) {
      const index3 = index * 3;
      const spherical = new THREE.Spherical(
        radius,
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2
      );
      const position = new THREE.Vector3();
      position.setFromSpherical(spherical);
      positionsArray[index3] = position.x;
      positionsArray[index3 + 1] = position.y;
      positionsArray[index3 + 2] = position.z;

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
        uSize: new THREE.Uniform(this.params.uSize),
        uResolution: new THREE.Uniform(
          new THREE.Vector2(this.deviceSize.width, this.deviceSize.height)
        ),
        uTexture: {
          // eslint-disable-next-line unicorn/no-null
          value: null
        },
        uColor: new THREE.Uniform(new THREE.Color(this.params.uColor)),
        uProgress: new THREE.Uniform(this.params.uProgress)
      },
      vertexShader: fireworkVertexShader,
      fragmentShader: fireworkFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    //   Object3D
    // Points
    const texture = this.resources.items['particles4'];
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
      duration: 3,
      onComplete: () => this.destroy(firework)
    });
  }

  debuggerInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({ title: 'Firework' });
      folder.addBinding(this.params, 'uSize', {
        min: 0.01,
        max: 1,
        step: 0.01
      });

      folder.addBinding(this.params, 'uColor', {
        view: 'color'
      });
      folder.addBinding(this.params, 'uCount', {
        min: 200,
        max: 1000,
        step: 1
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
    this.material.uniforms.uResolution.value.set(
      this.deviceSize.width,
      this.deviceSize.height
    );
  }
}
