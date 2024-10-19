uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uNoiseFrequency;
uniform float uNoiseTimeFrequency;
uniform float uNoiseStrength;

uniform float uStrength;

attribute vec4 tangent;

varying vec2 vUv;
varying float vWobble;
#include ./simpleNoise4d.glsl

float getWobble(vec3 position) {
  vec3 noisePosition = position + snoise(vec4(position * uNoiseFrequency, uTime * uNoiseTimeFrequency)) * uNoiseStrength;

  return snoise(vec4(noisePosition*uPositionFrequency, uTime*uTimeFrequency))*uStrength;
}

void main() {
  vUv = uv;

  vec3 biTangent = normalize(cross(normal, tangent.xyz));

  float shift = 0.01;
  vec3 positionA = csm_Position + tangent.xyz * shift;
  vec3 positionB = csm_Position + biTangent * shift;

  float wobble = getWobble(csm_Position);
  vWobble = wobble/uStrength;
  csm_Position += wobble * normal;
  positionA += getWobble(positionA) * normal;
  positionB += getWobble(positionB) * normal;

  vec3 toA = normalize(positionA - csm_Position);
  vec3 toB = normalize(positionB - csm_Position);

  // 求出 AB 面的法向量
  vec3 normalAB = cross(toA, toB);

  csm_Normal = normalAB;

}