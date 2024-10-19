uniform vec3 uColor;
uniform vec3 colorA;
uniform vec3 colorB;

varying float vWobble;
varying vec2 vUv;

void main() {
  // 对 vwobble 重映射
  float colorMix =  smoothstep(-1.0, 1.0, vWobble);
  vec3 mixColor = mix(colorA, colorB, colorMix);
  csm_DiffuseColor.rgb = mixColor;

  csm_Roughness = 1.0- colorMix;
}