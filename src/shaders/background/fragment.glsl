uniform sampler2D uTexture;

varying vec2 vUv;
void main() {
    vec2 uv = vec2(1. - vUv.x, vUv.y);
    vec4 diffuseColor = vec4(texture2D(uTexture, uv).rgb, 1.);
    gl_FragColor = vec4(diffuseColor);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}