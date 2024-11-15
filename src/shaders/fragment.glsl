uniform float time;
uniform float width;
uniform float uScaleX;
uniform float uScaleY;

uniform sampler2D uTexture1;
uniform sampler2D uTexture2;
uniform sampler2D displacement;
// Uniform variable for controlling the gradient transition
uniform float uProcess;

varying vec2 vUv;

#include ./utils/noise.glsl

float parabola(float x, float k) {
  return pow(4. * x * (1. - x), k);
}

void main() {
  float dt = parabola(uProcess, 1.);
  float border = 1.;
  vec2 newUV = (vUv - vec2(0.5)) *1. + vec2(0.5);
  vec4 color1 = texture2D(uTexture1, newUV);
  vec4 color2 = texture2D(uTexture2, newUV);
  float realnoise = 0.5 * (cnoise(vec4(newUV.x * uScaleX + 0. * time / 3., newUV.y * uScaleY, 0. * time / 3., 0.)) + 1.);

  float w = width * dt;

  float maskvalue = smoothstep(1. - w, 1., vUv.x + mix(-w / 2., 1. - w / 2., uProcess));
  float maskvalue0 = smoothstep(1., 1., vUv.x + uProcess);
  float mask = maskvalue + maskvalue * realnoise;
			// float mask = maskvalue;

  float final = smoothstep(border, border + 0.01, mask);

  gl_FragColor = mix(color1, color2, final);
  // float sweep = step(vUv.y, uProcess);
  // vec4 color = mix(color1, color2, sweep);
  // gl_FragColor = color;
}
