varying vec2 vUv;
varying vec3 vColor;

void main() {
    // Diffuse point
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 10.0);

    // 使用高级混合算法
    vec3 color = mix(vec3(0.0), vColor, strength);
    // Final color
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}