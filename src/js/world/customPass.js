import { Vector2 } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const DrunkShader = {
  uniforms: {
    tDiffuse: { value: null },
    frequency: { value: 2 },
    amplitude: { value: 0.1 },
    offset: { value: 0 }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float frequency;
    uniform float amplitude;
    uniform float offset;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      uv.y += sin(uv.x * frequency + offset) * amplitude;
      gl_FragColor = texture2D(tDiffuse, uv);
    }
  `
};

export default class CustomPass extends ShaderPass {
  constructor(options = {}) {
    super(DrunkShader);
    this.uniforms.frequency.value = options.frequency || 2;
    this.uniforms.amplitude.value = options.amplitude || 0.1;
  }
}
