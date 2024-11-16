uniform float uTime;
uniform float uLeftLength;
uniform float uRightLength;
uniform float uXoffset;
uniform float uYoffset;
uniform float uSmoothMin;
uniform vec2 uResolution;
uniform sampler2D uMatcap;
uniform sampler2D uTexture;
uniform vec3 uCameraPosition;
uniform vec2 uMouse;
varying vec2 vUv;

// 罗德里格斯旋转
vec3 rotate(vec3 p, float angle, vec3 axis) {
  float c = cos(angle);
  float s = sin(angle);
    // 使用 Rodrigues' rotation formula
  return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

// IQ smooth min
float smoothmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

// 定义一个函数来计算扰动后的球体距离
float sdMovingSphere(vec3 p, vec3 offset, float radius, float timeFactor, float phase, float yOffset) {
  // 将时间周期化
  float loopTime = mod(uTime, 10.0); // 假设一个周期为10秒
  float timeOffset = sin(uTime * timeFactor + phase) * 0.1; // 基于周期化时间的扰动
  vec3 position = p + offset + vec3(timeOffset, yOffset, 0.0);
  return sdSphere(position, radius);
}

// 通用函数，用于生成屏幕左侧或右侧的球体
float sdfSideObject(vec3 p, bool isLeftSide) {
  float minDist = sdSphere(p, 0.0);
  float yOffset = mod(uTime, 10.0) * 0.01; // 控制Y轴上升速度，并周期化

  // 随机生成球体参数
  for(int i = 0; i < 10; i++) {
    float xOffsetBase = isLeftSide ? uLeftLength : uRightLength;
    vec3 randomOffset = vec3(xOffsetBase + fract(sin(float(i) * (isLeftSide ? 12.9898 : 23.456)) * 43758.5453) * uXoffset, // X轴偏移，集中在左侧或右侧
    fract(sin(float(i + 1) * (isLeftSide ? 78.233 : 67.890)) * 43758.5453) * uYoffset - 1.0, // Y轴偏移
    0.0 // Z轴固定为0
    );
    float randomRadius = 0.05 + fract(sin(float(i + 2) * (isLeftSide ? 39.3467 : 98.765)) * 43758.5453) * 0.1; // 随机半径
    float timeFactor = 0.5 + fract(sin(float(i + 3) * (isLeftSide ? 95.345 : 54.321)) * 43758.5453) * 0.5; // 随机时间因子
    float phase = fract(sin(float(i + 4) * (isLeftSide ? 62.453 : 12.345)) * 43758.5453) * 6.28318; // 随机相位

    float sphereDist = sdMovingSphere(p, randomOffset, randomRadius, timeFactor, phase, yOffset);
    minDist = smoothmin(minDist, sphereDist, uSmoothMin);
  }

  return minDist;
}

// 用于调用生成左侧或右侧的球体
float sdfObject(vec3 p) {
  float leftSideDist = sdfSideObject(p, true);  // 生成左侧球体
  float rightSideDist = sdfSideObject(p, false); // 生成右侧球体
  return min(leftSideDist, rightSideDist); // 返回两者中的最小距离
}

vec3 calcNormal(in vec3 p) // for function sdfObject(p)
{
  const float eps = 0.0001; // or some other value
  const vec2 h = vec2(eps, 0);
  return normalize(vec3(sdfObject(p + h.xyy) - sdfObject(p - h.xyy), sdfObject(p + h.yxy) - sdfObject(p - h.yxy), sdfObject(p + h.yyx) - sdfObject(p - h.yyx)));
}

vec2 matcapUV(vec3 normal) {
  // 将法线转换为 UV 坐标
  vec2 uv = vec2(atan(normal.z, normal.x) / (2.0 * 3.14159265) + 0.5, normal.y * 0.5 + 0.5);
  return uv;
}

void main() {
  vec3 ray = normalize(vec3((vUv - vec2(0.5)) * uResolution, -1.0));

  vec3 rayPos = uCameraPosition;
  // rayMarching
  float t = 0.;
  float tMax = 5.;
  for(float i = 0.0; i < 256.0; i++) {
    vec3 pos = rayPos + t * ray;
    float d = sdfObject(pos);
    if(d < 0.001 || t > tMax) {
      break;
    }
    t += d;
  }
  vec3 color = vec3(0.);
  // float color = 0.;
  if(t < tMax) {
    vec3 pos = rayPos + t * ray;
    vec3 normal = calcNormal(pos);
    vec3 light = normalize(vec3(0., 0., 0.9));

    // 计算 UV 坐标
    vec2 customUv = matcapUV(normal);
    // 从 matcap 纹理中采样颜色
    vec3 matcapColor = texture2D(uMatcap, customUv).rgb;

    // 计算视线方向
    vec3 viewDir = normalize(rayPos); // 视线方向
    float fresnelFactor = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0) * 4.; // 菲涅尔效应
    // 结合菲涅尔效应与材质颜色
    // color = fresnelFactor * vec3(1.0); // 将菲涅尔效应应用到材质颜色上
    // vec3 finalColor = fresnelFactor * matcapColor;
    // gl_FragColor = vec4(vec3(fresnelFactor), 1.0);
    // gl_FragColor = vec4(finalColor, 1.0);

    // 计算法线与光照方向的点积
    float lightIntensity = max(dot(normal, light), 0.0);

    // 计算边缘高亮
    float edgeHighlight = 1.0 - smoothstep(0.4, 0.9, lightIntensity); // 控制高亮范围
    // 保持球体内部颜色不变，并在边缘应用高亮
    color = mix(matcapColor, vec3(0.9137, 0.898, 0.898), edgeHighlight); // 使用插值实现高亮效果

    gl_FragColor = vec4(color, 1.0);
    gl_FragColor = sRGBTransferOETF( gl_FragColor );
  } else {
    gl_FragColor = vec4(vec3(0.0,0.0,0.0), 0.0);
  }
}