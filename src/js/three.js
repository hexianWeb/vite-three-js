import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  add,
  cameraPosition,
  cameraProjectionMatrix,
  cameraViewMatrix,
  color,
  Fn,
  fog,
  mul,
  normalize,
  normalWorld,
  positionLocal,
  positionWorld,
  rangeFogFactor,
  refract,
  screenUV,
  sin,
  sub,
  texture,
  thickness,
  time,
  uniform,
  uv,
  vec2,
  vec3,
  vec4
} from 'three/tsl';
import * as THREE from 'three/webgpu';

const device = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: window.devicePixelRatio
};

export default class Three {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      device.width / device.height,
      0.1,
      500
    );
    this.camera.position.set(0, 0, 4.5);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      forceWebGL: false
    });
    this.renderer.setSize(device.width, device.height);
    this.renderer.setPixelRatio(Math.min(device.pixelRatio, 2));

    // RTT
    this.bgScene = new THREE.RenderTarget(device.width, device.height);

    this.controls = new OrbitControls(this.camera, this.canvas);

    this.clock = new THREE.Clock();

    this.loader = new GLTFLoader();

    this.setLights();
    this.setObject();
    this.render();
    this.setResize();
  }

  setLights() {
    this.ambientLight = new THREE.AmbientLight(new THREE.Color(1, 1, 1, 1));
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(
      new THREE.Color(1, 1, 1, 1),
      1
    );
    this.directionalLight.position.set(0.5, 0, 0.866);
    this.scene.add(this.directionalLight);
  }

  setObject() {
    let sphere = new THREE.Mesh(
      new THREE.SphereGeometry(2, 32, 32),
      new THREE.MeshPhysicalNodeMaterial({
        color: new THREE.Color(1, 0, 0),
        roughness: 0.5,
        metalness: 0,
        clearcoat: 1
      })
    );
    sphere.position.set(0, 0, 0);
    this.scene.add(sphere);

    // glass Wall
    this.glassWallGroup = new THREE.Group();
    this.glassWallGroup.position.set(0, 0, 2);
    this.scene.add(this.glassWallGroup);

    this.glassMaterial = new THREE.NodeMaterial();
    this.glassMaterial.colorNode = Fn(() => {
      const eyeVector = normalize(cameraPosition.sub(positionWorld));
      const iorRatio = 1 / 1.31;
      const refractedVector = refract(
        eyeVector.negate(),
        normalize(normalWorld),
        iorRatio
      );

      const refractedRayExit = positionWorld.add(mul(refractedVector, 0.3));

      const ndcPos = cameraProjectionMatrix.mul(
        cameraViewMatrix.mul(vec4(refractedRayExit, 1))
      );

      const refractCoords = vec2(ndcPos.xy.div(ndcPos.w)).toVar();

      refractCoords.addAssign(1);
      refractCoords.divAssign(2);
      refractCoords.assign(vec2(refractCoords.x, refractCoords.y.oneMinus()));
      return texture(this.bgScene.texture, refractCoords);
    })();

    this.glassMaterial2 = new THREE.MeshPhysicalNodeMaterial({
      color: '#ffffff',
      roughness: 0.1,
      metalness: 0,
      transmission: 1,
      thickness: 0.1,
      dispersion: 3,
      ior: 1.31
    });
    let thick = 0.05;
    const geometry = new THREE.CylinderGeometry(thick, thick, 4, 128, 32);
    for (let index = 0; index < 100; index++) {
      let glassColumn = new THREE.Mesh(geometry, this.glassMaterial);
      // X轴排放
      glassColumn.position.x = (index - 50) * thick * 2;
      this.glassWallGroup.add(glassColumn);
    }
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.glassWallGroup.visible = false;
    this.renderer.setRenderTarget(this.bgScene);
    this.renderer.renderAsync(this.scene, this.camera);
    this.glassWallGroup.visible = true;
    this.renderer.setRenderTarget(null);
    this.renderer.renderAsync(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
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
  }
}
