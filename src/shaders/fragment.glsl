varying float vLocalProgress; // Receive localProgress from vertex shader
varying vec2 vUv;

void main() {
  // If localProgress is less than 0.1, discard the fragment
  // if (vLocalProgress < 0.01) {
  //   discard;
  // }
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}