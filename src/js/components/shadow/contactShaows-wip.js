import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

import Experience from '../../experience.js';

/**
 * ContactShadows class for creating contact shadows
 * Credit: https://github.com/mrdoob/three.js/blob/master/examples/webgl_shadow_contact.html
 */
export default class ContactShadows {
  /**
   * @param {Object} config - Configuration options for contact shadows
   */
  constructor(config = {}) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer.instance;

    this.setConfig(config);
    this.setup();
  }

  setConfig(config) {
    const defaultConfig = {
      scale: 10,
      frames: Infinity,
      opacity: 1,
      width: 1,
      height: 1,
      blur: 1,
      far: 10,
      resolution: 512,
      smooth: true,
      color: '#000000',
      depthWrite: false
    };

    this.config = { ...defaultConfig, ...config };

    this.frames = this.config.frames;
    this.blur = this.config.blur;
    this.smooth = this.config.smooth;
  }

  setup() {
    const {
      width,
      height,
      scale,
      far,
      resolution,
      color,
      opacity,
      depthWrite
    } = this.config;

    const scaledWidth = width * (Array.isArray(scale) ? scale[0] : scale);
    const scaledHeight = height * (Array.isArray(scale) ? scale[1] : scale);

    // Create shadow camera
    this.shadowCamera = new THREE.OrthographicCamera(
      -scaledWidth / 2,
      scaledWidth / 2,
      scaledHeight / 2,
      -scaledHeight / 2,
      0,
      far
    );

    // Create render targets
    this.renderTarget = new THREE.WebGLRenderTarget(resolution, resolution);
    this.renderTargetBlur = new THREE.WebGLRenderTarget(resolution, resolution);
    this.renderTargetBlur.texture.generateMipmaps =
      this.renderTarget.texture.generateMipmaps = false;

    // Create plane geometry and blur plane
    const planeGeometry = new THREE.PlaneGeometry(
      scaledWidth,
      scaledHeight
    ).rotateX(Math.PI / 2);
    this.blurPlane = new THREE.Mesh(planeGeometry);

    // Create depth material
    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.depthTest = this.depthMaterial.depthWrite = false;
    this.setupDepthMaterial(color);

    // Create blur materials
    this.horizontalBlurMaterial = new THREE.ShaderMaterial(
      HorizontalBlurShader
    );
    this.verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
    this.verticalBlurMaterial.depthTest =
      this.horizontalBlurMaterial.depthTest = false;

    // Create group and mesh
    this.group = new THREE.Group();
    this.group.rotation.x = Math.PI / 2;

    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture,
      transparent: true,
      opacity,
      depthWrite
    });

    this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    this.mesh.scale.set(1, -1, 1);
    this.mesh.rotation.set(-Math.PI / 2, 0, 0);

    this.addToScene();

    this.count = 0;
  }

  setupDepthMaterial(color) {
    this.depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.ucolor = { value: new THREE.Color(color) };
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        'uniform vec3 ucolor;\nvoid main() {'
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );'
      );
    };
  }

  addToScene() {
    this.group.add(this.mesh);
    this.group.add(this.shadowCamera);
    this.scene.add(this.group);
  }

  blurShadows(blur) {
    const {
      shadowCamera,
      renderTarget,
      renderTargetBlur,
      blurPlane,
      horizontalBlurMaterial,
      verticalBlurMaterial
    } = this;

    blurPlane.visible = true;

    // Horizontal blur
    blurPlane.material = horizontalBlurMaterial;
    horizontalBlurMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    horizontalBlurMaterial.uniforms.h.value = (blur * 1) / 256;

    this.renderer.setRenderTarget(renderTargetBlur);
    this.renderer.render(blurPlane, shadowCamera);

    // Vertical blur
    blurPlane.material = verticalBlurMaterial;
    verticalBlurMaterial.uniforms.tDiffuse.value = renderTargetBlur.texture;
    verticalBlurMaterial.uniforms.v.value = (blur * 1) / 256;

    this.renderer.setRenderTarget(renderTarget);
    this.renderer.render(blurPlane, shadowCamera);

    blurPlane.visible = false;
  }

  update() {
    if (
      this.shadowCamera &&
      (this.frames === Infinity || this.count < this.frames)
    ) {
      const initialBackground = this.scene.background;
      // eslint-disable-next-line unicorn/no-null
      this.scene.background = null;
      const initialOverrideMaterial = this.scene.overrideMaterial;
      this.scene.overrideMaterial = this.depthMaterial;

      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.shadowCamera);
      this.scene.overrideMaterial = initialOverrideMaterial;

      this.blurShadows(this.blur);
      if (this.smooth) {
        this.blurShadows(this.blur * 0.4);
      }

      // eslint-disable-next-line unicorn/no-null
      this.renderer.setRenderTarget(null);
      this.scene.background = initialBackground;
      this.count++;
    }
  }
}
