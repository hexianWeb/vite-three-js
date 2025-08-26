// 大气层片段着色器
uniform vec3 uPointLightPosition;
uniform vec3 uAtmosphereDayColor;
uniform vec3 uAtmosphereTwilightColor;
uniform float uAtmosphereIntensity;
uniform float uAtmosphereThickness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // 计算从大气层到光源的方向
  vec3 lightDirection = normalize(uPointLightPosition - vPosition);
  
  // 计算视角方向
  vec3 viewDirection = normalize(vPosition - cameraPosition);
  
  // 计算法线向量
  vec3 normal = normalize(vNormal);
  
  // 计算光照角度 (太阳高度角)
  float sunAngle = dot(normal, lightDirection);
  
  // 计算视角与法线的夹角 (大气厚度因子)
  float viewAngle = max(dot(normal, viewDirection), 0.0);

  // 边缘大气效果 (菲涅尔效应)
  float atmosphereStrength = pow(viewAngle, uAtmosphereThickness) * uAtmosphereIntensity;
  
//   根据太阳角度决定大气颜色
  vec3 atmosphereColor;
  float alpha = 0.0;
  
  if (sunAngle > 0.1) {
    // 白天：蓝色大气
    atmosphereColor = uAtmosphereDayColor;
    alpha = atmosphereStrength;
  } else if (sunAngle > -0.1) {
    // 黄昏：红色到蓝色的渐变
    float twilightFactor = (sunAngle + 0.1) / 0.2; // 从 -0.1 到 0.1 映射到 0 到 1
    atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, twilightFactor);
    alpha = atmosphereStrength;
  } else {
    // 夜晚：无大气效果
    atmosphereColor = vec3(0.0);
    alpha = 0.1;
  }
    // 输出最终颜色，使用 alpha 通道控制透明度
    gl_FragColor = vec4(atmosphereColor, atmosphereStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
