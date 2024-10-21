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
  // csm_DiffuseColor.rgb = vec3(colorMix);
  // csm_Roughness = step(0.5, vWobble)*0.3;
  // csm_Metalness = 0.5-csm_Roughness;
  // float thicknessMix = smoothstep(0.0, 0.35, vWobble);
  // csm_Thickness =thicknessMix;
}