/**
 * Holographic material by Anderson Mancini - Dec 2023.
 */
import {
  AdditiveBlending,
  BackSide,
  Clock,
  Color,
  DoubleSide,
  FrontSide,
  NormalBlending,
  ShaderMaterial,
  Uniform
} from 'three';

import Experience from '../../../experience.js';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

class HolographicMaterial extends ShaderMaterial {
  /**
   * Create a HolographicMaterial.
   *
   * @param {Object} parameters - The parameters to configure the material.
   * @param {number} [parameters.time=0.0] - The time uniform representing animation time.
   * @param {number} [parameters.fresnelOpacity=1.0] - The opacity for the fresnel effect.
   * @param {number} [parameters.fresnelAmount=1.0] - The strength of the fresnel effect.
   * @param {number} [parameters.scanlineSize=15.0] - The size of the scanline effect.
   * @param {number} [parameters.hologramBrightness=1.0] - The brightness of the hologram.
   * @param {number} [parameters.signalSpeed=1.0] - The speed of the signal effect.
   * @param {Color} [parameters.hologramColor=new Color('#00d5ff')] - The color of the hologram.
   * @param {boolean} [parameters.enableBlinking=true] - Enable/disable blinking effect.
   * @param {boolean} [parameters.blinkFresnelOnly=false] - Enable blinking only on the fresnel effect.
   * @param {number} [parameters.hologramOpacity=1.0] - The opacity of the hologram.
   * @param {number} [parameters.blendMode=NormalBlending] - The blending mode. Use `THREE.NormalBlending` or `THREE.AdditiveBlending`.
   * @param {number} [parameters.side=FrontSide] - The rendering side. Use `THREE.FrontSide`, `THREE.BackSide`, or `THREE.DoubleSide`.
   * @param {Boolean} [parameters.depthTest=true] - Enable or disable depthTest.
   */

  constructor(parameters = {}) {
    super();

    this.experience = new Experience();
    this.time = this.experience.time;

    this.vertexShader = vertexShader;

    this.fragmentShader = fragmentShader;

    // Set default values or modify existing properties if needed
    this.uniforms = {
      /**
       * The time uniform representing animation time.
       * @type {Uniform<number>}
       * @default 0.0
       */
      time: new Uniform(0),

      /**
       * The opacity for the fresnel effect.
       * @type {Uniform<number>}
       * @default 1.0
       */
      fresnelOpacity: new Uniform(
        parameters.fresnelOpacity === undefined ? 1 : parameters.fresnelOpacity
      ),

      /**
       * The strength of the fresnel effect.
       * @type {Uniform<number>}
       * @default 1.0
       */
      fresnelAmount: new Uniform(
        parameters.fresnelAmount === undefined ? 0.45 : parameters.fresnelAmount
      ),

      /**
       * The size of the scanline effect.
       * @type {Uniform<number>}
       * @default 1.0
       */
      scanlineSize: new Uniform(
        parameters.scanlineSize === undefined ? 15 : parameters.scanlineSize
      ),

      /**
       * The brightness of the hologram.
       * @type {Uniform<number>}
       * @default 1.0
       */
      hologramBrightness: new Uniform(
        parameters.hologramBrightness === undefined
          ? 1
          : parameters.hologramBrightness
      ),

      /**
       * The speed of the signal effect.
       * @type {Uniform<number>}
       * @default 1.0
       */
      signalSpeed: new Uniform(
        parameters.signalSpeed === undefined ? 1 : parameters.signalSpeed
      ),

      /**
       * The color of the hologram.
       * @type {Uniform<Color>}
       * @default new Color(0xFFFFFF)
       */
      hologramColor: new Uniform(
        parameters.hologramColor === undefined
          ? new Color('#258ed5')
          : new Color(parameters.hologramColor)
      ),

      /**
       * Enable/disable blinking effect.
       * @type {Uniform<boolean>}
       * @default true
       */
      enableBlinking: new Uniform(
        parameters.enableBlinking === undefined
          ? true
          : parameters.enableBlinking
      ),

      /**
       * Enable blinking only on the fresnel effect.
       * @type {Uniform<boolean>}
       * @default false
       */
      blinkFresnelOnly: new Uniform(
        parameters.blinkFresnelOnly === undefined
          ? true
          : parameters.blinkFresnelOnly
      ),

      /**
       * The opacity of the hologram.
       * @type {Uniform<number>}
       * @default 1.0
       */
      hologramOpacity: new Uniform(
        parameters.hologramOpacity === undefined
          ? 1
          : parameters.hologramOpacity
      )
    };

    this.clock = new Clock();
    this.setValues(parameters);
    this.depthTest =
      parameters.depthTest === undefined ? false : parameters.depthTest;
    this.blending =
      parameters.blendMode === undefined
        ? AdditiveBlending
        : parameters.blendMode;
    this.transparent = true;
    this.side = parameters.side === undefined ? FrontSide : parameters.side;
  }

  update() {
    this.uniforms.time.value = this.time.elapsed;
  }
}

export default HolographicMaterial;
