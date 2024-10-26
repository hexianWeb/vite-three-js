varying vec2 vUv;
uniform sampler2D uState1;
uniform sampler2D uState2;
uniform float uProgress;
void main() {
  vec4 state1 = texture2D(uState1, vec2(vUv.x, 1.0-vUv.y));
  vec4 state2 = texture2D(uState2, vec2(vUv.x, 1.0-vUv.y));
  vec4 color = mix(state1, state2, uProgress);

float radius = 1.414;
  float dist = distance(vUv, vec2(0.5, 0.5));
  float outer_progress = clamp(1.1*uProgress, 0.0, 1.0);
  float inner_progress = clamp(1.1*uProgress-0.05, 0.0, 1.0);

  float innerCircle = 1.0-smoothstep((inner_progress-0.1)*radius, (inner_progress)*radius, dist);
  float outerCircle = 1.0-smoothstep((outer_progress-0.1)*radius, (outer_progress)*radius, dist);

  float displacement = outerCircle-innerCircle;
  float scale = mix(state1.r,state2.r,innerCircle);
  // gl_FragColor = color;
  gl_FragColor = vec4(vec3(displacement,scale,0.0), 1.0);
}