import * as THREE from 'three';
// eslint-disable-next-line import/no-unresolved
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OBJLoader } from 'three/examples/jsm/Addons.js';

import fragment from '../shaders/fragment.glsl';
import vertex from '../shaders/vertex.glsl';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

class Sparkle extends THREE.Vector3 {
  setup(origin, color) {
    this.x = origin.x;
    this.y = origin.y;
    this.z = origin.z;
    this.v = new THREE.Vector3();
    /* X Speed */
    this.v.x = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.x *= Math.random() > 0.5 ? 1 : -1;
    /* Y Speed */
    this.v.y = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.y *= Math.random() > 0.5 ? 1 : -1;
    /* Z Speed */
    this.v.z = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.z *= Math.random() > 0.5 ? 1 : -1;

    this.size = Math.random() * 4 + 0.5 * device.pixelRatio;
    this.slowDown = 0.4 + Math.random() * 0.58;
    this.color = color;
  }
  update() {
    if (this.v.x > 0.001 || this.v.y > 0.001 || this.v.z > 0.001) {
      this.add(this.v);
      this.v.multiplyScalar(this.slowDown);
    }
  }
}

class Star {
  setup(color) {
    this.r = Math.random() * 12 + 3;
    this.phi = Math.random() * Math.PI * 2;
    this.theta = Math.random() * Math.PI;
    this.v = new THREE.Vector2().random().subScalar(0.5).multiplyScalar(0.0007);

    this.x = this.r * Math.sin(this.phi) * Math.sin(this.theta);
    this.y = this.r * Math.cos(this.phi);
    this.z = this.r * Math.sin(this.phi) * Math.cos(this.theta);

    this.size = Math.random() * 4 + 0.5 * device.pixelRatio;
    this.color = color;
  }
  update() {
    this.phi += this.v.x;
    this.theta += this.v.y;
    this.x = this.r * Math.sin(this.phi) * Math.sin(this.theta);
    this.y = this.r * Math.cos(this.phi);
    this.z = this.r * Math.sin(this.phi) * Math.cos(this.theta);
  }
}

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      device.width / device.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 8);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: false
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.previous = new THREE.Vector3();
    this.lines = [];
    this.sparkles = [];
    this.stars = [];

    this.previousTimeStamp = 0;

    this.linesMaterials = [
      new THREE.LineBasicMaterial({
        transparent: true,
        color: 0x12_5D_98
      }),
      new THREE.LineBasicMaterial({
        transparent: true,
        color: 0xCF_D6_DE
      })
    ];
    this.galaxyColors = [
      new THREE.Color('#f9fbf2').multiplyScalar(0.8),
      new THREE.Color('#ffede1').multiplyScalar(0.8),
      new THREE.Color('#05c7f2').multiplyScalar(0.8),
      new THREE.Color('#0597f2').multiplyScalar(0.8),
      new THREE.Color('#0476d9').multiplyScalar(0.8)
    ];

    this.setLights();
    this.setPoints();
    this.setStar();
    this.loadModel();
    this.setupPostProcessing();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);
  }

  setPoints() {
    this.sparklesGeometry = new THREE.BufferGeometry();
    this.sparklesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: {
          value: new THREE.TextureLoader().load('./dotTexture.png')
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      blending: THREE.AdditiveBlending,
      alphaTest: 1,
      transparent: true
    });
    const points = new THREE.Points(
      this.sparklesGeometry,
      this.sparklesMaterial
    );
    this.group.add(points);
  }

  setStar() {
    const galaxyGeometryColors = [];
    const galaxyGeometrySizes = [];

    for (let index = 0; index < 1500; index++) {
      const star = new Star();
      star.setup(
        this.galaxyColors[Math.floor(Math.random() * this.galaxyColors.length)]
      );
      galaxyGeometryColors.push(star.color.r, star.color.g, star.color.b);
      galaxyGeometrySizes.push(star.size);
      this.stars.push(star);
    }
    this.starsGeometry = new THREE.BufferGeometry();
    this.starsGeometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(galaxyGeometrySizes, 1)
    );
    // this.starsGeometry.setAttribute(
    //   'position',
    //   new THREE.Float32BufferAttribute(galaxyGeometryVertices, 3)
    // );
    this.starsGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(galaxyGeometryColors, 3)
    );
    this.galaxyPoints = new THREE.Points(
      this.starsGeometry,
      this.sparklesMaterial
    );
    console.log(this.galaxyPoints);

    this.scene.add(this.galaxyPoints);
  }

  loadModel() {
    const loader = new OBJLoader();
    loader.load('/Whale_Model.obj', (object) => {
      this.whale = object.children[0];
      this.whale.geometry.scale(0.3, 0.3, 0.3);
      this.whale.geometry.translate(0, -2, 0);
      this.whale.geometry.rotateY(0.2);
      this._dots();
    });
  }

  setupPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);

    this.composer = new EffectComposer(this.renderer);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(device.width, device.height),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = 0;
    bloomPass.strength = 0.8;

    this.composer.setPixelRatio(device.pixelRatio);
    this.composer.setSize(device.width, device.height);
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
  }

  render(timeStamp) {
    requestAnimationFrame(this.render.bind(this));

    this.galaxyPoints.rotation.y += 0.0005;

    this.group.rotation.x = Math.sin(timeStamp * 0.0003) * 0.1;
    this.group.rotation.y += 0.001;

    if (timeStamp - this.previousTimeStamp > 30) {
      for (const l of this.lines) {
        if (this.sparkles.length < 35_000) {
          this._nextDot(l);
          this._nextDot(l);
        }
        const temporaryVertices = new Float32Array(l.coordinates);
        l.geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(temporaryVertices, 3)
        );
      }
      this._updateSparklesGeometry();
      this.previousTimeStamp = timeStamp;
    }
    let temporarySparklesArray = [];
    for (const s of this.sparkles) {
      s.update();
      temporarySparklesArray.push(s.x, s.y, s.z);
    }

    this.sparklesGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(temporarySparklesArray, 3)
    );

    let temporaryStarsArray = [];
    for (const star of this.stars) {
      star.update();
      temporaryStarsArray.push(star.x, star.y, star.z);
    }

    this.starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(temporaryStarsArray, 3)
    );
    this.composer.render();
  }

  _dots() {
    this.sampler = new MeshSurfaceSampler(this.whale).build();

    for (let index = 0; index < 6; index++) {
      const linesMesh = new THREE.Line(
        new THREE.BufferGeometry(),
        this.linesMaterials[index % 2]
      );
      linesMesh.coordinates = [];
      linesMesh.previous = undefined;
      this.lines.push(linesMesh);
      this.group.add(linesMesh);
    }
    // requestAnimationFrame(this.render.bind(this));
  }

  _nextDot(line) {
    let ok = false;
    while (!ok) {
      this.sampler.sample(this.previous);
      if (line.previous && this.previous.distanceTo(line.previous) < 0.3) {
        line.coordinates.push(
          this.previous.x,
          this.previous.y,
          this.previous.z
        );
        line.previous = this.previous.clone();

        for (let index = 0; index < 2; index++) {
          const spark = new Sparkle();
          spark.setup(this.previous, line.material.color);
          this.sparkles.push(spark);
        }
        ok = true;
      } else if (!line.previous) {
        line.previous = this.previous.clone();
      }
    }
  }
  _updateSparklesGeometry() {
    let temporarySparklesArraySizes = [];
    let temporarySparklesArrayColors = [];
    for (const s of this.sparkles) {
      temporarySparklesArraySizes.push(s.size);
      temporarySparklesArrayColors.push(s.color.r, s.color.g, s.color.b);
    }
    this.sparklesGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(temporarySparklesArrayColors, 3)
    );
    this.sparklesGeometry.setAttribute(
      'size',
      new THREE.Float32BufferAttribute(temporarySparklesArraySizes, 1)
    );
  }
  setResize() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    device.width = window.innerWidth;
    device.height = window.innerHeight;

    this.camera.aspect = device.width / device.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    this.composer.setSize(device.width, device.height);
    this.composer.setPixelRatio(device.pixelRatio);
  }
}
