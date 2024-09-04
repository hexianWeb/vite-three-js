uniform float uTime;
uniform float uProgress;
uniform float uRoundFrequency;
uniform float uHeight;

attribute float aRandom;
attribute vec3 aCenter;

varying vec2 vUv;
varying float vLocalProgress; // Pass localProgress to fragment shader

#include "./include/rotate-3d.glsl"

void main() {
  vUv = uv;

  // 规定先后变化顺序
  // float heightPercent = (position.y) / uHeight;
  float heightPercent = (position.x) / uHeight + 0.5;
  heightPercent = clamp(heightPercent, 0.0, 1.0);
  float localProgress = clamp((uProgress - heightPercent * 0.8) / 0.2, 0.0, 1.0);

  vLocalProgress = localProgress; // Pass the calculated localProgress to fragment shader

  // add some randomness to the position , 让 顶点沿着法线方向移动一定aRandom的距离
  // 分离 平移与线性变换
  csm_Position = (position - aCenter);

  csm_Position *= localProgress;

  csm_Position += normal * aRandom * (1.0- localProgress);

  csm_Position = csm_Position + aCenter;

  csm_Position = rotate(csm_Position, vec3(0.0, 1.0, 0.0), (1.0 - localProgress) * PI * uRoundFrequency);
  // csm_Position = csm_PositionRaw.xyz;
  // gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}