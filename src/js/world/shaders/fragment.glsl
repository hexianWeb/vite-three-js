uniform sampler2D texture360;
uniform sampler2D textureEarth;
uniform float uProgress;

varying vec2 vUv;

vec2 distort(vec2 oldUv, float progress, float explosion) {
    vec2 normalizeUv = 2.*oldUv - 1.;
    vec2 newUv = normalizeUv / (1.0- progress * length(normalizeUv)*explosion);
    return newUv * 0.5 + 0.5;
}

void main() {
  float progress1 = smoothstep(0.75,1.0,uProgress);

  vec2 uv1 = distort(vUv, -10.*pow(0.5+0.5*uProgress,32.),uProgress*4.0);
  vec2 uv2 = distort(vUv, -10.*(1.0-progress1),uProgress*4.0);
  vec4 colorEarth = texture2D(textureEarth, uv1);
  vec4 color360 = texture2D(texture360, uv2);
  float mixValue = progress1;

  vec4 color = mix(colorEarth,color360, mixValue);
   gl_FragColor = color;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}