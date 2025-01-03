import * as THREE from 'three';

import backgroundFragmentShader from '../../shaders/background/fragment.glsl';
import backgroundVertexShader from '../../shaders/background/vertex.glsl';
import Experience from '../experience.js';

export default class EnvironmentSphere {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    this.resources.on('ready', () => {
      const sphere = new THREE.SphereGeometry(
        450,
        32,
        32,
        0,
        Math.PI * 2,
        0,
        Math.PI
      );
      const uTexture = this.resources.items['background'];
      uTexture.minFilter = THREE.LinearFilter;
      uTexture.magFilter = THREE.LinearFilter;
      uTexture.ColorSpace = THREE.SRGBColorSpace;
      const sphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: this.resources.items['background'] }
        },
        vertexShader: backgroundVertexShader,
        fragmentShader: backgroundFragmentShader,
        side: THREE.BackSide
      });
      const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
      this.scene.add(sphereMesh);
    });
  }
}
