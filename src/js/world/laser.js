import * as THREE from 'three';

import Experience from '../experience.js';

export default class Laser {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.debug = this.experience.debugger.ui;
    this.debugActive = this.experience.debugger.active;
    this.camera = this.experience.camera.instance;

    // 添加可调整的参数
    this.params = {
      innerRadius: 0.1,
      outerRadius: 8,
      width: 1,
      height: 1,
      positionX: 0,
      positionY: -3.7,
      positionZ: 0,
      color: '#258ed5', // 新增颜色参数
      angle: 65, // 新增角度参数
      segment: 1.5
    };

    this.setGeometry();
    this.setMaterial();
    this.setMesh();
    this.setGroup();

    this.debuggerInit();
  }

  setGeometry() {
    this.geometry = this.createGeometry();
  }

  createGeometry() {
    const { innerRadius, outerRadius, width, height, angle } = this.params;
    const halfAngle = THREE.MathUtils.degToRad(angle);
    const geometry = new THREE.PlaneGeometry(width, height, 72, 20);
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let index = 0; index < pos.count; index++) {
      let y = 1 - uv.getY(index);
      let radius = innerRadius + (outerRadius - innerRadius) * y;
      let x = pos.getX(index);
      pos.setXY(
        index,
        Math.cos(x * halfAngle) * radius,
        Math.sin(x * halfAngle) * radius
      );
    }
    geometry.rotateZ(Math.PI * 0.5);
    return geometry;
  }

  setMaterial() {
    this.uniforms = {
      time: { value: 0 },
      color: { value: new THREE.Color(this.params.color) }, // 使用颜色参数
      segment: { value: this.params.segment }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /*glsl*/ `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * modelViewPosition;
        }
      `,
      fragmentShader: /*glsl*/ `
        uniform float time;
        uniform float segment;
        uniform vec3 color;

        varying vec2 vUv;

        void main() {
          float t = time;
          float mainWave = sin((vUv.x - t * 0.2) * segment * 6.2831853) * 0.5 + 0.5;
          mainWave = mainWave * 0.25 + 0.25;
          mainWave *= (sin(t * 6.2831853 * 5.0) * 0.5 + 0.5) * 0.25 + 0.75;

          // 增加更多的 sideLines
          float sideLines = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
          float scanLineSin = abs(vUv.x - (sin(t * 2.7) * 0.5 + 0.5));
          float scanLine = smoothstep(0.01, 0.0, scanLineSin);
          float fadeOut = pow(vUv.y, 2.7);

          float a = 0.0;
          a = max(a, mainWave);
          a = max(a, sideLines);
          a = max(a, scanLine);

          // 使用 vUv.y 来控制颜色混合
          vec3 whiteColor = vec3(0.2,0.8,1.0);
          vec3 mixedColor = mix(whiteColor, color, vUv.y*1.5);
          // 只在 a > 0 时应用混合颜色
          vec3 finalColor = a > 0.0 ? mixedColor : color;
          gl_FragColor = vec4(finalColor, a * fadeOut);

        //   vec4 finalColor = vec4(color, a * fadeOut);
        //   gl_FragColor = finalColor;

          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  setGroup() {
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.updateGroupPosition();
    this.scene.add(this.group);
  }

  updateGroupPosition() {
    const { positionX, positionY, positionZ } = this.params;
    this.group.position.set(positionX, positionY, positionZ);
  }

  updateGeometry() {
    const newGeometry = this.createGeometry();
    this.mesh.geometry.dispose(); // 清理旧的几何体
    this.mesh.geometry = newGeometry;
  }

  update() {
    const t = this.time.elapsed;
    this.uniforms.time.value = t;

    // 更新 group 的朝向
    this.group.lookAt(this.camera.position);

    this.mesh.rotation.x =
      (Math.sin(t) * 0.5 + 0.5) * THREE.MathUtils.degToRad(10);
    // console.log(this.camera.position);
  }

  debuggerInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({
        title: 'Laser'
      });

      folder
        .addBinding(this.params, 'innerRadius', { min: 0.1, max: 5, step: 0.1 })
        .on('change', () => this.updateGeometry());
      folder
        .addBinding(this.params, 'outerRadius', { min: 5, max: 50, step: 1 })
        .on('change', () => this.updateGeometry());
      folder
        .addBinding(this.params, 'width', { min: 0.1, max: 5, step: 0.1 })
        .on('change', () => this.updateGeometry());
      folder
        .addBinding(this.params, 'height', { min: 0.1, max: 5, step: 0.1 })
        .on('change', () => this.updateGeometry());
      folder
        .addBinding(this.params, 'angle', { min: 1, max: 180, step: 1 })
        .on('change', () => this.updateGeometry());
      folder
        .addBinding(this.params, 'segment', { min: 0.1, max: 10, step: 0.1 })
        .on('change', ({ value }) => {
          this.material.uniforms.segment.value = value;
        });

      folder
        .addBinding(this.params, 'positionX', { min: -10, max: 10, step: 0.1 })
        .on('change', () => this.updateGroupPosition());
      folder
        .addBinding(this.params, 'positionY', { min: -10, max: 10, step: 0.1 })
        .on('change', () => this.updateGroupPosition());
      folder
        .addBinding(this.params, 'positionZ', { min: -10, max: 10, step: 0.1 })
        .on('change', () => this.updateGroupPosition());
      // 添加颜色选择器
      folder
        .addBinding(this.params, 'color', {
          view: 'color'
        })
        .on('change', ({ value }) => {
          this.uniforms.color.value.set(value); // 更新颜色
          this.material.color.set(value); // 更新材质颜色
        });
    }
  }
}
