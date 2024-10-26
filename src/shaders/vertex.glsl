#include <packing>

uniform sampler2D depthTexture;
uniform float cameraNear;
uniform float cameraFar;

varying vec2 vUv;


float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void main() {
  vUv = uv;
  float depth = readDepth(depthTexture, vUv);
  vec3 pos = position;
  pos.z +=(1.0-depth);
  // pos.z += mix(1.0, (1.0 - depth) * 0.5, 0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}