float random21(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

uniform float uTime;
uniform float uPercent;
uniform float uVmin;

attribute vec3 color;

varying vec3 vPosition;
varying vec3 vNormalW;

varying float vFresnel;
varying float randomNum04;



#define PI 3.1415926535

void main() {
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
    gl_PointSize = clamp(wSize * (1. / - mvPosition.z),0.,vMinSize/8.2);
}
