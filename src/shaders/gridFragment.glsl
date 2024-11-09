uniform float uProgress;
uniform vec3 uPrevColor;
uniform vec3 uNewColor;
uniform vec2 uResolution;

varying vec2 vUv;

float rand2(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

// 噪声函数2
float noise2(vec2 p, float range) {
    p *= range;
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);
    float a = rand2(ip);
    float b = rand2(ip + vec2(1.0, 0.0));
    float c = rand2(ip + vec2(0.0, 1.0));
    float d = rand2(ip + vec2(1.0, 1.0));
    float result = mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    return result * 0.5 + 0.5;
}

// 分型布朗
float fbm(vec2 p, int octaves) {
    float n = 0.0, a = 10.0, norm = 0.0;
    for(int i = 0; i < octaves; ++i) {
        n += noise2(p, 15.) * a;
        norm += a;
        p *= 2.0;
        a *= 0.5;
    }
    return n / norm;
}

// 简单的条纹模式函数
float stripePattern(vec2 p, float frequency) {
    return 0.5 + 0.5 * sin(p.x * frequency); // 横向条纹
}

void main() {
    vec2 customUv = gl_FragCoord.xy / uResolution.xy - 0.5;
    customUv.y *= uResolution.y / uResolution.x;
    float angle = atan(customUv.y, customUv.x);
    angle += fbm(customUv * 1.0, 2) * 0.5;
    vec2 pos = vec2(cos(angle), sin(angle));
    float easeProgress = uProgress * 0.5;
    easeProgress *= easeProgress * 2.;
    float length = dot(customUv / easeProgress, customUv / easeProgress);

    length -= (stripePattern(customUv * 4.0, 2.0) - 0.5); // 使用相同的条纹模式替代 FBM
    float ink = stripePattern(pos * 4.2, 7.0) + 1.75 - length; // 再次使用条纹模式
    vec3 col = mix(uPrevColor, uNewColor, clamp(0.0, 1.0, clamp(ink, 0.0, 1.0)));
    csm_DiffuseColor = vec4(vec3(col), 1.0);
}
