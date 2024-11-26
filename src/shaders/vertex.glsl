float random21(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 random2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float random31(vec3 co) {
    return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 126.7378))) * 43758.5453);
}

vec3 random3(vec3 c) {
    float j = 4096.0 * sin(dot(c, vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0 * j);
    j *= .125;
    r.x = fract(512.0 * j);
    j *= .125;
    r.y = fract(512.0 * j);
    return r - 0.5;
}

const float F3 = 0.3333333;
const float G3 = 0.1666667;

float noise3d(vec3 p) {
    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));

    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);

    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0 * G3;
    vec3 x3 = x - 1.0 + 3.0 * G3;

    vec4 w, d;

    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);

    w = max(0.6 - w, 0.0);

    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);

    w *= w;
    w *= w;
    d *= w;

    return dot(d, vec4(52.0));
}

float noise2d(in vec2 p) {
    const float K1 = 0.366025404; 
    const float K2 = 0.211324865; 
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0); 
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, random2(i + 0.0)), dot(b, random2(i + o)), dot(c, random2(i + 1.0)));
    return dot(n, vec3(70.0));
}

attribute vec3 color;

varying vec3 vPosition;
varying vec3 vInstanceColor;
varying vec3 vNormalW;

varying float vFresnel;
varying float randomNum04;

uniform float uTime;
uniform float uPercent;
uniform float uVmin;

#define PI 3.1415926535

void main() {
    vInstanceColor = color;
    vPosition = position;

    float randomNum01 = random21(vPosition.zz + vPosition.yx)-0.5;
    float randomNum02 = random21(vPosition.xx + vPosition.zy)-0.5;
    float randomNum03 = random21(vPosition.yy + vPosition.xz)-0.5;

    randomNum04 = random21(vPosition.zz + vPosition.xy)-0.5;
    
    vPosition = vPosition + vec3(randomNum01,randomNum02,randomNum03)*(1.-uPercent)*0.4;
    vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);

    float vMinSize = uVmin/100.;
    float wSize = vMinSize;

    vNormalW = normal;
    vec3 viewDirectionW = normalize(cameraPosition - position);
    vFresnel = dot(viewDirectionW, vNormalW);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(wSize * (1. / - mvPosition.z),0.,vMinSize/10.);
    // gl_PointSize = 10.;
}
