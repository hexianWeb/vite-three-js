varying float vFresnel;
varying float randomNum04;

uniform vec3 uColor0;
uniform float uColor0Intensity;
uniform vec3 uColor1;
uniform float uColor1Intensity;
uniform float uPercent;
uniform float uTime;

#define PI 3.1415926535

void main() {
  float dis = distance(gl_PointCoord, vec2(0.5));

  float op = 0.5;
  if(dis > op)
    discard;

  if(uPercent < randomNum04 + 0.6)
    discard;

  vec3 color0 = uColor0 * uColor0Intensity;
  vec3 color1 = uColor1 * uColor1Intensity;

  vec3 color = mix(color0, color1, vec3(sqrt(abs(vFresnel))));

  gl_FragColor = vec4(color, 1.);
}
