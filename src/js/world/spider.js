import {
  abs,
  color,
  float,
  Fn,
  If,
  mix,
  normalWorld,
  output,
  rotate,
  screenCoordinate,
  screenSize,
  screenUV,
  step,
  uniform,
  vec3,
  vec4
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import Center from '../components/center.js';
import Experience from '../experience.js';

export default class Model {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;
    this.debug = this.experience.debug.ui;
    this.debugActive = this.experience.debug.active;

    this.center = new Center();

    // halftone settings
    this.halftoneSettings = [
      {
        count: 140,
        color: '#cd0015',
        direction: new THREE.Vector3(-1, 0, 0),
        radius: 0.8,
        end: -0.8,
        start: 1.5
      },
      {
        count: 100,
        color: '#000',
        direction: new THREE.Vector3(1, 0, 0),
        radius: 0.8,
        end: -0.8,
        start: 1.5
      }
    ];
    this.uniforms1 = {
      count: uniform(this.halftoneSettings[0].count),
      color: uniform(color(this.halftoneSettings[0].color)),
      direction: uniform(this.halftoneSettings[0].direction),
      radius: uniform(this.halftoneSettings[0].radius),
      end: uniform(this.halftoneSettings[0].end),
      start: uniform(this.halftoneSettings[0].start),
      flag: uniform(1)
    };

    this.uniforms2 = {
      count: uniform(this.halftoneSettings[1].count),
      color: uniform(color(this.halftoneSettings[1].color)),
      direction: uniform(this.halftoneSettings[1].direction),
      radius: uniform(this.halftoneSettings[1].radius),
      end: uniform(this.halftoneSettings[1].end),
      start: uniform(this.halftoneSettings[1].start),
      flag: uniform(0)
    };

    this.uniformsArray = [this.uniforms1, this.uniforms2];
    // halftone func
    const halftone = Fn(([count, color, direction, radius, end, start]) => {
      let gridUV = screenCoordinate.xy.div(screenSize.yy).mul(count);
      gridUV = rotate(gridUV, Math.PI / 4).mod(1);

      const strength = normalWorld
        .dot(direction.normalize())
        .remapClamp(end, start);

      const mask = gridUV.sub(0.5).length().step(strength.mul(0.5).mul(radius));
      // const mask = step(0.5, gridUV.sub(0.5).length()).mul(-1).add(1);
      return vec4(vec3(mask), mask.mul(0.8));
    });

    // halftones func
    const halftones = Fn(([input]) => {
      const halftonesOutput = input;

      const halftoneOutput = halftone(
        this.uniforms1.count,
        color(this.uniforms1.color),
        this.uniforms1.direction,
        this.uniforms1.radius,
        this.uniforms1.end,
        this.uniforms1.start
      );
      halftonesOutput.rgb.assign(
        mix(halftonesOutput.rgb, halftoneOutput.rgb, step(0.5, screenUV.x))
      );
      return halftonesOutput;
    });
    this.resources.on('ready', () => {
      const model = this.resources.items['spiderMan'].scene.children[0];

      // TSL add material
      model.traverse((child) => {
        if (child.isMesh) {
          child.material.outputNode = halftones(output);
        }
      });
      this.center.add(model);
      model.scale.set(3, 3, 3);
    });
    this.debuggerInit();
  }

  update() {}

  debuggerInit() {
    if (this.debugActive) {
      const folder = this.debug.addFolder({
        title: 'Spider Man'
      });
      folder.addBinding(this.uniforms1.count, 'value', {
        min: 20,
        max: 200,
        step: 1,
        label: 'count'
      });
      folder.addBinding(this.uniforms1.color, 'value', {
        color: { type: 'float' },
        label: 'color'
      });
      folder.addBinding(this.uniforms1.direction, 'value', {
        label: 'direction'
      });
      folder.addBinding(this.uniforms1.radius, 'value', {
        min: 0.1,
        max: 3,
        step: 0.1,
        label: 'radius'
      });

      folder.addBinding(this.uniforms1.end, 'value', {
        min: -1,
        max: 1,
        step: 0.01,
        label: 'end'
      });
      folder.addBinding(this.uniforms1.start, 'value', {
        min: -1,
        max: 3,
        step: 0.01,
        label: 'start'
      });

      folder.addBinding(this.uniforms2.count, 'value', {
        min: 20,
        max: 200,
        step: 1,
        label: 'count'
      });
      folder.addBinding(this.uniforms2.color, 'value', {
        color: { type: 'float' },
        label: 'color'
      });
      folder.addBinding(this.uniforms2.direction, 'value', {
        label: 'direction'
      });
      folder.addBinding(this.uniforms2.radius, 'value', {
        min: 0.1,
        max: 3,
        step: 0.1,
        label: 'radius'
      });

      folder.addBinding(this.uniforms2.end, 'value', {
        min: -1,
        max: 1,
        step: 0.01,
        label: 'end'
      });
      folder.addBinding(this.uniforms2.start, 'value', {
        min: -1,
        max: 3,
        step: 0.01,
        label: 'start'
      });
    }
  }
}
