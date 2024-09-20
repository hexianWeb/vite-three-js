uniform sampler2D uPosition;
uniform float uTime;

varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 pos = texture2D(uPosition, uv);
  vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
  gl_PointSize = 10.0*(1. / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}