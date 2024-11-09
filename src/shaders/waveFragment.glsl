uniform float uProgress;
uniform vec3 uPrevColor;
uniform vec3 uNewColor;
uniform vec2 uResolution;
uniform float uTopDistance;

varying vec2 vUv;

#include './utils/noise.glsl'

float parabola(float x, float k) {
    return pow(4. * x * (1. - x), k);
}

void main() {
    vec2 customUv = gl_FragCoord.xy / uResolution.xy + 0.2;
    customUv.y *= uResolution.y / uResolution.x;
    float dt = parabola(uProgress, 1.);
    float noise = 0.5 * (cnoise(vec4(customUv.x * 100.0, customUv.y * 10.0, 0.5, 0.)) + 1.);
    float w = 0.7 * dt;
    float maskValue = smoothstep(1. - w, 1., customUv.y + mix(-w / 2., 1. - w / 2., uProgress));
    maskValue += maskValue * noise;
    float mask = step(1., maskValue);
    csm_DiffuseColor.rgb += mix(uPrevColor, uNewColor, mask);
}
