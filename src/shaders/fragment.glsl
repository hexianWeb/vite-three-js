#include <packing>

varying vec2 vUv;
uniform sampler2D depthTexture;
uniform float cameraNear;
uniform float cameraFar;

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {

  float depth = readDepth(depthTexture, vUv);

  // gl_FragColor.rgb = 1.0 - vec3(depth);
  // gl_FragColor.a = 1.0;
  // if(1.0 - depth < 0.01) {
  //   gl_FragColor.a = 0.0;
  // }
//  vec3 ghostlyGreen = vec3(0.2, 1.0, 0.3);

  // 计算竖直条纹的因子
  float stripe = mod(vUv.y * 60.0, 1.0);

  // 使用深度值作为混合因子，将颜色与鬼怪绿色混合
  // gl_FragColor.rgb = mix(vec3(0.902, 0.2941, 0.2941), ghostlyGreen, depth);
  vec3 ghostlyRed = vec3(1.0, 0.2275, 0.2);
  vec3 ghostlyGreen = vec3(0.2275, 1.0, 0.2);

  float toMix = smoothstep(0.0, 1.1, depth);
  // 使用深度值作为混合因子，将颜色与鬼怪绿色混合
  gl_FragColor.rgb = mix(ghostlyGreen, ghostlyRed, toMix);
  // gl_FragColor.rgb =vec3(1.0-depth);
  // 根据深度值控制透明度，深度越大透明度越高
  gl_FragColor.a = (1.0 - depth); // 当 depth 为 1.0 时 alpha 为 0.0，即完全透明
}