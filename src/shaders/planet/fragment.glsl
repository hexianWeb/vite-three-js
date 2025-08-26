// 星球片段着色器
uniform sampler2D uTexture;
uniform sampler2D uNormalMap;
uniform float uNormalScale;
uniform vec3 uAmbientLight;
uniform float uAmbientLightIntensity;
uniform vec3 uPointLightColor;
uniform float uPointLightIntensity;
uniform vec3 uPointLightPosition;
uniform float uRoughness;
uniform float uMetalness;

  
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// 计算切线空间到世界空间的法线
vec3 perturbNormal(vec3 normal, vec3 position, vec2 uv, sampler2D normalMap, float normalScale) {
  // 获取法线贴图的值
  vec3 normalMapColor = texture2D(normalMap, uv).rgb;
  vec3 normalMapNormal = normalize(normalMapColor * 2.0 - 1.0);
  
  // 计算切线和副切线
  vec3 q1 = dFdx(position);
  vec3 q2 = dFdy(position);
  vec2 st1 = dFdx(uv);
  vec2 st2 = dFdy(uv);
  
  vec3 tangent = normalize(q1 * st2.t - q2 * st1.t);
  vec3 bitangent = normalize(-q1 * st2.s + q2 * st1.s);
  
  // 构建TBN矩阵
  mat3 tbn = mat3(tangent, bitangent, normal);
  
  // 应用法线强度并转换到世界空间
  vec3 perturbedNormal = normalize(mix(normal, tbn * normalMapNormal, normalScale));
  
  return perturbedNormal;
}

void main() {
  // 获取纹理颜色
  vec3 textureColor = texture2D(uTexture, vUv).rgb;
  
  // 计算扰动后的法线向量
  vec3 normal = perturbNormal(normalize(vNormal), vPosition, vUv, uNormalMap, uNormalScale);
  
  // 环境光计算
  vec3 ambient = uAmbientLight * textureColor * uAmbientLightIntensity;
  
  // 点光源计算
  // 从顶点位置到光源位置的向量
  vec3 lightDirection = uPointLightPosition - vPosition;
  float distance = length(lightDirection);
  lightDirection = normalize(lightDirection);
  
  // 点光源衰减 (距离平方衰减)
  float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
  
  // 计算光照强度（兰伯特漫反射）
  float lightIntensity = max(dot(normal, lightDirection), 0.0);
  
  // 漫反射光
  vec3 diffuse = uPointLightColor * textureColor * lightIntensity * uPointLightIntensity * attenuation;
  
  // 简单的菲涅尔反射模拟
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);
  
  // 金属度和粗糙度影响
  vec3 metallic = mix(textureColor, vec3(1.0), uMetalness);
  float roughnessFactor = 1.0 - uRoughness;
  
  // 镜面反射（简化版）
  vec3 reflectDirection = reflect(-lightDirection, normal);
  float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 4.0 * roughnessFactor);
  vec3 specularColor = uPointLightColor * specular * metallic * fresnel * attenuation;
  
  // 最终颜色组合
  vec3 finalColor = ambient + diffuse + specularColor * 0.3;

  // 确保颜色在合理范围内
  finalColor = clamp(finalColor, 0.0, 1.0);
  gl_FragColor = vec4(finalColor, 1.0);
  
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
