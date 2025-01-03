uniform sampler2D uTexture;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec4 textureColor = texture(uTexture, gl_PointCoord);
  // Final color
  gl_FragColor = vec4(uColor, textureColor.r);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  // Final size
}