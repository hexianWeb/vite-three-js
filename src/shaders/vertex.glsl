uniform sampler2D uPosition;
uniform float uTime;

varying vec2 vUv;
varying vec4 vColor;

void main() {
  vUv = uv;
  vec4 pos = texture2D(uPosition, uv);
  vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);

  float angle = atan(pos.y, pos.x);
  vColor = vec4(0.5+0.51*sin(uTime*0.85+angle));
  gl_PointSize = 2.0*(1. / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}